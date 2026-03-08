[根目录](../CLAUDE.md) > **backend**

# Backend 模块文档

## 变更记录 (Changelog)

- **2025-03-29 14:23:45** - 完整架构扫描，更新依赖与测试覆盖率统计
- **2026-03-08 18:01:49** - 更新文档，新增 BGM 功能、存储服务抽象、测试文件统计
- **2026-03-07 20:10:23** - 初始化后端模块文档

## 模块职责

FastAPI 异步后端服务，负责：
- REST API 提供（用户认证、项目管理、照片上传、脚本生成、视频任务、BGM 管理）
- 数据持久化（PostgreSQL + SQLAlchemy ORM）
- 异步任务调度（Celery + Redis）
- 文件存储管理（照片、缩略图、视频、BGM，支持本地和 S3）
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
| `/api/v1/bgm` | `api/bgm.py` | BGM 库管理 |

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
- `POST /scripts/generate` - AI 生成脚本
- `GET /scripts/{id}` - 获取脚本详情
- `PUT /scripts/{id}` - 更新脚本内容
- `DELETE /scripts/{id}` - 删除脚本

**视频任务**:
- `POST /video-tasks` - 创建视频生成任务
- `GET /video-tasks/{id}` - 查询任务状态
- `GET /video-tasks` - 获取用户任务列表

**BGM**:
- `GET /bgm` - 获取 BGM 列表
- `POST /bgm` - 上传 BGM
- `DELETE /bgm/{id}` - 删除 BGM

## 关键依赖与配置

### 核心依赖

```txt
fastapi==0.115.6          # Web 框架
uvicorn[standard]==0.34.0 # ASGI 服务器
sqlalchemy[asyncio]==2.0.36  # ORM
asyncpg==0.30.0           # PostgreSQL 异步驱动
alembic==1.14.1           # 数据库迁移
pydantic[email]==2.10.4   # 数据验证
pydantic-settings==2.7.1  # 配置管理
python-jose[cryptography]==3.3.0  # JWT
passlib[bcrypt]==1.7.4    # 密码哈希
celery[redis]==5.4.0      # 任务队列
redis==5.2.1              # Redis 客户端
httpx==0.28.1             # HTTP 客户端（调用 LLM）
Pillow==11.1.0            # 图像处理
ffmpeg-python==0.2.0      # 视频处理
boto3==1.35.94            # AWS S3 客户端
```

### 配置文件

**`app/core/config.py`** - 基于 Pydantic Settings:
```python
class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Movie"
    API_V1_PREFIX: str = "/api/v1"

    DATABASE_URL: str
    REDIS_URL: str

    SECRET_KEY: str
    FERNET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    CORS_ORIGINS: str = "http://localhost:3000"

    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 10
    MAX_PHOTOS_PER_PROJECT: int = 50

    STORAGE_PROVIDER: str = "local"  # local | s3
    S3_BUCKET: str | None = None
    S3_REGION: str | None = None
```

## 数据模型

### SQLAlchemy 模型 (`app/models/`)

**User** - 用户表:
```python
id: UUID
username: str (unique)
email: str (unique)
hashed_password: str
created_at: datetime
```

**Project** - 项目表:
```python
id: UUID
user_id: UUID (FK)
title: str
description: str | None
duration: int (秒)
created_at: datetime
updated_at: datetime
```

**Photo** - 照片表:
```python
id: UUID
project_id: UUID (FK)
file_path: str (相对路径)
thumbnail_path: str
storage_key: str | None (S3 key)
order: int
uploaded_at: datetime
```

**Script** - 脚本表:
```python
id: UUID
project_id: UUID (FK)
content: dict (JSONB，存储场景数组)
created_at: datetime
updated_at: datetime
```

**VideoTask** - 视频任务表:
```python
id: UUID
project_id: UUID (FK)
script_id: UUID (FK)
status: str (pending/processing/completed/failed)
progress: int (0-100)
result_video_path: str | None
error_message: str | None
created_at: datetime
completed_at: datetime | None
```

