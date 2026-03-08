# AI Movie 平台 MVP 完善实施计划

## 📋 任务概述

**目标**：将 AI Movie 平台从晚期 Alpha 阶段提升至可发布的 MVP 状态

**当前评分**：60/100
- 核心技术：85/100（架构完整）
- 用户体验：40/100（缺少关键功能）
- 商业可行性：30/100（无变现机制）
- 生产就绪度：50/100（安全和存储问题）

**目标评分**：85/100（MVP 标准）

---

## 🎯 任务类型

- [x] 后端 (→ Codex)
- [x] 前端 (→ Gemini)
- [x] 全栈 (→ 并行)

---

## 🔍 核心发现（基于代码审计）

### Codex 后端分析（权威）

**安全漏洞（🔴 P0）**：
1. `script_id` 未校验归属关系，存在跨租户引用风险
2. `/uploads` 静态资源全量公开，私有素材可被直接访问
3. 取消任务只改数据库状态，不终止 Celery/FFmpeg 进程

**存储抽象断层（🔴 P0）**：
1. 视频生成完全走本地路径，未使用 `StorageProvider`
2. BGM 上传绕过存储抽象直写本地
3. 照片虽走存储抽象，但前端硬编码 `/uploads/` 拼接 URL

**性能瓶颈（🟡 P1）**：
1. 视频生成：N+1 查询 + 串行 FFmpeg
2. 前端轮询 5 秒间隔，任务量增加会放大 API 压力

**可观测性不足（🟡 P1）**：
1. 缺少队列深度、任务耗时、失败率等指标
2. 测试覆盖率极低（仅 2 个测试文件）

### Gemini 前端分析（权威）

**视频消费缺失（🟡 P1）**：
1. 有下载按钮但无视频播放器，用户无法预览
2. 视频 URL 硬编码为 `/uploads/${path}`，阻碍 S3 迁移

**实时反馈差（🟡 P1）**：
1. 5 秒轮询延迟高，用户体验差
2. 应改为 WebSocket/SSE 实现真正的实时更新

**时间线体验（🟢 P2）**：
1. `ScenePreview` 是全屏 modal，应改为 side-panel
2. 实现"边编辑边预览"的导演模式

**错误处理弱（🟡 P1）**：
1. 只显示字符串错误消息
2. 应提供可操作的修复建议（如"重新上传照片"）

---

## 📐 技术方案

### 方案选择（基于 Linus 原则）

**Never Break Userspace**：
- 先修安全漏洞，防止数据泄露
- 统一存储抽象，避免二次改造

**Good Taste**：
- 消除特殊情况：视频/BGM/照片统一走 `StorageProvider`
- 前端不再硬编码 `/uploads/`，后端返回完整 URL

**Simplicity**：
- 视频播放用 HTML5 `<video>` 标签，不过度设计
- 实时更新先优化轮询（降低间隔 + 条件触发），再引入 WebSocket

---

## 🚀 实施步骤

### 阶段 1：立即修复（本周，🔴 P0）

**目标**：修复安全漏洞和数据一致性问题

#### 1.1 后端安全加固（→ Codex）

**文件**：`backend/app/api/video_tasks.py`

**修改内容**：
```python
# 第 29-34 行：严格校验 script_id 归属
script_result = await db.execute(
    select(Script).where(
        Script.id == payload.script_id,
        Script.project_id == payload.project_id  # 新增：确保脚本属于当前项目
    )
)
```

**文件**：`backend/app/models/video_task.py`

**修改内容**：
```python
# 新增字段：追踪 Celery 任务 ID
celery_task_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
retry_count: Mapped[int] = mapped_column(default=0)
started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
```

**文件**：`backend/app/api/video_tasks.py`

**修改内容**：
```python
# 第 116 行：真正取消 Celery 任务
from app.tasks import celery_app
if task.celery_task_id:
    celery_app.control.revoke(task.celery_task_id, terminate=True)
task.status = "cancelled"
```

**文件**：`backend/app/main.py`

**修改内容**：
```python
# 第 39 行：移除静态资源公开挂载，改为鉴权端点
# 删除：app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# 新增：鉴权下载端点
@app.get("/api/v1/media/{file_path:path}")
async def download_media(file_path: str, current_user: CurrentUser):
    # 校验文件归属后返回预签名 URL 或文件流
    pass
```

#### 1.2 存储抽象统一（→ Codex）

**文件**：`backend/app/tasks/video.py`

**修改内容**：
```python
# 第 91-101 行：视频生成走存储抽象
from app.services.storage import get_storage_provider
storage = get_storage_provider()

output_filename = f"{task_id}.mp4"
with open(output_path, "rb") as f:
    video_url = await storage.upload(f.read(), f"videos/{output_filename}")

task.result_video_path = f"videos/{output_filename}"
task.result_video_url = video_url  # 新增：存储完整 URL
```

