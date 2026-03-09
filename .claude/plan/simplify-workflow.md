# 📋 实施计划：简化 AI Movie 创作流程（5步→2步）

## 任务类型
- [x] 前端 (→ Gemini)
- [x] 后端 (→ Codex)
- [x] 全栈 (→ 并行)

## 核心目标

将用户创作流程从 5 步简化到 2 步：
- **当前流程**：选角色 → 生成脚本 → 编辑分镜 → 生成视频 → 查看结果
- **目标流程**：上传照片 → 一键生成视频

## 技术方案（综合 Codex + Gemini 分析）

### 方案选择：混合模式（推荐）
基于双模型分析，采用"快速创建 + 高级编辑"混合方案：

1. **默认路径**：2 步快速创建（面向 80% 普通用户）
   - 上传照片 + 输入描述 → 后台自动生成 → 查看结果

2. **高级路径**：保留完整编辑器（面向 20% 专业用户）
   - 生成后可进入"编辑模式"调整脚本/分镜
   - 历史项目仍可访问完整编辑功能

### 架构改造重点

#### 1. 数据库重构（Codex 主导）
```prisma
// 简化 User 表 - 添加配额字段
model User {
  // 原有字段...
  plan              Plan     @default(FREE)

  // 新增配额字段
  videosRemaining   Int      @default(3)      // 本月剩余视频数
  videosUsed        Int      @default(0)      // 本月已用视频数
  storageUsed       Int      @default(0)      // 已用存储（MB）
  storageLimit      Int      @default(100)    // 存储上限（MB）
  maxResolution     String   @default("720p") // 最大分辨率
  quotaResetAt      DateTime @default(now())  // 配额重置时间
}

// 简化 Character 表 - 删除无用字段
model Character {
  id           String   @id @default(cuid())
  userId       String
  name         String
  photoUrl     String
  // 删除：frontViewUrl, sideViewUrl, backViewUrl, embedding
  personality  String?
  style        String?
  createdAt    DateTime @default(now())
}

// 合并 Storyboard + VideoClip
model Scene {
  id          String     @id @default(cuid())
  projectId   String
  sceneNumber Int
  description String
  characters  String[]
  action      String?
  cameraType  String?
  duration    Int        @default(5)

  // 合并 VideoClip 字段
  imageUrl     String?
  videoUrl     String?
  status       TaskStatus @default(PENDING)
  progress     Int        @default(0)
  errorMessage String?

  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

// 删除 ServiceConfig 表（改为系统级环境变量）
// 删除 VideoClip 表（已合并到 Scene）
```

#### 2. API 简化（Codex 主导）
新增核心 API：
```typescript
// POST /api/projects/quick-create
interface QuickCreateRequest {
  title: string;
  description?: string;
  photos: File[];        // 照片列表
  template?: string;     // 模板类型（默认 "memory"）
  bgmPreference?: string; // BGM 偏好
}

interface QuickCreateResponse {
  projectId: string;
  jobId: string;         // 异步任务 ID
  status: "QUEUED";
}
```

#### 3. 前端优化（Gemini 主导）
```typescript
// 新增快速创建组件
components/
  quick-create/
    QuickCreateForm.tsx      // 上传照片 + 输入描述
    QuickCreateProgress.tsx  // 实时进度展示
    QuickCreateResult.tsx    // 结果预览

// 简化向导（保留但改为可选）
components/wizard/
  CreationWizard.tsx         // 改为"高级编辑模式"
  steps/
    // 删除 CharacterStep（角色自动识别）
    ScriptStep.tsx           // 保留（编辑模式）
    StoryboardStep.tsx       // 保留（编辑模式）
    GenerateStep.tsx         // 保留（编辑模式）
    ResultStep.tsx           // 保留（编辑模式）
```

## 实施步骤

### Phase 1：数据库重构（优先级：P0）
**负责模型**：Codex
**预期产物**：迁移脚本 + 新 schema

1. 创建数据库迁移脚本
   - 文件：`prisma/migrations/xxx_simplify_schema.sql`
   - 操作：
     - User 表添加配额字段
     - Character 表删除无用字段
     - 创建 Scene 表（合并 Storyboard + VideoClip）
     - 数据迁移：Storyboard + VideoClip → Scene
     - 删除 ServiceConfig 表（先备份数据）

2. 更新 Prisma schema
   - 文件：`prisma/schema.prisma`
   - 操作：应用上述数据模型变更

