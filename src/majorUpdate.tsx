import { useMemo, useRef, useState } from "react";

export type PlayerProfile = {
  created: boolean;
  name: string;
  gender: "male" | "female";
  outfit: "qingshan" | "daopao" | "jinzhuang" | "xianpao";
  difficulty: "easy" | "normal" | "hard" | "extreme";
  fate: "genius" | "talented" | "average" | "mortal";
  perks: string[];
  attributes: {
    aptitude: number;
    comprehension: number;
    spirit: number;
    speed: number;
    fortune: number;
  };
};

export type GardenHerbId =
  | "juqi"
  | "ningxue"
  | "huoli"
  | "shizhi"
  | "wugen"
  | "taojiao"
  | "chiyan"
  | "chensha";

export type GardenPlot = {
  herbId: GardenHerbId | null;
  years: number;
  plantedAtMonth?: number;
};

export type CraftedEquipment = {
  id: string;
  name: string;
  category: "weapon" | "armor";
  form: string;
  rank: "黄" | "玄" | "地" | "天" | "仙";
  stage: 0 | 1 | 2 | 3 | 4;
  lingyun: number;
  effect: string;
};

export type ExpansionState = {
  profile: PlayerProfile;
  story: { completed: number[]; tracked: number | null };
  handnotes: {
    lastRefreshYear: number;
    entries: Array<{
      id: string;
      npcId: "lu-zhenren" | "xiao-zhang" | "xiaoxian";
      title: string;
      text: string;
      flavorOnly: boolean;
      reward:
        | {
            type: "herb";
            herbId: GardenHerbId;
            amount: number;
          }
        | { type: "pill"; pillId: string; amount: number }
        | { type: "material"; materialId: string; amount: number }
        | null;
      claimed: boolean;
      createdAt: { year: number; month: number };
      expiresAt: { year: number; month: number };
    }>;
  };
  garden: {
    fieldLevel: 1 | 2;
    formationLevel: 0 | 1;
    xiaoxianCare: boolean;
    plots: GardenPlot[];
  };
  herbStock: Record<GardenHerbId, number>;
  pillStock: Record<string, number>;
  materialStock: Record<string, number>;
  craftedEquipment: CraftedEquipment[];
};

export type SystemScreen = "quests" | "garden" | "alchemy" | "forge";

export type ExpansionActivity = {
  title: string;
  text: string;
};

type SaveExpansion = (
  next: ExpansionState,
  options?: { elapsedMonths?: number; activity?: ExpansionActivity },
) => Promise<void>;

const baseUrl = import.meta.env.BASE_URL;
function asset(path: string) {
  return `${baseUrl}${path.replace(/^\//, "")}`;
}

const defaultProfile: PlayerProfile = {
  created: false,
  name: "异世来客",
  gender: "male",
  outfit: "jinzhuang",
  difficulty: "normal",
  fate: "genius",
  perks: [],
  attributes: {
    aptitude: 17,
    comprehension: 17,
    spirit: 17,
    speed: 17,
    fortune: 17,
  },
};

export const defaultExpansion: ExpansionState = {
  profile: defaultProfile,
  story: { completed: [], tracked: 1 },
  handnotes: { lastRefreshYear: 1, entries: [] },
  garden: {
    fieldLevel: 1,
    formationLevel: 0,
    xiaoxianCare: false,
    plots: Array.from({ length: 20 }, () => ({ herbId: null, years: 0, plantedAtMonth: 0 })),
  },
  herbStock: {
    juqi: 6,
    ningxue: 5,
    huoli: 5,
    shizhi: 4,
    wugen: 5,
    taojiao: 3,
    chiyan: 3,
    chensha: 5,
  },
  pillStock: { huayu: 2 },
  materialStock: {
    crudeIron: 8,
    mouseBone: 6,
    coldIron: 4,
    silver: 3,
    flameIron: 3,
    spiritCrystal: 2,
    resonanceCrystal: 1,
    ember: 3,
  },
  craftedEquipment: [
    {
      id: "starter-sword",
      name: "青锋剑",
      category: "weapon",
      form: "飞剑",
      rank: "黄",
      stage: 0,
      lingyun: 15,
      effect: "锋锐：穿透 +5%",
    },
  ],
};

export function getExpansion(value: Partial<ExpansionState> | undefined): ExpansionState {
  const gardenPlots = Array.from({ length: 20 }, (_, index) => ({
    ...defaultExpansion.garden.plots[index],
    ...(value?.garden?.plots?.[index] ?? {}),
  }));
  return {
    ...defaultExpansion,
    ...value,
    profile: {
      ...defaultProfile,
      ...value?.profile,
      attributes: { ...defaultProfile.attributes, ...value?.profile?.attributes },
      perks: value?.profile?.perks ?? [],
    },
    story: { ...defaultExpansion.story, ...value?.story },
    handnotes: { ...defaultExpansion.handnotes, ...value?.handnotes },
    garden: { ...defaultExpansion.garden, ...value?.garden, plots: gardenPlots },
    herbStock: { ...defaultExpansion.herbStock, ...value?.herbStock },
    pillStock: { ...defaultExpansion.pillStock, ...value?.pillStock },
    materialStock: { ...defaultExpansion.materialStock, ...value?.materialStock },
    craftedEquipment: value?.craftedEquipment ?? defaultExpansion.craftedEquipment,
  };
}

const outfitAssets: Record<PlayerProfile["outfit"], string> = {
  qingshan: asset("assets/onboarding/outfit-qingshan.png"),
  daopao: asset("assets/onboarding/outfit-daopao.png"),
  jinzhuang: asset("assets/onboarding/outfit-jinzhuang.png"),
  xianpao: asset("assets/onboarding/outfit-xianpao.png"),
};

const outfits: Array<{ id: PlayerProfile["outfit"]; name: string; note: string }> = [
  { id: "qingshan", name: "青衫", note: "朴素清雅" },
  { id: "daopao", name: "道袍", note: "仙风道骨" },
  { id: "jinzhuang", name: "劲装", note: "英气利落" },
  { id: "xianpao", name: "仙袍", note: "飘然若仙" },
];

const difficulties: Array<{
  id: PlayerProfile["difficulty"];
  name: string;
  level: string;
  description: string;
}> = [
  { id: "easy", name: "和光同尘", level: "简单", description: "掉宝与制作成功率提高，怪物强度降低。" },
  { id: "normal", name: "道法自然", level: "普通", description: "各项数值均为基准，推荐首次游历。" },
  { id: "hard", name: "逆天改命", level: "困难", description: "资源更紧，怪物更强，需要精细构筑。" },
  { id: "extreme", name: "真实修仙", level: "极难", description: "无法手动读档，死亡即删档。" },
];

const fates: Array<{
  id: PlayerProfile["fate"];
  name: string;
  attr: number;
  perk: number;
  description: string;
}> = [
  { id: "genius", name: "天之骄子", attr: 60, perk: 50, description: "天资卓绝，万中无一，五宗瞩目。" },
  { id: "talented", name: "资质聪颖", attr: 40, perk: 35, description: "天赋出众，道途顺遂，金丹在望。" },
  { id: "average", name: "天赋平平", attr: 20, perk: 20, description: "中人之资，勤能补拙，慢些亦可走远。" },
  { id: "mortal", name: "凡人修仙", attr: 10, perk: 5, description: "一介凡人之躯，也敢踏上逆天之路。" },
];

