extends Control
## 开场 CG：播放 enter-lushi.ogv（Godot 原生支持 Theora，与 web demo 同一 CG 转码）
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
	_player.expand = true
	add_child(_player)
	_fit_player()
	get_viewport().size_changed.connect(_fit_player)

	if ResourceLoader.exists(CG_PATH):
		var stream := VideoStreamTheora.new()
		stream.file = CG_PATH
		_player.stream = stream
		_player.finished.connect(_on_finished)
		_player.play()

	_skip_btn = Button.new()
	_skip_btn.text = "跳过 »"
	_skip_btn.position = Vector2(1720, 30)
	_skip_btn.size = Vector2(160, 56)
	_skip_btn.add_theme_font_size_override("font_size", 24)
	_skip_btn.pressed.connect(_on_finished)
	add_child(_skip_btn)


func _fit_player() -> void:
	if _player == null:
		return
	var vs := get_viewport().get_visible_rect().size
	_player.position = Vector2.ZERO
	_player.size = vs
	# 跳过按钮贴右上角
	if _skip_btn:
		_skip_btn.position = Vector2(vs.x - _skip_btn.size.x - 30, 30)


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
	Game.start_event("intro_lushi")
	SceneManager.switch_scene("event")
