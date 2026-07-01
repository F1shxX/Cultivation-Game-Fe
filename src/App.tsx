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

type DemoEventId = "mouse_cave_treasure" | "wish_eater_bridge";

type DemoEventChoiceAction =
  | "event_choice:mouse_joke"
  | "event_choice:mouse_careful"
  | "event_choice:qingmu_trust"
  | "event_choice:qingmu_guard"
  | "event_choice:protect_beggar"
  | "event_choice:trust_jinling";

type DemoEventVisualStage =
  | "teleport_departure"
  | "mouse_cave"
  | "mouse_skirmish"
  | "mouse_boss_crisis"
  | "qingmu_rescue"
  | "mouse_boss_final"
  | "mouse_reward"
  | "bridge_village"
  | "bridge_skirmish"
  | "bridge_confrontation"
  | "wish_eater_reveal"
  | "wish_eater_boss"
  | "bridge_reward";

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
  | "battle_victory"
  | `start_event:${DemoEventId}`
  | "advance_event"
  | DemoEventChoiceAction;

type DemoEventChoice = {
  action: DemoEventChoiceAction;
  key: string;
  label: string;
  logTitle: string;
  logText: string;
};

type DemoEventNode = {
  id: string;
  title: string;
  speaker: string;
  text: string;
  mode: "dialogue" | "choice" | "battle" | "reward";
  visualStage: DemoEventVisualStage;
  choices?: DemoEventChoice[];
};

type DemoEventDefinition = {
  id: DemoEventId;
  title: string;
  triggerYear: number;
  category: string;
  location: string;
  participants: string[];
  summary: string;
  rewardText: string;
  nodes: DemoEventNode[];
};

type DemoActiveEvent = {
  id: DemoEventId;
  nodeIndex: number;
  selectedChoices: Record<string, string>;
  replay: boolean;
  startedAt: {
    year: number;
    month: number;
  };
};

type DemoCharacterId =
  | "lu-zhenren"
  | "xiaoxian"
  | "xiao-zhang"
  | "yangqi"
  | "douran"
  | "chuchu"
  | "xiaolu";

