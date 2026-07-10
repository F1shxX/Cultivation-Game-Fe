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

type Panel = "日志" | "世界" | "事件" | "关系" | "人物" | "功法" | "设置";

type PortraitKey = "player" | "xiaozhang" | "xiaoxian" | "lu";
type PortraitExpression = "normal" | "happy" | "serious" | "snark";

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.PROD ? `${window.location.origin}/wanhua-api` : "http://localhost:3001");

function assetPath(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;
}

const portraitAssets: Record<PortraitKey, Record<PortraitExpression, string>> = {
  player: {
    normal: assetPath("assets/portraits/player-normal.webp"),
    happy: assetPath("assets/portraits/player-happy.webp"),
    serious: assetPath("assets/portraits/player-serious.webp"),
    snark: assetPath("assets/portraits/player-snark.webp"),
  },
  xiaozhang: {
    normal: assetPath("assets/portraits/xiaozhang-normal.webp"),
    happy: assetPath("assets/portraits/xiaozhang-happy.webp"),
    serious: assetPath("assets/portraits/xiaozhang-serious.webp"),
    snark: assetPath("assets/portraits/xiaozhang-snark.webp"),
  },
  xiaoxian: {
    normal: assetPath("assets/portraits/xiaoxian-normal.webp"),
    happy: assetPath("assets/portraits/xiaoxian-happy.webp"),
    serious: assetPath("assets/portraits/xiaoxian-serious.webp"),
    snark: assetPath("assets/portraits/xiaoxian-snark.webp"),
  },
  lu: {
    normal: assetPath("assets/portraits/lu-normal.webp"),
    happy: assetPath("assets/portraits/lu-happy.webp"),
    serious: assetPath("assets/portraits/lu-serious.webp"),
    snark: assetPath("assets/portraits/lu-snark.webp"),
  },
};

const resourceIcons = {
  spiritStones: assetPath("assets/ui/spirit-stone.webp"),
  spiritMarrow: assetPath("assets/ui/spirit-marrow.webp"),
  herbs: assetPath("assets/ui/herb.webp"),
  ore: assetPath("assets/ui/ore.webp"),
  pills: assetPath("assets/ui/pill.webp"),
} as const;

const artSamples = [
  {
    name: "金芒诀",
    rank: "黄",
    element: "金",
    attack: "金色锋刃贯穿飞行",
    slots: "1个法术位：黄黄黄黄",
    note: "剑气锋锐，克制护甲，但缺乏持续续航。",
    icon: assetPath("assets/arts/gold/huang-jinmang-jue.webp"),
  },
  {
    name: "破金真诀",
    rank: "玄",
    element: "金",
    attack: "强化金系穿透剑气",
    slots: "2个法术位：玄黄玄黄",
    note: "适合演示万化道躯切换金灵根后的基础成长。",
    icon: assetPath("assets/arts/gold/xuan-pojin-zhenjue.webp"),
  },
  {
    name: "万剑玄功",
    rank: "地",
    element: "金",
    attack: "多段剑气与破甲压制",
    slots: "高阶法术位样例",
    note: "用于展示品阶提升后自动攻击与法术配置上限成长。",
    icon: assetPath("assets/arts/gold/di-wanjian-xuangong.webp"),
  },
  {
    name: "鸿蒙庚金斩仙典",
    rank: "仙",
    element: "金",
    attack: "庚金斩仙剑势",
    slots: "仙阶法术位样例",
    note: "多周目自创功法融合时可作为高阶对照目标。",
    icon: assetPath("assets/arts/gold/xian-hongmeng-gengjin-zhanxian.webp"),
  },
];

