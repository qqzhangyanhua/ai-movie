# AI Movie Backend

FastAPI 后端服务，提供视频生成和项目管理功能。

## 快速开始

### 1. 安装 uv（Python 包管理器）

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 2. 安装依赖

```bash
cd backend
uv sync --extra test
```

### 3. 配置环境变量

复制 `.env.example` 到项目根目录的 `.env`：

```bash
cp ../.env.example ../.env
```

编辑 `.env` 设置必填项：

```env
DATABASE_URL=postgresql+asyncpg://aimovie:aimovie_secret@localhost:5432/aimovie
SECRET_KEY=your-secret-key-here
FERNET_KEY=your-fernet-key-here
```

生成密钥：

```bash
# SECRET_KEY
openssl rand -hex 32

# FERNET_KEY
uv run python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### 4. 启动数据库（Docker）

```bash
cd ..
docker-compose up -d postgres redis
```

### 5. 运行数据库迁移

```bash
uv run alembic upgrade head
```

### 6. 启动开发服务器

```bash
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

访问：http://localhost:8000/docs

---

## 开发命令

### 运行测试

```bash
uv run pytest                    # 运行所有测试
uv run pytest -v                 # 详细输出
uv run pytest --cov              # 测试覆盖率
uv run pytest tests/test_auth.py # 运行单个测试文件
```

### 数据库操作

```bash
# 创建迁移
uv run alembic revision --autogenerate -m "描述"

# 应用迁移
uv run alembic upgrade head

# 回滚迁移
uv run alembic downgrade -1

# 查看迁移历史
uv run alembic history
```

### Celery Worker

```bash
uv run celery -A app.tasks worker --loglevel=info
```

### 代码检查

```bash
# 类型检查
uv run mypy app

# 格式化
uv run black app tests
uv run isort app tests
```

---

## 项目结构

```
backend/
├── app/
│   ├── api/           # API 路由
│   ├── core/          # 核心配置（数据库、安全、依赖注入）
│   ├── models/        # SQLAlchemy 模型
│   ├── schemas/       # Pydantic schemas
│   ├── services/      # 业务逻辑（存储、LLM）
│   └── tasks/         # Celery 异步任务
├── tests/             # 测试文件
├── alembic/           # 数据库迁移
├── scripts/           # 工具脚本
└── pyproject.toml     # 项目配置
```

---

## 环境变量

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `DATABASE_URL` | ✅ | - | PostgreSQL 连接串 |
| `SECRET_KEY` | ✅ | - | JWT 签名密钥 |
| `FERNET_KEY` | ✅ | - | 数据加密密钥 |
| `REDIS_URL` | ❌ | `redis://localhost:6379/0` | Redis 连接串 |
| `STORAGE_PROVIDER` | ❌ | `local` | 存储类型（local/s3） |
| `S3_BUCKET` | ❌ | - | S3 存储桶名称 |
| `S3_REGION` | ❌ | - | S3 区域 |
| `S3_ACCESS_KEY` | ❌ | - | S3 访问密钥 |
| `S3_SECRET_KEY` | ❌ | - | S3 密钥 |

---

## 常见问题

### 1. 数据库连接失败

确保 PostgreSQL 正在运行：

```bash
docker-compose ps
```

### 2. 导入错误

确保在虚拟环境中运行命令：

```bash
uv run python your_script.py
```

### 3. 测试数据库

测试使用独立的 `aimovie_test` 数据库，会自动创建和清理。

---

## 技术栈

- **框架**: FastAPI 0.115
- **数据库**: PostgreSQL + SQLAlchemy 2.0
- **异步**: asyncpg + Celery
- **认证**: JWT (python-jose)
- **存储**: 本地文件系统 / AWS S3
- **测试**: pytest + pytest-asyncio
