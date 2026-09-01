extends Control
## 开始菜单 —— 1:1 对齐 web StartMenu：
## · start-bg 全屏背景（无遮罩）
## · logo（top 8%，宽 395 居中）
## · start-menu-actions（top 52%，296 宽 4 按钮 64 高 gap 8，menu-button.png 底图 + 楷体 23px + small 副标）
## · start-settings（左下：音 心法调息）
## · start-version（右下：DEMO 0.3 · 29次因缘 · 云存档）

const VERSION_TEXT := "DEMO 0.3 · 29次因缘 · 云存档"
const LOGO_TOP := 86        # 8%
const ACTIONS_TOP := 562    # 52%
const ACTIONS_X := 812      # (1920-296)/2
const BUTTON_SIZE := Vector2(296, 64)
const BUTTON_GAP := 8

var _music_enabled := true
var _music_label: Label
var _notice_overlay: ColorRect
var _notice_card: Panel
var _notice_text: Label
var _notice_buttons: HBoxContainer
var _kai: FontFile


func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_kai = FontFile.new()
	_kai.load_dynamic_font("res://fonts/KaiTi.ttf")

	# 背景（start-bg cover，web 无暗色遮罩）
	var bg := TextureRect.new()
	bg.texture = load("res://assets/onboarding/start-bg.jpg")
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	bg.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	bg.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	add_child(bg)

	# Logo（top 8% 居中，宽 395）
	var logo := TextureRect.new()
	logo.texture = load("res://assets/onboarding/logo.png")
	logo.position = Vector2(762, LOGO_TOP)
	logo.size = Vector2(395, 240)
	logo.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	logo.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	add_child(logo)

	_build_actions()
	_build_settings()
	_build_version()
	_build_notice()


## ---------- 菜单按钮（start-menu-actions） ----------

func _build_actions() -> void:
	var has_save := FileAccess.file_exists(Game.SAVE_PATH)
	var completed := Game.completed_events.size() if Game.in_run else _count_completed_from_save()
	var entries := [
		{"main": "踏入仙途", "small": "", "handler": _on_new_game},
		{"main": "轮回玉简", "small": "继续当前存档" if has_save else "尚无存档", "handler": _on_continue},
		{"main": "因缘集录", "small": "%d/3" % completed, "handler": _on_archive},
		{"main": "归隐凡尘", "small": "", "handler": _on_quit},
	]
	var y := float(ACTIONS_TOP)
	for entry in entries:
		var btn := _make_menu_button(str(entry["main"]), str(entry["small"]))
		btn.position = Vector2(ACTIONS_X, y)
		btn.pressed.connect(entry["handler"])
		add_child(btn)
		y += BUTTON_SIZE.y + BUTTON_GAP


func _make_menu_button(main_text: String, small_text: String) -> Button:
	var btn := Button.new()
	btn.size = BUTTON_SIZE
	btn.focus_mode = Control.FOCUS_NONE

	# 底图：menu-button.png 拉伸铺满（web background 100% 100%）
	var tex := TextureRect.new()
	tex.texture = load("res://assets/onboarding/menu-button.png")
	tex.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	tex.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	tex.stretch_mode = TextureRect.STRETCH_SCALE
	tex.mouse_filter = Control.MOUSE_FILTER_IGNORE
	btn.add_child(tex)

	# 文案：楷体 23px #f8f1e1 + small 10px（rgba(248,241,225,0.66)）
	var box := VBoxContainer.new()
	box.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	box.alignment = BoxContainer.ALIGNMENT_CENTER
	box.mouse_filter = Control.MOUSE_FILTER_IGNORE
	btn.add_child(box)
	var main := Label.new()
	main.text = main_text
	main.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	main.add_theme_font_size_override("font_size", 23)
	main.add_theme_font_override("font", _kai)
	main.add_theme_color_override("font_color", Color(0.973, 0.945, 0.882))
	box.add_child(main)
	if not small_text.is_empty():
		var small := Label.new()
		small.text = small_text
		small.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		small.add_theme_font_size_override("font_size", 10)
		small.add_theme_color_override("font_color", Color(0.973, 0.945, 0.882, 0.66))
		box.add_child(small)

	# hover：brightness 1.18（web :hover）
	var normal := StyleBoxEmpty.new()
	btn.add_theme_stylebox_override("normal", normal)
	btn.add_theme_stylebox_override("hover", normal)
	btn.add_theme_stylebox_override("pressed", normal)
	btn.add_theme_stylebox_override("focus", normal)
	btn.mouse_entered.connect(func(): tex.modulate = Color(1.18, 1.14, 1.06))
	btn.mouse_exited.connect(func(): tex.modulate = Color.WHITE)
	return btn