const artFamilies = [
  {
    element: "金",
    style: "锐锋破甲",
    note: "剑气锋锐，克制护甲，适合作为 Demo 的基础攻击手感。",
    names: "金芒诀、裂金术、寸金法、锋锐技、破金真诀、惊虹秘术、断岳心法、穿云玄术、万剑玄功、裂空秘法、斩魄真解、伏虎奥义、弑神天诀、九幽神通、惊天秘典、裂苍天术、鸿蒙庚金斩仙典、太一悍刃大道、无极锋芒天书、弑仙真典",
  },
  {
    element: "木",
    style: "毒愈双修",
    note: "自带回血叠加和持续侵蚀，适合展示青木门的治疗、种植、毒术气质。",
    names: "青藤诀、枯荣术、萌芽法、蔓生技、缠魂真诀、腐叶秘术、回春心法、荆棘玄术、万木玄功、朽骨秘法、生死真解、藤蔓奥义、森罗天诀、苍木神通、枯荣秘典、古木天术、世界树仙经、太古大道、不朽天书、归元真典",
  },
  {
    element: "水",
    style: "护盾控场",
    note: "护盾更强，可承接寒妙观的寒冰幻术、灵泉疗愈和团队辅助定位。",
    names: "寒潮诀、冰凌术、水刃法、浮萍技、玄冰真诀、惊涛秘术、寒霜心法、潮涌玄术、沧海玄功、极寒秘法、冰封真解、万流奥义、龙吟天诀、寒渊神通、玄冰秘典、惊澜天术、四海仙经、天河大道、寒极天书、不冻真典",
  },
  {
    element: "火",
    style: "爆发焚敌",
    note: "高伤害、高爆发、防御偏低，适合九阳炎天宗的强攻和发明气质。",
    names: "焰心诀、灼阳术、烈焰法、火种技、焚天真诀、炽炎秘术、赤炎心法、燎原玄术、九阳玄功、烈阳秘法、焚魂真解、炎狱奥义、天火天诀、烬灭神通、朱雀秘典、赤霄天术、涅槃仙经、不灭大道、太阳天书、炎极真典",
  },
  {
    element: "土",
    style: "厚土镇守",
    note: "护盾值最高，伤害成长较慢，适合肉盾、结界、重力领域和镇守玩法。",
    names: "厚土诀、磐石术、拱卫法、山岩技、玄岩真诀、岳镇秘术、坤厚心法、崩山玄术、万岳玄功、不动秘法、厚德真解、镇魂奥义、昆仑天诀、息壤神通、五岳秘典、镇天天术、后土仙经、山河大道、盘古天书、坤仪真典",
  },
  {
    element: "无",
    style: "均衡万化",
    note: "数值均衡、法术位更灵活，适合作为万化道躯自创功法融合的底层参照。",
    names: "归一诀、混元术、太素法、守中技、阴阳真诀、道玄秘术、清静心法、中和玄术、太极玄功、无相秘法、虚空真解、圆融奥义、混沌天诀、无极神通、大衍秘典、周天天术、道德仙经、天地大道、鸿蒙天书、乾坤真典",
  },
];

const characterSamples = [
  {
    name: "鹿真人",
    sect: "鹿石宗",
    role: "宗主",
    root: "未知",
    trait: "隐居创建鹿石宗，疑似上一任万化道躯宿主陆有道；常年云游，负责主线与特殊事件引导。",
  },
  {
    name: "小娴",
    sect: "鹿石宗",
    role: "弟子",
    root: "水灵根 · 玄",
    trait: "24岁，鹿石宗大师姐，温柔开朗、热心肠，负责炼丹、种植、回血等家园功能引导。",
  },
  {
    name: "小张",
    sect: "鹿石宗",
    role: "弟子",
    root: "木灵根 · 玄",
    trait: "20岁，自称张真人，装B型人格，贪玩爱探险，有点胆小但关键时刻会挺身而出。",
  },
  {
    name: "雏雏（楚凌）",
    sect: "金灵宗",
    role: "亲传弟子",
    root: "金灵根 · 天",
    trait: "沉稳克制，做事有原则，是压场喊停的人。",
  },
  {
    name: "小鹿（鹿宁）",
    sect: "金灵宗",
    role: "亲传弟子",
    root: "金灵根 · 天",
    trait: "冲动嘴快，爱憎分明，口头禅是“师兄，要不要我现在就送他一程”。",
  },
  {
    name: "豆髯道人",
    sect: "青木门",
    role: "内门弟子",
    root: "木灵根 · 地",
    trait: "热心友善，善于交际，擅长种植、下毒、炼丹。",
  },
  {
    name: "羊七道人",
    sect: "青木门",
    role: "亲传弟子",
    root: "木灵根 · 天",
    trait: "开朗爱笑，助人为乐，情绪有时有点小激动。",
  },
  {
    name: "春琼",
    sect: "寒妙观",
    role: "亲传弟子",
    root: "水灵根 · 天",
    trait: "26岁，寒妙观破例收入的唯一男弟子，宅但天赋异禀。",
  },
  {
    name: "云卷舒",
    sect: "寒妙观",
    role: "内门弟子",
    root: "水灵根 · 地",
    trait: "22岁，强力辅助回复，适合承接寒妙观治疗与解语功能。",
  },
  {
    name: "墨炎",
    sect: "九阳炎天宗",
    role: "亲传弟子",
    root: "火灵根 · 天",
    trait: "32岁，筑基初期，争强好胜，与林川表面不对付，实际心心相惜。",
  },
  {
    name: "林川",
    sect: "九阳炎天宗",
    role: "亲传弟子",
    root: "火灵根 · 天",
    trait: "35岁，筑基初期，与墨炎互相较劲，是火系同辈线的另一半。",
  },
  {
    name: "黄垚苓",
    sect: "须弥山府",
    role: "亲传弟子",
    root: "土灵根 · 天",
    trait: "20岁，活泼好动的小师妹，是须弥山府山崩急救事件的核心登场人物。",
  },
  {
    name: "石璧",
    sect: "须弥山府",
    role: "内门弟子",
    root: "土灵根 · 地",
    trait: "28岁，无条件保护黄垚苓，听小师妹安排，承担土系守护感。",
  },
  {
    name: "兔娘会长",
    sect: "长安城拍卖行",
    role: "会长",
    root: "未知",
    trait: "传说也是穿越而来的高人，思维奇特，创立长安城与类战棋拍卖行。",
  },
];

