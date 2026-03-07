# AI Movie

AI 驱动的视频制作平台，通过照片和 AI 生成的脚本自动创建视频内容。

## 技术栈

**后端**
- FastAPI - 异步 Web 框架
- PostgreSQL - 主数据库
- Redis - 缓存和任务队列
- Celery - 异步任务处理
- SQLAlchemy - ORM
- Alembic - 数据库迁移

**前端**
- React 19 + TypeScript
- Vite - 构建工具
- TailwindCSS - 样式
- Zustand - 状态管理
- React Query - 数据获取
- React Router - 路由
- DnD Kit - 拖拽功能

## 快速开始

### 前置要求

- Docker & Docker Compose
- Node.js 18+ (本地开发)
- Python 3.11+ (本地开发)
- pnpm (前端包管理)

### 使用 Docker Compose 启动

1. 克隆仓库
```bash
git clone <repository-url>
cd ai-movie
```

2. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，设置必要的配置
```

3. 启动所有服务
```bash
docker-compose up -d
```

服务地址：
- 前端: http://localhost:3000
- 后端 API: http://localhost:8000
- API 文档: http://localhost:8000/docs
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### 本地开发

#### 后端开发

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 运行数据库迁移
alembic upgrade head

# 启动开发服务器
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 前端开发

```bash
cd frontend

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

#### Celery Worker

```bash
cd backend
celery -A app.tasks worker --loglevel=info --concurrency=3
```

## 项目结构

```
ai-movie/
├── backend/              # FastAPI 后端
│   ├── app/
│   │   ├── api/         # API 路由
│   │   ├── core/        # 核心配置
│   │   ├── models/      # 数据库模型
│   │   ├── schemas/     # Pydantic schemas
│   │   ├── services/    # 业务逻辑
│   │   └── tasks/       # Celery 任务
│   ├── alembic/         # 数据库迁移
│   └── requirements.txt
├── frontend/            # React 前端
│   ├── src/
│   │   ├── api/        # API 客户端
│   │   ├── components/ # React 组件
│   │   ├── hooks/      # 自定义 hooks
│   │   ├── pages/      # 页面组件
│   │   ├── stores/     # Zustand stores
│   │   └── types/      # TypeScript 类型
│   └── package.json
├── docker-compose.yml
└── .env.example
```

## 核心功能

### 用户管理
- 用户注册和登录
- JWT 认证
- 刷新令牌机制

### 项目管理
- 创建和管理视频项目
- 项目元数据（标题、描述、时长）
- 项目状态跟踪

### 照片管理
- 批量上传照片
- 自动生成缩略图
- 照片池管理
- 拖拽排序

### 脚本生成
- AI 驱动的脚本生成
- 场景分解
- 时间线编辑
- 场景详情配置

### 视频生成
- 异步视频渲染任务
- 任务状态跟踪
- 进度监控
- 视频下载

### AI 配置
- 多 AI 服务提供商支持
- API 密钥加密存储
- 用户级配置管理

## 环境变量

关键配置项（详见 `.env.example`）：

```bash
# 数据库
POSTGRES_USER=aimovie
POSTGRES_PASSWORD=your_password
POSTGRES_DB=aimovie
DATABASE_URL=postgresql+asyncpg://...

# Redis
REDIS_URL=redis://redis:6379/0

# JWT
SECRET_KEY=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# 加密
FERNET_KEY=your-fernet-key

# 上传限制
MAX_FILE_SIZE_MB=10
MAX_PHOTOS_PER_PROJECT=50
MAX_STORAGE_PER_USER_MB=500

# CORS
CORS_ORIGINS=http://localhost:3000
```

## API 文档

启动后端服务后访问：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 数据库迁移

```bash
cd backend

# 创建新迁移
alembic revision --autogenerate -m "description"

# 应用迁移
alembic upgrade head

# 回滚迁移
alembic downgrade -1
```

## 生产部署

1. 修改 `.env` 中的生产配置
2. 生成安全的密钥：
```bash
# SECRET_KEY
openssl rand -hex 32

# FERNET_KEY
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

3. 构建并启动：
```bash
docker-compose up -d --build
```

4. 运行数据库迁移：
```bash
docker-compose exec web alembic upgrade head
```

## 故障排查

### 数据库连接失败
- 检查 PostgreSQL 是否运行：`docker-compose ps`
- 验证 `DATABASE_URL` 配置
- 查看日志：`docker-compose logs postgres`

### Celery 任务不执行
- 检查 Redis 连接：`docker-compose logs redis`
- 查看 worker 日志：`docker-compose logs worker`
- 验证 `REDIS_URL` 配置

### 前端无法连接后端
- 检查 CORS 配置
- 验证后端服务运行状态
- 检查前端 API 基础 URL 配置

## 开发规范

- TypeScript 严格模式，禁止 `any` 类型
- 单文件不超过 500 行，超过则拆分
- 类型定义统一放在 `type.ts` 文件
- 使用 pnpm 管理前端依赖
- 使用 icon 替代 emoji

## License

MIT