## ---------- 左下设置（start-settings：音 心法调息） ----------

func _build_settings() -> void:
	var btn := Button.new()
	btn.position = Vector2(18, 1022)
	btn.size = Vector2(196, 40)
	btn.focus_mode = Control.FOCUS_NONE
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.98, 0.965, 0.925, 0.82)
	sb.border_color = Color(0.18, 0.153, 0.122, 0.48)
	sb.set_border_width_all(1)
	sb.set_corner_radius_all(4)
	sb.content_margin_left = 14
	sb.content_margin_right = 14
	btn.add_theme_stylebox_override("normal", sb)
	var sb_h := sb.duplicate()
	sb_h.bg_color = Color(1, 0.99, 0.96, 0.95)
	btn.add_theme_stylebox_override("hover", sb_h)
	btn.add_theme_stylebox_override("pressed", sb)
	add_child(btn)

	var inner := HBoxContainer.new()
	inner.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	inner.add_theme_constant_override("separation", 8)
	inner.alignment = BoxContainer.ALIGNMENT_CENTER
	inner.mouse_filter = Control.MOUSE_FILTER_IGNORE
	btn.add_child(inner)

	# 「音」圆框（24px 圆 border currentColor）
	var icon := Label.new()
	icon.text = "音"
	icon.custom_minimum_size = Vector2(24, 24)
	icon.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	icon.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	icon.add_theme_font_size_override("font_size", 12)
	icon.add_theme_color_override("font_color", Color(0.157, 0.137, 0.118))
	icon.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
	inner.add_child(icon)

	_music_label = Label.new()
	_music_label.add_theme_font_size_override("font_size", 13)
	_music_label.add_theme_color_override("font_color", Color(0.157, 0.137, 0.118))
	_music_label.text = "心法调息 · 乐声已开"
	_music_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_music_label.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	_music_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	inner.add_child(_music_label)

	btn.pressed.connect(_on_toggle_music)


func _on_toggle_music() -> void:
	_music_enabled = not SceneManager.is_music_enabled()
	SceneManager.set_music_enabled(_music_enabled)
	_music_label.text = "心法调息 · %s" % ("乐声已开" if _music_enabled else "乐声已静")


## ---------- 右下版本号（start-version） ----------

func _build_version() -> void:
	var v := Label.new()
	v.text = VERSION_TEXT
	v.position = Vector2(1480, 1046)
	v.size = Vector2(422, 14)
	v.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	v.add_theme_font_size_override("font_size", 11)
	v.add_theme_color_override("font_color", Color(0.137, 0.118, 0.098, 0.58))
	add_child(v)


## ---------- 提示弹窗（start-notice：全屏半透遮罩 + 居中卡片） ----------