const sectSettings = [
  "金灵宗：杀伐剑道、锐锋破甲，宗门严整，崇尚斩妖除魔，经营兵刃铁匠铺与矿石生意。",
  "青木门：草木长生、毒愈双修，人缘最好，经营医疗、草药与成药生意。",
  "寒妙观：寒冰幻术、灵泉疗愈，只收女弟子是门规偏好，春琼是破例男弟子，经营解语与心理疏导。",
  "九阳炎天宗：烈阳真火、强攻爆发，重视炼丹炼器和发明评奖，经营法器锻造与流通。",
  "须弥山府：厚土镇守、坚甲御敌，不问根骨，只问是否走得上山，承担大陆赈济之责。",
];

const timelineEntries = [
  "第0年 · 序章：开局CG、穿越、被小张小娴救回鹿石宗，鹿真人看出万化道躯端倪。",
  "第1-3年 · 鹿石宗启蒙：认识大厅、广场、宿舍、师姐居室、闭关室、炼器坊、炼丹房、灵植园和传送阵。",
  "第5年 · 万化道躯初显：首次修炼即转换灵根成功，鹿真人远处若有所思。",
  "第10年 · 山鼠洞寻宝：小张邀约探宝，青木门羊七、豆髯登场，当前 Demo 已做完整流程。",
  "第12年 · 啖愿妖事件：断桥村委托，金灵宗雏雏、小鹿登场，当前 Demo 按事件脚本暂定第12年。",
  "第15年 · 长安城初见闻：结识兔娘会长，见识以物置物的拍卖行体系。",
  "第25-60年 · 筑基期：拜访五宗，五宗论道会与青年才俊比武大会展开世界观。",
  "第60-100年 · 金丹期前半：长安城拍卖异变、忘川魔渊初现、金丹盛典，首发/Demo建议截止到第100年。",
  "第150-500年 · 中后期：魔道渗透、鹿真人身世、飞升/轮回抉择与终局大战逐步揭开。",
];

const worldLore = [
  "万化道躯：玩家专属体质，本身没有固定灵根，修行何种功法，体内灵气便自动转化成对应属性根基。",
  "鹿花诀：鹿真人传给玩家的入门功法，表面普通，实则用于让万化道躯与魂魄绑定。",
  "鹿真人/陆有道：剧情大纲中，鹿真人疑似上一位万化道躯宿主陆有道，曾在三百年前封魔之战后放弃飞升。",
  "魔王暗线：魔宗残部暗中复活魔王，玩家一周目会被一条条线索引向魔宗腹地，最后意识到自己也在棋局之中。",
  "飞升与轮回：飞升和轮回不分高下，只影响结局呈现，二者都能开启二周目。",
  "主题表达：修仙不是单纯追求长生，而是让玩家在小娴、小张、鹿石宗和五宗同辈的羁绊里感受取舍。",
];

