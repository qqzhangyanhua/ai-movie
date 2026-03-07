# 技术债务修复实施计划

## 📋 任务概述

**目标**：全面修复 AI Movie 项目的技术债务
- 添加测试覆盖（后端 pytest + 前端 Vitest）
- 配置管理重构（环境变量 + .env，移除硬编码）
- 存储升级（从本地文件系统迁移到对象存储 S3/OSS）

**任务类型**：
- [x] 后端 (→ Codex)
- [x] 前端 (→ Gemini)
- [x] 全栈 (→ 并行)

---

## 🎯 技术方案（综合 Codex + Gemini 分析）

### 核心策略：渐进式"安全止血 → 测试基线 → 存储迁移"

**方案选择理由**：
1. **安全优先**：修复 P0 级明文密钥泄露（Codex 发现）
2. **测试基线**：无测试覆盖时大规模重构风险极高
3. **渐进迁移**：存储抽象层 + 双写兼容，支持灰度和回滚
4. **性能优化**：后端返回完整 URL，前端通过 CDN 加速（Gemini 建议）

---

## 📝 实施步骤

### Phase 1：安全止血（P0 优先级）⚠️

**目标**：修复关键安全漏洞，移除硬编码敏感信息

#### 1.1 修复明文 API Key 泄露
**问题**：`backend/app/api/video_tasks.py:46-67` 将 `ai_config.api_key` 明文存储到 DB 并返回给前端

**操作**：
- 修改 `VideoTask` 模型，移除 `ai_config` 字段中的 `api_key`
- 仅保存 `provider`、`model`、`config_id`（引用 `UserAiConfig`）
- 视频生成任务从 `UserAiConfig` 动态解密获取密钥

**影响文件**：
| 文件 | 操作 | 说明 |
|------|------|------|
| `backend/app/models/video_task.py` | 修改 | 调整 JSONB 字段结构 |
| `backend/app/api/video_tasks.py:46-67` | 修改 | 移除 `api_key` 持久化逻辑 |
| `backend/app/tasks/video.py` | 修改 | 从 `UserAiConfig` 查询密钥 |

#### 1.2 强制生产环境配置
**问题**：`backend/app/core/config.py` 存在不安全的默认值

**操作**：
```python
# 修改 backend/app/core/config.py
class Settings(BaseSettings):
    # 移除默认值，强制从环境变量读取
    DATABASE_URL: str  # 无默认值
    SECRET_KEY: str  # 无默认值
    FERNET_KEY: str  # 无默认值

    # 保留开发友好的默认值
    REDIS_URL: str = "redis://localhost:6379/0"
    UPLOAD_DIR: str = "uploads"
```

**影响文件**：
| 文件 | 操作 | 说明 |
|------|------|------|
| `backend/app/core/config.py:9-21` | 修改 | 移除敏感默认值 |
| `.env.example:5` | 修复 | 修正 `postgresql+111` 错误 |
| `README.md` | 新增 | 添加环境变量配置说明 |

---

### Phase 2：测试基线建设（P1 优先级）

**目标**：建立自动化测试框架，覆盖核心业务链路

#### 2.1 后端测试框架（pytest）

**依赖安装**：
```bash
cd backend
pip install pytest pytest-asyncio pytest-cov httpx faker
```

**测试结构**：
```
backend/tests/
├── conftest.py              # 测试配置（数据库 fixture）
├── test_auth.py             # 认证 API 测试
├── test_photos.py           # 照片上传/删除测试
├── test_video_tasks.py      # 视频任务测试
└── test_video_generation.py # Celery 任务测试（mock FFmpeg）
```

**关键测试用例**：
1. **认证流程**：注册 → 登录 → 刷新令牌 → 过期处理
2. **照片管理**：上传 → 排序 → 删除 → 存储限制
3. **视频生成**：任务创建 → 状态查询 → 失败重试 → 结果下载
4. **配置加密**：`UserAiConfig` 加密/解密正确性

**影响文件**：
| 文件 | 操作 | 说明 |
|------|------|------|
| `backend/requirements.txt` | 新增 | 添加测试依赖 |
| `backend/tests/conftest.py` | 新建 | 测试数据库 fixture |
| `backend/tests/test_*.py` | 新建 | 各模块测试文件 |
| `backend/pytest.ini` | 新建 | pytest 配置 |

#### 2.2 前端测试框架（Vitest）

**依赖安装**：
```bash
cd frontend
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom msw
```

