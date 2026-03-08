# AI 微电影平台 - 完全重写设计文档

**日期**：2026-03-08
**状态**：已批准
**目标**：按照 PRD 完全重写项目，实现六大模块，技术栈升级为 Next.js 全栈 + Python AI Worker

---

## 1. 背景与目标

### 现状
项目已有基础实现（React SPA + FastAPI），覆盖了认证、项目管理、照片管理、剧本生成、BGM 管理和基础视频合成。但与 PRD 存在重大差距：
- 缺少角色系统（人脸识别、三视图、embedding、角色库）
- 缺少 AI 视频生成（当前仅 FFmpeg 图片拼接）
- 缺少分镜系统的完整设计（镜头类型、角色动作）
- 缺少后期制作（配音、字幕、自动剪辑）
- 缺少视频输出完整功能（分享、封面、时长选择）
- 缺少会员体系

### 决策
- 完全重写，不保留现有代码
- 技术栈升级为 Next.js 15 全栈 + Python AI Worker
- 目标实现 PRD 完整六大模块

---

## 2. 技术架构

### 2.1 整体架构

```
用户浏览器
    │
    ▼
Next.js 15 (App Router)
├── React Pages (RSC + Client Components)
├── Server Actions (数据变更)
├── API Routes (外部接口)
└── Prisma ORM (类型安全数据库访问)
    │
    ├── PostgreSQL (数据存储)
    ├── Redis (缓存 + 队列)
    └── S3/R2 (文件存储)
         │
    BullMQ (Node 侧入队)
         │
         ▼
    Redis Queue
         │
         ▼
Python AI Worker (Docker)
├── LLM Service (剧本生成)
├── Character Service (人脸/三视图/embedding)
├── Video Service (AI 视频生成)
├── Voice Service (TTS 配音)
├── Music Service (背景音乐)
└── FFmpeg (视频合成/后期)
```

### 2.2 关键技术选型

| 层 | 技术 | 理由 |
|---|------|------|
| 前端框架 | Next.js 15 + React 19 | SSR/SSG、App Router、类型共享 |
| ORM | Prisma | 类型安全、迁移管理 |
| 认证 | Auth.js v5 (NextAuth) | 开箱即用、JWT + Session |
| 任务队列 | BullMQ (Node) → Python Worker (redis-py) | Node 入队，Python 消费 |
| 实时推送 | Server-Sent Events (SSE) | 轻量、适合单向推送任务进度 |
| 文件存储 | S3 兼容存储 (R2/MinIO) | presigned URL 直传 |
| 样式 | Tailwind CSS v4 + shadcn/ui | 类型安全、组件库丰富 |
| 测试 | Vitest + Playwright + pytest | 全栈测试覆盖 |

### 2.3 Node ↔ Python 通信

Next.js 通过 BullMQ 向 Redis 发送任务消息，Python Worker 通过 redis-py 消费队列。任务结果写回 Redis + 更新数据库（Python 直连 PostgreSQL），Next.js 通过 SSE 轮询 Redis 推送给前端。

---

## 3. 数据模型

### 3.1 核心实体

```prisma
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
}

enum Plan { FREE, MONTHLY, YEARLY }

model Project {
  id          String        @id @default(cuid())
  userId      String
  title       String
  description String?
  status      ProjectStatus @default(DRAFT)
  coverUrl    String?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  user        User          @relation(fields: [userId], references: [id])
  characters  ProjectCharacter[]
  script      Script?
  storyboards Storyboard[]
  videos      Video[]
}

enum ProjectStatus {
  DRAFT, SCRIPT_READY, STORYBOARD_READY, GENERATING, COMPLETED, FAILED
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
  user          User      @relation(fields: [userId], references: [id])
  projects      ProjectCharacter[]
}

model ProjectCharacter {
  id           String    @id @default(cuid())
  projectId    String
  characterId  String
  relationship String?
  roleName     String?
  project      Project   @relation(fields: [projectId], references: [id])
  character    Character @relation(fields: [characterId], references: [id])
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
  project     Project    @relation(fields: [projectId], references: [id])
}

enum ScriptType { TEMPLATE, AI_GENERATED, CUSTOM }

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
  project      Project   @relation(fields: [projectId], references: [id])
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
  storyboard    Storyboard @relation(fields: [storyboardId], references: [id])
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
  project       Project    @relation(fields: [projectId], references: [id])
}

enum TaskStatus { PENDING, PROCESSING, COMPLETED, FAILED }
```

### 3.2 PRD 对齐说明

| PRD 表 | 设计 | 改进 |
|--------|------|------|
| User | User + Plan 枚举 | 增加会员体系 |
| Character | Character + ProjectCharacter | 角色库跨项目复用 + 三视图 + embedding |
| Project | Project + 状态机 | 状态流转清晰 |
| Script | Script + 类型枚举 | 模板/AI/自定义 |
| Storyboard | Storyboard + VideoClip | 分镜与视频片段一对一 |
| Video | Video | 包含字幕、配音、BGM |

---

## 4. 页面结构与创作流程

### 4.1 路由设计

