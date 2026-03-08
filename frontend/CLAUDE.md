[根目录](../CLAUDE.md) > **frontend**

# Frontend 模块文档

## 变更记录 (Changelog)

- **2025-03-29 14:23:45** - 完整架构扫描，更新依赖与测试覆盖率统计
- **2026-03-08 18:01:49** - 更新文档，新增 Landing Page、BGM 功能、测试文件统计
- **2026-03-07 20:10:23** - 初始化前端模块文档

## 模块职责

React 19 单页应用，负责：
- 用户界面渲染（Landing Page、项目管理、照片上传、时间线编辑、视频生成）
- 状态管理（Zustand 全局状态 + React Query 服务端状态）
- API 调用（通过 Axios 与后端通信）
- 交互逻辑（拖拽排序、表单验证、实时反馈）

## 入口与启动

**主入口**: `src/main.tsx`
- 渲染根组件 `<App />`
- 挂载到 `#root` DOM 节点

**路由入口**: `src/App.tsx`
- 配置 React Router
- 定义路由守卫（ProtectedRoute / GuestRoute）
- 初始化 React Query Client

**启动命令**:
```bash
pnpm dev      # 开发服务器 (http://localhost:5173)
pnpm build    # 生产构建
pnpm preview  # 预览生产构建
pnpm lint     # ESLint 检查
pnpm test     # 运行测试
pnpm test:ui  # 测试 UI 界面
pnpm test:coverage  # 测试覆盖率
```

## 对外接口

### 页面路由

| 路径 | 组件 | 权限 | 功能 |
|------|------|------|------|
| `/` | `LandingPage` | 公开 | 产品介绍、功能展示 |
| `/login` | `LoginPage` | 游客 | 用户登录 |
| `/register` | `RegisterPage` | 游客 | 用户注册 |
| `/projects` | `ProjectsPage` | 认证 | 项目列表 |
| `/projects/:id` | `ProjectDetailPage` | 认证 | 项目详情（照片、脚本、视频） |
| `/settings` | `SettingsPage` | 认证 | AI 配置管理 |
| `/profile` | `ProfilePage` | 认证 | 用户资料 |
| `/community` | `CommunityPage` | 认证 | 社区模板（未实现） |

### API 客户端模块

**`src/api/`** - 封装后端 API 调用:
- `auth.ts` - 登录、注册、刷新令牌
- `projects.ts` - 项目 CRUD
- `photos.ts` - 照片上传、删除、排序
- `scripts.ts` - 脚本 CRUD、AI 生成
- `ai-configs.ts` - AI 配置管理
- `video-tasks.ts` - 视频任务创建、查询
- `bgm.ts` - BGM 管理

**基础配置**: `src/lib/axios.ts`
- Axios 实例配置
- 请求拦截器（自动添加 JWT）
- 响应拦截器（处理 401 自动刷新令牌）

## 关键依赖与配置

### 核心依赖

```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "react-router-dom": "^7.13.1",
  "@tanstack/react-query": "^5.90.21",
  "zustand": "^5.0.11",
  "axios": "^1.13.6",
  "@dnd-kit/core": "^6.3.1",
  "@dnd-kit/sortable": "^10.0.0",
  "react-hook-form": "^7.71.2",
  "zod": "^4.3.6",
  "lucide-react": "^0.577.0",
  "tailwindcss": "^4.2.1",
  "framer-motion": "^12.35.0"
}
```

### 构建配置

**`vite.config.ts`**:
- 插件: `@vitejs/plugin-react`, `@tailwindcss/vite`
- 路径别名: `@` → `./src`
- 开发代理: `/api` 和 `/uploads` 代理到 `http://localhost:8000`

**TypeScript 配置**:
- 严格模式启用
- 路径映射: `@/*` → `src/*`
- 目标: ES2020

## 数据模型

### 类型定义 (`src/types/index.ts`)

核心接口:
- `User` - 用户信息
- `Project` - 项目
- `Photo` - 照片
- `Scene` - 场景（脚本中的单个镜头）
- `ScriptContent` - 脚本内容（包含场景数组）
- `Script` - 脚本
- `VideoTask` - 视频任务
- `UserAiConfig` - AI 配置
- `BgmTrack` - BGM 音轨
- `AuthTokens` - 认证令牌
- `PaginatedResponse<T>` - 分页响应

### 状态管理

**Zustand Store** (`src/stores/auth.ts`):
```typescript
interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  login: (tokens: AuthTokens, user: User) => void
  logout: () => void
  updateTokens: (tokens: AuthTokens) => void
}
```

**React Query**:
- 用于服务端状态管理（项目、照片、脚本等）
- 自动缓存、重新验证、后台更新
- 配置: 5 分钟 staleTime，失败重试 1 次

## 测试与质量

