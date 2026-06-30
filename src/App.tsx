import { useEffect, useMemo, useState } from "react";

type DemoLocation = "home" | "event" | "battle";

type DemoSaveState = {
  year: number;
  month: number;
  location: DemoLocation;
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

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";

const actionLabels = {
  cultivate: "闭关",
  alchemy: "炼丹",
  plant: "种植",
  forge: "炼器",
  start_mouse_cave: "山鼠洞",
  battle_victory: "退敌",
} as const;

type DemoAction = keyof typeof actionLabels;

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

function CharacterPortrait({ activeCharacter }: { activeCharacter: "xiaozhang" | "xiaoxian" | "lu" }) {
  return (
    <div className={`portrait portrait-${activeCharacter}`}>
      <div className="portrait-glow" />
      <div className="hair" />
      <div className="face" />
      <div className="robe" />
      <div className="sleeve sleeve-left" />
      <div className="sleeve sleeve-right" />
      <div className="nameplate">
        {activeCharacter === "xiaozhang" && "小张"}
        {activeCharacter === "xiaoxian" && "小娴"}
        {activeCharacter === "lu" && "鹿真人"}
      </div>
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
          <span>{formatTime(state)} · {state.cultivation.level}</span>
        </div>
      </div>
      <div className="resource-bar">
        <span>灵石 {state.resources.spiritStones}</span>
        <span>灵髓 {state.resources.spiritMarrow}</span>
        <span>丹药 {state.resources.pills}</span>
        <span className={online ? "online" : "offline"}>{online ? "数据库已连接" : "本地未同步"}</span>
      </div>
    </header>
  );
}

function HomeScene({
  save,
  busyAction,
  onAction,
  onReset,
}: {
  save: DemoSave;
  busyAction: DemoAction | "reset" | null;
  onAction: (action: DemoAction) => void;
  onReset: () => void;
}) {
  const state = save.state;
  const inBattle = state.location === "battle";
  const xiaoxianBond = state.relationships.find((item) => item.characterId === "xiaoxian")?.bond ?? 0;
  const zhangBond = state.relationships.find((item) => item.characterId === "xiao-zhang")?.bond ?? 0;

  return (
    <main className="game-shell">
      <TopHud state={state} online />
      <section className={`stage ${inBattle ? "battle-stage" : ""}`}>
        <div className="stage-bg">
          <div className="hall-sign">鹿石宗</div>
          <div className="pillar pillar-left" />
          <div className="pillar pillar-right" />
          <div className="weapon-rack rack-left" />
          <div className="weapon-rack rack-right" />
          <div className="floor-ring" />
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
        </div>

        <CharacterPortrait activeCharacter={inBattle ? "xiaozhang" : "xiaoxian"} />

        <aside className="right-menu">
          <button>日志</button>
          <button>关系</button>
          <button>图鉴</button>
          <button>设置</button>
        </aside>

        <section className="dialogue">
          <div className="speaker">
            {inBattle ? "张真人" : "小娴"}
            <small>{inBattle ? `羁绊 ${zhangBond}` : `羁绊 ${xiaoxianBond}`}</small>
          </div>
          <p>
            {inBattle
              ? "师弟别慌，本真人先替你压阵。要是我撑不住......师姐救我！"
              : "灵田、丹炉和修炼室都收拾好了。你想先修炼，还是先试试后山的山鼠洞？"}
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
          <button disabled={Boolean(busyAction) || inBattle} onClick={() => onAction("cultivate")}>
            {busyAction === "cultivate" ? "修炼中" : "闭关修炼"}
          </button>
          <button disabled={Boolean(busyAction) || inBattle} onClick={() => onAction("alchemy")}>
            {busyAction === "alchemy" ? "开炉中" : "炼丹"}
          </button>
          <button disabled={Boolean(busyAction) || inBattle} onClick={() => onAction("plant")}>
            {busyAction === "plant" ? "照料中" : "种植"}
          </button>
          <button disabled={Boolean(busyAction) || inBattle} onClick={() => onAction("forge")}>
            {busyAction === "forge" ? "锻造中" : "炼器"}
          </button>
          {!inBattle && (
            <button disabled={Boolean(busyAction)} onClick={() => onAction("start_mouse_cave")}>
              {busyAction === "start_mouse_cave" ? "出发中" : "山鼠洞觅宝"}
            </button>
          )}
          {inBattle && (
            <button disabled={Boolean(busyAction)} onClick={() => onAction("battle_victory")}>
              {busyAction === "battle_victory" ? "结算中" : "释放碎石剑气"}
            </button>
          )}
          <button disabled={Boolean(busyAction)} onClick={onReset}>
            {busyAction === "reset" ? "重置中" : "重开 Demo"}
          </button>
        </div>
      </section>

      <section className="codex-panel">
        <div>
          <h2>当前功法</h2>
          <p>{state.cultivation.learnedArts.join("、")}</p>
        </div>
        <div>
          <h2>最近事件</h2>
          <ul>
            {state.eventLog.slice(0, 4).map((event, index) => (
              <li key={`${event.title}-${index}`}>
                <strong>{event.year}年{event.month}月 · {event.title}</strong>
                <span>{event.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}

function App() {
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [health, setHealth] = useState<ApiHealth | null>(null);
  const [busyAction, setBusyAction] = useState<DemoAction | "reset" | null>(null);
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
        <p>如果提示 demo_saves 不存在，请先在 Supabase SQL Editor 执行后端仓库里的 migration。</p>
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
      onAction={(action) => void perform(action)}
      onReset={() => void reset()}
    />
  );
}

export default App;