function playSceneClick() {
  const audio = new Audio(assetPath("assets/audio/scene-click.wav"));
  audio.volume = 0.35;
  void audio.play().catch(() => {
    // Browsers can reject sounds until the first user gesture; button clicks normally allow it.
  });
}

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

function getActorPortrait(actor: "xiaozhang" | "xiaoxian" | "lu") {
  const names: Record<typeof actor, string> = {
    xiaozhang: "小张",
    xiaoxian: "小娴",
    lu: "鹿真人",
  };
  const expression: Record<typeof actor, PortraitExpression> = {
    xiaozhang: "normal",
    xiaoxian: "happy",
    lu: "normal",
  };
  return {
    key: actor,
    expression: expression[actor],
    name: names[actor],
  };
}

function getSpeakerPortrait(
  speaker: string,
  node?: DemoEventNode,
): { key: PortraitKey; expression: PortraitExpression; name: string } | null {
  const seriousNode = node?.mode === "battle" || node?.id.includes("boss") || node?.id.includes("rat-king");

  if (speaker === "主角") {
    return {
      key: "player",
      expression: node?.mode === "choice" ? "serious" : "normal",
      name: "主角",
    };
  }

  if (speaker === "小张" || speaker === "张真人") {
    const expression: PortraitExpression = seriousNode
      ? "serious"
      : node?.id === "invite"
        ? "happy"
        : node?.id === "rat-king"
          ? "snark"
          : "normal";
    return {
      key: "xiaozhang",
      expression,
      name: speaker,
    };
  }

  if (speaker === "小娴") {
    return {
      key: "xiaoxian",
      expression: "happy",
      name: "小娴",
    };
  }

  if (speaker === "鹿真人") {
    return {
      key: "lu",
      expression: node?.text.includes("哈哈") ? "happy" : "normal",
      name: "鹿真人",
    };
  }

  return null;
}

function CharacterPortrait({
  portrait,
}: {
  portrait: { key: PortraitKey; expression: PortraitExpression; name: string };
}) {
  return (
    <div className={`portrait portrait-image portrait-${portrait.key}`}>
      <img src={portraitAssets[portrait.key][portrait.expression]} alt={portrait.name} draggable={false} />
      <div className="nameplate">{portrait.name}</div>
    </div>
  );
}

function ResourceChip({
  icon,
  label,
  value,
}: {
  icon: (typeof resourceIcons)[keyof typeof resourceIcons];
  label: string;
  value: number;
}) {
  return (
    <span className="resource-chip">
      <img src={icon} alt="" aria-hidden="true" />
      <b>{label}</b>
      {value}
    </span>
  );
}

