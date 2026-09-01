extends CanvasLayer
## 剧情对话面板 —— 1:1 对齐 web demo 的 VN 竖版对话框（.vn-dialogue-panel）
## · 左上 event-brief 事件信息卡（分类/事件标题/阶段名）
## · 底部右侧竖版大面板：dialogue-box.webp 底图 + nameplate.webp 立牌 + 楷体大字 + 右下「……继续剧情」
## · 抉择模式：屏幕正中央垂直选项列（.vn-dialogue-panel.mode-choice）
## · 奖励结算：屏幕正中央弹窗（楷体标题+3列物品卡）

signal advanced

## 立绘映射（供 NPC 交互模态使用；web 剧情面板为纯文字 VN，不显示立绘）
const PORTRAITS := {
	"主角": "res://assets/tapflow/portraits/player-normal.webp",
	"小张": "res://assets/tapflow/portraits/xiaozhang-normal.webp",
	"张真人": "res://assets/tapflow/portraits/xiaozhang-normal.webp",
	"小娴": "res://assets/tapflow/portraits/xiaoxian-normal.webp",
	"鹿真人": "res://assets/tapflow/portraits/lu-normal.webp",
	"羊七道人": "res://assets/tapflow/portraits/yangqi.webp",
	"豆髯道人": "res://assets/tapflow/portraits/douran.webp",
	"雏雏": "res://assets/tapflow/portraits/chuchu.webp",
	"小鹿": "res://assets/tapflow/portraits/xiaolu.webp",
}

## VN 面板几何（1920×1080 基准，对齐 css .vn-dialogue-panel：
## left clamp(220,18vw,320)→320；right clamp(20,3vw,54)→54；bottom clamp(20,3vh,36)→32；
## min-height clamp(340,38vh,420)→410）
const PANEL_POS := Vector2(320, 638)
const PANEL_SIZE := Vector2(1546, 410)
## nameplate：面板内 (42,34)，最小 184×44，名字楷体 31px（css padding 8px 26px 9px）
const NAMEPLATE_POS := Vector2(42, 34)
const NAMEPLATE_MIN := Vector2(184, 44)
## 正文：面板内 inset（left/top 96/106，right/bottom 96/54），楷体 30px
const TEXT_INSET := Rect2(96, 106, 96, 54)
## 「……继续剧情」：面板右下 (right 62, bottom 36)，楷体 28px
const HINT_OFFSET := Vector2(62, 36)
## 居中选项列：宽 560，间距 12，按钮高 58+，楷体 24px
const CHOICE_W := 560
const CHOICE_GAP := 12
const CHOICE_H := 58

var _kai: FontFile

var _root: Control
var _brief: Control
var _brief_category: Label
var _brief_title: Label
var _brief_stage: Label

var _panel: Control
var _nameplate: TextureRect
var _name_bg: ColorRect
var _speaker_name: Label
var _text_label: RichTextLabel
var _hint: Label

var _choices_root: Control
var _buttons_box: VBoxContainer

var _reward_root: Control

var _active := false
var _reward_active := false
var _typing := false
var _has_choices := false
var _reveal_tween: Tween
var _result := -1
var _reward_result := false
var _ignore_input_until := 0


func _ready() -> void:
	layer = 101
	_kai = FontFile.new()
	_kai.load_dynamic_font("res://fonts/KaiTi.ttf")
	_root = Control.new()
	_root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_root.visible = false
	add_child(_root)
	_build_brief()
	_build_panel()
	_build_choices()
	_build_reward()


## ---------- 左上事件信息卡（.event-brief：top 22, left 24） ----------

