# AI 微电影平台 - 完全重写实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 完全重写 AI 微电影平台，从零搭建 Next.js 15 全栈项目 + Python AI Worker，实现 PRD 定义的六大模块。

**Architecture:** Next.js 15 App Router 处理前端渲染和 CRUD API，Prisma ORM 连接 PostgreSQL，Auth.js v5 处理认证。BullMQ 将 AI 任务通过 Redis 派发给 Python Worker，Worker 调用各类 AI 模型并用 FFmpeg 合成视频。SSE 实时推送任务进度。

**Tech Stack:** Next.js 15, React 19, TypeScript, Prisma, Auth.js v5, BullMQ, Tailwind CSS v4, shadcn/ui, Zustand, Vitest, Playwright, Python 3.11+, redis-py, FFmpeg, Docker

---

## Phase 1: 基础设施 + 核心创作流程 (P0)

> 目标：从零搭建项目，实现完整的 角色→剧本→分镜→视频→结果 创作流程。
> 预估：40 个任务，约 3-5 天。

---

### Task 1: 清理旧代码，初始化 Next.js 项目

**Files:**
- Delete: `frontend/` (entire directory)
- Delete: `backend/` (entire directory)
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `.env.local`

**Step 1: 删除旧的前后端目录**

```bash
rm -rf frontend backend
```

**Step 2: 初始化 Next.js 15 项目（在根目录）**

```bash
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-pnpm --turbopack
```

> 注意：由于根目录已有文件，可能需要确认覆盖。如果报错，先在临时目录创建再移动回来。

**Step 3: 验证项目能启动**

Run: `pnpm dev`
Expected: 浏览器打开 http://localhost:3000 看到 Next.js 默认页面

**Step 4: 创建 `.env.local` 配置文件**

```env
# Database
DATABASE_URL="postgresql://aimovie:aimovie_secret@localhost:5432/aimovie"

# Auth
AUTH_SECRET="generate-a-random-32-char-secret-here"
AUTH_URL="http://localhost:3000"

# Redis
REDIS_URL="redis://localhost:6379/0"

# S3 Storage (MinIO for local dev)
S3_ENDPOINT="http://localhost:9000"
S3_BUCKET="aimovie"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_REGION="us-east-1"

# AI Services (Python Worker)
OPENAI_API_KEY=""
```

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: 清理旧代码，初始化 Next.js 15 项目"
```

---

### Task 2: 安装核心依赖

**Files:**
- Modify: `package.json`

**Step 1: 安装生产依赖**

```bash
pnpm add prisma @prisma/client next-auth@beta @auth/prisma-adapter bullmq ioredis zustand @aws-sdk/client-s3 @aws-sdk/s3-request-presigner lucide-react clsx tailwind-merge class-variance-authority zod
```

**Step 2: 安装开发依赖**

```bash
pnpm add -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom @types/node
```

**Step 3: 验证安装成功**

Run: `pnpm dev`
Expected: 项目正常启动，无依赖报错

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: 安装核心依赖（Prisma, Auth.js, BullMQ, shadcn/ui 等）"
```

---

### Task 3: 配置 shadcn/ui 组件库

**Files:**
- Create: `components.json`
- Create: `lib/utils.ts`

**Step 1: 初始化 shadcn/ui**

```bash
pnpm dlx shadcn@latest init
```

选择配置：
- Style: New York
- Base color: Neutral
- CSS variables: Yes

**Step 2: 安装常用基础组件**

```bash
pnpm dlx shadcn@latest add button input label card dialog tabs toast skeleton avatar dropdown-menu separator progress badge textarea select
```

**Step 3: 验证组件可用**

在 `app/page.tsx` 中临时引入 `<Button>` 验证渲染正常。

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: 初始化 shadcn/ui 组件库，安装基础组件"
```

---

### Task 4: Prisma Schema + 数据库迁移

**Files:**
- Create: `prisma/schema.prisma`
- Create: `lib/prisma.ts`

**Step 1: 初始化 Prisma**

```bash
pnpm prisma init
```

**Step 2: 编写完整 Schema**

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Plan {
  FREE
  MONTHLY
  YEARLY
}

enum ProjectStatus {
  DRAFT
  SCRIPT_READY
  STORYBOARD_READY
  GENERATING
  COMPLETED
  FAILED
}

enum ScriptType {
  TEMPLATE
  AI_GENERATED
  CUSTOM
}

enum TaskStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  username      String
  passwordHash  String
  plan          Plan      @default(FREE)
  avatarUrl     String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  projects      Project[]
  characters    Character[]
  accounts      Account[]
  sessions      Session[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Project {
  id          String        @id @default(cuid())
  userId      String
  title       String
  description String?
  status      ProjectStatus @default(DRAFT)
  coverUrl    String?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  user        User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  characters  ProjectCharacter[]
  script      Script?
  storyboards Storyboard[]
  videos      Video[]
}

model Character {
  id            String    @id @default(cuid())
  userId        String
  name          String
  photoUrl      String
  frontViewUrl  String?
  sideViewUrl   String?
  backViewUrl   String?
  embedding     Bytes?
  personality   String?
  style         String?
  createdAt     DateTime  @default(now())

  user          User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  projects      ProjectCharacter[]
}

model ProjectCharacter {
  id           String    @id @default(cuid())
  projectId    String
  characterId  String
  relationship String?
  roleName     String?

  project      Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  character    Character @relation(fields: [characterId], references: [id], onDelete: Cascade)

  @@unique([projectId, characterId])
}

model Script {
  id          String     @id @default(cuid())
  projectId   String     @unique
  type        ScriptType
  content     Json
  metadata    Json?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  project     Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

model Storyboard {
  id           String    @id @default(cuid())
  projectId    String
  sceneNumber  Int
  description  String
  characters   String[]
  action       String?
  cameraType   String?
  duration     Int       @default(5)
  imageUrl     String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  project      Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  videoClip    VideoClip?
}

model VideoClip {
  id            String     @id @default(cuid())
  storyboardId  String     @unique
  videoUrl      String?
  status        TaskStatus @default(PENDING)
  progress      Int        @default(0)
  errorMessage  String?
  createdAt     DateTime   @default(now())

  storyboard    Storyboard @relation(fields: [storyboardId], references: [id], onDelete: Cascade)
}

model Video {
  id            String     @id @default(cuid())
  projectId     String
  videoUrl      String?
  posterUrl     String?
  duration      Int?
  resolution    String?
  status        TaskStatus @default(PENDING)
  progress      Int        @default(0)
  subtitleUrl   String?
  bgmUrl        String?
  voiceoverUrl  String?
  errorMessage  String?
  createdAt     DateTime   @default(now())

  project       Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
}
```

**Step 3: 创建 Prisma Client 单例**

