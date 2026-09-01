extends Control
## 角色创建 —— 1:1 对齐 web CharacterCreation（majorUpdate.tsx / majorUpdate.css）
## 六步向导：壹取名 → 贰难度 → 叁命格 → 肆天赋 → 伍属性 → 陆确认
## 卷轴底图 + 左侧立绘预览 + 右侧分步内容 + 底部毛笔按钮（brush-primary/secondary）

const DIFFICULTIES := [
	{"id": "easy", "name": "和光同尘", "level": "简单", "desc": "掉宝与制作成功率提高，怪物强度降低。"},
	{"id": "normal", "name": "道法自然", "level": "普通", "desc": "各项数值均为基准，推荐首次游历。"},
	{"id": "hard", "name": "逆天改命", "level": "困难", "desc": "资源更紧，怪物更强，需要精细构筑。"},
	{"id": "extreme", "name": "真实修仙", "level": "极难", "desc": "无法手动读档，死亡即删档。"},
]

const FATES := [
	{"id": "genius", "name": "天之骄子", "attr": 60, "perk": 50, "desc": "天资卓绝，万中无一，五宗瞩目。"},
	{"id": "talented", "name": "资质聪颖", "attr": 40, "perk": 35, "desc": "天赋出众，道途顺遂，金丹在望。"},
	{"id": "average", "name": "天赋平平", "attr": 20, "perk": 20, "desc": "中人之资，勤能补拙，慢些亦可走远。"},
	{"id": "mortal", "name": "凡人修仙", "attr": 10, "perk": 5, "desc": "一介凡人之躯，也敢踏上逆天之路。"},
]

## 30 条前世天赋（web perks 表，5 卷 × 6 条）
const PERKS := [
	{"id": "p01", "cost": 3, "name": "医学生", "effect": "每60秒回复15%已损失血气"},
	{"id": "p02", "cost": 3, "name": "学霸体质", "effect": "资质 +3"},
	{"id": "p03", "cost": 3, "name": "围棋爱好者", "effect": "悟性 +3"},
	{"id": "p04", "cost": 3, "name": "马拉松跑者", "effect": "遁速 +3"},
	{"id": "p05", "cost": 3, "name": "冥想练习者", "effect": "神识 +3"},
	{"id": "p06", "cost": 3, "name": "人品爆棚", "effect": "福缘 +2"},
	{"id": "p07", "cost": 5, "name": "拾荒者的直觉", "effect": "拾取范围 +50%"},
	{"id": "p08", "cost": 5, "name": "外卖骑手", "effect": "移速 +15%，委托耗时 -10%"},
	{"id": "p09", "cost": 5, "name": "程序员的逻辑", "effect": "功法研习速度 +15%"},
	{"id": "p10", "cost": 5, "name": "化学实验员", "effect": "炼丹失败20%概率返还材料"},
	{"id": "p11", "cost": 5, "name": "健身教练", "effect": "受伤 -8%，血气上限 +40"},
	{"id": "p12", "cost": 8, "name": "数学老师", "effect": "暴击率 +8%"},
	{"id": "p13", "cost": 8, "name": "历史学者", "effect": "隐藏事件触发率 +15%"},
	{"id": "p14", "cost": 8, "name": "急诊医生", "effect": "濒死时回复30%血气"},
	{"id": "p15", "cost": 8, "name": "战地记者", "effect": "开战前20秒伤害 +20%"},
	{"id": "p16", "cost": 8, "name": "品酒师", "effect": "丹药持续时间 +20%"},
	{"id": "p17", "cost": 10, "name": "考古学家", "effect": "秘境额外获得一件物品"},
	{"id": "p18", "cost": 10, "name": "黑客", "effect": "炼器灵韵溢出风险 -30%"},
	{"id": "p19", "cost": 10, "name": "魔术师", "effect": "闪避率 +10%"},
	{"id": "p20", "cost": 10, "name": "植物学家", "effect": "草药生长速度 +50%"},
	{"id": "p21", "cost": 12, "name": "药剂师", "effect": "炼丹30%概率额外产出一颗"},
	{"id": "p22", "cost": 12, "name": "刑警", "effect": "对BOSS伤害 +20%"},
	{"id": "p23", "cost": 12, "name": "战地医生", "effect": "战斗中每秒回复1%血气"},
	{"id": "p24", "cost": 12, "name": "美食家", "effect": "丹药效果 +30%"},
	{"id": "p25", "cost": 15, "name": "狙击手", "effect": "暴击伤害 +40%"},
	{"id": "p26", "cost": 15, "name": "探险家", "effect": "委托奖励 +30%"},
	{"id": "p27", "cost": 15, "name": "特种兵", "effect": "致命伤害时保留1血"},
	{"id": "p28", "cost": 18, "name": "速读专家", "effect": "功法研习速度 +40%"},
	{"id": "p29", "cost": 18, "name": "赛车手", "effect": "移速 +30%，闪避 +8%"},
	{"id": "p30", "cost": 20, "name": "穿越者本尊", "effect": "全属性 +5，突破门槛 -10"},
]