3. 生成 Prisma Client
   ```bash
   pnpm prisma generate
   pnpm prisma migrate dev --name simplify-schema
   ```

4. 验证迁移
   - 运行迁移脚本
   - 检查数据完整性
   - 确保历史项目可读

### Phase 2：会员配额系统（优先级：P0）
**负责模型**：Codex
**预期产物**：配额中间件 + 扣减逻辑

1. 实现配额检查中间件
   - 文件：`lib/middleware/quota-check.ts`
   - 功能：
     - 检查用户剩余视频数
     - 检查存储空间
     - 检查分辨率权限
     - 返回清晰的错误信息

2. 实现配额扣减逻辑
   - 文件：`lib/actions/quota.ts`
   - 功能：
     - `deductVideoQuota(userId)` - 扣减视频配额
     - `addStorageUsage(userId, size)` - 增加存储用量
     - `resetMonthlyQuota(userId)` - 重置月度配额
     - 事务保证（先扣后返）

3. 更新会员权益定义
   - 文件：`lib/constants/plans.ts`
   ```typescript
   export const PLAN_LIMITS = {
     FREE: {
       videosPerMonth: 3,
       storageLimit: 100,      // MB
       maxResolution: "720p",
       features: ["基础模板", "水印"]
     },
     MONTHLY: {
       videosPerMonth: 30,
       storageLimit: 5120,     // 5GB
       maxResolution: "1080p",
       features: ["所有模板", "无水印", "优先队列"]
     },
     YEARLY: {
       videosPerMonth: -1,     // 无限
       storageLimit: 51200,    // 50GB
       maxResolution: "4K",
       features: ["所有模板", "无水印", "优先队列", "API 访问"]
     }
   };
   ```

4. 在关键入口添加配额校验
   - `POST /api/projects/quick-create` - 创建前检查
   - `POST /api/upload` - 上传前检查存储
   - `POST /api/video/generate` - 生成前检查配额

### Phase 3：快速创建 API（优先级：P0）
**负责模型**：Codex
**预期产物**：统一异步任务编排

1. 实现快速创建 API
   - 文件：`app/api/projects/quick-create/route.ts`
   - 功能：
     - 接收照片 + 描述
     - 创建项目
     - 触发异步任务链
     - 返回 projectId + jobId

2. 实现异步任务编排
   - 文件：`lib/tasks/quick-create-pipeline.ts`
   - 流程：
     ```
     1. 上传照片到存储
     2. AI 识别照片中的人物/场景
     3. 生成脚本（调用 LLM）
     4. 生成分镜（基于脚本）
     5. 选择 BGM（基于场景情绪）
     6. 合成视频（FFmpeg）
     7. 更新项目状态
     ```
   - 状态机：`QUEUED → PROCESSING → COMPLETED / FAILED`

3. 实现进度推送
   - 文件：`app/api/projects/[projectId]/progress/route.ts`
   - 功能：
     - SSE 实时推送进度
     - 返回当前步骤 + 进度百分比
     - 错误时返回详细信息

4. 错误处理与重试
   - 失败自动重试（最多 3 次）
   - 失败后返还配额
   - 记录详细错误日志

### Phase 4：前端快速创建 UI（优先级：P0）
**负责模型**：Gemini
**预期产物**：2 步创建流程

1. 创建快速创建表单
   - 文件：`components/quick-create/QuickCreateForm.tsx`
   - 功能：
     - 照片上传（拖拽 + 点击）
     - 照片预览（缩略图网格）
     - 项目描述输入
     - 模板选择（可选）
     - 一键提交

2. 创建进度展示组件
   - 文件：`components/quick-create/QuickCreateProgress.tsx`
   - 功能：
     - 实时进度条
     - 当前步骤提示（"正在生成脚本..."）
     - 预计剩余时间
     - 取消按钮

3. 创建结果预览组件
   - 文件：`components/quick-create/QuickCreateResult.tsx`
   - 功能：
     - 视频播放器
     - 下载按钮
     - 分享按钮
     - "进入编辑模式"按钮（可选）

4. 更新 Dashboard 入口
   - 文件：`app/(auth)/dashboard/page.tsx`
   - 改动：
     - 添加"快速创建"大按钮（主 CTA）
     - 保留"高级创建"入口（次要）
     - 显示配额使用情况

### Phase 5：简化创建向导（优先级：P1）
**负责模型**：Gemini
**预期产物**：向导改为"编辑模式"

