extends Control
## 事件运行器：按 data/events.json 数据驱动播放剧情事件
## 对应 web demo 的事件系统：visualStage 背景切换、分支选项、战斗节点、奖励结算

const STAGE_TITLES := {
	"intro_dormitory": "宿舍醒来",
	"intro_plaza": "广场认路",
	"intro_hall": "大殿初见",
	"intro_reward": "入门功法",
	"teleport_departure": "鹿石宗传送阵",
	"mouse_cave": "后山山鼠洞",
	"mouse_skirmish": "山鼠洞战斗",
	"mouse_boss_crisis": "山鼠王压境",
	"qingmu_rescue": "青木门救场",
	"mouse_boss_final": "山鼠王再战",
	"mouse_reward": "山鼠洞战利品",
	"bridge_village": "断桥村",
	"bridge_skirmish": "断桥村战斗",
	"bridge_confrontation": "断桥争执",
	"wish_eater_reveal": "啖愿妖现形",
	"wish_eater_boss": "啖愿妖战斗",
	"bridge_reward": "金灵宗初识",
}

const STAGE_BACKGROUNDS := {
	"intro_dormitory": "res://assets/tapflow/scenes/dormitory.webp",
	"intro_plaza": "res://assets/tapflow/scenes/plaza.webp",
	"intro_hall": "res://assets/tapflow/scenes/hall.webp",
	"intro_reward": "res://assets/tapflow/scenes/hall.webp",
	"teleport_departure": "res://assets/tapflow/scenes/teleport-array.webp",
	"mouse_cave": "res://assets/tapflow/events/mouse-cave-mouth.webp",
	"mouse_skirmish": "res://assets/tapflow/events/mouse-cave-battle.webp",
	"mouse_boss_crisis": "res://assets/tapflow/events/mouse-king-appears.webp",
	"qingmu_rescue": "res://assets/tapflow/events/mouse-cave-depths.webp",
	"mouse_boss_final": "res://assets/tapflow/events/mouse-cave-depths.webp",
	"mouse_reward": "res://assets/tapflow/events/mouse-king-defeated.webp",
	"bridge_village": "res://assets/tapflow/events/bridge-village-gate.webp",
	"bridge_skirmish": "res://assets/tapflow/events/bridge-battle.webp",
	"bridge_confrontation": "res://assets/tapflow/events/bridge-broken-side.webp",
	"wish_eater_reveal": "res://assets/tapflow/events/wish-eater-reveal.webp",
	"wish_eater_boss": "res://assets/tapflow/events/wish-eater-reveal.webp",
	"bridge_reward": "res://assets/tapflow/events/battle-end.webp",
}

## 战斗节点按钮文案（与 web getEventButtonLabel 一致）
const BATTLE_BUTTON_LABELS := {
	"small-rats": "清掉山鼠仔",
	"rat-king": "撑到救场",
	"final-rat-king": "合力击败山鼠王",
	"minions": "击退邪祟爪牙",
	"boss": "合力伏妖",
}

var _background: TextureRect
var _dialogue: CanvasLayer
var _event: Dictionary = {}
var _nodes: Array = []


func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)

	_background = TextureRect.new()
	_background.texture = load(STAGE_BACKGROUNDS["intro_dormitory"])
	_background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_background.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	_background.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	add_child(_background)

	_dialogue = preload("res://scripts/dialogue_box.gd").new()
	add_child(_dialogue)

	_run_event()


func _run_event() -> void:
	if Game.active_event.is_empty():
		SceneManager.switch_scene("world")
		return
	var event_id := str(Game.active_event.get("id", ""))
	_event = Game.get_event(event_id)
	if _event.is_empty():
		Game.active_event = {}
		SceneManager.switch_scene("world")
		return
	_nodes = _event.get("nodes", [])
	var index := int(Game.active_event.get("node_index", 0))
	while index >= 0 and index < _nodes.size() and not Game.active_event.is_empty():
		Game.active_event["node_index"] = index
		var next: int = await _run_node(index)
		if next < 0:
			# battle 节点已切入战斗场景：事件流程由 battle 场景接管
			# （胜利后 battle_won() 推进 node_index 并切回本场景；此时绝不能再动 node_index / finish_event）
			return
		index = next
	# 事件完成
	Game.finish_event(event_id)
	SceneManager.switch_scene("world")


