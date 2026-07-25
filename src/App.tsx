import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

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

type DemoMethodId = "luhua_jue" | "jinmang_jue" | "yanxin_jue";
type DemoSpellId = "jinmang" | "shuiren" | "huodan";
type DemoTechniqueId = "straight" | "ring" | "drop";
type DemoSecretId = "cuti" | "mingmu" | "pojia" | "yufeng";

type DemoLoadout = {
  methodId: DemoMethodId;
  spellSlot: {
    spellId: DemoSpellId;
    techniqueId: DemoTechniqueId;
    secretIds: [DemoSecretId, DemoSecretId];
  };
};

type DemoEquipment = {
  weapon: string;
  armor: string;
  accessory: string;
};

type DemoEquipAction =
  | `equip_method:${DemoMethodId}`
  | `equip_spell:${DemoSpellId}`
  | `equip_technique:${DemoTechniqueId}`
  | `equip_secret_1:${DemoSecretId}`
  | `equip_secret_2:${DemoSecretId}`;

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
  | DemoEquipAction
  | DemoEventChoiceAction;

type DemoBattleResult = {
  stageId: string;
  victory: boolean;
  kills: number;
  seconds: number;
  hpPercent: number;
  spiritStones: number;
  damageTaken: number;
  bossDefeated: boolean;
};

type DemoBattleStats = {
  runs: number;
  victories: number;
  defeats: number;
  kills: number;
  bestSeconds: number | null;
  lastResult: DemoBattleResult | null;
};

type DemoActionPayload = {
  battleResult?: DemoBattleResult;
};

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
  equipment?: DemoEquipment;
  loadout?: DemoLoadout;
  relationships: Array<{
    characterId: DemoCharacterId;
    name: string;
    bond: number;
  }>;
  flags: Record<string, boolean>;
  battleStats?: DemoBattleStats;
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

type Panel = "我的" | "日志" | "世界" | "事件" | "关系" | "人物" | "功法" | "设置";
type ProfileTab = "属性" | "物品" | "装备" | "功法" | "术法";
type BagCategory = "装备" | "丹药" | "秘籍" | "任务" | "材料" | "其他";
type EquipmentView = "武器" | "服饰" | "法宝" | "丹药";
type BagItem = {
  id: string;
  icon?: string;
  category: BagCategory;
  name: string;
  value: number;
  description: string;
  useLabel: string;
};
type SceneMenuItem = {
  label: string;
  hint?: string;
  action?: DemoAction;
  panel?: Panel;
  profileTab?: ProfileTab;
};

const profileTabItems: { id: ProfileTab; note: string }[] = [
  { id: "属性", note: "主角状态" },
  { id: "物品", note: "资源道具" },
  { id: "装备", note: "武器护具" },
  { id: "功法", note: "主修切换" },
  { id: "术法", note: "技能配置" },
];

const bagCategories: BagCategory[] = ["装备", "丹药", "秘籍", "任务", "材料", "其他"];
const equipmentViews: EquipmentView[] = ["武器", "服饰", "法宝", "丹药"];

type PortraitKey =
  | "player"
  | "xiaozhang"
  | "xiaoxian"
  | "lu"
  | "yangqi"
  | "douran"
  | "chuchu"
  | "xiaolu"
  | "chunqiong"
  | "wanhuaBody";
type PortraitExpression = "normal" | "happy" | "serious" | "snark";

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.PROD ? `${window.location.origin}/wanhua-api` : "http://localhost:3001");

function assetPath(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;
}

const portraitAssets: Record<PortraitKey, Record<PortraitExpression, string>> = {
  player: {
    normal: assetPath("assets/tapflow/portraits/player-normal.webp"),
    happy: assetPath("assets/tapflow/portraits/player-happy.webp"),
    serious: assetPath("assets/tapflow/portraits/player-serious.webp"),
    snark: assetPath("assets/tapflow/portraits/player-snark.webp"),
  },
  xiaozhang: {
    normal: assetPath("assets/tapflow/portraits/xiaozhang-normal.webp"),
    happy: assetPath("assets/tapflow/portraits/xiaozhang-happy.webp"),
    serious: assetPath("assets/tapflow/portraits/xiaozhang-serious.webp"),
    snark: assetPath("assets/tapflow/portraits/xiaozhang-snark.webp"),
  },
  xiaoxian: {
    normal: assetPath("assets/tapflow/portraits/xiaoxian-normal.webp"),
    happy: assetPath("assets/tapflow/portraits/xiaoxian-happy.webp"),
    serious: assetPath("assets/tapflow/portraits/xiaoxian-serious.webp"),
    snark: assetPath("assets/tapflow/portraits/xiaoxian-snark.webp"),
  },
  lu: {
    normal: assetPath("assets/tapflow/portraits/lu-normal.webp"),
    happy: assetPath("assets/tapflow/portraits/lu-happy.webp"),
    serious: assetPath("assets/tapflow/portraits/lu-serious.webp"),
    snark: assetPath("assets/tapflow/portraits/lu-snark.webp"),
  },
  yangqi: {
    normal: assetPath("assets/tapflow/portraits/yangqi.webp"),
    happy: assetPath("assets/tapflow/portraits/yangqi.webp"),
    serious: assetPath("assets/tapflow/portraits/yangqi.webp"),
    snark: assetPath("assets/tapflow/portraits/yangqi.webp"),
  },
  douran: {
    normal: assetPath("assets/tapflow/portraits/douran.webp"),
    happy: assetPath("assets/tapflow/portraits/douran.webp"),
    serious: assetPath("assets/tapflow/portraits/douran.webp"),
    snark: assetPath("assets/tapflow/portraits/douran.webp"),
  },
  chuchu: {
    normal: assetPath("assets/tapflow/portraits/chuchu.webp"),
    happy: assetPath("assets/tapflow/portraits/chuchu.webp"),
    serious: assetPath("assets/tapflow/portraits/chuchu.webp"),
    snark: assetPath("assets/tapflow/portraits/chuchu.webp"),
  },
  xiaolu: {
    normal: assetPath("assets/tapflow/portraits/xiaolu.webp"),
    happy: assetPath("assets/tapflow/portraits/xiaolu.webp"),
    serious: assetPath("assets/tapflow/portraits/xiaolu.webp"),
    snark: assetPath("assets/tapflow/portraits/xiaolu.webp"),
  },
  chunqiong: {
    normal: assetPath("assets/tapflow/portraits/chunqiong.webp"),
    happy: assetPath("assets/tapflow/portraits/chunqiong.webp"),
    serious: assetPath("assets/tapflow/portraits/chunqiong.webp"),
    snark: assetPath("assets/tapflow/portraits/chunqiong.webp"),
  },
  wanhuaBody: {
    normal: assetPath("assets/tapflow/portraits/wanhua-body.webp"),
    happy: assetPath("assets/tapflow/portraits/wanhua-body.webp"),
    serious: assetPath("assets/tapflow/portraits/wanhua-body.webp"),
    snark: assetPath("assets/tapflow/portraits/wanhua-body.webp"),
  },
};

const resourceIcons = {
  spiritStones: assetPath("assets/tapflow/ui/spirit-stone.webp"),
  spiritMarrow: assetPath("assets/tapflow/ui/spirit-marrow.webp"),
  herbs: assetPath("assets/tapflow/ui/herb.webp"),
  ore: assetPath("assets/tapflow/ui/ore.webp"),
  pills: assetPath("assets/tapflow/ui/pill.webp"),
} as const;

const methodIds: DemoMethodId[] = ["luhua_jue", "jinmang_jue", "yanxin_jue"];
const spellIds: DemoSpellId[] = ["jinmang", "shuiren", "huodan"];
const techniqueIds: DemoTechniqueId[] = ["straight", "ring", "drop"];
const secretIds: DemoSecretId[] = ["cuti", "mingmu", "pojia", "yufeng"];

const defaultEquipment: DemoEquipment = {
  weapon: "青锋剑",
  armor: "旧布法袍",
  accessory: "鹿石令",
};

const defaultLoadout: DemoLoadout = {
  methodId: "luhua_jue",
  spellSlot: {
    spellId: "jinmang",
    techniqueId: "straight",
    secretIds: ["cuti", "mingmu"],
  },
};

const methodCatalog: Record<
  DemoMethodId,
  {
    name: string;
    element: "无" | "金" | "火";
    rank: "黄";
    role: string;
    cultivateSpeed: number;
    attackName: string;
    attackDamage: number;
    projectileSpeed: number;
    attackInterval: number;
    defense: number;
    regen: number;
    shield: number;
    description: string;
    color: string;
    icon?: string;
  }
> = {
  luhua_jue: {
    name: "鹿花诀",
    element: "无",
    rank: "黄",
    role: "均衡续航",
    cultivateSpeed: 10,
    attackName: "灵光飞行",
    attackDamage: 12,
    projectileSpeed: 350,
    attackInterval: 0.8,
    defense: 5,
    regen: 2,
    shield: 0,
    description: "剧情必学，回血续航强，与所有术法兼容，适合新手测试。",
    color: "#dceeff",
    icon: assetPath("assets/tapflow/loadout/wanhua-body.webp"),
  },
  jinmang_jue: {
    name: "金芒诀",
    element: "金",
    rank: "黄",
    role: "穿透快攻",
    cultivateSpeed: 12,
    attackName: "金色锋刃飞行",
    attackDamage: 15,
    projectileSpeed: 400,
    attackInterval: 0.9,
    defense: 3,
    regen: 0,
    shield: 0,
    description: "普攻弹道快，配金系术法无损伤害，适合激进打法。",
    color: "#f7d36a",
    icon: assetPath("assets/tapflow/arts/gold/huang-jinmang-jue.webp"),
  },
  yanxin_jue: {
    name: "焰心诀",
    element: "火",
    rank: "黄",
    role: "爆发焚敌",
    cultivateSpeed: 14,
    attackName: "烈焰爆裂",
    attackDamage: 18,
    projectileSpeed: 300,
    attackInterval: 1.1,
    defense: 0,
    regen: 0,
    shield: 0,
    description: "普攻伤害最高但没有防御和回血，适合操作熟练时试爆发。",
    color: "#ff8a4f",
  },
};

const spellCatalog: Record<
  DemoSpellId,
  {
    name: string;
    element: "金" | "水" | "火";
    rank: "黄";
    baseDamage: number;
    manaCost: number;
    cooldown: number;
    effect: string;
    visual: string;
    color: string;
  }
> = {
  jinmang: {
    name: "金芒",
    element: "金",
    rank: "黄",
    baseDamage: 20,
    manaCost: 15,
    cooldown: 3,
    effect: "穿透，对护甲目标伤害更高",
    visual: "金色细长锋刃，命中后贯穿继续飞行",
    color: "#f5d566",
  },
  shuiren: {
    name: "水刃",
    element: "水",
    rank: "黄",
    baseDamage: 14,
    manaCost: 12,
    cooldown: 2.5,
    effect: "命中目标减速30%，持续2秒",
    visual: "淡蓝色水波刃，命中时溅开水花",
    color: "#80d8ff",
  },
  huodan: {
    name: "火弹",
    element: "火",
    rank: "黄",
    baseDamage: 24,
    manaCost: 18,
    cooldown: 3.5,
    effect: "命中后灼烧，追加3跳伤害",
    visual: "橙红色火球，命中时爆开火花",
    color: "#ff7a3d",
  },
};

const techniqueCatalog: Record<
  DemoTechniqueId,
  {
    name: string;
    rank: "黄";
    projectileType: string;
    damageMultiplier: number;
    range: number;
    description: string;
  }
