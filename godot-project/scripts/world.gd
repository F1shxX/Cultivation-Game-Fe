extends Control
## 主城（web demo 风格 hub）：9 大场景导航 + 顶部 HUD + 场景交互 + 事件触发 + 日志
## 对应 web demo 的 SceneNavigator / TopHud / SceneActionPanel

const SCENES := {
	"hall": {"label": "大厅", "subtitle": "鹿石宗平日议事之处", "image": "res://assets/tapflow/scenes/hall.webp", "npc": "鹿真人", "actions": ["门规"]},
	"plaza": {"label": "广场", "subtitle": "随性铺就的青石空地", "image": "res://assets/tapflow/scenes/plaza.webp", "npc": "小娴", "actions": ["交谈"]},
	"dormitory": {"label": "宿舍", "subtitle": "干净但简陋的小屋", "image": "res://assets/tapflow/scenes/dormitory.webp", "npc": "小张", "actions": ["交谈", "打坐"]},
	"sister_room": {"label": "师姐居室", "subtitle": "药香和茶香混在一起", "image": "res://assets/tapflow/scenes/sister-room.webp", "npc": "小娴", "actions": ["请教"]},
	"meditation_room": {"label": "闭关室", "subtitle": "石壁上刻着粗糙阵纹", "image": "res://assets/tapflow/scenes/meditation-room.webp", "npc": "", "actions": ["修炼"]},
	"forge": {"label": "炼器坊", "subtitle": "火星、矿石和小张的豪言", "image": "res://assets/tapflow/scenes/forge.webp", "npc": "", "actions": ["炼器"]},
	"alchemy_room": {"label": "炼丹房", "subtitle": "小娴管得最严的房间", "image": "res://assets/tapflow/scenes/alchemy-room.webp", "npc": "", "actions": ["炼丹"]},
	"spirit_garden": {"label": "灵植园", "subtitle": "后山一小片灵田", "image": "res://assets/tapflow/scenes/spirit-garden.webp", "npc": "小娴", "actions": ["采集"]},
	"teleport_array": {"label": "传送阵", "subtitle": "鹿石宗外出全靠它", "image": "res://assets/tapflow/scenes/teleport-array.webp", "npc": "", "actions": ["外出"]},
}

const NPC_DIALOGUES := {
	"鹿真人": [
		{"speaker": "鹿真人", "text": "宗门大殿重地，不得喧哗。有事说事，没事修行。"},
		{"speaker": "鹿真人", "text": "你灵根虽杂，胜在什么都能学。莫要贪多嚼不烂。"},
	],
	"小娴": [
		{"speaker": "小娴", "text": "灵植园的灵草三个月一熟，记得来收。缺灵草就别去炼丹房瞎折腾。"},
		{"speaker": "小娴", "text": "修行不急一时——急也急不来。有不懂的问我，别问小张。"},
	],
	"小张": [
		{"speaker": "小张", "text": "师弟！跟我混准没错。大师兄我迟早结丹，到时候你就是结丹真人的师弟！"},
		{"speaker": "小张", "text": "缺灵石了？后山那点事……嘘，等风头过了再说。"},
	],
}

## 场景 NPC 交互（对齐 web sceneNpcInteractions：问候语 + 两个互动选项）
const NPC_INTERACTIONS := {
	"hall": {"greeting": "小张抱着一卷门规站在大厅里，神情严肃得像是马上要主持宗门大典。", "choices": [
		{"label": "问问宗门近况", "response": "鹿真人又云游去了。宗门大小事务嘛……自然暂由本大师兄主持。"},
		{"label": "提醒牌匾歪了", "response": "这叫随性自然。你要实在看不惯，等会儿搭把手扶正。"},
	]},
	"plaza": {"greeting": "小张靠着木桩冲你招手，显然又在盘算新的宗门活动。", "choices": [
		{"label": "和他打招呼", "response": "师弟来得正好！本真人正缺一个见证我绝世剑法的人。"},
		{"label": "问今天做什么", "response": "先把宗门逛熟。要是还闲着，扫扫广场，说不定真能捡到灵石。"},
	]},
	"dormitory": {"greeting": "小张从门边探出头，压低声音提醒你别把小娴留下的丹药忘在桌上。", "choices": [
		{"label": "问他为何在这里", "response": "我只是路过！顺便确认师弟有没有偷懒……绝不是来找零食。"},
		{"label": "请他安静些", "response": "好好好，你休息。本大师兄替你守门，保证谁都不来打扰。"},
	]},
	"sister_room": {"greeting": "小娴放下手里的药册，为你添了一盏温茶。", "choices": [
		{"label": "一起喝茶", "response": "小娴笑着推来茶盏，药香与茶香慢慢散开。"},
		{"label": "问问小张近况", "response": "他方才还说要炼一件惊天法宝。你若听见炸炉声，记得先躲远些。"},
	]},
	"meditation_room": {"greeting": "鹿真人的身影停在阵纹旁，似真似幻，像是一缕留在此处的神念。", "choices": [
		{"label": "请教万化道躯", "response": "莫急着给自己定形。能容万法，先要学会辨认何为自己的道。"},
		{"label": "询问闭关要诀", "response": "闭关不是与世隔绝。心有所悟时入定，心有挂碍时便出去走走。"},
	]},
	"forge": {"greeting": "小张举起一把刚出炉的短剑，似乎很希望你先夸一句。", "choices": [
		{"label": "评价这把短剑", "response": "有眼光！虽然离绝世神兵还差一点，但拿去换灵石肯定不亏。"},
		{"label": "问问炉火", "response": "火候最重要。小娴说我总开得太旺，我觉得那叫气势。"},
	]},
	"alchemy_room": {"greeting": "小娴守在丹炉旁，见你靠近便递来一块隔热的软布。", "choices": [
		{"label": "询问炼丹进度", "response": "火候正好，再等一会儿便能收丹。小张今天不在，应该不会出岔子。"},
		{"label": "问能否帮忙", "response": "帮我把右边第二格的药匣拿来吧。慢些，别碰到炉壁。"},
	]},
	"spirit_garden": {"greeting": "小娴蹲在灵田边松土，衣袖上沾了几片细小的草叶。", "choices": [
		{"label": "询问灵草长势", "response": "这批长得很好。再照料一阵，就能留一部分炼丹，其余收入仓库。"},
		{"label": "帮她浇水", "response": "多谢。沿着根部慢慢浇就好，别学小张直接用引水术冲。"},
	]},
	"teleport_array": {"greeting": "鹿真人站在忽明忽暗的阵纹前，像是早已知道你会来。", "choices": [
		{"label": "询问传送去处", "response": "阵盘会记住曾经抵达的地方。先检查阵纹，再选择你真正想去的方向。"},
		{"label": "问阵法是否安全", "response": "能到地方。至于落地时是站着还是坐着，要看今日阵灵的心情。"},
	]},
}