type DemoSaveState = {
  year: number;
  month: number;
  location: DemoLocation;
  scene?: DemoScene;
  activeEvent?: DemoActiveEvent | null;
  completedEvents?: DemoEventId[];
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
  inventory?: {
    mouseDemonCore: number;
    worryForgetRoot: number;
    qingmuHealingPills: number;
    jinlingToken: number;
  };
  relationships: Array<{
    characterId: DemoCharacterId;
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

type EventsResponse = {
  ok: boolean;
  events: Record<DemoEventId, DemoEventDefinition>;
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
  | { status: "ready"; save: DemoSave; events: Record<DemoEventId, DemoEventDefinition> }
  | { status: "error"; message: string };

type Panel = "日志" | "事件" | "关系" | "图鉴" | "设置";

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

function getEventList(events: Record<DemoEventId, DemoEventDefinition>) {
  return Object.values(events).sort((left, right) => left.triggerYear - right.triggerYear);
}

function getActiveEvent(
  state: DemoSaveState,
  events: Record<DemoEventId, DemoEventDefinition>,
) {
  const active = state.activeEvent;
  if (!active) return null;

  const definition = events[active.id];
  const node = definition.nodes[active.nodeIndex];
  return { active, definition, node };
}

function getVisualStageTitle(visualStage: DemoEventVisualStage) {
  const titles: Record<DemoEventVisualStage, string> = {
    teleport_departure: "鹿石宗传送阵",
    mouse_cave: "后山山鼠洞",
    mouse_skirmish: "山鼠洞战斗",
    mouse_boss_crisis: "山鼠王压境",
    qingmu_rescue: "青木门救场",
    mouse_boss_final: "山鼠王再战",
    mouse_reward: "山鼠洞战利品",
    bridge_village: "断桥村",
    bridge_skirmish: "断桥村战斗",
    bridge_confrontation: "断桥争执",
    wish_eater_reveal: "啖愿妖现形",
    wish_eater_boss: "啖愿妖战斗",
    bridge_reward: "金灵宗初识",
  };
  return titles[visualStage];
}

function getEventButtonLabel(node: DemoEventNode, busy: boolean) {
  if (busy) {
    if (node.mode === "battle") return "战斗中";
    if (node.mode === "reward") return "结算中";
    return "推进中";
  }

  if (node.mode === "reward") return "领取结算";
  if (node.mode !== "battle") return "继续剧情";

  const labels: Record<string, string> = {
    "small-rats": "清掉山鼠仔",
    "rat-king": "撑到救场",
    "final-rat-king": "合力击败山鼠王",
    minions: "击退邪祟爪牙",
    boss: "合力伏妖",
  };

  return labels[node.id] ?? "打赢当前战斗";
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
  const inventory = state.inventory ?? {
    mouseDemonCore: 0,
    worryForgetRoot: 0,
    qingmuHealingPills: 0,
    jinlingToken: 0,
  };

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
        <span>妖丹 {inventory.mouseDemonCore}</span>
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
  events,
  onClose,
  onReset,
  onReplayOpening,
}: {
  panel: Panel;
  state: DemoSaveState;
  events: Record<DemoEventId, DemoEventDefinition>;
  onClose: () => void;
  onReset: () => void;
  onReplayOpening: () => void;
}) {
  const inventory = state.inventory ?? {
    mouseDemonCore: 0,
    worryForgetRoot: 0,
    qingmuHealingPills: 0,
    jinlingToken: 0,
  };
  const relationshipText = state.relationships
    .map((item) => `${item.name}：羁绊 ${item.bond}`)
    .join(" / ");
  const completedText =
    state.completedEvents && state.completedEvents.length > 0
      ? state.completedEvents.map((id) => events[id].title).join("、")
      : "暂无";

  const content: Record<Panel, string[]> = {
    日志: state.eventLog.slice(0, 8).map((event) => `${event.year}年${event.month}月 · ${event.title}：${event.text}`),
    事件: [
      `已完成：${completedText}`,
      ...getEventList(events).map(
        (event) =>
          `第${event.triggerYear}年 · ${event.title} · ${event.location}：${event.summary} 奖励：${event.rewardText}`,
      ),
    ],
    关系: [relationshipText],
    图鉴: [
      `当前功法：${state.cultivation.learnedArts.join("、")}`,
      `灵根体质：${state.cultivation.root}`,
      `事件物品：山鼠妖丹 ${inventory.mouseDemonCore} / 忘忧根 ${inventory.worryForgetRoot} / 青木疗伤丹 ${inventory.qingmuHealingPills} / 金灵宗信物 ${inventory.jinlingToken}`,
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
          <div className="enemy enemy-a">妖</div>
          <div className="enemy enemy-b">祟</div>
          <div className="skill-arc arc-a" />
          <div className="skill-arc arc-b" />
        </>
      )}
    </>
  );
}

function EventStageObjects({ node }: { node: DemoEventNode }) {
  const stage = node.visualStage;
  const isMouseStage = stage.startsWith("mouse") || stage === "qingmu_rescue";
  const isBossStage =
    stage === "mouse_boss_crisis" ||
    stage === "mouse_boss_final" ||
    stage === "wish_eater_boss";
  const isBridgeStage = stage.startsWith("bridge") || stage.startsWith("wish");
  const isBattleStage =
    stage === "mouse_skirmish" ||
    stage === "mouse_boss_crisis" ||
    stage === "mouse_boss_final" ||
    stage === "bridge_skirmish" ||
    stage === "wish_eater_boss";

  return (
    <>
      <div className="event-location-sign">{getVisualStageTitle(stage)}</div>
      {stage === "teleport_departure" && (
        <>
          <div className="event-teleport-disk" />
          <div className="event-teleport-light light-a" />
          <div className="event-teleport-light light-b" />
        </>
      )}
      {isMouseStage && (
        <>
          <div className="cave-mouth-shape" />
          <div className="cave-rock rock-a" />
          <div className="cave-rock rock-b" />
          <div className="cave-crystal crystal-a" />
          <div className="cave-crystal crystal-b" />
        </>
      )}
      {isBridgeStage && (
        <>
          <div className="broken-bridge" />
          <div className="village-house house-a" />
          <div className="village-house house-b" />
          <div className="bridge-fog fog-a" />
        </>
      )}
      {(stage === "qingmu_rescue" || stage === "mouse_reward") && (
        <>
          <div className="qingmu-vine vine-a" />
          <div className="qingmu-vine vine-b" />
          <div className="qingmu-figure figure-yang">羊七</div>
          <div className="qingmu-figure figure-dou">豆髯</div>
        </>
      )}
      {stage === "bridge_confrontation" && (
        <>
          <div className="jinling-figure figure-chuchu">雏雏</div>
          <div className="jinling-figure figure-xiaolu">小鹿</div>
          <div className="beggar-form">乞</div>
        </>
      )}
      {stage === "wish_eater_reveal" && (
        <>
          <div className="wish-eater-shadow" />
          <div className="wish-fire fire-a" />
          <div className="wish-fire fire-b" />
        </>
      )}
      {isBattleStage && (
        <>
          <div className="battle-arena-line line-back" />
          <div className="battle-arena-line line-front" />
          <div className="player-combatant player-a">主角</div>
          <div className="player-combatant player-b">小张</div>
          {stage === "mouse_boss_final" && <div className="ally-combatant ally-a">羊七</div>}
          {stage === "mouse_boss_final" && <div className="ally-combatant ally-b">豆髯</div>}
          {stage === "wish_eater_boss" && <div className="ally-combatant ally-a">雏雏</div>}
          {stage === "wish_eater_boss" && <div className="ally-combatant ally-b">小鹿</div>}
          {isBossStage ? (
            <div className={`event-boss ${stage.startsWith("wish") ? "boss-wish" : "boss-rat"}`}>
              {stage.startsWith("wish") ? "啖愿妖" : "山鼠王"}
            </div>
          ) : (
            <>
              <div className="event-mob mob-a">{stage.startsWith("bridge") ? "祟" : "鼠"}</div>
              <div className="event-mob mob-b">{stage.startsWith("bridge") ? "影" : "鼠"}</div>
              <div className="event-mob mob-c">{stage.startsWith("bridge") ? "怨" : "鼠"}</div>
            </>
          )}
          <div className="combat-skill slash-a" />
          <div className="combat-skill slash-b" />
        </>
      )}
      {stage === "mouse_boss_crisis" && <div className="danger-overlay">濒危</div>}
    </>
  );
}

function EventConsole({
  state,
  events,
  busyAction,
  onAction,
}: {
  state: DemoSaveState;
  events: Record<DemoEventId, DemoEventDefinition>;
  busyAction: DemoAction | "reset" | null;
  onAction: (action: DemoAction) => void;
}) {
  const activeEvent = getActiveEvent(state, events);
  const busy = Boolean(busyAction);

  if (activeEvent) {
    const { active, definition, node } = activeEvent;
    const progress = Math.round(((active.nodeIndex + 1) / definition.nodes.length) * 100);
    const modeText: Record<DemoEventNode["mode"], string> = {
      dialogue: "剧情",
      choice: "抉择",
      battle: "战斗",
      reward: "结算",
    };

    return (
      <section className="event-console event-active">
        <header>
          <div>
            <span className="event-eyebrow">DEMO事件进行中</span>
            <h2>{definition.title}</h2>
            <p>
              {definition.location} · {definition.participants.join(" / ")}
            </p>
          </div>
          <strong>{progress}%</strong>
        </header>
        <div className="event-progress">
          <i style={{ width: `${progress}%` }} />
        </div>
        <div className="event-node">
          <span>{modeText[node.mode]}</span>
          <h3>{node.title}</h3>
          <p>
            {node.speaker}：{node.text}
          </p>
          {active.replay && <small>本次为复盘，完成后不会重复发放奖励。</small>}
        </div>
        {node.mode === "choice" && node.choices ? (
          <div className="event-choice-grid">
            {node.choices.map((choice) => (
              <button
                key={choice.action}
                disabled={busy}
                onClick={() => onAction(choice.action)}
              >
                {busyAction === choice.action ? "处理中" : choice.label}
              </button>
            ))}
          </div>
        ) : (
          <button
            className="event-primary"
            disabled={busy}
            onClick={() => onAction(node.mode === "battle" ? "battle_victory" : "advance_event")}
          >
            {getEventButtonLabel(node, busyAction === "battle_victory" || busyAction === "advance_event")}
          </button>
        )}
      </section>
    );
  }

  return (
    <section className="event-console">
      <header>
        <div>
          <span className="event-eyebrow">DEMO测试事件</span>
          <h2>事件流程测试</h2>
          <p>用于展示时间事件、战斗节点、选择分支、人物登场和奖励入库。</p>
        </div>
      </header>
      <div className="event-start-list">
        {getEventList(events).map((event) => {
          const completed = state.completedEvents?.includes(event.id) ?? false;
          const action = `start_event:${event.id}` as DemoAction;
          const isTeleportReady = getScene(state) === "teleport_array";
          return (
            <button
              key={event.id}
              disabled={busy}
              onClick={() => onAction(isTeleportReady ? action : "change_scene:teleport_array")}
            >
              <strong>
                {isTeleportReady ? (completed ? "复盘" : "传送") : "前往传送阵"} · 第{event.triggerYear}年 · {event.title}
              </strong>
              <span>{event.location}</span>
              <small>{event.rewardText}</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function HomeScene({
  save,
  events,
  online,
  busyAction,
  panel,
  onAction,
  onReset,
  onOpenPanel,
  onClosePanel,
  onReplayOpening,
}: {
  save: DemoSave;
  events: Record<DemoEventId, DemoEventDefinition>;
  online: boolean;
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
  const activeEvent = getActiveEvent(state, events);
  const inBattle = state.location === "battle";
  const visualStage = activeEvent?.node.visualStage;
  const xiaoxianBond = state.relationships.find((item) => item.characterId === "xiaoxian")?.bond ?? 0;
  const zhangBond = state.relationships.find((item) => item.characterId === "xiao-zhang")?.bond ?? 0;
  const luBond = state.relationships.find((item) => item.characterId === "lu-zhenren")?.bond ?? 0;
  const actorBond = config.actor === "xiaoxian" ? xiaoxianBond : config.actor === "xiaozhang" ? zhangBond : luBond;
  const actorName = config.actor === "xiaoxian" ? "小娴" : config.actor === "xiaozhang" ? "小张" : "鹿真人";
  const dialogueSpeaker = activeEvent?.node.speaker ?? (inBattle ? "张真人" : actorName);
  const dialogueText =
    activeEvent?.node.text ??
    (inBattle
      ? "师弟别慌，本真人先替你压阵。要是我撑不住......师姐救我！"
      : config.description);
  const busy = Boolean(busyAction);

  return (
    <main className="game-shell">
      <TopHud state={state} online={online} />
      <section
        className={`stage scene-${scene} accent-${config.accent} ${
          inBattle ? "battle-stage" : ""
        } ${visualStage ? `event-stage visual-${visualStage}` : ""}`}
      >
        <div className="stage-bg">
          {activeEvent ? (
            <EventStageObjects node={activeEvent.node} />
          ) : (
            <SceneObjects scene={scene} inBattle={inBattle} />
          )}
        </div>

        {!activeEvent && <SceneNavigator currentScene={scene} busy={busy} onAction={onAction} />}
        {!activeEvent && <CharacterPortrait activeCharacter={inBattle ? "xiaozhang" : config.actor} />}

        <aside className="right-menu">
          {(["日志", "事件", "关系", "图鉴", "设置"] as Panel[]).map((item) => (
            <button key={item} disabled={busy} onClick={() => onOpenPanel(item)}>
              {item}
            </button>
          ))}
        </aside>

        <section className="dialogue">
          <div className="speaker">
            {dialogueSpeaker}
            <small>{activeEvent ? activeEvent.definition.title : `羁绊 ${actorBond}`}</small>
          </div>
          <p>{dialogueText}</p>
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
          <button disabled={busy} onClick={() => onAction(config.primaryAction)}>
            {busyAction === config.primaryAction ? "进行中" : config.primaryLabel}
          </button>
          <button disabled={busy} onClick={() => onAction("cultivate")}>
            闭关修炼
          </button>
          <button disabled={busy} onClick={() => onAction("alchemy")}>
            炼丹
          </button>
          <button disabled={busy} onClick={() => onAction("plant")}>
            种植
          </button>
          <button disabled={busy} onClick={() => onAction("forge")}>
            炼器
          </button>
          {scene === "teleport_array" ? (
            <>
              <button disabled={busy} onClick={() => onAction("start_mouse_cave")}>
                传送山鼠洞
              </button>
              <button disabled={busy} onClick={() => onAction("start_event:wish_eater_bridge")}>
                传送断桥村
              </button>
            </>
          ) : (
            <button disabled={busy} onClick={() => onAction("change_scene:teleport_array")}>
              前往传送阵
            </button>
          )}
          {inBattle && (
            <button disabled={busy} onClick={() => onAction("battle_victory")}>
              释放碎石剑气
            </button>
          )}
        </div>
        <EventConsole state={state} events={events} busyAction={busyAction} onAction={onAction} />
      </section>

      <section className="codex-panel">
        <div>
          <h2>{activeEvent ? activeEvent.definition.title : config.label}</h2>
          <p>{activeEvent ? activeEvent.definition.summary : config.subtitle}</p>
        </div>
        <div>
          <h2>最近事件</h2>
          <ul>
            {state.eventLog.slice(0, 5).map((event, index) => (
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
          events={events}
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
        const [healthPayload, savePayload, eventsPayload] = await Promise.all([
          fetchJson<ApiHealth>("/health"),
          fetchJson<SaveResponse>("/demo/save"),
          fetchJson<EventsResponse>("/demo/events"),
        ]);
        setHealth(healthPayload);
        setLoadState({
          status: "ready",
          save: savePayload.save,
          events: eventsPayload.events,
        });
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

  function replaceSave(save: DemoSave) {
    setLoadState((current) => (current.status === "ready" ? { ...current, save } : current));
  }

  async function perform(action: DemoAction) {
    setBusyAction(action);
    try {
      const payload = await fetchJson<SaveResponse>("/demo/action", {
        method: "POST",
        body: JSON.stringify({ action }),
      });
      replaceSave(payload.save);
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
      replaceSave(payload.save);
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
      events={loadState.events}
      online={health?.supabase?.configured ?? false}
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