> = {
  straight: {
    name: "直线飞行",
    rank: "黄",
    projectileType: "直线弹道",
    damageMultiplier: 1,
    range: 600,
    description: "沿直线飞出，可穿透1个敌人，适合点杀。",
  },
  ring: {
    name: "环形扩散",
    rank: "黄",
    projectileType: "自身中心扩散",
    damageMultiplier: 0.7,
    range: 150,
    description: "以角色为中心爆开冲击波，适合被包围时清场。",
  },
  drop: {
    name: "天降坠击",
    rank: "黄",
    projectileType: "目标落点",
    damageMultiplier: 1.3,
    range: 500,
    description: "锁定最近敌人落下光柱，落地后溅射。",
  },
};

const secretCatalog: Record<
  DemoSecretId,
  {
    name: string;
    rank: "黄";
    effectType: string;
    effectValue: string;
    flatDamage?: number;
    critChance?: number;
    armorPierce?: number;
    rangeBonus?: number;
    description: string;
  }
> = {
  cuti: {
    name: "淬体",
    rank: "黄",
    effectType: "攻击加成",
    effectValue: "+5",
    flatDamage: 5,
    description: "最终伤害固定+5。",
  },
  mingmu: {
    name: "明目",
    rank: "黄",
    effectType: "暴击几率",
    effectValue: "+5%",
    critChance: 0.05,
    description: "暴击率+5%，暴击时伤害×1.5。",
  },
  pojia: {
    name: "破甲",
    rank: "黄",
    effectType: "穿透加成",
    effectValue: "+10%",
    armorPierce: 0.1,
    description: "忽视目标10%防御，对BOSS更明显。",
  },
  yufeng: {
    name: "御风",
    rank: "黄",
    effectType: "射程加成",
    effectValue: "+30%",
    rangeBonus: 0.3,
    description: "直线与环形射程+30%，天降坠击不受影响。",
  },
};

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

const ambientMusicUrl = assetPath("assets/audio/lushi-origin.mp3");

function useAmbientMusic(enabled: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    enabledRef.current = enabled;
    const audio = audioRef.current;
    if (!audio) return;

    if (enabled) {
      void audio.play().catch(() => {
        // Background music starts after the first user gesture because browsers block autoplay.
      });
    } else {
      audio.pause();
    }
  }, [enabled]);

  useEffect(() => {
    const audio = new Audio(ambientMusicUrl);
    audio.loop = true;
    audio.preload = "none";
    audio.volume = 0.24;
    audioRef.current = audio;

    const tryPlay = () => {
      if (!enabledRef.current) return;
      void audio.play().catch(() => {
        // A later click or key press will retry.
      });
    };

    document.addEventListener("pointerdown", tryPlay, true);
    document.addEventListener("keydown", tryPlay, true);

    return () => {
      document.removeEventListener("pointerdown", tryPlay, true);
      document.removeEventListener("keydown", tryPlay, true);
      audio.pause();
      audioRef.current = null;
    };
  }, []);
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

const hubSceneTargets: DemoScene[] = [
  "hall",
  "dormitory",
  "sister_room",
  "meditation_room",
  "forge",
  "alchemy_room",
  "spirit_garden",
  "teleport_array",
];

function getSceneMenuItems(scene: DemoScene): SceneMenuItem[] {
  if (scene === "plaza") {
    return [
      { label: "洒扫广场", hint: "帮小张整理演武木桩", action: "sweep_plaza" },
      { label: "找小张", hint: "与大师兄聊聊近况", action: "sweep_plaza" },
      { label: "宗门记录", hint: "查看最近发生的事", panel: "日志" },
    ];
  }

  const backToPlaza: SceneMenuItem = {
    label: "返回",
    hint: "回到鹿石宗广场主界面",
    action: "change_scene:plaza",
  };

  const sceneMenus: Partial<Record<DemoScene, SceneMenuItem[]>> = {
    hall: [
      { label: "阅读门规", hint: "查看鹿石宗和五宗设定", panel: "世界" },
      { label: "鹿真人手记", hint: "查看最近事件与主线线索", panel: "日志" },
      backToPlaza,
    ],
    dormitory: [
      { label: "休息", hint: "推进一月并恢复状态", action: "rest" },
      { label: "仓库", hint: "打开人物背包", panel: "我的", profileTab: "物品" },
      backToPlaza,
    ],
    sister_room: [
      { label: "交谈", hint: "找小娴师姐说话", action: "talk_xiaoxian" },
      { label: "查看丹药", hint: "打开背包丹药栏", panel: "我的", profileTab: "物品" },
      backToPlaza,
    ],
    meditation_room: [
      { label: "练功", hint: "运转功法提升修为", action: "cultivate" },
      { label: "研习", hint: "打开功法配置", panel: "我的", profileTab: "功法" },
      { label: "闭修", hint: "消耗灵石闭关一月", action: "cultivate" },
      backToPlaza,
    ],
    forge: [
      { label: "炼制装备", hint: "消耗矿石炼器", action: "forge" },
      { label: "淬炼法宝", hint: "打开装备槽并查看候选物品", panel: "我的", profileTab: "装备" },
      backToPlaza,
    ],
    alchemy_room: [
      { label: "炼丹", hint: "消耗草药获得丹药", action: "alchemy" },
      { label: "查看丹药", hint: "打开背包物品说明", panel: "我的", profileTab: "物品" },
      backToPlaza,
    ],
    spirit_garden: [
      { label: "种植", hint: "照料灵植并推进时间", action: "plant" },
      { label: "收获", hint: "收获一批草药", action: "plant" },
      backToPlaza,
    ],
    teleport_array: [
      { label: "检查阵纹", hint: "解锁传送事件线索", action: "inspect_teleport" },
      { label: "山鼠洞", hint: "进入山鼠洞寻宝事件", action: "start_event:mouse_cave_treasure" },
      { label: "断桥村", hint: "进入啖愿妖测试事件", action: "start_event:wish_eater_bridge" },
      backToPlaza,
    ],
  };

  return sceneMenus[scene] ?? [backToPlaza];
}

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

function isKnownId<T extends string>(value: unknown, ids: T[]): value is T {
  return typeof value === "string" && ids.includes(value as T);
}

function getEquipment(state: DemoSaveState): DemoEquipment {
  return {
    ...defaultEquipment,
    ...(state.equipment ?? {}),
  };
}

function getLoadout(state: DemoSaveState): DemoLoadout {
  const slot = state.loadout?.spellSlot;
  const firstSecret = Array.isArray(slot?.secretIds) ? slot.secretIds[0] : undefined;
  const secondSecret = Array.isArray(slot?.secretIds) ? slot.secretIds[1] : undefined;

  return {
    methodId: isKnownId(state.loadout?.methodId, methodIds) ? state.loadout.methodId : defaultLoadout.methodId,
    spellSlot: {
      spellId: isKnownId(slot?.spellId, spellIds) ? slot.spellId : defaultLoadout.spellSlot.spellId,
      techniqueId: isKnownId(slot?.techniqueId, techniqueIds)
        ? slot.techniqueId
        : defaultLoadout.spellSlot.techniqueId,
      secretIds: [
        isKnownId(firstSecret, secretIds) ? firstSecret : defaultLoadout.spellSlot.secretIds[0],
        isKnownId(secondSecret, secretIds) ? secondSecret : defaultLoadout.spellSlot.secretIds[1],
      ],
    },
  };
}

type CombatProfile = {
  loadout: DemoLoadout;
  method: (typeof methodCatalog)[DemoMethodId];
  spell: (typeof spellCatalog)[DemoSpellId];
  technique: (typeof techniqueCatalog)[DemoTechniqueId];
  secrets: [(typeof secretCatalog)[DemoSecretId], (typeof secretCatalog)[DemoSecretId]];
  activeSkillName: string;
  elementMatch: boolean;
  elementFactor: number;
  flatDamage: number;
  critChance: number;
  armorPierce: number;
  rangeBonus: number;
  activeDamage: number;
  bossDamage: number;
  critDamage: number;
  range: number;
};