const ATTRS := [
	{"key": "资质", "short": "修炼·突破", "desc": "修炼速度主引擎，也是筑基门槛的关键。"},
	{"key": "悟性", "short": "功法·丹方", "desc": "影响功法研习、丹方和炼器配方解锁。"},
	{"key": "神识", "short": "炼丹·探索", "desc": "影响炼丹稳定、拾取范围和弹幕预警。"},
	{"key": "遁速", "short": "移速·委托", "desc": "影响战斗走位、闪避和委托耗时。"},
	{"key": "福缘", "short": "机缘·掉落", "desc": "影响隐藏机缘、掉落品质和事件检定。"},
]

const OUTFITS := [
	{"name": "青衫", "desc": "朴素清雅", "icon": "res://assets/onboarding/outfit-qingshan.png"},
	{"name": "道袍", "desc": "仙风道骨", "icon": "res://assets/onboarding/outfit-daopao.png"},
	{"name": "劲装", "desc": "英气利落", "icon": "res://assets/onboarding/outfit-jinzhuang.png"},
	{"name": "仙袍", "desc": "飘然若仙", "icon": "res://assets/onboarding/outfit-xianpao.png"},
]

const STEP_NAMES := ["取名", "难度", "命格", "天赋", "属性", "确认"]
const STEP_NUMS := ["壹", "贰", "叁", "肆", "伍", "陆"]

## 布局（1920×1080，对齐 css：header top52/左右8.5%；steps top140/左右14%；body top205~bottom95/左右8.5%；footer bottom38/左右14%）
const HEADER_X := 163.0
const STEPS_X := 269.0
const STEPS_W := 1382.0
const BODY_POS := Vector2(163, 205)
const BODY_SIZE := Vector2(1594, 780)
const PREVIEW_W := 260.0
const FOOTER_Y := 994.0

var _kai: FontFile
var _step := 0
var _surname := ""
var _given := ""
var _gender := "男修"
var _outfit := "青衫"
var _difficulty := "道法自然"
var _fate := FATES[0]
var _perk_ids: Array = []
var _perk_page := 0
var _attrs := {"资质": 5, "悟性": 5, "神识": 5, "遁速": 5, "福缘": 5}

var _steps_row: HBoxContainer
var _preview_name: Label
var _preview_sub: Label
var _content: Control
var _footer_left: Button
var _footer_hint: Label
var _footer_right: Button


func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_kai = FontFile.new()
	_kai.load_dynamic_font("res://fonts/KaiTi.ttf")

	# 卷轴底图（character-scroll.jpg cover，纸色打底）
	var paper := ColorRect.new()
	paper.color = Color("#e9dfce")
	paper.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(paper)
	var bg := TextureRect.new()
	bg.texture = load("res://assets/onboarding/character-scroll.jpg")
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	bg.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	bg.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	add_child(bg)

	_build_header()
	_build_steps()
	_build_body()
	_build_footer()
	_default_attrs()
	_refresh()
	_refresh_footer()


## ---------- 顶栏（.creation-header：左「创建角色」+ 小字；右「万化归途」） ----------

func _build_header() -> void:
	var left := VBoxContainer.new()
	left.position = Vector2(HEADER_X, 52)
	left.size = Vector2(400, 70)
	left.add_theme_constant_override("separation", 2)
	add_child(left)
	var title := Label.new()
	title.text = "创建角色"
	title.add_theme_font_size_override("font_size", 34)
	title.add_theme_font_override("font", _kai)
	title.add_theme_color_override("font_color", Color("#30281f"))
	left.add_child(title)
	var sub := Label.new()
	sub.text = "异世来客 · 山门之前"
	sub.add_theme_font_size_override("font_size", 11)
	sub.add_theme_color_override("font_color", Color("#7c6d5c"))
	left.add_child(sub)

	var right := Label.new()
	right.text = "万化归途"
	right.position = Vector2(1757 - 200, 56)
	right.size = Vector2(200, 40)
	right.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	right.add_theme_font_size_override("font_size", 20)
	right.add_theme_font_override("font", _kai)
	right.add_theme_color_override("font_color", Color("#30281f"))
	add_child(right)


## ---------- 步骤条（.creation-steps：6 列 48px，圆形序号 34px） ----------

