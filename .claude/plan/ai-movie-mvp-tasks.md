# AI Movie MVP 任务分解计划

**生成时间**: 2026-03-09
**项目**: AI Movie - AI 微电影生成平台
**当前状态**: 数据模型完整，业务逻辑约 6% 完成度

---

## 📊 项目现状分析

### 已完成
- ✅ Next.js 项目脚手架
- ✅ Prisma 数据模型（User, Project, Character, Script, Storyboard, VideoClip, Video）
- ✅ NextAuth 认证系统
- ✅ BullMQ 队列框架
- ✅ Worker 服务框架（Python）
- ✅ 基础页面布局（dashboard, create, templates, characters）

### 缺失
- ❌ 角色系统业务逻辑（人脸识别、三视图生成、embedding）
- ❌ 剧本生成前端交互
- ❌ 分镜系统完整实现
- ❌ 视频生成 API 集成（Runway/Luma/Pika）
- ❌ 后期制作服务（TTS、BGM、字幕）
- ❌ S3 存储集成
- ❌ 项目管理完整流程

---

## 🎯 阶段一：MVP 核心功能（P0 - 必须完成）

### 任务 1：角色系统完善
**优先级**: P0
**预计工时**: 3-5 天
**状态**: 🔴 数据模型完整，业务逻辑缺失

#### 缺失功能
1. 角色创建 API（`POST /api/characters`）
2. 人脸识别与特征提取
3. 三视图生成（front/side/back view）
4. 角色 embedding 生成
5. 角色列表/详情页面 UI

#### 技术方案
- **人脸识别**: OpenAI Vision API 或 Face++ API
- **三视图生成**: Stable Diffusion + ControlNet（Replicate API）
- **Embedding**: CLIP 或 InstantID 提取特征向量

#### 关键文件
| 文件 | 操作 | 说明 |
|------|------|------|
| `app/api/characters/route.ts` | 创建 | 角色 CRUD API |
| `lib/actions/character.ts` | 补充 | 已存在但功能不完整 |
| `worker/services/character_service.py` | 补充 | 已有框架，需实现具体逻辑 |
| `app/(auth)/dashboard/characters/page.tsx` | 补充 | 当前是空壳页面 |

#### 实施步骤
1. 实现 `POST /api/characters` 端点
   - 接收照片上传
   - 调用 BullMQ 任务 `character:create`
   - 返回任务 ID

2. 实现 `worker/services/character_service.py`
   - `generate_character_views()`: 调用 Replicate API 生成三视图
   - `generate_character_embedding()`: 使用 CLIP 提取特征向量
   - 更新数据库 Character 表

3. 实现前端页面 `app/(auth)/dashboard/characters/page.tsx`
   - 角色列表展示
   - 上传照片表单
   - 实时进度显示（WebSocket 或轮询）

#### 风险与缓解
| 风险 | 缓解措施 |
|------|----------|
| 三视图生成质量不稳定 | 添加重试机制（最多 3 次） |
| Embedding 序列化问题 | 使用 base64 编码存储 |
| API 成本过高 | MVP 阶段跳过三视图生成 |

---

### 任务 2：剧本系统实现
**优先级**: P0
**预计工时**: 2-3 天
**状态**: 🟡 Worker 已实现 `generate_script`，但缺少前端交互

#### 缺失功能
1. 模板剧本库（至少 5 个预设模板）
2. 剧本编辑器 UI（场景列表、时长调整、对白编辑）
3. 剧本预览功能

#### 技术方案
- **模板存储**: 在 `lib/data/script-templates.ts` 中定义 JSON 模板
- **AI 生成**: 已有 `worker/services/llm_service.py`，确认 OpenAI API 调用
- **编辑器**: React DnD 实现拖拽排序

#### 关键文件
| 文件 | 操作 | 说明 |
|------|------|------|
| `lib/data/script-templates.ts` | 创建 | 存储模板剧本 |
| `app/api/scripts/generate/route.ts` | 创建 | 触发 BullMQ 任务 |
| `app/(auth)/create/[projectId]/page.tsx` | 补充 | 当前只有基础布局 |
| `components/script-editor.tsx` | 创建 | 剧本编辑器组件 |

