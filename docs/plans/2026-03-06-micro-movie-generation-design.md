# 微电影生成网站 - 设计文档

**日期：** 2026-03-06
**状态：** 已批准

## 1. 项目概述

### 1.1 核心价值
用户上传照片，通过AI技术生成剧本并制作成微电影视频。支持手动编辑剧本、可视化时间轴编辑、剧本模板管理和社区分享。

### 1.2 目标场景
- 个人纪念视频（生日、旅行、成长记录）
- 内容创作者快速生成短视频素材
- 企业/品牌制作营销视频
- 教育场景（故事教学、课件制作）

### 1.3 技术约束
- 技术栈：React + Python (FastAPI) + PostgreSQL
- 部署规模：小规模（几十到几百用户）
- 成本模式：用户自带API密钥（BYOK）

---

## 2. 系统架构

### 2.1 整体架构

```
┌─────────────────────────────────────┐
│   前端 (React SPA)                   │
│   - Vite + React Router              │
│   - TanStack Query (数据管理)        │
│   - Zustand (状态管理)               │
└──────────────┬──────────────────────┘
               │ REST API
┌──────────────▼──────────────────────┐
│   后端 (FastAPI)                     │
│   - 用户认证 (JWT)                   │
│   - 项目/照片/剧本 CRUD              │
│   - AI剧本生成接口                   │
│   - 视频生成任务调度                 │
└──────────────┬──────────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
┌───▼────┐         ┌─────▼─────┐
│ PostgreSQL│       │ Celery     │
│ (数据)  │       │ + Redis    │
│         │       │ (任务队列)  │
└─────────┘       └─────┬──────┘
                        │
                ┌───────▼────────┐
                │ Worker         │
                │ 调用AI服务      │
                │ 生成视频        │
                └────────────────┘
```

### 2.2 部署方式
- Docker Compose 一键部署
- 服务组件：web (FastAPI) + worker (Celery) + redis + postgres
- 文件存储：挂载本地目录（后续可扩展MinIO）

---

## 3. 数据模型

### 3.1 核心表结构

```sql
-- 用户表
users
  - id (uuid, pk)
  - email (unique)
  - password_hash
  - username
  - created_at

-- 项目表
projects
  - id (uuid, pk)
  - user_id (fk -> users)
  - name
  - description
  - created_at
  - updated_at

-- 照片表
photos
  - id (uuid, pk)
  - project_id (fk -> projects)
  - file_path
  - file_size
  - width, height
  - upload_at
  - order_index (排序)

-- 剧本表
scripts
  - id (uuid, pk)
  - project_id (fk -> projects, nullable)
  - user_id (fk -> users)
  - title
  - content (jsonb, 存储时间轴数据)
  - is_template (是否为模板)
  - is_public (是否公开到社区)
  - source_type (system/user/ai_generated)
  - created_at

-- 视频生成任务表
video_tasks
  - id (uuid, pk)
  - project_id (fk -> projects)
  - script_id (fk -> scripts)
  - status (pending/processing/completed/failed)
  - ai_config (jsonb, 存储用户的API配置)
  - result_video_path
  - error_message
  - created_at
  - completed_at

-- 用户AI配置表
user_ai_configs
  - id (uuid, pk)
  - user_id (fk -> users)
  - name (配置名称)
  - provider (runway/pika/kling等)
  - base_url
  - api_key (加密存储)
  - model
  - is_default
```

### 3.2 关键设计点
1. `scripts.content` 使用JSONB存储时间轴结构（场景、照片、文案、时长）
2. `user_ai_configs` 独立表，用户可保存多个配置
3. `video_tasks` 记录每次生成任务，便于追踪和重试

---

## 4. 核心功能流程

### 4.1 项目创建与照片上传

**流程：**
```
用户操作：创建项目 → 上传多张照片
后端处理：
  1. 创建 project 记录
  2. 接收文件上传（支持批量）
  3. 验证格式（jpg/png/webp）、大小限制
  4. 生成缩略图（用于编辑器预览）
  5. 存储原图 + 缩略图，写入 photos 表
```