**测试结构**：
```
frontend/src/__tests__/
├── setup.ts                 # 测试环境配置
├── mocks/
│   └── handlers.ts          # MSW API mock
├── lib/
│   └── axios.test.ts        # Token 刷新拦截器测试
├── stores/
│   └── auth.test.ts         # Zustand 状态测试
└── components/
    ├── PhotosPanel.test.tsx # 照片面板测试
    └── VideoPanel.test.tsx  # 视频面板测试
```

**关键测试用例**：
1. **认证状态**：登录/登出状态管理
2. **Token 刷新**：401 自动刷新令牌逻辑
3. **照片上传**：进度显示、错误处理
4. **时间线编辑**：拖拽排序、场景编辑

**影响文件**：
| 文件 | 操作 | 说明 |
|------|------|------|
| `frontend/package.json` | 修改 | 添加测试脚本和依赖 |
| `frontend/vitest.config.ts` | 新建 | Vitest 配置 |
| `frontend/src/__tests__/*` | 新建 | 测试文件 |

---

### Phase 3：存储抽象层（P1 优先级）

**目标**：引入存储抽象接口，支持本地/S3 双模式

#### 3.1 后端存储抽象

**架构设计**：
```python
# backend/app/services/storage.py
from abc import ABC, abstractmethod

class StorageProvider(ABC):
    @abstractmethod
    async def upload(self, file: bytes, key: str) -> str:
        """上传文件，返回访问 URL"""
        pass

    @abstractmethod
    async def delete(self, key: str) -> None:
        """删除文件"""
        pass

    @abstractmethod
    async def get_url(self, key: str, expires: int = 3600) -> str:
        """获取访问 URL（支持预签名）"""
        pass

class LocalStorage(StorageProvider):
    """本地文件系统存储（兼容现有逻辑）"""
    pass

class S3Storage(StorageProvider):
    """AWS S3 / 阿里云 OSS 存储"""
    pass
```

**配置切换**：
```python
# backend/app/core/config.py
class Settings(BaseSettings):
    STORAGE_PROVIDER: str = "local"  # local | s3
    S3_BUCKET: str | None = None
    S3_REGION: str | None = None
    S3_ACCESS_KEY: str | None = None
    S3_SECRET_KEY: str | None = None
```

**影响文件**：
| 文件 | 操作 | 说明 |
|------|------|------|
| `backend/app/services/storage.py` | 新建 | 存储抽象接口 |
| `backend/app/api/photos.py:64-103` | 修改 | 使用 `StorageProvider` |
| `backend/app/tasks/video.py:53-101` | 修改 | 视频任务使用抽象层 |
| `backend/requirements.txt` | 新增 | 添加 `boto3` 或 `oss2` |

#### 3.2 数据库字段兼容

**迁移策略**：
```python
# 新增字段（保留旧字段兼容）
class Photo(Base):
    file_path: str  # 旧字段（相对路径）
    storage_key: str | None  # 新字段（对象键）
    storage_type: str = "local"  # local | s3
```

**双读逻辑**：
```python
def get_photo_url(photo: Photo) -> str:
    if photo.storage_type == "s3":
        return storage.get_url(photo.storage_key)
    else:
        return f"/uploads/{photo.file_path}"  # 兼容旧数据
```

**影响文件**：
| 文件 | 操作 | 说明 |
|------|------|------|
| `backend/app/models/photo.py` | 修改 | 新增 `storage_key`、`storage_type` |
| `backend/alembic/versions/xxx.py` | 新建 | 数据库迁移脚本 |
| `backend/app/schemas/photo.py` | 修改 | 返回 `url` 字段而非 `file_path` |

#### 3.3 前端适配

**API 响应变更**：
```typescript
// 旧格式
{ file_path: "photos/xxx.jpg" }

// 新格式
{ url: "https://cdn.example.com/photos/xxx.jpg" }
```

**前端修改**：
```typescript
// frontend/src/components/project/PhotosPanel.tsx:92
// 旧代码：const photoUrl = `/uploads/${photo.file_path}`
// 新代码：const photoUrl = photo.url
```

**影响文件**：
| 文件 | 操作 | 说明 |
|------|------|------|
| `frontend/src/types/index.ts` | 修改 | `Photo` 接口新增 `url` 字段 |
| `frontend/src/components/project/PhotosPanel.tsx:92` | 修改 | 使用 `photo.url` |
| `frontend/src/components/project/VideoPanel.tsx:168` | 修改 | 使用 `task.result_video_url` |
| `frontend/vite.config.ts` | 修改 | 移除 `/uploads` 代理（可选） |

---

### Phase 4：数据迁移与清理（P2 优先级）

**目标**：迁移存量数据到对象存储，下线本地存储依赖

#### 4.1 数据回填脚本