var _background: TextureRect
var _dialogue: CanvasLayer
var _hud: Control
var _player_name_label: Label
var _player_sub_label: Label
var _time_label: Label
var _place_label: Label
var _nav: Panel
var _list: VBoxContainer
var _toast: Label
var _toast_tween: Tween
var _log_panel: PanelContainer
var _log_text: RichTextLabel
var _log_open := false
var _npc_strip: Button
var _npc_avatar: TextureRect
var _npc_name_label: Label
var _npc_sub_label: Label

## NPC 交互模态（.scene-modal-backdrop + .scene-interaction-modal：720 宽，左立绘右内容）
var _npc_modal: ColorRect
var _npc_modal_win: Panel
var _npc_modal_portrait: TextureRect
var _npc_modal_bond: Label
var _npc_modal_name: Label
var _npc_modal_response: RichTextLabel
var _npc_modal_choices: VBoxContainer
var _npc_modal_open := false

## 顶部 HUD —— 对齐 web .top-hud：玩家卡（左 405px，头像+楷体道号+副信息）+ 右侧时间/场景卡 + 快捷按钮
const PLAYER_CARD_SIZE := Vector2(405, 72)
const HUD_TOP := Vector2(20, 18)


func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)

	_background = TextureRect.new()
	_background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_background.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	_background.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	add_child(_background)

	_dialogue = preload("res://scripts/dialogue_box.gd").new()
	add_child(_dialogue)

	_build_hud()
	_build_nav()
	_build_scene_ui()
	_build_npc_strip()
	_build_npc_modal()
	_apply_scene(Game.scene_key)


## ---------- 顶部 HUD（.top-hud / .player-card / .place-time / .hud-quick-actions） ----------

func _build_hud() -> void:
	_hud = Control.new()
	_hud.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_hud.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_hud)

	# ---- 左：玩家卡（.player-card）----
	var card := Panel.new()
	card.position = HUD_TOP
	card.size = PLAYER_CARD_SIZE
	# 背景：深绿→棕渐变 + 金边 + 左侧 3px 金条
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.16, 0.11, 0.08, 0.85)
	sb.border_color = Color(0.97, 0.87, 0.63, 0.38)
	sb.set_border_width_all(1)
	sb.set_border_width(Side.SIDE_LEFT, 3)
	sb.set_corner_radius_all(5)
	sb.content_margin_left = 82
	sb.content_margin_top = 13
	sb.content_margin_right = 20
	sb.content_margin_bottom = 11
	card.add_theme_stylebox_override("panel", sb)
	_hud.add_child(card)

	# 头像：圆形 54px（.avatar img：cover + scale 1.16）
	var avatar_bg := Panel.new()
	avatar_bg.position = Vector2(12, 8)
	avatar_bg.size = Vector2(54, 54)
	var a_sb := StyleBoxFlat.new()
	a_sb.bg_color = Color(0.141, 0.125, 0.106)
	a_sb.border_color = Color(0.97, 0.86, 0.59, 0.74)
	a_sb.set_border_width_all(1)
	a_sb.set_corner_radius_all(27)
	avatar_bg.add_theme_stylebox_override("panel", a_sb)
	avatar_bg.clip_contents = true
	card.add_child(avatar_bg)
	var avatar := TextureRect.new()
	avatar.texture = load("res://assets/tapflow/portraits/player-normal.webp")
	avatar.position = Vector2(-4, -6)
	avatar.size = Vector2(62, 66)
	avatar.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	avatar.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	avatar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	avatar_bg.add_child(avatar)

	# 道号（楷体 20px，对应 STKaiti）
	_player_name_label = Label.new()
	_player_name_label.position = Vector2(82, 13)
	_player_name_label.size = Vector2(303, 20)
	_player_name_label.add_theme_font_size_override("font_size", 20)
	_player_name_label.add_theme_font_override("font", _kai_font())
	_player_name_label.add_theme_color_override("font_color", Color(1, 0.957, 0.827))
	_player_name_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	card.add_child(_player_name_label)

	# 副信息（12px 灰绿）
	_player_sub_label = Label.new()
	_player_sub_label.position = Vector2(82, 40)
	_player_sub_label.size = Vector2(303, 15)
	_player_sub_label.add_theme_font_size_override("font_size", 12)
	_player_sub_label.add_theme_color_override("font_color", Color(0.788, 0.847, 0.82))
	_player_sub_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	card.add_child(_player_sub_label)

	# ---- 右：时间/场景卡 + 快捷按钮（.hud-right 网格，右对齐）----
	var right_x := 1920 - 20

	# 快捷按钮（.hud-quick-actions：任务/设置，52×52，楷体 14px）
	# web .hud-right 为 grid 上下排布：place-time（18+56）+ gap 6 → y=80，避免与时间卡重叠
	var quick := HBoxContainer.new()
	quick.position = Vector2(right_x - 52 * 2 - 6, 18 + 56 + 6)
	quick.add_theme_constant_override("separation", 6)
	_hud.add_child(quick)
	for pair in [["任务", "日志"], ["设置", "设置"]]:
		var qb := Button.new()
		qb.text = pair[0]
		qb.custom_minimum_size = Vector2(52, 52)
		qb.add_theme_font_size_override("font_size", 14)
		qb.add_theme_font_override("font", _kai_font())
		qb.add_theme_color_override("font_color", Color(1, 0.98, 0.941))
		var q_sb := StyleBoxFlat.new()
		q_sb.bg_color = Color(0.066, 0.102, 0.11, 0.82)
		q_sb.border_color = Color(0.97, 0.87, 0.63, 0.34)
		q_sb.set_border_width_all(1)
		q_sb.set_corner_radius_all(5)
		q_sb.set_content_margin_all(9)
		qb.add_theme_stylebox_override("normal", q_sb)
		var q_h := q_sb.duplicate()
		q_h.border_color = Color(0.96, 0.81, 0.43, 0.82)
		q_h.bg_color = Color(0.21, 0.16, 0.09, 0.92)
		qb.add_theme_stylebox_override("hover", q_h)
		qb.pressed.connect(_on_quick_pressed.bind(pair[1]))
		quick.add_child(qb)

	# 时间/场景卡（.place-time：右对齐、上时间小字下场景大字）
	var place_time := Panel.new()
	place_time.size = Vector2(152, 56)
	place_time.position = Vector2(right_x - 152, 18)
	var p_sb := StyleBoxFlat.new()
	p_sb.bg_color = Color(0.051, 0.047, 0.039, 0.62)
	p_sb.border_color = Color(0.97, 0.87, 0.63, 0.34)
	p_sb.set_border_width_all(1)
	p_sb.set_corner_radius_all(5)
	p_sb.set_content_margin_all(10)
	place_time.add_theme_stylebox_override("panel", p_sb)
	place_time.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_hud.add_child(place_time)

	_time_label = Label.new()
	_time_label.position = Vector2(10, 6)
	_time_label.size = Vector2(132, 14)
	_time_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	_time_label.add_theme_font_size_override("font_size", 12)
	_time_label.add_theme_color_override("font_color", Color(1, 0.969, 0.906))
	_time_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	place_time.add_child(_time_label)

	_place_label = Label.new()
	_place_label.position = Vector2(10, 22)
	_place_label.size = Vector2(132, 24)
	_place_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	_place_label.add_theme_font_size_override("font_size", 16)
	_place_label.add_theme_color_override("font_color", Color(0.961, 0.867, 0.678))
	_place_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	place_time.add_child(_place_label)