```
/                          → 首页 Landing
/login                     → 登录
/register                  → 注册
/dashboard                 → 我的电影
/dashboard/characters      → 我的角色库
/dashboard/templates       → 模板库
/create                    → 创建项目
/create/[projectId]        → 创作工作台 (Wizard)
  ├── step=characters      → 角色管理
  ├── step=script          → 剧本选择与编辑
  ├── step=storyboard      → 分镜生成与编辑
  ├── step=generate        → 视频生成进度
  └── step=result          → 结果页
/movie/[videoId]           → 公开分享页
/settings                  → 用户设置
```

### 4.2 核心创作流程

```
角色管理(1) → 剧本选择(2) → 分镜生成(3) → 视频生成(4) → 结果展示(5)
```

每步完成后才能进入下一步，可回退修改。项目状态自动跟随步骤更新。

### 4.3 各步骤交互

**步骤 1 - 角色管理**：从角色库选择或新建，上传照片→人脸检测→三视图生成→设置属性，设置角色间关系。

**步骤 2 - 剧本选择**：模板剧本/AI 生成/自定义，剧本编辑器，AI 根据角色自动填充。

**步骤 3 - 分镜生成**：AI 根据剧本生成分镜列表，可编辑/删除/新增/重新生成，分镜预览图。

**步骤 4 - 视频生成**：整体进度展示，每个分镜独立生成，SSE 实时推送。

**步骤 5 - 结果展示**：播放器、下载、分享链接、重新生成、电影海报。

---

## 5. AI 服务层

### 5.1 服务模块

| 服务 | 职责 | 推荐技术 |
|------|------|---------|
| LLM Service | 剧本生成、对白 | GPT-4o / Claude / DeepSeek |
| Character Service | 人脸识别、三视图、embedding | InstantID + Zero123 |
| Video Service | 分镜视频片段 | Runway Gen-3 / Kling / Sora |
| Voice Service | 角色配音 | ElevenLabs / OpenAI TTS |
| Music Service | 背景音乐 | Suno / Udio |

### 5.2 视频合成流水线

```
分镜视频片段 → 拼接+转场 → 叠加配音 → 混入BGM → 渲染字幕 → 输出
```

### 5.3 任务队列

```
任务类型：
├── character:generate     → 角色三视图 + embedding
├── script:generate        → AI 剧本
├── storyboard:generate    → AI 分镜
├── storyboard:preview     → 分镜预览图
├── video:clip             → 单个分镜视频
├── voice:generate         → 配音
├── music:generate         → 背景音乐
└── video:compose          → 最终合成
```

依赖关系形成 DAG，video:compose 等待所有上游任务完成。

### 5.4 错误处理

- 每个任务最多重试 3 次，指数退避
- 单个分镜失败不影响其他分镜
- 用户可手动重新生成失败任务
- 超时：视频 10 分钟，其他 5 分钟

---

## 6. 前端组件架构

### 6.1 组件分类

```
components/
├── ui/           → shadcn/ui 基础组件
├── character/    → CharacterCard, CharacterUploader, CharacterEditor, CharacterPicker
├── script/       → ScriptTemplateGrid, ScriptEditor, ScriptGenerator
├── storyboard/   → StoryboardList, StoryboardCard, StoryboardEditor
├── video/        → VideoPlayer, ProgressTracker, ShareDialog
└── wizard/       → CreationWizard, StepIndicator
```

### 6.2 状态管理

- 服务端：React Server Components + Server Actions
- 客户端：Zustand（Wizard 步骤、编辑器临时状态）
- 实时：useTaskProgress hook (SSE)

---

## 7. 测试策略

| 层级 | 工具 | 覆盖范围 |
|------|------|---------|
| 单元测试 | Vitest | 工具函数、hooks、Server Actions |
| 组件测试 | Vitest + Testing Library | 核心组件 |
| API 测试 | Vitest | API Route Handlers |
| E2E 测试 | Playwright | 核心用户流程 |
| Python | pytest | AI 服务、FFmpeg 合成 |

---

## 8. 项目结构

```
ai-movie/
├── app/              → Next.js App Router
├── components/       → React 组件
├── lib/              → 工具库 (prisma, auth, storage, queue, sse)
├── hooks/            → 自定义 hooks
├── prisma/           → Schema + 迁移
├── public/           → 静态资源
├── worker/           → Python AI Worker
│   ├── services/     → AI 服务模块
│   ├── tasks/        → 任务处理
│   ├── utils/        → FFmpeg 工具
│   ├── requirements.txt
│   └── Dockerfile
├── tests/            → 测试
├── docker-compose.yml
├── package.json
├── tailwind.config.ts
└── next.config.ts
```

---

## 9. 实施优先级

按 PRD 功能优先级分阶段实施：

**Phase 1 (P0)**：基础设施 + 角色生成 + 模板剧本 + 视频生成 + 30 秒微电影
**Phase 2 (P1)**：AI 剧本生成 + 分镜编辑 + 字幕
**Phase 3 (P2)**：AI 配音 + 音乐生成 + 角色库
**Phase 4**：会员体系 + 分享系统 + 电影海报