func _build_brief() -> void:
	_brief = Control.new()
	_brief.position = Vector2(24, 22)
	_brief.size = Vector2(240, 104)
	_brief.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_root.add_child(_brief)

	var bg := Panel.new()
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.03, 0.027, 0.024, 0.42)
	sb.border_color = Color(1, 0.937, 0.8, 0.14)
	sb.set_border_width_all(1)
	sb.set_corner_radius_all(8)
	sb.content_margin_left = 16
	sb.content_margin_right = 16
	sb.content_margin_top = 12
	sb.content_margin_bottom = 12
	bg.add_theme_stylebox_override("panel", sb)
	bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_brief.add_child(bg)

	_brief_category = Label.new()
	_brief_category.position = Vector2(16, 12)
	_brief_category.size = Vector2(208, 18)
	_brief_category.add_theme_font_size_override("font_size", 12)
	_brief_category.add_theme_color_override("font_color", Color(0.608, 0.839, 1.0))
	_brief_category.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.6))
	_brief.add_child(_brief_category)

	_brief_title = Label.new()
	_brief_title.position = Vector2(16, 34)
	_brief_title.size = Vector2(208, 32)
	_brief_title.add_theme_font_size_override("font_size", 22)
	_brief_title.add_theme_color_override("font_color", Color(1, 0.949, 0.773))
	_brief_title.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.7))
	_brief.add_child(_brief_title)

	_brief_stage = Label.new()
	_brief_stage.position = Vector2(16, 70)
	_brief_stage.size = Vector2(208, 20)
	_brief_stage.add_theme_font_size_override("font_size", 13)
	_brief_stage.add_theme_color_override("font_color", Color(1, 0.91, 0.72, 0.82))
	_brief.add_child(_brief_stage)


## ---------- VN 竖版对话面板（.vn-dialogue-panel） ----------

func _build_panel() -> void:
	_panel = Control.new()
	_panel.position = PANEL_POS
	_panel.size = PANEL_SIZE
	_panel.mouse_filter = Control.MOUSE_FILTER_STOP
	_panel.gui_input.connect(_on_panel_input)
	_root.add_child(_panel)

	# 框体背景：dialogue-box.webp 拉伸 100%×100%（css: center / 100% 100%，无内边距无边框）
	var bg_tex := TextureRect.new()
	bg_tex.texture = load("res://assets/tapflow/ui/dialogue-box.webp")
	bg_tex.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	bg_tex.stretch_mode = TextureRect.STRETCH_SCALE
	bg_tex.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_panel.add_child(bg_tex)

	# 说话人立牌：nameplate.webp + 黑色压底渐变（css: linear-gradient(90deg, rgba(0,0,0,.92), rgba(5,5,5,.72))）
	_name_bg = ColorRect.new()
	_name_bg.position = NAMEPLATE_POS
	_name_bg.size = NAMEPLATE_MIN
	_name_bg.color = Color(0.0, 0.0, 0.0, 0.82)
	_name_bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_panel.add_child(_name_bg)

	_nameplate = TextureRect.new()
	_nameplate.texture = load("res://assets/tapflow/ui/nameplate.webp")
	_nameplate.position = NAMEPLATE_POS
	_nameplate.size = NAMEPLATE_MIN
	_nameplate.stretch_mode = TextureRect.STRETCH_SCALE
	_nameplate.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_panel.add_child(_nameplate)

	_speaker_name = Label.new()
	_speaker_name.position = NAMEPLATE_POS + Vector2(26, 8)
	_speaker_name.size = NAMEPLATE_MIN - Vector2(52, 17)
	_speaker_name.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_speaker_name.add_theme_font_size_override("font_size", 31)
	_speaker_name.add_theme_font_override("font", _kai)
	_speaker_name.add_theme_color_override("font_color", Color(1, 0.965, 0.878))
	_speaker_name.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_panel.add_child(_speaker_name)

	# 剧情正文：楷体 30px，行高 1.34（css: clamp(20px,1.9vw,30px) STKaiti 900）
	_text_label = RichTextLabel.new()
	_text_label.position = Vector2(TEXT_INSET.position.x, TEXT_INSET.position.y)
	_text_label.size = Vector2(
		PANEL_SIZE.x - TEXT_INSET.position.x - TEXT_INSET.size.x,
		PANEL_SIZE.y - TEXT_INSET.position.y - TEXT_INSET.size.y)
	_text_label.add_theme_font_size_override("normal_font_size", 30)
	_text_label.add_theme_font_override("normal_font", _kai)
	_text_label.add_theme_constant_override("line_separation", 10)
	_text_label.add_theme_color_override("default_color", Color(1, 0.992, 0.957))
	_text_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_text_label.scroll_active = false
	_text_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_panel.add_child(_text_label)

	# 「……继续剧情」提示（.vn-continue-hint：右下角楷体 28px）
	_hint = Label.new()
	_hint.text = "……继续剧情"
	_hint.add_theme_font_size_override("font_size", 28)
	_hint.add_theme_font_override("font", _kai)
	_hint.add_theme_color_override("font_color", Color(1, 0.973, 0.906))
	_hint.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.9))
	_hint.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_panel.add_child(_hint)
	_layout_hint()