func _kai_font() -> FontFile:
	if not has_meta("kai"):
		var k := FontFile.new()
		k.load_dynamic_font("res://fonts/KaiTi.ttf")
		set_meta("kai", k)
	return get_meta("kai")


func _on_quick_pressed(kind: String) -> void:
	match kind:
		"日志":
			_toggle_log()
		"设置":
			_toggle_log()  # Godot 版暂无设置面板，与日志同入口


func _build_nav() -> void:
	# 左侧竖栏（.scene-left-rail）：top 110, left 20, 宽 248，深绿→棕渐变 + 金边
	_nav = Panel.new()
	_nav.position = Vector2(20, 110)
	_nav.size = Vector2(248, 950)
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.07, 0.114, 0.122, 0.92)
	sb.border_color = Color(0.965, 0.871, 0.631, 0.3)
	sb.set_border_width_all(1)
	sb.set_corner_radius_all(6)
	sb.set_content_margin_all(10)
	_nav.add_theme_stylebox_override("panel", sb)
	add_child(_nav)

	# 内容列表（heading + 按钮列表，gap 6）
	_list = VBoxContainer.new()
	_list.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_list.add_theme_constant_override("separation", 6)
	_nav.add_child(_list)


func _build_scene_ui() -> void:
	_toast = Label.new()
	_toast.position = Vector2(660, 430)
	_toast.size = Vector2(600, 60)
	_toast.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_toast.add_theme_font_size_override("font_size", 30)
	_toast.add_theme_color_override("font_color", Color(1, 0.95, 0.8))
	_toast.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.9))
	_toast.add_theme_constant_override("shadow_offset_x", 2)
	_toast.add_theme_constant_override("shadow_offset_y", 2)
	_toast.modulate.a = 0.0
	add_child(_toast)

	# 日志面板（深底金边，与整体面板风格一致）
	_log_panel = PanelContainer.new()
	_log_panel.position = Vector2(420, 150)
	_log_panel.size = Vector2(1080, 700)
	_log_panel.visible = false
	var log_sb := StyleBoxFlat.new()
	log_sb.bg_color = Color(0.051, 0.047, 0.039, 0.92)
	log_sb.border_color = Color(0.965, 0.871, 0.631, 0.3)
	log_sb.set_border_width_all(1)
	log_sb.set_corner_radius_all(8)
	log_sb.set_content_margin_all(24)
	_log_panel.add_theme_stylebox_override("panel", log_sb)
	add_child(_log_panel)

	_log_text = RichTextLabel.new()
	_log_text.add_theme_font_size_override("normal_font_size", 22)
	_log_text.add_theme_color_override("default_color", Color(0.93, 0.9, 0.85))
	_log_text.scroll_following = true
	_log_panel.add_child(_log_text)


## ---------- 右下角 NPC 交互条（.scene-npc-strip：244×66，圆头像 + 楷体名 + 羁绊小字 + 箭头） ----------

const NPC_PORTRAITS := {
	"鹿真人": "res://assets/tapflow/portraits/lu-normal.webp",
	"小娴": "res://assets/tapflow/portraits/xiaoxian-normal.webp",
	"小张": "res://assets/tapflow/portraits/xiaozhang-normal.webp",
}

