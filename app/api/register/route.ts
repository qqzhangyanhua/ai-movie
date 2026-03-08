import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "输入无效", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "该邮箱已注册" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    const user = await prisma.user.create({
      data: {
        username: parsed.data.username,
        email: parsed.data.email,
        passwordHash,
      },
    });

    return NextResponse.json(
      { id: user.id, email: user.email, username: user.username },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