**当前状态**: 有基础测试框架，但覆盖率不足
- `src/__tests__/setup.ts`: Vitest 配置
- `src/__tests__/stores/auth.test.ts`: 认证状态测试

**建议补充**:
- 组件测试: Vitest + React Testing Library
- E2E 测试: Playwright
- 类型检查: `tsc --noEmit`
- 覆盖目标: 80% 以上代码覆盖率

**ESLint 配置**:
- `eslint-plugin-react-hooks` - React Hooks 规则
- `eslint-plugin-react-refresh` - Fast Refresh 规则
- `typescript-eslint` - TypeScript 规则

## 常见问题 (FAQ)

**Q: 为什么禁止使用 `any` 类型?**
A: 项目规范要求严格类型安全。使用 `unknown` 或具体类型替代。

**Q: 如何添加新页面?**
A:
1. 在 `src/pages/` 创建页面组件
2. 在 `src/App.tsx` 添加路由
3. 如需认证，包裹在 `<ProtectedRoute>` 中

**Q: 如何调用后端 API?**
A:
1. 在 `src/api/` 创建 API 函数
2. 使用 `apiClient` (Axios 实例)
3. 在组件中通过 React Query 的 `useQuery` 或 `useMutation` 调用

**Q: 拖拽功能如何实现?**
A: 使用 `@dnd-kit` 库:
- `<DndContext>` 包裹拖拽区域
- `useSortable` hook 处理排序逻辑
- 参考 `TimelineEditor.tsx` 和 `SortableSceneCard.tsx`

**Q: 表单验证如何处理?**
A: 使用 `react-hook-form` + `zod`:
```typescript
const schema = z.object({ name: z.string().min(1) })
const { register, handleSubmit } = useForm({ resolver: zodResolver(schema) })
```

**Q: 如何添加动画效果?**
A: 使用 `framer-motion`:
```typescript
import { motion } from 'framer-motion'
<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>...</motion.div>
```

**Q: 如何处理文件上传?**
A: 使用 `react-dropzone`:
```typescript
const { getRootProps, getInputProps } = useDropzone({
  accept: { 'image/*': [] },
  onDrop: (files) => uploadMutation.mutate(files)
})
```

## 相关文件清单

```
frontend/
├── src/
│   ├── main.tsx                          # 应用入口
│   ├── App.tsx                           # 路由配置
│   ├── types/
│   │   └── index.ts                      # TypeScript 类型定义
│   ├── api/                              # API 客户端
│   │   ├── auth.ts
│   │   ├── projects.ts
│   │   ├── photos.ts
│   │   ├── scripts.ts
│   │   ├── ai-configs.ts
│   │   ├── video-tasks.ts
│   │   └── bgm.ts
│   ├── stores/
│   │   └── auth.ts                       # Zustand 认证状态
│   ├── hooks/
│   │   └── useAuth.ts                    # 认证 hook
│   ├── lib/
│   │   ├── axios.ts                      # Axios 配置
│   │   └── utils.ts                      # 工具函数
│   ├── pages/                            # 页面组件
│   │   ├── LandingPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── ProjectsPage.tsx
│   │   ├── ProjectDetailPage.tsx
│   │   ├── SettingsPage.tsx
│   │   ├── ProfilePage.tsx
│   │   └── CommunityPage.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   └── AppLayout.tsx             # 主布局
│   │   ├── landing/                      # Landing Page 组件
│   │   │   ├── LandingNav.tsx
│   │   │   ├── Hero.tsx
│   │   │   ├── Features.tsx
│   │   │   ├── HowItWorks.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── type.ts
│   │   ├── auth/
│   │   │   └── AuthModal.tsx
│   │   ├── ui/                           # 基础 UI 组件
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Dialog.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── Skeleton.tsx
│   │   ├── project/                      # 项目相关组件
│   │   │   ├── PhotosPanel.tsx
│   │   │   ├── ScriptPanel.tsx
│   │   │   ├── VideoPanel.tsx
│   │   │   ├── GenerateScriptDialog.tsx
│   │   │   ├── BgmPicker.tsx
│   │   │   └── ScenePreview.tsx
│   │   └── timeline/                     # 时间线编辑器
│   │       ├── TimelineEditor.tsx
│   │       ├── PhotoPool.tsx
│   │       ├── SortableSceneCard.tsx
│   │       └── SceneDetailPanel.tsx
│   └── __tests__/                        # 测试目录
│       ├── setup.ts
│       └── stores/
│           └── auth.test.ts
├── vite.config.ts                        # Vite 配置
├── vitest.config.ts                      # Vitest 配置
├── tsconfig.json                         # TypeScript 配置
├── package.json                          # 依赖管理
└── tailwind.config.js                    # Tailwind CSS 配置
```
