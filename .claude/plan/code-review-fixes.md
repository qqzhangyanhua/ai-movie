# 代码审查问题修复计划

## 📋 任务概述

**目标**：修复 Codex 和 Gemini 代码审查发现的高优先级问题

**预计时间**：30-45 分钟

**优先级**：🔴 P0（阻塞后续开发）

---

## 🎯 任务类型

- [x] 后端 (→ Codex)
- [x] 前端 (→ Gemini)
- [x] 全栈 (→ 并行)

---

## 🔍 问题清单

### 后端问题（Codex 审查）

**高优先级**：
1. ⚠️ **迁移文件版本号格式错误**
   - 当前：`revision = '002'`, `down_revision = '001'`
   - 问题：Alembic 无法解析，且依赖链错误
   - 影响：阻塞数据库升级

2. ⚠️ **Schema 字段不同步**
   - 问题：新增字段未添加到 Pydantic schema
   - 影响：前端无法获取 `file_url`, `thumb_url`, `result_video_url` 等字段
   - 文件：`photo.py`, `bgm.py`, `video_task.py`

3. ⚠️ **重试逻辑不完整**
   - 问题：retry 时未重置 `celery_task_id`, `retry_count` 未递增
   - 影响：无法取消重试任务，任务追踪不准确

### 前端问题（Gemini 审查）

**高优先级**：
1. ⚠️ **VideoPlayer 可访问性缺失**
   - 问题：缺少 ARIA 标签和键盘导航
   - 影响：屏幕阅读器用户无法使用，不符合 WCAG 2.1 AA

2. ⚠️ **轮询内存泄漏**
   - 问题：轮询未处理 `cancelled` 状态
   - 影响：已取消的任务继续轮询，浪费资源

3. ⚠️ **进度条可访问性**
   - 问题：缺少 ARIA 属性
   - 影响：屏幕阅读器无法读取进度

---

## 📐 技术方案

### 方案 1：后端修复（Codex 权威）

#### 1.1 修复迁移文件版本号

**文件**：`backend/alembic/versions/002_add_media_urls_and_task_tracking.py`

**修改**：
```python
# 修改前
revision = '002'
down_revision = '001'

# 修改后
revision = '002_add_media_urls_and_task_tracking'
down_revision = 'e8bf1bffa176'  # 依赖 bgm_tracks 表创建迁移
```

**原因**：
- Alembic 要求 revision 使用描述性名称
- `e8bf1bffa176` 是创建 `bgm_tracks` 表的迁移，本次迁移修改该表，应依赖它

#### 1.2 更新 Pydantic Schema

**文件 1**：`backend/app/schemas/photo.py`
```python
class PhotoResponse(BaseModel):
    id: UUID
    project_id: UUID
    file_path: str
    file_url: str | None = None  # 新增
    thumbnail_path: str | None
    thumb_url: str | None = None  # 新增
    file_size: int
    width: int
    height: int
    upload_at: datetime
    order_index: int
```

**文件 2**：`backend/app/schemas/bgm.py`
```python
class BgmResponse(BaseModel):
    id: UUID
    name: str
    file_path: str
    file_url: str | None = None  # 新增
    duration: float
    category: str | None
    is_system: bool
    user_id: UUID | None
    created_at: datetime
```

**文件 3**：`backend/app/schemas/video_task.py`
```python
class VideoTaskResponse(BaseModel):
    id: UUID
    project_id: UUID
    script_id: UUID
    status: str
    ai_config: dict[str, Any] | None
    result_video_path: str | None
    result_video_url: str | None = None  # 新增
    celery_task_id: str | None = None  # 新增
    retry_count: int = 0  # 新增
    error_message: str | None
    progress: int | None
    created_at: datetime
    started_at: datetime | None = None  # 新增
    completed_at: datetime | None

    model_config = {"from_attributes": True}
```

**原因**：
- 所有新增字段使用默认值，保证向后兼容
- 旧数据（NULL）可以正常序列化

#### 1.3 完善重试逻辑

**文件**：`backend/app/api/video_tasks.py`（retry_video_task 函数）