## 执行单个节点，返回下一个节点索引；返回 -1 表示中止（进入战斗）
func _run_node(index: int) -> int:
	var node: Dictionary = _nodes[index]
	var stage := str(node.get("visual_stage", ""))
	_apply_stage(stage)

	var mode := str(node.get("mode", "dialogue"))
	var speaker := str(node.get("speaker", ""))
	var text := str(node.get("text", ""))
	var title: String = STAGE_TITLES.get(stage, str(node.get("title", "")))
	var brief := {
		"category": str(_event.get("category", "")),
		"event_title": str(_event.get("title", "")),
		"stage_title": title,
	}
	var progress := int(round((float(index + 1) / float(_nodes.size())) * 100.0))

	match mode:
		"choice":
			return await _run_choice_node(node, index, speaker, text, title, brief, progress)
		"battle":
			return await _run_battle_node(node, index, speaker, text, title, brief, progress)
		"reward":
			return await _run_reward_node(node, index, speaker, text, title)
		_:
			return await _run_dialogue_node(node, index, speaker, text, title, brief, progress)


func _run_dialogue_node(node: Dictionary, index: int, speaker: String, text: String, title: String, brief: Dictionary, progress: int) -> int:
	# primary 按钮文案：节点 continue_label（如"前往广场"）或默认"继续剧情"（web getEventButtonLabel）
	var primary := str(node.get("continue_label", "继续剧情"))
	var result: int = await _dialogue.show_node(speaker, text, title, [], "dialogue", progress, brief, primary)
	if result != -1:
		return index
	return _next_index(node, index)


func _run_choice_node(node: Dictionary, index: int, speaker: String, text: String, title: String, brief: Dictionary, progress: int) -> int:
	var choices: Array = node.get("choices", [])
	var pick: int = await _dialogue.show_node(speaker, text, title, choices, "choice", progress, brief)
	if pick < 0 or pick >= choices.size():
		return index
	var choice: Dictionary = choices[pick]
	# 记录日志（与 web 的事件日志一致）
	Game.add_log(str(choice.get("log_title", "")), str(choice.get("log_text", "")))
	Game.save_game()
	var next_id := str(choice.get("next_node_id", ""))
	if not next_id.is_empty():
		return _find_node_index(next_id)
	return index + 1


func _run_battle_node(node: Dictionary, index: int, speaker: String, text: String, title: String, brief: Dictionary, progress: int) -> int:
	var label: String = BATTLE_BUTTON_LABELS.get(str(node.get("id", "")), "打赢当前战斗")
	var result: int = await _dialogue.show_node(speaker, text, title, [], "battle", progress, brief, label)
	if result != -1:
		return index
	# 进入战斗场景；战斗结束后由 battle 场景推进 node_index 并切回本场景
	Game.active_event["node_index"] = index
	Game.save_game()
	BattleData.pending_battle_id = str(node.get("battle_id", ""))
	SceneManager.switch_scene("battle")
	return -1


func _run_reward_node(node: Dictionary, index: int, speaker: String, text: String, title: String) -> int:
	# 奖励弹窗：物品从文本「」抽取（与 web 正则一致），兜底用 reward_text
	var items: Array = []
	var re := RegEx.new()
	re.compile("「([^」]+)」")
	for m in re.search_all(text):
		items.append(m.get_string(1))
	if items.is_empty():
		items = [str(_event.get("reward_text", "奖励"))]
	var continue_label := str(node.get("continue_label", "领取结算"))
	var ok: bool = await _dialogue.show_reward(text, items, continue_label)
	if not ok:
		return index
	return _next_index(node, index)


func _next_index(node: Dictionary, index: int) -> int:
	var next_id := str(node.get("next_node_id", ""))
	if not next_id.is_empty():
		return _find_node_index(next_id)
	return index + 1


func _find_node_index(node_id: String) -> int:
	for i in _nodes.size():
		if str(_nodes[i].get("id", "")) == node_id:
			return i
	return _nodes.size()


func _apply_stage(stage: String) -> void:
	var path: String = STAGE_BACKGROUNDS.get(stage, "")
	if not path.is_empty() and ResourceLoader.exists(path):
		var tex := load(path)
		if tex:
			# 交叉淡入：切换背景时短暂过渡
			var tw := create_tween()
			tw.tween_property(_background, "modulate:a", 0.0, 0.18)
			await tw.finished
			_background.texture = tex
			var tw2 := create_tween()
			tw2.tween_property(_background, "modulate:a", 1.0, 0.28)
			await tw2.finished