```typescript
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**Step 4: 运行迁移**

```bash
pnpm prisma migrate dev --name init
```

Expected: 迁移成功，数据库表创建完成

**Step 5: 生成 Prisma Client**

```bash
pnpm prisma generate
```

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: 添加 Prisma Schema 完整数据模型（8 表），运行初始迁移"
```

---

### Task 5: 配置 Auth.js v5 认证

**Files:**
- Create: `lib/auth.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`
- Create: `middleware.ts`
- Create: `types/next-auth.d.ts`

**Step 1: 编写 Auth.js 配置**

```typescript
// lib/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.username };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
```

**Step 2: 创建 Auth API Route**

```typescript
// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

**Step 3: 创建 middleware 保护路由**

```typescript
// middleware.ts
import { auth } from "@/lib/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith("/login") ||
                     req.nextUrl.pathname.startsWith("/register");
  const isProtected = req.nextUrl.pathname.startsWith("/dashboard") ||
                      req.nextUrl.pathname.startsWith("/create") ||
                      req.nextUrl.pathname.startsWith("/settings");

  if (isProtected && !isLoggedIn) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }

  if (isAuthPage && isLoggedIn) {
    return Response.redirect(new URL("/dashboard", req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

**Step 4: 安装 bcryptjs**

```bash
pnpm add bcryptjs @auth/prisma-adapter
pnpm add -D @types/bcryptjs
```

**Step 5: 验证 Auth 配置无语法错误**

Run: `pnpm build`
Expected: 编译通过（可能有页面缺失警告，但无类型错误）

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: 配置 Auth.js v5 认证（Credentials + JWT + Prisma Adapter）"
```

---

### Task 6: 注册 API + 注册页面

**Files:**
- Create: `app/api/register/route.ts`
- Create: `app/(public)/register/page.tsx`
- Create: `lib/validations/auth.ts`

**Step 1: 创建验证 schema**

```typescript
// lib/validations/auth.ts
import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
```

**Step 2: 创建注册 API**

```typescript
// app/api/register/route.ts
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
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
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
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Step 3: 创建注册页面**

```tsx
// app/(public)/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      username: formData.get("username") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error || "Registration failed");
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>创建账号</CardTitle>
          <CardDescription>注册 AI 微电影平台</CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input id="username" name="username" required minLength={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input id="password" name="password" type="password" required minLength={6} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "注册中..." : "注册"}
            </Button>
            <p className="text-sm text-muted-foreground">
              已有账号？<Link href="/login" className="text-primary underline">登录</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
```

**Step 4: 验证注册流程**

Run: `pnpm dev`
1. 打开 http://localhost:3000/register
2. 填写表单提交
3. 检查数据库是否创建了用户记录

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: 添加用户注册 API 和注册页面"
```

---

### Task 7: 登录页面

**Files:**
- Create: `app/(public)/login/page.tsx`

**Step 1: 创建登录页面**

```tsx
// app/(public)/login/page.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const registered = searchParams.get("registered") === "true";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await signIn("credentials", {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        redirect: false,
      });

      if (result?.error) {
        setError("邮箱或密码错误");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>登录</CardTitle>
          <CardDescription>AI 微电影平台</CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            {registered && (
              <p className="text-sm text-green-600">注册成功，请登录</p>
            )}
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input id="password" name="password" type="password" required minLength={6} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "登录中..." : "登录"}
            </Button>
            <p className="text-sm text-muted-foreground">
              没有账号？<Link href="/register" className="text-primary underline">注册</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
```

**Step 2: 验证完整注册→登录流程**

1. 注册新用户
2. 跳转到登录页，看到"注册成功"提示
3. 登录后跳转到 /dashboard

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: 添加登录页面，完成注册→登录→跳转流程"
```

---

### Task 8: 认证 Layout + Dashboard 骨架

**Files:**
- Create: `app/(auth)/layout.tsx`
- Create: `app/(auth)/dashboard/page.tsx`
- Create: `components/layout/AppSidebar.tsx`
- Create: `components/layout/UserMenu.tsx`
- Create: `lib/auth-utils.ts`

**Step 1: 创建服务端认证工具**

```typescript
// lib/auth-utils.ts
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session;
}
```

**Step 2: 创建侧边栏组件**

```tsx
// components/layout/AppSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Film, Users, LayoutGrid, Settings, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "我的电影", icon: Film },
  { href: "/dashboard/characters", label: "角色库", icon: Users },
  { href: "/dashboard/templates", label: "模板库", icon: LayoutGrid },
  { href: "/settings", label: "设置", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="text-lg font-bold">
          AI 微电影
        </Link>
      </div>

      <div className="p-4">
        <Button asChild className="w-full">
          <Link href="/create">
            <Plus className="mr-2 h-4 w-4" />
            创建项目
          </Link>
        </Button>
      </div>

      <nav className="flex-1 space-y-1 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

**Step 3: 创建用户菜单组件**

```tsx
// components/layout/UserMenu.tsx
"use client";

import { signOut } from "next-auth/react";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface UserMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

export function UserMenu({ user }: UserMenuProps) {
  const initial = user.name?.charAt(0).toUpperCase() ?? "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="px-2 py-1.5 text-sm">
          <p className="font-medium">{user.name}</p>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenuItem asChild>
          <a href="/settings">
            <User className="mr-2 h-4 w-4" />
            设置
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
          <LogOut className="mr-2 h-4 w-4" />
          退出
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Step 4: 创建认证 Layout**

```tsx
// app/(auth)/layout.tsx
import { requireAuth } from "@/lib/auth-utils";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { UserMenu } from "@/components/layout/UserMenu";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  return (
    <div className="flex h-screen">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-end border-b px-6">
          <UserMenu user={session.user} />
        </header>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

**Step 5: 创建 Dashboard 页面骨架**

```tsx
// app/(auth)/dashboard/page.tsx
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await requireAuth();

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      videos: { where: { status: "COMPLETED" }, take: 1 },
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">我的电影</h1>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">还没有创建任何项目</p>
          <p className="text-sm text-muted-foreground">点击「创建项目」开始你的第一部 AI 微电影</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div key={project.id} className="rounded-lg border p-4">
              <h3 className="font-medium">{project.title}</h3>
              <p className="text-sm text-muted-foreground">{project.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 6: 验证登录后跳转到 Dashboard**

1. 登录 → 看到侧边栏 + 空项目列表
2. 导航链接都可点击（虽然部分页面还不存在）

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: 添加认证 Layout、侧边栏、用户菜单和 Dashboard 骨架"
```

---

### Task 9: 项目 CRUD（Server Actions）

**Files:**
- Create: `lib/actions/project.ts`
- Create: `app/(auth)/create/page.tsx`
- Create: `components/project/ProjectCard.tsx`
- Create: `components/project/CreateProjectDialog.tsx`
- Create: `lib/validations/project.ts`

**Step 1: 创建项目验证 schema**

```typescript
// lib/validations/project.ts
import { z } from "zod";

export const createProjectSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
```

**Step 2: 创建项目 Server Actions**

```typescript
// lib/actions/project.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { createProjectSchema } from "@/lib/validations/project";

export async function createProject(formData: FormData) {
  const session = await requireAuth();

  const parsed = createProjectSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return { error: "Invalid input" };
  }

  const project = await prisma.project.create({
    data: {
      userId: session.user.id,
      title: parsed.data.title,
      description: parsed.data.description,
    },
  });

  redirect(`/create/${project.id}?step=characters`);
}

export async function deleteProject(projectId: string) {
  const session = await requireAuth();

  await prisma.project.deleteMany({
    where: { id: projectId, userId: session.user.id },
  });

  revalidatePath("/dashboard");
}
```

**Step 3: 创建"创建项目"页面**

```tsx
// app/(auth)/create/page.tsx
import { createProject } from "@/lib/actions/project";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreateProjectPage() {
  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>创建 AI 微电影</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createProject} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">电影名称</Label>
              <Input id="title" name="title" placeholder="给你的微电影取个名字" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">简介（可选）</Label>
              <Textarea id="description" name="description" placeholder="描述一下这部微电影的主题" />
            </div>
            <Button type="submit" className="w-full">开始创作</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 4: 创建项目卡片组件**

```tsx
// components/project/ProjectCard.tsx
import Link from "next/link";
import { Film, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteProject } from "@/lib/actions/project";
import type { ProjectStatus } from "@prisma/client";

const statusLabels: Record<ProjectStatus, string> = {
  DRAFT: "草稿",
  SCRIPT_READY: "剧本就绪",
  STORYBOARD_READY: "分镜就绪",
  GENERATING: "生成中",
  COMPLETED: "已完成",
  FAILED: "失败",
};

interface ProjectCardProps {
  id: string;
  title: string;
  status: ProjectStatus;
  updatedAt: Date;
}

export function ProjectCard({ id, title, status, updatedAt }: ProjectCardProps) {
  const step = status === "DRAFT" ? "characters" : "result";
  const href = `/create/${id}?step=${step}`;

  return (
    <Card className="group relative transition-shadow hover:shadow-md">
      <Link href={href}>
        <CardHeader className="flex flex-row items-center gap-3">
          <Film className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Badge variant={status === "COMPLETED" ? "default" : "secondary"}>
              {statusLabels[status]}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {updatedAt.toLocaleDateString("zh-CN")}
            </span>
          </div>
        </CardContent>
      </Link>
      <form
        action={deleteProject.bind(null, id)}
        className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <Button variant="ghost" size="icon" type="submit" className="h-8 w-8">
          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      </form>
    </Card>
  );
}
```

**Step 5: 更新 Dashboard 使用 ProjectCard**

更新 `app/(auth)/dashboard/page.tsx` 中的项目列表部分，用 `<ProjectCard>` 替换简单的 div。

**Step 6: 验证创建项目流程**

1. 进入 /create
2. 填写名称，提交
3. 跳转到 /create/[id]?step=characters
4. 回到 /dashboard 看到新项目卡片

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: 添加项目 CRUD（Server Actions）、创建页面和项目卡片"
```

---

### Task 10: 创作工作台 Wizard 骨架

**Files:**
- Create: `app/(auth)/create/[projectId]/page.tsx`
- Create: `components/wizard/CreationWizard.tsx`
- Create: `components/wizard/StepIndicator.tsx`

**Step 1: 创建步骤指示器组件**

```tsx
// components/wizard/StepIndicator.tsx
"use client";

import { cn } from "@/lib/utils";
import { Users, BookOpen, LayoutGrid, Play, CheckCircle } from "lucide-react";

const steps = [
  { key: "characters", label: "角色", icon: Users },
  { key: "script", label: "剧本", icon: BookOpen },
  { key: "storyboard", label: "分镜", icon: LayoutGrid },
  { key: "generate", label: "生成", icon: Play },
  { key: "result", label: "结果", icon: CheckCircle },
] as const;

export type StepKey = (typeof steps)[number]["key"];

interface StepIndicatorProps {
  currentStep: StepKey;
  onStepClick: (step: StepKey) => void;
  completedSteps: Set<StepKey>;
}

export function StepIndicator({ currentStep, onStepClick, completedSteps }: StepIndicatorProps) {
  return (
    <nav className="flex items-center justify-center gap-2">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isCurrent = currentStep === step.key;
        const isCompleted = completedSteps.has(step.key);

        return (
          <div key={step.key} className="flex items-center">
            <button
              onClick={() => onStepClick(step.key)}
              disabled={!isCompleted && !isCurrent}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors",
                isCurrent && "bg-primary text-primary-foreground",
                isCompleted && !isCurrent && "bg-primary/10 text-primary",
                !isCurrent && !isCompleted && "text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{step.label}</span>
            </button>
            {index < steps.length - 1 && (
              <div className={cn(
                "mx-1 h-px w-8",
                isCompleted ? "bg-primary" : "bg-border"
              )} />
            )}
          </div>
        );
      })}
    </nav>
  );
}
```

**Step 2: 创建 Wizard 容器组件**

```tsx
// components/wizard/CreationWizard.tsx
"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { StepIndicator, type StepKey } from "./StepIndicator";