type Perk = { id: string; cost: number; name: string; effect: string };
const perks: Perk[] = [
  { id: "p01", cost: 3, name: "医学生", effect: "每60秒回复15%已损失血气" },
  { id: "p02", cost: 3, name: "学霸体质", effect: "资质 +3" },
  { id: "p03", cost: 3, name: "围棋爱好者", effect: "悟性 +3" },
  { id: "p04", cost: 3, name: "马拉松跑者", effect: "遁速 +3" },
  { id: "p05", cost: 3, name: "冥想练习者", effect: "神识 +3" },
  { id: "p06", cost: 3, name: "人品爆棚", effect: "福缘 +2" },
  { id: "p07", cost: 5, name: "拾荒者的直觉", effect: "拾取范围 +50%" },
  { id: "p08", cost: 5, name: "外卖骑手", effect: "移速 +15%，委托耗时 -10%" },
  { id: "p09", cost: 5, name: "程序员的逻辑", effect: "功法研习速度 +15%" },
  { id: "p10", cost: 5, name: "化学实验员", effect: "炼丹失败20%概率返还材料" },
  { id: "p11", cost: 5, name: "健身教练", effect: "受伤 -8%，血气上限 +40" },
  { id: "p12", cost: 8, name: "数学老师", effect: "暴击率 +8%" },
  { id: "p13", cost: 8, name: "历史学者", effect: "隐藏事件触发率 +15%" },
  { id: "p14", cost: 8, name: "急诊医生", effect: "濒死时回复30%血气" },
  { id: "p15", cost: 8, name: "战地记者", effect: "开战前20秒伤害 +20%" },
  { id: "p16", cost: 8, name: "品酒师", effect: "丹药持续时间 +20%" },
  { id: "p17", cost: 10, name: "考古学家", effect: "秘境额外获得一件物品" },
  { id: "p18", cost: 10, name: "黑客", effect: "炼器灵韵溢出风险 -30%" },
  { id: "p19", cost: 10, name: "魔术师", effect: "闪避率 +10%" },
  { id: "p20", cost: 10, name: "植物学家", effect: "草药生长速度 +50%" },
  { id: "p21", cost: 12, name: "药剂师", effect: "炼丹30%概率额外产出一颗" },
  { id: "p22", cost: 12, name: "刑警", effect: "对BOSS伤害 +20%" },
  { id: "p23", cost: 12, name: "战地医生", effect: "战斗中每秒回复1%血气" },
  { id: "p24", cost: 12, name: "美食家", effect: "丹药效果 +30%" },
  { id: "p25", cost: 15, name: "狙击手", effect: "暴击伤害 +40%" },
  { id: "p26", cost: 15, name: "探险家", effect: "委托奖励 +30%" },
  { id: "p27", cost: 15, name: "特种兵", effect: "致命伤害时保留1血" },
  { id: "p28", cost: 18, name: "速读专家", effect: "功法研习速度 +40%" },
  { id: "p29", cost: 18, name: "赛车手", effect: "移速 +30%，闪避 +8%" },
  { id: "p30", cost: 20, name: "穿越者本尊", effect: "全属性 +5，突破门槛 -10" },
];

const attributeMeta: Array<{
  id: keyof PlayerProfile["attributes"];
  name: string;
  short: string;
  description: string;
}> = [
  { id: "aptitude", name: "资质", short: "修炼·突破", description: "修炼速度主引擎，也是筑基门槛的关键。" },
  { id: "comprehension", name: "悟性", short: "功法·丹方", description: "影响功法研习、丹方和炼器配方解锁。" },
  { id: "spirit", name: "神识", short: "炼丹·探索", description: "影响炼丹稳定、拾取范围和弹幕预警。" },
  { id: "speed", name: "遁速", short: "移速·委托", description: "影响战斗走位、闪避和委托耗时。" },
  { id: "fortune", name: "福缘", short: "机缘·掉落", description: "影响隐藏机缘、掉落品质和事件检定。" },
];

function allocateAttributes(fate: PlayerProfile["fate"]) {
  const budget = fates.find((item) => item.id === fate)?.attr ?? 20;
  const keys = attributeMeta.map((item) => item.id);
  const values: PlayerProfile["attributes"] = {
    aptitude: 5,
    comprehension: 5,
    spirit: 5,
    speed: 5,
    fortune: 5,
  };
  for (let index = 0; index < budget; index += 1) values[keys[index % keys.length]] += 1;
  return values;
}

export function StartMenu({
  hasSave,
  musicEnabled,
  completedCount,
  onNewGame,
  onContinue,
  onArchive,
  onToggleMusic,
}: {
  hasSave: boolean;
  musicEnabled: boolean;
  completedCount: number;
  onNewGame: () => void;
  onContinue: () => void;
  onArchive: () => void;
  onToggleMusic: () => void;
}) {
  const [notice, setNotice] = useState<string | null>(null);
  return (
    <main className="start-menu-screen">
      <div className="start-menu-bg" />
      <img className="start-menu-logo" src={asset("assets/onboarding/logo.png")} alt="万化仙途" />
      <nav className="start-menu-actions" aria-label="游戏开始菜单">
        <button type="button" onClick={onNewGame}>踏入仙途</button>
        <button type="button" onClick={hasSave ? onContinue : onNewGame}>
          轮回玉简 <small>{hasSave ? "继续当前存档" : "尚无存档"}</small>
        </button>
        <button type="button" onClick={onArchive}>
          因缘集录 <small>{completedCount}/29</small>
        </button>
        <button type="button" onClick={() => setNotice("网页 Demo 已回到标题画面；Steam 版本中此处将退出游戏。")}>归隐凡尘</button>
      </nav>
      <button className="start-settings" type="button" onClick={onToggleMusic}>
        <span aria-hidden="true">音</span>
        心法调息 · {musicEnabled ? "乐声已开" : "乐声已静"}
      </button>
      <div className="start-version">DEMO 0.3 · 29次因缘 · 云存档</div>
      {notice && (
        <div className="start-notice" role="dialog" aria-modal="true">
          <p>{notice}</p>
          <button type="button" onClick={() => setNotice(null)}>知道了</button>
        </div>
      )}
    </main>
  );
}

