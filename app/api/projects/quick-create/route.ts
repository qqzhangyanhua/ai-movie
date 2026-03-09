import { NextResponse } from "next/server";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import {
  checkVideoQuota,
  deductVideoQuota,
  refundVideoQuota,
} from "@/lib/actions/quota";
import { enqueueQuickCreatePipeline } from "@/lib/tasks/quick-create-pipeline";

function toOptionalString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const formData = await req.formData();
    const title = toOptionalString(formData.get("title"));
    const description = toOptionalString(formData.get("description"));
    const photos = formData
      .getAll("photos")
      .filter((item): item is File => item instanceof File && item.size > 0);

    if (!title) {
      return NextResponse.json({ error: "title 为必填字段" }, { status: 400 });
    }

    if (photos.length === 0) {
      return NextResponse.json(
        { error: "photos 至少需要上传 1 张图片" },
        { status: 400 }
      );
    }

    const quota = await checkVideoQuota(userId);
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: "视频额度不足，请升级会员或等待下月重置",
          remaining: quota.remaining,
        },
        { status: 403 }
      );
    }

    const photoUrls = await saveUploadedPhotos(userId, photos);

    const project = await prisma.project.create({
      data: {
        userId,
        title,
        description,
        coverUrl: photoUrls[0] ?? null,
        status: "GENERATING",
      },
      select: { id: true },
    });

    const quotaResult = await deductVideoQuota(userId);
    if (!quotaResult.success) {
      await cleanupQuickCreate(project.id, photoUrls);
      return NextResponse.json(
        { error: quotaResult.error ?? "视频额度不足" },
        { status: 403 }
      );
    }

    try {
      await enqueueQuickCreatePipeline(project.id, userId, {
        title,
        description,
        prompt: description ? `${title}\n${description}` : title,
        photoUrls,
      });
    } catch (error) {
      await refundVideoQuota(userId);
      await cleanupQuickCreate(project.id, photoUrls);
      throw error;
    }

    return NextResponse.json(
      { projectId: project.id, jobId: project.id, status: "QUEUED" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Quick create error:", error);
    return NextResponse.json(
      { error: "创建项目失败，请稍后重试" },
      { status: 500 }
    );
  }
}

async function saveUploadedPhotos(userId: string, photos: File[]) {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "quick-create");
  await mkdir(uploadDir, { recursive: true });

  return Promise.all(
    photos.map(async (photo, index) => {
      const bytes = await photo.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const safeName = photo.name.replace(/[^a-zA-Z0-9.-]/g, "-");
      const fileName = `${Date.now()}-${index}-${userId}-${safeName}`;
      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);
      return `/uploads/quick-create/${fileName}`;
    })
  );
}

async function cleanupQuickCreate(projectId: string, photoUrls: string[]) {
  await prisma.project.delete({ where: { id: projectId } }).catch(() => undefined);

  await Promise.all(
    photoUrls.map(async (photoUrl) => {
      const relativePath = photoUrl.replace(/^\/+/, "").replace(/\//g, path.sep);
      const absolutePath = path.join(process.cwd(), "public", relativePath);
      await unlink(absolutePath).catch(() => undefined);
    })
  );
}