#### 实施步骤
1. 创建模板库 `lib/data/script-templates.ts`
   ```typescript
   export const scriptTemplates = [
     {
       id: 'romantic-rain',
       title: '雨夜告白',
       genre: '爱情',
       scenes: [
         { description: '男主在雨中等待', duration: 5 },
         { description: '女主出现', duration: 5 },
         { description: '两人告白', duration: 5 }
       ]
     },
     // ... 更多模板
   ]
   ```

2. 实现 `POST /api/scripts/generate` 端点
   - 接收 projectId + prompt 或 templateId
   - 调用 BullMQ 任务 `script:generate`
   - 返回任务 ID

3. 实现剧本编辑器组件
   - 场景列表（可拖拽排序）
   - 场景编辑（描述、时长、对白）
   - 保存到数据库

#### 风险与缓解
| 风险 | 缓解措施 |
|------|----------|
| OpenAI API 成本 | 每次生成约 $0.02-0.05，可接受 |
| 生成质量不稳定 | 优化 prompt，添加示例 |

---

### 任务 3：分镜系统实现
**优先级**: P0
**预计工时**: 3-4 天
**状态**: 🔴 数据模型完整，业务逻辑为零

#### 缺失功能
1. 根据剧本生成分镜 API（`POST /api/storyboards/generate`）
2. 分镜编辑器（拖拽排序、时长调整、镜头类型选择）
3. 分镜预览图生成（可选，MVP 可用占位图）

#### 技术方案
- **分镜生成**: 基于 Script.content 的场景描述，调用 LLM 生成分镜描述
- **预览图**: 调用 Stable Diffusion 生成静态图（MVP 阶段可跳过）
- **编辑器**: 复用剧本编辑器的拖拽逻辑

#### 关键文件
| 文件 | 操作 | 说明 |
|------|------|------|
| `app/api/storyboards/generate/route.ts` | 创建 | 分镜生成 API |
| `lib/actions/storyboard.ts` | 补充 | 已存在但功能不完整 |
| `worker/services/image_service.py` | 补充 | 已有 `generate_storyboard_preview` 框架 |
| `components/storyboard-editor.tsx` | 创建 | 分镜编辑器组件 |

#### 实施步骤
1. 实现 `POST /api/storyboards/generate` 端点
   - 读取 Script.content
   - 为每个场景生成分镜描述（调用 LLM）
   - 创建 Storyboard 记录

2. 实现分镜编辑器组件
   - 分镜列表（可拖拽排序）
   - 分镜编辑（描述、角色、动作、镜头类型、时长）
   - 保存到数据库

3. （可选）实现预览图生成
   - 调用 `worker/services/image_service.py`
   - 使用 Stable Diffusion 生成静态图

#### 风险与缓解
| 风险 | 缓解措施 |
|------|----------|
| 预览图生成耗时长 | MVP 阶段使用占位图 |
| 并发过高 | 使用队列限流 |

---

### 任务 4：视频生成系统（核心）
**优先级**: P0（最高）
**预计工时**: 5-7 天
**状态**: 🔴 Worker 有框架但未集成真实视频生成 API

#### 缺失功能
1. 集成视频生成 API（Runway Gen-3 / Luma Dream Machine / Pika）
2. 角色一致性保证（InstantID / IP-Adapter）
3. 视频片段生成 Worker（`worker/services/video_service.py`）
4. 视频合成逻辑（FFmpeg 拼接多个片段）

#### 技术方案
**视频生成 API 选择**:
- **Runway Gen-3**: $0.05/秒，质量最高，但 API 限流严格
- **Luma Dream Machine**: $0.12/秒，速度快，但角色一致性差
- **Pika**: $0.08/秒，平衡选择

**角色一致性**:
- 方案 A: 使用 InstantID（需自部署，成本高）
- 方案 B: 在 prompt 中加入角色描述（效果有限）
- **MVP 建议**: 先用方案 B，后续优化

**视频合成**: 使用 FFmpeg 拼接 + 添加 BGM

#### 关键文件
| 文件 | 操作 | 说明 |
|------|------|------|
| `worker/services/video_service.py` | 补充 | 已有 `generate_video_clip` 框架 |
| `worker/utils/ffmpeg_compose.py` | 补充 | 已有 `compose_video` 框架 |
| `app/api/videos/generate/route.ts` | 创建 | 触发视频生成任务 |
| `lib/queue.ts` | 补充 | BullMQ 队列配置 |

