**语言: 中文 | [English](README.md) | [Español](README.es.md) | [Português](README.pt.md)**

# Sleep Sync

一款帮助你利用昼夜节律相位提前技术逐步调整睡眠时间的桌面应用。

![Sleep Sync](sync.png)

## 问题所在

如果你习惯凌晨 3 点入睡、中午才醒来，这并不是你有什么问题。你只是属于晚型时间类型——一种内部生物钟与常规作息存在偏移的生理变异。数以百万计的人都面临这种情况：凌晨 2 点编码效率最高的开发者、在别人入睡后才进入最佳状态的游戏玩家、在日夜班之间轮换的倒班工人，或者任何患有睡眠时相延迟综合征（DSPS）的人。

常见的建议——"早点上床就好"——大约 80% 的情况下都会失败，因为你的昼夜节律会抵抗突然的改变。这就像强迫自己长期处于时差状态。

## 科学原理

你的昼夜节律由视交叉上核调控，这是一组对光线、温度、进食时间和褪黑素产生反应的神经元簇。试图一夜之间将睡眠时间提前 3 小时，等于同时对抗所有这些信号。

**相位提前**采用不同的方法：不进行一次大幅调整，而是每隔几天将作息时间提前 30-60 分钟，并穿插巩固日来维持当前时间表。这让你的内部生物钟有时间重新校准，而不会受到社交时差的压力。临床研究表明，渐进式相位提前的成功率超过 80%，而突然调整的成功率不到 20%。

## 工作原理

Sleep Sync 将此方法实现为每日计划：

1. 你设定当前的入睡/起床时间和目标作息时间。
2. 在**提前日**，应用会将你的目标就寝时间提前一个可配置的量（30-50 分钟）。
3. 在**巩固日**，你保持当前的作息时间，让身体进行巩固适应。
4. 应用会根据你的起床时间追踪全天 **9 个精力阶段**（睡眠惯性、上午高峰、午后低谷、放松准备等），让你了解每个小时身体的状态。

你可以强制将任何特定日期设为巩固日或提前日，并通过内置检查确认提前完成情况。

## 适用人群

- **开发者与夜猫子** —— 将深度专注时段转移到更实用的时间，同时不失去它
- **游戏玩家与主播** —— 将巅峰状态与直播时间对齐
- **DSPS 患者** —— 一种结构化的、无需药物的方法来调整睡眠窗口
- **倒班工人** —— 减少日夜班轮换时的昼夜节律紊乱

## 技术栈

| 层级     | 技术                                                    |
|----------|---------------------------------------------------------|
| 前端     | React 19, Vite 7, Tailwind CSS 4, Lucide React         |
| 后端     | Express 5, better-sqlite3 (WAL 模式)                   |
| 认证     | Google OAuth 2.0 (react-oauth/google + google-auth-library), JWT |
| 国际化   | i18next, react-i18next, 浏览器语言检测                  |
| 桌面端   | Electron 33, electron-builder (NSIS 安装程序)           |
| 测试     | Node.js 内置测试运行器 (node:test), 72 项测试           |

## 快速开始

### 前提条件