func _build_npc_strip() -> void:
	_npc_strip = Button.new()
	# web：right 20, bottom 20 → (1920-20-244, 1080-20-66)
	_npc_strip.position = Vector2(1656, 994)
	_npc_strip.size = Vector2(244, 66)
	# 深绿→棕渐变的近似色 + 金边 + 圆角 5（.scene-npc-strip button）
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.122, 0.118, 0.102, 0.89)
	sb.border_color = Color(0.965, 0.867, 0.631, 0.3)
	sb.set_border_width_all(1)
	sb.set_corner_radius_all(5)
	sb.content_margin_left = 5
	sb.content_margin_right = 10
	_npc_strip.add_theme_stylebox_override("normal", sb)
	var sb_h := sb.duplicate()
	sb_h.bg_color = Color(0.208, 0.153, 0.098, 0.92)
	sb_h.border_color = Color(0.961, 0.804, 0.431, 0.72)
	_npc_strip.add_theme_stylebox_override("hover", sb_h)
	var sb_p := sb.duplicate()
	sb_p.bg_color = Color(0.208, 0.153, 0.098, 0.98)
	_npc_strip.add_theme_stylebox_override("pressed", sb_p)
	add_child(_npc_strip)

	var inner := HBoxContainer.new()
	inner.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	inner.add_theme_constant_override("separation", 9)
	inner.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_npc_strip.add_child(inner)

	# 圆头像 54×54（border rgba(238,219,164,0.62)，object-position center 18%）
	var avatar_frame := Panel.new()
	avatar_frame.custom_minimum_size = Vector2(54, 54)
	avatar_frame.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	var a_sb := StyleBoxFlat.new()
	a_sb.bg_color = Color(0.157, 0.133, 0.114)
	a_sb.border_color = Color(0.933, 0.859, 0.643, 0.62)
	a_sb.set_border_width_all(1)
	a_sb.set_corner_radius_all(27)
	avatar_frame.add_theme_stylebox_override("panel", a_sb)
	avatar_frame.clip_contents = true
	avatar_frame.mouse_filter = Control.MOUSE_FILTER_IGNORE
	inner.add_child(avatar_frame)
	_npc_avatar = TextureRect.new()
	_npc_avatar.position = Vector2(0, -10)
	_npc_avatar.size = Vector2(54, 70)
	_npc_avatar.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	_npc_avatar.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	_npc_avatar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	avatar_frame.add_child(_npc_avatar)

	# 名字（楷体 19px）+ 羁绊小字（11px）
	var texts := VBoxContainer.new()
	texts.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	texts.alignment = BoxContainer.ALIGNMENT_CENTER
	texts.mouse_filter = Control.MOUSE_FILTER_IGNORE
	inner.add_child(texts)
	_npc_name_label = Label.new()
	_npc_name_label.add_theme_font_size_override("font_size", 19)
	_npc_name_label.add_theme_font_override("font", _kai_font())
	_npc_name_label.add_theme_color_override("font_color", Color(1, 0.973, 0.906))
	_npc_name_label.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	texts.add_child(_npc_name_label)
	_npc_sub_label = Label.new()
	_npc_sub_label.add_theme_font_size_override("font_size", 11)
	_npc_sub_label.add_theme_color_override("font_color", Color(0.749, 0.82, 0.784))
	_npc_sub_label.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	texts.add_child(_npc_sub_label)

	# 右侧箭头（7×7 旋转 45° 的 CSS chevron）
	var chevron := Label.new()
	chevron.text = "›"
	chevron.add_theme_font_size_override("font_size", 22)
	chevron.add_theme_color_override("font_color", Color(1, 0.914, 0.698, 0.76))
	chevron.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	chevron.mouse_filter = Control.MOUSE_FILTER_IGNORE
	inner.add_child(chevron)

	_npc_strip.pressed.connect(_on_npc_strip_pressed)
	_npc_strip.visible = false


func _on_npc_strip_pressed() -> void:
	var npc: String = SCENES[Game.scene_key].get("npc", "")
	if not npc.is_empty():
		_open_npc_modal()


## ---------- NPC 交互模态（.scene-interaction-modal：720×420，左 220 立绘 + 右内容） ----------

