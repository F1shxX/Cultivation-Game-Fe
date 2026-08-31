# 万化归途 Frontend

Vite/React frontend for the 万化归途 demo. It talks to the backend API instead of connecting to Supabase with privileged keys.

Current demo flow:

- Ink-painting title menu and six-step character creation
- Entry CG and fixed horizontal Lushi Sect home scenes
- Character, inventory, equipment, method, and spell panels
- 29-event opportunity journal, including two complete dialogue/combat events
- Full-screen planting, alchemy, equipment forging, and treasure tempering systems
- Top-down bullet-hell combat with battle-locked method and spell loadouts
- Supabase-backed profile, progression, inventory, garden, and equipment saves

## Setup

```bash
npm install
copy .env.example .env
npm run dev
```

The local frontend runs at `http://localhost:5173/`. Production builds use the `/wanhua/` base path.

## Environment

```env
VITE_API_BASE_URL=http://localhost:3001
```

不设置时的回退逻辑：开发环境走相对路径（Vite dev server 会把 `/health`、`/demo` 代理到 `http://localhost:3001`）；生产环境走 `${origin}/wanhua-api`（由服务器反向代理转发给后端）。

## 项目结构

```
src/
  main.tsx          React 入口（StrictMode + createRoot）
  App.tsx           游戏主壳（约 5300 行）：标题菜单之后的全部主流程 ——
                    陆氏宗门九大场景（大厅/广场/宿舍/师姐居室/闭关室/炼器房/炼丹房/灵植园/传送阵）、
                    剧情事件（intro_lushi / mouse_cave_treasure / wish_eater_bridge）、
                    弹幕战斗、角色/背包/装备/功法/法术面板、与后端存档 API 的对接
  majorUpdate.tsx   扩展内容模块：六步捏人（PlayerProfile 五维属性）、开场 CG、
                    任务/灵植/炼丹/炼器系统界面（MajorSystemScreen）、
                    storyEvents 事件脚本、扩展存档状态（ExpansionState / getExpansion）
  styles.css        主流程样式（水墨风）
  majorUpdate.css   扩展内容样式
public/assets/      约 200 个静态资源，按用途分目录：
                    arts / audio / combat / events / monsters / onboarding /
                    portraits / scenes / tapflow / ui
scripts/
  importTapflowAssets.py   依据工作区 tapflow-assets.json 清单生成 public/assets/tapflow 素材（需 Pillow）
.github/workflows/
  deploy.yml               push 到 main 自动构建并部署前端（见下方「部署」）
  deploy-backend.yml       手动触发的后端测试+构建+部署流水线
```

`App.tsx` 与后端共享同一套存档领域模型（场景、事件、修炼境界等联合类型在两端保持一致）；新增玩法状态时通常需要同步修改后端 `src/domain/demoSave.ts`。

## 部署

- **前端**：`deploy.yml` 在每次 push 到 `main` 后自动构建并发布到服务器（nginx，`/wanhua/` 基路径）。注意 main 分支即生产，提交前先本地 `npm run typecheck`。
- **后端**：`deploy-backend.yml` 仅手动触发（workflow_dispatch），会先跑测试和 typecheck 再部署，失败自动回滚。
