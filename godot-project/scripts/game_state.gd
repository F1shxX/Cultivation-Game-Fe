extends Node
## 游戏全局状态（autoload "Game"）：玩家数据、时间与资源、事件进度、存档
## 数据结构与 Web demo 的 DemoSaveState 对齐

signal state_changed

const SAVE_PATH := "user://save.json"
const EVENTS_PATH := "res://data/events.json"

var player_name := ""
var year := 1
var month := 1
var scene_key := "hall"
var realm := "炼气"
var realm_progress := 0
var resources := {
	"spirit_stones": 20,
	"spirit_marrow": 0,
	"herbs": 3,
	"ore": 2,
	"pills": 1,
}
var learned_arts: Array = []
var completed_events: Array = []
var event_log: Array = []
var flags := {}
var npc_bonds := {"鹿真人": 0, "小娴": 0, "小张": 0}
var active_event := {}  # { "id": String, "node_index": int }

## 角色档案（对齐 web PlayerProfile：性别/衣装/难度/命格/天赋/五维）
var profile := {
	"gender": "男修",
	"outfit": "青衫",
	"difficulty": "道法自然",
	"fate": "天之骄子",
	"perks": [],
	"attributes": {"资质": 5, "悟性": 5, "神识": 5, "遁速": 5, "福缘": 5},
}
var has_save := false
var in_run := false

var _events_cache: Dictionary = {}

## 功法名（与 web 功法表对齐）
const ART_NAMES := {
	"jinmang_jue": "金芒诀",
	"yanxin_jue": "焰心诀",
	"luhua_jue": "鹿花诀",
	"nongsong_jue": "浓郁诀",
	"pojin_zhenjue": "破金真诀",
	"wanjian_xuangong": "万剑玄功",
	"hongmeng_gengjin": "鸿蒙庚金斩仙典",
	"gui_yuan": "龟元功",
}


## ---- 事件数据 ----

func get_events() -> Dictionary:
	if _events_cache.is_empty():
		var f := FileAccess.open(EVENTS_PATH, FileAccess.READ)
		if f:
			var parsed = JSON.parse_string(f.get_as_text())
			if parsed is Dictionary:
				_events_cache = parsed
	return _events_cache


func get_event(event_id: String) -> Dictionary:
	return get_events().get(event_id, {})


## ---- 开局 / 存档 ----

func new_game(pname: String) -> void:
	player_name = pname
	year = 1
	month = 1
	scene_key = "hall"
	realm = "炼气"
	realm_progress = 0
	resources = {"spirit_stones": 20, "spirit_marrow": 0, "herbs": 3, "ore": 2, "pills": 1}
	learned_arts = []
	completed_events = []
	event_log = []
	flags = {}
	npc_bonds = {"鹿真人": 0, "小娴": 0, "小张": 0}
	active_event = {}
	in_run = true
	add_log("初入鹿石宗", "%s 于鹿石宗宿舍醒来，正式踏上修行之路。" % player_name)
	save_game()
	state_changed.emit()


func save_game() -> void:
	var data := {
		"player_name": player_name,
		"year": year,
		"month": month,
		"scene_key": scene_key,
		"realm": realm,
		"realm_progress": realm_progress,
		"resources": resources,
		"learned_arts": learned_arts,
		"completed_events": completed_events,
		"event_log": event_log,
		"flags": flags,
		"npc_bonds": npc_bonds,
		"active_event": active_event,
	}
	var f := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if f:
		f.store_string(JSON.stringify(data, "\t"))
		f.close()
		has_save = true


func load_game() -> bool:
	if not FileAccess.file_exists(SAVE_PATH):
		return false
	var f := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if f == null:
		return false
	var parsed = JSON.parse_string(f.get_as_text())
	if parsed is Dictionary:
		player_name = str(parsed.get("player_name", ""))
		year = int(parsed.get("year", 1))
		month = int(parsed.get("month", 1))
		scene_key = str(parsed.get("scene_key", "hall"))
		realm = str(parsed.get("realm", "炼气"))
		realm_progress = int(parsed.get("realm_progress", 0))
		resources = parsed.get("resources", resources)
		learned_arts = Array(parsed.get("learned_arts", []))
		completed_events = Array(parsed.get("completed_events", []))
		event_log = Array(parsed.get("event_log", []))
		flags = Dictionary(parsed.get("flags", {}))
	var nb = parsed.get("npc_bonds", {})
	if nb is Dictionary:
		npc_bonds = nb
	var pf = parsed.get("profile", {})
	if pf is Dictionary and not pf.is_empty():
		profile = pf
	var ae = parsed.get("active_event", {})
	active_event = ae if ae is Dictionary else {}
	in_run = true
	state_changed.emit()
	return true
	return false


