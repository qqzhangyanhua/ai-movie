# AI Movie Landing Page 实施计划

## 项目概述

**需求**：设计并实现高档次的首页，支持匿名访问，延迟登录触发

**核心目标**：
1. 默认进入首页（无需登录）
2. 只有操作时才触发登录行为
3. 高档次视觉设计（现代、专业、科技感）

---

## UI/UX 设计方案

### 页面结构

1. **Navigation Bar（吸顶导航）**
   - 左侧：Logo + AI Movie
   - 中间：功能特性、制作流程、社区作品、定价计划（锚点链接）
   - 右侧：登录、开始创作（Primary CTA）

2. **Hero Section（首屏视觉）**
   - Headline: "让每一张照片，讲述一段电影级的故事。"
   - Sub-headline: 只需上传照片，AI 自动生成脚本并合成专业级视频
   - Primary CTA: [立即免费开始] - 触发登录 Modal
   - Secondary CTA: [观看演示视频]
   - Visual: 深色渐变背景 + 照片→脚本→视频转换动画

3. **Social Proof（信任背书）**
   - 展示用户数量和视频数量
   - 合作伙伴 Logo 墙

4. **How it Works（制作流程）**
   - 三步法：上传素材 → AI 脚本创作 → 一键合成

5. **Core Features（核心特性）**
   - 智能文案助手（LLM Powered）
   - 海量电影级滤镜
   - 多语种配音
   - 云端即时协作

6. **Community Showcase（社区作品展示）**
   - 瀑布流展示优秀作品
   - 悬停播放预览

7. **Final CTA（底部转化）**
   - "准备好制作你的下一部大片了吗？"
   - [立即注册，立赠 10 分钟创作时长]

8. **Footer（页脚）**
   - 产品、资源、法律、社交媒体链接

### 视觉风格

**配色方案**：
- Primary: `#6366F1` (Indigo 600) - 科技、专业
- Background: `#0F172A` (Slate 900) - 深色电影感
- Accent: `#F43F5E` (Rose 500) - 高亮动作按钮
- Surface: `#1E293B` (Slate 800) - 卡片背景
- Text: `#F8FAFC` (Slate 50) - 高对比度文字

**字体**：
- Heading: Inter/Plus Jakarta Sans (Bold/Extra Bold)
- Body: Inter (Regular/Medium)

**间距 & 动效**：
- 大间距（py-24/py-32）营造呼吸感
- 圆角（rounded-2xl/rounded-3xl）
- framer-motion 实现淡入、上浮动画
- 按钮悬停缩放（scale-105）+ 外发光

### 交互流程

1. 匿名访问 `/` Landing Page
2. 体验 Demo 无需登录
3. 点击 "Start Creating" 触发：
   - 检查 Auth 状态
   - 未登录：弹出 AuthModal（支持 Google/GitHub 一键登录）
   - 已登录：直接进入 `/projects`
4. 延迟登录策略：允许首页尝试上传一张照片进行 AI 描述，保存时才提示注册

---

## 技术实施计划

### 1. 路由重构方案

**当前问题**：`/` 被 ProtectedRoute 保护，强制跳转 `/login`

**解决方案**：
```tsx
<Routes>
  {/* 公开路由 */}
  <Route path="/" element={<LandingPage />} />
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />

  {/* 受保护路由 */}
  <Route element={<ProtectedRoute />}>
    <Route path="/projects" element={<ProjectsPage />} />
    <Route path="/projects/:id" element={<ProjectDetailPage />} />
    <Route path="/settings" element={<SettingsPage />} />
  </Route>

  <Route path="/community" element={<CommunityPage />} />
</Routes>
```

**关键变更**：
- 移除 `/` 的 ProtectedRoute 包裹
- 保持 `/projects` 等工作台路由的保护
- 已登录用户访问 `/` 时，Hero 区域显示"进入工作台"

### 2. 文件变更清单

**新建文件**：
- `src/pages/LandingPage.tsx` - 主页面聚合器
- `src/components/landing/LandingNav.tsx` - 导航栏
- `src/components/landing/Hero.tsx` - 首屏视觉
- `src/components/landing/Features.tsx` - 特性展示
- `src/components/landing/HowItWorks.tsx` - 制作流程
- `src/components/landing/Showcase.tsx` - 社区作品
- `src/components/landing/Footer.tsx` - 页脚
- `src/components/landing/type.ts` - Landing 相关类型定义
- `src/components/auth/AuthModal.tsx` - 延迟登录弹窗

**修改文件**：
- `src/App.tsx` - 路由逻辑调整
- `src/types/index.ts` - 新增 Landing 相关接口
- `src/stores/auth.ts` - 增加 AuthModal 状态管理
- `src/index.css` - 自定义动画类

### 3. 组件实现优先级

**Phase 1: 基础设施**
- 安装 framer-motion: `pnpm add framer-motion`
- 定义类型（type.ts）
- 调整路由（App.tsx）

**Phase 2: 页面骨架**
- LandingPage.tsx 布局框架
- LandingNav 和 Footer 静态实现