function getCombatProfile(loadout: DemoLoadout): CombatProfile {
  const method = methodCatalog[loadout.methodId];
  const spell = spellCatalog[loadout.spellSlot.spellId];
  const technique = techniqueCatalog[loadout.spellSlot.techniqueId];
  const secrets = loadout.spellSlot.secretIds.map((id) => secretCatalog[id]) as CombatProfile["secrets"];
  const flatDamage = secrets.reduce((total, secret) => total + (secret.flatDamage ?? 0), 0);
  const critChance = secrets.reduce((total, secret) => total + (secret.critChance ?? 0), 0);
  const armorPierce = secrets.reduce((total, secret) => total + (secret.armorPierce ?? 0), 0);
  const rangeBonus = secrets.reduce((total, secret) => total + (secret.rangeBonus ?? 0), 0);
  const elementMatch = method.element === "无" || method.element === spell.element;
  const elementFactor = elementMatch ? 1 : 0.7;
  const rawDamage = (spell.baseDamage * technique.damageMultiplier + flatDamage) * elementFactor;
  const activeDamage = Math.max(1, Math.round(rawDamage));
  const bossReduction = Math.max(0, 0.15 - armorPierce);
  const bossDamage = Math.max(1, Math.round(activeDamage * (1 - bossReduction)));
  const critDamage = Math.round(activeDamage * 1.5);
  const range = Math.round(
    technique.range * (loadout.spellSlot.techniqueId === "drop" ? 1 : 1 + rangeBonus),
  );

  return {
    loadout,
    method,
    spell,
    technique,
    secrets,
    activeSkillName: `${spell.name} · ${technique.name}`,
    elementMatch,
    elementFactor,
    flatDamage,
    critChance,
    armorPierce,
    rangeBonus,
    activeDamage,
    bossDamage,
    critDamage,
    range,
  };
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

function getVisualBackground(visualStage: DemoEventVisualStage) {
  const backgrounds: Record<DemoEventVisualStage, string> = {
    teleport_departure: "assets/tapflow/scenes/teleport-array.webp",
    mouse_cave: "assets/tapflow/events/mouse-cave-mouth.webp",
    mouse_skirmish: "assets/tapflow/events/mouse-cave-battle.webp",
    mouse_boss_crisis: "assets/tapflow/events/mouse-king-appears.webp",
    qingmu_rescue: "assets/tapflow/events/mouse-cave-depths.webp",
    mouse_boss_final: "assets/tapflow/events/mouse-cave-depths.webp",
    mouse_reward: "assets/tapflow/events/mouse-king-defeated.webp",
    bridge_village: "assets/tapflow/events/bridge-village-gate.webp",
    bridge_skirmish: "assets/tapflow/events/bridge-battle.webp",
    bridge_confrontation: "assets/tapflow/events/bridge-broken-side.webp",
    wish_eater_reveal: "assets/tapflow/events/wish-eater-reveal.webp",
    wish_eater_boss: "assets/tapflow/events/wish-eater-reveal.webp",
    bridge_reward: "assets/tapflow/events/battle-end.webp",
  };

  return `url("${assetPath(backgrounds[visualStage])}")`;
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

  if (speaker === "羊七道人") {
    return {
      key: "yangqi",
      expression: seriousNode ? "serious" : "happy",
      name: "羊七道人",
    };
  }

  if (speaker === "豆髯道人") {
    return {
      key: "douran",
      expression: node?.text.includes("哈哈") ? "happy" : "normal",
      name: "豆髯道人",
    };
  }

  if (speaker === "雏雏") {
    return {
      key: "chuchu",
      expression: seriousNode ? "serious" : "normal",
      name: "雏雏",
    };
  }

  if (speaker === "小鹿") {
    return {
      key: "xiaolu",
      expression: node?.text.includes("送他一程") ? "snark" : "serious",
      name: "小鹿",
    };
  }

  if (speaker === "啖愿妖") {
    return null;
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

function TopHud({
  state,
  scene,
  online,
  onOpenProfile,
  onOpenPanel,
}: {
  state: DemoSaveState;
  scene: DemoScene;
  online: boolean;
  onOpenProfile: () => void;
  onOpenPanel: (panel: Panel, profileTab?: ProfileTab) => void;
}) {
  const inventory = state.inventory ?? {
    mouseDemonCore: 0,
    worryForgetRoot: 0,
    qingmuHealingPills: 0,
    jinlingToken: 0,
  };
  const loadout = getLoadout(state);
  const method = methodCatalog[loadout.methodId];
  const maxHp = 100 + method.defense * 4 + method.shield;

  return (
    <header className="top-hud">
      <button
        type="button"
        className="player-card profile-button"
        onClick={() => {
          playSceneClick();
          onOpenProfile();
        }}
      >
        <div className="avatar">{method.element}</div>
        <div className="player-hud-info">
          <strong>异世来客</strong>
          <span>鹿石宗 · 新入门弟子 · 万化道躯</span>
          <div className="hud-bars">
            <label>
              <b>生命</b>
              <i>
                <em style={{ width: "100%" }} />
              </i>
              <small>{maxHp}/{maxHp}</small>
            </label>
            <label>
              <b>修为</b>
              <i>
                <em style={{ width: `${state.cultivation.realmProgress}%` }} />
              </i>
              <small>{state.cultivation.realmProgress}/100</small>
            </label>
          </div>
        </div>
      </button>
      <div className="hud-right">
        <div className="place-time">
          <strong>{formatTime(state)}</strong>
          <span>{sceneConfig[scene].label}</span>
        </div>
        <div className="hud-quick-actions">
          <button
            type="button"
            onClick={() => {
              playSceneClick();
              onOpenPanel("事件");
            }}
          >
            任务
          </button>
          <button
            type="button"
            onClick={() => {
              playSceneClick();
              onOpenPanel("设置");
            }}
          >
            设置
          </button>
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
  onAction: (action: DemoAction, payload?: DemoActionPayload) => void;
}) {
  return (
    <nav className="scene-nav" aria-label="前往鹿石宗场景">
      <span className="scene-nav-title">前往场景</span>
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

function SceneActionMenu({
  scene,
  busyAction,
  onAction,
  onOpenPanel,
}: {
  scene: DemoScene;
  busyAction: DemoAction | "reset" | null;
  onAction: (action: DemoAction, payload?: DemoActionPayload) => void;
  onOpenPanel: (panel: Panel, profileTab?: ProfileTab) => void;
}) {
  const busy = Boolean(busyAction);
  const items = getSceneMenuItems(scene);

  return (
    <aside className="scene-action-menu" aria-label={`${sceneConfig[scene].label}当前场景功能`}>
      <div>
        <span>当前场景</span>
        <strong>{sceneConfig[scene].label}</strong>
      </div>
      {items.map((item) => {
        const activeBusy = item.action && busyAction === item.action;
        return (
          <button
            key={`${scene}-${item.label}`}
            type="button"
            disabled={busy}
            onClick={() => {
              playSceneClick();
              if (item.panel) {
                onOpenPanel(item.panel, item.profileTab);
                return;
              }
              if (item.action) onAction(item.action);
            }}
          >
            <strong>{activeBusy ? "进行中" : item.label}</strong>
            {item.hint && <span>{item.hint}</span>}
          </button>
        );
      })}
    </aside>
  );
}

function SceneCharacterDock({
  scene,
  actorBond,
  busy,
  onAction,
}: {
  scene: DemoScene;
  actorBond: number;
  busy: boolean;
  onAction: (action: DemoAction, payload?: DemoActionPayload) => void;
}) {
  const config = sceneConfig[scene];
  const portrait = getActorPortrait(config.actor);
  const interactionAction = config.actor === "xiaoxian" ? "talk_xiaoxian" : config.primaryAction;

  return (
    <button
      type="button"
      className="scene-character-dock"
      disabled={busy}
      onClick={() => {
        playSceneClick();
        onAction(interactionAction);
      }}
    >
      <img src={portraitAssets[portrait.key][portrait.expression]} alt="" aria-hidden="true" />
      <div>
        <strong>{portrait.name}</strong>
        <span>羁绊 {actorBond} · {sceneConfig[scene].primaryLabel}</span>
      </div>
    </button>
  );
}

function UtilityPanel({
  panel,
  state,
  events,
  busyAction,
  initialProfileTab,
  musicEnabled,
  onAction,
  onClose,
  onReset,
  onToggleMusic,
  onReplayOpening,
}: {
  panel: Panel;
  state: DemoSaveState;
  events: Record<DemoEventId, DemoEventDefinition>;
  busyAction: DemoAction | "reset" | null;
  initialProfileTab: ProfileTab;
  musicEnabled: boolean;
  onAction: (action: DemoAction, payload?: DemoActionPayload) => void;
  onClose: () => void;
  onReset: () => void;
  onToggleMusic: () => void;
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
  const equipment = getEquipment(state);
  const loadout = getLoadout(state);
  const combatProfile = getCombatProfile(loadout);
  const lockLoadout = state.location === "battle" || Boolean(state.activeEvent);
  const equipBusy = Boolean(busyAction);
  const [profileTab, setProfileTab] = useState<ProfileTab>("属性");
  const [bagCategory, setBagCategory] = useState<BagCategory>("材料");
  const [selectedBagItemId, setSelectedBagItemId] = useState<string>("spiritStones");
  const [bagNotice, setBagNotice] = useState("点击物品查看说明。");
  const [equipmentView, setEquipmentView] = useState<EquipmentView>("武器");

  useEffect(() => {
    if (panel === "我的") setProfileTab(initialProfileTab);
  }, [initialProfileTab, panel]);

  const content: Record<Panel, string[]> = {
    我的: [],
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
    if (panel === "我的") {
      const maxHp = 100 + combatProfile.method.defense * 4 + combatProfile.method.shield;
      const identityRows = [
        ["姓名", "异世来客"],
        ["性别", "待玩家设定"],
        ["宗门-职位", "鹿石宗 · 新入门弟子"],
        ["称号", "万化道躯"],
        ["俸禄", "10 灵石/月"],
      ];
      const statRows = [
        ["血气", `${maxHp}/${maxHp}`],
        ["灵气", "60/60"],
        ["资质", "无灵根 · 万化可塑"],
        ["悟性", "良"],
        ["神识", "炼气初识"],
        ["遁速", `${combatProfile.method.projectileSpeed}`],
        ["福缘", `${state.resources.spiritMarrow + 1}`],
        ["寿元", "80/120"],
        ["境界", state.cultivation.level],
        ["修为", `${state.cultivation.realmProgress}/100`],
        ["修炼速度", `${combatProfile.method.cultivateSpeed}/月`],
        ["体质", state.cultivation.root],
        ["主修", combatProfile.method.name],
        ["防御", `${combatProfile.method.defense}`],
        ["回血", combatProfile.method.regen > 0 ? `${combatProfile.method.regen}/秒` : "无"],
      ];
      const inventoryRows: BagItem[] = [
        {
          id: "spiritStones",
          icon: resourceIcons.spiritStones,
          category: "材料" as BagCategory,
          name: "灵石",
          value: state.resources.spiritStones,
          description: "修仙界通用货币，可用于闭关、购买普通道具和宗门日常消耗。",
          useLabel: "查看用途",
        },
        {
          id: "spiritMarrow",
          icon: resourceIcons.spiritMarrow,
          category: "其他" as BagCategory,
          name: "灵髓",
          value: state.resources.spiritMarrow,
          description: "千年灵石孕出的高级资源，后续用于周目加点、DLC高级道具和特殊事件。",
          useLabel: "标记关注",
        },
        {
          id: "herbs",
          icon: resourceIcons.herbs,
          category: "材料" as BagCategory,
          name: "草药",
          value: state.resources.herbs,
          description: "灵植园产出的基础药材，可在炼丹房炼制回气丹等丹药。",
          useLabel: "前往炼丹",
        },
        {
          id: "ore",
          icon: resourceIcons.ore,
          category: "材料" as BagCategory,
          name: "矿石",
          value: state.resources.ore,
          description: "炼器坊消耗材料，用于打造或淬炼演示装备。",
          useLabel: "前往炼器",
        },
        {
          id: "pills",
          icon: resourceIcons.pills,
          category: "丹药" as BagCategory,
          name: "回气丹",
          value: state.resources.pills,
          description: "小娴常备的基础丹药，当前 demo 中用于表示恢复和炼丹产出。",
          useLabel: "服用",
        },
        {
          id: "mouseDemonCore",
          category: "材料" as BagCategory,
          name: "山鼠妖丹",
          value: inventory.mouseDemonCore,
          description: "山鼠洞事件战利品，后续可接入炼器、炼丹或任务提交。",
          useLabel: "查看事件",
        },
        {
          id: "worryForgetRoot",
          category: "材料" as BagCategory,
          name: "忘忧根",
          value: inventory.worryForgetRoot,
          description: "啖愿妖事件相关药材，可用于后续剧情分支和丹方。",
          useLabel: "查看事件",
        },
        {
          id: "qingmuHealingPills",
          category: "丹药" as BagCategory,
          name: "青木疗伤丹",
          value: inventory.qingmuHealingPills,
          description: "羊七道人和豆髯道人相关事件奖励，定位为治疗类丹药。",
          useLabel: "服用",
        },
        {
          id: "jinlingToken",
          category: "任务" as BagCategory,
          name: "金灵宗信物",
          value: inventory.jinlingToken,
          description: "金灵宗事件凭证，后续可用于解锁金系宗门支线。",
          useLabel: "查看线索",
        },
        {
          id: "luhuaManual",
          category: "秘籍" as BagCategory,
          name: "鹿花诀抄本",
          value: 1,
          description: "鹿真人留下的基础功法抄本，主角万化道躯的第一门入门功法。",
          useLabel: "研习",
        },
        {
          id: "starterSword",
          category: "装备" as BagCategory,
          name: equipment.weapon,
          value: 1,
          description: "鹿石宗仓库里翻出的基础飞剑，承担当前 demo 的普攻演示。",
          useLabel: "查看装备",
        },
      ];
      const visibleBagItems = inventoryRows.filter((item) => item.category === bagCategory);
      const selectedBagItem = inventoryRows.find((item) => item.id === selectedBagItemId) ?? inventoryRows[0];
      const equipmentSlots = [
        { view: "武器" as EquipmentView, label: "武器×1", name: equipment.weapon },
        { view: "服饰" as EquipmentView, label: "服饰×1", name: equipment.armor },
        { view: "法宝" as EquipmentView, label: "法宝×3", name: equipment.accessory },
        { view: "法宝" as EquipmentView, label: "法宝", name: "离火珠" },
        { view: "法宝" as EquipmentView, label: "法宝", name: "清心玉坠" },
        { view: "丹药" as EquipmentView, label: "丹药栏×4", name: "回气丹" },
        { view: "丹药" as EquipmentView, label: "丹药栏", name: "青木疗伤丹" },
        { view: "丹药" as EquipmentView, label: "丹药栏", name: "空槽" },
        { view: "丹药" as EquipmentView, label: "丹药栏", name: "空槽" },
      ];
      const equipmentCandidates = inventoryRows.filter((item) => {
        if (equipmentView === "丹药") return item.category === "丹药";
        if (equipmentView === "武器" || equipmentView === "服饰") return item.category === "装备";
        return item.category === "装备" || item.category === "材料";
      });

      return (
        <div className="profile-panel profile-panel-fixed">
          <div className="profile-content-shell">
          {profileTab === "属性" && (
          <section className="profile-identity profile-identity-fixed">
            <div className="profile-portrait">
              <img src={portraitAssets.player.normal} alt="主角半身像" />
            </div>
            <div>
              <span>主角</span>
              <h3>异世来客</h3>
              <p>身无灵根，身怀先天万化道躯。当前功法会决定战斗普攻形态，法术位决定空格主动技能。</p>
              <dl className="profile-meta-grid">
                {identityRows.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <dl className="profile-stats">
              {statRows.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
          )}

          {profileTab === "物品" && (
          <section className="profile-section">
            <div className="profile-section-title">
              <h3>物品栏</h3>
              <span>储物空间 {inventoryRows.length}/120 · 灵石 {state.resources.spiritStones}</span>
            </div>

            <div className="bag-category-tabs">
              {bagCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={bagCategory === category ? "active" : ""}
                  onClick={() => {
                    playSceneClick();
                    setBagCategory(category);
                    const firstInCategory = inventoryRows.find((item) => item.category === category);
                    if (firstInCategory) setSelectedBagItemId(firstInCategory.id);
                    setBagNotice(`${category}分类已切换。`);
                  }}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="bag-layout">
              <div className="inventory-grid">
                {visibleBagItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`inventory-cell ${selectedBagItem.id === item.id ? "active" : ""}`}
                    onClick={() => {
                      playSceneClick();
                      setSelectedBagItemId(item.id);
                      setBagNotice(`已选中 ${item.name}。`);
                    }}
                  >
                    {item.icon ? <img src={item.icon} alt="" aria-hidden="true" /> : <b>{item.name.slice(0, 1)}</b>}
                    <span>{item.name}</span>
                    <strong>{item.value}</strong>
                  </button>
                ))}
                {visibleBagItems.length === 0 && <p className="empty-note">该分类暂时没有物品。</p>}
              </div>

              <aside className="item-detail-panel">
                <span>物品详情</span>
                <div className="detail-icon">
                  {selectedBagItem.icon ? (
                    <img src={selectedBagItem.icon} alt="" aria-hidden="true" />
                  ) : (
                    <b>{selectedBagItem.name.slice(0, 1)}</b>
                  )}
                </div>
                <h3>{selectedBagItem.name}</h3>
                <strong>堆叠：{selectedBagItem.value}</strong>
                <p>{selectedBagItem.description}</p>
                <small>{bagNotice}</small>
                <button
                  type="button"
                  onClick={() => {
                    playSceneClick();
                    setBagNotice(`${selectedBagItem.name}：${selectedBagItem.useLabel}已记录到 demo 提示。`);
                  }}
                >
                  {selectedBagItem.useLabel}
                </button>
              </aside>
            </div>
          </section>
          )}

          {profileTab === "装备" && (
          <section className="profile-section">
            <div className="profile-section-title">
              <h3>装备栏</h3>
              <span>武器×1 / 服饰×1 / 法宝×3 / 丹药栏×4</span>
            </div>

            <div className="equipment-panel-layout">
              <div className="equipment-body">
                <img src={portraitAssets.player.normal} alt="" aria-hidden="true" />
                <div className="equipment-slot-grid">
                  {equipmentSlots.map((slot, index) => (
                    <button
                      key={`${slot.label}-${index}`}
                      type="button"
                      className={`equipment-slot ${equipmentView === slot.view ? "active" : ""}`}
                      onClick={() => {
                        playSceneClick();
                        setEquipmentView(slot.view);
                      }}
                    >
                      <small>{slot.label}</small>
                      <strong>{slot.name}</strong>
                      <span>{slot.view === "丹药" ? "战前携带" : "点击查看候选物品"}</span>
                    </button>
                  ))}
                </div>
              </div>

              <aside className="equipment-inventory">
                <div className="bag-category-tabs compact-tabs">
                  {equipmentViews.map((view) => (
                    <button
                      key={view}
                      type="button"
                      className={equipmentView === view ? "active" : ""}
                      onClick={() => {
                        playSceneClick();
                        setEquipmentView(view);
                      }}
                    >
                      {view}
                    </button>
                  ))}
                </div>
                <div className="inventory-grid compact-inventory">
                  {equipmentCandidates.map((item) => (
                    <button
                      key={`${equipmentView}-${item.id}`}
                      type="button"
                      className="inventory-cell"
                      onClick={() => {
                        playSceneClick();
                        setBagNotice(`${item.name}已放入${equipmentView}候选栏；正式替换待接装备系统。`);
                      }}
                    >
                      {item.icon ? <img src={item.icon} alt="" aria-hidden="true" /> : <b>{item.name.slice(0, 1)}</b>}
                      <span>{item.name}</span>
                      <strong>{item.value}</strong>
                    </button>
                  ))}
                </div>
                <p className="empty-note">{bagNotice}</p>
              </aside>
            </div>
          </section>
          )}

          {profileTab === "功法" && (
          <section className="profile-section loadout-section">
            <div className="profile-section-title">
              <h3>功法栏</h3>
              <span>{lockLoadout ? "战斗/事件中锁定" : "点击切换主修"}</span>
            </div>
            <div className="loadout-panel-layout">
              <div className="loadout-body-board">
                <img src={assetPath("assets/tapflow/loadout/wanhua-diagram.webp")} alt="" aria-hidden="true" />
                <div className="equipped-loadout-card">
                  <span>已装备主修</span>
                  <strong>{combatProfile.method.name}</strong>
                  <small>
                    {combatProfile.method.element} · {combatProfile.method.rank} · {combatProfile.method.attackName}
                  </small>
                </div>
              </div>

              <aside className="loadout-side-list">
                <div className="method-grid compact-method-grid">
                  {methodIds.map((id) => {
                    const method = methodCatalog[id];
                    const active = loadout.methodId === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        className={`loadout-card method-card ${active ? "active" : ""}`}
                        aria-pressed={active}
                        disabled={equipBusy || lockLoadout}
                        onClick={() => {
                          playSceneClick();
                          onAction(`equip_method:${id}`);
                        }}
                      >
                        {method.icon ? (
                          <img src={method.icon} alt="" aria-hidden="true" />
                        ) : (
                          <i style={{ background: method.color }}>{method.element}</i>
                        )}
                        <strong>{method.name}</strong>
                        <span>
                          {method.element} · {method.rank} · {method.role}
                        </span>
                        <small>{method.attackName} · 伤害{method.attackDamage} · 攻速{method.attackInterval}s</small>
                      </button>
                    );
                  })}
                </div>
              </aside>
            </div>
          </section>
          )}

          {profileTab === "术法" && (
          <section className="profile-section loadout-section spell-builder">
            <div className="profile-section-title">
              <h3>术法栏</h3>
              <span>炼气期丹海 · 1 个黄阶法术位</span>
            </div>

            <div className="loadout-panel-layout spell-loadout-layout">
              <div className="loadout-body-board spell-body-board">
                <img src={assetPath("assets/tapflow/loadout/wanhua-diagram.webp")} alt="" aria-hidden="true" />
                <div className="spell-preview">
                  <div>
                    <span>当前主动技能</span>
                    <strong>{combatProfile.activeSkillName}</strong>
                    <small>
                      伤害 {combatProfile.activeDamage} / BOSS {combatProfile.bossDamage} · 暴击
                      {Math.round(combatProfile.critChance * 100)}% · 灵力 {combatProfile.spell.manaCost} · 冷却
                      {combatProfile.spell.cooldown}s
                    </small>
                  </div>
                  <div>
                    <span>五行匹配</span>
                    <strong>{combatProfile.elementMatch ? "完全匹配" : "伤害70%"}</strong>
                    <small>
                      {combatProfile.method.element}功法 + {combatProfile.spell.element}术法 · 射程 {combatProfile.range}
                    </small>
                  </div>
                </div>
                {lockLoadout && <p className="loadout-lock">当前已进入事件或战斗，功法和术法不能切换。</p>}
              </div>

              <aside className="spell-side-list">
                <div className="slot-group">
                  <h4>术法槽</h4>
                  <div className="slot-options">
                    {spellIds.map((id) => {
                      const spell = spellCatalog[id];
                      const active = loadout.spellSlot.spellId === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          className={`slot-option element-${spell.element} ${active ? "active" : ""}`}
                          aria-pressed={active}
                          disabled={equipBusy || lockLoadout}
                          onClick={() => {
                            playSceneClick();
                            onAction(`equip_spell:${id}`);
                          }}
                        >
                          <strong>{spell.name}</strong>
                          <span>
                            {spell.element} · 伤害{spell.baseDamage} · 灵力{spell.manaCost}
                          </span>
                          <small>{spell.effect}</small>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="slot-group">
                  <h4>技法槽</h4>
                  <div className="slot-options">
                    {techniqueIds.map((id) => {
                      const technique = techniqueCatalog[id];
                      const active = loadout.spellSlot.techniqueId === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          className={`slot-option ${active ? "active" : ""}`}
                          aria-pressed={active}
                          disabled={equipBusy || lockLoadout}
                          onClick={() => {
                            playSceneClick();
                            onAction(`equip_technique:${id}`);
                          }}
                        >
                          <strong>{technique.name}</strong>
                          <span>
                            {technique.projectileType} · ×{technique.damageMultiplier}
                          </span>
                          <small>{technique.description}</small>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {[0, 1].map((slotIndex) => (
                  <div key={slotIndex} className="slot-group">
                    <h4>秘法槽 {slotIndex + 1}</h4>
                    <div className="slot-options secret-options">
                      {secretIds.map((id) => {
                        const secret = secretCatalog[id];
                        const active = loadout.spellSlot.secretIds[slotIndex] === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            className={`slot-option ${active ? "active" : ""}`}
                            aria-pressed={active}
                            disabled={equipBusy || lockLoadout}
                            onClick={() => {
                              playSceneClick();
                              onAction(`equip_secret_${slotIndex + 1}:${id}` as DemoAction);
                            }}
                          >
                            <strong>{secret.name}</strong>
                            <span>
                              {secret.effectType} {secret.effectValue}
                            </span>
                            <small>{secret.description}</small>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </aside>
            </div>
          </section>
          )}
          </div>

          <nav className="profile-tabs" aria-label="我的栏目">
            {profileTabItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={profileTab === item.id ? "active" : ""}
                aria-pressed={profileTab === item.id}
                onClick={() => {
                  playSceneClick();
                  setProfileTab(item.id);
                }}
              >
                <strong>{item.id}</strong>
                <span>{item.note}</span>
              </button>
            ))}
          </nav>
        </div>
      );
    }

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
      <section className={panel === "我的" ? "utility-panel profile-utility" : "utility-panel"}>
        <header>
          <h2>{panel}</h2>
          <button onClick={onClose}>关闭</button>
        </header>
        <div className={panel === "我的" ? "panel-body profile-body" : "panel-body"}>{renderPanelBody()}</div>
        {panel === "设置" && (
          <footer>
            <button onClick={onToggleMusic}>背景音乐：{musicEnabled ? "开启" : "关闭"}</button>
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
          <div className="qingmu-figure figure-yang">
            <img src={assetPath("assets/tapflow/portraits/yangqi.webp")} alt="" aria-hidden="true" />
            <span>羊七</span>
          </div>
          <div className="qingmu-figure figure-dou">
            <img src={assetPath("assets/tapflow/portraits/douran.webp")} alt="" aria-hidden="true" />
            <span>豆髯</span>
          </div>
        </>
      )}
      {stage === "bridge_confrontation" && (
        <>
          <div className="jinling-figure figure-chuchu">
            <img src={assetPath("assets/tapflow/portraits/chuchu.webp")} alt="" aria-hidden="true" />
            <span>雏雏</span>
          </div>
          <div className="jinling-figure figure-xiaolu">
            <img src={assetPath("assets/tapflow/portraits/xiaolu.webp")} alt="" aria-hidden="true" />
            <span>小鹿</span>
          </div>
          <div className="beggar-form">乞</div>
        </>
      )}
      {stage === "wish_eater_reveal" && (
        <>
          <div className="wish-eater-shadow">
            <img src={assetPath("assets/tapflow/events/wish-eater-reveal.webp")} alt="" aria-hidden="true" />
          </div>
          <div className="wish-fire fire-a" />
          <div className="wish-fire fire-b" />
        </>
      )}
      {isBattleStage && (
        <>
          <div className="battle-arena-line line-back" />
          <div className="battle-arena-line line-front" />
          <div className="player-combatant player-a">
            <img src={assetPath("assets/tapflow/portraits/player-combat.webp")} alt="" aria-hidden="true" />
            <span>主角</span>
          </div>
          <div className="player-combatant player-b">
            <img src={assetPath("assets/tapflow/portraits/xiaozhang-serious.webp")} alt="" aria-hidden="true" />
            <span>小张</span>
          </div>
          {stage === "mouse_boss_final" && (
            <div className="ally-combatant ally-a">
              <img src={assetPath("assets/tapflow/portraits/yangqi.webp")} alt="" aria-hidden="true" />
              <span>羊七</span>
            </div>
          )}
          {stage === "mouse_boss_final" && (
            <div className="ally-combatant ally-b">
              <img src={assetPath("assets/tapflow/portraits/douran.webp")} alt="" aria-hidden="true" />
              <span>豆髯</span>
            </div>
          )}
          {stage === "wish_eater_boss" && (
            <div className="ally-combatant ally-a">
              <img src={assetPath("assets/tapflow/portraits/chuchu.webp")} alt="" aria-hidden="true" />
              <span>雏雏</span>
            </div>
          )}
          {stage === "wish_eater_boss" && (
            <div className="ally-combatant ally-b">
              <img src={assetPath("assets/tapflow/portraits/xiaolu.webp")} alt="" aria-hidden="true" />
              <span>小鹿</span>
            </div>
          )}
          {isBossStage ? (
            <div className={`event-boss ${stage.startsWith("wish") ? "boss-wish" : "boss-rat"}`}>
              <img
                src={
                  stage.startsWith("wish")
                    ? assetPath("assets/tapflow/monsters/wish-eater.webp")
                    : assetPath("assets/tapflow/monsters/mouse-king.webp")
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
                  <img src={assetPath("assets/tapflow/monsters/mouse-minion.webp")} alt="" aria-hidden="true" />
                )}
              </div>
              <div className="event-mob mob-b">
                {stage.startsWith("bridge") ? (
                  "影"
                ) : (
                  <img src={assetPath("assets/tapflow/monsters/mouse-minion.webp")} alt="" aria-hidden="true" />
                )}
              </div>
              <div className="event-mob mob-c">
                {stage.startsWith("bridge") ? (
                  "怨"
                ) : (
                  <img src={assetPath("assets/tapflow/monsters/mouse-minion.webp")} alt="" aria-hidden="true" />
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

type CombatConfig = {
  id: string;
  title: string;
  objective: string;
  targetKills: number;
  surviveSeconds: number;
  boss: boolean;
  bossName: string;
  bossHp: number;
  enemyHp: number;
  enemySpeed: number;
  spawnEvery: number;
  maxEnemies: number;
  rewardBase: number;
  theme: "mouse" | "wish";
};

type CombatView = {
  status: "ready" | "running" | "won" | "lost";
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  kills: number;
  seconds: number;
  skillCooldown: number;
  skillMaxCooldown: number;
  spiritStones: number;
  bossHp: number;
  bossMaxHp: number;
  objectiveProgress: string;
  notice: string;
  result: DemoBattleResult | null;
};

type CombatEnemy = {
  id: number;
  x: number;
  y: number;
  r: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  attackCd: number;
  slowTimer: number;
  burnTimer: number;
  burnDps: number;
  kind: "minion" | "boss";
};

type CombatProjectile = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  damage: number;
  life: number;
  range: number;
  traveled: number;
  pierce: number;
  hitIds: number[];
  color: string;
  spellId?: DemoSpellId;
  critChance?: number;
  armorPierce?: number;
  kind: "auto" | "manual" | "enemy" | "skill";
};

type CombatParticle = {
  id: number;
  x: number;
  y: number;
  r: number;
  life: number;
  maxLife: number;
  color: string;
};

type CombatRuntime = {
  status: CombatView["status"];
  width: number;
  height: number;
  player: {
    x: number;
    y: number;
    r: number;
    hp: number;
    maxHp: number;
    mana: number;
    maxMana: number;
    defense: number;
    hpRegen: number;
    damageTaken: number;
  };
  enemies: CombatEnemy[];
  projectiles: CombatProjectile[];
  particles: CombatParticle[];
  keys: Set<string>;
  pointer: { x: number; y: number; down: boolean };
  elapsed: number;
  kills: number;
  spiritStones: number;
  nextId: number;
  spawnCd: number;
  autoCd: number;
  manualCd: number;
  skillCd: number;
  skillMaxCd: number;
  bossShotCd: number;
  bossSpawned: boolean;
  objectiveMet: boolean;
  notice: string;
  noticeTimer: number;
  result: DemoBattleResult | null;
};

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function distance(leftX: number, leftY: number, rightX: number, rightY: number) {
  return Math.hypot(leftX - rightX, leftY - rightY);
}

function getCombatConfig(node: DemoEventNode): CombatConfig {
  if (node.id === "rat-king") {
    return {
      id: node.id,
      title: node.title,
      objective: "撑到青木门救援",
      targetKills: 0,
      surviveSeconds: 26,
      boss: true,
      bossName: "山鼠王",
      bossHp: 680,
      enemyHp: 26,
      enemySpeed: 92,
      spawnEvery: 1.35,
      maxEnemies: 16,
      rewardBase: 18,
      theme: "mouse",
    };
  }

  if (node.id === "final-rat-king") {
    return {
      id: node.id,
      title: node.title,
      objective: "合力击破山鼠王",
      targetKills: 0,
      surviveSeconds: 0,
      boss: true,
      bossName: "山鼠王",
      bossHp: 560,
      enemyHp: 24,
      enemySpeed: 98,
      spawnEvery: 1.45,
      maxEnemies: 14,
      rewardBase: 36,
      theme: "mouse",
    };
  }

  if (node.id === "boss") {
    return {
      id: node.id,
      title: node.title,
      objective: "击破啖愿妖真身",
      targetKills: 0,
      surviveSeconds: 0,
      boss: true,
      bossName: "啖愿妖",
      bossHp: 620,
      enemyHp: 28,
      enemySpeed: 108,
      spawnEvery: 1.55,
      maxEnemies: 14,
      rewardBase: 40,
      theme: "wish",
    };
  }

  return {
    id: node.id,
    title: node.title,
    objective: node.id === "minions" ? "清除邪祟爪牙" : "清掉山鼠仔",
    targetKills: node.id === "minions" ? 22 : 24,
    surviveSeconds: 0,
    boss: false,
    bossName: "",
    bossHp: 0,
    enemyHp: node.id === "minions" ? 28 : 22,
    enemySpeed: node.id === "minions" ? 112 : 104,
    spawnEvery: 0.7,
    maxEnemies: node.id === "minions" ? 20 : 22,
    rewardBase: node.id === "minions" ? 28 : 24,
    theme: node.id === "minions" ? "wish" : "mouse",
  };
}

function createCombatRuntime(config: CombatConfig, width: number, height: number, profile: CombatProfile): CombatRuntime {
  const maxHp = 100 + profile.method.defense * 4 + profile.method.shield;
  return {
    status: "ready",
    width,
    height,
    player: {
      x: width * 0.44,
      y: height * 0.58,
      r: 18,
      hp: maxHp,
      maxHp,
      mana: 60,
      maxMana: 60,
      defense: profile.method.defense,
      hpRegen: profile.method.regen,
      damageTaken: 0,
    },
    enemies: [],
    projectiles: [],
    particles: [],
    keys: new Set(),
    pointer: { x: width * 0.65, y: height * 0.5, down: false },
    elapsed: 0,
    kills: 0,
    spiritStones: 0,
    nextId: 1,
    spawnCd: 0,
    autoCd: Math.min(0.4, profile.method.attackInterval * 0.45),
    manualCd: 0,
    skillCd: 0,
    skillMaxCd: profile.spell.cooldown,
    bossShotCd: 1.2,
    bossSpawned: false,
    objectiveMet: false,
    notice: "",
    noticeTimer: 0,
    result: null,
  };
}

function makeCombatView(runtime: CombatRuntime, config: CombatConfig): CombatView {
  const boss = runtime.enemies.find((enemy) => enemy.kind === "boss");
  const bossHp = boss?.hp ?? (config.boss && runtime.status !== "won" ? config.bossHp : 0);
  const aliveEnemies = runtime.enemies.length;
  const objectiveProgress = runtime.objectiveMet
    ? `目标达成 · 清场剩余${aliveEnemies}`
    : config.surviveSeconds
      ? `${Math.min(config.surviveSeconds, Math.floor(runtime.elapsed))}/${config.surviveSeconds}秒`
      : config.boss
        ? `${Math.max(0, Math.ceil(bossHp))}/${config.bossHp}`
        : `${runtime.kills}/${config.targetKills}`;

  return {
    status: runtime.status,
    hp: Math.max(0, Math.round(runtime.player.hp)),
    maxHp: runtime.player.maxHp,
    mana: Math.max(0, Math.round(runtime.player.mana)),
    maxMana: runtime.player.maxMana,
    kills: runtime.kills,
    seconds: Math.floor(runtime.elapsed),
    skillCooldown: Math.max(0, runtime.skillCd),
    skillMaxCooldown: runtime.skillMaxCd,
    spiritStones: runtime.spiritStones,
    bossHp: Math.max(0, Math.round(bossHp)),
    bossMaxHp: config.bossHp,
    objectiveProgress,
    notice: runtime.noticeTimer > 0 ? runtime.notice : "",
    result: runtime.result,
  };
}

function spawnCombatEnemy(runtime: CombatRuntime, config: CombatConfig, kind: "minion" | "boss") {
  const side = Math.floor(Math.random() * 4);
  const margin = kind === "boss" ? 74 : 42;
  const x = side === 0 ? margin : side === 1 ? runtime.width - margin : Math.random() * runtime.width;
  const y = side === 2 ? margin : side === 3 ? runtime.height - margin : Math.random() * runtime.height;
  const hp = kind === "boss" ? config.bossHp : config.enemyHp + Math.min(18, runtime.elapsed * 0.5);

  runtime.enemies.push({
    id: runtime.nextId++,
    x,
    y,
    r: kind === "boss" ? 46 : 18,
    hp,
    maxHp: hp,
    speed: kind === "boss" ? 58 : config.enemySpeed + Math.min(22, runtime.elapsed * 0.4),
    damage: kind === "boss" ? 18 : 8,
    attackCd: 0,
    slowTimer: 0,
    burnTimer: 0,
    burnDps: 0,
    kind,
  });
}

function pushCombatProjectile(
  runtime: CombatRuntime,
  x: number,
  y: number,
  vx: number,
  vy: number,
  kind: CombatProjectile["kind"],
  damageValue: number,
  radius: number,
  life: number,
  options: Partial<Pick<CombatProjectile, "range" | "pierce" | "color" | "spellId" | "critChance" | "armorPierce">> = {},
) {
  runtime.projectiles.push({
    id: runtime.nextId++,
    x,
    y,
    vx,
    vy,
    r: radius,
    damage: damageValue,
    life,
    range: options.range ?? 1200,
    traveled: 0,
    pierce: options.pierce ?? 0,
    hitIds: [],
    color: options.color ?? "rgba(255, 226, 125, 0.94)",
    spellId: options.spellId,
    critChance: options.critChance,
    armorPierce: options.armorPierce,
    kind,
  });
}

function pushCombatParticle(runtime: CombatRuntime, x: number, y: number, r: number, color: string, life = 0.45) {
  runtime.particles.push({
    id: runtime.nextId++,
    x,
    y,
    r,
    life,
    maxLife: life,
    color,
  });
}

function nearestEnemy(runtime: CombatRuntime) {
  let target: CombatEnemy | null = null;
  let best = Number.POSITIVE_INFINITY;
  for (const enemy of runtime.enemies) {
    const score = distance(runtime.player.x, runtime.player.y, enemy.x, enemy.y);
    if (score < best) {
      best = score;
      target = enemy;
    }
  }
  return target;
}

function firePlayerShot(
  runtime: CombatRuntime,
  targetX: number,
  targetY: number,
  kind: CombatProjectile["kind"],
  profile: CombatProfile,
) {
  const dx = targetX - runtime.player.x;
  const dy = targetY - runtime.player.y;
  const length = Math.hypot(dx, dy) || 1;
  const speed = profile.method.projectileSpeed * (kind === "manual" ? 1.9 : 1.55);
  const isFireMethod = profile.loadout.methodId === "yanxin_jue";
  const isGoldMethod = profile.loadout.methodId === "jinmang_jue";
  const damageValue =
    kind === "manual"
      ? Math.max(6, Math.round(profile.method.attackDamage * 0.72))
      : profile.method.attackDamage;
  pushCombatProjectile(
    runtime,
    runtime.player.x,
    runtime.player.y,
    (dx / length) * speed,
    (dy / length) * speed,
    kind,
    damageValue,
    isFireMethod ? 8 : isGoldMethod ? 6 : 7,
    1.4,
    {
      color: isFireMethod ? "rgba(255, 119, 55, 0.96)" : isGoldMethod ? "rgba(245, 213, 102, 0.96)" : "rgba(220, 238, 255, 0.94)",
      pierce: isGoldMethod && kind !== "manual" ? 1 : 0,
      range: kind === "manual" ? 680 : 740,
    },
  );
}

function applyPlayerDamage(runtime: CombatRuntime, amount: number) {
  const finalDamage = Math.max(1, Math.round(amount - runtime.player.defense * 0.45));
  runtime.player.hp -= finalDamage;
  runtime.player.damageTaken += finalDamage;
}

function rollSkillDamage(baseDamage: number, critChance = 0) {
  return Math.random() < critChance ? Math.round(baseDamage * 1.5) : baseDamage;
}

function applyEnemySkillHit(
  runtime: CombatRuntime,
  enemy: CombatEnemy,
  damageValue: number,
  spellId: DemoSpellId | undefined,
  critChance = 0,
  armorPierce = 0,
) {
  const reduction = enemy.kind === "boss" ? Math.max(0, 0.15 - armorPierce) : 0;
  const finalDamage = Math.max(1, Math.round(rollSkillDamage(damageValue, critChance) * (1 - reduction)));
  enemy.hp -= finalDamage;

  if (spellId === "shuiren") {
    enemy.slowTimer = Math.max(enemy.slowTimer, 2);
  }

  if (spellId === "huodan") {
    enemy.burnTimer = Math.max(enemy.burnTimer, 1.8);
    enemy.burnDps = Math.max(enemy.burnDps, 8);
  }

  pushCombatParticle(
    runtime,
    enemy.x,
    enemy.y,
    enemy.r + 16,
    spellId === "huodan"
      ? "rgba(255, 119, 55, 0.62)"
      : spellId === "shuiren"
        ? "rgba(128, 216, 255, 0.56)"
        : "rgba(255, 231, 143, 0.52)",
    0.3,
  );
}

function setCombatNotice(runtime: CombatRuntime, notice: string) {
  runtime.notice = notice;
  runtime.noticeTimer = 1.35;
}

function castActiveSkill(runtime: CombatRuntime, profile: CombatProfile) {
  if (runtime.player.mana < profile.spell.manaCost) {
    setCombatNotice(runtime, "灵力不足");
    return;
  }

  runtime.player.mana -= profile.spell.manaCost;
  runtime.skillCd = profile.spell.cooldown;
  runtime.skillMaxCd = profile.spell.cooldown;

  if (profile.loadout.spellSlot.techniqueId === "ring") {
    const radius = profile.range;
    pushCombatParticle(runtime, runtime.player.x, runtime.player.y, radius, `${profile.spell.color}88`, 0.42);
    for (const enemy of runtime.enemies) {
      const hitDistance = distance(runtime.player.x, runtime.player.y, enemy.x, enemy.y);
      if (hitDistance <= radius + enemy.r) {
        const edgeFactor = hitDistance > radius * 0.65 ? 0.6 : 1;
        applyEnemySkillHit(
          runtime,
          enemy,
          Math.max(1, Math.round(profile.activeDamage * edgeFactor)),
          profile.loadout.spellSlot.spellId,
          profile.critChance,
          profile.armorPierce,
        );
      }
    }
    return;
  }

  const target = nearestEnemy(runtime);
  const targetX = target?.x ?? runtime.pointer.x;
  const targetY = target?.y ?? runtime.pointer.y;

  if (profile.loadout.spellSlot.techniqueId === "drop") {
    pushCombatParticle(runtime, targetX, targetY, 112, `${profile.spell.color}aa`, 0.42);
    for (const enemy of runtime.enemies) {
      if (distance(targetX, targetY, enemy.x, enemy.y) <= 112 + enemy.r) {
        applyEnemySkillHit(
          runtime,
          enemy,
          profile.activeDamage,
          profile.loadout.spellSlot.spellId,
          profile.critChance,
          profile.armorPierce,
        );
      }
    }
    return;
  }

  const dx = targetX - runtime.player.x;
  const dy = targetY - runtime.player.y;
  const length = Math.hypot(dx, dy) || 1;
  const speed = 680;
  pushCombatProjectile(
    runtime,
    runtime.player.x,
    runtime.player.y,
    (dx / length) * speed,
    (dy / length) * speed,
    "skill",
    profile.activeDamage,
    profile.loadout.spellSlot.spellId === "huodan" ? 10 : 7,
    1.6,
    {
      range: profile.range,
      pierce: profile.loadout.spellSlot.spellId === "jinmang" ? 1 : 0,
      color: `${profile.spell.color}ee`,
      spellId: profile.loadout.spellSlot.spellId,
      critChance: profile.critChance,
      armorPierce: profile.armorPierce,
    },
  );
}

function useCombatImages(config: CombatConfig) {
  const imagesRef = useRef<Record<string, HTMLImageElement>>({});

  useEffect(() => {
    const sources = {
      player: assetPath("assets/tapflow/portraits/player-combat.webp"),
      minion:
        config.theme === "mouse"
          ? assetPath("assets/tapflow/monsters/mouse-minion.webp")
          : assetPath("assets/tapflow/monsters/wish-eater.webp"),
      boss:
        config.theme === "mouse"
          ? assetPath("assets/tapflow/monsters/mouse-king.webp")
          : assetPath("assets/tapflow/monsters/wish-eater.webp"),
    };

    for (const [key, src] of Object.entries(sources)) {
      const image = new Image();
      image.src = src;
      imagesRef.current[key] = image;
    }
  }, [config.theme]);

  return imagesRef;
}

function BulletHellCombat({
  node,
  loadout,
  busyAction,
  onComplete,
}: {
  node: DemoEventNode;
  loadout: DemoLoadout;
  busyAction: DemoAction | "reset" | null;
  onComplete: (result: DemoBattleResult) => void;
}) {
  const config = useMemo(() => getCombatConfig(node), [node]);
  const profile = useMemo(
    () => getCombatProfile(loadout),
    [
      loadout.methodId,
      loadout.spellSlot.spellId,
      loadout.spellSlot.techniqueId,
      loadout.spellSlot.secretIds[0],
      loadout.spellSlot.secretIds[1],
    ],
  );
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runtimeRef = useRef<CombatRuntime | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const lastViewSyncRef = useRef(0);
  const imagesRef = useCombatImages(config);
  const [view, setView] = useState<CombatView>(() => {
    const runtime = createCombatRuntime(config, 960, 540, profile);
    return makeCombatView(runtime, config);
  });

  function resetRuntime(started: boolean) {
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    const width = Math.max(640, Math.round(rect?.width ?? 960));
    const height = Math.max(360, Math.round(rect?.height ?? 540));
    const runtime = createCombatRuntime(config, width, height, profile);
    runtime.status = started ? "running" : "ready";
    if (config.boss) spawnCombatEnemy(runtime, config, "boss");
    runtimeRef.current = runtime;
    setView(makeCombatView(runtime, config));
  }

  function finishCombat(runtime: CombatRuntime, victory: boolean) {
    runtime.status = victory ? "won" : "lost";
    const hpPercent = Math.round((runtime.player.hp / runtime.player.maxHp) * 100);
    runtime.result = {
      stageId: config.id,
      victory,
      kills: runtime.kills,
      seconds: Math.max(1, Math.floor(runtime.elapsed)),
      hpPercent: clampNumber(hpPercent, 0, 100),
      spiritStones: victory ? runtime.spiritStones + config.rewardBase : Math.floor(runtime.spiritStones * 0.35),
      damageTaken: Math.round(runtime.player.damageTaken),
      bossDefeated: config.boss && !runtime.enemies.some((enemy) => enemy.kind === "boss"),
    };
    setView(makeCombatView(runtime, config));
  }

  useEffect(() => {
    resetRuntime(false);
  }, [config.id, profile.activeSkillName]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const runtime = runtimeRef.current;
      if (!runtime) return;
      const key = event.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowleft", "arrowdown", "arrowright", " "].includes(key)) {
        event.preventDefault();
      }
      runtime.keys.add(key);
      if (key === " " && runtime.status === "running" && runtime.skillCd <= 0) {
        castActiveSkill(runtime, profile);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      runtimeRef.current?.keys.delete(event.key.toLowerCase());
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [config.id, profile]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const setPointer = (event: PointerEvent, down?: boolean) => {
      const runtime = runtimeRef.current;
      if (!runtime) return;
      const rect = canvas.getBoundingClientRect();
      runtime.pointer.x = event.clientX - rect.left;
      runtime.pointer.y = event.clientY - rect.top;
      if (typeof down === "boolean") runtime.pointer.down = down;
    };

    const handlePointerDown = (event: PointerEvent) => {
      canvas.setPointerCapture(event.pointerId);
      setPointer(event, true);
    };
    const handlePointerMove = (event: PointerEvent) => setPointer(event);
    const handlePointerUp = (event: PointerEvent) => setPointer(event, false);

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointercancel", handlePointerUp);
    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [config.id]);

  useEffect(() => {
    function update(runtime: CombatRuntime, dt: number) {
      if (runtime.status !== "running") return;

      runtime.elapsed += dt;
      runtime.spawnCd -= dt;
      runtime.autoCd -= dt;
      runtime.manualCd -= dt;
      runtime.skillCd = Math.max(0, runtime.skillCd - dt);
      runtime.bossShotCd -= dt;
      runtime.noticeTimer = Math.max(0, runtime.noticeTimer - dt);
      runtime.player.mana = Math.min(runtime.player.maxMana, runtime.player.mana + 3 * dt);
      if (runtime.player.hpRegen > 0) {
        runtime.player.hp = Math.min(runtime.player.maxHp, runtime.player.hp + runtime.player.hpRegen * dt);
      }

      const left = runtime.keys.has("a") || runtime.keys.has("arrowleft") ? -1 : 0;
      const right = runtime.keys.has("d") || runtime.keys.has("arrowright") ? 1 : 0;
      const up = runtime.keys.has("w") || runtime.keys.has("arrowup") ? -1 : 0;
      const down = runtime.keys.has("s") || runtime.keys.has("arrowdown") ? 1 : 0;
      const moveX = left + right;
      const moveY = up + down;
      const moveLength = Math.hypot(moveX, moveY) || 1;
      const speed = 245;
      runtime.player.x = clampNumber(runtime.player.x + (moveX / moveLength) * speed * dt, 24, runtime.width - 24);
      runtime.player.y = clampNumber(runtime.player.y + (moveY / moveLength) * speed * dt, 24, runtime.height - 24);

      const bossAlive = runtime.enemies.some((enemy) => enemy.kind === "boss");
      const shouldSpawnMinions = !runtime.objectiveMet && (!config.boss || bossAlive);
      if (shouldSpawnMinions && runtime.enemies.length < config.maxEnemies && runtime.spawnCd <= 0) {
        spawnCombatEnemy(runtime, config, "minion");
        runtime.spawnCd = Math.max(0.38, config.spawnEvery - runtime.elapsed * 0.01);
      }

      const target = nearestEnemy(runtime);
      if (target && runtime.autoCd <= 0) {
        firePlayerShot(runtime, target.x, target.y, "auto", profile);
        runtime.autoCd = Math.max(0.34, profile.method.attackInterval * 0.55);
      }

      if (runtime.pointer.down && runtime.manualCd <= 0) {
        firePlayerShot(runtime, runtime.pointer.x, runtime.pointer.y, "manual", profile);
        runtime.manualCd = 0.16;
      }

      const boss = runtime.enemies.find((enemy) => enemy.kind === "boss");
      if (boss && runtime.bossShotCd <= 0) {
        const angle = Math.atan2(runtime.player.y - boss.y, runtime.player.x - boss.x);
        for (const offset of [-0.28, 0, 0.28]) {
          const speedValue = config.id === "rat-king" ? 240 : 275;
          pushCombatProjectile(
            runtime,
            boss.x,
            boss.y,
            Math.cos(angle + offset) * speedValue,
            Math.sin(angle + offset) * speedValue,
            "enemy",
            12,
            7,
            4,
          );
        }
        runtime.bossShotCd = config.id === "rat-king" ? 1.05 : 1.22;
      }

      for (const enemy of runtime.enemies) {
        enemy.attackCd = Math.max(0, enemy.attackCd - dt);
        enemy.slowTimer = Math.max(0, enemy.slowTimer - dt);
        if (enemy.burnTimer > 0) {
          const burnTick = enemy.burnDps * dt;
          enemy.hp -= burnTick;
          enemy.burnTimer = Math.max(0, enemy.burnTimer - dt);
        }
        const dx = runtime.player.x - enemy.x;
        const dy = runtime.player.y - enemy.y;
        const length = Math.hypot(dx, dy) || 1;
        const slowFactor = enemy.slowTimer > 0 ? 0.7 : 1;
        enemy.x += (dx / length) * enemy.speed * slowFactor * dt;
        enemy.y += (dy / length) * enemy.speed * slowFactor * dt;
        if (length <= enemy.r + runtime.player.r && enemy.attackCd <= 0) {
          applyPlayerDamage(runtime, enemy.damage);
          enemy.attackCd = enemy.kind === "boss" ? 0.8 : 0.55;
          pushCombatParticle(runtime, runtime.player.x, runtime.player.y, 34, "rgba(255, 88, 80, 0.55)", 0.25);
        }
      }

      for (const projectile of runtime.projectiles) {
        const stepX = projectile.vx * dt;
        const stepY = projectile.vy * dt;
        projectile.x += stepX;
        projectile.y += stepY;
        projectile.traveled += Math.hypot(stepX, stepY);
        projectile.life -= dt;
      }

      for (const projectile of runtime.projectiles) {
        if (projectile.kind === "enemy") {
          if (distance(projectile.x, projectile.y, runtime.player.x, runtime.player.y) <= projectile.r + runtime.player.r) {
            applyPlayerDamage(runtime, projectile.damage);
            projectile.life = 0;
            pushCombatParticle(runtime, runtime.player.x, runtime.player.y, 30, "rgba(255, 88, 80, 0.5)", 0.25);
          }
          continue;
        }

        for (const enemy of runtime.enemies) {
          if (
            !projectile.hitIds.includes(enemy.id) &&
            distance(projectile.x, projectile.y, enemy.x, enemy.y) <= projectile.r + enemy.r
          ) {
            applyEnemySkillHit(
              runtime,
              enemy,
              projectile.damage,
              projectile.spellId,
              projectile.critChance,
              projectile.armorPierce,
            );
            projectile.hitIds.push(enemy.id);
            if (projectile.pierce > 0) {
              projectile.pierce -= 1;
              continue;
            }
            projectile.life = 0;
            break;
          }
        }
      }

      const defeated = runtime.enemies.filter((enemy) => enemy.hp <= 0);
      if (defeated.length) {
        runtime.enemies = runtime.enemies.filter((enemy) => enemy.hp > 0);
        for (const enemy of defeated) {
          runtime.kills += enemy.kind === "boss" ? 1 : 1;
          runtime.spiritStones += enemy.kind === "boss" ? 18 : 2;
          pushCombatParticle(runtime, enemy.x, enemy.y, enemy.r + 24, "rgba(132, 230, 190, 0.62)", 0.42);
        }
      }

      runtime.projectiles = runtime.projectiles.filter(
        (projectile) =>
          projectile.life > 0 &&
          projectile.traveled <= projectile.range &&
          projectile.x > -60 &&
          projectile.y > -60 &&
          projectile.x < runtime.width + 60 &&
          projectile.y < runtime.height + 60,
      );

      for (const particle of runtime.particles) {
        particle.life -= dt;
      }
      runtime.particles = runtime.particles.filter((particle) => particle.life > 0);

      if (runtime.player.hp <= 0) {
        finishCombat(runtime, false);
        return;
      }

      if (config.surviveSeconds > 0 && runtime.elapsed >= config.surviveSeconds) {
        runtime.player.hp = Math.max(runtime.player.hp, runtime.player.maxHp * 0.18);
        runtime.objectiveMet = true;
      }

      if (config.boss && !runtime.enemies.some((enemy) => enemy.kind === "boss")) {
        runtime.objectiveMet = true;
      }

      if (!config.boss && runtime.kills >= config.targetKills) {
        runtime.objectiveMet = true;
      }

      if (runtime.objectiveMet && runtime.enemies.length === 0) {
        finishCombat(runtime, true);
      }
    }

    function draw(ctx: CanvasRenderingContext2D, runtime: CombatRuntime) {
      ctx.clearRect(0, 0, runtime.width, runtime.height);
      ctx.save();
      ctx.globalAlpha = 0.68;
      ctx.fillStyle = config.theme === "mouse" ? "rgba(33, 27, 22, 0.46)" : "rgba(38, 25, 42, 0.42)";
      ctx.fillRect(0, 0, runtime.width, runtime.height);
      ctx.strokeStyle = "rgba(255, 236, 182, 0.08)";
      ctx.lineWidth = 1;
      for (let x = 0; x < runtime.width; x += 72) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + runtime.height * 0.34, runtime.height);
        ctx.stroke();
      }
      ctx.restore();

      for (const projectile of runtime.projectiles) {
        ctx.beginPath();
        ctx.fillStyle = projectile.kind === "enemy" ? "rgba(255, 86, 83, 0.9)" : projectile.color;
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = projectile.kind === "enemy" ? 10 : projectile.kind === "skill" ? 18 : 14;
        ctx.arc(projectile.x, projectile.y, projectile.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      const images = imagesRef.current;
      for (const enemy of runtime.enemies) {
        const image = enemy.kind === "boss" ? images.boss : images.minion;
        if (image?.complete && image.naturalWidth > 0) {
          ctx.drawImage(image, enemy.x - enemy.r * 1.35, enemy.y - enemy.r * 1.35, enemy.r * 2.7, enemy.r * 2.7);
        } else {
          ctx.beginPath();
          ctx.fillStyle = enemy.kind === "boss" ? "#5a2f25" : "#6b5a44";
          ctx.arc(enemy.x, enemy.y, enemy.r, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = "rgba(0, 0, 0, 0.68)";
        ctx.fillRect(enemy.x - enemy.r, enemy.y - enemy.r - 14, enemy.r * 2, 5);
        ctx.fillStyle = enemy.kind === "boss" ? "#ff6f5f" : "#d9f28a";
        ctx.fillRect(enemy.x - enemy.r, enemy.y - enemy.r - 14, enemy.r * 2 * Math.max(0, enemy.hp / enemy.maxHp), 5);
      }

      const playerImage = images.player;
      if (playerImage?.complete && playerImage.naturalWidth > 0) {
        ctx.drawImage(
          playerImage,
          runtime.player.x - runtime.player.r * 1.85,
          runtime.player.y - runtime.player.r * 2.25,
          runtime.player.r * 3.7,
          runtime.player.r * 4.1,
        );
      } else {
        ctx.beginPath();
        ctx.fillStyle = "#dbeeff";
        ctx.arc(runtime.player.x, runtime.player.y, runtime.player.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.strokeStyle = "rgba(129, 227, 255, 0.72)";
      ctx.lineWidth = 2;
      ctx.arc(runtime.player.x, runtime.player.y, runtime.player.r + 7, 0, Math.PI * 2);
      ctx.stroke();

      for (const particle of runtime.particles) {
        const alpha = Math.max(0, particle.life / particle.maxLife);
        ctx.beginPath();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = 4;
        ctx.arc(particle.x, particle.y, particle.r * (1.15 - alpha * 0.15), 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    function frame(now: number) {
      const canvas = canvasRef.current;
      const runtime = runtimeRef.current;
      if (!canvas || !runtime) {
        rafRef.current = requestAnimationFrame(frame);
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(640, Math.round(rect.width));
      const height = Math.max(360, Math.round(rect.height));
      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        runtime.width = width;
        runtime.height = height;
      }

      const last = lastFrameRef.current ?? now;
      const dt = Math.min(0.033, (now - last) / 1000);
      lastFrameRef.current = now;
      update(runtime, dt);

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        draw(ctx, runtime);
      }

      if (now - lastViewSyncRef.current > 110 || runtime.status !== view.status) {
        lastViewSyncRef.current = now;
        setView(makeCombatView(runtime, config));
      }

      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastFrameRef.current = null;
    };
  }, [config, imagesRef, profile, view.status]);

  const hpWidth = `${Math.max(0, (view.hp / view.maxHp) * 100)}%`;
  const manaWidth = `${Math.max(0, (view.mana / view.maxMana) * 100)}%`;
  const skillReady = view.skillCooldown <= 0 && view.mana >= profile.spell.manaCost;
  const skillWidth = `${100 - Math.min(100, (view.skillCooldown / view.skillMaxCooldown) * 100)}%`;
  const isSaving = busyAction === "battle_victory";

  return (
    <section className="combat-overlay" aria-label="俯视弹幕战斗Demo">
      <canvas ref={canvasRef} className="combat-canvas" />
      <div className="combat-hud">
        <div className="combat-title">
          <span>战斗 Demo</span>
          <strong>{config.title}</strong>
          <small>
            {config.objective} · {view.objectiveProgress} · {profile.method.name} / {profile.activeSkillName}
          </small>
        </div>
        <div className="combat-bars">
          <div>
            <span>气血 {view.hp}/{view.maxHp}</span>
            <i className="hp-bar"><b style={{ width: hpWidth }} /></i>
          </div>
          <div>
            <span>灵力 {view.mana}/{view.maxMana}</span>
            <i className="mana-bar"><b style={{ width: manaWidth }} /></i>
          </div>
          {config.boss && (
            <div>
              <span>{config.bossName} {view.bossHp}/{view.bossMaxHp}</span>
              <i className="boss-bar"><b style={{ width: `${Math.max(0, (view.bossHp / view.bossMaxHp) * 100)}%` }} /></i>
            </div>
          )}
        </div>
        <div className="combat-readout">
          <span>击杀 {view.kills}</span>
          <span>用时 {view.seconds}s</span>
          <span>灵石 +{view.spiritStones}</span>
          <span>{profile.elementMatch ? "五行匹配" : "五行不匹配"}</span>
        </div>
      </div>
      {view.notice && <div className="combat-notice">{view.notice}</div>}
      <div className="combat-skillbar">
        <span>WASD/方向键移动</span>
        <span>{profile.method.attackName}</span>
        <span>鼠标按住连射</span>
        <span className={skillReady ? "ready" : ""}>
          空格 {profile.activeSkillName} {skillReady ? "可用" : view.skillCooldown > 0 ? `${view.skillCooldown.toFixed(1)}s` : "灵力不足"}
        </span>
        <i><b style={{ width: skillWidth }} /></i>
      </div>
      {view.status !== "running" && (
        <div className="combat-modal">
          {view.status === "ready" && (
            <>
              <h2>{config.title}</h2>
              <p>
                {config.objective}。当前配置：{profile.method.name} + {profile.activeSkillName}。目标达成后仍要清完场上怪物，才会进入下一段剧情。
              </p>
              <button onClick={() => resetRuntime(true)}>开始战斗</button>
            </>
          )}
          {view.status === "lost" && (
            <>
              <h2>战斗失利</h2>
              <p>气血归零，本次不推进剧情。调整走位后重试。</p>
              <button onClick={() => resetRuntime(true)}>重新挑战</button>
            </>
          )}
          {view.status === "won" && view.result && (
            <>
              <h2>战斗胜利</h2>
              <p>
                击杀 {view.result.kills} · 用时 {view.result.seconds}s · 剩余气血 {view.result.hpPercent}% ·
                灵石 +{view.result.spiritStones}
              </p>
              <button disabled={isSaving} onClick={() => onComplete(view.result as DemoBattleResult)}>
                {isSaving ? "写入存档中" : "结算并继续剧情"}
              </button>
            </>
          )}
        </div>
      )}
    </section>
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
  onAction: (action: DemoAction, payload?: DemoActionPayload) => void;
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
        ) : node.mode === "battle" ? (
          <div className="event-primary event-battle-hint">
            在上方战场完成目标后继续剧情
          </div>
        ) : (
          <button
            className="event-primary"
            disabled={busy}
            onClick={() => {
              playSceneClick();
              onAction("advance_event");
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

function ActiveEventOverlay({
  activeEvent,
  busyAction,
  onAction,
}: {
  activeEvent: NonNullable<ReturnType<typeof getActiveEvent>>;
  busyAction: DemoAction | "reset" | null;
  onAction: (action: DemoAction, payload?: DemoActionPayload) => void;
}) {
  const { active, definition, node } = activeEvent;
  const busy = Boolean(busyAction);
  const progress = Math.round(((active.nodeIndex + 1) / definition.nodes.length) * 100);
  const modeText: Record<DemoEventNode["mode"], string> = {
    dialogue: "剧情",
    choice: "抉择",
    battle: "战斗",
    reward: "结算",
  };

  return (
    <>
      <section className="event-brief" aria-label="当前事件">
        <span>{definition.category}</span>
        <strong>{definition.title}</strong>
        <small>
          {getVisualStageTitle(node.visualStage)} · {progress}%
        </small>
      </section>

      <section className="event-story-panel" aria-label="事件剧情">
        <div className="event-story-main">
          <div className="event-story-speaker">
            <strong>{node.speaker}</strong>
            <small>{node.title}</small>
          </div>
          <p>{node.text}</p>
          {active.replay && <small className="event-story-note">本次为复盘，完成后不会重复发放奖励。</small>}
        </div>

        <div className="event-story-actions">
          <div className="event-story-progress">
            <div>
              <span>{modeText[node.mode]}</span>
              <strong>{progress}%</strong>
            </div>
            <i>
              <b style={{ width: `${progress}%` }} />
            </i>
          </div>

          {node.mode === "choice" && node.choices ? (
            <div className="event-story-choices">
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
          ) : node.mode === "battle" ? (
            <div className="event-story-status">进入全屏战斗后完成目标</div>
          ) : (
            <button
              className="event-story-primary"
              disabled={busy}
              onClick={() => {
                playSceneClick();
                onAction("advance_event");
              }}
            >
              {getEventButtonLabel(node, busyAction === "battle_victory" || busyAction === "advance_event")}
            </button>
          )}
        </div>
      </section>
    </>
  );
}

function HomeScene({
  save,
  events,
  online,
  busyAction,
  panel,
  profileInitialTab,
  musicEnabled,
  onAction,
  onReset,
  onOpenPanel,
  onClosePanel,
  onToggleMusic,
  onReplayOpening,
}: {
  save: DemoSave;
  events: Record<DemoEventId, DemoEventDefinition>;
  online: boolean;
  busyAction: DemoAction | "reset" | null;
  panel: Panel | null;
  profileInitialTab: ProfileTab;
  musicEnabled: boolean;
  onAction: (action: DemoAction, payload?: DemoActionPayload) => void;
  onReset: () => void;
  onOpenPanel: (panel: Panel, profileTab?: ProfileTab) => void;
  onClosePanel: () => void;
  onToggleMusic: () => void;
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
  const stageStyle = {
    "--scene-bg": `url("${assetPath(`assets/tapflow/scenes/${scene.replace("_", "-")}.webp`)}")`,
    "--avatar-frame": `url("${assetPath("assets/tapflow/ui/avatar-frame.webp")}")`,
    "--scene-button": `url("${assetPath("assets/tapflow/ui/scene-button.webp")}")`,
    "--dialogue-box": `url("${assetPath("assets/tapflow/ui/dialogue-box.webp")}")`,
    "--nameplate": `url("${assetPath("assets/tapflow/ui/nameplate.webp")}")`,
    "--loadout-window": `url("${assetPath("assets/tapflow/loadout/wanhua-window.webp")}")`,
  } as CSSProperties;

  if (activeEvent?.node.mode === "battle") {
    const battleStyle = {
      ...stageStyle,
      "--visual-bg": getVisualBackground(activeEvent.node.visualStage),
    } as CSSProperties;

    return (
      <main className="game-shell combat-shell">
        <section
          className={`stage scene-${scene} accent-${config.accent} battle-stage event-stage visual-${activeEvent.node.visualStage}`}
          style={battleStyle}
        >
          <div className="stage-bg">
            <EventStageObjects node={activeEvent.node} />
          </div>
          <BulletHellCombat
            node={activeEvent.node}
            loadout={getLoadout(state)}
            busyAction={busyAction}
            onComplete={(battleResult) => onAction("battle_victory", { battleResult })}
          />
        </section>
      </main>
    );
  }

  return (
    <main className={`game-shell ${activeEvent ? "event-shell" : ""}`} style={stageStyle}>
      {!activeEvent && (
        <TopHud
          state={state}
          scene={scene}
          online={online}
          onOpenProfile={() => onOpenPanel("我的", "属性")}
          onOpenPanel={onOpenPanel}
        />
      )}
      <section
        className={`stage scene-${scene} accent-${config.accent} ${
          inBattle ? "battle-stage" : ""
        } ${visualStage ? `event-stage visual-${visualStage}` : ""}`}
        style={visualStage ? ({ "--visual-bg": getVisualBackground(visualStage) } as CSSProperties) : undefined}
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

        {!activeEvent && (
          <SceneActionMenu
            scene={scene}
            busyAction={busyAction}
            onAction={onAction}
            onOpenPanel={onOpenPanel}
          />
        )}

        {activeEvent ? (
          <ActiveEventOverlay activeEvent={activeEvent} busyAction={busyAction} onAction={onAction} />
        ) : (
          <>
            <SceneCharacterDock scene={scene} actorBond={actorBond} busy={busy} onAction={onAction} />
            <section className="dialogue">
              <div className="speaker">
                {dialogueSpeaker}
                <small>{`羁绊 ${actorBond}`}</small>
              </div>
              <p>{dialogueText}</p>
            </section>
          </>
        )}
      </section>

      {!activeEvent && (
        <section className="control-panel layout-info-panel">
          <div className="stat-card">
            <span>万化道躯</span>
            <strong>{state.cultivation.realmProgress}%</strong>
            <div className="progress">
              <i style={{ width: `${state.cultivation.realmProgress}%` }} />
            </div>
          </div>
          <EventConsole state={state} events={events} busyAction={busyAction} onAction={onAction} />
        </section>
      )}

      {!activeEvent && (
        <section className="codex-panel">
          <div>
            <h2>{config.label}</h2>
            <p>{config.subtitle}</p>
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
      )}

      {panel && !activeEvent && (
        <UtilityPanel
          panel={panel}
          state={state}
          events={events}
          busyAction={busyAction}
          initialProfileTab={profileInitialTab}
          musicEnabled={musicEnabled}
          onAction={onAction}
          onClose={onClosePanel}
          onReset={onReset}
          onToggleMusic={onToggleMusic}
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
  const [profileInitialTab, setProfileInitialTab] = useState<ProfileTab>("属性");
  const [showOpening, setShowOpening] = useState(() => !localStorage.getItem("cultivation-opening-seen"));
  const [musicEnabled, setMusicEnabled] = useState(
    () => localStorage.getItem("wanhua-ambient-music-muted") !== "1",
  );

  const ambientMusicEnabled = useMemo(() => {
    if (!musicEnabled) return false;
    if (showOpening) return true;
    if (loadState.status !== "ready") return false;
    return loadState.save.state.location === "home" && !loadState.save.state.activeEvent;
  }, [loadState, musicEnabled, showOpening]);

  useAmbientMusic(ambientMusicEnabled);

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

  function openPanel(nextPanel: Panel, profileTab: ProfileTab = "属性") {
    if (nextPanel === "我的") setProfileInitialTab(profileTab);
    setPanel(nextPanel);
  }

  async function perform(action: DemoAction, requestPayload?: DemoActionPayload) {
    setBusyAction(action);
    try {
      const responsePayload = await fetchJson<SaveResponse>("/demo/action", {
        method: "POST",
        body: JSON.stringify({ action, ...requestPayload }),
      });
      replaceSave(responsePayload.save);
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

  function toggleAmbientMusic() {
    setMusicEnabled((current) => {
      const next = !current;
      localStorage.setItem("wanhua-ambient-music-muted", next ? "0" : "1");
      return next;
    });
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
      profileInitialTab={profileInitialTab}
      musicEnabled={musicEnabled}
      onAction={(action, payload) => void perform(action, payload)}
      onReset={() => void reset()}
      onOpenPanel={openPanel}
      onClosePanel={() => setPanel(null)}
      onToggleMusic={toggleAmbientMusic}
      onReplayOpening={() => {
        localStorage.removeItem("cultivation-opening-seen");
        setPanel(null);
        setShowOpening(true);
      }}
    />
  );
}

export default App;

