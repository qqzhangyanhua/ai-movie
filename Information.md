

# 17. 产品信息架构（Information Architecture）

产品主要页面结构如下：

```text
首页
│
├── AI微电影创作
│   │
│   ├── 创建项目
│   │
│   ├── 角色管理
│   │     ├── 添加角色
│   │     ├── 上传照片
│   │     ├── 三视图生成
│   │     └── 角色属性设置
│   │
│   ├── 剧本选择
│   │     ├── 模板剧本
│   │     ├── AI生成剧本
│   │     └── 自定义剧本
│   │
│   ├── 剧本编辑
│   │
│   ├── 分镜生成
│   │
│   ├── 分镜编辑
│   │
│   ├── 视频生成
│   │
│   └── 微电影合成
│
├── 我的角色库
│
├── 我的电影
│     ├── 已生成电影
│     ├── 草稿项目
│     └── 分享记录
│
├── 模板库
│
└── 用户中心
      ├── 账户信息
      ├── 会员管理
      └── 生成记录
```

---

# 18. 页面功能说明

## 18.1 首页

功能：

* 产品介绍
* 示例AI微电影
* 开始创作入口

主要按钮：

```text
开始创作
```

---

## 18.2 AI微电影创作页面

这是产品核心页面。

流程：

```text
添加角色
↓
生成角色
↓
选择剧本
↓
生成分镜
↓
生成视频
↓
合成微电影
```

---

## 18.3 角色管理页面

功能：

* 添加角色
* 上传照片
* 查看三视图
* 设置角色属性

字段：

| 字段   | 说明           |
| ---- | ------------ |
| 角色名称 | 用户自定义        |
| 角色关系 | 情侣 / 朋友 / 敌人 |
| 角色性格 | 勇敢 / 冷酷 / 温柔 |
| 角色风格 | 写实 / 动漫 / 古装 |

---

## 18.4 剧本页面

功能：

选择剧本生成方式：

```text
模板剧本
AI生成剧本
用户自定义剧本
```

用户可：

* 编辑剧本
* 重新生成

---

## 18.5 分镜页面

功能：

显示AI生成的分镜。

每个分镜包含：

```text
Scene
角色
动作
镜头
时长
```

用户可以：

* 编辑分镜
* 删除分镜
* 新增分镜

---

## 18.6 视频生成页面

显示生成进度：

```text
角色生成
剧本生成
视频生成
后期制作
```

用户可以：

* 查看生成进度
* 重新生成镜头

---

## 18.7 结果页面

显示生成的微电影。

功能：

```text
播放视频
下载视频
分享视频
重新生成
```

---

# 19. 数据库结构设计

系统核心数据库包含 **6个核心表**：

```text
User
Character
Script
Storyboard
Video
Project
```

---

# 19.1 用户表（User）

| 字段         | 类型       | 说明   |
| ---------- | -------- | ---- |
| id         | UUID     | 用户ID |
| username   | string   | 用户名  |
| email      | string   | 邮箱   |
| plan       | string   | 会员类型 |
| created_at | datetime | 创建时间 |

---

# 19.2 项目表（Project）

每个微电影是一个项目。

| 字段         | 类型       | 说明   |
| ---------- | -------- | ---- |
| id         | UUID     | 项目ID |
| user_id    | UUID     | 用户ID |
| title      | string   | 电影名称 |
| status     | string   | 生成状态 |
| created_at | datetime | 创建时间 |

---

# 19.3 角色表（Character）

| 字段           | 类型     | 说明          |
| ------------ | ------ | ----------- |
| id           | UUID   | 角色ID        |
| project_id   | UUID   | 项目ID        |
| name         | string | 角色名称        |
| photo_url    | string | 照片地址        |
| embedding    | vector | 角色embedding |
| personality  | string | 角色性格        |
| relationship | string | 角色关系        |

---

# 19.4 剧本表（Script）

| 字段         | 类型       | 说明        |
| ---------- | -------- | --------- |
| id         | UUID     | 剧本ID      |
| project_id | UUID     | 项目ID      |
| type       | string   | 模板 / AI生成 |
| content    | text     | 剧本内容      |
| created_at | datetime | 创建时间      |

---

# 19.5 分镜表（Storyboard）

| 字段           | 类型     | 说明   |
| ------------ | ------ | ---- |
| id           | UUID   | 分镜ID |
| project_id   | UUID   | 项目ID |
| scene_number | int    | 场景编号 |
| description  | text   | 场景描述 |
| camera       | string | 镜头类型 |
| duration     | int    | 时长   |

---

# 19.6 视频表（Video）

| 字段         | 类型     | 说明   |
| ---------- | ------ | ---- |
| id         | UUID   | 视频ID |
| project_id | UUID   | 项目ID |
| video_url  | string | 视频地址 |
| duration   | int    | 视频时长 |
| status     | string | 生成状态 |

---

# 20. AI模型选型方案

AI微电影系统需要 **五类AI模型**：

```text
1 LLM
2 图像生成模型
3 视频生成模型
4 语音模型
5 音乐模型
```

---

# 20.1 剧本生成模型

用途：

* 剧本生成
* 对话生成

推荐模型：

```text
GPT-4 / GPT-5
Claude
DeepSeek
```

---

# 20.2 角色生成模型

用途：

* 人脸识别
* 角色embedding
* 三视图生成

技术：

```text
InstantID
IP Adapter
Zero123
```

---

# 20.3 视频生成模型

用途：

生成视频片段。

推荐：

```text
Runway Gen-3
Pika
Stable Video Diffusion
OpenAI Sora
```

---

# 20.4 语音生成模型

用途：

角色配音。

推荐：

```text
ElevenLabs
OpenAI TTS
```

---

# 20.5 音乐生成模型

用途：

背景音乐生成。

推荐：

```text
Suno
Udio
```

---

# 21. 系统技术架构

系统结构：

```text
Frontend
   │
   ▼
API Gateway
   │
   ▼
Backend Services
   │
   ├── Character Service
   ├── Script Service
   ├── Storyboard Service
   ├── Video Generation Service
   └── Rendering Service
   │
   ▼
AI Model Layer
   │
   ├── LLM
   ├── Image Model
   ├── Video Model
   ├── Voice Model
   └── Music Model
   │
   ▼
Storage
   ├── Database
   ├── Object Storage
   └── CDN
```

---

# 22. 功能优先级

| 优先级 | 功能     |
| --- | ------ |
| P0  | 角色生成   |
| P0  | 模板剧本   |
| P0  | 视频生成   |
| P0  | 30秒微电影 |
| P1  | AI剧本生成 |
| P1  | 分镜编辑   |
| P1  | 字幕     |
| P2  | AI配音   |
| P2  | 音乐生成   |
| P2  | 角色库    |

---

# 23. MVP版本定义

第一版本建议实现：

```text
上传照片
↓
生成角色
↓
选择剧本模板
↓
生成剧本
↓
生成3个分镜
↓
生成3个视频片段
↓
合成30秒电影
```

目标：

验证产品可行性。

---

# 24. 关键产品指标（KPIs）

| 指标     | 目标    |
| ------ | ----- |
| 注册用户   | 增长    |
| 电影生成量  | 核心指标  |
| 平均生成次数 | 用户活跃度 |
| 分享率    | 传播能力  |

---

# 25. 产品总结

AI微电影产品核心生成链路：

```text
角色 → 剧本 → 分镜 → 视频 → 后期 → 微电影
```

这种结构化生成方式相比直接Prompt生成视频：

优势：

* 可控性高
* 角色稳定
* 电影结构完整

---