func _build_npc_modal() -> void:
	_npc_modal = ColorRect.new()
	_npc_modal.color = Color(0.016, 0.024, 0.027, 0.7)
	_npc_modal.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_npc_modal.visible = false
	_npc_modal.gui_input.connect(_on_npc_backdrop_input)
	add_child(_npc_modal)

	_npc_modal_win = Panel.new()
	_npc_modal_win.position = Vector2((1920 - 720) / 2.0, (1080 - 440) / 2.0)
	_npc_modal_win.size = Vector2(720, 440)
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.07, 0.09, 0.095, 0.97)
	sb.border_color = Color(0.957, 0.843, 0.52, 0.48)
	sb.set_border_width_all(1)
	sb.set_corner_radius_all(12)
	_npc_modal_win.add_theme_stylebox_override("panel", sb)
	_npc_modal.add_child(_npc_modal_win)

	# ---- 左列：立绘 + 羁绊 + 姓名（.scene-interaction-person） ----
	var person := Panel.new()
	person.position = Vector2.ZERO
	person.size = Vector2(230, 440)
	var p_sb := StyleBoxFlat.new()
	p_sb.bg_color = Color(0.122, 0.176, 0.184, 0.7)
	p_sb.set_border_width_all(0)
	p_sb.set_border_width(Side.SIDE_RIGHT, 1)
	p_sb.border_color = Color(0.957, 0.843, 0.52, 0.18)
	person.add_theme_stylebox_override("panel", p_sb)
	person.clip_contents = true
	_npc_modal_win.add_child(person)

	_npc_modal_portrait = TextureRect.new()
	_npc_modal_portrait.position = Vector2(18, 14)
	_npc_modal_portrait.size = Vector2(194, 330)
	_npc_modal_portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	_npc_modal_portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	_npc_modal_portrait.modulate = Color(1, 1, 1, 0.86)
	person.add_child(_npc_modal_portrait)

	_npc_modal_bond = Label.new()
	_npc_modal_bond.position = Vector2(24, 352)
	_npc_modal_bond.size = Vector2(182, 16)
	_npc_modal_bond.add_theme_font_size_override("font_size", 12)
	_npc_modal_bond.add_theme_color_override("font_color", Color(0.608, 0.839, 1.0))
	person.add_child(_npc_modal_bond)

	_npc_modal_name = Label.new()
	_npc_modal_name.position = Vector2(24, 370)
	_npc_modal_name.size = Vector2(182, 44)
	_npc_modal_name.add_theme_font_size_override("font_size", 32)
	_npc_modal_name.add_theme_font_override("font", _kai_font())
	_npc_modal_name.add_theme_color_override("font_color", Color(1, 0.949, 0.741))
	_npc_modal_name.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.8))
	person.add_child(_npc_modal_name)

	# ---- 右列：眉标 + 回应文本 + 选项 + 页签（.scene-interaction-content） ----
	var eyebrow := Label.new()
	eyebrow.text = "场 中 对 谈"
	eyebrow.position = Vector2(272, 42)
	eyebrow.size = Vector2(414, 16)
	eyebrow.add_theme_font_size_override("font_size", 12)
	eyebrow.add_theme_color_override("font_color", Color(0.608, 0.839, 1.0))
	_npc_modal_win.add_child(eyebrow)

	_npc_modal_response = RichTextLabel.new()
	_npc_modal_response.position = Vector2(272, 70)
	_npc_modal_response.size = Vector2(414, 150)
	_npc_modal_response.add_theme_font_size_override("normal_font_size", 18)
	_npc_modal_response.add_theme_color_override("default_color", Color(1, 0.969, 0.889))
	_npc_modal_response.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_npc_modal_win.add_child(_npc_modal_response)

	_npc_modal_choices = VBoxContainer.new()
	_npc_modal_choices.position = Vector2(272, 232)
	_npc_modal_choices.size = Vector2(414, 130)
	_npc_modal_choices.add_theme_constant_override("separation", 9)
	_npc_modal_win.add_child(_npc_modal_choices)

	# 页签行（web：返回场景 | 属性 | 背包 | 装备 | 功法 | 术法）
	var tabs := HBoxContainer.new()
	tabs.position = Vector2(272, 376)
	tabs.size = Vector2(414, 44)
	tabs.add_theme_constant_override("separation", 8)
	_npc_modal_win.add_child(tabs)
	var tab_defs := [
		["属性", "五维属性"], ["背包", "资源道具"], ["装备", "武器护具"],
		["功法", "主修切换"], ["术法", "技能配置"],
	]
	for td in tab_defs:
		var tb := _npc_tab_button(str(td[0]))
		tb.pressed.connect(_on_npc_tab_pressed.bind(str(td[1])))
		tabs.add_child(tb)
	var close_tab := _npc_tab_button("返回场景")
	close_tab.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	close_tab.pressed.connect(_close_npc_modal)
	tabs.add_child(close_tab)

	# 右上关闭圆钮（.scene-modal-close：36px 圆）
	var close := Button.new()
	close.text = "✕"
	close.position = Vector2(720 - 50, 12)
	close.size = Vector2(36, 36)
	close.focus_mode = Control.FOCUS_NONE
	close.add_theme_font_size_override("font_size", 18)
	close.add_theme_color_override("font_color", Color(1, 0.945, 0.749))
	var c_sb := StyleBoxFlat.new()
	c_sb.bg_color = Color(0, 0, 0, 0.46)
	c_sb.border_color = Color(1, 0.941, 0.792, 0.24)
	c_sb.set_border_width_all(1)
	c_sb.set_corner_radius_all(18)
	close.add_theme_stylebox_override("normal", c_sb)
	var c_h := c_sb.duplicate()
	c_h.bg_color = Color(0.329, 0.224, 0.133, 0.88)
	c_h.border_color = Color(1, 0.941, 0.792, 0.7)
	close.add_theme_stylebox_override("hover", c_h)
	close.pressed.connect(_close_npc_modal)
	_npc_modal_win.add_child(close)


func _npc_tab_button(text: String) -> Button:
	var b := Button.new()
	b.text = text
	b.focus_mode = Control.FOCUS_NONE
	b.custom_minimum_size = Vector2(72, 44)
	b.add_theme_font_size_override("font_size", 14)
	b.add_theme_color_override("font_color", Color(1, 0.945, 0.749))
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.357, 0.255, 0.145, 0.88)
	sb.border_color = Color(0.957, 0.843, 0.52, 0.35)
	sb.set_border_width_all(1)
	sb.set_corner_radius_all(7)
	sb.set_content_margin(Side.SIDE_LEFT, 10)
	sb.set_content_margin(Side.SIDE_RIGHT, 10)
	b.add_theme_stylebox_override("normal", sb)
	var sb_h := sb.duplicate()
	sb_h.border_color = Color(0.608, 0.839, 1.0, 0.72)
	b.add_theme_stylebox_override("hover", sb_h)
	return b