interface CreationWizardProps {
  projectId: string;
  initialStep: StepKey;
  children: Record<StepKey, React.ReactNode>;
}

export function CreationWizard({ projectId, initialStep, children }: CreationWizardProps) {
  const router = useRouter();
  const [completedSteps, setCompletedSteps] = useState<Set<StepKey>>(new Set());

  const currentStep = initialStep;

  const goToStep = useCallback((step: StepKey) => {
    router.push(`/create/${projectId}?step=${step}`);
  }, [projectId, router]);

  const completeStep = useCallback((step: StepKey, nextStep: StepKey) => {
    setCompletedSteps((prev) => new Set([...prev, step]));
    goToStep(nextStep);
  }, [goToStep]);

  return (
    <div className="flex flex-col gap-6">
      <StepIndicator
        currentStep={currentStep}
        onStepClick={goToStep}
        completedSteps={completedSteps}
      />
      <div className="min-h-[60vh]">
        {children[currentStep]}
      </div>
    </div>
  );
}
```

**Step 3: 创建工作台页面（整合所有步骤）**

```tsx
// app/(auth)/create/[projectId]/page.tsx
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { CreationWizard } from "@/components/wizard/CreationWizard";
import type { StepKey } from "@/components/wizard/StepIndicator";

interface Props {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ step?: string }>;
}