func _build_notice() -> void:
	_notice_overlay = ColorRect.new()
	_notice_overlay.color = Color(0.122, 0.106, 0.09, 0.46)
	_notice_overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_notice_overlay.visible = false
	add_child(_notice_overlay)

	_notice_card = Panel.new()
	_notice_card.size = Vector2(460, 200)
	_notice_card.position = Vector2(730, 440)
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.976, 0.957, 0.906)
	sb.border_color = Color(0.18, 0.153, 0.122, 0.3)
	sb.set_border_width_all(1)
	sb.set_corner_radius_all(8)
	sb.set_content_margin_all(22)
	_notice_card.add_theme_stylebox_override("panel", sb)
	_notice_overlay.add_child(_notice_card)

	_notice_text = Label.new()
	_notice_text.position = Vector2(22, 22)
	_notice_text.size = Vector2(416, 90)
	_notice_text.add_theme_font_size_override("font_size", 16)
	_notice_text.add_theme_color_override("font_color", Color(0.18, 0.153, 0.122))
	_notice_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_notice_text.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_notice_text.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	_notice_card.add_child(_notice_text)

	_notice_buttons = HBoxContainer.new()
	_notice_buttons.position = Vector2(22, 130)
	_notice_buttons.size = Vector2(416, 44)
	_notice_buttons.add_theme_constant_override("separation", 12)
	_notice_buttons.alignment = BoxContainer.ALIGNMENT_CENTER
	_notice_card.add_child(_notice_buttons)


func _show_notice(text: String, buttons: Array) -> void:
	# buttons: [{"label": "知道了", "action": Callable}]
	for c in _notice_buttons.get_children():
		c.queue_free()
	_notice_text.text = text
	for b in buttons:
		var btn := _make_plain_button(str(b["label"]))
		btn.pressed.connect(func():
			_notice_overlay.visible = false
			var action: Callable = b["action"]
			if action.is_valid():
				action.call()
		)
		_notice_buttons.add_child(btn)
	_notice_overlay.visible = true


func _make_plain_button(text: String) -> Button:
	var btn := Button.new()
	btn.text = text
	btn.custom_minimum_size = Vector2(150, 44)
	btn.focus_mode = Control.FOCUS_NONE
	btn.add_theme_font_size_override("font_size", 16)
	btn.add_theme_color_override("font_color", Color(0.153, 0.122, 0.098))
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.22, 0.412, 0.353)
	sb.set_corner_radius_all(6)
	btn.add_theme_stylebox_override("normal", sb)
	var sb_h := sb.duplicate()
	sb_h.bg_color = Color(0.27, 0.5, 0.42)
	btn.add_theme_stylebox_override("hover", sb_h)
	return btn


## ---------- 菜单行为 ----------

func _on_new_game() -> void:
	# 进入六步角色创建（对齐 web：StartMenu → CharacterCreation）
	SceneManager.switch_scene("creation")


func _on_continue() -> void:
	if FileAccess.file_exists(Game.SAVE_PATH) and Game.load_game():
		if not Game.active_event.is_empty():
			SceneManager.switch_scene("event")
		else:
			SceneManager.switch_scene("world")
	else:
		SceneManager.switch_scene("creation")


func _on_archive() -> void:
	var completed: Array = Game.completed_events
	var events := Game.get_events()
	var lines: Array = []
	for eid in ["intro_lushi", "mouse_cave_treasure", "wish_eater_bridge"]:
		var def: Dictionary = events.get(eid, {})
		var mark := "已了结" if completed.has(eid) else "未了结"
		lines.append("%s · %s" % [str(def.get("title", eid)), mark])
	_show_notice("因缘集录 · %d/3\n\n%s" % [completed.size(), "\n".join(lines)], [
		{"label": "知道了", "action": Callable()},
	])


func _on_quit() -> void:
	_show_notice("归隐凡尘，就此别过？", [
		{"label": "确认归隐", "action": func(): get_tree().quit()},
		{"label": "再留片刻", "action": Callable()},
	])


## 未开局时从存档文件统计已完成事件数（用于因缘集录 small 副标）
func _count_completed_from_save() -> int:
	if not FileAccess.file_exists(Game.SAVE_PATH):
		return 0
	var f := FileAccess.open(Game.SAVE_PATH, FileAccess.READ)
	if f == null:
		return 0
	var parsed = JSON.parse_string(f.get_as_text())
	if parsed is Dictionary:
		return Array(parsed.get("completed_events", [])).size()
	return 0