**Phase 3: 核心内容**
- Hero 视觉实现（静态）
- Features 和 HowItWorks 静态内容

**Phase 4: 交互与延迟登录**
- 实现 AuthModal
- 绑定 Hero CTA 到 Modal
- 集成登录/注册 API

**Phase 5: 视觉增强**
- framer-motion 滚动动画
- 背景渐变动效
- 悬停交互优化

### 4. 状态管理调整

**扩展 auth.ts**：
```typescript
interface AuthState {
  // ... existing fields
  isAuthModalOpen: boolean
  setAuthModalOpen: (open: boolean) => void
  postLoginAction?: () => void
  setPostLoginAction: (action?: () => void) => void
}
```

**用途**：
- `isAuthModalOpen`: 控制 AuthModal 显示/隐藏
- `postLoginAction`: 登录成功后的回调（如：点击生成视频 → 触发登录 → 登录后执行生成）

### 5. API 集成点

1. **Showcase 组件**：
   - 调用 `GET /api/projects/public` 或 `GET /api/community/featured`
   - 获取优秀视频列表

2. **AuthModal**：
   - 集成 `/api/auth/login` 和 `/api/auth/register`
   - 登录成功后更新全局状态并关闭 Modal

### 6. 响应式实现策略

**Tailwind 断点规范**：
- `container mx-auto px-4`: 基础容器
- `grid-cols-1 md:grid-cols-3`: 移动端单列，桌面端三列
- `hidden lg:block`: 仅桌面端显示的装饰性元素

**移动端适配**：
- Mobile (375px-640px): 导航变 Burger Menu，Hero 文字居中，Feature 单列
- Tablet (768px-1024px): Feature 双列，Hero 上下堆叠
- Desktop (1280px+): 全宽展示，内容限制 max-w-7xl

### 7. 动效实现方案

**framer-motion 使用**：
- Fade In Up: 区块进入视口时浮现
- Layout Animation: AuthModal 展开/收缩
- Hover Effects: 按钮和卡片轻微缩放

**示例代码**：
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
>
  {/* 内容 */}
</motion.div>
```

### 8. 风险点与解决方案

| 风险点 | 解决方案 |
|--------|----------|
| 首屏加载过慢 | 使用 WebP/Avif 格式图片；Hero 背景视频采用 poster 占位 + lazy load |
| SEO 弱化 | 确保语义化 HTML (h1-h3) 和 Meta Description |
| 登录 Modal 复杂性 | 保持 Modal 逻辑简单，复杂操作引导至独立 /login 页面 |
| React 19 兼容性 | 避免已弃用生命周期；利用编译优化保持组件轻量 |

---

## 实施步骤

### Step 1: 安装依赖
```bash
cd frontend
pnpm add framer-motion
```

### Step 2: 调整路由
修改 `src/App.tsx`，移除 `/` 的 ProtectedRoute 包裹

### Step 3: 创建类型定义
在 `src/components/landing/type.ts` 定义 Landing 相关接口

### Step 4: 实现基础组件
按优先级实现：LandingNav → Footer → Hero → Features → HowItWorks → Showcase

### Step 5: 实现 AuthModal
创建 `src/components/auth/AuthModal.tsx`，集成登录/注册逻辑

### Step 6: 扩展 auth store
在 `src/stores/auth.ts` 添加 `isAuthModalOpen` 和 `postLoginAction`

### Step 7: 集成 API
- Showcase 调用社区作品 API
- AuthModal 调用登录/注册 API

### Step 8: 视觉优化
- 添加 framer-motion 动画
- 优化响应式布局
- 添加悬停交互

### Step 9: 测试验证
- 匿名访问 `/` 正常显示
- 点击 CTA 触发 AuthModal
- 登录后正确跳转 `/projects`
- 移动端布局正常

---

## Hero Section 代码示例

```tsx
import { motion } from 'framer-motion'
import { Play, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'

export const Hero = () => {
  const { setAuthModalOpen, isAuthenticated } = useAuthStore()

  return (
    <section className="relative pt-32 pb-20 overflow-hidden bg-slate-900">
      {/* 背景光晕装饰 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent" />

      <div className="container relative z-10 px-4 mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6">
            让每一张照片，<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-rose-400">
              讲述一段电影级的故事
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-slate-400 mb-10">
            只需上传照片，AI 自动生成脚本并合成专业级视频。从灵感到成品，仅需数秒。
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <a
                href="/projects"
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-semibold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/25"
              >
                <Sparkles size={20} />
                进入工作台
              </a>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-semibold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/25"
              >
                <Sparkles size={20} />
                立即免费开始
              </button>
            )}
            <button className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-semibold flex items-center gap-2 transition-all">
              <Play size={20} />
              观看演示
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
```

---

## 下一步行动

1. 确认计划是否符合预期
2. 选择执行方式：
   - **开始实施** - 进入执行阶段
   - **讨论调整** - 修改计划细节
   - **重新规划** - 重新设计方案
   - **仅保存计划** - 稍后实施