**文件**：`backend/app/api/bgm.py`

**修改内容**：
```python
# 第 42 行：BGM 上传走存储抽象
from app.services.storage import get_storage_provider
storage = get_storage_provider()

file_data = await file.read()
file_url = await storage.upload(file_data, f"bgm/{filename}")

bgm = BgmTrack(
    name=name,
    file_path=f"bgm/{filename}",
    file_url=file_url,  # 新增：存储完整 URL
    duration=duration
)
```

**文件**：`backend/app/models/video_task.py`

**修改内容**：
```python
# 新增字段：存储完整 URL
result_video_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
```

**文件**：`backend/app/models/bgm_track.py`

**修改内容**：
```python
# 新增字段：存储完整 URL
file_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
```

**文件**：`backend/app/models/photo.py`

**修改内容**：
```python
# 新增字段：存储完整 URL
file_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
thumb_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
```

**数据库迁移**：
```bash
cd backend
alembic revision --autogenerate -m "add_media_urls_and_task_tracking"
alembic upgrade head
```

---

### 阶段 2：短期增强（接下来 2 周，🟡 P1）

**目标**：实现视频播放、优化实时状态、验证脚本编辑

#### 2.1 视频播放组件（→ Gemini）

**文件**：`frontend/src/components/project/VideoPlayer.tsx`（新建）

**内容**：
```typescript
import { useRef, useState } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface VideoPlayerProps {
  videoUrl: string
  poster?: string
}

export function VideoPlayer({ videoUrl, poster }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const toggleFullscreen = () => {
    if (!videoRef.current) return
    videoRef.current.requestFullscreen()
  }

  return (
    <div className="relative group rounded-lg overflow-hidden bg-black">
      <video
        ref={videoRef}
        src={videoUrl}
        poster={poster}
        className="w-full aspect-video"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={togglePlay}>
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button size="sm" variant="ghost" onClick={toggleMute}>
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <div className="flex-1" />
          <Button size="sm" variant="ghost" onClick={toggleFullscreen}>
            <Maximize className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
```

**文件**：`frontend/src/components/project/VideoPanel.tsx`

**修改内容**：
```typescript
// 第 1 行：导入 VideoPlayer
import { VideoPlayer } from './VideoPlayer'

// 第 150 行：在任务列表中添加视频播放器
{task.status === 'completed' && task.result_video_url && (
  <div className="mt-4">
    <VideoPlayer videoUrl={task.result_video_url} />
  </div>
)}
```

**文件**：`frontend/src/types/index.ts`

**修改内容**：
```typescript
// 第 64 行：添加 result_video_url 字段
export interface VideoTask {
  id: string
  project_id: string
  script_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result_video_path: string | null
  result_video_url: string | null  // 新增
  error_message: string | null
  progress: number
  created_at: string
  completed_at: string | null
}
```

#### 2.2 优化实时状态更新（→ Codex + Gemini）

**阶段 2.2.1：优化轮询（短期方案）**

**文件**：`frontend/src/components/project/VideoPanel.tsx`

**修改内容**：
```typescript
// 第 69 行：优化轮询策略
refetchInterval: (data) => {
  // 只有 pending/processing 状态才轮询
  const hasActiveTasks = data?.some(
    task => task.status === 'pending' || task.status === 'processing'
  )
  return hasActiveTasks ? 2000 : false  // 2秒间隔，无活跃任务时停止
}
```

**阶段 2.2.2：WebSocket 实时推送（中期方案）**

**文件**：`backend/app/api/websocket.py`（新建）

**内容**：
```python
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.deps import get_current_user_ws

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, user_id: str, websocket: WebSocket):
        self.active_connections[user_id].remove(websocket)

    async def send_task_update(self, user_id: str, task_data: dict):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                await connection.send_json(task_data)

manager = ConnectionManager()

@router.websocket("/ws/tasks")
async def websocket_endpoint(websocket: WebSocket, token: str):
    user = await get_current_user_ws(token)
    await manager.connect(str(user.id), websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(str(user.id), websocket)
```

**文件**：`backend/app/tasks/video.py`

**修改内容**：
```python
# 第 82 行：发送进度更新
from app.api.websocket import manager
task.progress = int(((i + 1) / total_scenes) * 80)
session.commit()

# 推送 WebSocket 事件
await manager.send_task_update(
    str(task.project.user_id),
    {"task_id": str(task.id), "progress": task.progress, "status": "processing"}
)
```

**文件**：`frontend/src/hooks/useTaskWebSocket.ts`（新建）