func _build_steps() -> void:
	_steps_row = HBoxContainer.new()
	_steps_row.position = Vector2(STEPS_X, 140)
	_steps_row.size = Vector2(STEPS_W, 48)
	_steps_row.add_theme_constant_override("separation", 0)
	add_child(_steps_row)
	for i in STEP_NAMES.size():
		var b := Button.new()
		b.custom_minimum_size = Vector2(STEPS_W / 6.0, 48)
		b.focus_mode = Control.FOCUS_NONE
		b.mouse_filter = Control.MOUSE_FILTER_IGNORE
		b.text = ""
		var inner := HBoxContainer.new()
		inner.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		inner.alignment = BoxContainer.ALIGNMENT_CENTER
		inner.add_theme_constant_override("separation", 8)
		inner.mouse_filter = Control.MOUSE_FILTER_IGNORE
		b.add_child(inner)
		# 序号圆框（css .creation-steps button span：34px 圆、1px #b7a17b 边）
		var num_wrap := Panel.new()
		num_wrap.name = "NumWrap"
		num_wrap.custom_minimum_size = Vector2(34, 34)
		num_wrap.size_flags_vertical = Control.SIZE_SHRINK_CENTER
		num_wrap.mouse_filter = Control.MOUSE_FILTER_IGNORE
		var num_sb := StyleBoxFlat.new()
		num_sb.bg_color = Color(0, 0, 0, 0)
		num_sb.border_color = Color("#b7a17b")
		num_sb.set_border_width_all(1)
		num_sb.set_corner_radius_all(17)
		num_wrap.add_theme_stylebox_override("panel", num_sb)
		inner.add_child(num_wrap)
		var num := Label.new()
		num.name = "Num"
		num.text = STEP_NUMS[i]
		num.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		num.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		num.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		num.add_theme_font_size_override("font_size", 15)
		num_wrap.add_child(num)
		var name_l := Label.new()
		name_l.name = "StepName"
		name_l.text = STEP_NAMES[i]
		name_l.add_theme_font_size_override("font_size", 18)
		name_l.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		inner.add_child(name_l)
		var sb := StyleBoxFlat.new()
		sb.bg_color = Color(0, 0, 0, 0)
		sb.set_border_width_all(0)
		sb.set_border_width(Side.SIDE_BOTTOM, 3)
		b.add_theme_stylebox_override("normal", sb)
		b.add_theme_stylebox_override("hover", sb)
		b.add_theme_stylebox_override("pressed", sb)
		_steps_row.add_child(b)


func _refresh_steps() -> void:
	for i in _steps_row.get_child_count():
		var b: Button = _steps_row.get_child(i)
		var inner: HBoxContainer = b.get_child(0)
		var num_wrap: Panel = inner.get_child(0)
		var num: Label = num_wrap.get_child(0)
		var name_l: Label = inner.get_child(1)
		var active := i == _step
		var done := i < _step
		var sb: StyleBoxFlat = b.get_theme_stylebox("normal").duplicate()
		sb.border_color = Color("#b78a31") if active else Color(0, 0, 0, 0)
		b.add_theme_stylebox_override("normal", sb)
		# 圆框边框色（css：active 时 #b88a2f）
		var num_sb: StyleBoxFlat = num_wrap.get_theme_stylebox("panel").duplicate()
		num_sb.border_color = Color("#b88a2f") if active else Color("#b7a17b")
		num_wrap.add_theme_stylebox_override("panel", num_sb)
		num.add_theme_color_override("font_color", Color("#a87318") if active else Color("#8b7d6d"))
		name_l.add_theme_color_override("font_color",
			Color("#35281c") if active else Color("#76603d") if done else Color("#8b7d6d"))


## ---------- 主体（.creation-body：左预览 260px + 右内容） ----------

func _build_body() -> void:
	var body := Control.new()
	body.position = BODY_POS
	body.size = BODY_SIZE
	add_child(body)

	# 左：立绘预览（player-full.png 高 470 + 名牌 + 命格·性别）
	var preview := VBoxContainer.new()
	preview.position = Vector2(0, 0)
	preview.size = Vector2(PREVIEW_W, BODY_SIZE.y)
	preview.alignment = BoxContainer.ALIGNMENT_END
	preview.add_theme_constant_override("separation", 8)
	body.add_child(preview)

	var img := TextureRect.new()
	img.texture = load("res://assets/onboarding/player-full.png")
	img.custom_minimum_size = Vector2(PREVIEW_W, 470)
	img.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	img.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	preview.add_child(img)

	var plate := Panel.new()
	plate.custom_minimum_size = Vector2(220, 44)
	var p_sb := StyleBoxFlat.new()
	p_sb.bg_color = Color(0.98, 0.961, 0.91, 0.82)
	p_sb.border_color = Color(0.722, 0.541, 0.184, 0.48)
	p_sb.set_border_width_all(1)
	plate.add_theme_stylebox_override("panel", p_sb)
	preview.add_child(plate)
	_preview_name = Label.new()
	_preview_name.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_preview_name.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_preview_name.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_preview_name.add_theme_font_size_override("font_size", 20)
	_preview_name.add_theme_font_override("font", _kai)
	_preview_name.add_theme_color_override("font_color", Color("#3a2b1b"))
	plate.add_child(_preview_name)

	_preview_sub = Label.new()
	_preview_sub.add_theme_font_size_override("font_size", 11)
	_preview_sub.add_theme_color_override("font_color", Color("#857561"))
	_preview_sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	preview.add_child(_preview_sub)

	# 右：分步内容区
	_content = Control.new()
	_content.position = Vector2(PREVIEW_W + 32, 0)
	_content.size = Vector2(BODY_SIZE.x - PREVIEW_W - 32, BODY_SIZE.y)
	_content.clip_contents = true
	body.add_child(_content)


