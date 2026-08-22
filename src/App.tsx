import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  CharacterCreation,
  EntryCg,
  MajorSystemScreen,
  StartMenu,
  getExpansion,
  type ExpansionActivity,
  type ExpansionState,
  type PlayerProfile,
  type SystemScreen,
} from "./majorUpdate";
import "./majorUpdate.css";

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

type DemoEventId = "intro_lushi" | "mouse_cave_treasure" | "wish_eater_bridge";

type DemoEventChoiceAction =
  | "event_choice:intro_ok"
  | "event_choice:intro_where"
  | "event_choice:mouse_joke"
  | "event_choice:mouse_careful"
  | "event_choice:qingmu_trust"
  | "event_choice:qingmu_guard"
  | "event_choice:protect_beggar"
  | "event_choice:trust_jinling";

type DemoEventVisualStage =
  | "intro_dormitory"
  | "intro_plaza"
  | "intro_hall"
  | "intro_reward"
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
  nextNodeId?: string;
};

type DemoEventNode = {
  id: string;
  nextNodeId?: string;
  title: string;
  speaker: string;
  text: string;
  mode: "dialogue" | "choice" | "battle" | "reward";
  visualStage: DemoEventVisualStage;
  scene?: DemoScene;
  continueScene?: DemoScene | null;
  continueLabel?: string;
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
  awaitingScene?: DemoScene | null;
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
    level: "炼气" | "筑基";
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
  expansion?: ExpansionState;
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

type SceneActionFeedback = {
  title: string;
  text: string;
  details: string[];
};

type SystemPrompt = {
  id: number;
  title: string;
  text: string;
  details: string[];
  variant: "reward" | "notice";
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

type Panel = "我的" | "日志" | "世界" | "事件" | "关系" | "人物" | "功法" | "设置" | "门规" | "手记";
type ProfileTab = "属性" | "背包" | "装备" | "功法" | "术法";
type HandnoteTab = "鹿真人" | "小张" | "小娴";

const recordAssets: {
  ruleBoardSmall: string;
  ruleBoardLarge: string;
  handnotes: Record<
    HandnoteTab,
    {
      cover: string;
      subtitle: string;
      summary: string;
    }
  >;
} = {
  ruleBoardSmall: assetPath("assets/tapflow/records/rule-board-small.webp"),
  ruleBoardLarge: assetPath("assets/tapflow/records/rule-board-large.webp"),
  handnotes: {
    "鹿真人": {
      cover: assetPath("assets/tapflow/records/handnote-gray-white.webp"),
      subtitle: "灰皮线装白纸",
      summary: "鹿真人云游时随手记下的行笔，像旧稿，也像线索。",
    },
    "小张": {
      cover: assetPath("assets/tapflow/records/handnote-blue-horizontal.webp"),
      subtitle: "蓝皮线装横翻",
      summary: "小张的字和人一样横冲直撞，内容却都挺实用。",
    },
    "小娴": {
      cover: assetPath("assets/tapflow/records/handnote-lavender-vertical.webp"),
      subtitle: "淡紫藤环竖翻",
      summary: "小娴的手记更像备忘录，轻巧，但总藏着一点真东西。",
    },
  },
};

type HandnoteEntry = ExpansionState["handnotes"]["entries"][number];
type BagCategory = "装备" | "丹药" | "秘籍" | "任务" | "材料" | "其他";
type EquipmentView = "武器" | "服饰" | "法宝" | "丹药";
type MethodNode = "method" | "attack" | "root" | "passive";
type SpellBuilderSlot = "result" | "spell" | "technique" | "secret1" | "secret2";
type BagItem = {
  id: string;
  icon?: string;
  category: BagCategory;
  name: string;
  value: number;
  description: string;
  useLabel: string;
};
const profileTabItems: { id: ProfileTab; note: string }[] = [
  { id: "属性", note: "主角状态" },
  { id: "背包", note: "资源道具" },
  { id: "装备", note: "武器护具" },
  { id: "功法", note: "主修切换" },
  { id: "术法", note: "技能配置" },
];

const bagCategories: BagCategory[] = ["装备", "丹药", "秘籍", "任务", "材料", "其他"];
const equipmentViews: EquipmentView[] = ["武器", "服饰", "法宝", "丹药"];

const resourceRewardLabels: Record<keyof DemoSaveState["resources"], string> = {
  spiritStones: "灵石",
  spiritMarrow: "灵髓",
  herbs: "草药",
  ore: "矿石",
  pills: "回气丹",
};

const inventoryRewardLabels: Record<keyof NonNullable<DemoSaveState["inventory"]>, string> = {
  mouseDemonCore: "山鼠妖丹",
  worryForgetRoot: "忘忧根",
  qingmuHealingPills: "青木疗伤丹",
  jinlingToken: "金灵宗信物",
};

const handnoteHerbNames: Record<string, string> = {
  juqi: "聚气草",
  ningxue: "凝血花",
  huoli: "火栗",
  shizhi: "石芝",
  wugen: "无根萍",
  taojiao: "桃胶",
  chiyan: "赤焰花",
  chensha: "辰砂",
};

const handnotePillNames: Record<string, string> = {
  huayu: "化瘀丹",
  huoxue: "活血丹",
  xugu: "续骨丹",
  juling: "聚灵散",
  huiyuan: "回元散",
  "juqi-pill": "聚气丹",
  ningyuan: "凝元丹",
  pozhang: "破障丹",
  tiegu: "铁骨散",
  qinghui: "清秽散",
  yannian: "延年散",
  tongmai: "通脉丹",
};

const handnoteMaterialNames: Record<string, string> = {
  crudeIron: "粗铁矿",
  mouseBone: "山鼠兽骨",
  coldIron: "寒铁",
  silver: "秘银",
  flameIron: "炎铁",
  spiritCrystal: "灵晶石",
  resonanceCrystal: "灵韵结晶",
  ember: "万炼余烬",
};

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
  (import.meta.env.PROD ? `${window.location.origin}/wanhua-api` : window.location.origin);

function assetPath(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;
}

const playerOutfitAssets: Record<PlayerProfile["outfit"], string> = {
  qingshan: assetPath("assets/onboarding/outfit-qingshan.png"),
  daopao: assetPath("assets/onboarding/outfit-daopao.png"),
  jinzhuang: assetPath("assets/onboarding/outfit-jinzhuang.png"),
  xianpao: assetPath("assets/onboarding/outfit-xianpao.png"),
};

const fateNames: Record<PlayerProfile["fate"], string> = {
  genius: "天之骄子",
  talented: "资质聪颖",
  average: "天赋平平",
  mortal: "凡人修仙",
};

const difficultyNames: Record<PlayerProfile["difficulty"], string> = {
  easy: "和光同尘",
  normal: "道法自然",
  hard: "逆天改命",
  extreme: "真实修仙",
};

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

const profileTabIconAssets: Partial<Record<ProfileTab, string>> = {
  功法: assetPath("assets/tapflow/arts/gold/huang-jinmang-jue.webp"),
  术法: assetPath("assets/tapflow/loadout/wanhua-body.webp"),
};

const rankFrameAssets: Record<"黄" | "玄" | "地" | "天" | "仙", string> = {
  黄: assetPath("assets/tapflow/loadout/rank-yellow.webp"),
  玄: assetPath("assets/tapflow/loadout/rank-xuan.webp"),
  地: assetPath("assets/tapflow/loadout/rank-earth.webp"),
  天: assetPath("assets/tapflow/loadout/rank-heaven.webp"),
  仙: assetPath("assets/tapflow/loadout/rank-immortal.webp"),
};

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

type StoryChapter = {
  title: string;
  realm: string;
  startYear: number;
  endYear: number;
  theme: string;
};

type StoryMilestone = {
  year: number;
  chapter: string;
  title: string;
  category: string;
  summary: string;
  eventId?: DemoEventId;
};

const storyChapters: StoryChapter[] = [
  { title: "序章", realm: "初入此界", startYear: 0, endYear: 0, theme: "穿越、救治与入鹿石宗" },
  { title: "第一章", realm: "炼气期", startYear: 1, endYear: 25, theme: "初入修仙界，结识第一批伙伴" },
  { title: "第二章", realm: "筑基期", startYear: 26, endYear: 60, theme: "拜访五宗，比武大会展开世界" },
  { title: "第三章", realm: "金丹期", startYear: 61, endYear: 150, theme: "势力扎根，魔道初现真容" },
  { title: "第四章", realm: "元婴期", startYear: 151, endYear: 280, theme: "魔道渗透与首次大战" },
  { title: "第五章", realm: "化神期", startYear: 281, endYear: 420, theme: "真相浮现，全面战争前夜" },
  { title: "第六章", realm: "飞升期", startYear: 421, endYear: 500, theme: "终战、了结尘缘、飞升成仙" },
];

const storyMilestones: StoryMilestone[] = [
  { year: 0, chapter: "序章", title: "穿越降临", category: "主线", summary: "小张与小娴将奄奄一息的主角带回鹿石宗，鹿真人看出万化道躯的端倪。" },
  { year: 1, chapter: "第一章", title: "鹿石宗启蒙", category: "主线", summary: "认识宗门家园、基础修炼与传送阵，开始炼气期生活。" },
  { year: 5, chapter: "第一章", title: "万化道躯初显", category: "体质", summary: "主角首次修炼便成功转换灵根，鹿真人在远处若有所思。" },
  { year: 10, chapter: "第一章", title: "山鼠洞寻宝", category: "外出奇遇", summary: "小张邀约探宝，羊七道人与豆髯道人登场，初识青木门。", eventId: "mouse_cave_treasure" },
  { year: 12, chapter: "第一章", title: "断桥村异闻", category: "外出奇遇", summary: "调查啖愿妖，结识金灵宗雏雏、小鹿，理解善意也需要辨别。", eventId: "wish_eater_bridge" },
  { year: 15, chapter: "第一章", title: "长安城初见闻", category: "新势力", summary: "结识兔娘会长，见识以物易物的拍卖行体系。" },
  { year: 22, chapter: "第一章", title: "失踪的采药人", category: "暗线", summary: "鹿石宗附近出现失踪案，主角第一次发现带有异常气息的灵髓残片。" },
  { year: 25, chapter: "第一章", title: "筑基之劫", category: "境界突破", summary: "在心魔试炼中窥见模糊的仙魔大战残影。" },
  { year: 28, chapter: "第二章", title: "寒妙观初访", category: "拜访宗门", summary: "结识春琼与云隽渺，初窥寒冰幻术与灵泉疗愈。" },
  { year: 32, chapter: "第二章", title: "九阳炎天宗初访", category: "拜访宗门", summary: "卷入墨炎与林川的友谊竞赛，接触火系强攻流派。" },
  { year: 38, chapter: "第二章", title: "须弥山府急救", category: "拜访宗门", summary: "协助黄垚苓与石岳疏散村民，见识厚土镇守之道。" },
  { year: 45, chapter: "第二章", title: "五宗论道会", category: "群像", summary: "五宗年轻一辈首次聚首，为青年才俊比武大会预热。" },
  { year: 50, chapter: "第二章", title: "青年才俊比武大会", category: "大事件", summary: "主角崭露头角，暗中有人试图窃取参赛者体内的灵髓。" },
  { year: 55, chapter: "第二章", title: "张真人的独当一面", category: "羁绊", summary: "小张独自完成历练任务，证明自己不只是嘴上功夫。" },
  { year: 58, chapter: "第二章", title: "金丹之劫", category: "境界突破", summary: "以力量与责任为题，迎来下一阶段的心魔试炼。" },
  { year: 65, chapter: "第三章", title: "长安城拍卖异变", category: "暗线", summary: "缠绕黑气的上古法器流入拍卖行，兔娘展现出不同寻常的手段。" },
  { year: 70, chapter: "第三章", title: "边境小镇沦陷", category: "暗线", summary: "首次遭遇成规模的忘川魔渊势力，五宗联合出击。" },
  { year: 78, chapter: "第三章", title: "鹿真人欲言又止", category: "主线", summary: "鹿真人罕见现身，听闻忘川魔渊后只留下意味深长的警示。" },
  { year: 85, chapter: "第三章", title: "五行秘境大典", category: "秘境", summary: "百年一开的五行秘境开启，跨门派合作与竞争并存。" },
  { year: 92, chapter: "第三章", title: "情谊渐深", category: "群像", summary: "各宗同辈的羁绊事件并行展开，人物关系进入新阶段。" },
  { year: 100, chapter: "第三章", title: "金丹盛典", category: "里程碑", summary: "主角于长安城正式立足，边境求援信揭开新的危机。" },
  { year: 150, chapter: "第四章", title: "元婴期篇章", category: "后续", summary: "魔道渗透、上古遗迹与边疆大战将先后展开。" },
  { year: 280, chapter: "第五章", title: "化神期篇章", category: "后续", summary: "忘川魔渊真面目逐步浮现，世界走向全面战争。" },
  { year: 420, chapter: "第六章", title: "飞升期篇章", category: "后续", summary: "所有同伴齐聚终局，万化道躯的来历与轮回选择迎来收束。" },
  { year: 500, chapter: "第六章", title: "飞升成仙", category: "终局", summary: "终战之后，主角面对飞升与下一周目的开放式选择。" },
];

const timelineEntries = storyMilestones.map(
  (milestone) => `第${milestone.year}年 · ${milestone.title}：${milestone.summary}`,
);

function getStoryChapter(year: number) {
  return (
    storyChapters.find((chapter) => year >= chapter.startYear && year <= chapter.endYear) ??
    storyChapters[storyChapters.length - 1]
  );
}

const worldLore = [
  "万化道躯：玩家专属体质，本身没有固定灵根，修行何种功法，体内灵气便自动转化成对应属性根基。",
  "鹿花诀：鹿真人传给玩家的入门功法，表面普通，实则用于让万化道躯与魂魄绑定。",
  "灵髓之谜：表面是稀少的高级修炼资源，随着主线推进会逐渐显出不寻常的一面。",
  "魔道暗线：忘川魔渊持续搜集灵髓、渗透五宗，玩家会在不同年份逐步发现线索。",
  "鹿真人之谜：他与万化道躯及过往封魔之战存在关联，真相留待后续篇章揭开。",
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

type SceneNpcChoice = {
  label: string;
  response: string;
  action?: DemoAction;
};

const sceneNpcInteractions: Record<
  DemoScene,
  {
    greeting: string;
    choices: SceneNpcChoice[];
  }
> = {
  hall: {
    greeting: "小张抱着一卷门规站在大厅里，神情严肃得像是马上要主持宗门大典。",
    choices: [
      { label: "问问宗门近况", response: "鹿真人又云游去了。宗门大小事务嘛……自然暂由本大师兄主持。" },
      { label: "提醒牌匾歪了", response: "这叫随性自然。你要实在看不惯，等会儿搭把手扶正。" },
    ],
  },
  plaza: {
    greeting: "小张靠着木桩冲你招手，显然又在盘算新的宗门活动。",
    choices: [
      { label: "和他打招呼", response: "师弟来得正好！本真人正缺一个见证我绝世剑法的人。" },
      { label: "问今天做什么", response: "先把宗门逛熟。要是还闲着，扫扫广场，说不定真能捡到灵石。" },
    ],
  },
  dormitory: {
    greeting: "小张从门边探出头，压低声音提醒你别把小娴留下的丹药忘在桌上。",
    choices: [
      { label: "问他为何在这里", response: "我只是路过！顺便确认师弟有没有偷懒……绝不是来找零食。" },
      { label: "请他安静些", response: "好好好，你休息。本大师兄替你守门，保证谁都不来打扰。" },
    ],
  },
  sister_room: {
    greeting: "小娴放下手里的药册，为你添了一盏温茶。",
    choices: [
      {
        label: "一起喝茶",
        response: "小娴笑着推来茶盏，药香与茶香慢慢散开。",
        action: "talk_xiaoxian",
      },
      { label: "问问小张近况", response: "他方才还说要炼一件惊天法宝。你若听见炸炉声，记得先躲远些。" },
    ],
  },
  meditation_room: {
    greeting: "鹿真人的身影停在阵纹旁，似真似幻，像是一缕留在此处的神念。",
    choices: [
      { label: "请教万化道躯", response: "莫急着给自己定形。能容万法，先要学会辨认何为自己的道。" },
      { label: "询问闭关要诀", response: "闭关不是与世隔绝。心有所悟时入定，心有挂碍时便出去走走。" },
    ],
  },
  forge: {
    greeting: "小张举起一把刚出炉的短剑，似乎很希望你先夸一句。",
    choices: [
      { label: "评价这把短剑", response: "有眼光！虽然离绝世神兵还差一点，但拿去换灵石肯定不亏。" },
      { label: "问问炉火", response: "火候最重要。小娴说我总开得太旺，我觉得那叫气势。" },
    ],
  },
  alchemy_room: {
    greeting: "小娴守在丹炉旁，见你靠近便递来一块隔热的软布。",
    choices: [
      { label: "询问炼丹进度", response: "火候正好，再等一会儿便能收丹。小张今天不在，应该不会出岔子。" },
      { label: "问能否帮忙", response: "帮我把右边第二格的药匣拿来吧。慢些，别碰到炉壁。" },
    ],
  },
  spirit_garden: {
    greeting: "小娴蹲在灵田边松土，衣袖上沾了几片细小的草叶。",
    choices: [
      { label: "询问灵草长势", response: "这批长得很好。再照料一阵，就能留一部分炼丹，其余收入仓库。" },
      { label: "帮她浇水", response: "多谢。沿着根部慢慢浇就好，别学小张直接用引水术冲。" },
    ],
  },
  teleport_array: {
    greeting: "鹿真人站在忽明忽暗的阵纹前，像是早已知道你会来。",
    choices: [
      { label: "询问传送去处", response: "阵盘会记住曾经抵达的地方。先检查阵纹，再选择你真正想去的方向。" },
      { label: "问阵法是否安全", response: "能到地方。至于落地时是站着还是坐着，要看今日阵灵的心情。" },
    ],
  },
};

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

const feedbackActions: DemoAction[] = [
  "cultivate",
  "alchemy",
  "plant",
  "forge",
  "rest",
  "talk_xiaoxian",
  "sweep_plaza",
  "inspect_teleport",
];

function createSceneActionFeedback(
  before: DemoSaveState | null,
  after: DemoSaveState,
): SceneActionFeedback {
  const latestLog = after.eventLog[0];
  const details: string[] = [];

  if (before) {
    if (before.year !== after.year || before.month !== after.month) {
      details.push(`时间：${formatTime(before)} → ${formatTime(after)}`);
    }

    const resourceLabels: Array<[keyof DemoSaveState["resources"], string]> = [
      ["spiritStones", "灵石"],
      ["spiritMarrow", "灵髓"],
      ["herbs", "草药"],
      ["ore", "矿石"],
      ["pills", "丹药"],
    ];
    resourceLabels.forEach(([key, label]) => {
      const delta = after.resources[key] - before.resources[key];
      if (delta !== 0) details.push(`${label}：${delta > 0 ? "+" : ""}${delta}`);
    });

    const progressDelta =
      after.cultivation.realmProgress - before.cultivation.realmProgress;
    if (progressDelta !== 0) {
      details.push(`修为进度：${progressDelta > 0 ? "+" : ""}${progressDelta}%`);
    }

    after.relationships.forEach((relationship) => {
      const previous = before.relationships.find(
        (item) => item.characterId === relationship.characterId,
      );
      const delta = relationship.bond - (previous?.bond ?? relationship.bond);
      if (delta !== 0) {
        details.push(`${relationship.name}羁绊：${delta > 0 ? "+" : ""}${delta}`);
      }
    });
  }

  return {
    title: latestLog?.title ?? "操作完成",
    text: latestLog?.text ?? "场景功能已经执行。",
    details,
  };
}

function getPromptInventory(state: DemoSaveState) {
  return {
    mouseDemonCore: state.inventory?.mouseDemonCore ?? 0,
    worryForgetRoot: state.inventory?.worryForgetRoot ?? 0,
    qingmuHealingPills: state.inventory?.qingmuHealingPills ?? 0,
    jinlingToken: state.inventory?.jinlingToken ?? 0,
  };
}

function formatGain(label: string, amount: number) {
  return `${label} +${amount}`;
}

function collectRewardDetails(before: DemoSaveState | null, after: DemoSaveState) {
  if (!before) return [];

  const details: string[] = [];

  (Object.entries(resourceRewardLabels) as Array<[keyof DemoSaveState["resources"], string]>).forEach(
    ([key, label]) => {
      const delta = after.resources[key] - before.resources[key];
      if (delta > 0) details.push(formatGain(label, delta));
    },
  );

  const beforeInventory = getPromptInventory(before);
  const afterInventory = getPromptInventory(after);
  (Object.entries(inventoryRewardLabels) as Array<[keyof typeof afterInventory, string]>).forEach(
    ([key, label]) => {
      const delta = afterInventory[key] - beforeInventory[key];
      if (delta > 0) details.push(formatGain(label, delta));
    },
  );

  const beforeExpansion = getExpansion(before.expansion);
  const afterExpansion = getExpansion(after.expansion);

  Object.entries(afterExpansion.herbStock).forEach(([id, value]) => {
    const delta = value - (beforeExpansion.herbStock[id as keyof typeof beforeExpansion.herbStock] ?? 0);
    if (delta > 0) details.push(formatGain(handnoteHerbNames[id] ?? id, delta));
  });

  Object.entries(afterExpansion.materialStock).forEach(([id, value]) => {
    const delta = value - (beforeExpansion.materialStock[id] ?? 0);
    if (delta > 0) details.push(formatGain(handnoteMaterialNames[id] ?? id, delta));
  });

  Object.entries(afterExpansion.pillStock).forEach(([id, value]) => {
    const delta = value - (beforeExpansion.pillStock[id] ?? 0);
    if (delta > 0) details.push(formatGain(handnotePillNames[id] ?? id, delta));
  });

  const knownEquipmentIds = new Set(beforeExpansion.craftedEquipment.map((item) => item.id));
  afterExpansion.craftedEquipment.forEach((item) => {
    if (!knownEquipmentIds.has(item.id)) details.push(`装备「${item.name}」`);
  });

  const knownArts = new Set(before.cultivation.learnedArts);
  after.cultivation.learnedArts.forEach((art) => {
    if (!knownArts.has(art)) details.push(`习得功法「${art}」`);
  });

  after.relationships.forEach((relationship) => {
    const previous = before.relationships.find((item) => item.characterId === relationship.characterId);
    const delta = relationship.bond - (previous?.bond ?? relationship.bond);
    if (delta > 0) details.push(`${relationship.name}羁绊 +${delta}`);
  });

  return details;
}

function createRewardPrompt(
  before: DemoSaveState | null,
  after: DemoSaveState,
  title = "获得奖励",
): SystemPrompt | null {
  const details = collectRewardDetails(before, after);
  if (details.length === 0) return null;
  return {
    id: Date.now(),
    title,
    text: "奖励已同步到人物面板、背包、功法栏或关系记录。",
    details,
    variant: "reward",
  };
}

function getScene(state: DemoSaveState): DemoScene {
  return state.scene ?? "plaza";
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

const sceneHandnoteTargets: Record<
  DemoScene,
  { tab: HandnoteTab; label: string } | null
> = {
  hall: { tab: "鹿真人", label: "鹿真人手记" },
  plaza: null,
  dormitory: { tab: "小张", label: "小张手记" },
  sister_room: { tab: "小娴", label: "小娴手记" },
  meditation_room: null,
  forge: null,
  alchemy_room: null,
  spirit_garden: null,
  teleport_array: null,
};

const handnoteTabMeta: Record<HandnoteTab, { npcId: HandnoteEntry["npcId"]; note: string }> = {
  "鹿真人": { npcId: "lu-zhenren", note: "云游，偶尔出现" },
  "小张": { npcId: "xiao-zhang", note: "嘴硬，爱装" },
  "小娴": { npcId: "xiaoxian", note: "温和，管事" },
};

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

function getOptimisticEventSave(
  save: DemoSave,
  action: DemoAction,
  events: Record<DemoEventId, DemoEventDefinition>,
): DemoSave | null {
  const active = save.state.activeEvent;
  if (!active) return null;

  const definition = events[active.id];
  const currentNode = definition?.nodes[active.nodeIndex];
  if (!definition || !currentNode) return null;

  let nextIndex: number;
  let nextScene = save.state.scene ?? "plaza";

  if (action.startsWith("event_choice:")) {
    const choice = currentNode.choices?.find((item) => item.action === action);
    if (!choice || currentNode.mode !== "choice") return null;
    nextIndex = definition.nodes.findIndex((node) => node.id === choice.nextNodeId);
  } else if (action === "advance_event") {
    if (currentNode.mode === "choice" || currentNode.mode === "battle") return null;
    nextIndex = currentNode.nextNodeId
      ? definition.nodes.findIndex((node) => node.id === currentNode.nextNodeId)
      : active.nodeIndex + 1;
  } else if (action.startsWith("change_scene:")) {
    const requestedScene = action.replace("change_scene:", "") as DemoScene;
    const expectedScene = active.awaitingScene ?? currentNode.continueScene ?? null;
    if (!expectedScene || expectedScene !== requestedScene) return null;
    nextScene = requestedScene;
    nextIndex = active.nodeIndex + 1;
  } else {
    return null;
  }

  if (nextIndex < 0 || nextIndex >= definition.nodes.length) {
    return {
      ...save,
      state: {
        ...save.state,
        activeEvent: null,
        location: "home",
        scene: active.id === "intro_lushi" ? "plaza" : nextScene,
      },
    };
  }

  const nextNode = definition.nodes[nextIndex];
  return {
    ...save,
    state: {
      ...save.state,
      scene: nextNode.scene ?? nextScene,
      location: nextNode.mode === "battle" ? "battle" : "event",
      activeEvent: {
        ...active,
        nodeIndex: nextIndex,
        awaitingScene: nextNode.continueScene ?? null,
      },
    },
  };
}

function getVisualStageTitle(visualStage: DemoEventVisualStage) {
  const titles: Record<DemoEventVisualStage, string> = {
    intro_dormitory: "宿舍醒来",
    intro_plaza: "广场认路",
    intro_hall: "大殿初见",
    intro_reward: "入门功法",
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
    intro_dormitory: "assets/tapflow/scenes/dormitory.webp",
    intro_plaza: "assets/tapflow/scenes/plaza.webp",
    intro_hall: "assets/tapflow/scenes/hall.webp",
    intro_reward: "assets/tapflow/scenes/hall.webp",
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

function getSceneTransitionSignature(scene: DemoScene, activeEvent: ReturnType<typeof getActiveEvent>) {
  if (!activeEvent) return scene;
  if (activeEvent.node.scene) return scene;
  return `${scene}:${activeEvent.node.visualStage}`;
}

function getEventButtonLabel(node: DemoEventNode, busy: boolean) {
  if (busy) {
    if (node.mode === "battle") return "战斗中";
    if (node.mode === "reward") return "结算中";
    return "推进中";
  }

  if (node.mode === "reward") return node.continueLabel ?? "领取结算";
  if (node.continueScene) {
    return node.continueLabel ?? `前往${sceneConfig[node.continueScene].label}继续`;
  }
  if (node.mode !== "battle") return node.continueLabel ?? "继续剧情";

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

function getDialogueSpeakerName(speaker: string) {
  const candidates = speaker
    .split(/[\/、，,|｜]/)
    .map((item) => item.trim())
    .filter(Boolean);
  return candidates.find((item) => item !== "系统" && item !== "旁白") ?? candidates[0] ?? speaker;
}

function getSpeakerPortrait(
  speaker: string,
  node?: DemoEventNode,
): { key: PortraitKey; expression: PortraitExpression; name: string } | null {
  const seriousNode = node?.mode === "battle" || node?.id.includes("boss") || node?.id.includes("rat-king");
  const speakerName = getDialogueSpeakerName(speaker);

  if (speakerName === "主角" || speakerName === "玩家") {
    return {
      key: "player",
      expression: node?.mode === "choice" ? "serious" : "normal",
      name: "主角",
    };
  }

  if (speakerName === "小张" || speakerName === "张真人") {
    const expression: PortraitExpression = seriousNode
      ? "serious"
      : node?.id === "invite" || node?.id === "wake-up" || node?.id === "plaza-boast"
        ? "happy"
        : node?.id === "rat-king" || node?.id === "wake-up-joke"
          ? "snark"
          : "normal";
    return {
      key: "xiaozhang",
      expression,
      name: speakerName,
    };
  }

  if (speakerName === "小娴") {
    return {
      key: "xiaoxian",
      expression: node?.id === "xiaoxian-check" ? "normal" : "happy",
      name: "小娴",
    };
  }

  if (speakerName === "鹿真人") {
    return {
      key: "lu",
      expression: node?.id === "hall-meeting" ? "serious" : node?.text.includes("哈哈") ? "happy" : "normal",
      name: "鹿真人",
    };
  }

  if (speakerName === "羊七道人") {
    return {
      key: "yangqi",
      expression: seriousNode ? "serious" : "happy",
      name: "羊七道人",
    };
  }

  if (speakerName === "豆髯道人") {
    return {
      key: "douran",
      expression: node?.text.includes("哈哈") ? "happy" : "normal",
      name: "豆髯道人",
    };
  }

  if (speakerName === "雏雏") {
    return {
      key: "chuchu",
      expression: seriousNode ? "serious" : "normal",
      name: "雏雏",
    };
  }

  if (speakerName === "小鹿") {
    return {
      key: "xiaolu",
      expression: node?.text.includes("送他一程") ? "snark" : "serious",
      name: "小鹿",
    };
  }

  if (speakerName === "啖愿妖") {
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
  onOpenSystem,
}: {
  state: DemoSaveState;
  scene: DemoScene;
  online: boolean;
  onOpenProfile: () => void;
  onOpenPanel: (panel: Panel, target?: ProfileTab | HandnoteTab) => void;
  onOpenSystem: (screen: SystemScreen) => void;
}) {
  const loadout = getLoadout(state);
  const method = methodCatalog[loadout.methodId];
  const profile = getExpansion(state.expansion).profile;

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
        <div className="avatar" aria-hidden="true">
          <img src={playerOutfitAssets[profile.outfit]} alt="" />
        </div>
        <div className="player-hud-info">
          <strong>{profile.name} · 鹿石宗</strong>
          <span>第 {state.year} 年 · {state.cultivation.level}期 · {method.name}</span>
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
              onOpenSystem("quests");
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
        <span className={`sync-status ${online ? "online" : "offline"}`}>
          {online ? "存档已连接" : "本地未同步"}
        </span>
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
  if (currentScene !== "plaza") return null;

  const destinations = scenes.filter((scene) => scene !== "plaza");

  return (
    <nav className="scene-nav" aria-label="从广场前往鹿石宗场景">
      <div className="scene-nav-heading">
        <span>鹿石宗</span>
        <strong>广场</strong>
        <small>选择去处</small>
      </div>
      {destinations.map((scene) => (
        <button
          className="scene-route-button"
          key={scene}
          disabled={busy}
          title={`前往${sceneConfig[scene].label}`}
          data-scene={scene}
          onClick={() => {
            playSceneClick();
            onAction(`change_scene:${scene}`);
          }}
        >
          <img src={assetPath(`assets/tapflow/scenes/${scene.replace("_", "-")}.webp`)} alt="" />
          <span>
            <strong>{sceneConfig[scene].label}</strong>
            <small>{sceneConfig[scene].subtitle}</small>
          </span>
        </button>
      ))}
    </nav>
  );
}

function SceneActionPanel({
  currentScene,
  state,
  events,
  busy,
  onAction,
  onOpenPanel,
  onOpenSystem,
}: {
  currentScene: DemoScene;
  state: DemoSaveState;
  events: Record<DemoEventId, DemoEventDefinition>;
  busy: boolean;
  onAction: (action: DemoAction, payload?: DemoActionPayload) => void;
  onOpenPanel: (panel: Panel, target?: ProfileTab | HandnoteTab) => void;
  onOpenSystem: (screen: SystemScreen) => void;
}) {
  if (currentScene === "plaza") return null;

  const runAction = (action: DemoAction) => {
    playSceneClick();
    onAction(action);
  };
  const openPanel = (panel: Panel, target?: ProfileTab | HandnoteTab) => {
    playSceneClick();
    onOpenPanel(panel, target);
  };
  const openSystem = (screen: SystemScreen) => {
    playSceneClick();
    onOpenSystem(screen);
  };
  const handnoteTarget = sceneHandnoteTargets[currentScene];

  const actions: Array<{ label: string; description: string; kind: string; onClick: () => void }> = (() => {
    switch (currentScene) {
      case "hall":
        return [
          { label: "门规书卷", description: "查看鹿石宗门规", kind: "records", onClick: () => openPanel("门规") },
          ...(handnoteTarget ? [{ label: handnoteTarget.label, description: `查看${handnoteTarget.label}`, kind: "records", onClick: () => openPanel("手记", handnoteTarget.tab) }] : []),
        ];
      case "dormitory":
        return [
          { label: "休息", description: "恢复状态并推进时间", kind: "rest", onClick: () => runAction("rest") },
          { label: "仓库", description: "打开背包与物品栏", kind: "storage", onClick: () => openPanel("我的", "背包") },
          ...(handnoteTarget ? [{ label: handnoteTarget.label, description: `查看${handnoteTarget.label}`, kind: "records", onClick: () => openPanel("手记", handnoteTarget.tab) }] : []),
        ];
      case "sister_room":
        return [
          { label: "与师姐交谈", description: "饮茶并提升羁绊", kind: "talk", onClick: () => runAction("talk_xiaoxian") },
          ...(handnoteTarget ? [{ label: handnoteTarget.label, description: `查看${handnoteTarget.label}`, kind: "records", onClick: () => openPanel("手记", handnoteTarget.tab) }] : []),
        ];
      case "meditation_room":
        return [
          { label: "练功", description: "查看当前主修功法", kind: "cultivate", onClick: () => openPanel("我的", "功法") },
          { label: "研习", description: "调整术法组合", kind: "study", onClick: () => openPanel("我的", "术法") },
          { label: "闭修", description: "提升修为并推进时间", kind: "cultivate", onClick: () => runAction("cultivate") },
        ];
      case "forge":
        return [
          { label: "炼制装备", description: "选材定型，炼制成长装备", kind: "forge", onClick: () => openSystem("forge") },
          { label: "淬炼法宝", description: "投入灵材，提升法宝阶段", kind: "forge", onClick: () => openSystem("forge") },
        ];
      case "alchemy_room":
        return [
          { label: "炼丹", description: "配置五行药材并开炉", kind: "alchemy", onClick: () => openSystem("alchemy") },
        ];
      case "spirit_garden":
        return [
          { label: "进入灵田", description: "种植、分株并收获草药", kind: "plant", onClick: () => openSystem("garden") },
        ];
      case "teleport_array":
        return [
          { label: "检查阵纹", description: "检查传送阵并准备外出", kind: "teleport", onClick: () => runAction("inspect_teleport") },
          ...getEventList(events).map((event) => {
            const completed = state.completedEvents?.includes(event.id) ?? false;
            return {
              label: `${completed ? "复盘" : "传送"} · ${event.title}`,
              description: `第${event.triggerYear}年 · ${event.location}`,
              kind: "event",
              onClick: () => runAction(`start_event:${event.id}` as DemoAction),
            };
          }),
        ];
    }
  })();

  return (
    <section className="scene-actions" aria-label={`${sceneConfig[currentScene].label}场景功能`}>
      <div className="scene-action-heading">
        <span>当前场景</span>
        <strong>{sceneConfig[currentScene].label}</strong>
        <small>{sceneConfig[currentScene].subtitle}</small>
      </div>
      <div className="scene-actions-list">
        {actions.map((action) => (
          <button
            className={`scene-action-button scene-action-${action.kind}`}
            key={action.label}
            disabled={busy}
            title={action.description}
            onClick={action.onClick}
          >
            <i aria-hidden="true" />
            <span>
              <strong>{action.label}</strong>
              <small>{action.description}</small>
            </span>
          </button>
        ))}
        <button
          className="return-to-plaza"
          disabled={busy}
          title="回到广场后可切换其他场景"
          onClick={() => runAction("change_scene:plaza")}
        >
          <i aria-hidden="true" />
          <span>
            <strong>返回广场</strong>
            <small>切换鹿石宗内的其他地点</small>
          </span>
        </button>
      </div>
    </section>
  );
}

function SceneNpcStrip({
  portrait,
  actorName,
  bond,
  onInteract,
}: {
  portrait: { key: PortraitKey; expression: PortraitExpression; name: string };
  actorName: string;
  bond: number;
  onInteract: () => void;
}) {
  return (
    <section className="scene-npc-strip" aria-label="场景人物">
      <button
        type="button"
        title={`与${actorName}交互`}
        onClick={() => {
          playSceneClick();
          onInteract();
        }}
      >
        <img src={portraitAssets[portrait.key][portrait.expression]} alt={actorName} />
        <span>
          <strong>{actorName}</strong>
          <small>羁绊 {bond} · 交谈</small>
        </span>
        <i aria-hidden="true" />
      </button>
    </section>
  );
}

function SceneNpcInteractionModal({
  scene,
  portrait,
  actorName,
  bond,
  busy,
  onAction,
  onClose,
}: {
  scene: DemoScene;
  portrait: { key: PortraitKey; expression: PortraitExpression; name: string };
  actorName: string;
  bond: number;
  busy: boolean;
  onAction: (action: DemoAction) => void;
  onClose: () => void;
}) {
  const interaction = sceneNpcInteractions[scene];
  const [response, setResponse] = useState(interaction.greeting);

  useEffect(() => {
    setResponse(interaction.greeting);
  }, [interaction.greeting, scene]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="scene-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="scene-interaction-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scene-interaction-title"
      >
        <button className="scene-modal-close" type="button" aria-label="关闭人物交互" onClick={onClose}>
          ×
        </button>
        <div className="scene-interaction-person">
          <img src={portraitAssets[portrait.key][portrait.expression]} alt={actorName} />
          <span>{sceneConfig[scene].label} · 场景人物</span>
          <h2 id="scene-interaction-title">{actorName}</h2>
          <strong>当前羁绊 {bond}</strong>
        </div>
        <div className="scene-interaction-content">
          <span className="scene-modal-eyebrow">人物交互</span>
          <p className="scene-interaction-response">{response}</p>
          <div className="scene-interaction-choices">
            {interaction.choices.map((choice) => (
              <button
                type="button"
                key={choice.label}
                disabled={busy}
                onClick={() => {
                  playSceneClick();
                  if (choice.action) {
                    onClose();
                    onAction(choice.action);
                    return;
                  }
                  setResponse(choice.response);
                }}
              >
                {choice.label}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function SceneActionFeedbackModal({
  feedback,
  onClose,
}: {
  feedback: SceneActionFeedback;
  onClose: () => void;
}) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="scene-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="scene-result-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scene-result-title"
      >
        <span className="scene-modal-eyebrow">场景功能完成</span>
        <h2 id="scene-result-title">{feedback.title}</h2>
        <p>{feedback.text}</p>
        {feedback.details.length > 0 && (
          <ul>
            {feedback.details.map((detail) => <li key={detail}>{detail}</li>)}
          </ul>
        )}
        <button type="button" className="scene-result-confirm" onClick={onClose}>
          知道了
        </button>
      </section>
    </div>
  );
}

function SystemPromptModal({
  prompt,
  onClose,
}: {
  prompt: SystemPrompt;
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 2800);
    return () => window.clearTimeout(timer);
  }, [onClose, prompt.id]);

  return (
    <div className={`system-prompt-layer ${prompt.variant}`} role="status" aria-live="polite">
      <section className="system-prompt-card">
        <button type="button" aria-label="关闭系统提示" onClick={onClose}>
          ×
        </button>
        <span>系统提示</span>
        <h2>{prompt.title}</h2>
        <p>{prompt.text}</p>
        <ul>
          {prompt.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function UtilityPanel({
  panel,
  currentScene,
  state,
  events,
  busyAction,
  initialProfileTab,
  initialHandnoteTab,
  expansionBusy,
  musicEnabled,
  onAction,
  onSaveExpansion,
  onClose,
  onReset,
  onToggleMusic,
  onReplayOpening,
}: {
  panel: Panel;
  currentScene: DemoScene;
  state: DemoSaveState;
  events: Record<DemoEventId, DemoEventDefinition>;
  busyAction: DemoAction | "reset" | null;
  initialProfileTab: ProfileTab;
  initialHandnoteTab: HandnoteTab;
  expansionBusy: boolean;
  musicEnabled: boolean;
  onAction: (action: DemoAction, payload?: DemoActionPayload) => void;
  onSaveExpansion: (expansion: ExpansionState, options?: { elapsedMonths?: number; activity?: ExpansionActivity }) => Promise<void>;
  onClose: () => void;
  onReset: () => void;
  onToggleMusic: () => void;
  onReplayOpening: () => void;
}) {
  const expansion = getExpansion(state.expansion);
  const playerProfile = expansion.profile;
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
  const completedEventIds = new Set(state.completedEvents ?? []);
  const storyChapter = getStoryChapter(state.year);
  const nextMilestone = storyMilestones.find((milestone) => milestone.year > state.year);
  const equipment = getEquipment(state);
  const loadout = getLoadout(state);
  const combatProfile = getCombatProfile(loadout);
  const lockLoadout = state.location === "battle" || Boolean(state.activeEvent);
  const equipBusy = Boolean(busyAction);
  const [profileTab, setProfileTab] = useState<ProfileTab>("属性");
  const [handnoteTab, setHandnoteTab] = useState<HandnoteTab>(initialHandnoteTab);
  const [bagCategory, setBagCategory] = useState<BagCategory>("材料");
  const [selectedBagItemId, setSelectedBagItemId] = useState<string>("spiritStones");
  const [bagNotice, setBagNotice] = useState("点击物品查看说明。");
  const [equipmentView, setEquipmentView] = useState<EquipmentView>("武器");
  const [methodNode, setMethodNode] = useState<MethodNode>("method");
  const [spellBuilderSlot, setSpellBuilderSlot] = useState<SpellBuilderSlot>("spell");
  const handnoteScope = sceneHandnoteTargets[currentScene];
  const handnoteTabs: Array<{ id: HandnoteTab; npcId: HandnoteEntry["npcId"]; note: string }> =
    handnoteScope
      ? [{ id: handnoteScope.tab, ...handnoteTabMeta[handnoteScope.tab] }]
      : Object.entries(handnoteTabMeta).map(([id, meta]) => ({
          id: id as HandnoteTab,
          npcId: meta.npcId,
          note: meta.note,
        }));

  useEffect(() => {
    if (panel === "我的") setProfileTab(initialProfileTab);
  }, [initialProfileTab, panel]);

  useEffect(() => {
    if (panel === "手记") setHandnoteTab(initialHandnoteTab);
  }, [initialHandnoteTab, panel]);

  function isHandnoteExpired(entry: HandnoteEntry) {
    return (
      entry.expiresAt.year < state.year ||
      (entry.expiresAt.year === state.year && entry.expiresAt.month < state.month)
    );
  }

  function describeHandnoteReward(reward: HandnoteEntry["reward"]) {
    if (!reward) return "无奖励";
    if (reward.type === "herb") return `${handnoteHerbNames[reward.herbId] ?? reward.herbId} ×${reward.amount}`;
    if (reward.type === "pill") return `${handnotePillNames[reward.pillId] ?? reward.pillId} ×${reward.amount}`;
    return `${handnoteMaterialNames[reward.materialId] ?? reward.materialId} ×${reward.amount}`;
  }

  async function claimHandnote(entry: HandnoteEntry) {
    if (!entry.reward || entry.claimed || isHandnoteExpired(entry) || expansionBusy || Boolean(busyAction)) {
      return;
    }

    const nextHandnotes = {
      ...expansion.handnotes,
      entries: expansion.handnotes.entries.map((item) =>
        item.id === entry.id ? { ...item, claimed: true } : item,
      ),
    };

    const nextExpansion = { ...expansion, handnotes: nextHandnotes };
    if (entry.reward.type === "herb") {
      nextExpansion.herbStock = {
        ...nextExpansion.herbStock,
        [entry.reward.herbId]: (nextExpansion.herbStock[entry.reward.herbId] ?? 0) + entry.reward.amount,
      };
    } else if (entry.reward.type === "pill") {
      nextExpansion.pillStock = {
        ...nextExpansion.pillStock,
        [entry.reward.pillId]: (nextExpansion.pillStock[entry.reward.pillId] ?? 0) + entry.reward.amount,
      };
    } else {
      nextExpansion.materialStock = {
        ...nextExpansion.materialStock,
        [entry.reward.materialId]:
          (nextExpansion.materialStock[entry.reward.materialId] ?? 0) + entry.reward.amount,
      };
    }

    const npcName =
      entry.npcId === "lu-zhenren" ? "鹿真人" : entry.npcId === "xiao-zhang" ? "小张" : "小娴";
    await onSaveExpansion(nextExpansion, {
      activity: {
        title: `${npcName}手记领取`,
        text: entry.reward
          ? `${entry.title}奖励已入包。`
          : `${entry.title}没有额外奖励，但值得再看一遍。`,
      },
    });
  }

  const content: Record<Panel, string[]> = {
    我的: [],
    日志: state.eventLog.slice(0, 8).map((event) => `${event.year}年${event.month}月 · ${event.title}：${event.text}`),
    世界: [...worldLore, ...timelineEntries, ...sectSettings],
    门规: [],
    手记: [],
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

  function getMilestoneStatus(milestone: StoryMilestone) {
    if (milestone.eventId && completedEventIds.has(milestone.eventId)) {
      return { key: "complete", label: "已完成" };
    }

    if (milestone.eventId && milestone.year <= state.year) {
      return { key: "available", label: "可前往" };
    }

    if (milestone.year < state.year) {
      return { key: "past", label: "历程已过" };
    }

    if (milestone.year === state.year) {
      return { key: "current", label: "当前节点" };
    }

    return { key: "locked", label: "未解锁" };
  }

  function renderPanelBody() {
    if (panel === "门规") {
      return (
        <section className="record-view record-rule-view">
          <div className="record-mainframe record-rule-board">
            <img className="record-art" src={recordAssets.ruleBoardLarge} alt="鹿石宗门规" />
          </div>
        </section>
      );
    }

    if (panel === "手记") {
      const currentTab = handnoteTabs.find((item) => item.id === handnoteTab) ?? handnoteTabs[0];
      const currentTheme = recordAssets.handnotes[currentTab.id];
      const handnoteThemeClass: Record<HandnoteTab, string> = {
        "鹿真人": "theme-lu",
        "小张": "theme-zhang",
        "小娴": "theme-xian",
      };
      const entries = expansion.handnotes.entries
        .filter((entry) => entry.npcId === currentTab.npcId)
        .slice()
        .sort((left, right) => Number(left.claimed) - Number(right.claimed) || right.createdAt.year - left.createdAt.year || right.createdAt.month - left.createdAt.month);

      return (
        <section className="record-view record-handnote-view">
          <div
            className={`record-mainframe handnote-reader ${handnoteThemeClass[currentTab.id]}`}
            style={{ "--handnote-book": `url("${currentTheme.cover}")` } as CSSProperties}
          >
            <div className="handnote-book-surface" aria-hidden="true" />
            <div className="record-copy handnote-copy">
              <section className="handnote-page handnote-intro">
                <header className="scroll-panel-header record-heading handnote-heading">
                  <span>{currentTab.note}</span>
                  <h3>{currentTab.id}手记</h3>
                  <small>{currentTheme.summary}</small>
                </header>
                {handnoteTabs.length > 1 && (
                  <div className="handnote-tabs handnote-tabs-inline">
                    {handnoteTabs.map((tab) => {
                      const theme = recordAssets.handnotes[tab.id];
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          className={handnoteTab === tab.id ? "active" : ""}
                          onClick={() => {
                            playSceneClick();
                            setHandnoteTab(tab.id);
                          }}
                        >
                          <img src={theme.cover} alt="" aria-hidden="true" />
                          <span>
                            <strong>{tab.id}</strong>
                            <small>{tab.note}</small>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
              <section className="handnote-page handnote-entries">
                <div className="handnote-list">
                  {entries.length === 0 ? (
                    <p className="empty-note">当前没有可阅读的手记，等等下一次刷新。</p>
                  ) : (
                    entries.map((entry) => {
                      const expired = isHandnoteExpired(entry);
                      const status = entry.claimed ? "已领取" : expired ? "已过期" : entry.reward ? "可领取" : "情感条目";
                      return (
                        <article
                          key={entry.id}
                          className={`handnote-entry ${entry.claimed ? "claimed" : ""} ${expired ? "expired" : ""}`}
                        >
                          <div className="handnote-entry-header">
                            <strong>{entry.title}</strong>
                            <div className="handnote-entry-meta">
                              <time>第{entry.createdAt.year}年{entry.createdAt.month}月</time>
                              <span>{status}</span>
                            </div>
                          </div>
                          <p>
                            {entry.text}
                            {entry.reward && (
                              <span className="handnote-reward-inline">
                                （奖励：{describeHandnoteReward(entry.reward)}）
                              </span>
                            )}
                          </p>
                          <footer>
                            {entry.reward ? (
                              <button
                                type="button"
                                disabled={entry.claimed || expired || expansionBusy || Boolean(busyAction)}
                                onClick={() => {
                                  playSceneClick();
                                  void claimHandnote(entry);
                                }}
                              >
                                {entry.claimed ? "已领取" : expired ? "已过期" : "领取奖励"}
                              </button>
                            ) : (
                              <span>无可领取奖励</span>
                            )}
                          </footer>
                        </article>
                      );
                    })
                  )}
                </div>
              </section>
            </div>
          </div>
        </section>
      );
    }

    if (panel === "我的") {
      const maxHp = 100 + combatProfile.method.defense * 4 + combatProfile.method.shield;
      const identityRows = [
        ["姓名", playerProfile.name],
        ["性别", playerProfile.gender === "male" ? "男修" : "女修"],
        ["宗门-职位", "鹿石宗 · 新入门弟子"],
        ["命格", fateNames[playerProfile.fate]],
        ["历练难度", difficultyNames[playerProfile.difficulty]],
      ];
      const statRows = [
        ["血气", `${maxHp}/${maxHp}`],
        ["灵气", "60/60"],
        ["资质", `${playerProfile.attributes.aptitude}`],
        ["悟性", `${playerProfile.attributes.comprehension}`],
        ["神识", `${playerProfile.attributes.spirit}`],
        ["遁速", `${playerProfile.attributes.speed}`],
        ["福缘", `${playerProfile.attributes.fortune}`],
        ["寿元", "80/120"],
        ["境界", state.cultivation.level],
        ["修为", `${state.cultivation.realmProgress}/100`],
        ["修炼速度", `${combatProfile.method.cultivateSpeed}/月`],
        ["体质", state.cultivation.root],
        ["主修", combatProfile.method.name],
        ["防御", `${combatProfile.method.defense}`],
        ["回血", combatProfile.method.regen > 0 ? `${combatProfile.method.regen}/秒` : "无"],
      ];
      const herbNames: Record<string, string> = {
        juqi: "聚气草",
        ningxue: "凝血花",
        huoli: "火栗",
        shizhi: "石芝",
        wugen: "无根萍",
        taojiao: "桃胶",
        chiyan: "赤焰花",
        chensha: "辰砂",
      };
      const pillNames: Record<string, string> = {
        huayu: "化瘀丹",
        huoxue: "活血丹",
        xugu: "续骨丹",
        juling: "聚灵散",
        huiyuan: "回元散",
        "juqi-pill": "聚气丹",
        ningyuan: "凝元丹",
        pozhang: "破障丹",
        tiegu: "铁骨散",
        qinghui: "清秽散",
        yannian: "延年散",
        tongmai: "通脉丹",
      };
      const materialNames: Record<string, string> = {
        crudeIron: "粗铁矿",
        mouseBone: "山鼠兽骨",
        coldIron: "寒铁",
        silver: "秘银",
        flameIron: "炎铁",
        spiritCrystal: "灵晶石",
        resonanceCrystal: "灵韵结晶",
        ember: "万炼余烬",
      };
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
        ...Object.entries(expansion.herbStock).map(([id, value]) => ({
          id: `herb-${id}`,
          category: "材料" as BagCategory,
          name: herbNames[id] ?? id,
          value,
          description: "灵植园培育的五行草药，可按丹方要求投入炼丹炉。",
          useLabel: "查看丹方",
        })),
        ...Object.entries(expansion.materialStock).map(([id, value]) => ({
          id: `material-${id}`,
          category: "材料" as BagCategory,
          name: materialNames[id] ?? id,
          value,
          description: "炼器坊使用的灵材，灵韵与五行会共同决定装备品阶和特性。",
          useLabel: "查看炼器",
        })),
        ...Object.entries(expansion.pillStock).map(([id, value]) => ({
          id: `pill-${id}`,
          category: "丹药" as BagCategory,
          name: pillNames[id] ?? id,
          value,
          description: "炼丹房产出的丹药，数量已经与云存档同步。",
          useLabel: "查看药效",
        })),
        ...expansion.craftedEquipment.map((item) => ({
          id: `crafted-${item.id}`,
          category: "装备" as BagCategory,
          name: item.name,
          value: 1,
          description: `${item.rank}阶 · ${item.form} · 灵韵${item.lingyun} · ${item.effect}`,
          useLabel: item.stage < 4 ? "继续淬炼" : "查看法宝",
        })),
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
      const methodNodeDetails: Record<MethodNode, { kicker: string; title: string; value: string; description: string }> = {
        method: {
          kicker: "主修核心",
          title: combatProfile.method.name,
          value: `${combatProfile.method.element}系 · ${combatProfile.method.rank}阶 · 修炼速度 ${combatProfile.method.cultivateSpeed}/月`,
          description: "主修核心决定灵根转化、自动攻击与防御被动。切换右侧功法后，整条战斗链同步更新。",
        },
        attack: {
          kicker: "自动攻击",
          title: combatProfile.method.attackName,
          value: `伤害 ${combatProfile.method.attackDamage} · 间隔 ${combatProfile.method.attackInterval}s · 弹速 ${combatProfile.method.projectileSpeed}`,
          description: "战斗开始后自动锁定最近敌人发动，不占用主动法术位。",
        },
        root: {
          kicker: "灵根转化",
          title: combatProfile.method.element === "无" ? "万化无相" : `${combatProfile.method.element}灵根`,
          value: combatProfile.elementMatch ? "当前术法完全匹配" : "当前术法跨系，最终伤害降至 70%",
          description: "万化道躯会随主修功法改变属性；同系术法不会受到跨系衰减。",
        },
        passive: {
          kicker: "护体被动",
          title: combatProfile.method.regen > 0 ? "生息回元" : combatProfile.method.defense > 0 ? "护体真气" : "攻伐专精",
          value: `防御 ${combatProfile.method.defense} · 回血 ${combatProfile.method.regen}/秒 · 护盾 ${combatProfile.method.shield}`,
          description: "这些数值直接写入战斗角色属性，并参与受击减伤、生命恢复和最大气血计算。",
        },
      };
      const activeMethodNode = methodNodeDetails[methodNode];
      const spellSlotMeta: Record<SpellBuilderSlot, { eyebrow: string; title: string; hint: string }> = {
        result: { eyebrow: "成招预览", title: combatProfile.activeSkillName, hint: "查看最终战斗数值" },
        spell: { eyebrow: "构件一", title: combatProfile.spell.name, hint: "决定元素、基础伤害与命中特效" },
        technique: { eyebrow: "构件二", title: combatProfile.technique.name, hint: "决定弹道形态、倍率与射程" },
        secret1: { eyebrow: "构件三", title: combatProfile.secrets[0].name, hint: "叠加第一条战斗修正" },
        secret2: { eyebrow: "构件四", title: combatProfile.secrets[1].name, hint: "叠加第二条战斗修正" },
      };

      return (
        <div className="profile-panel profile-panel-fixed">
          <div className="profile-content-shell">
          {profileTab === "属性" && (
          <section className="profile-identity profile-identity-fixed">
            <div className="profile-portrait">
              <img className="profile-created-outfit" src={playerOutfitAssets[playerProfile.outfit]} alt={`${playerProfile.name}立绘`} />
              <span className="profile-portrait-realm">{state.cultivation.level}境</span>
              <div className="profile-portrait-nameplate">
                <small>万化道躯</small>
                <strong>{playerProfile.name}</strong>
              </div>
            </div>
            <div className="profile-summary">
              <span>主角 · 鹿石宗弟子</span>
              <h3>{playerProfile.name}</h3>
              <p>身无灵根，身怀先天万化道躯。{fateNames[playerProfile.fate]}，携带 {playerProfile.perks.length} 项前世天赋踏入仙途。</p>
              <div className="profile-vitals" aria-label="核心战斗状态">
                <div>
                  <span>气血</span>
                  <strong>{maxHp} / {maxHp}</strong>
                  <i><b style={{ width: "100%" }} /></i>
                </div>
                <div>
                  <span>灵气</span>
                  <strong>60 / 60</strong>
                  <i><b style={{ width: "100%" }} /></i>
                </div>
                <div>
                  <span>修为</span>
                  <strong>{state.cultivation.realmProgress} / 100</strong>
                  <i><b style={{ width: `${state.cultivation.realmProgress}%` }} /></i>
                </div>
              </div>
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

          {profileTab === "背包" && (
          <section className="profile-section bag-section">
            <div className="profile-section-title">
              <h3>背包</h3>
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
                <img className="profile-created-outfit" src={playerOutfitAssets[playerProfile.outfit]} alt="" aria-hidden="true" />
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
                        setBagNotice(`${item.name}已选中；可前往炼器坊继续炼制或淬炼。`);
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
          <section className="profile-section loadout-section method-builder">
            <div className="profile-section-title">
              <div>
                <h3>功法经脉</h3>
                <small>主修功法同时驱动自动攻击、灵根转化与护体被动</small>
              </div>
              <span>{lockLoadout ? "战斗/事件中锁定" : "点击经脉节点查看 · 右侧切换主修"}</span>
            </div>
            <div className="loadout-panel-layout">
              <div className="method-circuit-board">
                <div className="method-circuit">
                  <div className="method-circuit-portrait">
                    <img src={assetPath("assets/tapflow/loadout/wanhua-body.webp")} alt="" aria-hidden="true" />
                    <span>{combatProfile.method.element}</span>
                  </div>
                  <i className="circuit-line circuit-line-a" aria-hidden="true" />
                  <i className="circuit-line circuit-line-b" aria-hidden="true" />
                  <i className="circuit-line circuit-line-c" aria-hidden="true" />
                  {(Object.keys(methodNodeDetails) as MethodNode[]).map((node) => {
                    const detail = methodNodeDetails[node];
                    const nodeLabels: Record<MethodNode, string> = {
                      method: "主修",
                      attack: "攻",
                      root: "灵",
                      passive: "御",
                    };
                    return (
                      <button
                        key={node}
                        type="button"
                        className={`method-node method-node-${node} ${methodNode === node ? "active" : ""}`}
                        aria-pressed={methodNode === node}
                        onClick={() => {
                          playSceneClick();
                          setMethodNode(node);
                        }}
                      >
                        <i aria-hidden="true">{nodeLabels[node]}</i>
                        <span>{detail.kicker}</span>
                        <strong>{detail.title}</strong>
                      </button>
                    );
                  })}
                </div>
                <div className="loadout-focus-card">
                  <span>{activeMethodNode.kicker} · 已接入战斗</span>
                  <strong>{activeMethodNode.title}</strong>
                  <b>{activeMethodNode.value}</b>
                  <small>{activeMethodNode.description}</small>
                </div>
              </div>

              <aside className="loadout-side-list">
                <div className="loadout-list-heading">
                  <div>
                    <span>已习得功法</span>
                    <strong>{methodIds.length} / 6</strong>
                  </div>
                  <small>切换后自动保存，并在下一场战斗生效</small>
                </div>
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
                        <img
                          className="method-rank-frame"
                          src={rankFrameAssets[method.rank]}
                          alt=""
                          aria-hidden="true"
                        />
                        {method.icon ? (
                          <img className="method-card-icon" src={method.icon} alt="" aria-hidden="true" />
                        ) : (
                          <i style={{ background: method.color }}>{method.element}</i>
                        )}
                        <strong>{method.name}{active ? " · 主修中" : ""}</strong>
                        <span>
                          {method.element} · {method.rank} · {method.role}
                        </span>
                        <small>
                          {method.attackName} · 伤害{method.attackDamage} · 间隔{method.attackInterval}s ·
                          防御{method.defense} · 回血{method.regen}/秒
                        </small>
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
              <div>
                <h3>法术构筑</h3>
                <small>术法 + 技法 + 两个秘法，共同组成空格主动技能</small>
              </div>
              <span>炼气期丹海 · 1 个黄阶法术位 · 4/4 构件</span>
            </div>

            <div className="loadout-panel-layout spell-loadout-layout">
              <div className="spell-circuit-board">
                <div className="spell-circuit">
                  <div className="spell-circuit-avatar">
                    <img src={assetPath("assets/tapflow/loadout/wanhua-body.webp")} alt="" aria-hidden="true" />
                    <span>{combatProfile.method.element}系灵气</span>
                  </div>
                  <img
                    className="spell-flow-arrow"
                    src={assetPath("assets/tapflow/loadout/spell-arrow.webp")}
                    alt=""
                    aria-hidden="true"
                  />
                  {(["spell", "technique", "secret1", "secret2", "result"] as SpellBuilderSlot[]).map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      className={`spell-circuit-slot spell-circuit-${slot} ${spellBuilderSlot === slot ? "active" : ""}`}
                      aria-pressed={spellBuilderSlot === slot}
                      onClick={() => {
                        playSceneClick();
                        setSpellBuilderSlot(slot);
                      }}
                    >
                      <kbd>{slot === "result" ? "SPACE" : String((["spell", "technique", "secret1", "secret2"] as SpellBuilderSlot[]).indexOf(slot) + 1).padStart(2, "0")}</kbd>
                      <small>{spellSlotMeta[slot].eyebrow}</small>
                      <strong>{spellSlotMeta[slot].title}</strong>
                      <span>{spellSlotMeta[slot].hint}</span>
                    </button>
                  ))}
                </div>
                <div className="spell-result-readout">
                  <div>
                    <span>最终伤害</span>
                    <strong>{combatProfile.activeDamage}</strong>
                    <small>BOSS {combatProfile.bossDamage} · 暴击 {combatProfile.critDamage}</small>
                  </div>
                  <div>
                    <span>施法参数</span>
                    <strong>{combatProfile.spell.manaCost} 灵力 / {combatProfile.spell.cooldown}s</strong>
                    <small>射程 {combatProfile.range} · 暴击率 {Math.round(combatProfile.critChance * 100)}%</small>
                  </div>
                  <div>
                    <span>五行共鸣</span>
                    <strong>{combatProfile.elementMatch ? "完全匹配" : "跨系 70%"}</strong>
                    <small>{combatProfile.method.element}功法 + {combatProfile.spell.element}术法</small>
                  </div>
                </div>
                {lockLoadout && <p className="loadout-lock">当前已进入事件或战斗，配置已锁定。</p>}
              </div>

              <aside className="spell-side-list contextual-slot-editor">
                <div className="slot-editor-heading">
                  <div>
                    <span>{spellSlotMeta[spellBuilderSlot].eyebrow}</span>
                    <strong>{spellSlotMeta[spellBuilderSlot].title}</strong>
                  </div>
                  <small>{spellSlotMeta[spellBuilderSlot].hint}</small>
                </div>

                {spellBuilderSlot === "spell" && (
                <div className="slot-group">
                  <h4>选择术法</h4>
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
                )}

                {spellBuilderSlot === "technique" && (
                <div className="slot-group">
                  <h4>选择技法</h4>
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
                )}

                {(spellBuilderSlot === "secret1" || spellBuilderSlot === "secret2") && (
                  <div className="slot-group">
                    <h4>选择秘法 · 槽位 {spellBuilderSlot === "secret1" ? "一" : "二"}</h4>
                    <div className="slot-options secret-options">
                      {secretIds.map((id) => {
                        const secret = secretCatalog[id];
                        const slotIndex = spellBuilderSlot === "secret1" ? 0 : 1;
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
                )}

                {spellBuilderSlot === "result" && (
                  <div className="spell-combination-summary">
                    <span>空格主动技能</span>
                    <h4>{combatProfile.activeSkillName}</h4>
                    <p>{combatProfile.spell.effect}</p>
                    <dl>
                      <div><dt>术法</dt><dd>{combatProfile.spell.name} · {combatProfile.spell.element}系命中特效</dd></div>
                      <div><dt>技法</dt><dd>{combatProfile.technique.name} · ×{combatProfile.technique.damageMultiplier}</dd></div>
                      <div><dt>秘法一</dt><dd>{combatProfile.secrets[0].name} · {combatProfile.secrets[0].effectValue}</dd></div>
                      <div><dt>秘法二</dt><dd>{combatProfile.secrets[1].name} · {combatProfile.secrets[1].effectValue}</dd></div>
                    </dl>
                    <div className="combination-total">
                      <strong>伤害 {combatProfile.activeDamage}</strong>
                      <span>冷却 {combatProfile.spell.cooldown}s</span>
                      <span>灵力 {combatProfile.spell.manaCost}</span>
                    </div>
                  </div>
                )}
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
                <i aria-hidden="true">
                  {profileTabIconAssets[item.id] ? (
                    <img src={profileTabIconAssets[item.id]} alt="" />
                  ) : (
                    item.id.slice(0, 1)
                  )}
                </i>
                <span>
                  <strong>{item.id}</strong>
                  <small>{item.note}</small>
                </span>
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
            <h3>篇章结构</h3>
            <div className="story-chapter-grid">
              {storyChapters.map((chapter) => (
                <article key={chapter.title} className={chapter.title === storyChapter.title ? "active" : ""}>
                  <span>第{chapter.startYear}-{chapter.endYear}年</span>
                  <strong>{chapter.title} · {chapter.realm}</strong>
                  <small>{chapter.theme}</small>
                </article>
              ))}
            </div>
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

    if (panel === "事件") {
      return (
        <section className="event-journal">
          <div className="event-journal-summary">
            <div>
              <span>修仙历程</span>
              <h3>{storyChapter.title} · {storyChapter.realm}</h3>
              <p>第{state.year}年{nextMilestone ? ` · 下个节点：第${nextMilestone.year}年 ${nextMilestone.title}` : " · 已抵达终局"}</p>
            </div>
            <button
              type="button"
              className="event-travel-button"
              disabled={Boolean(busyAction)}
              onClick={() => {
                playSceneClick();
                onAction("change_scene:teleport_array");
                onClose();
              }}
            >
              前往传送阵
            </button>
          </div>

          <div className="event-journal-meta">
            <span>已完成事件：{completedText}</span>
            <span>当前主线：{storyChapter.theme}</span>
          </div>

          <ol className="story-timeline" aria-label="第0年至第100年大事记">
            {storyMilestones.filter((milestone) => milestone.year <= 100).map((milestone) => {
              const status = getMilestoneStatus(milestone);
              return (
                <li key={`${milestone.year}-${milestone.title}`} data-state={status.key}>
                  <span className="story-timeline-year">第{milestone.year}年</span>
                  <div className="story-timeline-content">
                    <span>{milestone.chapter} · {milestone.category}</span>
                    <strong>{milestone.title}</strong>
                    <p>{milestone.summary}</p>
                  </div>
                  <em>{status.label}</em>
                </li>
              );
            })}
          </ol>
        </section>
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
    <div
      className={panel === "我的" ? "panel-backdrop profile-backdrop" : "panel-backdrop"}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className={
          panel === "我的"
            ? `utility-panel profile-utility ${profileTab === "功法" || profileTab === "术法" ? "loadout-art-utility" : ""}`
            : panel === "门规" || panel === "手记"
              ? "utility-panel record-utility"
              : "utility-panel"
        }
      >
        <header>
          {panel === "我的" ? (
            <div className="profile-heading">
              <h2>人物面板</h2>
              <span>万化道躯 · 角色信息与战前配置</span>
            </div>
          ) : (
            <h2>{panel}</h2>
          )}
          <button
            className={panel === "我的" ? "profile-close-button" : undefined}
            aria-label={panel === "我的" ? "返回场景" : "关闭"}
            title={panel === "我的" ? "返回场景" : "关闭"}
            onClick={onClose}
          >
            {panel === "我的" ? (
              <img src={assetPath("assets/tapflow/loadout/wanhua-window-close.webp")} alt="" aria-hidden="true" />
            ) : (
              "关闭"
            )}
          </button>
        </header>
        <div
          className={
            panel === "我的"
              ? "panel-body profile-body"
              : panel === "门规" || panel === "手记"
                ? "panel-body record-body"
                : "panel-body"
          }
        >
          {renderPanelBody()}
        </div>
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
  enemyDamage: number;
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
  methodId?: DemoMethodId;
  spellId?: DemoSpellId;
  critChance?: number;
  armorPierce?: number;
  kind: "auto" | "manual" | "enemy" | "skill";
  visual: "orb" | "fireball" | "goldSlash";
  angle: number;
  scale: number;
};

type CombatParticle = {
  id: number;
  x: number;
  y: number;
  r: number;
  life: number;
  maxLife: number;
  color: string;
  visual: "ring" | "fireBurst" | "fireDrop" | "hitFire" | "flash" | "goldSlash";
  angle: number;
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
      enemyDamage: 7,
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
      enemyDamage: 8,
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
      enemyDamage: 9,
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
    targetKills: node.id === "minions" ? 22 : 12,
    surviveSeconds: 0,
    boss: false,
    bossName: "",
    bossHp: 0,
    enemyHp: node.id === "minions" ? 28 : 16,
    enemySpeed: node.id === "minions" ? 112 : 72,
    enemyDamage: node.id === "minions" ? 8 : 5,
    spawnEvery: node.id === "minions" ? 0.7 : 1.45,
    maxEnemies: node.id === "minions" ? 20 : 3,
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
    damage: kind === "boss" ? 18 : config.enemyDamage,
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
  options: Partial<
    Pick<
      CombatProjectile,
      "range" | "pierce" | "color" | "methodId" | "spellId" | "critChance" | "armorPierce" | "visual" | "scale"
    >
  > = {},
) {
  const speed = Math.hypot(vx, vy) || 1;
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
    methodId: options.methodId,
    spellId: options.spellId,
    critChance: options.critChance,
    armorPierce: options.armorPierce,
    kind,
    visual: options.visual ?? "orb",
    angle: Math.atan2(vy / speed, vx / speed),
    scale: options.scale ?? 1,
  });
}

function pushCombatParticle(
  runtime: CombatRuntime,
  x: number,
  y: number,
  r: number,
  color: string,
  life = 0.45,
  visual: CombatParticle["visual"] = "ring",
  angle = 0,
) {
  runtime.particles.push({
    id: runtime.nextId++,
    x,
    y,
    r,
    life,
    maxLife: life,
    color,
    visual,
    angle,
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
      methodId: profile.loadout.methodId,
      pierce: isGoldMethod && kind !== "manual" ? 1 : 0,
      range: kind === "manual" ? 680 : 740,
      visual: isFireMethod ? "fireball" : isGoldMethod ? "goldSlash" : "orb",
      scale: kind === "manual" ? 0.76 : 0.66,
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
    spellId === "huodan" ? "fireBurst" : spellId === "jinmang" ? "flash" : "ring",
  );
  if (spellId === "jinmang") {
    pushCombatParticle(runtime, enemy.x, enemy.y, enemy.r + 20, "rgba(255, 231, 143, 0.58)", 0.18, "goldSlash", Math.random() * Math.PI);
  }
  if (spellId === "huodan" && enemy.burnTimer > 0) {
    pushCombatParticle(runtime, enemy.x, enemy.y, enemy.r + 22, "rgba(255, 119, 55, 0.5)", 0.24, "hitFire");
  }
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
  setCombatNotice(runtime, `${profile.activeSkillName} · ${profile.technique.name}`);

  if (profile.loadout.spellSlot.techniqueId === "ring") {
    const radius = profile.range;
    pushCombatParticle(
      runtime,
      runtime.player.x,
      runtime.player.y,
      radius,
      `${profile.spell.color}88`,
      0.42,
      profile.loadout.spellSlot.spellId === "huodan" ? "fireBurst" : "ring",
    );
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
    pushCombatParticle(
      runtime,
      targetX,
      targetY,
      112,
      `${profile.spell.color}aa`,
      0.42,
      profile.loadout.spellSlot.spellId === "huodan" ? "fireDrop" : "ring",
    );
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
      visual:
        profile.loadout.spellSlot.spellId === "huodan"
          ? "fireball"
          : profile.loadout.spellSlot.spellId === "jinmang"
            ? "goldSlash"
            : "orb",
      scale: profile.loadout.spellSlot.spellId === "huodan" ? 0.9 : 0.8,
    },
  );
}

const combatFxAssetGroups = {
  fireball: ["fireball-00.png", "fireball-01.png", "fireball-02.png", "fireball-03.png", "fireball-04.png"],
  fireBurst: [
    "fire-burst-00.png",
    "fire-burst-01.png",
    "fire-burst-02.png",
    "fire-burst-03.png",
    "fire-burst-04.png",
    "fire-burst-05.png",
    "fire-burst-06.png",
  ],
  fireDrop: ["fire-drop-00.png", "fire-drop-01.png", "fire-drop-02.png", "fire-drop-03.png"],
  hitFire: ["hit-fire-00.png", "hit-fire-01.png", "hit-fire-02.png", "hit-fire-03.png", "hit-fire-04.png"],
  utility: ["impact-flash.png", "gold-slash.png", "dash-flash.png"],
} as const;

type CombatImageCache = Record<string, HTMLImageElement>;

function useCombatImages(config: CombatConfig) {
  const imagesRef = useRef<CombatImageCache>({});

  useEffect(() => {
    const sources: Record<string, string> = {
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
    for (const [group, files] of Object.entries(combatFxAssetGroups)) {
      files.forEach((file, index) => {
        sources[`${group}-${index}`] = assetPath(`assets/tapflow/combat/${file}`);
      });
    }

    for (const [key, src] of Object.entries(sources)) {
      const image = new Image();
      image.src = src;
      imagesRef.current[key] = image;
    }
  }, [config.theme]);

  return imagesRef;
}

function imageReady(image: HTMLImageElement | undefined) {
  return Boolean(image?.complete && image.naturalWidth > 0);
}

function animatedCombatImage(
  images: CombatImageCache,
  group: keyof typeof combatFxAssetGroups,
  elapsed: number,
  fps: number,
) {
  const count = combatFxAssetGroups[group].length;
  const frame = Math.floor(elapsed * fps) % count;
  return images[`${group}-${frame}`];
}

function drawCenteredImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  angle = 0,
  alpha = 1,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha *= alpha;
  ctx.drawImage(image, -width / 2, -height / 2, width, height);
  ctx.restore();
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
        runtime.autoCd = Math.max(0.28, profile.method.attackInterval);
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
            if (
              projectile.methodId === "yanxin_jue" &&
              (projectile.kind === "auto" || projectile.kind === "manual")
            ) {
              const splashDamage = Math.max(1, Math.round(projectile.damage * 0.35));
              for (const nearbyEnemy of runtime.enemies) {
                if (
                  nearbyEnemy.id !== enemy.id &&
                  distance(enemy.x, enemy.y, nearbyEnemy.x, nearbyEnemy.y) <= enemy.r + nearbyEnemy.r + 42
                ) {
                  applyEnemySkillHit(runtime, nearbyEnemy, splashDamage, undefined);
                }
              }
              pushCombatParticle(runtime, enemy.x, enemy.y, enemy.r + 34, "rgba(255, 119, 55, 0.58)", 0.32, "hitFire");
            }
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

      const images = imagesRef.current;
      for (const projectile of runtime.projectiles) {
        const alpha = clampNumber(projectile.life / 0.18, 0.15, 1);
        if (projectile.visual === "fireball") {
          const image = animatedCombatImage(images, "fireball", runtime.elapsed + projectile.id * 0.017, 18);
          if (imageReady(image)) {
            const size = projectile.kind === "skill" ? 86 * projectile.scale : 70 * projectile.scale;
            drawCenteredImage(ctx, image, projectile.x, projectile.y, size * 2.23, size, projectile.angle, alpha);
            continue;
          }
        }
        if (projectile.visual === "goldSlash") {
          const image = images["utility-1"];
          if (imageReady(image)) {
            const width = projectile.kind === "skill" ? 96 : 76;
            drawCenteredImage(ctx, image, projectile.x, projectile.y, width, width * 0.32, projectile.angle, alpha);
            continue;
          }
        }

        ctx.beginPath();
        ctx.fillStyle = projectile.kind === "enemy" ? "rgba(255, 86, 83, 0.9)" : projectile.color;
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = projectile.kind === "enemy" ? 10 : projectile.kind === "skill" ? 18 : 14;
        ctx.arc(projectile.x, projectile.y, projectile.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

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
        const age = Math.max(0, particle.maxLife - particle.life);
        if (particle.visual === "fireBurst") {
          const image = animatedCombatImage(images, "fireBurst", age, 18);
          if (imageReady(image)) {
            const size = particle.r * (1.35 - alpha * 0.1);
            drawCenteredImage(ctx, image, particle.x, particle.y, size, size, particle.angle, Math.min(0.9, alpha + 0.18));
            continue;
          }
        }
        if (particle.visual === "fireDrop") {
          const image = animatedCombatImage(images, "fireDrop", age, 14);
          if (imageReady(image)) {
            const width = particle.r * 0.96;
            drawCenteredImage(
              ctx,
              image,
              particle.x,
              particle.y - particle.r * 0.12,
              width,
              width * 1.67,
              particle.angle,
              Math.min(0.86, alpha + 0.12),
            );
            continue;
          }
        }
        if (particle.visual === "hitFire") {
          const image = animatedCombatImage(images, "hitFire", age, 16);
          if (imageReady(image)) {
            const width = particle.r * 0.9;
            drawCenteredImage(ctx, image, particle.x, particle.y - particle.r * 0.25, width, width * 1.36, particle.angle, alpha);
            continue;
          }
        }
        if (particle.visual === "flash") {
          const image = images["utility-0"];
          if (imageReady(image)) {
            const size = particle.r * (1.1 - alpha * 0.18);
            drawCenteredImage(ctx, image, particle.x, particle.y, size, size, particle.angle, alpha);
            continue;
          }
        }
        if (particle.visual === "goldSlash") {
          const image = images["utility-1"];
          if (imageReady(image)) {
            const width = particle.r * 1.5;
            drawCenteredImage(ctx, image, particle.x, particle.y, width, width * 0.32, particle.angle, alpha);
            continue;
          }
        }
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
      <div className="combat-build-strip" aria-label="当前战斗配置">
        <span><b>功</b><small>主修</small><strong>{profile.method.name}</strong></span>
        <span><b>术</b><small>术法</small><strong>{profile.spell.name}</strong></span>
        <span><b>技</b><small>技法</small><strong>{profile.technique.name}</strong></span>
        <span><b>秘</b><small>秘法一</small><strong>{profile.secrets[0].name}</strong></span>
        <span><b>秘</b><small>秘法二</small><strong>{profile.secrets[1].name}</strong></span>
      </div>
      <div className="combat-skillbar">
        <span>WASD/方向键移动</span>
        <span>自动 · {profile.method.attackName}</span>
        <span>鼠标 · 灵力飞射</span>
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
  const primaryAction = node.continueScene ? (`change_scene:${node.continueScene}` as DemoAction) : "advance_event";
  const speakerLabel = getDialogueSpeakerName(node.speaker);
  const canClickToAdvance = !busy && node.mode !== "choice" && node.mode !== "battle";
  const modeText: Record<DemoEventNode["mode"], string> = {
    dialogue: "剧情",
    choice: "抉择",
    battle: "战斗",
    reward: "结算",
  };
  const continueText =
    node.mode === "choice"
      ? "选择回应"
      : node.mode === "battle"
        ? "进入战斗"
        : getEventButtonLabel(node, busy);
  const rewardItems = node.mode === "reward" ? Array.from(node.text.matchAll(/「([^」]+)」/g)).map((match) => match[1]) : [];

  function advancePrimary() {
    if (!canClickToAdvance) return;
    playSceneClick();
    onAction(primaryAction);
  }

  if (node.mode === "reward") {
    return (
      <>
        <section className="event-brief vn-event-brief" aria-label="当前事件">
          <span>{definition.category}</span>
          <strong>{definition.title}</strong>
          <small>{getVisualStageTitle(node.visualStage)}</small>
        </section>

        <section className="event-reward-panel" aria-label="系统获得提示" role="status">
          <span>系统提示</span>
          <h2>获得功法</h2>
          <p>{node.text}</p>
          <div className="event-reward-items">
            {(rewardItems.length > 0 ? rewardItems : [definition.rewardText]).map((item) => (
              <strong key={item}>{item}</strong>
            ))}
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              playSceneClick();
              onAction(primaryAction);
            }}
          >
            {getEventButtonLabel(node, busy)}
          </button>
        </section>
      </>
    );
  }

  return (
    <>
      <section className="event-brief vn-event-brief" aria-label="当前事件">
        <span>{definition.category}</span>
        <strong>{definition.title}</strong>
        <small>{getVisualStageTitle(node.visualStage)}</small>
      </section>

      <section
        className={`event-story-panel vn-dialogue-panel mode-${node.mode}`}
        aria-label="事件剧情"
        role={canClickToAdvance ? "button" : undefined}
        tabIndex={canClickToAdvance ? 0 : undefined}
        onClick={advancePrimary}
        onKeyDown={(event) => {
          if (!canClickToAdvance) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            advancePrimary();
          }
        }}
      >
        <div className="event-story-main">
          <div className="event-story-speaker">
            <strong>{speakerLabel}</strong>
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
                  {busyAction === choice.action ? "翻页中..." : choice.label}
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
                onAction(primaryAction);
              }}
            >
              {getEventButtonLabel(node, busy)}
            </button>
          )}
        </div>
        <span className="vn-continue-hint">{busy ? "翻页中..." : `......${continueText}`}</span>
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
  handnoteInitialTab,
  expansionBusy,
  musicEnabled,
  sceneFeedback,
  systemPrompt,
  onAction,
  onSaveExpansion,
  onReset,
  onOpenPanel,
  onOpenSystem,
  onClosePanel,
  onCloseSceneFeedback,
  onCloseSystemPrompt,
  onToggleMusic,
  onReplayOpening,
}: {
  save: DemoSave;
  events: Record<DemoEventId, DemoEventDefinition>;
  online: boolean;
  busyAction: DemoAction | "reset" | null;
  panel: Panel | null;
  profileInitialTab: ProfileTab;
  handnoteInitialTab: HandnoteTab;
  expansionBusy: boolean;
  musicEnabled: boolean;
  sceneFeedback: SceneActionFeedback | null;
  systemPrompt: SystemPrompt | null;
  onAction: (action: DemoAction, payload?: DemoActionPayload) => void;
  onSaveExpansion: (expansion: ExpansionState, options?: { elapsedMonths?: number; activity?: ExpansionActivity }) => Promise<void>;
  onReset: () => void;
  onOpenPanel: (panel: Panel, target?: ProfileTab | HandnoteTab) => void;
  onOpenSystem: (screen: SystemScreen) => void;
  onClosePanel: () => void;
  onCloseSceneFeedback: () => void;
  onCloseSystemPrompt: () => void;
  onToggleMusic: () => void;
  onReplayOpening: () => void;
}) {
  const state = save.state;
  const scene = getScene(state);
  const [npcInteractionOpen, setNpcInteractionOpen] = useState(false);
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
  const transitionSignature = getSceneTransitionSignature(scene, activeEvent);
  const currentPortrait =
    activeEvent && activeEvent.node.mode !== "battle"
      ? getSpeakerPortrait(dialogueSpeaker, activeEvent.node)
      : activeEvent
        ? null
        : getActorPortrait(config.actor);
  const busy = Boolean(busyAction);

  useEffect(() => {
    setNpcInteractionOpen(false);
  }, [scene]);

  const stageStyle = {
    "--scene-bg": `url("${assetPath(`assets/tapflow/scenes/${scene.replace("_", "-")}.webp`)}")`,
    "--visual-bg": activeEvent ? getVisualBackground(activeEvent.node.visualStage) : undefined,
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
          <div key={`curtain-${transitionSignature}`} className="scene-transition-curtain" />
          <div key={transitionSignature} className="stage-bg scene-background-enter">
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
          onOpenSystem={onOpenSystem}
        />
      )}
      <section
        className={`stage scene-${scene} accent-${config.accent} ${
          inBattle ? "battle-stage" : ""
        } ${visualStage ? `event-stage visual-${visualStage}` : ""}`}
      >
        <div key={`curtain-${transitionSignature}`} className="scene-transition-curtain" />
        <div key={transitionSignature} className="stage-bg scene-background-enter">
          {activeEvent ? (
            <EventStageObjects node={activeEvent.node} />
          ) : (
            <SceneObjects scene={scene} inBattle={inBattle} />
          )}
        </div>

        {!activeEvent && (
          <aside className="scene-left-rail" aria-label="场景操作">
            <SceneActionPanel
              currentScene={scene}
              state={state}
              events={events}
              busy={busy}
              onAction={onAction}
              onOpenPanel={onOpenPanel}
              onOpenSystem={onOpenSystem}
            />
            <SceneNavigator
              currentScene={scene}
              busy={busy}
              onAction={onAction}
            />
          </aside>
        )}
        {activeEvent && currentPortrait && <CharacterPortrait portrait={currentPortrait} />}

        {activeEvent ? (
          <ActiveEventOverlay activeEvent={activeEvent} busyAction={busyAction} onAction={onAction} />
        ) : currentPortrait ? (
          <SceneNpcStrip
            portrait={currentPortrait}
            actorName={actorName}
            bond={actorBond}
            onInteract={() => setNpcInteractionOpen(true)}
          />
        ) : null}
      </section>

      {npcInteractionOpen && currentPortrait && !activeEvent && (
        <SceneNpcInteractionModal
          scene={scene}
          portrait={currentPortrait}
          actorName={actorName}
          bond={actorBond}
          busy={busy}
          onAction={onAction}
          onClose={() => setNpcInteractionOpen(false)}
        />
      )}

      {sceneFeedback && !activeEvent && (
        <SceneActionFeedbackModal
          feedback={sceneFeedback}
          onClose={onCloseSceneFeedback}
        />
      )}

      {panel && !activeEvent && (
        <UtilityPanel
          panel={panel}
          state={state}
          events={events}
          busyAction={busyAction}
          initialProfileTab={profileInitialTab}
          initialHandnoteTab={handnoteInitialTab}
          currentScene={scene}
          expansionBusy={expansionBusy}
          musicEnabled={musicEnabled}
          onAction={onAction}
          onSaveExpansion={onSaveExpansion}
          onClose={onClosePanel}
          onReset={onReset}
          onToggleMusic={onToggleMusic}
          onReplayOpening={onReplayOpening}
        />
      )}

      {systemPrompt && (
        <SystemPromptModal
          prompt={systemPrompt}
          onClose={onCloseSystemPrompt}
        />
      )}
    </main>
  );
}

type GameFlow = "menu" | "creation" | "cg" | "game";

function App() {
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [health, setHealth] = useState<ApiHealth | null>(null);
  const [busyAction, setBusyAction] = useState<DemoAction | "reset" | null>(null);
  const [expansionBusy, setExpansionBusy] = useState(false);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [systemScreen, setSystemScreen] = useState<SystemScreen | null>(null);
  const [flow, setFlow] = useState<GameFlow>("menu");
  const [profileInitialTab, setProfileInitialTab] = useState<ProfileTab>("属性");
  const [handnoteInitialTab, setHandnoteInitialTab] = useState<HandnoteTab>("鹿真人");
  const [sceneFeedback, setSceneFeedback] = useState<SceneActionFeedback | null>(null);
  const [systemPrompt, setSystemPrompt] = useState<SystemPrompt | null>(null);
  const [musicEnabled, setMusicEnabled] = useState(
    () => localStorage.getItem("wanhua-ambient-music-muted") !== "1",
  );
  const entryCgFinishingRef = useRef(false);
  const actionQueueRef = useRef(Promise.resolve());
  const optimisticVersionRef = useRef(0);

  const ambientMusicEnabled = useMemo(() => {
    if (!musicEnabled) return false;
    if (loadState.status !== "ready") return false;
    if (flow === "menu" || flow === "creation") return true;
    if (flow !== "game") return false;
    return loadState.save.state.location === "home" && !loadState.save.state.activeEvent;
  }, [flow, loadState, musicEnabled]);

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

  function openPanel(nextPanel: Panel, target?: ProfileTab | HandnoteTab) {
    if (nextPanel === "我的") setProfileInitialTab((target as ProfileTab) ?? "属性");
    if (nextPanel === "手记") {
      const scene: DemoScene =
        loadState.status === "ready" ? loadState.save.state.scene ?? "plaza" : "plaza";
      setHandnoteInitialTab(
        (target as HandnoteTab) ?? sceneHandnoteTargets[scene]?.tab ?? "鹿真人",
      );
    }
    setPanel(nextPanel);
  }

  async function perform(action: DemoAction, requestPayload?: DemoActionPayload) {
    const beforeSave = loadState.status === "ready" ? loadState.save : null;
    const beforeState = beforeSave?.state ?? null;
    const optimisticSave =
      beforeSave && loadState.status === "ready"
        ? getOptimisticEventSave(beforeSave, action, loadState.events)
        : null;
    const isOptimistic = Boolean(optimisticSave);
    const requestVersion = isOptimistic ? ++optimisticVersionRef.current : optimisticVersionRef.current;

    if (optimisticSave) replaceSave(optimisticSave);
    setBusyAction(isOptimistic ? null : action);

    const run = async () => {
      try {
        const responsePayload = await fetchJson<SaveResponse>("/demo/action", {
          method: "POST",
          body: JSON.stringify({ action, ...requestPayload }),
        });
        if (!isOptimistic || requestVersion === optimisticVersionRef.current) {
          replaceSave(responsePayload.save);
        }
        const rewardPrompt = createRewardPrompt(
          beforeState,
          responsePayload.save.state,
          feedbackActions.includes(action) ? "获得物品" : "获得奖励",
        );
        if (rewardPrompt) {
          setSceneFeedback(null);
          setSystemPrompt(rewardPrompt);
        } else if (feedbackActions.includes(action)) {
          setSceneFeedback(createSceneActionFeedback(beforeState, responsePayload.save.state));
        }
      } catch (error) {
        if (beforeSave && (!isOptimistic || requestVersion === optimisticVersionRef.current)) {
          replaceSave(beforeSave);
        } else if (!beforeSave) {
          setLoadState({
            status: "error",
            message: error instanceof Error ? error.message : "操作失败",
          });
        }
      } finally {
        if (!isOptimistic) setBusyAction(null);
      }
    };

    const request = actionQueueRef.current.then(run, run);
    actionQueueRef.current = request.then(() => undefined, () => undefined);
    await request;
  }

  async function saveExpansion(
    expansion: ExpansionState,
    options?: { elapsedMonths?: number; activity?: ExpansionActivity },
  ) {
    const beforeState = loadState.status === "ready" ? loadState.save.state : null;
    setExpansionBusy(true);
    try {
      const payload = await fetchJson<SaveResponse>("/demo/expansion", {
        method: "PUT",
        body: JSON.stringify({
          expansion,
          elapsedMonths: options?.elapsedMonths,
          activity: options?.activity,
        }),
      });
      replaceSave(payload.save);
      const rewardPrompt = createRewardPrompt(beforeState, payload.save.state, "获得物品");
      if (rewardPrompt) {
        setSceneFeedback(null);
        setSystemPrompt(rewardPrompt);
      }
    } catch (error) {
      setLoadState({
        status: "error",
        message: error instanceof Error ? error.message : "扩展存档同步失败",
      });
      throw error;
    } finally {
      setExpansionBusy(false);
    }
  }

  async function reset(): Promise<DemoSave | null> {
    setBusyAction("reset");
    try {
      const payload = await fetchJson<SaveResponse>("/demo/reset", {
        method: "POST",
      });
      replaceSave(payload.save);
      setPanel(null);
      setSystemScreen(null);
      setSceneFeedback(null);
      setSystemPrompt(null);
      return payload.save;
    } catch (error) {
      setLoadState({
        status: "error",
        message: error instanceof Error ? error.message : "重置失败",
      });
      return null;
    } finally {
      setBusyAction(null);
    }
  }

  async function startNewGame() {
    const save = await reset();
    if (save) setFlow("creation");
  }

  async function finishCharacterCreation(profile: PlayerProfile) {
    if (loadState.status !== "ready") return;
    const expansion = getExpansion(loadState.save.state.expansion);
    await saveExpansion({ ...expansion, profile });
    setFlow("cg");
  }

  async function finishEntryCg() {
    if (loadState.status !== "ready" || entryCgFinishingRef.current) return;
    entryCgFinishingRef.current = true;
    try {
      await perform("start_event:intro_lushi");
      setFlow("game");
    } finally {
      entryCgFinishingRef.current = false;
    }
  }

  function toggleAmbientMusic() {
    setMusicEnabled((current) => {
      const next = !current;
      localStorage.setItem("wanhua-ambient-music-muted", next ? "0" : "1");
      return next;
    });
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

  const state = loadState.save.state;
  const expansion = getExpansion(state.expansion);

  if (systemScreen) {
    return (
      <MajorSystemScreen
        screen={systemScreen}
        expansion={expansion}
        year={state.year}
        month={state.month}
        realm={state.cultivation.level}
        busy={expansionBusy || Boolean(busyAction)}
        readOnly={flow === "menu"}
        onClose={() => setSystemScreen(null)}
        onSave={saveExpansion}
        onStartLegacyEvent={(eventId) => {
          setSystemScreen(null);
          setFlow("game");
          void perform(`start_event:${eventId === 10 ? "mouse_cave_treasure" : "wish_eater_bridge"}`);
        }}
      />
    );
  }

  if (flow === "menu") {
    return (
      <StartMenu
        hasSave={expansion.profile.created}
        musicEnabled={musicEnabled}
        completedCount={expansion.story.completed.length}
        onNewGame={() => void startNewGame()}
        onContinue={() => setFlow(expansion.profile.created ? "game" : "creation")}
        onArchive={() => setSystemScreen("quests")}
        onToggleMusic={toggleAmbientMusic}
      />
    );
  }

  if (flow === "creation") {
    return (
      <CharacterCreation
        initialProfile={expansion.profile}
        busy={expansionBusy || Boolean(busyAction)}
        onBackToMenu={() => setFlow("menu")}
        onComplete={(profile) => void finishCharacterCreation(profile)}
      />
    );
  }

  if (flow === "cg") {
    return <EntryCg onDone={() => void finishEntryCg()} />;
  }

    return (
      <HomeScene
        save={loadState.save}
        events={loadState.events}
        online={health?.supabase?.configured ?? false}
        busyAction={busyAction}
        panel={panel}
        profileInitialTab={profileInitialTab}
        handnoteInitialTab={handnoteInitialTab}
        expansionBusy={expansionBusy}
        musicEnabled={musicEnabled}
        sceneFeedback={sceneFeedback}
        systemPrompt={systemPrompt}
        onAction={(action, payload) => void perform(action, payload)}
        onSaveExpansion={saveExpansion}
        onReset={() => void reset()}
        onOpenPanel={openPanel}
        onOpenSystem={(screen) => {
          setPanel(null);
          setSystemScreen(screen);
      }}
      onClosePanel={() => setPanel(null)}
      onCloseSceneFeedback={() => setSceneFeedback(null)}
      onCloseSystemPrompt={() => setSystemPrompt(null)}
      onToggleMusic={toggleAmbientMusic}
      onReplayOpening={() => {
        setPanel(null);
        setFlow("cg");
      }}
    />
  );
}

export default App;
