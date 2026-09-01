extends Control
## 开场 CG：播放 enter-lushi.ogv（Godot 原生支持 Theora，与 web demo 同一 CG 转码）
## 对齐 web .entry-cg-screen：视频 contain 居中 + 左上标题卡 + 右下跳过按钮
## 播放结束或点击跳过后进入开局主线「初入鹿石宗」

const CG_PATH := "res://assets/onboarding/enter-lushi.ogv"

var _player: VideoStreamPlayer
var _skip_btn: Button
var _done := false
var _elapsed := 0.0


func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)

	# 黑底兜底（视频异常时至少有底色）
	var bg := ColorRect.new()
	bg.color = Color(0.04, 0.03, 0.02)
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	_player = VideoStreamPlayer.new()
	_player.expand = true  # 关键：不设则视频按原始分辨率绘制，只占屏幕一角，无法全屏
	add_child(_player)
	_fit_player()
	get_viewport().size_changed.connect(_fit_player)

	if ResourceLoader.exists(CG_PATH):
		var stream := VideoStreamTheora.new()
		stream.file = CG_PATH
		_player.stream = stream
		_player.finished.connect(_on_finished)
		_player.play()

	# CG 播放期间独占音频：暂停环境 BGM，只留 CG 视频自带音轨
	SceneManager.pause_music()

	_build_title_card()
	_build_skip_button()


## 视频 contain 居中（css object-fit: contain，按 16:9 等比缩放）
func _fit_player() -> void:
	if _player == null:
		return
	var vs := get_viewport().get_visible_rect().size
	var target := Vector2(vs.x, vs.x * 9.0 / 16.0)
	if target.y > vs.y:
		target = Vector2(vs.y * 16.0 / 9.0, vs.y)
	_player.position = (vs - target) / 2.0
	_player.size = target
	# 跳过按钮贴右下角（css right 24 bottom 24）
	if _skip_btn:
		_skip_btn.position = Vector2(vs.x - 24 - _skip_btn.size.x, vs.y - 24 - _skip_btn.size.y)


## 左上标题卡（.entry-cg-title：top 30 left 38，左 3px 金线，深底）
func _build_title_card() -> void:
	var card := Panel.new()
	card.position = Vector2(38, 30)
	card.size = Vector2(250, 112)
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.039, 0.031, 0.024, 0.72)
	sb.set_border_width_all(0)
	sb.set_border_width(Side.SIDE_LEFT, 3)
	sb.border_color = Color("#d0a354")
	sb.content_margin_left = 22
	sb.content_margin_right = 22
	sb.content_margin_top = 14
	sb.content_margin_bottom = 14
	card.add_theme_stylebox_override("panel", sb)
	card.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(card)

	var box := VBoxContainer.new()
	box.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	box.add_theme_constant_override("separation", 2)
	box.mouse_filter = Control.MOUSE_FILTER_IGNORE
	card.add_child(box)

	var tag := Label.new()
	tag.text = "序章"
	tag.add_theme_font_size_override("font_size", 11)
	tag.add_theme_color_override("font_color", Color("#c8ae7b"))
	box.add_child(tag)

	var title := Label.new()
	title.text = "初入鹿石宗"
	var kai := FontFile.new()
	kai.load_dynamic_font("res://fonts/KaiTi.ttf")
	title.add_theme_font_override("font", kai)
	title.add_theme_font_size_override("font_size", 26)
	title.add_theme_color_override("font_color", Color("#f5ead3"))
	box.add_child(title)

	var sub := Label.new()
	sub.text = "命数自此改写"
	sub.add_theme_font_size_override("font_size", 11)
	sub.add_theme_color_override("font_color", Color("#c8ae7b"))
	box.add_child(sub)


## 右下跳过按钮（css right 24 bottom 24，高 38，金边深底）
func _build_skip_button() -> void:
	_skip_btn = Button.new()
	_skip_btn.text = "跳过"
	_skip_btn.size = Vector2(96, 38)
	_skip_btn.focus_mode = Control.FOCUS_NONE
	_skip_btn.add_theme_font_size_override("font_size", 15)
	_skip_btn.add_theme_color_override("font_color", Color("#e6d4b3"))
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.059, 0.047, 0.035, 0.7)
	sb.border_color = Color(0.863, 0.753, 0.537, 0.55)
	sb.set_border_width_all(1)
	sb.set_corner_radius_all(4)
	_skip_btn.add_theme_stylebox_override("normal", sb)
	var sb_h := sb.duplicate()
	sb_h.bg_color = Color(0.118, 0.094, 0.067, 0.85)
	_skip_btn.add_theme_stylebox_override("hover", sb_h)
	_skip_btn.pressed.connect(_on_finished)
	add_child(_skip_btn)


func _process(delta: float) -> void:
	if _done:
		return
	_elapsed += delta
	# 视频加载失败（未在 3 秒内开始播放）则自动跳过
	if _elapsed > 3.0 and _player.stream != null and not _player.is_playing():
		_on_finished()


func _on_finished() -> void:
	if _done:
		return
	_done = true
	if _player and _player.is_playing():
		_player.stop()
	# 恢复环境 BGM
	SceneManager.resume_music()
	Game.start_event("intro_lushi")
	SceneManager.switch_scene("event")
