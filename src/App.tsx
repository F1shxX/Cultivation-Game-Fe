import { useEffect, useMemo, useState } from "react";

type DemoLocation = "home" | "event" | "battle";

type DemoScene =
  | "hall"
  | "plaza"
  | "dormitory"
  | "sister_room"
  | "meditation_room"
  | "forge"
  | "alchemy_room"
  | "spirit_garden"
  | "teleport_array";

type DemoSaveState = {
  year: number;
  month: number;
  location: DemoLocation;
  scene?: DemoScene;
  cultivation: {
    level: "炼气";
    realmProgress: number;
    root: "万化道躯";
    learnedArts: string[];
  };
  resources: {
    spiritStones: number;
    spiritMarrow: number;
    herbs: number;
    ore: number;
    pills: number;
  };
  relationships: Array<{
    characterId: "lu-zhenren" | "xiaoxian" | "xiao-zhang";
    name: string;
    bond: number;
  }>;
  flags: Record<string, boolean>;
  eventLog: Array<{
    year: number;
    month: number;
    title: string;
    text: string;
  }>;
};

type DemoSave = {
  player_id: string;
  state: DemoSaveState;
  updated_at?: string;
};

type SaveResponse = {
  ok: boolean;
  save: DemoSave;
};

type ApiHealth = {
  ok: boolean;
  supabase?: {
    configured: boolean;
    projectRef: string | null;
    missing: string[];
  };
};

type LoadState =
  | { status: "loading" }
  | { status: "ready"; save: DemoSave }
  | { status: "error"; message: string };

type DemoAction =
  | `change_scene:${DemoScene}`
  | "cultivate"
  | "alchemy"
  | "plant"
  | "forge"
  | "rest"
  | "talk_xiaoxian"
  | "sweep_plaza"
  | "inspect_teleport"
  | "start_mouse_cave"
  | "battle_victory";

type Panel = "日志" | "帮助" | "关系" | "图鉴" | "设置";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";

const sceneConfig: Record<
  DemoScene,
  {
    label: string;
    subtitle: string;
    description: string;
    actor: "xiaozhang" | "xiaoxian" | "lu";
    primaryAction: DemoAction;
    primaryLabel: string;
    accent: string;
  }
> = {
  hall: {
    label: "大厅",
    subtitle: "鹿石宗平日议事之处",
    description: "牌匾挂得有些歪，蒲团也不成对。鹿真人常年失踪，这里更多时候是小张练习摆谱的地方。",
    actor: "xiaozhang",
    primaryAction: "change_scene:plaza",
    primaryLabel: "去广场看看",
    accent: "gold",
  },
  plaza: {
    label: "广场",
    subtitle: "随性铺就的青石空地",
    description: "这里没有大宗门的威严仪仗，只有被扫帚磨亮的青石和小张摆过的木桩。",
    actor: "xiaozhang",
    primaryAction: "sweep_plaza",
    primaryLabel: "洒扫广场",
    accent: "stone",
  },
  dormitory: {
    label: "宿舍",
    subtitle: "干净但简陋的小屋",
    description: "屋里只有木床、旧柜和一盏灯。桌角压着小娴留下的字条：别忘了吃饭。",
    actor: "xiaozhang",
    primaryAction: "rest",
    primaryLabel: "小憩恢复",
    accent: "blue",
  },
  sister_room: {
    label: "师姐居室",
    subtitle: "药香和茶香混在一起",
    description: "窗边摆满药罐和种子袋。小娴说只是随便收拾了一下，但这里比宗门大厅还像样。",
    actor: "xiaoxian",
    primaryAction: "talk_xiaoxian",
    primaryLabel: "找师姐聊天",
    accent: "green",
  },
  meditation_room: {
    label: "闭关室",
    subtitle: "石壁上刻着粗糙阵纹",
    description: "阵纹明显是小张照着古籍描的，歪得很有个人风格。奇怪的是，居然真的有一点聚灵效果。",
    actor: "lu",
    primaryAction: "cultivate",
    primaryLabel: "闭关修炼",
    accent: "violet",
  },
  forge: {
    label: "炼器坊",
    subtitle: "火星、矿石和小张的豪言",
    description: "炉火烧得很旺，墙上挂着几把失败品。小张坚持说那叫成长的痕迹。",
    actor: "xiaozhang",
    primaryAction: "forge",
    primaryLabel: "开炉炼器",
    accent: "red",
  },
  alchemy_room: {
    label: "炼丹房",
    subtitle: "小娴管得最严的房间",
    description: "药柜按颜色摆得整整齐齐。唯独丹炉旁贴着一张纸：小张禁止独自开火。",
    actor: "xiaoxian",
    primaryAction: "alchemy",
    primaryLabel: "炼制丹药",
    accent: "amber",
  },
  spirit_garden: {
    label: "灵植园",
    subtitle: "后山一小片灵田",
    description: "灵草长得并不名贵，但精神头很好。小娴说随便种种，小张说这是宗门底蕴。",
    actor: "xiaoxian",
    primaryAction: "plant",
    primaryLabel: "照料灵植",
    accent: "green",
  },
  teleport_array: {
    label: "传送阵",
    subtitle: "鹿石宗外出全靠它",
    description: "阵盘边缘缺了两块石砖，但鹿真人说能用。它偶尔闪光，像在催你出去惹点事。",
    actor: "lu",
    primaryAction: "inspect_teleport",
    primaryLabel: "检查阵纹",
    accent: "cyan",
  },
};