**内容**：
```typescript
import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth'

export function useTaskWebSocket(projectId: string) {
  const wsRef = useRef<WebSocket | null>(null)
  const queryClient = useQueryClient()
  const token = useAuthStore(state => state.token)

  useEffect(() => {
    if (!token) return

    const ws = new WebSocket(`ws://localhost:8000/ws/tasks?token=${token}`)
    wsRef.current = ws

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      queryClient.setQueryData(['video-tasks', projectId], (old: any) => {
        return old?.map((task: any) =>
          task.id === data.task_id ? { ...task, ...data } : task
        )
      })
    }

    return () => ws.close()
  }, [token, projectId, queryClient])
}
```

#### 2.3 验证脚本编辑功能（→ Gemini）

**任务**：审计 `TimelineEditor` 组件完整性

**检查项**：
- [ ] 场景拖拽排序
- [ ] 场景时长调整
- [ ] 场景删除
- [ ] 照片替换
- [ ] 转场效果选择
- [ ] BGM 选择
- [ ] 保存/取消操作

**文件**：`frontend/src/components/timeline/TimelineEditor.tsx`

**验证方法**：
1. 手动测试所有交互功能
2. 补充单元测试（Vitest + React Testing Library）

---

### 阶段 3：中期增强（下个月，🟢 P2）

**目标**：模板系统、导出选项、通知、分析、变现

#### 3.1 模板系统（→ Codex + Gemini）

**后端**：
- 新增 `ScriptTemplate` 模型
- 新增 `/api/v1/templates` 端点
- 预置 5-10 个模板（婚礼、旅行、生日等）

**前端**：
- 新增 `TemplateGallery` 组件
- 在 `ScriptPanel` 中集成模板选择

#### 3.2 导出选项（→ Codex）

**后端**：
- `VideoTaskCreate` 新增 `resolution` 和 `format` 字段
- FFmpeg 命令支持多分辨率（720p/1080p/4K）
- 支持多格式（MP4/MOV/WebM）

**前端**：
- 视频生成对话框添加分辨率和格式选择

#### 3.3 通知系统（→ Codex + Gemini）

**后端**：
- 集成 SendGrid/Postmark 邮件服务
- 视频完成/失败时发送邮件通知

**前端**：
- 用户设置页面添加通知偏好

#### 3.4 分析系统（→ Codex + Gemini）

**后端**：
- 集成 Mixpanel/Amplitude
- 追踪关键事件：注册、创建项目、上传照片、生成脚本、生成视频

**前端**：
- 在关键操作点埋点

#### 3.5 变现计划（→ Codex + Gemini）

**后端**：
- 集成 Stripe 订阅计费
- 新增 `Subscription` 模型
- 实现使用配额限制

**前端**：
- 新增定价页面
- 新增订阅管理页面

---

## 📊 关键文件清单

| 文件 | 操作 | 优先级 | 负责模型 |
|------|------|--------|----------|
| `backend/app/api/video_tasks.py` | 修改（安全校验） | 🔴 P0 | Codex |
| `backend/app/models/video_task.py` | 修改（新增字段） | 🔴 P0 | Codex |
| `backend/app/tasks/video.py` | 修改（存储抽象） | 🔴 P0 | Codex |
| `backend/app/api/bgm.py` | 修改（存储抽象） | 🔴 P0 | Codex |
| `backend/app/main.py` | 修改（移除静态挂载） | 🔴 P0 | Codex |
| `frontend/src/components/project/VideoPlayer.tsx` | 创建 | 🟡 P1 | Gemini |
| `frontend/src/components/project/VideoPanel.tsx` | 修改（集成播放器） | 🟡 P1 | Gemini |
| `frontend/src/types/index.ts` | 修改（新增字段） | 🟡 P1 | Gemini |
| `backend/app/api/websocket.py` | 创建 | 🟡 P1 | Codex |
| `frontend/src/hooks/useTaskWebSocket.ts` | 创建 | 🟡 P1 | Gemini |

---

## ⚠️ 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 存储迁移破坏现有数据 | 高 | 先双写（local + S3），验证后切流 |
| WebSocket 连接不稳定 | 中 | 保留轮询作为降级方案 |
| 视频播放跨域问题 | 中 | 配置 CORS + 预签名 URL |
| FFmpeg 进程泄漏 | 高 | 添加超时机制 + 进程监控 |
| 测试覆盖率低导致回归 | 高 | 优先补充关键路径测试 |

---

## ✅ 验证标准

### 阶段 1 验证（P0）
- [ ] 跨租户脚本引用被拒绝（返回 403）
- [ ] 取消任务后 FFmpeg 进程被终止
- [ ] 视频生成后 `result_video_url` 字段有值
- [ ] BGM 上传后 `file_url` 字段有值
- [ ] 照片上传后 `file_url` 和 `thumb_url` 字段有值
- [ ] 前端不再硬编码 `/uploads/`

### 阶段 2 验证（P1）
- [ ] 视频完成后可在浏览器内播放
- [ ] 视频播放器支持播放/暂停/静音/全屏
- [ ] 轮询间隔降低到 2 秒
- [ ] 无活跃任务时停止轮询
- [ ] WebSocket 连接成功并接收实时更新
- [ ] 脚本编辑所有功能正常工作

### 阶段 3 验证（P2）
- [ ] 模板库至少有 5 个预置模板
- [ ] 视频导出支持 720p/1080p 两种分辨率
- [ ] 视频完成后发送邮件通知
- [ ] 关键事件成功上报到分析平台
- [ ] Stripe 订阅流程完整可用

---

## 📈 成功指标

### MVP 发布标准（目标：85/100）
- 核心技术：90/100（安全加固 + 存储统一）
- 用户体验：80/100（视频播放 + 实时状态）
- 商业可行性：70/100（基础变现机制）
- 生产就绪度：85/100（监控 + 测试覆盖）

### 用户指标
- 用户激活率（生成首个视频）：> 60%
- 首次视频生成时间：< 5 分钟
- 视频生成成功率：> 95%
- 用户留存率（第 1 周到第 2 周）：> 40%

---

## 🔗 SESSION_ID（供 /ccg:execute 使用）

- **CODEX_SESSION**: `019ccd7d-ad6d-7463-a76e-b7db7e7ab845`
- **GEMINI_SESSION**: `81c4341b-e95b-48d1-b672-bd20e1e097b6`

---

## 📝 实施建议

### 开发顺序
1. **先做 P0**：安全漏洞和存储统一（阻塞发布）
2. **再做 P1**：视频播放和实时状态（MVP 必需）
3. **最后做 P2**：模板、通知、分析、变现（增强体验）

### 并行策略
- 阶段 1：后端安全加固 + 存储抽象（串行，Codex）
- 阶段 2：视频播放器（Gemini）+ WebSocket 后端（Codex）并行
- 阶段 3：所有功能可并行开发

### 测试策略
- 每个阶段完成后运行完整测试套件
- 优先补充关键路径的集成测试
- 使用 Playwright 添加 E2E 测试

---

## 🎓 技术债务记录

### 立即偿还（P0）
- 安全漏洞：script_id 校验、静态资源鉴权
- 存储抽象：视频/BGM 统一走 StorageProvider

### 短期偿还（P1）
- 测试覆盖率：补充 API 端点测试、组件测试
- 性能优化：N+1 查询、串行 FFmpeg

### 长期偿还（P2）
- 可观测性：指标、日志、链路追踪
- 架构演进：渲染服务拆分、多区域部署

---

**计划生成时间**：2026-03-08
**预计完成时间**：2026-04-08（1 个月）
**风险等级**：中等（需要数据库迁移和架构调整）

---

## 🔗 SESSION_ID（供 /ccg:execute 使用）

- **CODEX_SESSION**: `019ccd7d-ad6d-7463-a76e-b7db7e7ab845`
- **GEMINI_SESSION**: `81c4341b-e95b-48d1-b672-bd20e1e097b6`

---

## 📊 成功指标

### MVP 发布标准（85/100）
- ✅ 用户能完成完整旅程：上传 → 生成 → 编辑 → 播放 → 下载
- ✅ 视频生成成功率 > 95%
- ✅ 平均生成时间 < 5 分钟
- ✅ 无安全漏洞（通过安全审计）
- ✅ 存储抽象统一（支持 local/S3 切换）

### 用户体验指标
- 用户激活率（生成首个视频）> 60%
- 首次视频生成时间 < 10 分钟
- 用户留存率（第 1 周到第 2 周）> 40%
- 平均每用户视频数 > 3

### 技术指标
- API 响应时间 P95 < 500ms
- 视频生成失败率 < 5%
- 测试覆盖率 > 70%
- 无 P0/P1 级别技术债务

---

## 🎯 下一步行动

### 审查计划
请仔细审查上述实施计划，确认：
1. 优先级排序是否合理？
2. 技术方案是否可行？
3. 时间估算是否现实？
4. 是否有遗漏的关键功能？

### 执行计划
如果计划无误，请在新会话中执行：

```bash
/ccg:execute .claude/plan/mvp-completion.md
```

### 修改计划
如果需要调整，请告诉我具体需要修改的部分，我会更新计划文档。

---

**⚠️ 重要提示**：
- 本计划基于 2026-03-08 的代码状态生成
- 执行前请确保代码库无未提交的更改
- 建议在独立分支上执行（使用 git worktree）
- 每个阶段完成后进行代码审查和测试