func _clear_content() -> void:
	for c in _content.get_children():
		c.queue_free()


func _refresh() -> void:
	_refresh_steps()
	_clear_content()
	match _step:
		0: _build_name_step()
		1: _build_difficulty_step()
		2: _build_fate_step()
		3: _build_perk_step()
		4: _build_attr_step()
		5: _build_confirm_step()
	var full := _full_name()
	_preview_name.text = full if not full.is_empty() else "未命名修士"
	_preview_sub.text = "%s · %s" % [_fate["name"], _gender]


func _full_name() -> String:
	return (_surname + _given).strip_edges()


## ---------- 步骤 1：取名 ----------

func _build_name_step() -> void:
	var copy := VBoxContainer.new()
	copy.position = Vector2(0, 60)
	copy.size = Vector2(420, 400)
	copy.add_theme_constant_override("separation", 14)
	_content.add_child(copy)
	var h1 := _h1("山门之前 · 先留姓名")
	copy.add_child(h1)
	var p := Label.new()
	p.text = "一笔落下，山河为证。炼气、筑基、结丹、元婴，直至飞升，刻入天道。"
	p.add_theme_font_size_override("font_size", 13)
	p.add_theme_color_override("font_color", Color("#7b6b58"))
	p.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	p.custom_minimum_size = Vector2(420, 0)
	copy.add_child(p)

	var form := VBoxContainer.new()
	form.position = Vector2(480, 30)
	form.size = Vector2(760, 640)
	form.add_theme_constant_override("separation", 16)
	_content.add_child(form)

	# 姓 / 名 / 随机
	var name_row := HBoxContainer.new()
	name_row.add_theme_constant_override("separation", 12)
	form.add_child(name_row)
	var surname_edit := _name_edit("姓", _surname)
	surname_edit.custom_minimum_size = Vector2(160, 48)
	surname_edit.text_changed.connect(func(t: String): _surname = t; _refresh_preview_name())
	name_row.add_child(surname_edit)
	var given_edit := _name_edit("名", _given)
	given_edit.custom_minimum_size = Vector2(220, 48)
	given_edit.text_changed.connect(func(t: String): _given = t; _refresh_preview_name())
	name_row.add_child(given_edit)
	var rand_btn := _plain_button("随机", 96, 48)
	rand_btn.pressed.connect(func():
		var surnames := ["陆", "沈", "顾", "萧", "叶", "楚", "秦", "白", "林", "苏"]
		var first := ["云", "清", "玄", "若", "远", "逸", "宁", "辰", "霄", "瑶"]
		var second := ["尘", "然", "川", "曦", "羽", "渊", "霜", "岚", "月", "鹤"]
		_surname = surnames[randi() % surnames.size()]
		_given = second[randi() % second.size()] + first[randi() % first.size()]
		surname_edit.text = _surname
		given_edit.text = _given
		_refresh_preview_name()
	)
	name_row.add_child(rand_btn)

	# 性别
	var gender_label := _h2("性别")
	form.add_child(gender_label)
	var gender_row := HBoxContainer.new()
	gender_row.add_theme_constant_override("separation", 12)
	form.add_child(gender_row)
	for g in ["男修", "女修"]:
		var b := _option_card(str(g), "", _gender == g)
		b.custom_minimum_size = Vector2(180, 52)
		b.pressed.connect(func(): _gender = str(g); _refresh())
		gender_row.add_child(b)

	# 初始衣装（4 张卡：图标 + 名 + 描述）
	var outfit_label := _h2("初始衣装")
	form.add_child(outfit_label)
	var outfit_row := HBoxContainer.new()
	outfit_row.add_theme_constant_override("separation", 12)
	form.add_child(outfit_row)
	for o in OUTFITS:
		var od: Dictionary = o
		var card := _outfit_card(od, _outfit == str(od["name"]))
		card.custom_minimum_size = Vector2(172, 200)
		card.pressed.connect(func(): _outfit = str(od["name"]); _refresh())
		outfit_row.add_child(card)


func _name_edit(placeholder: String, value: String) -> LineEdit:
	var e := LineEdit.new()
	e.placeholder_text = placeholder
	e.text = value
	e.max_length = 4 if placeholder == "姓" else 6
	e.add_theme_font_size_override("font_size", 22)
	e.add_theme_font_override("font", _kai)
	e.alignment = HORIZONTAL_ALIGNMENT_CENTER
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(1, 1, 1, 0.66)
	sb.border_color = Color("#b7a17b")
	sb.set_border_width_all(1)
	sb.set_corner_radius_all(4)
	e.add_theme_stylebox_override("normal", sb)
	return e