1. 重构 CreationWizard
   - 文件：`components/wizard/CreationWizard.tsx`
   - 改动：
     - 改名为 `EditWizard`
     - 只在"编辑模式"下显示
     - 删除 CharacterStep

2. 更新步骤流程
   - 删除：`components/wizard/steps/CharacterStep.tsx`
   - 保留：ScriptStep, StoryboardStep, GenerateStep, ResultStep
   - 新增：从快速创建结果进入编辑模式的入口

3. 更新路由
   - `/create` → 快速创建页面
   - `/create/[projectId]` → 快速创建进度页
   - `/edit/[projectId]` → 高级编辑模式（原向导）

### Phase 6：配额 UI 展示（优先级：P1）
**负责模型**：Gemini
**预期产物**：清晰的配额展示

1. 更新使用统计组件
   - 文件：`components/subscription/UsageStats.tsx`
   - 改动：
     - 显示"本月剩余视频数"
     - 显示"存储使用情况"（进度条）
     - 显示"下次重置时间"

2. 更新会员卡片
   - 文件：`components/subscription/PlanCard.tsx`
   - 改动：
     - 清晰展示权益对比表
     - 突出显示配额差异

3. 添加配额不足提示
   - 创建：`components/subscription/QuotaExceededDialog.tsx`
   - 功能：
     - 配额不足时弹窗提示
     - 引导升级会员
     - 显示下次重置时间

### Phase 7：删除冗余代码（优先级：P2）
**负责模型**：Codex
**预期产物**：清理技术债

1. 删除 ServiceConfig 相关代码
   - 删除：`lib/actions/service-config.ts`
   - 删除：`components/settings/ServiceConfigForm.tsx`
   - 删除：`components/settings/ServiceConfigList.tsx`
   - 删除：`types/service-config.ts`
   - 删除：`lib/validations/service-config.ts`

2. 删除 Character 多视角相关代码
   - 更新：`components/character/CharacterDetailDialog.tsx`（删除三视图展示）
   - 更新：`components/character/CharacterUploader.tsx`（只保留单张上传）

3. 删除旧的视频生成逻辑
   - 删除：`lib/actions/video.ts` 中的 `simulateVideoCompletion`
   - 统一使用：`lib/actions/generate-video.ts`

4. 更新 API 路由
   - 删除：`app/api/service-config/**`
   - 简化：`app/api/upload/route.ts`（添加配额检查）

## 关键文件

| 文件 | 操作 | 说明 | 负责模型 |
|------|------|------|----------|
| `prisma/schema.prisma` | 重构 | 简化数据模型 | Codex |
| `prisma/migrations/xxx_simplify_schema.sql` | 创建 | 数据迁移脚本 | Codex |
| `lib/middleware/quota-check.ts` | 创建 | 配额检查中间件 | Codex |
| `lib/actions/quota.ts` | 创建 | 配额扣减逻辑 | Codex |
| `lib/constants/plans.ts` | 创建 | 会员权益定义 | Codex |
| `app/api/projects/quick-create/route.ts` | 创建 | 快速创建 API | Codex |
| `lib/tasks/quick-create-pipeline.ts` | 创建 | 异步任务编排 | Codex |
| `app/api/projects/[projectId]/progress/route.ts` | 修改 | 进度推送 API | Codex |
| `components/quick-create/QuickCreateForm.tsx` | 创建 | 快速创建表单 | Gemini |
| `components/quick-create/QuickCreateProgress.tsx` | 创建 | 进度展示 | Gemini |
| `components/quick-create/QuickCreateResult.tsx` | 创建 | 结果预览 | Gemini |
| `app/(auth)/dashboard/page.tsx` | 修改 | 添加快速创建入口 | Gemini |
| `components/wizard/CreationWizard.tsx` | 重构 | 改为编辑模式 | Gemini |
| `components/wizard/steps/CharacterStep.tsx` | 删除 | 不再需要 | Gemini |
| `components/subscription/UsageStats.tsx` | 修改 | 显示配额信息 | Gemini |
| `components/subscription/QuotaExceededDialog.tsx` | 创建 | 配额不足提示 | Gemini |
| `lib/actions/service-config.ts` | 删除 | 改为系统配置 | Codex |
| `components/settings/ServiceConfigForm.tsx` | 删除 | 不再需要 | Gemini |
| `components/settings/ServiceConfigList.tsx` | 删除 | 不再需要 | Gemini |

