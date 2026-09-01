extends Node
## 自动化冒烟测试（headless）：验证完整游戏流程
## 运行：godot --headless res://tests/smoke_test.tscn

var _errors: Array = []
var _passes := 0
var _save_backup: PackedByteArray


func _ready() -> void:
	# 备份玩家存档，测试后恢复（测试不破坏玩家进度）
	if FileAccess.file_exists(Game.SAVE_PATH):
		var f := FileAccess.open(Game.SAVE_PATH, FileAccess.READ)
		_save_backup = f.get_buffer(f.get_length())
		f.close()
	_test_start()
	_test_game_state()
	_test_event_data()
	_test_asset_paths()
	_test_battle_config()
	_test_save_load()
	_report()
	# 恢复玩家存档
	if not _save_backup.is_empty():
		var f2 := FileAccess.open(Game.SAVE_PATH, FileAccess.WRITE)
		f2.store_buffer(_save_backup)
		f2.close()
	await get_tree().process_frame
	get_tree().quit(0 if _errors.is_empty() else 1)


func _check(cond: bool, name: String) -> void:
	if cond:
		_passes += 1
	else:
		_errors.append(name)


func _test_start() -> void:
	_check(Game != null, "Game autoload 存在")
	_check(SceneManager != null, "SceneManager autoload 存在")
	_check(BattleData != null, "BattleData autoload 存在")
	_check(ResourceLoader.exists("res://scenes/start_menu.tscn"), "主场景 start_menu.tscn 存在")
	_check(ResourceLoader.exists("res://scenes/character_creation.tscn"), "角色创建 character_creation.tscn 存在")
	for key in ["entry_cg", "event", "battle", "world", "creation"]:
		var path: String = SceneManager.SCENES[key]
		_check(ResourceLoader.exists(path), "场景 %s 可加载（%s）" % [key, path])


func _test_game_state() -> void:
	Game.new_game("测试道人")
	_check(Game.player_name == "测试道人", "new_game 设置道号")
	_check(Game.year == 1 and Game.month == 1, "初始时间 第1年1月")
	_check(int(Game.resources.get("spirit_stones", 0)) == 20, "初始灵石 20")
	_check(Game.in_run, "in_run 标记")
	_check(FileAccess.file_exists(Game.SAVE_PATH), "new_game 后存档文件已生成")

	Game.cultivate()
	_check(Game.year == 2, "修炼一年后 year=2")
	_check(Game.realm_progress == 20, "修炼进度 20")

	var herbs_before := int(Game.resources.get("herbs", 0))
	Game.garden_harvest()
	_check(int(Game.resources.get("herbs", 0)) == herbs_before + 1, "灵植园采集 +1 灵草")

	Game.player_name = "被覆盖的名字"
	var ok: bool = Game.load_game()
	_check(ok, "load_game 成功")
	_check(Game.player_name == "测试道人", "读档后恢复道号")
	_check(Game.year == 2, "读档后恢复时间")


func _test_event_data() -> void:
	var events := Game.get_events()
	_check(not events.is_empty(), "events.json 解析成功")
	_check(events.size() == 3, "共 3 个事件")

	for event_id in ["intro_lushi", "mouse_cave_treasure", "wish_eater_bridge"]:
		var def: Dictionary = events[event_id]
		_check(not def.is_empty(), "事件 %s 定义存在" % event_id)
		var nodes: Array = def.get("nodes", [])
		_check(nodes.size() > 5, "事件 %s 节点数 %d > 5" % [event_id, nodes.size()])

		var node_ids := {}
		for node in nodes:
			var n: Dictionary = node
			var nid: String = str(n.get("id", ""))
			_check(not nid.is_empty(), "事件 %s 节点均有 id" % event_id)
			_check(not node_ids.has(nid), "节点 id 唯一：%s/%s" % [event_id, nid])
			node_ids[nid] = true
			_check(not str(n.get("text", "")).is_empty(), "节点 %s/%s 有文本" % [event_id, nid])
			_check(not str(n.get("speaker", "")).is_empty(), "节点 %s/%s 有说话人" % [event_id, nid])
			for c in n.get("choices", []):
				var choice: Dictionary = c
				var next_id: String = str(choice.get("next_node_id", ""))
				if not next_id.is_empty():
					_check(_has_node(nodes, next_id), "选项跳转目标存在：%s → %s" % [nid, next_id])
			var nn: String = str(n.get("next_node_id", ""))
			if not nn.is_empty():
				_check(_has_node(nodes, nn), "节点 next 跳转目标存在：%s → %s" % [nid, nn])
			if str(n.get("mode", "")) == "battle":
				_check(not str(n.get("battle_id", "")).is_empty(), "战斗节点 %s 有 battle_id" % nid)

	Game.start_event("intro_lushi")
	_check(not Game.active_event.is_empty(), "start_event 生效")
	Game.finish_event("intro_lushi")
	_check(Game.is_event_completed("intro_lushi"), "finish_event 标记完成")
	_check("luhua_jue" in Game.learned_arts, "intro 奖励功法已学（luhua_jue）")

	Game.year = 1
	_check(not Game.is_event_unlocked("mouse_cave_treasure"), "第1年山鼠洞未解锁")
	Game.year = 10
	_check(Game.is_event_unlocked("mouse_cave_treasure"), "第10年山鼠洞解锁")
	_check(not Game.is_event_unlocked("wish_eater_bridge"), "第10年啖愿妖未解锁")
	Game.year = 12
	_check(Game.is_event_unlocked("wish_eater_bridge"), "第12年啖愿妖解锁")


func _has_node(nodes: Array, node_id: String) -> bool:
	for n in nodes:
		if str((n as Dictionary).get("id", "")) == node_id:
			return true
	return false