func _outfit_card(od: Dictionary, selected: bool) -> Button:
	var b := Button.new()
	b.focus_mode = Control.FOCUS_NONE
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.99, 0.97, 0.93, 0.9) if selected else Color(1, 1, 1, 0.5)
	sb.border_color = Color("#b88a2f") if selected else Color("#b7a17b", 0.6)
	sb.set_border_width_all(2 if selected else 1)
	sb.set_corner_radius_all(6)
	sb.set_content_margin_all(8)
	b.add_theme_stylebox_override("normal", sb)
	var sb_h := sb.duplicate()
	sb_h.border_color = Color("#b88a2f")
	b.add_theme_stylebox_override("hover", sb_h)
	var inner := VBoxContainer.new()
	inner.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	inner.alignment = BoxContainer.ALIGNMENT_CENTER
	inner.add_theme_constant_override("separation", 6)
	inner.mouse_filter = Control.MOUSE_FILTER_IGNORE
	b.add_child(inner)
	var icon := TextureRect.new()
	if ResourceLoader.exists(str(od["icon"])):
		icon.texture = load(str(od["icon"]))
	icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	icon.custom_minimum_size = Vector2(140, 120)
	icon.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	inner.add_child(icon)
	var n := Label.new()
	n.text = str(od["name"])
	n.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	n.add_theme_font_size_override("font_size", 19)
	n.add_theme_font_override("font", _kai)
	n.add_theme_color_override("font_color", Color("#35281c"))
	inner.add_child(n)
	var d := Label.new()
	d.text = str(od["desc"])
	d.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	d.add_theme_font_size_override("font_size", 11)
	d.add_theme_color_override("font_color", Color("#7b6b58"))
	inner.add_child(d)
	return b


## ---------- 步骤 2：难度 / 步骤 3：命格 ----------

func _build_difficulty_step() -> void:
	_content.add_child(_h1_at("大道三千 · 各有其途", 20))
	var p := Label.new()
	p.text = "或风和日丽，或步步惊雷，皆在一念之间。"
	p.position = Vector2(0, 62)
	p.add_theme_font_size_override("font_size", 13)
	p.add_theme_color_override("font_color", Color("#7b6b58"))
	_content.add_child(p)
	var grid := GridContainer.new()
	grid.position = Vector2(0, 110)
	grid.size = Vector2(1280, 560)
	grid.columns = 2
	grid.add_theme_constant_override("h_separation", 16)
	grid.add_theme_constant_override("v_separation", 16)
	_content.add_child(grid)
	for d in DIFFICULTIES:
		var dd: Dictionary = d
		var card := _tall_card(
			"%s · %s" % [dd["name"], dd["level"]],
			str(dd["desc"]), "", _difficulty == str(dd["name"]))
		card.custom_minimum_size = Vector2(624, 150)
		card.pressed.connect(func(): _difficulty = str(dd["name"]); _refresh())
		grid.add_child(card)


func _build_fate_step() -> void:
	_content.add_child(_h1_at("异世而来 · 前尘化命格", 20))
	var p := Label.new()
	p.text = "命格决定属性点与天赋点的多寡，路是自己走出来的。"
	p.position = Vector2(0, 62)
	p.add_theme_font_size_override("font_size", 13)
	p.add_theme_color_override("font_color", Color("#7b6b58"))
	_content.add_child(p)
	var grid := GridContainer.new()
	grid.position = Vector2(0, 110)
	grid.size = Vector2(1280, 560)
	grid.columns = 2
	grid.add_theme_constant_override("h_separation", 16)
	grid.add_theme_constant_override("v_separation", 16)
	_content.add_child(grid)
	for f in FATES:
		var fd: Dictionary = f
		var card := _tall_card(
			str(fd["name"]),
			str(fd["desc"]),
			"属性点 %d · 天赋点 %d" % [int(fd["attr"]), int(fd["perk"])],
			_fate["id"] == str(fd["id"]))
		card.custom_minimum_size = Vector2(624, 150)
		card.pressed.connect(func():
			_fate = fd
			_perk_ids = []
			_perk_page = 0
			_default_attrs()
			_refresh()
		)
		grid.add_child(card)


## ---------- 步骤 4：天赋（5 卷 × 6，剩余点数） ----------

func _build_perk_step() -> void:
	_content.add_child(_h1_at("前世之忆 · 天赋", 20))
	var remain := _perk_remaining()
	var info := Label.new()
	info.text = "剩余 %d 点（%s：%d 点）" % [remain, _fate["name"], int(_fate["perk"])]
	info.position = Vector2(0, 62)
	info.add_theme_font_size_override("font_size", 14)
	info.add_theme_color_override("font_color", Color("#76603d"))
	_content.add_child(info)

	# 卷标签（第 1-5 卷）
	var tabs := HBoxContainer.new()
	tabs.position = Vector2(0, 96)
	tabs.add_theme_constant_override("separation", 10)
	_content.add_child(tabs)
	for i in 5:
		var t := _option_card("第 %d 卷" % (i + 1), "", _perk_page == i)
		t.custom_minimum_size = Vector2(110, 40)
		t.pressed.connect(func(): _perk_page = i; _refresh())
		tabs.add_child(t)

	# 6 张天赋卡（2 列 × 3 行）
	var grid := GridContainer.new()
	grid.position = Vector2(0, 152)
	grid.size = Vector2(1280, 560)
	grid.columns = 2
	grid.add_theme_constant_override("h_separation", 14)
	grid.add_theme_constant_override("v_separation", 14)
	_content.add_child(grid)
	var start := _perk_page * 6
	for i in 6:
		var idx := start + i
		if idx >= PERKS.size():
			break
		var pd: Dictionary = PERKS[idx]
		var selected: bool = _perk_ids.has(str(pd["id"]))
		var card := _tall_card(
			"%s（%d 点）" % [pd["name"], int(pd["cost"])],
			str(pd["effect"]), "", selected)
		card.custom_minimum_size = Vector2(624, 110)
		card.pressed.connect(func():
			var pid := str(pd["id"])
			if _perk_ids.has(pid):
				_perk_ids.erase(pid)
			elif _perk_remaining() >= int(pd["cost"]):
				_perk_ids.append(pid)
			_refresh()
		)
		grid.add_child(card)