func _open_npc_modal() -> void:
	if _dialogue.is_active() or _npc_modal_open:
		return
	var key: String = Game.scene_key
	var npc: String = SCENES[key].get("npc", "")
	if npc.is_empty():
		return
	var inter: Dictionary = NPC_INTERACTIONS.get(key, {})
	if inter.is_empty():
		return
	_npc_modal_open = true
	_npc_modal.visible = true
	_npc_modal_name.text = npc
	_npc_modal_bond.text = "羁绊 %d" % Game.get_bond(npc)
	var portrait_path: String = NPC_PORTRAITS.get(npc, "")
	if not portrait_path.is_empty() and ResourceLoader.exists(portrait_path):
		_npc_modal_portrait.texture = load(portrait_path)
	_npc_modal_response.text = str(inter.get("greeting", ""))
	# 互动选项（点击后更新回应文本）
	for c in _npc_modal_choices.get_children():
		c.queue_free()
	for choice in inter.get("choices", []):
		var cd: Dictionary = choice
		var btn := _npc_tab_button(str(cd.get("label", "")))
		btn.custom_minimum_size = Vector2(414, 44)
		btn.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		btn.pressed.connect(func():
			_npc_modal_response.text = str(cd.get("response", ""))
			Game.add_bond(npc)
			Game.save_game()
			_npc_modal_bond.text = "羁绊 %d" % Game.get_bond(npc)
			_refresh_npc_strip()
		)
		_npc_modal_choices.add_child(btn)


func _close_npc_modal() -> void:
	_npc_modal_open = false
	_npc_modal.visible = false


## Esc 关闭交互模态（对齐 web closeOnEscape）
func _unhandled_input(event: InputEvent) -> void:
	if _npc_modal_open and event.is_action_pressed("ui_cancel"):
		_close_npc_modal()
		get_viewport().set_input_as_handled()


func _on_npc_backdrop_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed:
		var win_rect := Rect2(_npc_modal_win.position, _npc_modal_win.size)
		if not win_rect.has_point(event.position):
			_close_npc_modal()


func _on_npc_tab_pressed(tab: String) -> void:
	# 页签内容（Godot 版以文本摘要呈现；web 打开对应系统面板）
	if tab == "五维属性":
		var attrs: Dictionary = Game.profile.get("attributes", {})
		_npc_modal_response.text = "五维属性\n资质 %d · 悟性 %d · 神识 %d · 遁速 %d · 福缘 %d" % [
			int(attrs.get("资质", 5)), int(attrs.get("悟性", 5)), int(attrs.get("神识", 5)),
			int(attrs.get("遁速", 5)), int(attrs.get("福缘", 5))]
	elif tab == "资源道具":
		var r: Dictionary = Game.resources
		_npc_modal_response.text = "背包\n灵石 %d · 灵髓 %d · 灵草 %d · 矿石 %d · 丹药 %d" % [
			int(r.get("spirit_stones", 0)), int(r.get("spirit_marrow", 0)),
			int(r.get("herbs", 0)), int(r.get("ore", 0)), int(r.get("pills", 0))]
	elif tab == "武器护具":
		_npc_modal_response.text = "装备\n行囊尚空——炼器坊开炉后，此处将陈列本命法宝。"
	elif tab == "主修切换":
		var names := []
		for art in Game.learned_arts:
			names.append(str(Game.ART_NAMES.get(art, art)))
		_npc_modal_response.text = "功法\n%s" % ("、".join(names) if not names.is_empty() else "尚未习得任何功法。")
	elif tab == "技能配置":
		_npc_modal_response.text = "术法\n主修术法随功法自动配置，战斗中以空格施展。"


func _refresh_npc_strip() -> void:
	var npc: String = SCENES[Game.scene_key].get("npc", "")
	_npc_strip.visible = not npc.is_empty()
	if npc.is_empty():
		return
	_npc_name_label.text = npc
	_npc_sub_label.text = "羁绊 %d · 交谈" % Game.get_bond(npc)
	var portrait_path: String = NPC_PORTRAITS.get(npc, "")
	if not portrait_path.is_empty() and ResourceLoader.exists(portrait_path):
		_npc_avatar.texture = load(portrait_path)


func _apply_scene(key: String) -> void:
	if not SCENES.has(key):
		key = "hall"
	Game.scene_key = key
	var cfg: Dictionary = SCENES[key]
	var img_path: String = cfg.get("image", "")
	if ResourceLoader.exists(img_path):
		_background.texture = load(img_path)
	_refresh_hud()
	_refresh_actions()
	_refresh_npc_strip()


func _refresh_hud() -> void:
	# 玩家卡（web：道号·宗门 / 第X年·境界期·功法名）
	_player_name_label.text = "%s · 鹿石宗" % Game.player_name
	_player_sub_label.text = "第 %d 年 · %s期 · %s" % [
		Game.year, Game.realm, _main_art_name()]
	# 时间/场景卡（web：formatTime 上小字，场景名下大字）
	_time_label.text = Game.date_text()
	_place_label.text = str(SCENES[Game.scene_key].get("label", ""))


func _main_art_name() -> String:
	for art_id in Game.learned_arts:
		return str(Game.ART_NAMES.get(art_id, art_id))
	return "未习功法"


func _refresh_actions() -> void:
	for c in _list.get_children():
		c.queue_free()
	var key: String = Game.scene_key
	var cfg: Dictionary = SCENES[key]

	if key == "plaza":
		# 广场：导航模式（.scene-nav-heading + 8 个场景路由按钮）
		_add_rail_heading("鹿石宗", "广场", "选择去处")
		for dest in SCENES:
			if dest == "plaza":
				continue
			var dcfg: Dictionary = SCENES[dest]
			_add_route_button(str(dcfg.get("label", "")), str(dcfg.get("subtitle", "")),
				str(dcfg.get("image", "")), _on_nav_pressed.bind(dest))
		return

	# 其他场景：场景操作模式（.scene-action-heading + 操作按钮 + 返回广场）
	_add_rail_heading("当前场景", str(cfg.get("label", "")), str(cfg.get("subtitle", "")))

	var npc: String = cfg.get("npc", "")
	if not npc.is_empty():
		_add_action_button("与%s交谈" % npc, "饮茶并闲聊几句", _open_npc_modal)
	for action in cfg.get("actions", []):
		var a := str(action)
		_add_action_button(a, _action_description(a), _on_action.bind(a))
	# 传送阵：事件列表（对齐 web teleport_array 的传送/复盘按钮）
	if key == "teleport_array":
		for event_id in Game.get_events():
			var def: Dictionary = Game.get_events()[event_id]
			var completed: bool = Game.is_event_completed(event_id)
			var unlocked: bool = Game.is_event_unlocked(event_id)
			var label := "%s · %s" % ["复盘" if completed else "传送", def.get("title", "")]
			_add_action_button(label, "第%d年 · %s" % [int(def.get("trigger_year", 1)), def.get("location", "")],
				_on_event_pressed.bind(event_id), not unlocked)
	# 返回广场（.return-to-plaza）
	_add_action_button("返回广场", "切换鹿石宗内的其他地点", _on_nav_pressed.bind("plaza"))


