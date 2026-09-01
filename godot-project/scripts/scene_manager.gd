extends Node
## 场景管理器（autoload "SceneManager"）：场景切换（淡入淡出转场）
## 与会议纪要 UI 规范对应：所有场景切换带淡入淡出过渡

const SCENES := {
	"start_menu": "res://scenes/start_menu.tscn",
	"creation": "res://scenes/character_creation.tscn",
	"entry_cg": "res://scenes/entry_cg.tscn",
	"event": "res://scenes/event_scene.tscn",
	"battle": "res://scenes/battle.tscn",
	"world": "res://scenes/world.tscn",
}

const FADE_TIME := 0.35

## 音频（对齐 web：lushi-origin.mp3 循环 BGM 音量 0.24 + scene-click.wav 点击音效 0.35）
const MUSIC_PATH := "res://assets/audio/lushi-origin.mp3"
const CLICK_PATH := "res://assets/audio/scene-click.wav"
const MUSIC_VOLUME := 0.24
const CLICK_VOLUME := 0.35

var _fade: ColorRect
var _busy := false
var _music: AudioStreamPlayer
var _click: AudioStreamPlayer
var _music_enabled := true


func _ready() -> void:
	var layer := CanvasLayer.new()
	# mobile 渲染器下过高的 layer 编号不会被合成渲染（同 dialogue_box 的教训），
	# 转场黑幕需在场景 UI（对话层 layer=1）之上，用 layer=10 即可
	layer.layer = 10
	add_child(layer)
	_fade = ColorRect.new()
	_fade.color = Color(0.04, 0.03, 0.02, 1.0)
	_fade.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_fade.modulate.a = 0.0
	_fade.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layer.add_child(_fade)
	_setup_audio()


func _exit_tree() -> void:
	# 退出前停止音频，避免播放中的播放器在引擎关闭时泄漏
	if _music:
		_music.stop()
	if _click:
		_click.stop()


func _setup_audio() -> void:
	_music = AudioStreamPlayer.new()
	var stream: AudioStreamMP3 = load(MUSIC_PATH)
	if stream:
		stream.loop = true
		_music.stream = stream
		_music.volume_db = linear_to_db(MUSIC_VOLUME)
		add_child(_music)
	_click = AudioStreamPlayer.new()
	_click.stream = load(CLICK_PATH)
	_click.volume_db = linear_to_db(CLICK_VOLUME)
	add_child(_click)


func _input(_event: InputEvent) -> void:
	# 对齐 web：BGM 在首次用户交互后才开始播放（浏览器自动播放限制的同款处理）
	# stream_paused 期间（如 CG 独占音频）不因输入重启
	if _music_enabled and _music and not _music.playing and not _music.stream_paused:
		_music.play()


func set_music_enabled(on: bool) -> void:
	_music_enabled = on
	if _music == null:
		return
	if on:
		_music.play()
	else:
		_music.stop()


## 临时暂停环境 BGM（保留播放位置），供 CG 等独占音频的界面使用
func pause_music() -> void:
	if _music:
		_music.stream_paused = true


## 恢复被 pause_music 暂停的环境 BGM
func resume_music() -> void:
	if _music and _music_enabled:
		_music.stream_paused = false


func is_music_enabled() -> bool:
	return _music_enabled


func play_click() -> void:
	if _click:
		_click.play()


func switch_scene(key: String, use_fade := true) -> void:
	if not SCENES.has(key):
		return
	# 若上一次切换尚未完成（如战斗结算切回事件后事件立刻完成又切回主城），
	# 排队等待而不是静默拒绝——否则事件完成后会永远卡在空白场景
	while _busy:
		await get_tree().process_frame
	_busy = true
	play_click()
	if use_fade:
		var tw := create_tween()
		tw.tween_property(_fade, "modulate:a", 1.0, FADE_TIME)
		await tw.finished
	get_tree().change_scene_to_file(SCENES[key])
	await get_tree().process_frame
	await get_tree().process_frame
	if use_fade:
		var tw2 := create_tween()
		tw2.tween_property(_fade, "modulate:a", 0.0, FADE_TIME)
		await tw2.finished
	_busy = false


func is_busy() -> bool:
	return _busy