#### 实施步骤
1. 选择并集成视频生成 API
   - 注册 Runway/Luma/Pika 账号
   - 获取 API Key
   - 实现 `worker/services/video_service.py` 中的 API 调用

2. 实现视频片段生成逻辑
   ```python
   def generate_video_clip(storyboard_id: str, prompt: str, character_embedding: bytes):
       # 1. 构建 prompt（包含角色描述）
       # 2. 调用视频生成 API
       # 3. 轮询任务状态
       # 4. 下载视频到 S3
       # 5. 更新 VideoClip 表
   ```

3. 实现视频合成逻辑
   ```python
   def compose_video(project_id: str):
       # 1. 获取所有 VideoClip
       # 2. 使用 FFmpeg 拼接
       # 3. 添加 BGM
       # 4. 上传到 S3
       # 5. 更新 Video 表
   ```

4. 实现 `POST /api/videos/generate` 端点
   - 触发 BullMQ 任务 `video:generate`
   - 返回任务 ID

#### 风险与缓解
| 风险 | 缓解措施 |
|------|----------|
| **成本极高** | MVP 限制为 15 秒视频（3 个 5 秒片段） |
| **生成时间长** | 添加进度通知（WebSocket） |
| **失败率高** | 添加重试机制（最多 3 次） |
| **角色一致性差** | 降低用户期望，标注为"风格化视频" |

---

### 任务 5：后期制作系统
**优先级**: P0
**预计工时**: 3-4 天
**状态**: 🟡 Worker 有框架，但未集成真实 API

#### 缺失功能
1. TTS 配音（OpenAI TTS / ElevenLabs）
2. BGM 自动匹配（从预设音乐库选择）
3. 字幕生成（基于剧本对白）
4. 视频拼接（FFmpeg）

#### 技术方案
- **TTS**: 使用 OpenAI TTS API（$0.015/1K 字符）
- **BGM**: 预设 10 首不同风格的音乐，根据剧本情绪匹配
- **字幕**: 使用 FFmpeg 烧录字幕（SRT 格式）

#### 关键文件
| 文件 | 操作 | 说明 |
|------|------|------|
| `worker/services/voice_service.py` | 补充 | 已有 `generate_scene_voiceovers` 框架 |
| `worker/services/music_service.py` | 补充 | 已有 `generate_project_bgm` 框架 |
| `lib/data/bgm-library.ts` | 创建 | 预设 BGM 库 |

#### 实施步骤
1. 实现 TTS 配音
   ```python
   def generate_scene_voiceovers(script_content: dict):
       # 1. 提取对白
       # 2. 调用 OpenAI TTS API
       # 3. 保存音频文件到 S3
       # 4. 返回音频 URL 列表
   ```

2. 创建 BGM 库
   ```typescript
   export const bgmLibrary = [
     { id: 'romantic-1', genre: '浪漫', url: '/bgm/romantic-1.mp3' },
     { id: 'suspense-1', genre: '悬疑', url: '/bgm/suspense-1.mp3' },
     // ... 更多 BGM
   ]
   ```

3. 实现 BGM 匹配逻辑
   ```python
   def generate_project_bgm(script_metadata: dict):
       # 1. 提取剧本情绪（从 metadata 或 LLM 分析）
       # 2. 匹配 BGM
       # 3. 返回 BGM URL
   ```

4. 实现字幕生成
   ```python
   def generate_subtitles(script_content: dict):
       # 1. 提取对白和时间戳
       # 2. 生成 SRT 文件
       # 3. 使用 FFmpeg 烧录字幕
   ```

#### 风险与缓解
| 风险 | 缓解措施 |
|------|----------|
| TTS 语音不自然 | 使用 ElevenLabs（质量更高但成本更高） |
| BGM 版权问题 | 使用免版权音乐库（如 Pixabay） |

---

### 任务 6：视频输出系统
**优先级**: P0
**预计工时**: 2-3 天
**状态**: 🟡 页面存在但功能不完整