func _perk_remaining() -> int:
	var spent := 0
	for pid in _perk_ids:
		for pd in PERKS:
			if str(pd["id"]) == str(pid):
				spent += int(pd["cost"])
	return int(_fate["perk"]) - spent


## ---------- 步骤 5：属性（五维 +/- 分配） ----------

func _build_attr_step() -> void:
	_content.add_child(_h1_at("五维定基 · 点化道躯", 20))
	var remain := _attr_remaining()
	var info := Label.new()
	info.text = "剩余可分配：%d 点（重选命格会重新分配）" % remain
	info.position = Vector2(0, 62)
	info.add_theme_font_size_override("font_size", 14)
	info.add_theme_color_override("font_color", Color("#76603d"))
	_content.add_child(info)

	var y := 108.0
	for a in ATTRS:
		var ad: Dictionary = a
		var key := str(ad["key"])
		var row := HBoxContainer.new()
		row.position = Vector2(0, y)
		row.size = Vector2(1280, 96)
		row.add_theme_constant_override("separation", 16)
		_content.add_child(row)

		var name_box := VBoxContainer.new()
		name_box.custom_minimum_size = Vector2(220, 90)
		name_box.alignment = BoxContainer.ALIGNMENT_CENTER
		name_box.add_theme_constant_override("separation", 2)
		row.add_child(name_box)
		var n := Label.new()
		n.text = "%s · %s" % [key, ad["short"]]
		n.add_theme_font_size_override("font_size", 20)
		n.add_theme_font_override("font", _kai)
		n.add_theme_color_override("font_color", Color("#35281c"))
		name_box.add_child(n)
		var d := Label.new()
		d.text = str(ad["desc"])
		d.add_theme_font_size_override("font_size", 11)
		d.add_theme_color_override("font_color", Color("#7b6b58"))
		name_box.add_child(d)

		var minus := _plain_button("－", 56, 56)
		minus.disabled = int(_attrs[key]) <= 5
		minus.pressed.connect(func(): _attrs[key] = int(_attrs[key]) - 1; _refresh())
		row.add_child(minus)

		var val := Label.new()
		val.text = str(int(_attrs[key]))
		val.custom_minimum_size = Vector2(90, 56)
		val.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		val.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		val.add_theme_font_size_override("font_size", 30)
		val.add_theme_font_override("font", _kai)
		val.add_theme_color_override("font_color", Color("#3a2b1b"))
		row.add_child(val)

		var plus := _plain_button("＋", 56, 56)
		plus.disabled = _attr_remaining() <= 0
		plus.pressed.connect(func(): _attrs[key] = int(_attrs[key]) + 1; _refresh())
		row.add_child(plus)

		# 分配条（5-30 区间的金棕填充）
		var bar := Control.new()
		bar.custom_minimum_size = Vector2(560, 10)
		bar.size_flags_vertical = Control.SIZE_SHRINK_CENTER
		row.add_child(bar)
		var track := ColorRect.new()
		track.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		track.color = Color(0, 0, 0, 0.1)
		bar.add_child(track)
		var fill := ColorRect.new()
		fill.color = Color("#b88a2f")
		fill.position = Vector2.ZERO
		fill.size = Vector2(560 * clampf((int(_attrs[key]) - 5) / 25.0, 0.0, 1.0), 10)
		bar.add_child(fill)

		y += 110


func _attr_total_pool() -> int:
	return 25 + int(_fate["attr"])


func _attr_remaining() -> int:
	var used := 0
	for key in _attrs:
		used += int(_attrs[key])
	return _attr_total_pool() - used


func _default_attrs() -> void:
	# web allocateAttributes：五维各 5，再把命格点数均分
	var even := int(_fate["attr"]) / 5
	for a in ATTRS:
		_attrs[str(a["key"])] = 5 + even


## ---------- 步骤 6：确认 ----------