function OpeningScene({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const lines = [
    { speaker: "旁白", text: "天地有道，五行定仙凡。金木水火土，灵根乃道源。" },
    { speaker: "旁白", text: "异世来客，魂落此间，身无半点灵根，仙途已然断垣。" },
    { speaker: "小张", text: "这是什么？哇靠，单眼泥精！师姐救我！" },
    { speaker: "小娴", text: "别贫了，快搭把手。他还活着，先带回鹿石宗。" },
    { speaker: "鹿真人", text: "这孩子没有灵根……甚至没用丹田？哈哈，有趣。鹿花诀留下，后面的路让他自己走。" },
    { speaker: "旁白", text: "唯得天赐异道，身怀先天万化道躯。习得任一功法，灵根便随心蜕变。" },
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
        <p>万化归途 · {current.speaker}</p>
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
            万化归途 · {formatTime(state)} · {state.cultivation.level} · {sceneConfig[getScene(state)].label}
          </span>
        </div>
      </div>
      <div className="resource-bar">
        <ResourceChip icon={resourceIcons.spiritStones} label="灵石" value={state.resources.spiritStones} />
        <ResourceChip icon={resourceIcons.spiritMarrow} label="灵髓" value={state.resources.spiritMarrow} />
        <ResourceChip icon={resourceIcons.herbs} label="草药" value={state.resources.herbs} />
        <ResourceChip icon={resourceIcons.ore} label="矿石" value={state.resources.ore} />
        <ResourceChip icon={resourceIcons.pills} label="丹药" value={state.resources.pills} />
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
          onClick={() => {
            playSceneClick();
            onAction(`change_scene:${scene}`);
          }}
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
    世界: [...worldLore, ...timelineEntries, ...sectSettings],
    事件: [
      `已完成：${completedText}`,
      ...getEventList(events).map(
        (event) =>
          `第${event.triggerYear}年 · ${event.title} · ${event.location}：${event.summary} 奖励：${event.rewardText}`,
      ),
    ],
    关系: [relationshipText],
    人物: characterSamples.map(
      (character) =>
        `${character.name} · ${character.sect} · ${character.role} · ${character.root}：${character.trait}`,
    ),
    功法: [
      "机制：主修功法分金木水火土无六类，品阶为仙天地玄黄，每门主修功法有10层进阶。",
      "战斗：主修功法提供自动攻击形态，类似普攻；法术位置用于配置主动招式。",
      "配置：每个法术位由术法、技法、秘法1、秘法2组成，并受仙天地玄黄配置上限限制。",
      `当前功法：${state.cultivation.learnedArts.join("、")}；灵根体质：${state.cultivation.root}`,
      ...artSamples.map((art) => `${art.rank}阶 · ${art.name} · ${art.attack} · ${art.slots}`),
      ...artFamilies.map((family) => `${family.element}系 · ${family.style}：${family.note}`),
      `事件物品：山鼠妖丹 ${inventory.mouseDemonCore} / 忘忧根 ${inventory.worryForgetRoot} / 青木疗伤丹 ${inventory.qingmuHealingPills} / 金灵宗信物 ${inventory.jinlingToken}`,
    ],
    设置: ["可重开 Demo，也可重播开场。"],
  };

  function renderPanelBody() {
    if (panel === "世界") {
      return (
        <>
          <div className="panel-section">
            <h3>核心世界观</h3>
            {worldLore.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <div className="panel-section">
            <h3>1-500年节奏</h3>
            {timelineEntries.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <div className="panel-section">
            <h3>五宗定位</h3>
            {sectSettings.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </>
      );
    }

    if (panel === "人物") {
      return (
        <div className="character-sample-grid">
          {characterSamples.map((character) => (
            <article key={character.name} className="character-sample-card">
              <strong>{character.name}</strong>
              <span>
                {character.sect} · {character.role} · {character.root}
              </span>
              <small>{character.trait}</small>
            </article>
          ))}
        </div>
      );
    }

    if (panel === "功法") {
      return (
        <>
          {content[panel].slice(0, 4).map((line, index) => (
            <p key={`${panel}-${index}`}>{line}</p>
          ))}
          <div className="art-sample-grid">
            {artSamples.map((art) => (
              <article key={art.name} className="art-sample-card">
                <img src={art.icon} alt="" aria-hidden="true" />
                <div>
                  <strong>
                    {art.rank} · {art.name}
                  </strong>
                  <span>{art.attack}</span>
                  <small>{art.slots}</small>
                </div>
              </article>
            ))}
          </div>
          <div className="panel-section">
            <h3>六系功法库</h3>
            {artFamilies.map((family) => (
              <p key={family.element}>
                {family.element}系 · {family.style}：{family.note} 代表功法：{family.names}
              </p>
            ))}
          </div>
          <p>{content[panel][content[panel].length - 1]}</p>
        </>
      );
    }

    return content[panel].map((line, index) => <p key={`${panel}-${index}`}>{line}</p>);
  }

  return (
    <div className="panel-backdrop">
      <section className="utility-panel">
        <header>
          <h2>{panel}</h2>
          <button onClick={onClose}>关闭</button>
        </header>
        <div className="panel-body">{renderPanelBody()}</div>
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
          <div className="player-combatant player-a">
            <img src={assetPath("assets/combat/player-combat.webp")} alt="" aria-hidden="true" />
            <span>主角</span>
          </div>
          <div className="player-combatant player-b">小张</div>
          {stage === "mouse_boss_final" && <div className="ally-combatant ally-a">羊七</div>}
          {stage === "mouse_boss_final" && <div className="ally-combatant ally-b">豆髯</div>}
          {stage === "wish_eater_boss" && <div className="ally-combatant ally-a">雏雏</div>}
          {stage === "wish_eater_boss" && <div className="ally-combatant ally-b">小鹿</div>}
          {isBossStage ? (
            <div className={`event-boss ${stage.startsWith("wish") ? "boss-wish" : "boss-rat"}`}>
              <img
                src={
                  stage.startsWith("wish")
                    ? assetPath("assets/monsters/wish-eater.webp")
                    : assetPath("assets/monsters/mouse-king.webp")
                }
                alt=""
                aria-hidden="true"
              />
              <span>{stage.startsWith("wish") ? "啖愿妖" : "山鼠王"}</span>
            </div>
          ) : (
            <>
              <div className="event-mob mob-a">
                {stage.startsWith("bridge") ? (
                  "祟"
                ) : (
                  <img src={assetPath("assets/monsters/mouse-minion.webp")} alt="" aria-hidden="true" />
                )}
              </div>
              <div className="event-mob mob-b">
                {stage.startsWith("bridge") ? (
                  "影"
                ) : (
                  <img src={assetPath("assets/monsters/mouse-minion.webp")} alt="" aria-hidden="true" />
                )}
              </div>
              <div className="event-mob mob-c">
                {stage.startsWith("bridge") ? (
                  "怨"
                ) : (
                  <img src={assetPath("assets/monsters/mouse-minion.webp")} alt="" aria-hidden="true" />
                )}
              </div>
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
                onClick={() => {
                  playSceneClick();
                  onAction(choice.action);
                }}
              >
                {busyAction === choice.action ? "处理中" : choice.label}
              </button>
            ))}
          </div>
        ) : (
          <button
            className="event-primary"
            disabled={busy}
            onClick={() => {
              playSceneClick();
              onAction(node.mode === "battle" ? "battle_victory" : "advance_event");
            }}
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
              onClick={() => {
                playSceneClick();
                onAction(isTeleportReady ? action : "change_scene:teleport_array");
              }}
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
  const currentPortrait =
    activeEvent && activeEvent.node.mode !== "battle"
      ? getSpeakerPortrait(dialogueSpeaker, activeEvent.node)
      : activeEvent
        ? null
        : getActorPortrait(config.actor);
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
        {currentPortrait && <CharacterPortrait portrait={currentPortrait} />}

        <aside className="right-menu">
          {(["日志", "世界", "事件", "关系", "人物", "功法", "设置"] as Panel[]).map((item) => (
            <button
              key={item}
              disabled={busy}
              onClick={() => {
                playSceneClick();
                onOpenPanel(item);
              }}
            >
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
          <button
            disabled={busy}
            onClick={() => {
              playSceneClick();
              onAction(config.primaryAction);
            }}
          >
            {busyAction === config.primaryAction ? "进行中" : config.primaryLabel}
          </button>
          <button
            disabled={busy}
            onClick={() => {
              playSceneClick();
              onAction("cultivate");
            }}
          >
            闭关修炼
          </button>
          <button
            disabled={busy}
            onClick={() => {
              playSceneClick();
              onAction("alchemy");
            }}
          >
            炼丹
          </button>
          <button
            disabled={busy}
            onClick={() => {
              playSceneClick();
              onAction("plant");
            }}
          >
            种植
          </button>
          <button
            disabled={busy}
            onClick={() => {
              playSceneClick();
              onAction("forge");
            }}
          >
            炼器
          </button>
          {scene === "teleport_array" ? (
            <>
              <button
                disabled={busy}
                onClick={() => {
                  playSceneClick();
                  onAction("start_mouse_cave");
                }}
              >
                传送山鼠洞
              </button>
              <button
                disabled={busy}
                onClick={() => {
                  playSceneClick();
                  onAction("start_event:wish_eater_bridge");
                }}
              >
                传送断桥村
              </button>
            </>
          ) : (
            <button
              disabled={busy}
              onClick={() => {
                playSceneClick();
                onAction("change_scene:teleport_array");
              }}
            >
              前往传送阵
            </button>
          )}
          {inBattle && (
            <button
              disabled={busy}
              onClick={() => {
                playSceneClick();
                onAction("battle_victory");
              }}
            >
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