#### 缺失功能
1. 视频播放器页面（`app/(public)/movie/[videoId]/page.tsx` 已存在但未实现）
2. 下载功能（生成预签名 URL）
3. 分享功能（生成海报 + 短链接）

#### 技术方案
- **播放器**: 使用 HTML5 `<video>` 标签
- **下载**: S3 预签名 URL（有效期 1 小时）
- **海报**: 调用 `worker/services/poster_service.py`

#### 关键文件
| 文件 | 操作 | 说明 |
|------|------|------|
| `app/(public)/movie/[videoId]/page.tsx` | 补充 | 当前是空壳 |
| `app/api/videos/[videoId]/download/route.ts` | 创建 | 生成下载链接 |
| `worker/services/poster_service.py` | 补充 | 已有 `generate_poster` 框架 |

#### 实施步骤
1. 实现视频播放器页面
   - 获取 Video 记录
   - 展示视频播放器
   - 展示海报、标题、描述

2. 实现下载功能
   ```typescript
   // app/api/videos/[videoId]/download/route.ts
   export async function GET(req: Request, { params }: { params: { videoId: string } }) {
     const video = await prisma.video.findUnique({ where: { id: params.videoId } })
     const presignedUrl = await generatePresignedUrl(video.videoUrl)
     return Response.json({ url: presignedUrl })
   }
   ```

3. 实现海报生成
   ```python
   def generate_poster(project_id: str):
       # 1. 获取项目信息
       # 2. 调用 Stable Diffusion 生成海报
       # 3. 上传到 S3
       # 4. 更新 Video.posterUrl
   ```

#### 风险与缓解
| 风险 | 缓解措施 |
|------|----------|
| 海报生成耗时长 | 异步生成，先展示占位图 |

---

## 🎨 阶段二：用户体验增强（P1）

### 任务 7：项目管理完善
**优先级**: P1
**预计工时**: 2-3 天

#### 缺失功能
1. 项目列表页（`app/(auth)/dashboard/page.tsx` 需补充）
2. 项目详情页（时间线编辑器）
3. 项目状态流转（DRAFT → SCRIPT_READY → GENERATING → COMPLETED）

---

### 任务 8：模板库实现
**优先级**: P1
**预计工时**: 2 天

#### 缺失功能
1. 模板浏览页面（`app/(auth)/dashboard/templates/page.tsx` 当前是空壳）
2. 模板预览
3. 模板应用到项目

---

### 任务 9：角色库管理
**优先级**: P1
**预计工时**: 2 天

#### 缺失功能
1. 角色管理页面（`app/(auth)/dashboard/characters/page.tsx` 当前是空壳）
2. 角色复用逻辑
3. 角色删除/编辑

---

## 💰 阶段三：商业化功能（P2）

### 任务 10：会员系统
**优先级**: P2
**预计工时**: 3-4 天

#### 缺失功能
1. 免费用户限制（3 次生成）
2. 付费套餐页面
3. 支付集成（Stripe）
4. 用量统计

---

### 任务 11：高级功能
**优先级**: P2
**预计工时**: 按需开发

#### 功能列表
- 高清输出（4K）
- 长视频支持（3 分钟+）
- 高级模板（付费）
- 水印移除

---

## 🌐 阶段四：社交与增长（P3）

### 任务 12：社交系统
**优先级**: P3
**预计工时**: 5-7 天

#### 功能列表
- 视频分享到社交平台
- 公开视频广场
- 点赞/评论
- 用户主页

---

### 任务 13：AI 演员库
**优先级**: P3
**预计工时**: 3-5 天

#### 功能列表
- 虚拟角色库
- 角色租赁机制

---

## 🚨 技术债务与风险

### 1. 视频生成成本过高
**问题**: 30 秒视频生成成本 $1.5-3.0，免费用户 3 次 = $4.5-9.0 亏损

**建议**:
- MVP 阶段限制为 15 秒视频（3 个 5 秒片段）
- 免费用户只给 1 次机会
- 月会员定价至少 $29.99

### 2. 角色一致性技术难题
**问题**: 当前 AI 视频模型无法保证角色 100% 一致

**建议**:
- MVP 阶段降低用户期望：生成"风格化视频"而非"真人微电影"
- 或转向动画风格（一致性更容易保证）