func _build_confirm_step() -> void:
	_content.add_child(_h1_at("天命已定 · 踏上仙途", 20))
	var box := VBoxContainer.new()
	box.position = Vector2(0, 70)
	box.size = Vector2(1280, 600)
	box.add_theme_constant_override("separation", 18)
	_content.add_child(box)

	var line1 := Label.new()
	line1.text = "姓名 %s　命格 %s　难度 %s　性别 %s　衣装 %s" % [
		_full_name() if not _full_name().is_empty() else "（未取名）",
		_fate["name"], _difficulty, _gender, _outfit]
	line1.add_theme_font_size_override("font_size", 18)
	line1.add_theme_font_override("font", _kai)
	line1.add_theme_color_override("font_color", Color("#35281c"))
	box.add_child(line1)

	var attrs_line := Label.new()
	var parts: Array = []
	for a in ATTRS:
		parts.append("%s %d" % [a["key"], int(_attrs[a["key"]])])
	attrs_line.text = "　".join(parts)
	attrs_line.add_theme_font_size_override("font_size", 18)
	attrs_line.add_theme_font_override("font", _kai)
	attrs_line.add_theme_color_override("font_color", Color("#35281c"))
	box.add_child(attrs_line)

	var perk_title := Label.new()
	perk_title.text = "前世天赋"
	perk_title.add_theme_font_size_override("font_size", 14)
	perk_title.add_theme_color_override("font_color", Color("#76603d"))
	box.add_child(perk_title)

	if _perk_ids.is_empty():
		var none := Label.new()
		none.text = "未选择天赋。"
		none.add_theme_font_size_override("font_size", 13)
		none.add_theme_color_override("font_color", Color("#7b6b58"))
		box.add_child(none)
	else:
		var grid := GridContainer.new()
		grid.columns = 3
		grid.add_theme_constant_override("h_separation", 12)
		grid.add_theme_constant_override("v_separation", 10)
		box.add_child(grid)
		for pid in _perk_ids:
			for pd in PERKS:
				if str(pd["id"]) == str(pid):
					var l := Label.new()
					l.text = "%s · %s" % [pd["name"], pd["effect"]]
					l.add_theme_font_size_override("font_size", 13)
					l.add_theme_color_override("font_color", Color("#5c4f3d"))
					grid.add_child(l)


## ---------- 底栏（.creation-footer：返回标题 | n/6 | 下一步/踏入仙途） ----------

func _build_footer() -> void:
	_footer_left = _brush_button("返回标题", true)
	_footer_left.position = Vector2(STEPS_X, FOOTER_Y)
	_footer_left.size = Vector2(240, 48)
	_footer_left.pressed.connect(func(): SceneManager.switch_scene("start_menu"))
	add_child(_footer_left)

	_footer_hint = Label.new()
	_footer_hint.position = Vector2(STEPS_X + 240, FOOTER_Y)
	_footer_hint.size = Vector2(STEPS_W - 480, 48)
	_footer_hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_footer_hint.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_footer_hint.add_theme_font_size_override("font_size", 12)
	_footer_hint.add_theme_color_override("font_color", Color("#8c7962"))
	add_child(_footer_hint)

	_footer_right = _brush_button("下一步", false)
	_footer_right.position = Vector2(STEPS_X + STEPS_W - 240, FOOTER_Y)
	_footer_right.size = Vector2(240, 48)
	_footer_right.pressed.connect(_on_next)
	add_child(_footer_right)


func _refresh_footer() -> void:
	_footer_hint.text = "%d / 6" % (_step + 1)
	match _step:
		0:
			_footer_right.text = "下一步"
			_footer_right.disabled = _full_name().is_empty()
			_footer_hint.text = "输入姓名后继续" if _footer_right.disabled else "1 / 6"
		5:
			_footer_right.text = "踏入仙途"
			_footer_right.disabled = false
		_:
			_footer_right.text = "下一步"
			_footer_right.disabled = false
	# 禁用态视觉反馈（web .creation-footer button:disabled { opacity:.35 }）
	_footer_right.modulate = Color(1, 1, 1, 0.35) if _footer_right.disabled else Color.WHITE


func _on_next() -> void:
	if _step < 5:
		_step += 1
		_refresh()
		_refresh_footer()
		return
	# 完成创建：写入档案 → 开局 → 开场 CG
	Game.profile = {
		"gender": _gender,
		"outfit": _outfit,
		"difficulty": _difficulty,
		"fate": str(_fate["name"]),
		"perks": _perk_ids.duplicate(),
		"attributes": _attrs.duplicate(),
	}
	Game.new_game(_full_name())
	SceneManager.switch_scene("entry_cg")


## ---------- 通用控件 ----------

func _h1(text: String) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", 26)
	l.add_theme_font_override("font", _kai)
	l.add_theme_color_override("font_color", Color("#2f261d"))
	return l


func _h1_at(text: String, y: float) -> Label:
	var l := _h1(text)
	l.position = Vector2(0, y)
	return l


func _h2(text: String) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", 16)
	l.add_theme_color_override("font_color", Color("#3a2b1b"))
	return l