func _layout_hint() -> void:
	_hint.reset_size()
	var w := _hint.get_minimum_size().x
	_hint.position = PANEL_SIZE - HINT_OFFSET - Vector2(w, 0)
	_hint.size = Vector2(w + 8, 40)


## ---------- 居中选项列（.vn-dialogue-panel.mode-choice .event-story-choices） ----------

func _build_choices() -> void:
	_choices_root = Control.new()
	_choices_root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_choices_root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_choices_root.visible = false
	_root.add_child(_choices_root)

	_buttons_box = VBoxContainer.new()
	_buttons_box.add_theme_constant_override("separation", CHOICE_GAP)
	_buttons_box.mouse_filter = Control.MOUSE_FILTER_STOP
	_choices_root.add_child(_buttons_box)


func _layout_choices() -> void:
	var count := _buttons_box.get_child_count()
	if count == 0:
		_choices_root.visible = false
		return
	var total := count * CHOICE_H + (count - 1) * CHOICE_GAP
	_buttons_box.position = Vector2(960 - CHOICE_W / 2.0, 540 - total / 2.0)
	_buttons_box.size = Vector2(CHOICE_W, total)


## ---------- 奖励中央弹窗（.event-reward-panel） ----------

func _build_reward() -> void:
	_reward_root = Control.new()
	_reward_root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_reward_root.mouse_filter = Control.MOUSE_FILTER_STOP
	_reward_root.visible = false
	_root.add_child(_reward_root)

	# 中央窗口 560×430
	var win := Panel.new()
	win.position = Vector2(680, 325)
	win.size = Vector2(560, 430)
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.10, 0.086, 0.067, 0.97)
	sb.border_color = Color(1, 0.91, 0.67, 0.58)
	sb.set_border_width_all(1)
	sb.set_corner_radius_all(8)
	sb.set_content_margin_all(28)
	win.add_theme_stylebox_override("panel", sb)
	_reward_root.add_child(win)

	# 顶部金蓝渐变线（::before）
	var line_tex := GradientTexture2D.new()
	var line_grad := Gradient.new()
	line_grad.colors = PackedColorArray([
		Color(1, 1, 1, 0.0), Color("#f4d784"), Color("#9bd6ff"), Color(1, 1, 1, 0.0)])
	line_tex.gradient = line_grad
	line_tex.fill_from = Vector2(0, 0)
	line_tex.fill_to = Vector2(1, 0)
	var top_line := TextureRect.new()
	top_line.texture = line_tex
	top_line.position = Vector2(101, 0)  # 18% 内缩
	top_line.size = Vector2(359, 2)
	top_line.stretch_mode = TextureRect.STRETCH_SCALE
	win.add_child(top_line)

	var tag := Label.new()
	tag.text = "系统提示"
	tag.position = Vector2(0, 26)
	tag.size = Vector2(560, 18)
	tag.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	tag.add_theme_font_size_override("font_size", 13)
	tag.add_theme_color_override("font_color", Color(0.608, 0.839, 1.0))
	win.add_child(tag)

	var heading := Label.new()
	heading.text = "获得功法"
	heading.position = Vector2(0, 48)
	heading.size = Vector2(560, 52)
	heading.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	heading.add_theme_font_size_override("font_size", 38)
	heading.add_theme_font_override("font", _kai)
	heading.add_theme_color_override("font_color", Color(1, 0.945, 0.741))
	win.add_child(heading)

	var text := Label.new()
	text.position = Vector2(32, 108)
	text.size = Vector2(496, 30)
	text.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	text.add_theme_font_size_override("font_size", 17)
	text.add_theme_color_override("font_color", Color(0.945, 0.894, 0.784))
	win.add_child(text)

	# 3 列物品卡（.event-reward-items：楷体、棕底金边）
	var items_box := HBoxContainer.new()
	items_box.position = Vector2(32, 148)
	items_box.size = Vector2(496, 60)
	items_box.add_theme_constant_override("separation", 9)
	win.add_child(items_box)
	for i in 3:
		var card := Panel.new()
		card.custom_minimum_size = Vector2(159, 52)
		var c_sb := StyleBoxFlat.new()
		c_sb.bg_color = Color(0.475, 0.318, 0.137, 0.36)
		c_sb.border_color = Color(0.961, 0.843, 0.494, 0.34)
		c_sb.set_border_width_all(1)
		c_sb.set_corner_radius_all(6)
		card.add_theme_stylebox_override("panel", c_sb)
		items_box.add_child(card)
		var l := Label.new()
		l.name = "ItemLabel"
		l.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		l.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		l.add_theme_font_size_override("font_size", 18)
		l.add_theme_font_override("font", _kai)
		l.add_theme_color_override("font_color", Color(1, 0.957, 0.808))
		card.add_child(l)
		card.visible = false
	items_box.name = "ItemsBox"

	var btn := Button.new()
	btn.name = "RewardButton"
	btn.text = "收下"
	btn.position = Vector2(196, 350)
	btn.size = Vector2(168, 48)
	btn.add_theme_font_size_override("font_size", 20)
	btn.add_theme_color_override("font_color", Color(1, 0.973, 0.906))
	btn.pressed.connect(_on_reward_button)
	win.add_child(btn)

	_reward_root.set_meta("win", win)
	_reward_root.set_meta("text", text)
	_reward_root.set_meta("items_box", items_box)
	_reward_root.set_meta("button", btn)