**修改**：
```python
@router.post("/{task_id}/retry", response_model=VideoTaskResponse, status_code=status.HTTP_200_OK)
async def retry_video_task(
    task_id: UUID, current_user: CurrentUser, db: DbSession
) -> VideoTask:
    # ... 验证代码 ...

    # 重置所有任务状态
    task.status = "pending"
    task.error_message = None
    task.progress = 0
    task.result_video_path = None
    task.result_video_url = None  # 新增
    task.started_at = None  # 新增
    task.celery_task_id = None  # 新增：清理旧任务ID
    task.retry_count = (task.retry_count or 0) + 1  # 新增：递增重试次数
    task.completed_at = None
    await db.flush()

    from app.tasks.video import generate_video

    # 提交新任务并保存新的 celery_task_id
    celery_task = generate_video.delay(str(task.id))
    task.celery_task_id = celery_task.id  # 新增：保存新任务ID
    await db.flush()
    await db.refresh(task)
    return task
```

**原因**：
- 清理旧的 `celery_task_id`，避免取消操作影响新任务
- 递增 `retry_count`，支持重试次数限制
- 保存新的 `celery_task_id`，支持取消重试任务

---

### 方案 2：前端修复（Gemini 权威）

#### 2.1 VideoPlayer 可访问性增强

**文件**：`frontend/src/components/project/VideoPlayer.tsx`

**修改 1：添加键盘导航**
```typescript
const handleKeyDown = (e: React.KeyboardEvent) => {
  switch (e.key) {
    case ' ':
    case 'k':
      e.preventDefault()
      togglePlay()
      break
    case 'm':
      e.preventDefault()
      toggleMute()
      break
    case 'f':
      e.preventDefault()
      handleFullscreen()
      break
    case 'ArrowLeft':
      e.preventDefault()
      if (videoRef.current) {
        videoRef.current.currentTime = Math.max(0, currentTime - 5)
      }
      break
    case 'ArrowRight':
      e.preventDefault()
      if (videoRef.current) {
        videoRef.current.currentTime = Math.min(duration, currentTime + 5)
      }
      break
  }
}
```

**修改 2：添加 ARIA 标签**
```tsx
<div
  className="relative w-full aspect-video rounded-lg overflow-hidden bg-black group"
  role="region"
  aria-label="视频播放器"
  tabIndex={0}
  onKeyDown={handleKeyDown}
>
  <video
    ref={videoRef}
    src={videoUrl}
    poster={poster}
    aria-label="视频内容"
    className="w-full h-full object-contain"
    // ...
  />

  {/* 控制条 */}
  <div className="...">
    <button
      onClick={togglePlay}
      aria-label={isPlaying ? '暂停视频' : '播放视频'}
      aria-pressed={isPlaying}
    >
      {/* ... */}
    </button>

    <button
      onClick={toggleMute}
      aria-label={isMuted ? '取消静音' : '静音'}
      aria-pressed={isMuted}
    >
      {/* ... */}
    </button>

    <input
      type="range"
      min="0"
      max={duration || 0}
      value={currentTime}
      onChange={handleSeek}
      aria-label="播放进度"
      aria-valuemin={0}
      aria-valuemax={duration}
      aria-valuenow={currentTime}
      aria-valuetext={`${formatTime(currentTime)} / ${formatTime(duration)}`}
    />

    <button
      onClick={handleFullscreen}
      aria-label="全屏播放"
    >
      {/* ... */}
    </button>
  </div>
</div>
```

**原因**：
- `role="region"` + `aria-label`：标识播放器区域
- `tabIndex={0}`：允许键盘聚焦
- `aria-pressed`：指示按钮状态
- `aria-value*`：为屏幕阅读器提供进度信息
- 键盘快捷键：符合 YouTube/Netflix 等主流平台习惯

#### 2.2 修复轮询停止逻辑

**文件**：`frontend/src/components/project/VideoPanel.tsx`

**修改**：
```typescript
// 第 58-70 行：轮询查询
useQuery({
  queryKey: ['video-task-poll', pollingTaskId],
  queryFn: async () => {
    if (!pollingTaskId) return null
    const task = await getVideoTask(pollingTaskId)
    // 修改：添加 'cancelled' 到终止条件
    if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
      setPollingTaskId(null)
      queryClient.invalidateQueries({ queryKey: ['video-tasks', projectId] })
    }
    return task
  },
  enabled: !!pollingTaskId,
  refetchInterval: 5000,
})
```