```python
# backend/scripts/migrate_to_s3.py
async def migrate_photos():
    """将本地照片迁移到 S3"""
    photos = await db.execute(select(Photo).where(Photo.storage_type == "local"))
    for photo in photos:
        local_path = Path(settings.UPLOAD_DIR) / photo.file_path
        if local_path.exists():
            with open(local_path, "rb") as f:
                key = f"photos/{photo.id}.jpg"
                await s3_storage.upload(f.read(), key)
            photo.storage_key = key
            photo.storage_type = "s3"
            await db.commit()
```

#### 4.2 清理与验证

- 验证所有资源可访问（URL 有效性检查）
- 下线 `backend/app/main.py:39` 的静态文件挂载
- 清理本地 `uploads/` 目录（保留备份）
- 配置对象存储生命周期策略（自动清理孤儿文件）

---

## 🔧 关键文件清单

### 后端修改
| 文件 | 操作 | 优先级 |
|------|------|--------|
| `backend/app/core/config.py` | 修改 | P0 |
| `backend/app/api/video_tasks.py` | 修改 | P0 |
| `backend/app/models/video_task.py` | 修改 | P0 |
| `backend/app/services/storage.py` | 新建 | P1 |
| `backend/app/api/photos.py` | 修改 | P1 |
| `backend/app/tasks/video.py` | 修改 | P1 |
| `backend/app/models/photo.py` | 修改 | P1 |
| `backend/tests/*` | 新建 | P1 |
| `backend/requirements.txt` | 修改 | P1 |

### 前端修改
| 文件 | 操作 | 优先级 |
|------|------|--------|
| `frontend/src/types/index.ts` | 修改 | P1 |
| `frontend/src/components/project/PhotosPanel.tsx` | 修改 | P1 |
| `frontend/src/components/project/VideoPanel.tsx` | 修改 | P1 |
| `frontend/src/__tests__/*` | 新建 | P1 |
| `frontend/package.json` | 修改 | P1 |
| `frontend/vitest.config.ts` | 新建 | P1 |

### 配置文件
| 文件 | 操作 | 优先级 |
|------|------|--------|
| `.env.example` | 修复 | P0 |
| `README.md` | 新增 | P0 |
| `docker-compose.yml` | 修改 | P1 |

---

## ⚠️ 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 配置缺失导致启动失败 | 高 | 启动时验证必填配置，提供清晰错误提示 |
| 存量数据迁移失败 | 中 | 双读兼容 + 分批迁移 + 回滚开关 |
| 视频生成任务耗时增加 | 中 | 本地临时缓存 + 对象存储分段上传 |
| 测试覆盖不足导致回归 | 高 | 先覆盖核心路径（60%），再逐步提升 |
| CDN 缓存导致更新延迟 | 低 | 使用版本化 URL 或 Cache-Control |

---

## 📊 验收标准

### Phase 1（安全止血）
- [ ] 无硬编码敏感信息（SECRET_KEY、DATABASE_URL、FERNET_KEY）
- [ ] `VideoTask` 不再存储/返回明文 `api_key`
- [ ] `.env.example` 配置正确且可用

### Phase 2（测试基线）
- [ ] 后端核心 API 测试覆盖率 ≥ 60%
- [ ] 前端关键组件测试覆盖率 ≥ 50%
- [ ] CI 集成测试自动运行

### Phase 3（存储迁移）
- [ ] 存储抽象层支持 Local/S3 切换
- [ ] 新上传文件自动使用对象存储
- [ ] 旧数据通过双读兼容访问

### Phase 4（清理）
- [ ] 存量数据 100% 迁移到对象存储
- [ ] 本地静态文件服务下线
- [ ] 性能指标：图片加载时间减少 50%+

---

## 🔄 SESSION_ID（供 /ccg:execute 使用）

- **CODEX_SESSION**: `019cc83a-3ff3-7c11-911d-82c5f3c64381`
- **GEMINI_SESSION**: `73abf8dc-f208-4c1b-94e2-ce4284d2d9cd`

---

## 📅 预估时间线

- **Phase 1（安全止血）**: 1-2 天
- **Phase 2（测试基线）**: 1-2 周
- **Phase 3（存储迁移）**: 1-2 周
- **Phase 4（数据清理）**: 3-5 天

**总计**: 3-4 周（可并行部分工作）

---

## 📚 参考资料

- [Pydantic Settings 文档](https://docs.pydantic.dev/latest/concepts/pydantic_settings/)
- [pytest-asyncio 文档](https://pytest-asyncio.readthedocs.io/)
- [Vitest 文档](https://vitest.dev/)
- [MSW (Mock Service Worker)](https://mswjs.io/)
- [boto3 S3 文档](https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/s3.html)