## ---------- 公开 API ----------

## 显示剧情节点。返回：-1=推进（点击面板/回车）；>=0=选中选项索引
## （web VN 模式隐藏模式徽标/进度条，整块面板可点击推进，右下角显示继续提示）
func show_node(speaker: String, text: String, title: String, choices: Array = [],
		mode := "dialogue", progress := 0, brief := {}, primary_label := "继续剧情") -> int:
	_result = -1
	_active = true
	_has_choices = not choices.is_empty()
	_ignore_input_until = Time.get_ticks_msec() + 150
	_root.visible = true
	_choices_root.visible = false
	_reward_root.visible = false

	# 事件信息卡
	var cat: String = str(brief.get("category", ""))
	var evt: String = str(brief.get("event_title", ""))
	_brief_category.text = cat
	_brief_title.text = evt
	_brief_stage.text = title
	_brief.visible = not evt.is_empty()

	# 说话人立牌（web：立牌宽度随名字自适应，最小 184）
	_speaker_name.text = speaker
	_fit_nameplate()

	# 文本（打字机）
	_text_label.text = text
	_text_label.visible_characters = 0
	_typing = true
	if _reveal_tween:
		_reveal_tween.kill()
	var duration := 0.02 * text.length() + 0.1
	_reveal_tween = create_tween()
	_reveal_tween.tween_property(_text_label, "visible_ratio", 1.0, duration)
	_reveal_tween.finished.connect(_on_typing_done)

	# 继续提示：文案 = 「……」+ 按钮文案（web: `......${continueText}`）；抉择模式下隐藏
	# （css .mode-choice .vn-continue-hint { display:none }）
	_hint.text = "……%s" % primary_label
	_layout_hint()
	_hint.visible = not _has_choices

	# 居中选项列
	_clear_buttons()
	if _has_choices:
		for i in choices.size():
			var c: Dictionary = choices[i]
			_add_choice_button(str(c.get("label", "")), _on_choice_pressed.bind(i))
		_layout_choices()
		_choices_root.visible = true

	while _active:
		await get_tree().process_frame
	return _result