**原因**：
- 已取消的任务不应继续轮询
- 避免内存泄漏和无效网络请求

---

## 🚀 实施步骤

### 步骤 1：后端修复（Codex）

1. **修复迁移文件**
   - 重命名 revision 和 down_revision
   - 预期产物：迁移文件可正常执行

2. **更新 Schema**
   - 添加新字段到 PhotoResponse
   - 添加新字段到 BgmResponse
   - 添加新字段到 VideoTaskResponse
   - 预期产物：API 响应包含所有新字段

3. **完善重试逻辑**
   - 重置 celery_task_id
   - 递增 retry_count
   - 保存新的 celery_task_id
   - 预期产物：重试任务可被正确取消

### 步骤 2：前端修复（Gemini）

1. **VideoPlayer 可访问性**
   - 添加键盘事件处理
   - 添加 ARIA 标签到所有控件
   - 添加 role 和 tabIndex
   - 预期产物：通过 WCAG 2.1 AA 自动化测试

2. **修复轮询逻辑**
   - 添加 'cancelled' 到停止条件
   - 预期产物：取消任务后轮询立即停止

### 步骤 3：测试验证

1. **后端测试**
   ```bash
   cd backend
   alembic upgrade head  # 验证迁移可执行
   pytest tests/  # 运行测试套件
   ```

2. **前端测试**
   - 使用屏幕阅读器测试 VideoPlayer
   - 测试键盘导航（空格、K、M、F、方向键）
   - 验证取消任务后轮询停止

---

## 📁 关键文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `backend/alembic/versions/002_add_media_urls_and_task_tracking.py:10-13` | 修改 | 修正 revision 格式 |
| `backend/app/schemas/photo.py:11-12` | 新增 | 添加 file_url, thumb_url |
| `backend/app/schemas/bgm.py:17` | 新增 | 添加 file_url |
| `backend/app/schemas/video_task.py:21-25` | 新增 | 添加 5 个新字段 |
| `backend/app/api/video_tasks.py:147-162` | 修改 | 完善重试逻辑 |
| `frontend/src/components/project/VideoPlayer.tsx:全文` | 修改 | 添加可访问性 |
| `frontend/src/components/project/VideoPanel.tsx:64` | 修改 | 修复轮询停止 |

---

## ⚠️ 风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| 迁移文件已在某些环境执行 | 需手动修正 `alembic_version.version_num` |
| Schema 变更影响旧客户端 | 所有新字段使用默认值，向后兼容 |
| 键盘快捷键冲突 | 仅在播放器聚焦时生效 |
| 轮询停止影响正在处理的任务 | 'cancelled' 是终止状态，不影响 |

---

## 📊 预期成果

**修复前**：
- ❌ 数据库迁移失败
- ❌ 前端无法获取新字段
- ❌ 重试任务无法取消
- ❌ VideoPlayer 不可访问
- ❌ 轮询内存泄漏

**修复后**：
- ✅ 数据库迁移正常
- ✅ 前端正确显示所有字段
- ✅ 重试任务可正常取消
- ✅ VideoPlayer 符合 WCAG 2.1 AA
- ✅ 轮询正确停止

---

## 🔗 SESSION_ID（供 /ccg:execute 使用）

- **CODEX_SESSION**: `019ccda7-9217-7303-975c-35ddc1ead9f4`
- **GEMINI_SESSION**: `6d08b7da-ab90-4c22-8a44-e815a22da0b5`

---

## 📝 注意事项

1. **迁移文件修改后需要重新生成**：
   ```bash
   cd backend
   # 删除旧迁移文件
   rm alembic/versions/002_add_media_urls_and_task_tracking.py
   # 重新生成（如果使用虚拟环境）
   source venv/bin/activate
   alembic revision --autogenerate -m "add_media_urls_and_task_tracking"
   # 手动修改 down_revision 为 'e8bf1bffa176'
   ```

2. **Schema 变更无需数据迁移**：
   - 仅修改 Python 代码
   - 不影响数据库结构

3. **前端变更无需重启**：
   - 热更新自动生效
   - 建议清除浏览器缓存

---

**预计执行时间**：30-45 分钟
**建议执行时机**：立即执行（阻塞后续开发）