const scenes = Object.keys(sceneConfig) as DemoScene[];

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  const payload = (await response.json()) as T & { message?: string };
  if (!response.ok) {
    throw new Error(payload.message ?? `Request failed with status ${response.status}`);
  }
  return payload;
}

function formatTime(state: DemoSaveState) {
  return `第${state.year}年${state.month}月`;
}

function getScene(state: DemoSaveState): DemoScene {
  return state.scene ?? "hall";
}

function CharacterPortrait({ activeCharacter }: { activeCharacter: "xiaozhang" | "xiaoxian" | "lu" }) {
  const name = activeCharacter === "xiaozhang" ? "小张" : activeCharacter === "xiaoxian" ? "小娴" : "鹿真人";
  return (
    <div className={`portrait portrait-${activeCharacter}`}>
      <div className="portrait-glow" />
      <div className="hair" />
      <div className="face" />
      <div className="robe" />
      <div className="sleeve sleeve-left" />
      <div className="sleeve sleeve-right" />
      <div className="nameplate">{name}</div>
    </div>
  );
}

function OpeningScene({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const lines = [
    { speaker: "旁白", text: "天地有道，五行定仙凡。金木水火土，灵根乃道源。" },
    { speaker: "小张", text: "这是什么？哇靠，单眼泥精！师姐救我！" },
    { speaker: "小娴", text: "我来看看。啊，快救人。" },
    { speaker: "鹿真人", text: "可惜这孩子没有灵根......甚至没用丹田？欸？哈哈哈，有趣。" },
  ];
  const current = lines[step];

  return (
    <div className="opening">
      <div className="opening-bg">
        <div className="sunrift" />
        <div className="cloud cloud-a" />
        <div className="cloud cloud-b" />
        <div className="mountain mountain-a" />
        <div className="mountain mountain-b" />
        <div className="temple temple-a" />
        <div className="temple temple-b" />
      </div>
      <div className="opening-copy">
        <p>{current.speaker}</p>
        <h1>{current.text}</h1>
      </div>
      <button
        className="ink-button primary"
        onClick={() => {
          if (step >= lines.length - 1) onDone();
          else setStep((value) => value + 1);
        }}
      >
        {step >= lines.length - 1 ? "入宗" : "继续"}
      </button>
    </div>
  );
}

function TopHud({ state, online }: { state: DemoSaveState; online: boolean }) {
  return (
    <header className="top-hud">
      <div className="player-card">
        <div className="avatar">无</div>
        <div>
          <strong>异世来客 · 鹿石宗</strong>
          <span>
            {formatTime(state)} · {state.cultivation.level} · {sceneConfig[getScene(state)].label}
          </span>
        </div>
      </div>
      <div className="resource-bar">
        <span>灵石 {state.resources.spiritStones}</span>
        <span>灵髓 {state.resources.spiritMarrow}</span>
        <span>草药 {state.resources.herbs}</span>
        <span>矿石 {state.resources.ore}</span>
        <span>丹药 {state.resources.pills}</span>
        <span className={online ? "online" : "offline"}>{online ? "数据库已连接" : "本地未同步"}</span>
      </div>
    </header>
  );
}

function SceneNavigator({
  currentScene,
  busy,
  onAction,
}: {
  currentScene: DemoScene;
  busy: boolean;
  onAction: (action: DemoAction) => void;
}) {
  return (
    <nav className="scene-nav" aria-label="鹿石宗场景">
      {scenes.map((scene) => (
        <button
          key={scene}
          className={scene === currentScene ? "active" : ""}
          disabled={busy}
          onClick={() => onAction(`change_scene:${scene}`)}
        >
          {sceneConfig[scene].label}
        </button>
      ))}
    </nav>
  );
}

function UtilityPanel({
  panel,
  state,
  onClose,
  onReset,
  onReplayOpening,
}: {
  panel: Panel;
  state: DemoSaveState;
  onClose: () => void;
  onReset: () => void;
  onReplayOpening: () => void;
}) {
  const relationshipText = state.relationships
    .map((item) => `${item.name}：羁绊 ${item.bond}`)
    .join(" / ");

  const content: Record<Panel, string[]> = {
    日志: state.eventLog.slice(0, 6).map((event) => `${event.year}年${event.month}月 · ${event.title}：${event.text}`),
    帮助: [
      "左侧按钮用于切换鹿石宗布景，每个场景都有独立功能。",
      "下方行动按钮会推进时间、改变资源，并同步到 Supabase 存档。",
      "传送阵可检查阵纹并进入山鼠洞战斗演示。",
    ],
    关系: [relationshipText],
    图鉴: [
      `当前功法：${state.cultivation.learnedArts.join("、")}`,
      `灵根体质：${state.cultivation.root}`,
      `已发现地点：${scenes.map((scene) => sceneConfig[scene].label).join("、")}`,
    ],
    设置: ["可重开 Demo，也可重播开场。"],
  };

  return (
    <div className="panel-backdrop">
      <section className="utility-panel">
        <header>
          <h2>{panel}</h2>
          <button onClick={onClose}>关闭</button>
        </header>
        <div className="panel-body">
          {content[panel].map((line, index) => (
            <p key={`${panel}-${index}`}>{line}</p>
          ))}
        </div>
        {panel === "设置" && (
          <footer>
            <button onClick={onReplayOpening}>重播开场</button>
            <button onClick={onReset}>重置存档</button>
          </footer>
        )}
      </section>
    </div>
  );
}

function SceneObjects({ scene, inBattle }: { scene: DemoScene; inBattle: boolean }) {
  return (
    <>
      <div className="hall-sign">{sceneConfig[scene].label}</div>
      <div className="pillar pillar-left" />
      <div className="pillar pillar-right" />
      <div className="floor-ring" />
      {(scene === "hall" || scene === "plaza") && (
        <>
          <div className="weapon-rack rack-left" />
          <div className="weapon-rack rack-right" />
        </>
      )}
      {scene === "dormitory" && (
        <>
          <div className="bed" />
          <div className="desk" />
        </>
      )}
      {scene === "sister_room" && (
        <>
          <div className="tea-table" />
          <div className="medicine-shelf" />
        </>
      )}
      {scene === "meditation_room" && <div className="meditation-ring" />}
      {scene === "forge" && (
        <>
          <div className="furnace forge-furnace" />
          <div className="ore-pile" />
        </>
      )}
      {scene === "alchemy_room" && (
        <>
          <div className="furnace alchemy-furnace" />
          <div className="medicine-shelf shelf-right" />
        </>
      )}
      {scene === "spirit_garden" && (
        <>
          <div className="garden-bed bed-a" />
          <div className="garden-bed bed-b" />
        </>
      )}
      {scene === "teleport_array" && (
        <>
          <div className="teleport-core" />
          <div className="teleport-orbit orbit-a" />
          <div className="teleport-orbit orbit-b" />
        </>
      )}
      <div className="battle-lane lane-back" />
      <div className="battle-lane lane-front" />
      {inBattle && (
        <>
          <div className="enemy enemy-a">鼠</div>
          <div className="enemy enemy-b">鼠</div>
          <div className="skill-arc arc-a" />
          <div className="skill-arc arc-b" />
        </>
      )}
    </>
  );
}

function HomeScene({
  save,
  busyAction,
  panel,
  onAction,
  onReset,
  onOpenPanel,
  onClosePanel,
  onReplayOpening,
}: {
  save: DemoSave;
  busyAction: DemoAction | "reset" | null;
  panel: Panel | null;
  onAction: (action: DemoAction) => void;
  onReset: () => void;
  onOpenPanel: (panel: Panel) => void;
  onClosePanel: () => void;
  onReplayOpening: () => void;
}) {
  const state = save.state;
  const scene = getScene(state);
  const config = sceneConfig[scene];
  const inBattle = state.location === "battle";
  const xiaoxianBond = state.relationships.find((item) => item.characterId === "xiaoxian")?.bond ?? 0;
  const zhangBond = state.relationships.find((item) => item.characterId === "xiao-zhang")?.bond ?? 0;
  const luBond = state.relationships.find((item) => item.characterId === "lu-zhenren")?.bond ?? 0;
  const actorBond = config.actor === "xiaoxian" ? xiaoxianBond : config.actor === "xiaozhang" ? zhangBond : luBond;
  const actorName = config.actor === "xiaoxian" ? "小娴" : config.actor === "xiaozhang" ? "小张" : "鹿真人";
  const busy = Boolean(busyAction);

  return (
    <main className="game-shell">
      <TopHud state={state} online />
      <section className={`stage scene-${scene} accent-${config.accent} ${inBattle ? "battle-stage" : ""}`}>
        <div className="stage-bg">
          <SceneObjects scene={scene} inBattle={inBattle} />
        </div>

        <SceneNavigator currentScene={scene} busy={busy} onAction={onAction} />
        <CharacterPortrait activeCharacter={inBattle ? "xiaozhang" : config.actor} />

        <aside className="right-menu">
          {(["日志", "帮助", "关系", "图鉴", "设置"] as Panel[]).map((item) => (
            <button key={item} disabled={busy} onClick={() => onOpenPanel(item)}>
              {item}
            </button>
          ))}
        </aside>

        <section className="dialogue">
          <div className="speaker">
            {inBattle ? "张真人" : actorName}
            <small>{inBattle ? `羁绊 ${zhangBond}` : `羁绊 ${actorBond}`}</small>
          </div>
          <p>
            {inBattle
              ? "师弟别慌，本真人先替你压阵。要是我撑不住......师姐救我！"
              : config.description}
          </p>
        </section>
      </section>

      <section className="control-panel">
        <div className="stat-card">
          <span>万化道躯</span>
          <strong>{state.cultivation.realmProgress}%</strong>
          <div className="progress">
            <i style={{ width: `${state.cultivation.realmProgress}%` }} />
          </div>
        </div>
        <div className="action-grid">
          <button disabled={busy || inBattle} onClick={() => onAction(config.primaryAction)}>
            {busyAction === config.primaryAction ? "进行中" : config.primaryLabel}
          </button>
          <button disabled={busy || inBattle} onClick={() => onAction("cultivate")}>
            闭关修炼
          </button>
          <button disabled={busy || inBattle} onClick={() => onAction("alchemy")}>
            炼丹
          </button>
          <button disabled={busy || inBattle} onClick={() => onAction("plant")}>
            种植
          </button>
          <button disabled={busy || inBattle} onClick={() => onAction("forge")}>
            炼器
          </button>
          <button disabled={busy || inBattle} onClick={() => onAction("start_mouse_cave")}>
            传送山鼠洞
          </button>
          {inBattle && (
            <button disabled={busy} onClick={() => onAction("battle_victory")}>
              释放碎石剑气
            </button>
          )}
        </div>
      </section>

      <section className="codex-panel">
        <div>
          <h2>{config.label}</h2>
          <p>{config.subtitle}</p>
        </div>
        <div>
          <h2>最近事件</h2>
          <ul>
            {state.eventLog.slice(0, 4).map((event, index) => (
              <li key={`${event.title}-${index}`}>
                <strong>
                  {event.year}年{event.month}月 · {event.title}
                </strong>
                <span>{event.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {panel && (
        <UtilityPanel
          panel={panel}
          state={state}
          onClose={onClosePanel}
          onReset={onReset}
          onReplayOpening={onReplayOpening}
        />
      )}
    </main>
  );
}

function App() {
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [health, setHealth] = useState<ApiHealth | null>(null);
  const [busyAction, setBusyAction] = useState<DemoAction | "reset" | null>(null);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [showOpening, setShowOpening] = useState(() => !localStorage.getItem("cultivation-opening-seen"));

  const loadSave = useMemo(
    () => async () => {
      setLoadState({ status: "loading" });
      try {
        const [healthPayload, savePayload] = await Promise.all([
          fetchJson<ApiHealth>("/health"),
          fetchJson<SaveResponse>("/demo/save"),
        ]);
        setHealth(healthPayload);
        setLoadState({ status: "ready", save: savePayload.save });
      } catch (error) {
        setLoadState({
          status: "error",
          message: error instanceof Error ? error.message : "读取 Demo 存档失败",
        });
      }
    },
    [],
  );

  useEffect(() => {
    void loadSave();
  }, [loadSave]);

  async function perform(action: DemoAction) {
    setBusyAction(action);
    try {
      const payload = await fetchJson<SaveResponse>("/demo/action", {
        method: "POST",
        body: JSON.stringify({ action }),
      });
      setLoadState({ status: "ready", save: payload.save });
    } catch (error) {
      setLoadState({
        status: "error",
        message: error instanceof Error ? error.message : "操作失败",
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function reset() {
    setBusyAction("reset");
    try {
      const payload = await fetchJson<SaveResponse>("/demo/reset", {
        method: "POST",
      });
      setLoadState({ status: "ready", save: payload.save });
      setPanel(null);
    } catch (error) {
      setLoadState({
        status: "error",
        message: error instanceof Error ? error.message : "重置失败",
      });
    } finally {
      setBusyAction(null);
    }
  }

  if (showOpening) {
    return (
      <OpeningScene
        onDone={() => {
          localStorage.setItem("cultivation-opening-seen", "1");
          setShowOpening(false);
        }}
      />
    );
  }

  if (loadState.status === "loading") {
    return <div className="loading-screen">正在连接鹿石宗传送阵...</div>;
  }

  if (loadState.status === "error") {
    return (
      <main className="error-screen">
        <h1>Demo 还没接上</h1>
        <p>{loadState.message}</p>
        <p>确认后端服务已启动，且 Supabase migration 已执行。</p>
        <button className="ink-button primary" onClick={() => void loadSave()}>
          重新连接
        </button>
      </main>
    );
  }

  return (
    <HomeScene
      save={loadState.save}
      busyAction={busyAction}
      panel={panel}
      onAction={(action) => void perform(action)}
      onReset={() => void reset()}
      onOpenPanel={setPanel}
      onClosePanel={() => setPanel(null)}
      onReplayOpening={() => {
        localStorage.removeItem("cultivation-opening-seen");
        setPanel(null);
        setShowOpening(true);
      }}
    />
  );
}

export default App;