func _action_description(action: String) -> String:
	match action:
		"门规": return "查看鹿石宗门规"
		"打坐": return "恢复状态并推进时间"
		"修炼": return "提升修为并推进时间"
		"炼器": return "选材定型，炼制装备"
		"炼丹": return "配置五行药材并开炉"
		"采集": return "照料灵田并收获草药"
		"交谈": return "与师兄弟闲聊"
		"请教": return "向师姐请教修行疑惑"
		"外出": return "检查阵纹并外出历练"
		_: return ""


## 左栏标题卡（.scene-nav-heading：上小字 + 楷体大字 26px + 下小字）
func _add_rail_heading(top: String, main: String, bottom: String) -> void:
	var head := PanelContainer.new()
	head.custom_minimum_size = Vector2(0, 70)
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0, 0, 0, 0)
	sb.set_border_width_all(0)
	sb.set_border_width(Side.SIDE_BOTTOM, 1)
	sb.border_color = Color(0.973, 0.863, 0.592, 0.26)
	sb.content_margin_left = 4
	sb.content_margin_right = 12
	sb.content_margin_top = 8
	sb.content_margin_bottom = 8
	head.add_theme_stylebox_override("panel", sb)
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 2)
	head.add_child(box)
	for pair in [[top, 11, Color(0.851, 0.733, 0.471)], [main, 26, Color(1, 0.961, 0.851)], [bottom, 11, Color(0.718, 0.788, 0.757)]]:
		var l := Label.new()
		l.text = pair[0]
		l.add_theme_font_size_override("font_size", pair[1])
		l.add_theme_color_override("font_color", pair[2])
		if pair[1] == 26:
			l.add_theme_font_override("font", _kai_font())
		box.add_child(l)
	_list.add_child(head)


## 场景路由按钮（.scene-nav button：缩略图 52×44 + 楷体 18px + 副标题 10px，高 54）
func _add_route_button(label: String, subtitle: String, image_path: String, handler: Callable) -> void:
	var btn := Button.new()
	btn.custom_minimum_size = Vector2(0, 54)
	btn.toggle_mode = false

	var inner := HBoxContainer.new()
	inner.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	inner.add_theme_constant_override("separation", 10)
	inner.mouse_filter = Control.MOUSE_FILTER_IGNORE

	var img_frame := Panel.new()
	img_frame.custom_minimum_size = Vector2(52, 44)
	var i_sb := StyleBoxFlat.new()
	i_sb.bg_color = Color(0.1, 0.09, 0.08)
	i_sb.border_color = Color(0.965, 0.855, 0.588, 0.26)
	i_sb.set_border_width_all(1)
	i_sb.set_corner_radius_all(3)
	i_sb.set_content_margin_all(0)
	img_frame.add_theme_stylebox_override("panel", i_sb)
	img_frame.clip_contents = true
	inner.add_child(img_frame)
	if ResourceLoader.exists(image_path):
		var img := TextureRect.new()
		img.texture = load(image_path)
		img.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		img.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		img.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
		img.modulate = Color(1, 1, 1, 0.84)
		img.mouse_filter = Control.MOUSE_FILTER_IGNORE
		img_frame.add_child(img)

	var texts := VBoxContainer.new()
	texts.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	texts.alignment = BoxContainer.ALIGNMENT_CENTER
	texts.mouse_filter = Control.MOUSE_FILTER_IGNORE
	inner.add_child(texts)

	var l1 := Label.new()
	l1.text = label
	l1.add_theme_font_size_override("font_size", 18)
	l1.add_theme_font_override("font", _kai_font())
	l1.add_theme_color_override("font_color", Color(1, 0.953, 0.831))
	texts.add_child(l1)
	var l2 := Label.new()
	l2.text = subtitle
	l2.add_theme_font_size_override("font_size", 10)
	l2.add_theme_color_override("font_color", Color(0.71, 0.788, 0.753))
	l2.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	texts.add_child(l2)

	_style_rail_button(btn, Vector2(0, 54))
	btn.add_child(inner)
	btn.pressed.connect(handler)
	_list.add_child(btn)