export function CharacterCreation({
  initialProfile,
  busy,
  onBackToMenu,
  onComplete,
}: {
  initialProfile?: PlayerProfile;
  busy: boolean;
  onBackToMenu: () => void;
  onComplete: (profile: PlayerProfile) => void;
}) {
  const initial = initialProfile?.created ? initialProfile : defaultProfile;
  const [step, setStep] = useState(0);
  const [surname, setSurname] = useState(initial.name === "异世来客" ? "" : initial.name.slice(0, 1));
  const [givenName, setGivenName] = useState(initial.name === "异世来客" ? "" : initial.name.slice(1));
  const [gender, setGender] = useState(initial.gender);
  const [outfit, setOutfit] = useState(initial.outfit);
  const [difficulty, setDifficulty] = useState(initial.difficulty);
  const [fate, setFate] = useState(initial.fate);
  const [selectedPerks, setSelectedPerks] = useState<string[]>(initial.perks);
  const [attributes, setAttributes] = useState<PlayerProfile["attributes"]>(
    initialProfile?.created ? initial.attributes : allocateAttributes(initial.fate),
  );
  const [perkPage, setPerkPage] = useState(0);
  const fullName = `${surname.trim()}${givenName.trim()}`;
  const fateConfig = fates.find((item) => item.id === fate) ?? fates[0];
  const perkSpent = selectedPerks.reduce(
    (total, id) => total + (perks.find((item) => item.id === id)?.cost ?? 0),
    0,
  );
  const attributeSpent = Object.values(attributes).reduce((total, value) => total + value - 5, 0);
  const canContinue = step !== 0 || fullName.length >= 2;
  const currentPerks = perks.slice(perkPage * 6, perkPage * 6 + 6);

  function randomizeName() {
    const surnames = ["陆", "沈", "顾", "萧", "叶", "楚", "秦", "白", "林", "苏"];
    const first = ["云", "清", "玄", "若", "远", "逸", "宁", "辰", "霄", "瑶"];
    const second = ["尘", "然", "川", "曦", "羽", "渊", "霜", "岚", "月", "鹤"];
    setSurname(surnames[Math.floor(Math.random() * surnames.length)]);
    setGivenName(`${first[Math.floor(Math.random() * first.length)]}${second[Math.floor(Math.random() * second.length)]}`);
  }

  function chooseFate(nextFate: PlayerProfile["fate"]) {
    setFate(nextFate);
    setSelectedPerks([]);
    setAttributes(allocateAttributes(nextFate));
  }

  function togglePerk(id: string) {
    const selected = selectedPerks.includes(id);
    const cost = perks.find((item) => item.id === id)?.cost ?? 0;
    if (!selected && perkSpent + cost > fateConfig.perk) return;
    setSelectedPerks((current) => selected ? current.filter((item) => item !== id) : [...current, id]);
  }

  function adjustAttribute(id: keyof PlayerProfile["attributes"], amount: number) {
    const currentValue = attributes[id];
    if (amount > 0 && (attributeSpent >= fateConfig.attr || currentValue >= 60)) return;
    if (amount < 0 && currentValue <= 5) return;
    setAttributes((current) => ({ ...current, [id]: current[id] + amount }));
  }

  function complete() {
    if (!fullName || busy) return;
    onComplete({
      created: true,
      name: fullName,
      gender,
      outfit,
      difficulty,
      fate,
      perks: selectedPerks,
      attributes,
    });
  }

  const steps = ["取名", "难度", "命格", "天赋", "属性", "确认"];
  return (
    <main className="creation-screen">
      <div className="creation-scroll-bg" />
      <header className="creation-header">
        <div><strong>创建角色</strong><span>万化仙途</span></div>
        <p>踏仙途 · 择天命</p>
      </header>
      <nav className="creation-steps" aria-label="角色创建步骤">
        {steps.map((label, index) => (
          <button
            type="button"
            key={label}
            className={index === step ? "active" : index < step ? "done" : ""}
            onClick={() => index <= step && setStep(index)}
          >
            <span>{["壹", "贰", "叁", "肆", "伍", "陆"][index]}</span>{label}
          </button>
        ))}
      </nav>
      <section className="creation-body">
        <aside className="creation-preview">
          <img src={asset("assets/onboarding/player-full.png")} alt={fullName || "未命名修士"} />
          <strong>{fullName || "未命名修士"}</strong>
          <span>{fateConfig.name} · {gender === "male" ? "男修" : "女修"}</span>
        </aside>
        <div className="creation-content">
          {step === 0 && (
            <div className="creation-name-step">
              <div className="creation-copy">
                <h1>山门之前 · 先留姓名</h1>
                <p>一笔落下，山河为证。炼气、筑基、结丹、元婴，直至飞升，刻入天道。</p>
                <div className="name-inputs">
                  <label>姓<input value={surname} maxLength={2} onChange={(event) => setSurname(event.target.value)} /></label>
                  <label>名<input value={givenName} maxLength={4} onChange={(event) => setGivenName(event.target.value)} /></label>
                  <button type="button" title="随机取名" onClick={randomizeName}>随机</button>
                </div>
                <div className="gender-segments" aria-label="性别">
                  <button className={gender === "male" ? "active" : ""} type="button" onClick={() => setGender("male")}>男修</button>
                  <button className={gender === "female" ? "active" : ""} type="button" onClick={() => setGender("female")}>女修</button>
                </div>
              </div>
              <div className="outfit-picker">
                <h2>初始衣装</h2>
                <div>
                  {outfits.map((item) => (
                    <button
                      className={outfit === item.id ? "active" : ""}
                      type="button"
                      key={item.id}
                      onClick={() => setOutfit(item.id)}
                    >
                      <img src={outfitAssets[item.id]} alt="" />
                      <strong>{item.name}</strong><small>{item.note}</small>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="creation-option-step">
              <h1>大道三千 · 各有其途</h1>
              <p>或风和日丽，或步步惊雷，皆在一念之间。</p>
              <div className="difficulty-grid">
                {difficulties.map((item) => (
                  <button className={difficulty === item.id ? "active" : ""} type="button" key={item.id} onClick={() => setDifficulty(item.id)}>
                    <strong>{item.name}</strong><span>{item.level}</span><small>{item.description}</small>
                  </button>
                ))}
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="creation-option-step">
              <h1>天命所归 · 人生而异</h1>
              <p>道途不同，各自精彩。命格决定属性与天赋预算。</p>
              <div className="fate-grid">
                {fates.map((item) => (
                  <button className={fate === item.id ? "active" : ""} type="button" key={item.id} onClick={() => chooseFate(item.id)}>
                    <strong>{item.name}</strong><span>属性 {item.attr} · 天赋 {item.perk}</span><small>{item.description}</small>
                  </button>
                ))}
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="creation-perk-step">
              <div className="creation-section-heading"><div><h1>异世而来 · 携前尘之忆</h1><p>前世技艺，将在此界化作天赋。</p></div><strong>剩余 {fateConfig.perk - perkSpent}</strong></div>
              <div className="perk-page-tabs">
                {Array.from({ length: 5 }, (_, index) => <button type="button" className={perkPage === index ? "active" : ""} key={index} onClick={() => setPerkPage(index)}>第{index + 1}卷</button>)}
              </div>
              <div className="perk-grid">
                {currentPerks.map((item) => {
                  const selected = selectedPerks.includes(item.id);
                  const locked = !selected && perkSpent + item.cost > fateConfig.perk;
                  return <button type="button" disabled={locked} className={selected ? "active" : ""} key={item.id} onClick={() => togglePerk(item.id)}><span>{item.cost}点</span><strong>{item.name}</strong><small>{item.effect}</small></button>;
                })}
              </div>
            </div>
          )}
          {step === 4 && (
            <div className="creation-attribute-step">
              <div className="creation-section-heading"><div><h1>五德禀赋 · 各有所归</h1><p>命格赋予 {fateConfig.attr} 点，单项上限60。</p></div><strong>剩余 {fateConfig.attr - attributeSpent}</strong></div>
              <div className="attribute-list">
                {attributeMeta.map((item) => (
                  <div className="attribute-row" key={item.id}>
                    <div><strong>{item.name}</strong><span>{item.short}</span><small>{item.description}</small></div>
                    <div className="attribute-meter"><i style={{ width: `${((attributes[item.id] - 5) / 55) * 100}%` }} /></div>
                    <div className="attribute-controls"><button type="button" onClick={() => adjustAttribute(item.id, -1)}>−</button><b>{attributes[item.id]}</b><button type="button" onClick={() => adjustAttribute(item.id, 1)}>+</button></div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {step === 5 && (
            <div className="creation-confirm-step">
              <h1>天命已定 · 踏上仙途</h1>
              <div className="confirm-profile">
                <img src={outfitAssets[outfit]} alt="" />
                <div><span>姓名</span><strong>{fullName}</strong><span>命格</span><strong>{fateConfig.name}</strong><span>难度</span><strong>{difficulties.find((item) => item.id === difficulty)?.name}</strong></div>
              </div>
              <div className="confirm-stats">{attributeMeta.map((item) => <span key={item.id}>{item.name}<b>{attributes[item.id]}</b></span>)}</div>
              <div className="confirm-perks"><strong>前世天赋</strong><p>{selectedPerks.length ? selectedPerks.map((id) => perks.find((item) => item.id === id)?.name).join("、") : "未选择"}</p></div>
            </div>
          )}
        </div>
      </section>
      <footer className="creation-footer">
        <button type="button" className="secondary" onClick={step === 0 ? onBackToMenu : () => setStep((value) => value - 1)}>{step === 0 ? "返回标题" : "上一步"}</button>
        <span>{step === 0 && !canContinue ? "输入姓名后继续" : `${step + 1} / 6`}</span>
        {step < 5 ? <button type="button" disabled={!canContinue} onClick={() => setStep((value) => value + 1)}>下一步</button> : <button type="button" disabled={busy || !fullName} onClick={complete}>{busy ? "正在刻入天道" : "踏入仙途"}</button>}
      </footer>
    </main>
  );
}

export function EntryCg({ onDone }: { onDone: () => void }) {
  const [started, setStarted] = useState(false);
  const finishedRef = useRef(false);
  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onDone();
  };
  return (
    <main className="entry-cg-screen">
      <video
        autoPlay
        controls
        playsInline
        src={asset("assets/onboarding/enter-lushi.mp4")}
        onPlay={() => setStarted(true)}
        onEnded={finish}
      />
      <div className="entry-cg-title"><span>序章</span><strong>初入鹿石宗</strong><small>{started ? "命数自此改写" : "点击播放，见证入宗"}</small></div>
      <button type="button" onClick={finish}>跳过</button>
    </main>
  );
}

export type StoryEvent = {
  id: number;
  title: string;
  chapter: string;
  time: string;
  trigger: string;
  kind: "必然" | "非必然" | "可重复";
  location: string;
  participants: string;
  summary: string;
  months: number;
};

export const storyEvents: StoryEvent[] = [
  { id: 1, title: "初入鹿石宗", chapter: "教程阶段", time: "开局", trigger: "CG结束后自动", kind: "必然", location: "宿舍 → 广场 → 大厅", participants: "小张、小娴、鹿真人", summary: "你被带回鹿石宗，鹿真人看出异样并留下鹿花诀。", months: 0 },
  { id: 2, title: "鹿花诀的修习", chapter: "教程阶段", time: "炼气初期", trigger: "进入闭关室", kind: "必然", location: "闭关室", participants: "小张、鹿真人", summary: "研习鹿花诀，第一次将功法纳入丹海。", months: 5 },
  { id: 3, title: "小娴的药园", chapter: "教程阶段", time: "第1-3年", trigger: "完成事件2后对话小娴", kind: "必然", location: "灵植园", participants: "小娴", summary: "学习种植与炼丹，让灵田产出进入丹药循环。", months: 7 },
  { id: 4, title: "小张的演武", chapter: "教程阶段", time: "第1-3年", trigger: "完成事件2后对话小张", kind: "必然", location: "演武场", participants: "小张", summary: "第一次组合术法、技法与秘法，并完成实战教学。", months: 7 },
  { id: 5, title: "小张的炉火", chapter: "教程阶段", time: "第3-5年", trigger: "完成事件4后前往炼器坊", kind: "必然", location: "炼器坊", participants: "小张", summary: "投入粗铁矿与山鼠兽骨，炼出第一件成长装备。", months: 9 },
  { id: 6, title: "第一次除夕", chapter: "教程阶段", time: "每5年", trigger: "世界时钟到除夕", kind: "可重复", location: "鹿石宗厨房", participants: "鹿石宗全员", summary: "围炉包饺子，鹿石宗的家人传统由此开始。", months: 12 },
  { id: 7, title: "小张的突破", chapter: "教程阶段", time: "第5-8年", trigger: "教程完成且小张修为达标", kind: "必然", location: "演武场 → 闭关室外", participants: "小张、小娴", summary: "陪小张守关，第一次观察修士突破。", months: 11 },
  { id: 8, title: "猎妖修炼", chapter: "探索与结识", time: "第6年起", trigger: "与小张前往后山", kind: "可重复", location: "后山外围", participants: "小张", summary: "清剿山鼠，熟悉割草战斗与材料掉落。", months: 10 },
  { id: 9, title: "落星集初行", chapter: "探索与结识", time: "第7年起", trigger: "小娴邀约", kind: "非必然", location: "落星集药铺 / 集市", participants: "小娴", summary: "采购药种，认识交易、委托与落星集。", months: 12 },
  { id: 10, title: "山鼠洞寻宝", chapter: "探索与结识", time: "炼气前期", trigger: "小张邀约", kind: "必然", location: "后山 · 山鼠洞", participants: "小张、羊七、豆髯", summary: "误入山鼠王巢穴，在危机中结识青木门二位道人。", months: 3 },
  { id: 11, title: "啖愿妖事件", chapter: "探索与结识", time: "事件10后", trigger: "断桥村委托", kind: "必然", location: "长安城郊 · 断桥村", participants: "小张、雏雏、小鹿", summary: "揭穿以怜悯为饵的啖愿妖，结识金灵宗。", months: 3 },
  { id: 12, title: "小娴的进阶丹方", chapter: "探索与结识", time: "炼气前期", trigger: "炼丹熟练达标", kind: "非必然", location: "灵植园", participants: "小娴", summary: "学习阴阳失调、异变丹药与进阶配方。", months: 9 },
  { id: 13, title: "小张的进阶炼器", chapter: "探索与结识", time: "炼气前期", trigger: "炼器熟练达标", kind: "非必然", location: "炼器坊", participants: "小张", summary: "理解灵韵溢出与一件装备用一生的两条成长线。", months: 10 },
  { id: 14, title: "寒妙观来客", chapter: "探索与结识", time: "炼气前期", trigger: "传送阵异动", kind: "必然", location: "大厅 → 演武场", participants: "春琼、云隽渺", summary: "寒妙观来访，五宗往来第一次进入鹿石宗。", months: 9 },
  { id: 15, title: "小娴的采集", chapter: "探索与结识", time: "炼气前期", trigger: "小娴邀请深入老林", kind: "非必然", location: "灵植园 → 后山深处", participants: "小娴", summary: "采得稀有草药，也察觉小娴体质并不寻常。", months: 11 },
  { id: 16, title: "炼气交易会", chapter: "探索与结识", time: "每5年", trigger: "长安城定期开放", kind: "可重复", location: "长安城交易会场", participants: "兔娘会长", summary: "参加类战棋交易会，体验物资取舍与竞价。", months: 12 },
  { id: 17, title: "路遇散修", chapter: "比武与暗线", time: "炼气中期", trigger: "外出委托随机", kind: "可重复", location: "野外 → 洞窟", participants: "散修", summary: "一次寻常委托背后，露出有人追查你的暗线。", months: 13 },
  { id: 18, title: "九阳炎天宗邀约", chapter: "比武与暗线", time: "炼气中期", trigger: "收到传音符", kind: "必然", location: "鹿石宗大厅", participants: "墨炎、林川", summary: "九阳炎天宗送来比武邀约，五宗舞台正式展开。", months: 8 },
  { id: 19, title: "比武大会", chapter: "比武与暗线", time: "每10年", trigger: "炼气中期并完成邀约", kind: "必然", location: "九阳炎天宗 · 武擂场", participants: "五宗青年弟子", summary: "在五宗比武中检验构筑，暗处有人关注你的多系术法。", months: 12 },
  { id: 20, title: "鹿石宗后山", chapter: "比武与暗线", time: "炼气中期", trigger: "小张邀约探索", kind: "非必然", location: "后山 · 无名洞窟", participants: "小张", summary: "在无名洞窟发现与鹿真人过去相关的残迹。", months: 14 },
  { id: 21, title: "无名传音", chapter: "比武与暗线", time: "炼气后期", trigger: "鹿真人召见", kind: "非必然", location: "鹿石宗静室", participants: "无名、鹿真人", summary: "第一次感知万化道躯前任宿主留下的意识。", months: 13 },
  { id: 22, title: "小娴的体质", chapter: "小娴弧光", time: "小娴50岁后", trigger: "NPC年龄与玩家境界", kind: "非必然", location: "灵植园 → 静室", participants: "小娴", summary: "小娴灵根脉络有缺的秘密逐渐浮现。", months: 15 },
  { id: 23, title: "秘境传闻", chapter: "离别前奏", time: "炼气后期", trigger: "获得秘境线索", kind: "可重复", location: "落星集 / 长安城 → 秘境", participants: "鹿真人", summary: "万化秘境的线索出现，探索进入更危险的区域。", months: 16 },
  { id: 24, title: "小娴的笔记", chapter: "小娴弧光", time: "炼气后期", trigger: "发现炼丹笔记", kind: "必然", location: "灵植园", participants: "小娴", summary: "笔记记录了丹方，也记录了她不愿说出口的时间。", months: 14 },
  { id: 25, title: "小张的赌约", chapter: "离别前奏", time: "炼气后期", trigger: "切磋获胜", kind: "必然", location: "演武场", participants: "小张", summary: "一场关于天赋与努力的赌约，让小张第一次正视自己的局限。", months: 12 },
  { id: 26, title: "小娴的黄昏", chapter: "小娴弧光", time: "小娴55岁后", trigger: "傍晚与小娴交谈", kind: "必然", location: "广场 · 灵树下", participants: "小娴", summary: "灵树下的黄昏谈话，提前写下未来离别的影子。", months: 16 },
  { id: 27, title: "筑基筹备", chapter: "离别前奏", time: "炼气圆满", trigger: "鹿真人召见", kind: "必然", location: "鹿石宗静室", participants: "鹿真人", summary: "检查资质、灵气和丹药，准备冲击筑基。", months: 10 },
  { id: 28, title: "筑基突破", chapter: "离别前奏", time: "修为27200+", trigger: "资质≥30、灵气≥120", kind: "必然", location: "闭关室外", participants: "鹿真人、小张、小娴", summary: "万化道躯完成第一次大境界突破，寿元与道路随之改变。", months: 18 },
  { id: 29, title: "启程", chapter: "Demo终局", time: "筑基成功后", trigger: "首次前往传送阵", kind: "必然", location: "大厅 → 广场传送阵", participants: "鹿石宗全员、五宗来使", summary: "五宗邀请齐至，你告别鹿石宗的第一段日常，踏向更大的世界。", months: 1 },
];

function QuestScreen({
  expansion,
  realm,
  year,
  busy,
  onClose,
  onSave,
  onStartLegacyEvent,
  readOnly,
}: {
  expansion: ExpansionState;
  realm: string;
  year: number;
  busy: boolean;
  onClose: () => void;
  onSave: SaveExpansion;
  onStartLegacyEvent: (eventId: 10 | 11) => void;
  readOnly: boolean;
}) {
  const completed = new Set(expansion.story.completed);
  const firstIncomplete = storyEvents.find((event) => !completed.has(event.id))?.id ?? 29;
  const [tab, setTab] = useState<"progress" | "done">("progress");
  const [selectedId, setSelectedId] = useState(expansion.story.tracked ?? firstIncomplete);
  const visible = storyEvents.filter((event) => tab === "done" ? completed.has(event.id) : !completed.has(event.id));
  const selected = storyEvents.find((event) => event.id === selectedId) ?? visible[0] ?? storyEvents[0];
  const available = selected.id === firstIncomplete;

  async function track() {
    await onSave({ ...expansion, story: { ...expansion.story, tracked: selected.id } }, {
      activity: { title: "追踪因缘", text: `开始追踪「${selected.title}」。` },
    });
  }

  async function complete() {
    if (!available || busy) return;
    if (selected.id === 10 || selected.id === 11) {
      onStartLegacyEvent(selected.id);
      return;
    }
    const nextCompleted = Array.from(new Set([...expansion.story.completed, selected.id])).sort((a, b) => a - b);
    const nextTracked = storyEvents.find((event) => !nextCompleted.includes(event.id))?.id ?? null;
    await onSave({ ...expansion, story: { completed: nextCompleted, tracked: nextTracked } }, {
      elapsedMonths: selected.months,
      activity: {
        title: `完成：${selected.title}`,
        text: `${selected.summary} 因缘进度 ${nextCompleted.length}/29。`,
      },
    });
    setSelectedId(nextTracked ?? selected.id);
  }

  return (
    <SystemFrame title="因缘任务" subtitle={`第${year}年 · ${realm}期 · ${completed.size}/29`} onClose={onClose}>
      <div className="quest-layout">
        <aside className="quest-list-panel">
          <div className="system-tabs">
            <button type="button" className={tab === "progress" ? "active" : ""} onClick={() => setTab("progress")}>进行中 <span>{29 - completed.size}</span></button>
            <button type="button" className={tab === "done" ? "active" : ""} onClick={() => setTab("done")}>已完成 <span>{completed.size}</span></button>
          </div>
          <div className="quest-list">
            {visible.map((event) => {
              const current = event.id === firstIncomplete;
              return <button type="button" className={`${selected.id === event.id ? "active" : ""} ${current ? "current" : ""}`} key={event.id} onClick={() => setSelectedId(event.id)}><i>{String(event.id).padStart(2, "0")}</i><span><strong>{event.title}</strong><small>{event.chapter} · {event.location}</small></span><b>{completed.has(event.id) ? "已结" : current ? "可触发" : "待时机"}</b></button>;
            })}
          </div>
        </aside>
        <section className="quest-detail-panel">
          <header><div><span>事件 {String(selected.id).padStart(2, "0")} · {selected.chapter}</span><h1>{selected.title}</h1></div><strong className={completed.has(selected.id) ? "done" : available ? "ready" : "locked"}>{completed.has(selected.id) ? "已完成" : available ? "触发机会" : "尚未解锁"}</strong></header>
          <p className="quest-summary">{selected.summary}</p>
          <div className="quest-detail-grid">
            <div><span>触发条件</span><strong>{selected.trigger}</strong></div>
            <div><span>时间模型</span><strong>{selected.time}</strong></div>
            <div><span>地点</span><strong>{selected.location}</strong></div>
            <div><span>参与人物</span><strong>{selected.participants}</strong></div>
            <div><span>事件属性</span><strong>{selected.kind}</strong></div>
            <div><span>预计耗时</span><strong>{selected.months === 0 ? "即时" : `约${selected.months}个月`}</strong></div>
          </div>
          <div className="quest-condition-box">
            <span>当前检定</span>
            <p><i className="ok" /> 前置事件 {selected.id === 1 || completed.has(selected.id - 1) ? "已完成" : "未完成"}</p>
            <p><i className={available ? "ok" : ""} /> 当前为第 {firstIncomplete} 次因缘机会</p>
            <p><i className={selected.id < 28 || realm.includes("炼气") || realm.includes("筑基") ? "ok" : ""} /> 境界与人物时钟由云存档同步</p>
          </div>
          <footer>
            {readOnly && <button type="button" disabled>因缘集录 · 仅供查阅</button>}
            {!readOnly && !completed.has(selected.id) && <button type="button" className="secondary" disabled={busy} onClick={() => void track()}>{expansion.story.tracked === selected.id ? "正在追踪" : "追踪任务"}</button>}
            {!readOnly && !completed.has(selected.id) && <button type="button" disabled={!available || busy} onClick={() => void complete()}>{busy ? "同步中" : selected.id === 10 || selected.id === 11 ? "前往体验完整事件" : "触发并推进事件"}</button>}
            {!readOnly && completed.has(selected.id) && <button type="button" disabled>事件已完成</button>}
          </footer>
        </section>
      </div>
    </SystemFrame>
  );
}

type HerbDefinition = {
  id: GardenHerbId;
  name: string;
  element: "金" | "木" | "水" | "火" | "土";
  yinYang: "阴" | "阳";
  minYear: number;
  description: string;
};

const herbs: HerbDefinition[] = [
  { id: "juqi", name: "聚气草", element: "木", yinYang: "阳", minYear: 10, description: "日纳灵气，夜间缓缓释放。" },
  { id: "ningxue", name: "凝血花", element: "木", yinYang: "阴", minYear: 15, description: "汁液可迅速凝结伤口。" },
  { id: "huoli", name: "火栗", element: "火", yinYang: "阳", minYear: 10, description: "闻起来像小张最爱的烤栗子。" },
  { id: "shizhi", name: "石芝", element: "土", yinYang: "阳", minYear: 15, description: "生于岩缝，质地坚硬。" },
  { id: "wugen", name: "无根萍", element: "水", yinYang: "阳", minYear: 10, description: "浮于灵泉，无根而生。" },
  { id: "taojiao", name: "桃胶", element: "木", yinYang: "阴", minYear: 12, description: "灵桃树分泌的晶莹树脂。" },
  { id: "chiyan", name: "赤焰花", element: "火", yinYang: "阳", minYear: 15, description: "正午盛开，花瓣如火舌。" },
  { id: "chensha", name: "辰砂", element: "金", yinYang: "阴", minYear: 10, description: "朱红矿药，炼丹入门常用。" },
];

function getHerb(id: GardenHerbId | null) {
  return herbs.find((herb) => herb.id === id) ?? null;
}

function herbRank(years: number) {
  if (years < 50) return "黄";
  if (years < 200) return "玄";
  if (years < 500) return "地";
  if (years < 1000) return "天";
  return "仙";
}

function gardenSpeed(expansion: ExpansionState) {
  const field = expansion.garden.fieldLevel === 2 ? 2 : 1.5;
  const formation = expansion.garden.formationLevel === 1 ? 1.2 : 1;
  const care = expansion.garden.xiaoxianCare ? 1.25 : 1;
  return Math.min(5, field * formation * care);
}

function materializeGarden(expansion: ExpansionState, absoluteMonth: number) {
  const speed = gardenSpeed(expansion);
  return expansion.garden.plots.map((plot) => {
    if (!plot.herbId) return { ...plot, plantedAtMonth: absoluteMonth };
    const elapsed = Math.max(0, absoluteMonth - (plot.plantedAtMonth ?? absoluteMonth));
    return { ...plot, years: plot.years + elapsed * speed, plantedAtMonth: absoluteMonth };
  });
}

function GardenScreen({
  expansion,
  year,
  month,
  busy,
  onClose,
  onSave,
}: {
  expansion: ExpansionState;
  year: number;
  month: number;
  busy: boolean;
  onClose: () => void;
  onSave: SaveExpansion;
}) {
  const [seed, setSeed] = useState<GardenHerbId>("juqi");
  const [notice, setNotice] = useState("选择种苗，再点击空地种下。");
  const absoluteMonth = year * 12 + month;
  const plots = materializeGarden(expansion, absoluteMonth);
  const unlocked = expansion.garden.fieldLevel === 2 ? 12 : 8;
  const speed = gardenSpeed(expansion);

  async function saveGarden(next: ExpansionState, activity: ExpansionActivity) {
    await onSave(next, { activity });
  }

  async function plant(index: number) {
    if (busy || index >= unlocked || plots[index].herbId || expansion.herbStock[seed] <= 0) return;
    const definition = getHerb(seed)!;
    const nextPlots = plots.map((plot, plotIndex) => plotIndex === index ? { herbId: seed, years: definition.minYear, plantedAtMonth: absoluteMonth } : plot);
    const next = { ...expansion, garden: { ...expansion.garden, plots: nextPlots }, herbStock: { ...expansion.herbStock, [seed]: expansion.herbStock[seed] - 1 } };
    setNotice(`${definition.name}已种入第${index + 1}块灵田。`);
    await saveGarden(next, { title: "种下灵草", text: `在灵植园种下${definition.name}。` });
  }

  async function harvest(index: number) {
    const plot = plots[index];
    if (!plot.herbId || busy) return;
    const definition = getHerb(plot.herbId)!;
    const rank = herbRank(plot.years);
    const nextPlots = plots.map((item, plotIndex) => plotIndex === index ? { herbId: null, years: 0, plantedAtMonth: absoluteMonth } : item);
    const next = { ...expansion, garden: { ...expansion.garden, plots: nextPlots }, herbStock: { ...expansion.herbStock, [plot.herbId]: expansion.herbStock[plot.herbId] + 1 } };
    setNotice(`取出${Math.floor(plot.years)}年份${rank}阶${definition.name}，已入背包。`);
    await saveGarden(next, { title: "取出灵草", text: `收获${Math.floor(plot.years)}年份${rank}阶${definition.name}。` });
  }

  async function divide(index: number) {
    const plot = plots[index];
    if (!plot.herbId || busy) return;
    const definition = getHerb(plot.herbId)!;
    const dividedYears = Math.floor(plot.years / 4);
    const targetPlots = plots
      .map((item, plotIndex) => ({ item, plotIndex }))
      .filter(({ item, plotIndex }) => plotIndex < unlocked && (plotIndex === index || !item.herbId))
      .slice(0, 3)
      .map(({ plotIndex }) => plotIndex);
    if (targetPlots.length < 3) {
      setNotice("分株需要三块可用灵田，请先腾出两块空地。");
      return;
    }
    const nextPlots = plots.map((item, plotIndex) => targetPlots.includes(plotIndex)
      ? { herbId: plot.herbId, years: dividedYears, plantedAtMonth: absoluteMonth }
      : item);
    const next = { ...expansion, garden: { ...expansion.garden, plots: nextPlots } };
    setNotice(`${definition.name}分为3份，每份保留约${dividedYears}年份。`);
    await saveGarden(next, { title: "灵草分株", text: `${definition.name}一分为三，年份降至四分之一。` });
  }

  async function toggleModifier(kind: "formation" | "care") {
    const nextGarden = {
      ...expansion.garden,
      plots,
      formationLevel: kind === "formation" ? (expansion.garden.formationLevel === 1 ? 0 : 1) as 0 | 1 : expansion.garden.formationLevel,
      xiaoxianCare: kind === "care" ? !expansion.garden.xiaoxianCare : expansion.garden.xiaoxianCare,
    };
    const next = { ...expansion, garden: nextGarden };
    setNotice(kind === "formation" ? "聚灵阵状态已调整。" : "小娴照料状态已调整。");
    await saveGarden(next, { title: "灵植园调整", text: kind === "formation" ? "调整初级聚灵阵。" : "调整小娴照料安排。" });
  }

  async function upgradeField() {
    if (busy || expansion.garden.fieldLevel === 2 || expansion.materialStock.spiritCrystal < 2) return;
    const next = {
      ...expansion,
      garden: { ...expansion.garden, fieldLevel: 2 as const, plots },
      materialStock: { ...expansion.materialStock, spiritCrystal: expansion.materialStock.spiritCrystal - 2 },
    };
    setNotice("灵田已升为聚灵田，解锁12块地，基础倍率提升至2.0。 ");
    await saveGarden(next, { title: "灵田升阶", text: "灵田升为地阶聚灵田，可用地块增加至12块。" });
  }

  return (
    <SystemFrame title="灵植园" subtitle={`鹿石宗 · 第${year}年${month}月`} onClose={onClose}>
      <div className="garden-layout">
        <section className="garden-main">
          <header><div><strong>{expansion.garden.fieldLevel === 2 ? "聚灵田（地）" : "灵田（玄）"}</strong><span>可用 {unlocked}/20 块</span></div><p>1游戏月 = <b>{speed.toFixed(2)}</b> 草药年份</p></header>
          <div className="garden-plots">
            {plots.map((plot, index) => {
              const definition = getHerb(plot.herbId);
              const locked = index >= unlocked;
              return <article className={`${locked ? "locked" : ""} ${definition ? "planted" : "empty"}`} key={index}>
                {locked ? <span>升阶解锁</span> : definition ? <><header><strong>{definition.name}</strong><i>{herbRank(plot.years)}阶</i></header><b>{Math.floor(plot.years)} 年份</b><small>{definition.element} · {definition.yinYang} · +{speed.toFixed(2)}/月</small><p>{definition.description}</p><footer><button type="button" onClick={() => void harvest(index)}>取出</button><button type="button" onClick={() => void divide(index)}>分株</button></footer></> : <button type="button" disabled={busy || expansion.herbStock[seed] <= 0} onClick={() => void plant(index)}><b>+</b><span>种下{getHerb(seed)?.name}</span></button>}
              </article>;
            })}
          </div>
          <p className="system-notice">{notice}</p>
        </section>
        <aside className="garden-sidebar">
          <section><h2>选择种苗</h2><div className="seed-list">{herbs.map((herb) => <button type="button" className={seed === herb.id ? "active" : ""} disabled={expansion.herbStock[herb.id] <= 0} key={herb.id} onClick={() => setSeed(herb.id)}><i>{herb.element}</i><span><strong>{herb.name}</strong><small>{herb.yinYang} · 起始{herb.minYear}年</small></span><b>×{expansion.herbStock[herb.id]}</b></button>)}</div></section>
          <section><h2>年份增速</h2><div className="speed-breakdown"><p><span>灵田</span><b>×{expansion.garden.fieldLevel === 2 ? "2.00" : "1.50"}</b></p><p><span>聚灵阵</span><b>×{expansion.garden.formationLevel ? "1.20" : "1.00"}</b></p><p><span>小娴照料</span><b>×{expansion.garden.xiaoxianCare ? "1.25" : "1.00"}</b></p><strong>总计 ×{speed.toFixed(2)}</strong></div></section>
          <section className="garden-switches"><button type="button" onClick={() => void toggleModifier("formation")}><span>初级聚灵阵</span><b>{expansion.garden.formationLevel ? "已激活" : "未激活"}</b></button><button type="button" onClick={() => void toggleModifier("care")}><span>小娴照料</span><b>{expansion.garden.xiaoxianCare ? "照料中" : "请求"}</b></button><button type="button" disabled={expansion.garden.fieldLevel === 2 || expansion.materialStock.spiritCrystal < 2} onClick={() => void upgradeField()}><span>升为聚灵田</span><b>{expansion.garden.fieldLevel === 2 ? "已完成" : `灵晶石 ${expansion.materialStock.spiritCrystal}/2`}</b></button></section>
        </aside>
      </div>
    </SystemFrame>
  );
}

type ElementName = "金" | "木" | "水" | "火" | "土" | "任意";
type Recipe = {
  id: string;
  name: string;
  rank: "黄" | "玄" | "地";
  category: string;
  elements: ElementName[];
  minLingyun: number;
  time: string;
};

const recipes: Recipe[] = [
  { id: "huayu", name: "化瘀丹", rank: "黄", category: "疗伤", elements: ["水", "木"], minLingyun: 4, time: "2天" },
  { id: "huoxue", name: "活血丹", rank: "玄", category: "疗伤", elements: ["水", "木"], minLingyun: 8, time: "5天" },
  { id: "xugu", name: "续骨丹", rank: "地", category: "疗伤", elements: ["水", "木", "任意"], minLingyun: 15, time: "12天" },
  { id: "juling", name: "聚灵散", rank: "黄", category: "回蓝", elements: ["金", "水"], minLingyun: 4, time: "2天" },
  { id: "huiyuan", name: "回元散", rank: "玄", category: "回蓝", elements: ["金", "水"], minLingyun: 8, time: "5天" },
  { id: "juqi-pill", name: "聚气丹", rank: "黄", category: "修为", elements: ["火", "土"], minLingyun: 4, time: "2天" },
  { id: "ningyuan", name: "凝元丹", rank: "玄", category: "修为", elements: ["火", "土"], minLingyun: 8, time: "5天" },
  { id: "pozhang", name: "破障丹", rank: "黄", category: "攻击", elements: ["金", "火"], minLingyun: 4, time: "2天" },
  { id: "tiegu", name: "铁骨散", rank: "黄", category: "防御", elements: ["土", "金"], minLingyun: 4, time: "2天" },
  { id: "qinghui", name: "清秽散", rank: "黄", category: "解毒", elements: ["木", "火"], minLingyun: 4, time: "2天" },
  { id: "yannian", name: "延年散", rank: "黄", category: "延寿", elements: ["木", "水", "土"], minLingyun: 8, time: "7天" },
  { id: "tongmai", name: "通脉丹", rank: "黄", category: "突破", elements: ["火", "金", "水"], minLingyun: 8, time: "10天" },
];

const herbLingyun: Record<GardenHerbId, number> = {
  juqi: 2,
  ningxue: 3,
  huoli: 2,
  shizhi: 3,
  wugen: 2,
  taojiao: 3,
  chiyan: 4,
  chensha: 3,
};

function AlchemyScreen({ expansion, busy, onClose, onSave }: { expansion: ExpansionState; busy: boolean; onClose: () => void; onSave: SaveExpansion }) {
  const [selectedRecipeId, setSelectedRecipeId] = useState(recipes[0].id);
  const [ingredients, setIngredients] = useState<GardenHerbId[]>([]);
  const [elementFilter, setElementFilter] = useState<"全" | Exclude<ElementName, "任意">>("全");
  const [notice, setNotice] = useState("选择丹方，再按槽位顺序投入草药。");
  const recipe = recipes.find((item) => item.id === selectedRecipeId) ?? recipes[0];
  const totalLingyun = ingredients.reduce((total, id) => total + herbLingyun[id], 0);
  const yin = ingredients.filter((id) => getHerb(id)?.yinYang === "阴").length;
  const yang = ingredients.length - yin;
  const balance = ingredients.length ? Math.abs(yin - yang) : 0;
  const canCraft = ingredients.length === recipe.elements.length && totalLingyun >= recipe.minLingyun;
  const filteredHerbs = herbs.filter((herb) => elementFilter === "全" || herb.element === elementFilter);

  function chooseRecipe(id: string) {
    setSelectedRecipeId(id);
    setIngredients([]);
    setNotice("丹方已更换，请重新投入草药。");
  }

  function addIngredient(id: GardenHerbId) {
    const slot = ingredients.length;
    const requirement = recipe.elements[slot];
    const definition = getHerb(id)!;
    const used = ingredients.filter((item) => item === id).length;
    if (!requirement || expansion.herbStock[id] - used <= 0) return;
    if (requirement !== "任意" && requirement !== definition.element) {
      setNotice(`当前槽位需要${requirement}系，${definition.name}无法投入。`);
      return;
    }
    setIngredients((current) => [...current, id]);
    setNotice(`${definition.name}已投入第${slot + 1}槽。`);
  }

  async function craft() {
    if (!canCraft || busy) return;
    const counts = ingredients.reduce<Record<string, number>>((result, id) => ({ ...result, [id]: (result[id] ?? 0) + 1 }), {});
    const herbStock = { ...expansion.herbStock };
    for (const [id, count] of Object.entries(counts)) herbStock[id as GardenHerbId] -= count;
    const output = balance === 0 ? 4 : balance === 1 ? 3 : 1;
    const next = {
      ...expansion,
      herbStock,
      pillStock: { ...expansion.pillStock, [recipe.id]: (expansion.pillStock[recipe.id] ?? 0) + output },
    };
    setNotice(`${recipe.name}炼成${output}枚，${balance <= 1 ? "阴阳调和" : "阴阳微偏，产量下降"}。`);
    setIngredients([]);
    await onSave(next, {
      elapsedMonths: 1,
      activity: { title: `炼成${recipe.name}`, text: `投入${ingredients.map((id) => getHerb(id)?.name).join("、")}，炼得${output}枚。` },
    });
  }

  return (
    <SystemFrame title="炼丹" subtitle="鹿石宗 · 炼丹房" onClose={onClose}>
      <div className="alchemy-layout">
        <aside className="recipe-panel">
          <header><strong>丹方</strong><span>{recipes.length}种</span></header>
          <div className="recipe-list">{recipes.map((item) => <button type="button" className={item.id === recipe.id ? "active" : ""} key={item.id} onClick={() => chooseRecipe(item.id)}><i>{item.rank}</i><span><strong>{item.name}</strong><small>{item.elements.join("+")} · {item.category}</small></span><b>{expansion.pillStock[item.id] ?? 0}</b></button>)}</div>
        </aside>
        <section className="alchemy-cauldron-panel">
          <header><span>当前丹方</span><h1>{recipe.name} <i>{recipe.rank}阶</i></h1><p>{recipe.elements.join(" + ")} → {recipe.category} · 炼制{recipe.time}</p></header>
          <div className="cauldron-slots">
            {recipe.elements.map((element, index) => {
              const ingredient = getHerb(ingredients[index] ?? null);
              return <div className={ingredient ? "filled" : ""} key={`${element}-${index}`}><span>{element}</span>{ingredient ? <button type="button" onClick={() => setIngredients((current) => current.filter((_, itemIndex) => itemIndex !== index))}><b>{ingredient.name}</b><small>{ingredient.element} · {ingredient.yinYang}</small></button> : <p>等待投入</p>}</div>;
            })}
          </div>
          <div className="alchemy-status"><p><span>灵韵</span><b className={totalLingyun >= recipe.minLingyun ? "good" : "bad"}>{totalLingyun} / {recipe.minLingyun}</b></p><p><span>阴阳</span><b>{ingredients.length ? balance === 0 ? "调和" : balance === 1 ? "微偏" : "失调" : "—"}</b></p><p><span>预计产出</span><b>{canCraft ? balance === 0 ? "4枚" : balance === 1 ? "3枚" : "1枚" : "—"}</b></p><p><span>耗时</span><b>{recipe.time}</b></p></div>
          <button className="system-primary-action" type="button" disabled={!canCraft || busy} onClick={() => void craft()}>{busy ? "守炉中" : "开炉炼丹"}</button>
          <p className="system-notice">{notice}</p>
        </section>
        <aside className="herb-inventory-panel">
          <header><strong>草药背包</strong><span>点击投入下一槽</span></header>
          <div className="element-filters">{(["全", "金", "木", "水", "火", "土"] as const).map((element) => <button type="button" className={elementFilter === element ? "active" : ""} key={element} onClick={() => setElementFilter(element)}>{element}</button>)}</div>
          <div className="alchemy-herb-list">{filteredHerbs.map((herb) => { const used = ingredients.filter((id) => id === herb.id).length; const count = expansion.herbStock[herb.id] - used; return <button type="button" disabled={count <= 0 || ingredients.length >= recipe.elements.length} key={herb.id} onClick={() => addIngredient(herb.id)}><i>{herb.element}</i><span><strong>{herb.name}</strong><small>{herb.yinYang} · 灵韵{herbLingyun[herb.id]}</small></span><b>×{count}</b></button>; })}</div>
        </aside>
      </div>
    </SystemFrame>
  );
}

type MaterialDefinition = {
  id: string;
  name: string;
  type: "ore" | "bone" | "special";
  element: "金" | "木" | "水" | "火" | "土" | "无";
  lingyun: number;
  trait: string;
};

const materials: MaterialDefinition[] = [
  { id: "crudeIron", name: "粗铁矿", type: "ore", element: "金", lingyun: 3, trait: "最常见的入门矿石" },
  { id: "mouseBone", name: "山鼠兽骨", type: "bone", element: "土", lingyun: 4, trait: "基础骨材" },
  { id: "coldIron", name: "寒铁", type: "ore", element: "金", lingyun: 8, trait: "坚韧 · 耐久+15%" },
  { id: "silver", name: "秘银", type: "ore", element: "金", lingyun: 15, trait: "轻灵 · 攻速+8%" },
  { id: "flameIron", name: "炎铁", type: "ore", element: "火", lingyun: 22, trait: "焚灼 · 附带火伤" },
  { id: "spiritCrystal", name: "灵晶石", type: "ore", element: "无", lingyun: 20, trait: "共鸣 · 五行兼容" },
  { id: "resonanceCrystal", name: "灵韵结晶", type: "special", element: "无", lingyun: 30, trait: "纯净 · 只提供灵韵" },
  { id: "ember", name: "万炼余烬", type: "special", element: "火", lingyun: 15, trait: "淬炼 · 灵韵额外+5%" },
];

const rankThresholds = { 黄: 10, 玄: 30, 地: 60, 天: 120, 仙: 250 } as const;
const stageNames = ["法器", "法宝", "古宝", "通天灵宝", "玄天之宝"] as const;

function ForgeScreen({ expansion, busy, onClose, onSave }: { expansion: ExpansionState; busy: boolean; onClose: () => void; onSave: SaveExpansion }) {
  const [mode, setMode] = useState<"craft" | "temper">("craft");
  const [category, setCategory] = useState<"weapon" | "armor">("weapon");
  const [form, setForm] = useState("剑");
  const [rank, setRank] = useState<"黄" | "玄">("黄");
  const [selectedEquipmentId, setSelectedEquipmentId] = useState(expansion.craftedEquipment[0]?.id ?? "");
  const [slots, setSlots] = useState<string[]>([]);
  const [filter, setFilter] = useState<"all" | MaterialDefinition["type"]>("all");
  const [notice, setNotice] = useState("点击材料依次投入四个炉槽。");
  const selectedEquipment = expansion.craftedEquipment.find((item) => item.id === selectedEquipmentId) ?? expansion.craftedEquipment[0];
  const totalLingyun = slots.reduce((total, id) => total + (materials.find((material) => material.id === id)?.lingyun ?? 0), 0);
  const target = mode === "craft" ? rankThresholds[rank] : selectedEquipment ? 15 + selectedEquipment.stage * 20 : 999;
  const overflow = target > 0 ? Math.round(((totalLingyun - target) / target) * 100) : 0;
  const filteredMaterials = materials.filter((material) => filter === "all" || material.type === filter);
  const canForge = slots.length > 0 && totalLingyun >= target && (mode === "craft" || Boolean(selectedEquipment && selectedEquipment.stage < 4));

  function addMaterial(id: string) {
    const used = slots.filter((item) => item === id).length;
    if (slots.length >= 4 || expansion.materialStock[id] - used <= 0) return;
    setSlots((current) => [...current, id]);
  }

  function consumeMaterials() {
    const stock = { ...expansion.materialStock };
    for (const id of slots) stock[id] = Math.max(0, stock[id] - 1);
    return stock;
  }

  function dominantEffect() {
    const weights: Record<string, number> = {};
    for (const id of slots) {
      const material = materials.find((item) => item.id === id);
      if (material) weights[material.element] = (weights[material.element] ?? 0) + material.lingyun;
    }
    const element = Object.entries(weights).sort((left, right) => right[1] - left[1])[0]?.[0] ?? "无";
    const effects: Record<string, string> = { 金: "锋锐：穿透 +5%", 木: "回春：缓慢回血", 水: "灵盾：护盾 +10%", 火: "灼烧：攻击附火伤", 土: "稳固：被暴击率降低", 无: "均衡：全属性 +2%" };
    return effects[element];
  }

  async function forge() {
    if (!canForge || busy) return;
    if (mode === "craft") {
      const names: Record<string, string> = { 剑: "玄铁剑", 拂尘: "秘银拂尘", 环: "镇灵环", 道服: "灵丝道服", 内甲: "玄铁内甲" };
      const forms: Record<string, string> = { 剑: "飞剑", 拂尘: "印", 环: "幡旗", 道服: "界", 内甲: "钟" };
      const item: CraftedEquipment = {
        id: `crafted-${Date.now()}`,
        name: names[form] ?? "无名法器",
        category,
        form: forms[form] ?? "法器",
        rank,
        stage: 0,
        lingyun: totalLingyun,
        effect: dominantEffect(),
      };
      const next = { ...expansion, materialStock: consumeMaterials(), craftedEquipment: [...expansion.craftedEquipment, item] };
      setSelectedEquipmentId(item.id);
      setNotice(`${item.name}炼制成功，灵韵${totalLingyun}，${item.effect}。`);
      setSlots([]);
      await onSave(next, { elapsedMonths: 1, activity: { title: `炼成${item.name}`, text: `${rank}阶${stageNames[0]}入库，灵韵${totalLingyun}。` } });
      return;
    }
    if (!selectedEquipment) return;
    const nextStage = Math.min(4, selectedEquipment.stage + 1) as 0 | 1 | 2 | 3 | 4;
    const updated = { ...selectedEquipment, stage: nextStage, lingyun: selectedEquipment.lingyun + totalLingyun, effect: `${selectedEquipment.effect} · ${stageNames[nextStage]}已激活` };
    const next = { ...expansion, materialStock: consumeMaterials(), craftedEquipment: expansion.craftedEquipment.map((item) => item.id === updated.id ? updated : item) };
    setNotice(`${updated.name}已进化为${stageNames[nextStage]}。`);
    setSlots([]);
    await onSave(next, { elapsedMonths: nextStage === 1 ? 8 : nextStage === 2 ? 48 : 120, activity: { title: `淬炼${updated.name}`, text: `法宝阶段提升为${stageNames[nextStage]}。` } });
  }

  const formOptions = category === "weapon" ? ["剑", "拂尘", "环"] : ["道服", "内甲"];
  return (
    <SystemFrame title="炼器坊" subtitle="炼制装备 · 淬炼法宝" onClose={onClose}>
      <div className="forge-layout">
        <aside className="forge-options-panel">
          <div className="system-tabs"><button type="button" className={mode === "craft" ? "active" : ""} onClick={() => { setMode("craft"); setSlots([]); }}>炼制装备</button><button type="button" className={mode === "temper" ? "active" : ""} onClick={() => { setMode("temper"); setSlots([]); }}>淬炼法宝</button></div>
          {mode === "craft" ? <><section><h2>装备类型</h2><div className="forge-segments"><button type="button" className={category === "weapon" ? "active" : ""} onClick={() => { setCategory("weapon"); setForm("剑"); }}>武器</button><button type="button" className={category === "armor" ? "active" : ""} onClick={() => { setCategory("armor"); setForm("道服"); }}>防具</button></div></section><section><h2>器型</h2><div className="forge-form-list">{formOptions.map((item) => <button type="button" className={form === item ? "active" : ""} key={item} onClick={() => setForm(item)}>{item}</button>)}</div></section><section><h2>目标品阶</h2><div className="forge-ranks">{(["黄", "玄"] as const).map((item) => <button type="button" className={rank === item ? "active" : ""} key={item} onClick={() => setRank(item)}>{item}<small>{rankThresholds[item]}灵韵</small></button>)}</div></section></> : <section className="equipment-select"><h2>选择成长装备</h2>{expansion.craftedEquipment.map((item) => <button type="button" className={item.id === selectedEquipment?.id ? "active" : ""} key={item.id} onClick={() => { setSelectedEquipmentId(item.id); setSlots([]); }}><strong>{item.name}</strong><span>{item.rank}阶 · {stageNames[item.stage]}</span><small>{item.effect}</small></button>)}</section>}
        </aside>
        <section className="forge-center-panel">
          <header><span>{mode === "craft" ? "灵韵定品" : `${stageNames[selectedEquipment?.stage ?? 0]} → ${stageNames[Math.min(4, (selectedEquipment?.stage ?? 0) + 1)]}`}</span><h1>{mode === "craft" ? `${rank}阶${form}` : selectedEquipment?.name}</h1><p>{mode === "craft" ? "材料五行权重决定附加效果" : "持续炉炼，让同一件装备伴随一生"}</p></header>
          <div className="forge-slots">{Array.from({ length: 4 }, (_, index) => { const material = materials.find((item) => item.id === slots[index]); return <div className={material ? "filled" : ""} key={index}>{material ? <button type="button" onClick={() => setSlots((current) => current.filter((_, slotIndex) => slotIndex !== index))}><i>{material.element}</i><strong>{material.name}</strong><small>灵韵 +{material.lingyun}</small></button> : <span>槽 {index + 1}<small>{index < 2 ? "主材" : "追加"}</small></span>}</div>; })}<div className="forge-fire"><i /><b>炼</b></div></div>
          <div className="forge-status"><p><span>灵韵进度</span><b className={totalLingyun >= target ? "good" : "bad"}>{totalLingyun} / {target}</b></p><p><span>溢出</span><b>{totalLingyun < target ? "不足" : overflow < 20 ? "达标" : overflow < 50 ? `${overflow}% · 概率特性` : overflow < 100 ? `${overflow}% · 必得特性` : `${overflow}% · 炸炉风险`}</b></p><p><span>五行趋势</span><b>{slots.length ? dominantEffect() : "—"}</b></p><p><span>耗时</span><b>{mode === "craft" ? "1-15天" : selectedEquipment?.stage === 0 ? "6月-2年" : "数年起"}</b></p></div>
          <button className="system-primary-action" type="button" disabled={!canForge || busy} onClick={() => void forge()}>{busy ? "炉火运转中" : mode === "craft" ? "开炉炼制" : "开炉淬炼"}</button>
          <p className="system-notice">{notice}</p>
        </section>
        <aside className="forge-material-panel"><header><strong>投入材料</strong><span>库存随云存档同步</span></header><div className="material-filters">{(["all", "ore", "bone", "special"] as const).map((item) => <button type="button" className={filter === item ? "active" : ""} key={item} onClick={() => setFilter(item)}>{item === "all" ? "全部" : item === "ore" ? "矿石" : item === "bone" ? "兽骨" : "特殊"}</button>)}</div><div className="material-list">{filteredMaterials.map((material) => { const used = slots.filter((id) => id === material.id).length; const count = expansion.materialStock[material.id] - used; return <button type="button" disabled={count <= 0 || slots.length >= 4} key={material.id} onClick={() => addMaterial(material.id)}><i>{material.element}</i><span><strong>{material.name}</strong><small>{material.trait}</small></span><b><em>+{material.lingyun}</em>×{count}</b></button>; })}</div></aside>
      </div>
    </SystemFrame>
  );
}

function SystemFrame({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode }) {
  return <main className="major-system-screen"><header className="major-system-header"><div><h1>{title}</h1><span>{subtitle}</span></div><button type="button" onClick={onClose}>返回宗门</button></header><div className="major-system-body">{children}</div></main>;
}

export function MajorSystemScreen({
  screen,
  expansion,
  year,
  month,
  realm,
  busy,
  onClose,
  onSave,
  onStartLegacyEvent,
  readOnly = false,
}: {
  screen: SystemScreen;
  expansion: ExpansionState;
  year: number;
  month: number;
  realm: string;
  busy: boolean;
  onClose: () => void;
  onSave: SaveExpansion;
  onStartLegacyEvent: (eventId: 10 | 11) => void;
  readOnly?: boolean;
}) {
  if (screen === "quests") return <QuestScreen expansion={expansion} realm={realm} year={year} busy={busy} onClose={onClose} onSave={onSave} onStartLegacyEvent={onStartLegacyEvent} readOnly={readOnly} />;
  if (screen === "garden") return <GardenScreen expansion={expansion} year={year} month={month} busy={busy} onClose={onClose} onSave={onSave} />;
  if (screen === "alchemy") return <AlchemyScreen expansion={expansion} busy={busy} onClose={onClose} onSave={onSave} />;
  return <ForgeScreen expansion={expansion} busy={busy} onClose={onClose} onSave={onSave} />;
}