**BgmTrack** - BGM 音轨表:
```python
id: UUID
user_id: UUID (FK)
title: str
file_path: str
storage_key: str | None
duration: float (秒)
uploaded_at: datetime
```

**UserAiConfig** - AI 配置表:
```python
id: UUID
user_id: UUID (FK)
provider: str (openai/anthropic/...)
encrypted_api_key: bytes
model_name: str
created_at: datetime
```

## 测试与质量

**当前状态**: 有基础测试框架，但覆盖率不足
- `tests/conftest.py`: pytest 配置和 fixtures
- `tests/test_auth.py`: 认证端点测试

**建议补充**:
- API 端点测试（projects, photos, scripts, video_tasks, bgm）
- Services 单元测试（LLM, storage）
- Tasks 测试（video generation，使用 mock）
- 集成测试（完整用户流程）

**运行测试**:
```bash
pytest                    # 运行所有测试
pytest --cov=app         # 生成覆盖率报告
pytest -v tests/test_auth.py  # 运行特定测试
```

## 常见问题 (FAQ)

**Q: 如何添加新的 API 端点?**
A:
1. 在 `app/api/` 创建路由模块
2. 在 `app/api/router.py` 中注册路由
3. 在 `app/schemas/` 定义请求/响应模型
4. 使用 `Depends(get_current_user)` 添加认证

**Q: 如何处理文件上传?**
A: 使用 `app/services/storage.py` 的 `StorageService`:
```python
storage = StorageService()
key = await storage.save_file(file, "photos")
url = storage.get_file_url(key)
```

**Q: 如何调用 LLM 生成脚本?**
A: 使用 `app/services/llm.py` 的 `LLMService`:
```python
llm = LLMService(config)
script = await llm.generate_script(photos, prompt)
```

**Q: Celery 任务如何更新进度?**
A: 在任务中直接更新数据库:
```python
task.progress = 50
session.commit()
```

**Q: 如何切换到 S3 存储?**
A: 设置环境变量:
```bash
STORAGE_PROVIDER=s3
S3_BUCKET=my-bucket
S3_REGION=us-east-1
S3_ACCESS_KEY=xxx
S3_SECRET_KEY=xxx
```

**Q: 数据库迁移失败怎么办?**
A:
```bash
alembic downgrade -1  # 回滚一个版本
alembic history       # 查看迁移历史
alembic current       # 查看当前版本
```

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
│   │   ├── video_tasks.py      # 视频任务
│   │   └── bgm.py              # BGM 管理
│   ├── core/
│   │   ├── config.py           # 配置管理
│   │   ├── database.py         # 数据库连接
│   │   ├── deps.py             # 依赖注入
│   │   └── security.py         # 安全工具（JWT、加密）
│   ├── models/                 # SQLAlchemy 模型
│   │   ├── user.py
│   │   ├── project.py
│   │   ├── photo.py
│   │   ├── script.py
│   │   ├── video_task.py
│   │   ├── user_ai_config.py
│   │   └── bgm.py
│   ├── schemas/                # Pydantic schemas
│   ├── services/
│   │   ├── llm.py              # LLM 服务封装
│   │   ├── seed_templates.py  # 初始化模板数据
│   │   └── storage.py          # 存储服务抽象
│   └── tasks/
│       ├── __init__.py         # Celery 应用初始化
│       └── video.py            # 视频生成任务
├── alembic/                    # 数据库迁移
│   ├── env.py                  # Alembic 配置
│   └── versions/
│       ├── 001_storage_migration.py
│       └── e8bf1bffa176_add_bgm_tracks_table.py
├── tests/                      # 测试目录
│   ├── conftest.py
│   └── test_auth.py
├── requirements.txt            # Python 依赖
├── alembic.ini                 # Alembic 配置
└── Dockerfile                  # Docker 镜像构建
```