func _option_card(text: String, sub: String, selected: bool) -> Button:
	var b := Button.new()
	b.focus_mode = Control.FOCUS_NONE
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.99, 0.97, 0.93, 0.92) if selected else Color(1, 1, 1, 0.5)
	sb.border_color = Color("#b88a2f") if selected else Color("#b7a17b", 0.6)
	sb.set_border_width_all(2 if selected else 1)
	sb.set_corner_radius_all(5)
	sb.set_content_margin_all(10)
	b.add_theme_stylebox_override("normal", sb)
	var sb_h := sb.duplicate()
	sb_h.border_color = Color("#b88a2f")
	b.add_theme_stylebox_override("hover", sb_h)
	var box := VBoxContainer.new()
	box.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	box.alignment = BoxContainer.ALIGNMENT_CENTER
	box.mouse_filter = Control.MOUSE_FILTER_IGNORE
	b.add_child(box)
	var l := Label.new()
	l.text = text
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.add_theme_font_size_override("font_size", 18)
	l.add_theme_font_override("font", _kai)
	l.add_theme_color_override("font_color", Color("#35281c"))
	box.add_child(l)
	if not sub.is_empty():
		var s := Label.new()
		s.text = sub
		s.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		s.add_theme_font_size_override("font_size", 11)
		s.add_theme_color_override("font_color", Color("#7b6b58"))
		box.add_child(s)
	return b


func _tall_card(title: String, desc: String, meta: String, selected: bool) -> Button:
	var b := Button.new()
	b.focus_mode = Control.FOCUS_NONE
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.99, 0.97, 0.93, 0.92) if selected else Color(1, 1, 1, 0.5)
	sb.border_color = Color("#b88a2f") if selected else Color("#b7a17b", 0.6)
	sb.set_border_width_all(2 if selected else 1)
	sb.set_corner_radius_all(6)
	sb.set_content_margin_all(16)
	b.add_theme_stylebox_override("normal", sb)
	var sb_h := sb.duplicate()
	sb_h.border_color = Color("#b88a2f")
	b.add_theme_stylebox_override("hover", sb_h)
	var box := VBoxContainer.new()
	box.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	box.alignment = BoxContainer.ALIGNMENT_CENTER
	box.add_theme_constant_override("separation", 6)
	box.mouse_filter = Control.MOUSE_FILTER_IGNORE
	b.add_child(box)
	var t := Label.new()
	t.text = title
	t.add_theme_font_size_override("font_size", 21)
	t.add_theme_font_override("font", _kai)
	t.add_theme_color_override("font_color", Color("#35281c"))
	box.add_child(t)
	if not meta.is_empty():
		var m := Label.new()
		m.text = meta
		m.add_theme_font_size_override("font_size", 12)
		m.add_theme_color_override("font_color", Color("#a87318"))
		box.add_child(m)
	var d := Label.new()
	d.text = desc
	d.add_theme_font_size_override("font_size", 12)
	d.add_theme_color_override("font_color", Color("#7b6b58"))
	d.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	box.add_child(d)
	return b


## 毛笔按钮（brush-primary.png 白字 / brush-secondary.png 深字）
func _brush_button(text: String, secondary: bool) -> Button:
	var b := Button.new()
	b.focus_mode = Control.FOCUS_NONE
	b.text = ""
	var tex := TextureRect.new()
	var path := "res://assets/onboarding/brush-secondary.png" if secondary else "res://assets/onboarding/brush-primary.png"
	if ResourceLoader.exists(path):
		tex.texture = load(path)
	tex.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	tex.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	tex.stretch_mode = TextureRect.STRETCH_SCALE
	tex.mouse_filter = Control.MOUSE_FILTER_IGNORE
	b.add_child(tex)
	var l := Label.new()
	l.text = text
	l.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	l.add_theme_font_size_override("font_size", 19)
	l.add_theme_font_override("font", _kai)
	l.add_theme_color_override("font_color", Color("#40362d") if secondary else Color("#fff7e4"))
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	b.add_child(l)
	var sb := StyleBoxEmpty.new()
	for style in ["normal", "hover", "pressed", "disabled"]:
		b.add_theme_stylebox_override(style, sb)
	return b


func _plain_button(text: String, w: int, h: int) -> Button:
	var b := Button.new()
	b.text = text
	b.focus_mode = Control.FOCUS_NONE
	b.custom_minimum_size = Vector2(w, h)
	b.add_theme_font_size_override("font_size", 17)
	b.add_theme_color_override("font_color", Color("#3a2b1b"))
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(1, 1, 1, 0.6)
	sb.border_color = Color("#b7a17b")
	sb.set_border_width_all(1)
	sb.set_corner_radius_all(4)
	b.add_theme_stylebox_override("normal", sb)
	var sb_h := sb.duplicate()
	sb_h.bg_color = Color(1, 1, 1, 0.85)
	sb_h.border_color = Color("#b88a2f")
	b.add_theme_stylebox_override("hover", sb_h)
	return b


func _refresh_preview_name() -> void:
	var full := _full_name()
	_preview_name.text = full if not full.is_empty() else "未命名修士"
	if _step == 0:
		_refresh_footer()