func _test_asset_paths() -> void:
	var db: GDScript = load("res://scripts/dialogue_box.gd")
	_check(db != null, "dialogue_box.gd 可加载")
	var d = db.new()
	for speaker in d.PORTRAITS:
		var path: String = d.PORTRAITS[speaker]
		if not path.is_empty():
			_check(ResourceLoader.exists(path), "立绘存在：%s → %s" % [speaker, path])
	d.free()

	var er = load("res://scripts/event_runner.gd").new()
	for stage in er.STAGE_BACKGROUNDS:
		var path: String = er.STAGE_BACKGROUNDS[stage]
		_check(ResourceLoader.exists(path), "事件背景存在：%s → %s" % [stage, path])
	er.free()

	var bl = load("res://scripts/battle.gd").new()
	for img_key in ["IMG_PLAYER", "IMG_MINION_MOUSE", "IMG_MINION_WISH", "IMG_BOSS_MOUSE"]:
		var img_path: String = bl.get(img_key)
		_check(ResourceLoader.exists(img_path), "战斗立绘存在：%s → %s" % [img_key, img_path])
	var fx_lists := [bl.FX_FIREBALL, bl.FX_FIRE_BURST, bl.FX_FIRE_DROP, bl.FX_HIT_FIRE]
	var fx_count := 0
	for fx_list in fx_lists:
		for fx_path in fx_list:
			fx_count += 1
			_check(ResourceLoader.exists(fx_path), "战斗特效存在：%s" % fx_path)
	_check(fx_count > 15, "战斗特效帧数齐全（%d 帧）" % fx_count)
	for fx_key in ["FX_GOLD_SLASH", "FX_IMPACT_FLASH"]:
		var fx_path2: String = bl.get(fx_key)
		_check(ResourceLoader.exists(fx_path2), "战斗特效存在：%s → %s" % [fx_key, fx_path2])
	bl.free()

	var wl = load("res://scripts/world.gd").new()
	for key in wl.SCENES:
		var path: String = wl.SCENES[key].get("image", "")
		_check(ResourceLoader.exists(path), "主城场景图存在：%s → %s" % [key, path])
	wl.free()

	_check(ResourceLoader.exists("res://assets/tapflow/ui/dialogue-box.webp"), "dialogue-box.webp 存在")
	_check(ResourceLoader.exists("res://assets/tapflow/ui/nameplate.webp"), "nameplate.webp 存在")
	_check(ResourceLoader.exists("res://assets/onboarding/start-bg.jpg"), "start-bg.jpg 存在")
	_check(ResourceLoader.exists("res://assets/onboarding/logo.png"), "logo.png 存在")
	_check(ResourceLoader.exists("res://assets/onboarding/enter-lushi.ogv"), "开场CG ogv 存在")


func _test_battle_config() -> void:
	var bl = load("res://scripts/battle.gd").new()
	for eid in ["small_rats", "rat_king", "final_rat_king", "minions", "wish_eater_boss"]:
		_check(bl.COMBAT_CONFIGS.has(eid), "战斗配置存在：%s" % eid)
		var e: Dictionary = bl.COMBAT_CONFIGS[eid]
		_check(int(e.get("enemy_hp", 0)) > 0, "战斗 %s enemy_hp>0" % eid)
		_check(int(e.get("enemy_damage", 0)) > 0, "战斗 %s enemy_damage>0" % eid)
		_check(int(e.get("reward", 0)) > 0, "战斗 %s 奖励灵石>0" % eid)
	_check(int(bl.COMBAT_CONFIGS["rat_king"].get("survive", 0)) > 0, "山鼠王撑救场机制配置")
	_check(bool(bl.COMBAT_CONFIGS["rat_king"].get("boss", false)), "山鼠王为 BOSS 战")
	_check(bool(bl.COMBAT_CONFIGS["final_rat_king"].get("boss", false)) and int(bl.COMBAT_CONFIGS["final_rat_king"].get("boss_hp", 0)) > 0, "合力战 BOSS 配置")
	bl.free()

	var events := Game.get_events()
	var battle_ids := {}
	for event_id in events:
		for n in events[event_id].get("nodes", []):
			var node: Dictionary = n
			if str(node.get("mode", "")) == "battle":
				battle_ids[str(node.get("battle_id", ""))] = true
	var bl2 = load("res://scripts/battle.gd").new()
	for bid in battle_ids:
		_check(bl2.COMBAT_CONFIGS.has(bid), "事件战斗 id 与战斗配置匹配：%s" % bid)
	bl2.free()


func _test_save_load() -> void:
	Game.new_game("冒烟测试")
	Game.start_event("wish_eater_bridge")
	Game.active_event["node_index"] = 3
	Game.save_game()
	Game.load_game()
	_check(Game.active_event.get("id", "") == "wish_eater_bridge", "读档恢复进行中事件")
	_check(int(Game.active_event.get("node_index", -1)) == 3, "读档恢复事件进度节点")
	Game.active_event = {}
	Game.finish_event("mouse_cave_treasure")
	_check(int(Game.resources.get("pills", 0)) == 3, "山鼠洞奖励丹药+2（1初始+2奖励）")
	_check(int(Game.resources.get("spirit_stones", 0)) == 70, "山鼠洞奖励灵石（20初始+50奖励）")


func _report() -> void:
	print("")
	print("========== 冒烟测试报告 ==========")
	print("通过: %d 项" % _passes)
	if _errors.is_empty():
		print("失败: 0 项 —— 全部通过")
	else:
		print("失败: %d 项" % _errors.size())
		for e in _errors:
			print("  ✗ %s" % e)
	print("==================================")
