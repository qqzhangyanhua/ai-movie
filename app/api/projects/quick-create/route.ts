import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { checkVideoQuota } from "@/lib/actions/quota";
import { executeQuickCreatePipeline } from "@/lib/tasks/quick-create-pipeline";

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

    const project = await prisma.project.create({
      data: {
        userId,
        title,
        description,
        status: "DRAFT",
      },
      select: { id: true },
    });

    void executeQuickCreatePipeline(project.id);

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