## 立牌随名字宽度自适应（css min-width 184 + padding 26×2）
func _fit_nameplate() -> void:
	_speaker_name.reset_size()
	var text_w := _speaker_name.get_minimum_size().x
	var w := maxf(NAMEPLATE_MIN.x, text_w + 52)
	_name_bg.size = Vector2(w, NAMEPLATE_MIN.y)
	_nameplate.size = Vector2(w, NAMEPLATE_MIN.y)
	_speaker_name.size = Vector2(w - 52, NAMEPLATE_MIN.y - 17)


## 奖励结算弹窗（屏幕正中央）。点击按钮返回 true。
func show_reward(text: String, items: Array, button_label := "收下") -> bool:
	_reward_result = false
	_active = true
	_reward_active = true
	_root.visible = true
	_panel.visible = false
	_brief.visible = false
	_choices_root.visible = false

	var win: Panel = _reward_root.get_meta("win")
	var text_label: Label = _reward_root.get_meta("text")
	var items_box: HBoxContainer = _reward_root.get_meta("items_box")
	var btn: Button = _reward_root.get_meta("button")

	btn.text = button_label
	text_label.text = text
	# 物品卡（web：从文本抽取「…」，或退回 rewardText）
	for i in items_box.get_child_count():
		var card: Panel = items_box.get_child(i)
		var l: Label = card.get_node("ItemLabel")
		if i < items.size():
			l.text = str(items[i])
			card.visible = true
		else:
			card.visible = false

	while _reward_active:
		await get_tree().process_frame
	_active = false
	_root.visible = false
	_panel.visible = true
	return _reward_result


## ---------- 交互 ----------

func _unhandled_input(event: InputEvent) -> void:
	if not _active or _reward_active:
		return
	if event.is_action_pressed("ui_accept") or event.is_action_pressed("interact"):
		_advance()
		get_viewport().set_input_as_handled()


func _on_panel_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed:
		_advance()


func _advance() -> void:
	if not _active or Time.get_ticks_msec() < _ignore_input_until:
		return
	if _typing:
		_finish_typing()
		return
	if _has_choices:
		return  # 等待选项点击
	_active = false
	_root.visible = false
	_result = -1
	advanced.emit()


func _on_typing_done() -> void:
	_typing = false


func _finish_typing() -> void:
	if _reveal_tween:
		_reveal_tween.kill()
	_text_label.visible_ratio = 1.0
	_on_typing_done()


func _on_choice_pressed(index: int) -> void:
	if not _active:
		return
	if _typing:
		_finish_typing()  # 首次点击先补全文本，与面板推进行为一致
		return
	_active = false
	_root.visible = false
	_result = index
	advanced.emit()


func _on_reward_button() -> void:
	if _reward_active:
		_reward_result = true
		_reward_active = false


## ---------- 居中选项按钮（.vn-dialogue-panel.mode-choice button：高 58+、深棕渐变、金边、楷体 24px） ----------

func _add_choice_button(label: String, handler: Callable) -> void:
	var btn := Button.new()
	btn.text = label
	btn.custom_minimum_size = Vector2(CHOICE_W, CHOICE_H)
	btn.add_theme_font_size_override("font_size", 24)
	btn.add_theme_font_override("font", _kai)
	btn.add_theme_color_override("font_color", Color(1, 0.949, 0.741))
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.176, 0.129, 0.086, 0.95)
	sb.border_color = Color(1, 0.933, 0.745, 0.48)
	sb.set_border_width_all(1)
	sb.set_corner_radius_all(6)
	sb.set_content_margin_all(10)
	btn.add_theme_stylebox_override("normal", sb)
	var sb_h := sb.duplicate()
	sb_h.bg_color = Color(0.265, 0.192, 0.125, 0.96)
	sb_h.border_color = Color(0.608, 0.839, 1.0, 0.72)
	btn.add_theme_stylebox_override("hover", sb_h)
	btn.pressed.connect(handler)
	_buttons_box.add_child(btn)


func _clear_buttons() -> void:
	for child in _buttons_box.get_children():
		child.queue_free()


func is_active() -> bool:
	return _active