export default async function ProjectWorkbenchPage({ params, searchParams }: Props) {
  const { projectId } = await params;
  const { step } = await searchParams;
  const session = await requireAuth();

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  });

  if (!project) notFound();

  const currentStep = (step as StepKey) || "characters";

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">{project.title}</h1>
      <CreationWizard projectId={projectId} initialStep={currentStep}>
        {{
          characters: <div className="rounded-lg border p-8 text-center text-muted-foreground">角色管理（待实现）</div>,
          script: <div className="rounded-lg border p-8 text-center text-muted-foreground">剧本选择（待实现）</div>,
          storyboard: <div className="rounded-lg border p-8 text-center text-muted-foreground">分镜生成（待实现）</div>,
          generate: <div className="rounded-lg border p-8 text-center text-muted-foreground">视频生成（待实现）</div>,
          result: <div className="rounded-lg border p-8 text-center text-muted-foreground">结果展示（待实现）</div>,
        }}
      </CreationWizard>
    </div>
  );
}
```

**Step 4: 验证 Wizard 导航**

1. 创建项目 → 跳到 /create/[id]?step=characters
2. 看到步骤指示器和占位内容
3. URL 中 step 参数变化正确

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: 添加创作工作台 Wizard 骨架（5 步骤指示器 + 路由）"
```

---

### Task 11: S3 文件存储工具

**Files:**
- Create: `lib/storage.ts`

**Step 1: 创建 S3 存储工具**

```typescript
// lib/storage.ts
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.S3_REGION!,
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true,
});

const BUCKET = process.env.S3_BUCKET!;

export async function getUploadUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, { expiresIn: 3600 });
}

export async function getDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  return getSignedUrl(s3, command, { expiresIn: 3600 });
}

export async function deleteObject(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  await s3.send(command);
}

export function getStorageKey(userId: string, type: string, filename: string): string {
  const timestamp = Date.now();
  return `${userId}/${type}/${timestamp}-${filename}`;
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: 添加 S3 文件存储工具（presigned URL 上传/下载）"
```

---

### Task 12: 角色系统 - 数据层 + Server Actions

**Files:**
- Create: `lib/actions/character.ts`
- Create: `lib/validations/character.ts`

**Step 1: 创建角色验证 schema**

```typescript
// lib/validations/character.ts
import { z } from "zod";

export const createCharacterSchema = z.object({
  name: z.string().min(1).max(50),
  photoUrl: z.string().url(),
  personality: z.string().optional(),
  style: z.string().optional(),
});

export const updateCharacterSchema = createCharacterSchema.partial();

export const addCharacterToProjectSchema = z.object({
  characterId: z.string(),
  relationship: z.string().optional(),
  roleName: z.string().optional(),
});

export type CreateCharacterInput = z.infer<typeof createCharacterSchema>;
```

**Step 2: 创建角色 Server Actions**

```typescript
// lib/actions/character.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { createCharacterSchema, addCharacterToProjectSchema } from "@/lib/validations/character";

export async function createCharacter(formData: FormData) {
  const session = await requireAuth();

  const parsed = createCharacterSchema.safeParse({
    name: formData.get("name"),
    photoUrl: formData.get("photoUrl"),
    personality: formData.get("personality"),
    style: formData.get("style"),
  });

  if (!parsed.success) {
    return { error: "Invalid input" };
  }

  const character = await prisma.character.create({
    data: {
      userId: session.user.id,
      ...parsed.data,
    },
  });

  revalidatePath("/dashboard/characters");
  return { data: character };
}

export async function addCharacterToProject(projectId: string, formData: FormData) {
  const session = await requireAuth();

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  });
  if (!project) return { error: "Project not found" };

  const parsed = addCharacterToProjectSchema.safeParse({
    characterId: formData.get("characterId"),
    relationship: formData.get("relationship"),
    roleName: formData.get("roleName"),
  });

  if (!parsed.success) return { error: "Invalid input" };

  await prisma.projectCharacter.create({
    data: {
      projectId,
      ...parsed.data,
    },
  });

  revalidatePath(`/create/${projectId}`);
  return { success: true };
}

export async function removeCharacterFromProject(projectId: string, characterId: string) {
  const session = await requireAuth();

  await prisma.projectCharacter.deleteMany({
    where: {
      projectId,
      characterId,
      project: { userId: session.user.id },
    },
  });

  revalidatePath(`/create/${projectId}`);
}

export async function deleteCharacter(characterId: string) {
  const session = await requireAuth();

  await prisma.character.deleteMany({
    where: { id: characterId, userId: session.user.id },
  });

  revalidatePath("/dashboard/characters");
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: 添加角色系统数据层（验证 schema + Server Actions）"
```

---

### Task 13: 角色系统 - 前端组件

**Files:**
- Create: `components/character/CharacterUploader.tsx`
- Create: `components/character/CharacterCard.tsx`
- Create: `components/character/CharacterPicker.tsx`
- Create: `app/api/upload/route.ts`

**Step 1: 创建上传 API Route（返回 presigned URL）**

```typescript
// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUploadUrl, getStorageKey } from "@/lib/storage";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { filename, contentType, type } = await req.json();

  if (!filename || !contentType) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const key = getStorageKey(session.user.id, type || "photos", filename);
  const uploadUrl = await getUploadUrl(key, contentType);

  return NextResponse.json({ uploadUrl, key });
}
```

**Step 2: 创建角色上传组件**

```tsx
// components/character/CharacterUploader.tsx
"use client";

import { useState, useCallback } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createCharacter } from "@/lib/actions/character";

const personalities = ["勇敢", "冷酷", "温柔", "幽默", "神秘"];
const styles = ["写实", "动漫", "古装", "科幻", "赛博朋克"];

interface CharacterUploaderProps {
  onCreated?: () => void;
}

export function CharacterUploader({ onCreated }: CharacterUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [preview, setPreview] = useState("");

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          type: "characters",
        }),
      });
      const { uploadUrl, key } = await res.json();

      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      setPhotoUrl(key);
    } catch {
      setPreview("");
    } finally {
      setUploading(false);
    }
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>创建角色</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={async (formData) => {
          formData.set("photoUrl", photoUrl);
          await createCharacter(formData);
          onCreated?.();
        }} className="space-y-4">
          <div className="space-y-2">
            <Label>角色照片</Label>
            <div className="flex items-center gap-4">
              {preview ? (
                <img src={preview} alt="preview" className="h-24 w-24 rounded-lg object-cover" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <Input type="file" accept="image/*" onChange={handleFileChange} />
                {uploading && <Loader2 className="mt-2 h-4 w-4 animate-spin" />}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">角色名称</Label>
            <Input id="name" name="name" required />
          </div>

          <div className="space-y-2">
            <Label>性格</Label>
            <Select name="personality">
              <SelectTrigger><SelectValue placeholder="选择性格" /></SelectTrigger>
              <SelectContent>
                {personalities.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>风格</Label>
            <Select name="style">
              <SelectTrigger><SelectValue placeholder="选择风格" /></SelectTrigger>
              <SelectContent>
                {styles.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={!photoUrl || uploading} className="w-full">
            创建角色
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

**Step 3: 创建角色卡片组件**

```tsx
// components/character/CharacterCard.tsx
"use client";

import { Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CharacterCardProps {
  id: string;
  name: string;
  photoUrl: string;
  personality?: string | null;
  style?: string | null;
  onDelete?: (id: string) => void;
  onSelect?: (id: string) => void;
  selected?: boolean;
}

export function CharacterCard({
  id, name, photoUrl, personality, style, onDelete, onSelect, selected,
}: CharacterCardProps) {
  return (
    <Card
      className={`group relative cursor-pointer transition-shadow hover:shadow-md ${selected ? "ring-2 ring-primary" : ""}`}
      onClick={() => onSelect?.(id)}
    >
      <CardContent className="p-3">
        <div className="aspect-square overflow-hidden rounded-lg">
          <img src={photoUrl} alt={name} className="h-full w-full object-cover" />
        </div>
        <h3 className="mt-2 font-medium">{name}</h3>
        <div className="mt-1 flex flex-wrap gap-1">
          {personality && <Badge variant="secondary">{personality}</Badge>}
          {style && <Badge variant="outline">{style}</Badge>}
        </div>
      </CardContent>
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1 h-7 w-7 opacity-0 group-hover:opacity-100"
          onClick={(e) => { e.stopPropagation(); onDelete(id); }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </Card>
  );
}
```

**Step 4: 创建角色选择器（用于 Wizard 步骤 1）**

```tsx
// components/character/CharacterPicker.tsx
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { CharacterCard } from "./CharacterCard";
import { CharacterUploader } from "./CharacterUploader";
import type { Character } from "@prisma/client";

interface CharacterPickerProps {
  allCharacters: Character[];
  selectedIds: string[];
  projectId: string;
  onAddToProject: (characterId: string) => Promise<void>;
  onRemoveFromProject: (characterId: string) => Promise<void>;
}

export function CharacterPicker({
  allCharacters, selectedIds, projectId, onAddToProject, onRemoveFromProject,
}: CharacterPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">选择角色</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              新建角色
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <CharacterUploader onCreated={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {allCharacters.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          还没有角色，点击「新建角色」创建你的第一个 AI 角色
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {allCharacters.map((char) => (
            <CharacterCard
              key={char.id}
              id={char.id}
              name={char.name}
              photoUrl={char.photoUrl}
              personality={char.personality}
              style={char.style}
              selected={selectedIds.includes(char.id)}
              onSelect={async (id) => {
                if (selectedIds.includes(id)) {
                  await onRemoveFromProject(id);
                } else {
                  await onAddToProject(id);
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: 添加角色系统前端组件（上传、卡片、选择器）"
```

---

### Task 14: 角色步骤集成到 Wizard

**Files:**
- Modify: `app/(auth)/create/[projectId]/page.tsx`
- Create: `components/wizard/steps/CharacterStep.tsx`

**Step 1: 创建角色步骤组件**

```tsx
// components/wizard/steps/CharacterStep.tsx
"use client";

import { CharacterPicker } from "@/components/character/CharacterPicker";
import { addCharacterToProject, removeCharacterFromProject } from "@/lib/actions/character";
import { Button } from "@/components/ui/button";
import type { Character } from "@prisma/client";

interface CharacterStepProps {
  projectId: string;
  allCharacters: Character[];
  selectedCharacterIds: string[];
  onNext: () => void;
}

export function CharacterStep({ projectId, allCharacters, selectedCharacterIds, onNext }: CharacterStepProps) {
  return (
    <div className="space-y-6">
      <CharacterPicker
        allCharacters={allCharacters}
        selectedIds={selectedCharacterIds}
        projectId={projectId}
        onAddToProject={async (characterId) => {
          const formData = new FormData();
          formData.set("characterId", characterId);
          await addCharacterToProject(projectId, formData);
        }}
        onRemoveFromProject={async (characterId) => {
          await removeCharacterFromProject(projectId, characterId);
        }}
      />
      <div className="flex justify-end">
        <Button
          onClick={onNext}
          disabled={selectedCharacterIds.length === 0}
        >
          下一步：选择剧本
        </Button>
      </div>
    </div>
  );
}
```

**Step 2: 更新 Wizard 页面，集成角色步骤**

在 `app/(auth)/create/[projectId]/page.tsx` 中查询角色数据并传给 CharacterStep。

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: 集成角色步骤到创作 Wizard"
```

---

### Task 15: 剧本系统 - 模板 + Server Actions

**Files:**
- Create: `lib/actions/script.ts`
- Create: `lib/validations/script.ts`
- Create: `lib/data/script-templates.ts`

**Step 1: 创建剧本模板数据**

```typescript
// lib/data/script-templates.ts
export interface ScriptTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  scenes: {
    sceneNumber: number;
    description: string;
    action: string;
    cameraType: string;
    duration: number;
    dialogue?: string;
  }[];
}

export const scriptTemplates: ScriptTemplate[] = [
  {
    id: "rain-confession",
    title: "雨夜告白",
    category: "爱情",
    description: "一个浪漫的雨夜告白故事",
    scenes: [
      { sceneNumber: 1, description: "夜晚的街道，路灯下", action: "男主独自等待，看着手机", cameraType: "远景", duration: 5 },
      { sceneNumber: 2, description: "雨开始下", action: "女主撑伞出现在街角", cameraType: "中景", duration: 4 },
      { sceneNumber: 3, description: "两人面对面", action: "男主鼓起勇气告白", cameraType: "特写", duration: 6 },
    ],
  },
  {
    id: "campus-farewell",
    title: "校园告别",
    category: "校园",
    description: "毕业季的离别故事",
    scenes: [
      { sceneNumber: 1, description: "教室里，阳光洒在课桌上", action: "主角整理书桌", cameraType: "中景", duration: 5 },
      { sceneNumber: 2, description: "操场上", action: "朋友们拍合照", cameraType: "远景", duration: 4 },
      { sceneNumber: 3, description: "校门口", action: "转身挥手告别", cameraType: "特写", duration: 5 },
    ],
  },
  {
    id: "space-explorer",
    title: "星际探险",
    category: "科幻",
    description: "太空中的冒险旅程",
    scenes: [
      { sceneNumber: 1, description: "飞船驾驶舱", action: "主角检查仪表盘", cameraType: "中景", duration: 5 },
      { sceneNumber: 2, description: "外太空", action: "飞船穿越小行星带", cameraType: "远景", duration: 6 },
      { sceneNumber: 3, description: "未知星球表面", action: "主角踏出第一步", cameraType: "特写", duration: 5 },
    ],
  },
  {
    id: "mystery-letter",
    title: "神秘来信",
    category: "悬疑",
    description: "一封改变命运的信",
    scenes: [
      { sceneNumber: 1, description: "老旧邮箱前", action: "主角发现一封没有署名的信", cameraType: "特写", duration: 4 },
      { sceneNumber: 2, description: "昏暗的房间", action: "在台灯下阅读信件内容", cameraType: "中景", duration: 5 },
      { sceneNumber: 3, description: "信中提到的地点", action: "主角决定前往调查", cameraType: "远景", duration: 5 },
    ],
  },
  {
    id: "wuxia-duel",
    title: "江湖对决",
    category: "武侠",
    description: "武林高手的巅峰对决",
    scenes: [
      { sceneNumber: 1, description: "山顶竹林", action: "两位侠客对峙", cameraType: "远景", duration: 5 },
      { sceneNumber: 2, description: "近身交锋", action: "刀剑相交", cameraType: "中景", duration: 4 },
      { sceneNumber: 3, description: "日落西山", action: "胜者转身离去", cameraType: "远景", duration: 5 },
    ],
  },
  {
    id: "treasure-hunt",
    title: "寻宝奇遇",
    category: "冒险",
    description: "一次意外的寻宝之旅",
    scenes: [
      { sceneNumber: 1, description: "破旧的阁楼", action: "发现一张藏宝图", cameraType: "特写", duration: 4 },
      { sceneNumber: 2, description: "密林深处", action: "按照地图前行，遇到障碍", cameraType: "远景", duration: 6 },
      { sceneNumber: 3, description: "隐秘的洞穴入口", action: "找到宝藏", cameraType: "中景", duration: 5 },
    ],
  },
];
```

**Step 2: 创建剧本 Server Actions**

```typescript
// lib/actions/script.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { scriptTemplates } from "@/lib/data/script-templates";

export async function applyScriptTemplate(projectId: string, templateId: string) {
  const session = await requireAuth();

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  });
  if (!project) return { error: "Project not found" };

  const template = scriptTemplates.find((t) => t.id === templateId);
  if (!template) return { error: "Template not found" };

  await prisma.script.upsert({
    where: { projectId },
    create: {
      projectId,
      type: "TEMPLATE",
      content: template.scenes,
      metadata: { title: template.title, category: template.category },
    },
    update: {
      type: "TEMPLATE",
      content: template.scenes,
      metadata: { title: template.title, category: template.category },
    },
  });

  await prisma.project.update({
    where: { id: projectId },
    data: { status: "SCRIPT_READY" },
  });

  revalidatePath(`/create/${projectId}`);
  return { success: true };
}

export async function saveCustomScript(projectId: string, content: string) {
  const session = await requireAuth();

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  });
  if (!project) return { error: "Project not found" };

  const scenes = JSON.parse(content);

  await prisma.script.upsert({
    where: { projectId },
    create: { projectId, type: "CUSTOM", content: scenes },
    update: { type: "CUSTOM", content: scenes },
  });

  await prisma.project.update({
    where: { id: projectId },
    data: { status: "SCRIPT_READY" },
  });

  revalidatePath(`/create/${projectId}`);
  return { success: true };
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: 添加剧本系统（6 个模板 + Server Actions）"
```

---

### Task 16: 剧本步骤前端组件 + 集成

**Files:**
- Create: `components/script/ScriptTemplateGrid.tsx`
- Create: `components/wizard/steps/ScriptStep.tsx`

（具体实现代码：模板卡片网格选择 + 应用模板 action + 进入下一步按钮）

**Commit:** `feat: 添加剧本选择步骤（模板网格 + 集成到 Wizard）`

---

### Task 17: 分镜系统 - Server Actions + AI 生成

**Files:**
- Create: `lib/actions/storyboard.ts`
- Create: `app/api/storyboard/generate/route.ts`

（具体实现：基于剧本 scenes 生成 Storyboard 记录，或调用 AI 生成。Phase 1 先实现从剧本模板直接映射。）

**Commit:** `feat: 添加分镜系统数据层（从剧本生成分镜）`

---

### Task 18: 分镜步骤前端组件

**Files:**
- Create: `components/storyboard/StoryboardCard.tsx`
- Create: `components/storyboard/StoryboardList.tsx`
- Create: `components/storyboard/StoryboardEditor.tsx`
- Create: `components/wizard/steps/StoryboardStep.tsx`

（具体实现：分镜卡片列表、编辑/删除/新增、下一步按钮）

**Commit:** `feat: 添加分镜编辑步骤前端组件`

---

### Task 19: BullMQ 任务队列基础设施

**Files:**
- Create: `lib/queue.ts`
- Create: `lib/queue-types.ts`

**Step 1: 创建队列类型定义**

```typescript
// lib/queue-types.ts
export type TaskType =
  | "character:generate"
  | "script:generate"
  | "storyboard:generate"
  | "storyboard:preview"
  | "video:clip"
  | "voice:generate"
  | "music:generate"
  | "video:compose";

export interface TaskPayload {
  taskType: TaskType;
  projectId: string;
  userId: string;
  data: Record<string, unknown>;
}

export interface TaskResult {
  taskType: TaskType;
  status: "completed" | "failed";
  data?: Record<string, unknown>;
  error?: string;
}
```

**Step 2: 创建 BullMQ 队列工具**

```typescript
// lib/queue.ts
import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });

export const aiTaskQueue = new Queue("ai-tasks", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { age: 3600 * 24 },
    removeOnFail: { age: 3600 * 24 * 7 },
  },
});

export async function enqueueTask(payload: import("./queue-types").TaskPayload) {
  return aiTaskQueue.add(payload.taskType, payload, {
    jobId: `${payload.taskType}:${payload.projectId}:${Date.now()}`,
  });
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: 添加 BullMQ 任务队列基础设施"
```

---

### Task 20: SSE 实时进度推送

**Files:**
- Create: `app/api/tasks/[projectId]/progress/route.ts`
- Create: `hooks/useTaskProgress.ts`

**Step 1: 创建 SSE API Route**

```typescript
// app/api/tasks/[projectId]/progress/route.ts
import { auth } from "@/lib/auth";
import IORedis from "ioredis";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { projectId } = await params;
  const redis = new IORedis(process.env.REDIS_URL!);
  const channel = `progress:${projectId}`;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      redis.subscribe(channel);
      redis.on("message", (_ch: string, message: string) => {
        send(message);
      });

      req.signal.addEventListener("abort", () => {
        redis.unsubscribe(channel);
        redis.disconnect();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

**Step 2: 创建 useTaskProgress hook**

```typescript
// hooks/useTaskProgress.ts
"use client";

import { useEffect, useState, useCallback } from "react";

interface ProgressUpdate {
  taskType: string;
  status: string;
  progress: number;
  message?: string;
}

export function useTaskProgress(projectId: string) {
  const [updates, setUpdates] = useState<ProgressUpdate[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource(`/api/tasks/${projectId}/progress`);

    eventSource.onopen = () => setConnected(true);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data) as ProgressUpdate;
      setUpdates((prev) => [...prev, data]);
    };

    eventSource.onerror = () => {
      setConnected(false);
      eventSource.close();
    };

    return () => eventSource.close();
  }, [projectId]);

  const latestByType = useCallback(() => {
    const map = new Map<string, ProgressUpdate>();
    for (const u of updates) {
      map.set(u.taskType, u);
    }
    return map;
  }, [updates]);

  return { updates, connected, latestByType };
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: 添加 SSE 实时进度推送（API Route + useTaskProgress hook）"
```

---

### Task 21: 视频生成步骤 + 进度展示

**Files:**
- Create: `components/video/ProgressTracker.tsx`
- Create: `components/wizard/steps/GenerateStep.tsx`
- Create: `lib/actions/video.ts`

（具体实现：触发视频生成任务、进度条 UI、SSE 订阅进度更新）

**Commit:** `feat: 添加视频生成步骤（触发任务 + 进度展示）`

---

### Task 22: 结果展示步骤

**Files:**
- Create: `components/video/VideoPlayer.tsx`
- Create: `components/wizard/steps/ResultStep.tsx`

（具体实现：HTML5 视频播放器、下载按钮、重新生成按钮）

**Commit:** `feat: 添加结果展示步骤（播放器 + 下载）`

---

### Task 23: Python AI Worker 基础结构

**Files:**
- Create: `worker/requirements.txt`
- Create: `worker/Dockerfile`
- Create: `worker/main.py`
- Create: `worker/config.py`
- Create: `worker/consumer.py`

**Step 1: 创建 requirements.txt**

```txt
redis>=5.0.0
psycopg2-binary>=2.9.0
openai>=1.0.0
httpx>=0.27.0
Pillow>=10.0.0
python-dotenv>=1.0.0
```

**Step 2: 创建 Redis 消费者**

```python
# worker/consumer.py
import json
import redis
import traceback
from config import REDIS_URL

r = redis.from_url(REDIS_URL)

def process_task(task_data: dict):
    task_type = task_data.get("taskType")
    project_id = task_data.get("projectId")

    handlers = {
        "script:generate": handle_script_generate,
        "video:compose": handle_video_compose,
    }

    handler = handlers.get(task_type)
    if not handler:
        publish_progress(project_id, task_type, "failed", 0, f"Unknown task type: {task_type}")
        return

    try:
        handler(task_data)
    except Exception as e:
        publish_progress(project_id, task_type, "failed", 0, str(e))
        traceback.print_exc()

def publish_progress(project_id: str, task_type: str, status: str, progress: int, message: str = ""):
    r.publish(f"progress:{project_id}", json.dumps({
        "taskType": task_type,
        "status": status,
        "progress": progress,
        "message": message,
    }))

def handle_script_generate(task_data: dict):
    # Phase 1: 占位实现
    publish_progress(task_data["projectId"], "script:generate", "completed", 100)

def handle_video_compose(task_data: dict):
    # Phase 1: 占位实现，后续集成 FFmpeg
    publish_progress(task_data["projectId"], "video:compose", "completed", 100)

def main():
    print("Worker started, listening for tasks...")
    while True:
        _, message = r.blpop("bull:ai-tasks:wait")
        if message:
            task_data = json.loads(message)
            process_task(task_data.get("data", task_data))

if __name__ == "__main__":
    main()
```

**Step 3: 创建 Dockerfile**

```dockerfile
# worker/Dockerfile
FROM python:3.11-slim

RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "main.py"]
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: 添加 Python AI Worker 基础结构（Redis 消费者 + Dockerfile）"
```

---

### Task 24: Docker Compose 编排

**Files:**
- Create: `docker-compose.yml`

**Step 1: 创建 docker-compose.yml**

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: aimovie
      POSTGRES_PASSWORD: aimovie_secret
      POSTGRES_DB: aimovie
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

  worker:
    build: ./worker
    environment:
      REDIS_URL: redis://redis:6379/0
      DATABASE_URL: postgresql://aimovie:aimovie_secret@postgres:5432/aimovie
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    depends_on:
      - redis
      - postgres

volumes:
  postgres_data:
  minio_data:
```

**Step 2: 验证启动**

```bash
docker-compose up -d postgres redis minio
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: 添加 Docker Compose（PostgreSQL + Redis + MinIO + Worker）"
```

---

### Task 25: Landing 首页

**Files:**
- Create: `app/(public)/page.tsx`
- Create: `components/landing/Hero.tsx`
- Create: `components/landing/Features.tsx`
- Create: `components/landing/HowItWorks.tsx`

（具体实现：产品介绍 Hero、功能特性展示、使用流程说明、开始创作 CTA 按钮）

**Commit:** `feat: 添加 Landing 首页（Hero + Features + HowItWorks）`

---

### Task 26: Vitest 测试配置 + 首批测试

**Files:**
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`
- Create: `tests/lib/validations/auth.test.ts`
- Create: `tests/lib/validations/project.test.ts`

**Step 1: 配置 Vitest**

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

**Step 2: 写验证 schema 测试**

```typescript
// tests/lib/validations/auth.test.ts
import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema } from "@/lib/validations/auth";

describe("registerSchema", () => {
  it("accepts valid input", () => {
    const result = registerSchema.safeParse({
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short password", () => {
    const result = registerSchema.safeParse({
      username: "testuser",
      email: "test@example.com",
      password: "123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({
      username: "testuser",
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });
});
```

**Step 3: 运行测试**

```bash
pnpm vitest run
```

Expected: 所有测试通过

**Step 4: Commit**

```bash
git add -A
git commit -m "test: 添加 Vitest 配置和首批验证 schema 测试"
```

---

## Phase 2: AI 增强 + 分镜编辑 + 字幕 (P1)

> 目标：接入真正的 AI 能力，增强分镜编辑体验，添加字幕系统。

### Task 27: LLM 剧本生成服务

**Files:**
- Create: `worker/services/llm_service.py`
- Modify: `worker/consumer.py` — 集成 LLM 调用
- Create: `worker/tests/test_llm_service.py`

实现基于 OpenAI/DeepSeek API 的结构化剧本生成，输入角色信息 + 用户提示，输出标准 scenes JSON。

**Commit:** `feat(worker): 接入 LLM 服务实现 AI 剧本生成`

---

### Task 28: AI 剧本生成前端集成

**Files:**
- Create: `components/script/ScriptGenerator.tsx`
- Modify: `components/wizard/steps/ScriptStep.tsx` — 添加 AI 生成选项

用户输入描述文字，触发 AI 生成剧本任务，SSE 接收结果后展示。

**Commit:** `feat: 添加 AI 剧本生成前端交互`

---

### Task 29: 剧本编辑器

**Files:**
- Create: `components/script/ScriptEditor.tsx`
- Create: `components/script/SceneEditor.tsx`

可视化编辑剧本的每个场景：描述、角色分配、对白、时长。支持拖拽排序。

**Commit:** `feat: 添加可视化剧本编辑器`

---

### Task 30: 分镜编辑器增强

**Files:**
- Modify: `components/storyboard/StoryboardEditor.tsx` — 添加镜头类型选择、角色动作编辑
- Create: `components/storyboard/CameraTypeSelect.tsx`

添加镜头类型（远景/中景/特写）选择、角色动作编辑、时长调整。

**Commit:** `feat: 增强分镜编辑器（镜头类型、角色动作）`

---

### Task 31: 分镜预览图生成

**Files:**
- Create: `worker/services/image_service.py`
- Modify: `worker/consumer.py` — 添加 storyboard:preview handler

基于分镜描述生成静态预览图（调用图像生成 API）。

**Commit:** `feat(worker): 添加分镜预览图生成服务`

---

### Task 32: 字幕系统

**Files:**
- Create: `worker/services/subtitle_service.py`
- Create: `lib/actions/subtitle.ts`
- Modify: 视频合成流水线 — 在 FFmpeg 中叠加字幕

根据剧本对白自动生成 SRT 字幕文件，在视频合成时叠加。用户可选择开启/关闭字幕。

**Commit:** `feat: 添加字幕系统（自动生成 + 视频叠加）`

---

## Phase 3: 配音 + 音乐 + 角色库 (P2)

> 目标：实现后期制作的音频能力，完善角色管理。

### Task 33: 角色三视图生成

**Files:**
- Create: `worker/services/character_service.py`

接入 InstantID/Zero123 生成角色三视图（正面/侧面/背面）。

**Commit:** `feat(worker): 添加角色三视图生成服务`

---

### Task 34: 角色 Embedding 生成

**Files:**
- Modify: `worker/services/character_service.py`

基于角色照片生成 embedding 向量，用于视频生成时保证角色一致性。

**Commit:** `feat(worker): 添加角色 embedding 生成`

---

### Task 35: TTS 配音服务

**Files:**
- Create: `worker/services/voice_service.py`
- Modify: `worker/consumer.py`

接入 ElevenLabs/OpenAI TTS，根据对白文本生成角色配音。

**Commit:** `feat(worker): 添加 TTS 配音服务`

---

### Task 36: AI 音乐生成服务

**Files:**
- Create: `worker/services/music_service.py`
- Modify: `worker/consumer.py`

接入 Suno/Udio API，根据场景情绪标签生成背景音乐。

**Commit:** `feat(worker): 添加 AI 音乐生成服务`

---

### Task 37: 音频混合到视频合成流水线

**Files:**
- Modify: `worker/utils/ffmpeg_compose.py`

在 FFmpeg 合成流水线中加入：叠加配音音轨 → 混入背景音乐 → 音频平衡。

**Commit:** `feat(worker): 视频合成流水线集成配音和音乐`

---

### Task 38: 角色库管理页面

**Files:**
- Create: `app/(auth)/dashboard/characters/page.tsx`

完整的角色库页面：查看所有角色、搜索/筛选、删除、编辑属性、查看三视图。

**Commit:** `feat: 添加角色库管理页面`

---

## Phase 4: 商业化 + 分享 + 海报 (P3)

> 目标：实现会员体系、分享功能、电影海报。

### Task 39: 会员体系

**Files:**
- Create: `lib/actions/subscription.ts`
- Modify: `app/(auth)/settings/page.tsx`
- Create: `lib/middleware/plan-check.ts`

会员等级（FREE/MONTHLY/YEARLY）、生成次数限制、升级入口。

**Commit:** `feat: 添加会员体系（等级 + 生成限制 + 升级入口）`

---

### Task 40: 分享系统

**Files:**
- Create: `app/(public)/movie/[videoId]/page.tsx`
- Create: `lib/actions/share.ts`

公开分享页面、分享链接生成、OG meta 标签（社交媒体预览）。

**Commit:** `feat: 添加视频分享系统（公开页面 + OG 标签）`

---

### Task 41: 电影海报自动生成

**Files:**
- Create: `worker/services/poster_service.py`
- Modify: 视频合成流水线

基于关键帧 + 电影标题自动生成海报图片。

**Commit:** `feat: 添加电影海报自动生成`

---

### Task 42: E2E 测试

**Files:**
- Create: `tests/e2e/creation-flow.spec.ts`
- Create: `playwright.config.ts`

Playwright E2E 测试覆盖核心流程：注册 → 登录 → 创建项目 → 添加角色 → 选择剧本 → 生成视频。

**Commit:** `test: 添加 E2E 测试覆盖核心创作流程`

---

### Task 43: 模板库页面

**Files:**
- Create: `app/(auth)/dashboard/templates/page.tsx`

浏览所有剧本模板，按分类筛选，一键克隆到新项目。

**Commit:** `feat: 添加模板库浏览页面`

---

### Task 44: 设置页面完善

**Files:**
- Modify: `app/(auth)/settings/page.tsx`

账户信息编辑、AI API Key 配置、会员管理、生成记录。

**Commit:** `feat: 完善设置页面（账户、AI 配置、会员）`

---

## 任务依赖图

```
Phase 1 (基础设施):
T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10
                                                  ↓
T11 → T12 → T13 → T14 (角色系统)                 T10
T15 → T16 (剧本系统)                              ↓
T17 → T18 (分镜系统)                       T19 → T20 → T21 → T22
T23 → T24 (Worker + Docker)
T25 (Landing)
T26 (测试)

Phase 2 (AI 增强):
T27 → T28 → T29 (AI 剧本)
T30 → T31 (分镜增强)
T32 (字幕)

Phase 3 (配音/音乐/角色库):
T33 → T34 (角色生成)
T35 → T36 → T37 (音频)
T38 (角色库页面)

Phase 4 (商业化):
T39 (会员) | T40 (分享) | T41 (海报) | T42 (E2E) | T43 (模板) | T44 (设置)
```

---

## 里程碑检查点

| 检查点 | 完成后验证 |
|--------|-----------|
| Task 8 完成 | 注册 → 登录 → 看到 Dashboard + 侧边栏 |
| Task 14 完成 | 创建项目 → 选择角色 → 进入下一步 |
| Task 18 完成 | 完整 5 步 Wizard 可导航，前 3 步有真实 UI |
| Task 24 完成 | docker-compose up 启动所有基础设施 |
| Task 26 完成 | Phase 1 全部完成，核心流程可走通 |
| Task 32 完成 | Phase 2 完成，AI 能力接入 |
| Task 38 完成 | Phase 3 完成，音频能力 + 角色库 |
| Task 44 完成 | 全部完成，产品可上线 |