## 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 数据迁移失败 | 高 | 1. 先在测试环境验证<br>2. 备份生产数据<br>3. 准备回滚脚本<br>4. 分批迁移 |
| 历史项目不兼容 | 中 | 1. 保留旧表结构一段时间<br>2. 提供数据转换工具<br>3. 兼容期内双写 |
| 配额扣减错误 | 高 | 1. 使用数据库事务<br>2. 失败自动返还<br>3. 记录详细日志<br>4. 添加监控告警 |
| 异步任务失败 | 中 | 1. 自动重试机制（最多 3 次）<br>2. 失败返还配额<br>3. 详细错误日志<br>4. 用户友好的错误提示 |
| 用户不适应新流程 | 低 | 1. 保留"高级编辑"入口<br>2. 添加引导提示<br>3. 灰度发布<br>4. 收集用户反馈 |
| 存储空间计算错误 | 中 | 1. 上传时精确计算文件大小<br>2. 定期校准存储用量<br>3. 添加缓冲空间（10%） |
| AI 生成质量下降 | 中 | 1. 保留编辑模式兜底<br>2. 收集生成失败案例<br>3. 持续优化 prompt<br>4. A/B 测试不同策略 |

## 测试策略

### 单元测试
- 配额扣减逻辑（`lib/actions/quota.ts`）
- 会员权益计算（`lib/constants/plans.ts`）
- 数据迁移脚本验证

### 集成测试
- 快速创建完整流程
- 配额检查中间件
- 异步任务编排
- 进度推送 SSE

### E2E 测试
- 用户注册 → 快速创建 → 生成视频 → 下载
- 配额耗尽 → 升级会员 → 继续创建
- 生成失败 → 重试 → 成功
- 快速创建 → 进入编辑模式 → 修改 → 重新生成

### 性能测试
- 并发创建压力测试
- 大文件上传测试
- 异步任务队列性能
- 数据库查询优化

## 上线计划

### 阶段 1：灰度发布（10% 用户）
- 开启快速创建功能
- 保留旧流程作为备选
- 收集用户反馈
- 监控错误率和性能

### 阶段 2：扩大灰度（50% 用户）
- 修复阶段 1 发现的问题
- 优化生成质量
- 调整配额策略

### 阶段 3：全量发布（100% 用户）
- 快速创建成为默认流程
- 旧流程改为"高级编辑"
- 开始清理冗余代码

### 阶段 4：技术债清理
- 删除 ServiceConfig 表
- 删除 VideoClip 表
- 删除 Character 无用字段
- 清理旧代码

## 回滚方案

如果上线后出现严重问题，按以下步骤回滚：

1. 关闭快速创建入口（前端配置）
2. 恢复旧流程为默认
3. 停止异步任务队列
4. 回滚数据库迁移（如果已执行）
5. 恢复旧版本代码

## 成功指标

- 用户创建视频的平均时间 < 60 秒
- 快速创建成功率 > 95%
- 用户满意度（NPS）> 80%
- 付费转化率提升 > 20%
- 配额扣减准确率 = 100%
- 存储计算误差 < 1%

## SESSION_ID（供 /ccg:execute 使用）

- **CODEX_SESSION**: `019cd090-14f4-7193-874f-e35dd852b93f`
- **GEMINI_SESSION**: `bed9497b-292b-4a07-971b-30ca0169d653`

## 预计工作量

- Phase 1（数据库重构）：2-3 天
- Phase 2（配额系统）：2-3 天
- Phase 3（快速创建 API）：3-4 天
- Phase 4（前端 UI）：3-4 天
- Phase 5（简化向导）：1-2 天
- Phase 6（配额 UI）：1-2 天
- Phase 7（清理代码）：1-2 天
- 测试与修复：3-5 天

**总计**：16-25 天（约 3-5 周）

## 依赖项

- Prisma 迁移工具
- 异步任务队列（Celery/BullMQ）
- SSE 支持（Next.js API Routes）
- 文件存储（本地/S3）
- LLM API（脚本生成）
- FFmpeg（视频合成）

## 注意事项

1. **数据迁移必须可回滚**：准备完整的回滚脚本
2. **配额扣减必须事务化**：避免重复扣减或漏扣
3. **异步任务必须幂等**：支持重试不会产生副作用
4. **错误信息必须友好**：用户能理解并知道如何解决
5. **性能监控必须到位**：及时发现瓶颈和异常
6. **灰度发布必须谨慎**：先小范围验证再全量
7. **保留编辑模式**：给高级用户提供精细控制能力
8. **文档必须同步更新**：API 文档、用户手册、开发文档