## ---- 时间 / 修炼 ----

func date_text() -> String:
	return "第 %d 年 %d 月" % [year, month]


func advance_months(n: int) -> void:
	month += n
	while month > 12:
		month -= 12
		year += 1


## 闭关修炼：推进一年 + 境界进度
func cultivate() -> String:
	advance_months(12)
	realm_progress += 20
	var msg := ""
	if realm_progress >= 100:
		realm_progress -= 100
		if realm == "炼气":
			realm = "筑基"
			msg = "灵力凝而不散，筑基成功！"
			add_log("境界突破", msg)
		else:
			msg = "境界又有精进。"
			add_log("境界精进", msg)
	else:
		msg = "修行一年，道行渐深。（进度 %d%%）" % realm_progress
	state_changed.emit()
	save_game()
	return msg


## ---- 场景交互（轻量版系统，对应 web 的炼丹/炼器/灵植园） ----

func alchemy() -> String:
	if int(resources.get("herbs", 0)) >= 3:
		resources["herbs"] = int(resources.get("herbs", 0)) - 3
		resources["pills"] = int(resources.get("pills", 0)) + 1
		advance_months(1)
		state_changed.emit()
		save_game()
		return "三株灵草入炉，凝成一枚疗伤丹。"
	return "灵草不足（需 3 株）。去灵植园采集吧。"


func forge() -> String:
	if int(resources.get("ore", 0)) >= 3:
		resources["ore"] = int(resources.get("ore", 0)) - 3
		advance_months(1)
		state_changed.emit()
		save_game()
		return "矿石淬炼完毕，兵刃更加锋利（攻击 +5）。"
	return "矿石不足（需 3 块）。"


func garden_harvest() -> String:
	advance_months(1)
	var gain := 1 + (1 if flags.get("garden_upgrade", false) else 0)
	resources["herbs"] = int(resources.get("herbs", 0)) + gain
	state_changed.emit()
	save_game()
	return "灵草长成，采得 %d 株。" % gain


## ---- 事件 ----

func is_event_completed(event_id: String) -> bool:
	return event_id in completed_events


func is_event_unlocked(event_id: String) -> bool:
	var def := get_event(event_id)
	if def.is_empty():
		return false
	return year >= int(def.get("trigger_year", 9999))


func start_event(event_id: String) -> void:
	active_event = {"id": event_id, "node_index": 0}
	state_changed.emit()


func finish_event(event_id: String) -> void:
	var def := get_event(event_id)
	if not def.is_empty():
		var rw: Dictionary = def.get("rewards", {})
		for key in ["spirit_stones", "spirit_marrow", "herbs", "ore", "pills"]:
			if rw.has(key):
				resources[key] = int(resources.get(key, 0)) + int(rw[key])
		for art in rw.get("arts", []):
			if not art in learned_arts:
				learned_arts.append(art)
		add_log(def.get("title", event_id), "完成「%s」。奖励：%s" % [def.get("title", ""), def.get("reward_text", "")])
	if not event_id in completed_events:
		completed_events.append(event_id)
	active_event = {}
	state_changed.emit()
	save_game()


## 战斗胜利后推进：由 battle 场景调用
func battle_won() -> void:
	if active_event.is_empty():
		return
	active_event["node_index"] = int(active_event.get("node_index", 0)) + 1
	state_changed.emit()


## ---- 日志 ----

## NPC 羁绊（对齐 web relationships.bond）：交谈累计
func add_bond(npc: String, n := 1) -> void:
	npc_bonds[npc] = int(npc_bonds.get(npc, 0)) + n


func get_bond(npc: String) -> int:
	return int(npc_bonds.get(npc, 0))


func add_log(title: String, text: String) -> void:
	event_log.append({
		"year": year,
		"month": month,
		"title": title,
		"text": text,
	})
	if event_log.size() > 200:
		event_log = event_log.slice(event_log.size() - 200)
