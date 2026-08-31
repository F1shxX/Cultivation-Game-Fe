# 万化归途 · 前端（wanhua-guitu-fe）

修仙游戏《万化归途》demo 的 Vite/React 前端。水墨画风，包含完整的标题菜单 → 六步捏人 → 开场 CG → 宗门主循环 → 剧情事件 → 弹幕战斗流程。前端只与后端 HTTP API 通信，**从不持有任何 Supabase 密钥**。

> 配套后端仓库：[Cultivation-Game-Be](https://github.com/F1shxX/Cultivation-Game-Be)（本地开发需要把它跑起来，或至少接受存档接口失败）

## 技术栈

| 技术 | 用途 |
| --- | --- |
| React 19 + TypeScript 5 | UI 框架（函数组件 + hooks，无路由库） |
| Vite 6 | 开发服务器（5173 端口，自带 API 代理）与生产构建 |
| 原生 CSS | 全部样式手写（水墨风），无 CSS 框架 |
| Python + Pillow | （可选）素材导入脚本 |

没有路由库、没有状态管理库、没有 UI 组件库——整个游戏是一个 React 组件树加一组自定义 hooks，屏幕切换全部由游戏状态驱动。

## 快速开始

```bash
npm install
copy .env.example .env
npm run dev          # http://localhost:5173/
```

本地联调需要后端在 `http://localhost:3001` 运行（见后端仓库 README）。后端没起也不影响界面浏览，只是存档加载/保存会失败。

## 环境变量

| 变量 | 说明 |
| --- | --- |
| `VITE_API_BASE_URL` | 后端 API 基地址，本地默认 `http://localhost:3001` |

**回退逻辑**（不设置该变量时）：

- 开发环境 → 使用当前 origin（相对路径）。Vite dev server 已配置代理：`/health`、`/demo` 两条前缀自动转发到 `http://localhost:3001`，所以**本地开发即使不建 `.env` 也能通**
- 生产环境 → `${origin}/wanhua-api`（由服务器 nginx 反向代理转发到后端，见部署一节）

## 项目结构

```
src/
  main.tsx            React 入口：StrictMode + createRoot 挂载 <App />，引入全局样式
  App.tsx             ★ 游戏主壳（约 5300 行）—— 标题之后的全部主流程
  majorUpdate.tsx     ★ 扩展内容模块（约 1100 行）—— 捏人 / CG / 四大生产系统界面
  styles.css          主流程样式（约 6200 行，水墨风）
  majorUpdate.css     扩展内容样式（约 1700 行）
public/
  assets/             约 200 个静态资源，按用途分目录：
    arts/               CG 立绘（含 gold 金色变体）
    audio/              音频
    combat/             战斗特效 / 弹幕素材
    events/             事件插图
    monsters/           敌人立绘
    onboarding/         引导素材
    portraits/          人物头像
    scenes/             九大场景背景图
    tapflow/            由脚本生成的素材（见 scripts/），含 combat / loadout /
                        portraits / records / scenes / ui 子目录
    ui/                 通用 UI 素材
scripts/
  importTapflowAssets.py   读取工作区上级的 tapflow-assets.json 清单，
                           用 Pillow 批量生成/缩放图片到 public/assets/tapflow/（需 python + Pillow）
.github/workflows/
  deploy.yml               前端自动部署（push main 即触发，见部署一节）
  deploy-backend.yml       后端手动部署流水线（拉取 BE 仓库构建发布）
index.html / vite.config.ts / tsconfig*.json / package.json
```

## 核心代码导览

### `App.tsx` —— 游戏主壳

承担"状态机 + 存档同步 + 主流程界面"三件事：

1. **游戏状态机**：以 `DemoLocation`（home 宗门 / event 事件 / battle 战斗）为顶层模式，home 下细分九大场景 `DemoScene`（大厅 hall、广场 plaza、宿舍 dormitory、师姐居室 sister_room、闭关室 meditation_room、炼器房 forge、炼丹房 alchemy_room、灵植园 spirit_garden、传送阵 teleport_array），事件中用 17 阶段的 `DemoEventVisualStage`（intro_dormitory → … → mouse_boss_final → … → wish_eater_boss → bridge_reward）驱动演出
2. **存档同步**：所有存档读写经 `fetch(\`${apiBaseUrl}${path}\`)` 打到后端（`GET /demo/save`、`POST /demo/action`、`POST /demo/reset`、`PUT /demo/expansion`），动作先由本地状态乐观更新，再与服务端返回的权威存档对齐
3. **主流程界面**：宗门场景交互、角色/背包/装备/功法/法术面板、29 事件机缘手札、剧情对话、俯视角弹幕战斗（战斗期间锁定功法/法术配装）

**重要契约**：`App.tsx` 顶部手工镜像了后端 `domain/demoSave.ts` 的全部联合类型（场景 / 事件 / 选项 / 动作枚举）。TypeScript 不会跨仓库帮你检查一致性——**新增玩法状态时必须两边同步改**，否则运行时数据对不上。

### `majorUpdate.tsx` —— 扩展内容模块

被 `App.tsx` 导入的四大组件 + 一组类型与纯函数：

| 导出 | 作用 |
| --- | --- |
| `StartMenu` | 水墨风标题菜单 |
| `CharacterCreation` | 六步捏人，涵盖：姓名、性别、服装（青衫/道袍/锦装/仙袍）、难度、资质、五维属性（资质/悟性/灵性/身法/福缘）与特性 |
| `EntryCg` | 开场 CG |
| `MajorSystemScreen` | 四大生产系统全屏界面：机缘任务 quests / 灵植园 garden / 炼丹 alchemy / 炼器 forge |
| `PlayerProfile` / `ExpansionState` 等类型 | 扩展档数据结构 |
| `defaultExpansion` / `getExpansion` | 扩展档初始值与脏数据修复 |
| `storyEvents` | 事件脚本数据（对话文本、选项、分支） |

### 样式

两个巨型 CSS 文件，类名前缀区分模块；无 CSS-in-JS、无 Tailwind。水墨质感（纸质纹理、笔触描边、留白构图）主要靠 `styles.css` 里的背景合成与滤镜实现。

## 本地开发

```bash
npm run dev         # 开发服务器 http://localhost:5173（API 自动代理到 3001）
npm run typecheck   # tsc -b --noEmit，提交前必跑
npm run build       # tsc -b && vite build，产物在 dist/
npm run preview     # 本地预览生产构建
```

注意：

- 生产构建的 base path 是 `/wanhua/`，本地 dev 是 `/`——代码里取资源请用 `import.meta.env.BASE_URL` 拼路径（`assetPath()` 已封装），不要写死绝对路径
- 联调前确认后端 `CLIENT_ORIGIN=http://localhost:5173`（默认即是）

## 部署

### 前端（自动）

`.github/workflows/deploy.yml`：**每次 push 到 main 自动执行**——

```
npm ci → npm run build → 打包 dist → scp 到服务器 → 原子替换 /var/www/wanhua-xiantu → nginx -t
```

⚠️ **main 分支即生产**。提交前务必本地跑过 `npm run typecheck`；推送后可在 GitHub Actions 页面观察流水线，服务器上 nginx 把 `/wanhua-api/` 反代到后端（端口 3201）。

### 后端（手动）

`.github/workflows/deploy-backend.yml`：仅 `workflow_dispatch` 手动触发，流程为拉取 BE 仓库 main → 测试 + typecheck + 构建 → 上传服务器 → pm2 重启 + 健康检查，失败自动回滚。日常提交后端代码不会自动上线。

## 参与开发须知

- 提交信息用英文祈使句短语（如 `Align dialogue artwork and remove shadow`）
- 改动涉及存档结构 / 场景 / 事件 / 动作枚举时，同步修改后端 `src/domain/demoSave.ts` 的镜像类型
- 新素材放 `public/assets/` 对应子目录；tapflow 系列素材不要手工改，改 `tapflow-assets.json` 后跑脚本重新生成
- 两个大文件（`App.tsx` / `styles.css`）已有明确分工：主流程进它们，扩展内容进 `majorUpdate.*`