## 场景操作按钮（.scene-actions button：36px 图标位 + 楷体 18px + 描述 10px，高 60）
func _add_action_button(label: String, description: String, handler: Callable, disabled := false) -> void:
	var btn := Button.new()
	btn.disabled = disabled

	var inner := HBoxContainer.new()
	inner.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	inner.add_theme_constant_override("separation", 10)
	inner.mouse_filter = Control.MOUSE_FILTER_IGNORE

	var icon_slot := Panel.new()
	icon_slot.custom_minimum_size = Vector2(34, 34)
	icon_slot.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	var i_sb := StyleBoxFlat.new()
	i_sb.bg_color = Color(1, 1, 1, 0.05)
	i_sb.set_border_width_all(1)
	i_sb.border_color = Color(0.965, 0.855, 0.588, 0.22)
	i_sb.set_corner_radius_all(3)
	icon_slot.add_theme_stylebox_override("panel", i_sb)
	inner.add_child(icon_slot)

	var texts := VBoxContainer.new()
	texts.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	texts.alignment = BoxContainer.ALIGNMENT_CENTER
	texts.mouse_filter = Control.MOUSE_FILTER_IGNORE
	inner.add_child(texts)

	var l1 := Label.new()
	l1.text = label
	l1.add_theme_font_size_override("font_size", 18)
	l1.add_theme_font_override("font", _kai_font())
	l1.add_theme_color_override("font_color", Color(1, 0.953, 0.831))
	l1.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	texts.add_child(l1)
	var l2 := Label.new()
	l2.text = description
	l2.add_theme_font_size_override("font_size", 10)
	l2.add_theme_color_override("font_color", Color(0.71, 0.788, 0.753))
	l2.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	texts.add_child(l2)

	_style_rail_button(btn, Vector2(0, 60))
	btn.add_child(inner)
	btn.pressed.connect(handler)
	_list.add_child(btn)


## 左栏按钮通用样式（.scene-nav button / .scene-actions button：半透明底 + 金边 + hover）
func _style_rail_button(btn: Button, min_size: Vector2) -> void:
	btn.custom_minimum_size = min_size
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(1, 0.988, 0.929, 0.06)
	sb.border_color = Color(0.961, 0.871, 0.639, 0.22)
	sb.set_border_width_all(1)
	sb.set_corner_radius_all(5)
	sb.set_content_margin_all(4)
	sb.content_margin_right = 18  # 右侧留箭头位
	btn.add_theme_stylebox_override("normal", sb)
	btn.add_theme_stylebox_override("disabled", sb)
	var sb_h := sb.duplicate()
	sb_h.bg_color = Color(0.54, 0.42, 0.26, 0.25)
	sb_h.border_color = Color(0.96, 0.81, 0.43, 0.55)
	btn.add_theme_stylebox_override("hover", sb_h)
	var sb_p := sb.duplicate()
	sb_p.bg_color = Color(0.42, 0.32, 0.18, 0.4)
	btn.add_theme_stylebox_override("pressed", sb_p)


func _on_nav_pressed(key: String) -> void:
	if _dialogue.is_active():
		return
	SceneManager.play_click()
	_apply_scene(key)
	Game.save_game()


func _on_action(action: String) -> void:
	if _dialogue.is_active():
		return
	match action:
		"修炼", "打坐":
			_show_toast(Game.cultivate())
		"炼丹":
			_show_toast(Game.alchemy())
		"炼器":
			_show_toast(Game.forge())
		"采集":
			_show_toast(Game.garden_harvest())
		"交谈":
			_open_npc_modal()
		"请教":
			await _dialogue.show_node("小娴", "万化道躯的要义在于「不挑」。木系功法养灵韵，火系功法炼锋芒——搭配着来，路子才宽。")
		"门规":
			await _dialogue.show_node("鹿真人", "鹿石宗门规：一不得欺凌同门，二不得私斗伤人，三不得泄露宗门秘传。犯者，逐出山门。")
		"外出":
			_open_travel()


## 左栏传送阵事件按钮（web：label=传送/复盘 · 标题，desc=第X年 · 地点）
func _on_event_pressed(event_id: String) -> void:
	if _dialogue.is_active():
		return
	if Game.is_event_completed(event_id):
		# 复盘：弹日志式回顾
		var def: Dictionary = Game.get_event(event_id)
		await _dialogue.show_node("系统", "%s · 已完成。翻开手记，回顾此行始末。" % def.get("title", ""), "复盘")
		return
	Game.start_event(event_id)
	SceneManager.switch_scene("event")


func _open_travel() -> void:
	var events := Game.get_events()
	var choices: Array = []
	var has_option := false
	for event_id in ["intro_lushi", "mouse_cave_treasure", "wish_eater_bridge"]:
		var def: Dictionary = events.get(event_id, {})
		if def.is_empty():
			continue
		var done := Game.is_event_completed(event_id)
		var unlocked := Game.is_event_unlocked(event_id)
		var label := "%s（%s）" % [def.get("title", ""), "已完成" if done else ("第 %d 年解锁" % int(def.get("trigger_year", 0)) if not unlocked else "可前往")]
		var go := unlocked and not done
		if go:
			has_option = true
		choices.append({
			"label": label,
			"go": go,
			"event_id": event_id,
		})
	choices.append({"label": "返回", "go": false, "event_id": ""})
	# 用对话框展示选项
	var pick: int = await _dialogue.show_node("系统", "传送阵灵光流转。选择目的地：", "传送阵", choices)
	if pick < 0 or pick >= choices.size():
		return
	var chosen: Dictionary = choices[pick]
	if not bool(chosen.get("go", false)):
		return
	Game.start_event(str(chosen.get("event_id", "")))
	SceneManager.switch_scene("event")


func _show_toast(text: String) -> void:
	_toast.text = text
	if _toast_tween and _toast_tween.is_valid():
		_toast_tween.kill()
	var tw := create_tween()
	_toast_tween = tw
	tw.tween_property(_toast, "modulate:a", 1.0, 0.2)
	tw.tween_interval(2.2)
	tw.tween_property(_toast, "modulate:a", 0.0, 0.5)
	_refresh_hud()


func _toggle_log() -> void:
	_log_open = not _log_open
	_log_panel.visible = _log_open
	if _log_open:
		_log_text.clear()
		for entry in Game.event_log:
			var e: Dictionary = entry
			_log_text.append_text("[color=#c9a86a]第 %d 年 %d 月 · %s[/color]\n%s\n\n" % [
				int(e.get("year", 1)), int(e.get("month", 1)),
				str(e.get("title", "")), str(e.get("text", "")),
			])