**限制：**
- 单文件最大10MB
- 单项目最多50张照片
- 每用户总存储配额500MB

### 4.2 剧本编辑（可视化时间轴）

**时间轴数据结构（scripts.content）：**
```json
{
  "scenes": [
    {
      "id": "scene-1",
      "photo_id": "uuid",
      "duration": 3.0,
      "caption": "场景描述文案",
      "transition": "fade",
      "order": 0
    }
  ],
  "metadata": {
    "total_duration": 15.0,
    "bgm": "music-file-path"
  }
}
```

**编辑器功能：**
- 拖拽照片到时间轴
- 调整场景顺序、时长
- 编辑每个场景的文案
- 选择转场效果
- 实时预览总时长

### 4.3 AI剧本生成

**流程：**
```
用户输入：描述文本 + 可选照片
后端处理：
  1. 调用用户配置的LLM API（GPT-4/Claude等）
  2. Prompt工程：
     - 输入：用户描述 + 照片数量/内容分析
     - 输出：结构化JSON（符合时间轴格式）
  3. 返回生成的剧本，用户可继续编辑
```

**注意：** 剧本可以纯文本生成，但最终生成视频时必须有照片作为视觉参考。

### 4.4 视频生成

**流程：**
```
用户操作：点击"生成视频"
后端处理：
  1. 创建 video_task 记录（status=pending）
  2. 提交Celery任务到队列
  3. 立即返回任务ID给前端

Worker异步处理：
  1. 读取剧本 + 照片
  2. 按场景调用AI视频服务（用户配置的API）
     - 每个场景：photo + caption → 短视频片段
  3. 使用FFmpeg拼接所有片段 + 转场 + BGM
  4. 更新任务状态（completed/failed）
  5. 存储最终视频路径

前端轮询：
  - 每5秒查询任务状态
  - 完成后显示下载链接
```

---

## 5. 剧本模板管理

### 5.1 系统预置模板
- 生日祝福模板（3-5个场景，温馨风格）
- 旅行回忆模板（5-8个场景，动感风格）
- 产品介绍模板（4-6个场景，商业风格）
- 故事叙事模板（6-10个场景，电影感）

**存储：** `scripts` 表中 `source_type='system'`, `project_id=null`

### 5.2 个人模板
- 用户编辑完剧本后可"保存为模板"
- 设置 `is_template=true`，仅自己可见
- 在新项目中可选择自己的模板复用

### 5.3 社区分享

**发布流程：**
```
用户操作：将个人模板"发布到社区"
后端处理：
  1. 设置 `is_public=true`
  2. 审核机制：
     - 自动审核：敏感词过滤
     - 人工审核：管理员后台（可选）
```

**浏览与使用：**
- 社区模板列表页（分类、搜索、排序）
- 显示作者、使用次数、点赞数
- 用户可"使用此模板"克隆到自己项目

**数据扩展（可选）：**
```sql
script_stats
  - script_id (fk -> scripts)
  - use_count
  - like_count
```

---

## 6. 错误处理与边界情况

### 6.1 文件上传
- 格式不支持 → 前端提示，拒绝上传
- 超出配额 → 返回403，提示删除旧项目
- 上传中断 → 支持断点续传（可选，MVP可不做）

### 6.2 AI服务调用失败

**常见失败场景：**
- API密钥无效/过期
- 配额耗尽
- 服务超时/不可用
- 返回格式错误

**处理策略：**
```python
@celery_app.task(bind=True, max_retries=3)
def generate_video(self, task_id):
    try:
        result = call_ai_service(...)
    except APIError as e:
        if e.is_retryable:  # 超时、5xx错误
            raise self.retry(countdown=60)
        else:  # 密钥错误、4xx错误
            update_task_status(task_id, 'failed', str(e))
            send_notification_to_user(...)
```

### 6.3 视频生成超时
- Celery任务超时设置（1小时）
- 前端显示进度条（基于场景数估算）
- 支持取消任务（用户主动中止）

