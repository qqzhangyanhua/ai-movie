[根目录](../CLAUDE.md) > **backend**

# Backend 模块文档

## 变更记录 (Changelog)

- **2026-03-07 20:10:23** - 初始化后端模块文档

## 模块职责

FastAPI 异步后端服务，负责：
- REST API 提供（用户认证、项目管理、照片上传、脚本生成、视频任务）
- 数据持久化（PostgreSQL + SQLAlchemy ORM）
- 异步任务调度（Celery + Redis）
- 文件存储管理（照片、缩略图、视频）
- AI 服务集成（LLM 脚本生成）

## 入口与启动

**主入口**: `app/main.py`
- 创建 FastAPI 应用实例
- 配置 CORS 中间件
- 挂载 API 路由 (`/api/v1`)
- 挂载静态文件服务 (`/uploads`)
- 启动时创建上传目录

**启动命令**:
```bash
# 开发环境
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 生产环境
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

**数据库迁移**:
```bash
alembic upgrade head  # 应用所有迁移
alembic revision --autogenerate -m "描述"  # 创建新迁移
```

**Celery Worker**:
```bash
celery -A app.tasks worker --loglevel=info --concurrency=3
```

## 对外接口

### API 路由结构

| 路由前缀 | 模块 | 功能 |
|---------|------|------|
| `/api/v1/auth` | `api/auth.py` | 用户注册、登录、刷新令牌 |
| `/api/v1/projects` | `api/projects.py` | 项目 CRUD |
| `/api/v1/projects/{id}/photos` | `api/photos.py` | 照片上传、删除、排序 |
| `/api/v1/scripts` | `api/scripts.py` | 脚本 CRUD、AI 生成 |
| `/api/v1/ai-configs` | `api/ai_configs.py` | AI 配置管理 |
| `/api/v1/video-tasks` | `api/video_tasks.py` | 视频任务创建、查询 |

### 核心端点

**认证**:
- `POST /auth/register` - 用户注册
- `POST /auth/login` - 登录获取 JWT
- `POST /auth/refresh` - 刷新访问令牌

**项目**:
- `GET /projects` - 获取用户项目列表
- `POST /projects` - 创建项目
- `GET /projects/{id}` - 获取项目详情
- `PUT /projects/{id}` - 更新项目
- `DELETE /projects/{id}` - 删除项目（级联删除照片、脚本、任务）

**照片**:
- `POST /projects/{id}/photos` - 批量上传照片（multipart/form-data）
- `DELETE /projects/{id}/photos/{photo_id}` - 删除照片
- `PUT /projects/{id}/photos/reorder` - 批量更新照片顺序

**脚本**:
- `POST /scripts/generate` - AI 生成脚本（调用 LLM）
- `GET /scripts` - 获取脚本列表（支持过滤模板/公开脚本）
- `POST /scripts` - 创建脚本
- `PUT /scripts/{id}` - 更新脚本

**视频任务**:
- `POST /video-tasks` - 创建视频生成任务（异步）
- `GET /video-tasks/{id}` - 查询任务状态和进度
- `GET /video-tasks` - 获取任务列表

## 关键依赖与配置

### 核心依赖

```
fastapi==0.115.6          # Web 框架
uvicorn==0.34.0           # ASGI 服务器
sqlalchemy==2.0.36        # ORM
asyncpg==0.30.0           # PostgreSQL 异步驱动
alembic==1.14.1           # 数据库迁移
pydantic==2.10.4          # 数据验证
python-jose==3.3.0        # JWT 处理
passlib==1.7.4            # 密码哈希
celery==5.4.0             # 任务队列
redis==5.2.1              # 缓存/队列
Pillow==11.1.0            # 图片处理
ffmpeg-python==0.2.0      # 视频处理
```

### 配置文件

**`app/core/config.py`**:
- 使用 `pydantic-settings` 从环境变量加载配置
- 关键配置项：
  - `DATABASE_URL`: PostgreSQL 连接串
  - `REDIS_URL`: Redis 连接串
  - `SECRET_KEY`: JWT 签名密钥
  - `FERNET_KEY`: 敏感数据加密密钥（用于加密 AI API Key）
  - `MAX_FILE_SIZE_MB`: 单文件上传限制
  - `MAX_PHOTOS_PER_PROJECT`: 项目照片数量限制
  - `CORS_ORIGINS`: 允许的跨域来源

**依赖注入**:
- `app/core/deps.py`: 定义可复用依赖
  - `get_db()`: 数据库会话
  - `get_current_user()`: 从 JWT 获取当前用户
  - `require_auth()`: 认证装饰器

## 数据模型

### 核心表结构

**users** (`models/user.py`):
- `id` (UUID, PK)
- `email` (唯一)
- `username`
- `hashed_password`
- `created_at`

**projects** (`models/project.py`):
- `id` (UUID, PK)
- `user_id` (FK → users)
- `name`
- `description`
- `created_at`, `updated_at`

**photos** (`models/photo.py`):
- `id` (UUID, PK)
- `project_id` (FK → projects)
- `file_path` (相对路径)
- `thumbnail_path`
- `file_size`, `width`, `height`
- `order_index` (排序)
- `upload_at`

**scripts** (`models/script.py`):
- `id` (UUID, PK)
- `project_id` (FK → projects, nullable)
- `user_id` (FK → users)
- `title`
- `content` (JSONB, 存储场景数组)
- `is_template`, `is_public`
- `source_type` (system/user/ai_generated)
- `created_at`

**video_tasks** (`models/video_task.py`):
- `id` (UUID, PK)
- `project_id` (FK → projects)
- `script_id` (FK → scripts)
- `status` (pending/processing/completed/failed)
- `progress` (0-100)
- `result_video_path`
- `error_message`
- `created_at`, `completed_at`

**user_ai_configs** (`models/user_ai_config.py`):
- `id` (UUID, PK)
- `user_id` (FK → users)
- `name` (配置名称)
- `provider` (openai/anthropic/custom)
- `encrypted_api_key` (Fernet 加密)
- `base_url`, `model`
- `is_default`

### 关系映射

```
User (1) ──< (N) Project
Project (1) ──< (N) Photo
Project (1) ──< (N) Script
Project (1) ──< (N) VideoTask
Script (1) ──< (N) VideoTask
User (1) ──< (N) UserAiConfig
```

## 测试与质量

**当前状态**: 无测试覆盖

**建议补充**:
- 单元测试: `pytest` + `pytest-asyncio`
- API 测试: `httpx.AsyncClient` 测试端点
- 数据库测试: 使用测试数据库 + 事务回滚
- Mock: 对 LLM 调用和 FFmpeg 进行 mock

## 常见问题 (FAQ)

**Q: 为什么数据库操作必须用 async/await?**
A: 使用 `asyncpg` 驱动和 `AsyncSession`，所有数据库操作都是异步的。同步调用会导致运行时错误。

**Q: Celery 任务为什么用同步数据库连接?**
A: Celery Worker 运行在独立进程，不在 FastAPI 事件循环中。使用 `psycopg2` 同步驱动避免事件循环冲突。

**Q: 如何添加新的 API 端点?**
A:
1. 在 `app/api/` 创建路由模块
2. 在 `app/api/router.py` 注册路由
3. 使用 `Depends(get_current_user)` 添加认证

**Q: 如何加密敏感数据?**
A: 使用 `app/core/security.py` 中的 `encrypt_data()` 和 `decrypt_data()`，基于 Fernet 对称加密。

**Q: 视频生成失败如何调试?**
A:
1. 查看 Celery Worker 日志
2. 检查 FFmpeg 是否安装
3. 验证照片文件路径是否存在
4. 查看 `video_tasks.error_message` 字段

## 相关文件清单

```
backend/
├── app/
│   ├── main.py                 # FastAPI 应用入口
│   ├── api/
│   │   ├── router.py           # 路由聚合
│   │   ├── auth.py             # 认证端点
│   │   ├── projects.py         # 项目管理
│   │   ├── photos.py           # 照片管理
│   │   ├── scripts.py          # 脚本管理
│   │   ├── ai_configs.py       # AI 配置
│   │   └── video_tasks.py      # 视频任务
│   ├── core/
│   │   ├── config.py           # 配置管理
│   │   ├── database.py         # 数据库连接
│   │   ├── deps.py             # 依赖注入
│   │   └── security.py         # 安全工具（JWT、加密）
│   ├── models/                 # SQLAlchemy 模型
│   ├── schemas/                # Pydantic schemas
│   ├── services/
│   │   ├── llm.py              # LLM 服务封装
│   │   └── seed_templates.py  # 初始化模板数据
│   └── tasks/
│       ├── __init__.py         # Celery 应用初始化
│       └── video.py            # 视频生成任务
├── alembic/                    # 数据库迁移
│   └── env.py                  # Alembic 配置
└── requirements.txt            # Python 依赖
```