- **Node.js 20+**（使用 `--env-file` 参数；推荐 24+）
- 一个来自 [Google Cloud Console](https://console.cloud.google.com/) 的 **Google OAuth Client ID**

### Google OAuth 配置

1. 前往 Google Cloud Console > APIs & Services > Credentials。
2. 创建一个 **OAuth 2.0 Client ID**（Web application 类型）。
3. 在 **Authorized JavaScript origins** 下添加 `http://localhost:5173`。
4. 复制 Client ID 以供下一步使用。

### 安装

```bash
git clone https://github.com/aqsashlux/sleep-sync.git
cd sleep-sync
npm install
```

在项目根目录创建 `.env` 文件并填入你的值：

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com  # same value
JWT_SECRET=any-long-random-string
PORT=3001  # optional, defaults to 3001
```

### 运行

打开两个终端：

```bash
# 终端 1 -- 后端 (端口 3001)
node --env-file=.env server.js

# 终端 2 -- 前端 (端口 5173)
npm run dev
```

打开 [http://localhost:5173](http://localhost:5173)，使用 Google 账号登录，或点击**无需账号试用**以使用访客模式（数据仅存储在本地）。

## 命令

| 命令                              | 描述                              |
|-----------------------------------|-----------------------------------|
| `npm run dev`                     | 启动 Vite 开发服务器              |
| `node --env-file=.env server.js`  | 启动 Express 后端                 |
| `npm run build`                   | 生产环境构建                      |
| `npm run electron:build:win`      | 构建 Windows 桌面应用 (NSIS)      |
| `npm run lint`                    | 运行 ESLint                       |
| `node --test tests/*.test.js`    | 运行全部 72 项测试                |
| `node db/migrate.js`             | 将旧版 db.json 迁移至 SQLite      |

## 项目结构

```
sleep-sync/
├── server.js              # Express 编排器（约 35 行）
├── config.js              # 集中配置（端口、数据库路径、JWT、OAuth）
├── .env.example           # 环境变量模板
├── db/
│   ├── schema.sql         # SQLite DDL（4 张表）
│   ├── database.js        # SQLite 初始化 + getDB() 单例
│   └── migrate.js         # db.json -> SQLite 迁移
├── middleware/
│   └── auth.js            # requireAuth + optionalAuth（JWT 验证）
├── routes/
│   ├── auth.js            # Google OAuth 令牌交换、会话端点
│   └── data.js            # 睡眠数据 CRUD，完整输入验证
├── services/
│   ├── user-service.js    # 用户 CRUD (findOrCreateUserByGoogle)
│   └── sleep-service.js   # 睡眠设置、覆盖、提前检查
├── src/
│   ├── main.jsx           # 应用入口（OAuth + Auth providers）
│   ├── App.jsx            # HashRouter，受保护/公开路由
│   ├── i18n/
│   │   ├── index.js       # i18next 配置（检测、降级）
│   │   └── locales/       # en, es, pt, zh 翻译 JSON 文件
│   ├── context/
│   │   └── AuthContext.jsx # Google 认证 + 访客模式
│   ├── hooks/
│   │   └── useAuth.js
│   ├── lib/
│   │   └── api.js         # HTTP 客户端，携带 Bearer 令牌，401 时自动登出
│   └── components/
│       ├── CircadianCalculator.jsx   # 主应用逻辑与界面
│       ├── LoginScreen.jsx           # Google 登录 + 访客入口
│       ├── UserMenu.jsx             # 用户头像 + 登出下拉菜单
│       ├── LanguageSwitcher.jsx     # 语言选择器 (EN/ES/PT/ZH)
│       └── GuestBanner.jsx          # 访客模式信息横幅
├── electron/
│   ├── main.cjs           # Electron 主进程（OAuth 弹窗、服务器 fork）
│   └── preload.cjs        # contextBridge
└── tests/                 # 72 项测试，使用 node:test（SQLite 内存模式）
```

## API

所有数据端点需要在 `Authorization: Bearer <token>` 请求头中携带 JWT。

| 方法   | 端点                | 认证 | 描述                                           |
|--------|---------------------|------|------------------------------------------------|
| POST   | `/api/auth/google`  | 否   | 用 Google ID 令牌换取 JWT                      |
| GET    | `/api/auth/me`      | 是   | 获取已认证用户的个人信息                       |
| POST   | `/api/auth/logout`  | 是   | 登出（无状态，客户端移除令牌）                 |
| GET    | `/api/data`         | 是   | 获取用户的睡眠设置和覆盖                       |
| POST   | `/api/data`         | 是   | 保存睡眠数据（基于修订版本的冲突检查）         |

### 数据模型

SQLite 数据库（`db/sync.db`）包含 4 张表：

- **users** —— Google 账号信息（id、邮箱、显示名称、头像）
- **sleep_settings** —— 每用户 1:1（入睡/起床时间、偏移量、巩固天数、修订计数器）
- **day_overrides** —— 按日期覆盖，强制为巩固日或提前日
- **advance_checks** —— 按日期的提前确认标志

## 构建桌面应用

Electron 构建会生成 Windows 安装程序（NSIS）：

```bash
npm run electron:build:win
```

安装程序输出到 `release/` 目录。在生产模式下，Electron 会将 Express 服务器作为子进程 fork 并管理其生命周期。

## 功能

- 通过相位提前算法逐步矫正睡眠时间
- 9 个精力阶段对应你的起床时间
- 按日覆盖（强制任何日期为巩固日或提前日）
- 提前完成确认检查
- **多语言界面** —— 英语（默认）、西班牙语、葡萄牙语、简体中文，支持浏览器语言自动检测
- **访客/演示模式** —— 无需账号即可试用；数据存储在 localStorage
- **多用户支持** —— Google 登录，SQLite 中按用户隔离数据
- 基于修订版本的并发保存冲突防护
- 暗色/夜间主题界面
- 桌面应用，附带 Windows 安装程序

## 许可证

[MIT](LICENSE)