### 6.4 并发与资源限制
- Celery限流：最多3个并发Worker
- 任务队列优先级（可选）
- 超出限制时排队，显示预计等待时间

---

## 7. 安全与性能

### 7.1 安全设计

**认证与授权：**
- JWT Token认证（access token + refresh token）
- 资源访问控制：用户只能访问自己的资源
- API密钥加密存储（Fernet对称加密）

**文件安全：**
- 上传文件重命名（UUID），防止路径遍历
- 文件访问需验证所有权
- 生成的视频URL带签名（防盗链，可选）

**社区内容审核：**
- 发布到社区的剧本需审核
- 敏感词过滤
- 举报机制

### 7.2 性能优化

**数据库：**
- 索引：`projects.user_id`, `photos.project_id`, `scripts.user_id`
- 分页查询
- 连接池配置

**文件存储：**
- 缩略图生成
- 静态文件CDN（生产环境可选）
- 定期清理临时文件

**前端：**
- 照片懒加载
- 时间轴编辑器虚拟滚动
- TanStack Query缓存策略

**任务队列：**
- Redis持久化配置
- Worker监控（Flower）
- 失败任务自动重试

### 7.3 监控与日志

**关键指标：**
- 视频生成成功率
- 平均生成时长
- API调用失败率
- 存储使用量

**日志记录：**
- 结构化日志（JSON格式）
- 分级：DEBUG/INFO/WARNING/ERROR
- 敏感信息脱敏

---

## 8. 技术栈细节

### 8.1 前端
- React 18 + TypeScript
- Vite（构建工具）
- React Router v6
- Zustand（全局状态）
- TanStack Query（服务端状态）
- React Hook Form（表单）
- shadcn/ui + Tailwind CSS（UI）
- React DnD（拖拽）

### 8.2 后端
- FastAPI（Python 3.11+）
- SQLAlchemy 2.0 + Alembic
- Pydantic v2
- Celery 5.x + Redis
- Pillow（图片处理）
- FFmpeg-python（视频拼接）
- python-jose（JWT）
- cryptography（加密）
- httpx（异步HTTP客户端）

### 8.3 部署
```yaml
services:
  web:
    build: ./backend
    ports: ["8000:8000"]

  worker:
    build: ./backend
    command: celery -A app.celery worker

  redis:
    image: redis:7-alpine

  postgres:
    image: postgres:15-alpine

  frontend:
    build: ./frontend
    ports: ["3000:80"]
```

---

## 9. 开发阶段规划

### 阶段1：核心MVP（2-3周）
- 用户注册/登录
- 项目管理
- 照片上传
- 文本剧本编辑（简单表单）
- 基础视频生成
- 用户AI配置管理

**验证目标：** 端到端流程跑通，验证AI服务集成可行性

### 阶段2：可视化编辑器（2周）
- 时间轴拖拽编辑器
- 场景排序、时长调整
- 转场效果选择
- 实时预览

### 阶段3：AI剧本生成（1-2周）
- 接入LLM API
- Prompt工程优化
- 生成结果转换为时间轴格式

### 阶段4：模板与社区（2周）
- 系统预置模板
- 个人模板保存
- 社区模板发布/浏览
- 模板搜索与分类

---

## 10. 风险与挑战

### 10.1 技术风险
- AI视频服务API稳定性和响应时间不可控
- FFmpeg视频拼接质量和性能
- 大文件上传和存储管理

### 10.2 用户体验风险
- 视频生成时间过长（用户等待体验差）
- AI生成剧本质量不稳定
- 时间轴编辑器学习曲线

### 10.3 缓解措施
- 提供详细的进度反馈和预估时间
- 优化Prompt工程，提供生成示例
- 提供新手引导和模板快速开始
- 分阶段发布，持续收集反馈迭代

---

## 11. 后续扩展方向

- 支持视频素材库（无照片时使用）
- 多语言字幕生成
- 音乐库集成
- 移动端适配
- 团队协作功能
- 付费订阅模式（如需商业化）