### 3. Worker 队列未完全实现
**问题**: BullMQ 已安装，但 `worker/consumer.py` 中的服务函数大多是空壳

**建议**:
- 优先实现 `video_service.py` 和 `llm_service.py`
- 其他服务可以先用 mock 数据

### 4. 存储成本
**问题**: 视频文件巨大（1 分钟 ≈ 50MB），本地存储不可行

**建议**:
- 立即配置 S3 存储（已有 `@aws-sdk/client-s3` 依赖）
- 实现 `lib/storage.ts` 的 S3 上传逻辑

---

## 📊 MVP 最小闭环建议

如果资源有限，建议先实现以下最小闭环（2 周内完成）：

### 核心流程
1. **用户上传 1 张照片** → 存储到 S3
2. **AI 生成 3 句话剧本** → 调用 OpenAI API
3. **生成 3 个 5 秒视频片段** → 调用 Runway/Luma API
4. **FFmpeg 拼接 + 加 BGM** → 生成 15 秒视频
5. **返回视频播放页面** → 用户可下载

### 跳过的功能（后续迭代）
- 三视图生成
- 分镜编辑器
- TTS 配音
- 字幕生成
- 角色库管理

### 成本估算
- 单次生成成本: $0.75-1.5（3 个 5 秒片段）
- 免费用户 1 次: $0.75-1.5
- 月会员 10 次: $7.5-15（定价 $29.99，毛利 50%）

---

## 📝 实施优先级总结

### 第 1 周（核心基础）
1. S3 存储集成（任务 4 前置）
2. 剧本生成前端交互（任务 2）
3. 视频生成 API 集成（任务 4）

### 第 2 周（完整闭环）
4. 视频合成逻辑（任务 4）
5. 视频播放器页面（任务 6）
6. 项目管理基础流程（任务 7）

### 第 3-4 周（体验优化）
7. 角色系统完善（任务 1）
8. 分镜系统实现（任务 3）
9. 后期制作系统（任务 5）

### 第 5-6 周（商业化）
10. 会员系统（任务 10）
11. 模板库（任务 8）
12. 角色库（任务 9）

---

## 🔄 迭代策略

### MVP v1.0（2 周）
- 最小闭环：照片 → 剧本 → 视频
- 目标：验证技术可行性

### MVP v1.1（4 周）
- 完整流程：角色 → 剧本 → 分镜 → 视频
- 目标：验证用户体验

### MVP v2.0（6 周）
- 商业化：会员系统 + 付费功能
- 目标：验证商业模式

---

## 📌 关键决策点

### 1. 视频生成 API 选择
**需要决策**: Runway vs Luma vs Pika
**建议**: 先用 Luma（速度快，成本适中），后续可切换

### 2. 角色一致性方案
**需要决策**: InstantID（自部署）vs Prompt 工程
**建议**: MVP 用 Prompt 工程，v2.0 再考虑 InstantID

### 3. 免费用户策略
**需要决策**: 免费次数（1 次 vs 3 次）
**建议**: 1 次（控制成本），用户满意后再付费

### 4. 视频时长
**需要决策**: 15 秒 vs 30 秒
**建议**: 15 秒（成本减半），后续推出"长视频"付费功能

---

## 🎯 成功指标

### 技术指标
- 视频生成成功率 > 80%
- 平均生成时间 < 10 分钟
- 角色一致性评分 > 7/10（用户主观评价）

### 业务指标
- 注册用户 > 1000
- 付费转化率 > 5%
- 月活跃用户 > 200

### 成本指标
- 单次生成成本 < $1.5
- 免费用户成本 < $1.5/人
- 付费用户 LTV > $50

---

## 📞 下一步行动

1. **技术选型确认**
   - 选择视频生成 API（Runway/Luma/Pika）
   - 注册账号并获取 API Key
   - 测试 API 调用

2. **成本核算**
   - 计算单次生成成本
   - 确定免费次数和定价策略

3. **开发排期**
   - 分配任务给团队成员
   - 设定里程碑和交付日期

4. **用户测试**
   - 招募 Beta 测试用户
   - 收集反馈并迭代

---

**计划生成时间**: 2026-03-09
**计划版本**: v1.0
**下次更新**: 根据实施进度调整
