extends Control
## 俯视弹幕实时战斗 —— 1:1 移植 web demo 的 BulletHellCombat
## 数值、规则、HUD 布局全部对齐 web：
## · WASD 移动（245px/s），鼠标指向手动射击 + 自动索敌
## · 空格释放术法（金芒穿透 / 水刃减速 / 火弹灼烧 × 直线/环形/天降三技法）
## · BOSS 三连扇形弹幕，小怪追身碰撞伤害
## · 撑时间 / 杀数 / 击杀 BOSS 三种胜利目标
## · combat-hud（标题/血条/灵力/BOSS 血条/战绩）+ build-strip 五格配置 + skillbar + 中央结算弹窗

signal battle_finished(result: Dictionary)

## ---- 配置表（对齐 web getCombatConfig 逐项） ----
const COMBAT_CONFIGS := {
	"small_rats": {"title": "山鼠仔来袭", "objective": "清掉山鼠仔", "target_kills": 12, "survive": 0, "boss": false, "boss_name": "", "boss_hp": 0, "enemy_hp": 16, "enemy_speed": 72, "enemy_damage": 5, "spawn_every": 1.45, "max_enemies": 3, "reward": 24, "theme": "mouse"},
	"minions": {"title": "邪祟爪牙", "objective": "清除邪祟爪牙", "target_kills": 22, "survive": 0, "boss": false, "boss_name": "", "boss_hp": 0, "enemy_hp": 28, "enemy_speed": 112, "enemy_damage": 8, "spawn_every": 0.7, "max_enemies": 20, "reward": 28, "theme": "wish"},
	"rat_king": {"title": "山鼠王现身", "objective": "撑到青木门救援", "target_kills": 0, "survive": 26, "boss": true, "boss_name": "山鼠王", "boss_hp": 680, "enemy_hp": 26, "enemy_speed": 92, "enemy_damage": 7, "spawn_every": 1.35, "max_enemies": 16, "reward": 18, "theme": "mouse"},
	"final_rat_king": {"title": "合力击破山鼠王", "objective": "合力击破山鼠王", "target_kills": 0, "survive": 0, "boss": true, "boss_name": "山鼠王", "boss_hp": 560, "enemy_hp": 24, "enemy_speed": 98, "enemy_damage": 8, "spawn_every": 1.45, "max_enemies": 14, "reward": 36, "theme": "mouse"},
	"wish_eater_boss": {"title": "啖愿妖真身", "objective": "击破啖愿妖真身", "target_kills": 0, "survive": 0, "boss": true, "boss_name": "啖愿妖", "boss_hp": 620, "enemy_hp": 28, "enemy_speed": 108, "enemy_damage": 9, "spawn_every": 1.55, "max_enemies": 14, "reward": 40, "theme": "wish"},
}

## ---- 功法表（对齐 web methodCatalog） ----
const METHODS := {
	"luhua_jue": {"name": "鹿花诀", "element": "无", "attack_name": "灵光飞行", "attack_damage": 12, "projectile_speed": 350, "attack_interval": 0.8, "defense": 5, "regen": 2, "shield": 0, "color": Color("#dceeff")},
	"jinmang_jue": {"name": "金芒诀", "element": "金", "attack_name": "金色锋刃飞行", "attack_damage": 15, "projectile_speed": 400, "attack_interval": 0.9, "defense": 3, "regen": 0, "shield": 0, "color": Color("#f7d36a")},
	"yanxin_jue": {"name": "焰心诀", "element": "火", "attack_name": "烈焰爆裂", "attack_damage": 18, "projectile_speed": 300, "attack_interval": 1.1, "defense": 0, "regen": 0, "shield": 0, "color": Color("#ff8a4f")},
}

## ---- 术法表（web spellCatalog） ----
const SPELLS := {
	"jinmang": {"name": "金芒", "element": "金", "base_damage": 20, "mana_cost": 15, "cooldown": 3.0, "color": Color("#f5d566")},
	"shuiren": {"name": "水刃", "element": "水", "base_damage": 14, "mana_cost": 12, "cooldown": 2.5, "color": Color("#80d8ff")},
	"huodan": {"name": "火弹", "element": "火", "base_damage": 24, "mana_cost": 18, "cooldown": 3.5, "color": Color("#ff7a3d")},
}

## ---- 技法表（web techniqueCatalog） ----
const TECHNIQUES := {
	"straight": {"name": "直线飞行", "damage_multiplier": 1.0, "range": 600},
	"ring": {"name": "环形扩散", "damage_multiplier": 0.7, "range": 150},
	"drop": {"name": "天降坠击", "damage_multiplier": 1.3, "range": 500},
}

## ---- 秘法表（web secretCatalog） ----
const SECRETS := {
	"cuti": {"name": "淬体", "flat_damage": 5},
	"mingmu": {"name": "明目", "crit_chance": 0.05},
	"pojia": {"name": "破甲", "armor_pierce": 0.1},
	"yufeng": {"name": "御风", "range_bonus": 0.3},
}

## ---- 视觉资源（web useCombatImages） ----
const IMG_PLAYER := "res://assets/tapflow/portraits/player-combat.webp"
const IMG_MINION_MOUSE := "res://assets/tapflow/monsters/mouse-minion.webp"
const IMG_MINION_WISH := "res://assets/tapflow/monsters/wish-eater.webp"
const IMG_BOSS_MOUSE := "res://assets/tapflow/monsters/mouse-king.webp"
const FX_FIREBALL := ["res://assets/tapflow/combat/fireball-00.png", "res://assets/tapflow/combat/fireball-01.png", "res://assets/tapflow/combat/fireball-02.png", "res://assets/tapflow/combat/fireball-03.png", "res://assets/tapflow/combat/fireball-04.png"]
const FX_FIRE_BURST := ["res://assets/tapflow/combat/fire-burst-00.png", "res://assets/tapflow/combat/fire-burst-01.png", "res://assets/tapflow/combat/fire-burst-02.png", "res://assets/tapflow/combat/fire-burst-03.png", "res://assets/tapflow/combat/fire-burst-04.png", "res://assets/tapflow/combat/fire-burst-05.png", "res://assets/tapflow/combat/fire-burst-06.png"]
const FX_FIRE_DROP := ["res://assets/tapflow/combat/fire-drop-00.png", "res://assets/tapflow/combat/fire-drop-01.png", "res://assets/tapflow/combat/fire-drop-02.png", "res://assets/tapflow/combat/fire-drop-03.png"]
const FX_HIT_FIRE := ["res://assets/tapflow/combat/hit-fire-00.png", "res://assets/tapflow/combat/hit-fire-01.png", "res://assets/tapflow/combat/hit-fire-02.png", "res://assets/tapflow/combat/hit-fire-03.png", "res://assets/tapflow/combat/hit-fire-04.png"]
const FX_GOLD_SLASH := "res://assets/tapflow/combat/gold-slash.png"
const FX_IMPACT_FLASH := "res://assets/tapflow/combat/impact-flash.png"

const PLAYER_SPEED := 245.0
const MANA_REGEN := 3.0

## ---- 运行时状态 ----
var _config: Dictionary = {}
var _profile: Dictionary = {}
var _status := "ready"  # ready / running / won / lost
var _player := {"x": 0.0, "y": 0.0, "r": 18.0, "hp": 0.0, "max_hp": 0.0, "mana": 0.0, "max_mana": 60.0, "defense": 0, "regen": 0.0}
var _enemies: Array = []
var _projectiles: Array = []
var _particles: Array = []
var _elapsed := 0.0
var _kills := 0
var _spirit_stones := 0
var _spawn_cd := 0.0
var _auto_cd := 0.0
var _manual_cd := 0.0
var _skill_cd := 0.0
var _skill_max_cd := 3.0
var _boss_shot_cd := 1.2
var _objective_met := false
var _notice := ""
var _notice_timer := 0.0
var _pointer := Vector2(0, 0)
var _pointer_down := false
var _result: Dictionary = {}

## ---- 节点引用 ----
var _root: Control
var _arena: Control
var _tex_player: TextureRect
var _fx_cache: Dictionary = {}

var _hud_title: Label
var _hud_objective: Label
var _hud_hp: Label
var _hud_mana: Label
var _hud_boss: Label
var _hp_fill: TextureRect
var _mana_fill: TextureRect
var _boss_fill: TextureRect
var _boss_row: Control
var _readout: Label
var _notice_label: Label
var _build_labels: Array = []
var _skill_hint: Label
var _skill_fill: TextureRect
var _modal: Control
var _modal_title: Label
var _modal_text: Label
var _modal_button: Button

var _kai: FontFile


func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_kai = FontFile.new()
	_kai.load_dynamic_font("res://fonts/KaiTi.ttf")
	_load_fx_cache()
	var battle_id: String = BattleData.pending_battle_id
	_config = COMBAT_CONFIGS.get(battle_id, COMBAT_CONFIGS["small_rats"]).duplicate()
	_config["id"] = battle_id
	_make_profile()
	_build_ui()
	_reset_runtime()
	set_process(true)


func _load_fx_cache() -> void:
	_fx_cache["player"] = _try_load(IMG_PLAYER)
	_fx_cache["minion_mouse"] = _try_load(IMG_MINION_MOUSE)
	_fx_cache["minion_wish"] = _try_load(IMG_MINION_WISH)
	_fx_cache["boss_mouse"] = _try_load(IMG_BOSS_MOUSE)
	var fb: Array = []
	for p in FX_FIREBALL:
		fb.append(_try_load(p))
	_fx_cache["fireball"] = fb
	var fburst: Array = []
	for p in FX_FIRE_BURST:
		fburst.append(_try_load(p))
	_fx_cache["fireBurst"] = fburst
	var fdrop: Array = []
	for p in FX_FIRE_DROP:
		fdrop.append(_try_load(p))
	_fx_cache["fireDrop"] = fdrop
	var hf: Array = []
	for p in FX_HIT_FIRE:
		hf.append(_try_load(p))
	_fx_cache["hitFire"] = hf
	_fx_cache["goldSlash"] = _try_load(FX_GOLD_SLASH)
	_fx_cache["flash"] = _try_load(FX_IMPACT_FLASH)


func _try_load(path: String):
	if ResourceLoader.exists(path):
		return load(path)
	return null


## 由玩家已学功法推导战斗 profile（web getLoadout + getCombatProfile 的简化版）
func _make_profile() -> void:
	var method_id := "luhua_jue"
	for art in Game.learned_arts:
		if METHODS.has(art):
			method_id = art
			break
	var spell_id := "jinmang"
	if method_id == "yanxin_jue":
		spell_id = "huodan"
	elif method_id == "luhua_jue":
		spell_id = "shuiren"
	var method: Dictionary = METHODS[method_id]
	var spell: Dictionary = SPELLS[spell_id]
	var technique: Dictionary = TECHNIQUES["straight"]
	var element_match: bool = method["element"] == "无" or method["element"] == spell["element"]
	var element_factor := 1.0 if element_match else 0.7
	var active_damage: int = maxi(1, int(round(spell["base_damage"] * technique["damage_multiplier"] * element_factor)))
	_profile = {
		"method_id": method_id,
		"spell_id": spell_id,
		"technique_id": "straight",
		"method": method,
		"spell": spell,
		"technique": technique,
		"active_damage": active_damage,
		"element_match": element_match,
		"skill_name": "%s · %s" % [spell["name"], technique["name"]],
		"max_hp": 100 + int(method["defense"]) * 4 + int(method["shield"]),
	}


func _reset_runtime() -> void:
	_arena_size = _arena.size
	_player["x"] = _arena_size.x * 0.44
	_player["y"] = _arena_size.y * 0.58
	_player["hp"] = _profile["max_hp"]
	_player["max_hp"] = _profile["max_hp"]
	_player["mana"] = 60.0
	_player["defense"] = _profile["method"]["defense"]
	_player["regen"] = _profile["method"]["regen"]
	_enemies.clear()
	_projectiles.clear()
	_particles.clear()
	# BOSS 战开局即刷出 BOSS（对齐 web resetRuntime：if (config.boss) spawnCombatEnemy(..., "boss")）
	if bool(_config["boss"]):
		_spawn_enemy("boss")
	_elapsed = 0.0
	_kills = 0
	_spirit_stones = 0
	_spawn_cd = 0.0
	_auto_cd = minf(0.4, float(_profile["method"]["attack_interval"]) * 0.45)
	_manual_cd = 0.0
	_skill_cd = 0.0
	_skill_max_cd = _profile["spell"]["cooldown"]
	_boss_shot_cd = 1.2
	_objective_met = false
	_result = {}
	_status = "ready"
	_show_modal()


## ---------- UI ----------

func _build_ui() -> void:
	_root = Control.new()
	_root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(_root)

	# 战场（combat-overlay：径向青绿光 + 斜线网格，自绘 SubViewport 不需要，直接画在 _draw）
	_arena = Control.new()
	_arena.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_arena.mouse_filter = Control.MOUSE_FILTER_STOP
	_arena.gui_input.connect(_on_arena_input)
	_root.add_child(_arena)
	_arena.draw.connect(_draw_arena)

	# ---- combat-hud（top 18, left 172, right 18 三栏） ----
	_build_hud()

	# ---- combat-build-strip（右下 5 格功/术/技/秘/秘） ----
	_build_build_strip()

	# ---- combat-skillbar（bottom 18 底条） ----
	_build_skillbar()

	# ---- combat-notice（中上 22%） ----
	_notice_label = Label.new()
	_notice_label.position = Vector2(885, 238)
	_notice_label.size = Vector2(150, 60)
	_notice_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_notice_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_notice_label.add_theme_font_size_override("font_size", 20)
	_notice_label.add_theme_color_override("font_color", Color("#ffcf8b"))
	_notice_label.add_theme_color_override("font_shadow_color", Color.BLACK)
	_notice_label.visible = false
	_root.add_child(_notice_label)

	# ---- combat-modal（中央结算弹窗） ----
	_build_modal()


func _hud_panel_style() -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0, 0, 0, 0.58)
	sb.border_color = Color(1, 0.937, 0.8, 0.18)
	sb.set_border_width_all(1)
	sb.set_corner_radius_all(8)
	sb.set_content_margin_all(12)
	return sb


func _build_hud() -> void:
	# 左栏：标题卡（combat-title）
	var title_panel := Panel.new()
	title_panel.position = Vector2(172, 18)
	title_panel.size = Vector2(400, 96)
	title_panel.add_theme_stylebox_override("panel", _hud_panel_style())
	title_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_root.add_child(title_panel)
	var tag := Label.new()
	tag.text = "战斗 Demo"
	tag.position = Vector2(12, 10)
	tag.size = Vector2(376, 18)
	tag.add_theme_font_size_override("font_size", 13)
	tag.add_theme_color_override("font_color", Color("#9bd6ff"))
	title_panel.add_child(tag)
	_hud_title = Label.new()
	_hud_title.text = str(_config["title"])
	_hud_title.position = Vector2(12, 30)
	_hud_title.size = Vector2(376, 28)
	_hud_title.add_theme_font_size_override("font_size", 20)
	_hud_title.add_theme_color_override("font_color", Color("#fff2c5"))
	title_panel.add_child(_hud_title)
	_hud_objective = Label.new()
	_hud_objective.position = Vector2(12, 60)
	_hud_objective.size = Vector2(376, 20)
	_hud_objective.add_theme_font_size_override("font_size", 13)
	_hud_objective.add_theme_color_override("font_color", Color("#f5d784"))
	title_panel.add_child(_hud_objective)

	# 中栏：三/四行条（combat-bars：气血/灵力/BOSS；css padding 10 12 gap 8，行高 18+5+9=32）
	var bars_panel := Panel.new()
	bars_panel.position = Vector2(582, 18)
	bars_panel.size = Vector2(560, 132 if _config["boss"] else 92)
	bars_panel.add_theme_stylebox_override("panel", _hud_panel_style())
	bars_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_root.add_child(bars_panel)
	_boss_row = bars_panel
	_hud_hp = _add_bar_row(bars_panel, 0, "气血", Color("#54d16f"), Color("#f2d782"))
	_hud_mana = _add_bar_row(bars_panel, 1, "灵力", Color("#55c7ff"), Color("#9bd6ff"))
	_hp_fill = _hud_hp.get_meta("fill")
	_mana_fill = _hud_mana.get_meta("fill")
	if _config["boss"]:
		_hud_boss = _add_bar_row(bars_panel, 2, str(_config["boss_name"]), Color("#ff6f5f"), Color("#ffb45e"))
		_boss_fill = _hud_boss.get_meta("fill")

	# 右栏：战绩（combat-readout；css .combat-shell .combat-hud right 18 → 右边缘 1902）
	var readout_panel := Panel.new()
	readout_panel.position = Vector2(1722, 18)
	readout_panel.size = Vector2(180, 60)
	readout_panel.add_theme_stylebox_override("panel", _hud_panel_style())
	readout_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_root.add_child(readout_panel)
	_readout = Label.new()
	_readout.position = Vector2(12, 10)
	_readout.size = Vector2(156, 40)
	_readout.add_theme_font_size_override("font_size", 13)
	_readout.add_theme_color_override("font_color", Color("#fff1c9"))
	_readout.text = "击杀 0\n用时 0s"
	readout_panel.add_child(_readout)


func _add_bar_row(parent: Control, row: int, name: String, c1: Color, c2: Color) -> Label:
	# css 行高：label 18 + gap 5 + bar 9 = 32，行间 gap 8 → 步长 40
	var y := 10 + row * 40
	var label := Label.new()
	label.text = "%s 0/0" % name
	label.position = Vector2(12, y)
	label.size = Vector2(536, 18)
	label.add_theme_font_size_override("font_size", 13)
	label.add_theme_color_override("font_color", Color("#fff5d8"))
	parent.add_child(label)
	# 底槽（rgba(255,255,255,0.11)，高 9 圆角）
	var track := ColorRect.new()
	track.position = Vector2(12, y + 23)
	track.size = Vector2(536, 9)
	track.color = Color(1, 1, 1, 0.11)
	parent.add_child(track)
	# 渐变前景：c1 → c2
	var grad := Gradient.new()
	grad.colors = PackedColorArray([c1, c2])
	var tex := GradientTexture2D.new()
	tex.gradient = grad
	tex.fill_from = Vector2(0, 0)
	tex.fill_to = Vector2(1, 0)
	var fill := TextureRect.new()
	fill.texture = tex
	fill.position = Vector2(12, y + 22)
	fill.size = Vector2(0, 9)
	fill.expand_mode = TextureRect.EXPAND_IGNORE_SIZE  # GradientTexture2D 默认 64×64，会撑爆血条
	fill.stretch_mode = TextureRect.STRETCH_SCALE
	parent.add_child(fill)
	label.set_meta("fill", fill)
	return label


func _build_build_strip() -> void:
	# combat-build-strip：css left/right 18, bottom 72 → y = 1080-72-66 = 942，5 格 27px 圆形图标 + 名字
	var strip := Panel.new()
	strip.position = Vector2(18, 942)
	strip.size = Vector2(1884, 66)
	var sb := _hud_panel_style()
	sb.set_content_margin_all(7)
	strip.add_theme_stylebox_override("panel", sb)
	strip.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_root.add_child(strip)
	var entries := [
		["功", "主修", _profile["method"]["name"]],
		["术", "术法", _profile["spell"]["name"]],
		["技", "技法", _profile["technique"]["name"]],
		["秘", "秘法一", "无"],
		["秘", "秘法二", "无"],
	]
	for i in entries.size():
		var cell_x := 7 + i * 374
		var icon := Panel.new()
		icon.position = Vector2(cell_x + 8, 8)
		icon.size = Vector2(27, 27)
		var i_sb := StyleBoxFlat.new()
		i_sb.bg_color = Color(0, 0, 0, 0)
		i_sb.set_border_width_all(1)
		i_sb.border_color = Color(0.961, 0.843, 0.494, 0.38)
		i_sb.set_corner_radius_all(14)
		icon.add_theme_stylebox_override("panel", i_sb)
		strip.add_child(icon)
		var icon_l := Label.new()
		icon_l.text = entries[i][0]
		icon_l.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		icon_l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		icon_l.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		icon_l.add_theme_font_size_override("font_size", 11)
		icon_l.add_theme_color_override("font_color", Color("#f4d784"))
		icon.add_child(icon_l)
		var small := Label.new()
		small.text = entries[i][1]
		small.position = Vector2(cell_x + 44, 8)
		small.size = Vector2(320, 12)
		small.add_theme_font_size_override("font_size", 9)
		small.add_theme_color_override("font_color", Color("#9bd6ff"))
		strip.add_child(small)
		var strong := Label.new()
		strong.text = entries[i][2]
		strong.position = Vector2(cell_x + 44, 22)
		strong.size = Vector2(320, 14)
		strong.add_theme_font_size_override("font_size", 11)
		strong.add_theme_color_override("font_color", Color("#fff1c9"))
		strip.add_child(strong)


func _build_skillbar() -> void:
	# combat-skillbar：css left/right 12, bottom 12，高 46（padding 10 + 行 26）→ y = 1080-12-46 = 1022
	var bar := Panel.new()
	bar.position = Vector2(12, 1022)
	bar.size = Vector2(1896, 46)
	var sb := _hud_panel_style()
	sb.content_margin_left = 12
	sb.content_margin_top = 10
	sb.content_margin_right = 12
	sb.content_margin_bottom = 10
	bar.add_theme_stylebox_override("panel", sb)
	bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_root.add_child(bar)
	var hints := [
		"WASD/方向键移动",
		"自动 · %s" % _profile["method"]["attack_name"],
		"鼠标 · 灵力飞射",
	]
	var x := 12.0
	for h in hints:
		var l := Label.new()
		l.text = h
		l.position = Vector2(x, 13)
		l.size = Vector2(190, 20)
		l.add_theme_font_size_override("font_size", 13)
		l.add_theme_color_override("font_color", Color("#f1e1c2"))
		bar.add_child(l)
		x += 200
	_skill_hint = Label.new()
	_skill_hint.text = "空格 %s 可用" % _profile["skill_name"]
	_skill_hint.position = Vector2(x, 13)
	_skill_hint.size = Vector2(560, 20)
	_skill_hint.add_theme_font_size_override("font_size", 13)
	_skill_hint.add_theme_color_override("font_color", Color("#f1e1c2"))
	bar.add_child(_skill_hint)
	# 冷却条（蓝→金渐变，右段；容器内容宽 1896-24=1872 → track x = 12+1872-360 = 1524）
	var track := ColorRect.new()
	track.position = Vector2(1524, 18)
	track.size = Vector2(360, 9)
	track.color = Color(1, 1, 1, 0.11)
	bar.add_child(track)
	var grad := Gradient.new()
	grad.colors = PackedColorArray([Color("#78d6ff"), Color("#f2d782")])
	var tex := GradientTexture2D.new()
	tex.gradient = grad
	tex.fill_from = Vector2(0, 0)
	tex.fill_to = Vector2(1, 0)
	_skill_fill = TextureRect.new()
	_skill_fill.texture = tex
	_skill_fill.position = Vector2(1524, 18)
	_skill_fill.size = Vector2(360, 9)
	_skill_fill.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	_skill_fill.stretch_mode = TextureRect.STRETCH_SCALE
	bar.add_child(_skill_fill)


func _build_modal() -> void:
	# combat-modal：中央 430px 宽黑卡（css translate(-50%,-50%) 完全居中）
	_modal = Panel.new()
	_modal.position = Vector2(745, 430)
	_modal.size = Vector2(430, 220)
	var sb := _hud_panel_style()
	sb.set_content_margin_all(18)
	_modal.add_theme_stylebox_override("panel", sb)
	_root.add_child(_modal)
	_modal_title = Label.new()
	_modal_title.position = Vector2(18, 24)
	_modal_title.size = Vector2(394, 36)
	_modal_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_modal_title.add_theme_font_size_override("font_size", 26)
	_modal_title.add_theme_color_override("font_color", Color("#fff1bf"))
	_modal.add_child(_modal_title)
	_modal_text = Label.new()
	_modal_text.position = Vector2(18, 66)
	_modal_text.size = Vector2(394, 70)
	_modal_text.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_modal_text.add_theme_font_size_override("font_size", 15)
	_modal_text.add_theme_color_override("font_color", Color("#f1e1c2"))
	_modal_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_modal.add_child(_modal_text)
	_modal_button = Button.new()
	_modal_button.text = "开始战斗"
	_modal_button.position = Vector2(52, 150)
	_modal_button.size = Vector2(326, 44)
	_modal_button.add_theme_font_size_override("font_size", 17)
	_modal_button.add_theme_color_override("font_color", Color("#fff8e7"))
	var b_sb := StyleBoxFlat.new()
	b_sb.bg_color = Color(0.475, 0.298, 0.165, 0.96)
	b_sb.border_color = Color(1, 0.937, 0.8, 0.3)
	b_sb.set_border_width_all(1)
	b_sb.set_corner_radius_all(8)
	_modal_button.add_theme_stylebox_override("normal", b_sb)
	var b_h := b_sb.duplicate()
	b_h.bg_color = Color(0.62, 0.4, 0.22, 0.98)
	_modal_button.add_theme_stylebox_override("hover", b_h)
	_modal_button.pressed.connect(_on_modal_button)
	_modal.add_child(_modal_button)


func _show_modal() -> void:
	_modal.visible = true
	match _status:
		"ready":
			_modal_title.text = str(_config["title"])
			_modal_text.text = "%s。当前配置：%s + %s。目标达成后仍要清完场上怪物，才会进入下一段剧情。" % [
				_config["objective"], _profile["method"]["name"], _profile["skill_name"]]
			_modal_button.text = "开始战斗"
		"lost":
			_modal_title.text = "战斗失利"
			_modal_text.text = "气血归零，本次不推进剧情。调整走位后重试。"
			_modal_button.text = "重新挑战"
		"won":
			_modal_title.text = "战斗胜利"
			var hp_pct := int(round(_player["hp"] / _player["max_hp"] * 100.0))
			_modal_text.text = "击杀 %d · 用时 %ds · 剩余气血 %d%% · 灵石 +%d" % [
				_result.get("kills", 0), _result.get("seconds", 0), hp_pct, _result.get("spirit_stones", 0)]
			_modal_button.text = "结算并继续剧情"


func _on_modal_button() -> void:
	if _status == "won":
		# 结算并继续剧情（对齐 web finishCombat）：战利品 + 奖励灵石入账，推进事件节点，切回事件场景
		var stones: int = int(_result.get("spirit_stones", 0)) + int(_config["reward"])
		Game.resources["spirit_stones"] = int(Game.resources.get("spirit_stones", 0)) + stones
		Game.battle_won()
		Game.save_game()
		if Game.active_event.is_empty():
			SceneManager.switch_scene("world")
		else:
			SceneManager.switch_scene("event")
		return
	_reset_runtime()
	_status = "running"
	_modal.visible = false


## ---------- 输入 ----------

func _on_arena_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion:
		_pointer = event.position
	elif event is InputEventMouseButton:
		_pointer = event.position
		_pointer_down = event.pressed


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("battle_skill"):
		_cast_skill()
		get_viewport().set_input_as_handled()


func _cast_skill() -> void:
	if _status != "running":
		return
	var spell: Dictionary = _profile["spell"]
	if _player["mana"] < float(spell["mana_cost"]):
		_set_notice("灵力不足")
		return
	_player["mana"] -= float(spell["mana_cost"])
	_skill_cd = float(spell["cooldown"])
	_skill_max_cd = float(spell["cooldown"])
	_set_notice("%s · 直线飞行" % _profile["skill_name"])
	# 直线技法：发射大号技能弹（web castActiveSkill straight 分支）
	var target = _nearest_enemy()
	var tx: float = target.x if target != null else _pointer.x
	var ty: float = target.y if target != null else _pointer.y
	var d := Vector2(tx - _player["x"], ty - _player["y"])
	if d.length() < 1.0:
		d = Vector2(1, 0)
	d = d.normalized()
	var spell_id: String = _profile["spell_id"]
	var radius := 10.0 if spell_id == "huodan" else 7.0
	var color: Color = spell["color"]
	_projectiles.append({
		"x": _player["x"], "y": _player["y"], "vx": d.x * 680.0, "vy": d.y * 680.0,
		"r": radius, "damage": int(_profile["active_damage"]), "kind": "skill",
		"life": 1.6, "traveled": 0.0, "range": 600.0, "pierce": 1 if spell_id == "jinmang" else 0,
		"hit_ids": {}, "color": color, "spell_id": spell_id,
		"visual": "fireball" if spell_id == "huodan" else "goldSlash" if spell_id == "jinmang" else "orb",
		"angle": d.angle(), "scale": 1.0,
	})


func _set_notice(text: String) -> void:
	_notice = text
	_notice_timer = 1.35


## ---------- 主循环 ----------

var _arena_size := Vector2(1920, 1080)


func _process(delta: float) -> void:
	if _status != "running":
		_arena.queue_redraw()
		return
	delta = minf(0.033, delta)
	_arena_size = _arena.size
	_elapsed += delta
	_spawn_cd -= delta
	_auto_cd -= delta
	_manual_cd -= delta
	_skill_cd = maxf(0.0, _skill_cd - delta)
	_boss_shot_cd -= delta
	_notice_timer = maxf(0.0, _notice_timer - delta)
	_player["mana"] = minf(60.0, _player["mana"] + MANA_REGEN * delta)
	if _player["regen"] > 0.0:
		_player["hp"] = minf(_player["max_hp"], _player["hp"] + _player["regen"] * delta)

	# 移动（WASD/方向键，245px/s）
	var move := Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
	if move.length() > 1.0:
		move = move.normalized()
	_player["x"] = clampf(_player["x"] + move.x * PLAYER_SPEED * delta, 24.0, _arena_size.x - 24.0)
	_player["y"] = clampf(_player["y"] + move.y * PLAYER_SPEED * delta, 24.0, _arena_size.y - 24.0)

	# 刷怪（对齐 web：objective 未达成时持续刷）
	var boss_alive := false
	for e in _enemies:
		if e["kind"] == "boss":
			boss_alive = true
	var should_spawn: bool = not _objective_met and (not bool(_config["boss"]) or boss_alive)
	if should_spawn and _enemies.size() < int(_config["max_enemies"]) and _spawn_cd <= 0.0:
		_spawn_enemy("minion")
		_spawn_cd = maxf(0.38, float(_config["spawn_every"]) - _elapsed * 0.01)

	# 自动索敌射击
	var target = _nearest_enemy()
	if target != null and _auto_cd <= 0.0:
		_fire_shot(target.x, target.y, "auto")
		_auto_cd = maxf(0.28, float(_profile["method"]["attack_interval"]))

	# 鼠标手动射击（0.16s 间隔）
	if _pointer_down and _manual_cd <= 0.0:
		_fire_shot(_pointer.x, _pointer.y, "manual")
		_manual_cd = 0.16

	# BOSS 三连扇形弹幕
	if boss_alive and _boss_shot_cd <= 0.0:
		var boss = null
		for e in _enemies:
			if e["kind"] == "boss":
				boss = e
				break
		if boss != null:
			var angle := Vector2(_player["x"] - boss.x, _player["y"] - boss.y).angle()
			for offset in [-0.28, 0.0, 0.28]:
				var speed := 240.0 if str(_config["id"]) == "rat_king" else 275.0
				_projectiles.append({
					"x": boss.x, "y": boss.y,
					"vx": cos(angle + offset) * speed, "vy": sin(angle + offset) * speed,
					"r": 12.0, "damage": 7, "kind": "enemy", "life": 4.0, "traveled": 0.0,
					"range": 1200.0, "pierce": 0, "hit_ids": {}, "color": Color("#ff5653"),
					"visual": "orb", "angle": 0.0, "scale": 1.0, "spell_id": "",
				})
			_boss_shot_cd = 1.05 if str(_config.get("id", "")) == "rat_king" else 1.22

	# 敌人 AI（追身 + 碰撞伤害 + 灼烧跳伤）
	var to_remove: Array = []
	for e in _enemies:
		e["attack_cd"] = maxf(0.0, e["attack_cd"] - delta)
		e["slow_timer"] = maxf(0.0, e["slow_timer"] - delta)
		if e["burn_timer"] > 0.0:
			e["hp"] -= e["burn_dps"] * delta
			e["burn_timer"] = maxf(0.0, e["burn_timer"] - delta)
		var d := Vector2(_player["x"] - e.x, _player["y"] - e.y)
		var length := d.length()
		if length < 1.0:
			length = 1.0
		var slow := 0.7 if e["slow_timer"] > 0.0 else 1.0
		e.x += d.x / length * e["speed"] * slow * delta
		e.y += d.y / length * e["speed"] * slow * delta
		if length <= e["r"] + _player["r"] and e["attack_cd"] <= 0.0:
			_apply_player_damage(int(e["damage"]))
			e["attack_cd"] = 0.8 if e["kind"] == "boss" else 0.55
			_push_particle(_player["x"], _player["y"], 34.0, Color(1, 0.345, 0.314, 0.55), 0.25)
		if e["hp"] <= 0.0:
			to_remove.append(e)
	# 敌人标识（用于字典/对象混合访问的桥接，保持 e.x/e["key"] 两种访问方式一致）
	for e in to_remove:
		_enemies.erase(e)
		_kills += 1
		_spirit_stones += 1 + randi() % 2

	# 弹幕运动与命中
	var p_remove: Array = []
	for p in _projectiles:
		p["x"] += p["vx"] * delta
		p["y"] += p["vy"] * delta
		p["traveled"] += Vector2(p["vx"], p["vy"]).length() * delta
		p["life"] -= delta
		var dead: bool = p["life"] <= 0.0 or p["traveled"] > p["range"]
		if p["kind"] == "enemy":
			# 敌弹 → 玩家
			if Vector2(p["x"] - _player["x"], p["y"] - _player["y"]).length() <= p["r"] + _player["r"]:
				_apply_player_damage(int(p["damage"]))
				dead = true
		else:
			# 我方弹 → 敌人
			for e in _enemies:
				if p["hit_ids"].has(e["id"]):
					continue
				if Vector2(p["x"] - e.x, p["y"] - e.y).length() <= p["r"] + e["r"]:
					_apply_enemy_hit(e, int(p["damage"]), str(p.get("spell_id", "")))
					p["hit_ids"][e["id"]] = true
					if p["pierce"] > 0:
						p["pierce"] -= 1
					else:
						dead = true
					break
		if dead:
			p_remove.append(p)
	for p in p_remove:
		_projectiles.erase(p)

	# 粒子衰减
	var pt_remove: Array = []
	for pt in _particles:
		pt["life"] -= delta
		if pt["life"] <= 0.0:
			pt_remove.append(pt)
	for pt in pt_remove:
		_particles.erase(pt)

	# 胜负判定（对齐 web finishCombat 逻辑）
	if _player["hp"] <= 0.0:
		_status = "lost"
		_show_modal()
		return
	if float(_config["survive"]) > 0.0 and _elapsed >= float(_config["survive"]):
		_player["hp"] = maxf(_player["hp"], _player["max_hp"] * 0.18)
		_objective_met = true
	if _config["boss"]:
		var has_boss := false
		for e in _enemies:
			if e["kind"] == "boss":
				has_boss = true
		if not has_boss and _enemies.is_empty():
			_objective_met = true
	if not _config["boss"] and _kills >= int(_config["target_kills"]):
		_objective_met = true
	if _objective_met and _enemies.is_empty():
		_status = "won"
		_result = {
			"kills": _kills,
			"seconds": int(_elapsed),
			"hp_percent": int(round(_player["hp"] / _player["max_hp"] * 100.0)),
			"spirit_stones": _spirit_stones,
		}
		_show_modal()
		return

	_refresh_hud()
	_arena.queue_redraw()


func _refresh_hud() -> void:
	_hud_objective.text = "%s · %s / %s" % [
		_config["objective"],
		("用时 %ds" % int(_elapsed)) if float(_config["survive"]) > 0.0 else ("击杀 %d/%d" % [_kills, _config["target_kills"]]),
		_profile["method"]["name"]]
	_hud_hp.text = "气血 %d/%d" % [int(ceil(_player["hp"])), int(_player["max_hp"])]
	_hp_fill.size.x = 536.0 * clampf(_player["hp"] / _player["max_hp"], 0.0, 1.0)
	_hud_mana.text = "灵力 %d/%d" % [int(_player["mana"]), 60]
	_mana_fill.size.x = 536.0 * clampf(_player["mana"] / 60.0, 0.0, 1.0)
	if _config["boss"]:
		var boss = null
		for e in _enemies:
			if e["kind"] == "boss":
				boss = e
				break
		if boss != null:
			_hud_boss.text = "%s %d/%d" % [_config["boss_name"], int(ceil(boss["hp"])), int(boss["max_hp"])]
			_boss_fill.size.x = 536.0 * clampf(boss["hp"] / boss["max_hp"], 0.0, 1.0)
		else:
			_hud_boss.text = "%s 已击破" % _config["boss_name"]
			_boss_fill.size.x = 0.0
	_readout.text = "击杀 %d\n用时 %ds" % [_kills, int(_elapsed)]
	# 技能提示与冷却
	var spell: Dictionary = _profile["spell"]
	var ready: bool = _skill_cd <= 0.0 and _player["mana"] >= float(spell["mana_cost"])
	if ready:
		_skill_hint.text = "空格 %s 可用" % _profile["skill_name"]
		_skill_hint.add_theme_color_override("font_color", Color("#9cff83"))
	elif _skill_cd > 0.0:
		_skill_hint.text = "空格 %s %.1fs" % [_profile["skill_name"], _skill_cd]
		_skill_hint.add_theme_color_override("font_color", Color("#f1e1c2"))
	else:
		_skill_hint.text = "空格 %s 灵力不足" % _profile["skill_name"]
	_skill_fill.size.x = 360.0 * (1.0 - clampf(_skill_cd / _skill_max_cd, 0.0, 1.0))
	# 顶部通知
	_notice_label.visible = _notice_timer > 0.0
	if _notice_label.visible:
		_notice_label.text = _notice


## ---------- 战斗逻辑（数值对齐 web） ----------

func _spawn_enemy(kind: String) -> void:
	var side := randi() % 4
	var margin := 74.0 if kind == "boss" else 42.0
	var x := 0.0
	var y := 0.0
	match side:
		0:
			x = margin
			y = randf() * _arena_size.y
		1:
			x = _arena_size.x - margin
			y = randf() * _arena_size.y
		2:
			y = margin
			x = randf() * _arena_size.x
		3:
			y = _arena_size.y - margin
			x = randf() * _arena_size.x
	var hp := float(_config["enemy_hp"]) + minf(18.0, _elapsed * 0.5)
	if kind == "boss":
		hp = float(_config["boss_hp"])
	# 用带属性对象（支持 e.x / e["x"] 一致访问）
	var e := Enemy.new()
	e.x = x
	e.y = y
	e.r = 46.0 if kind == "boss" else 18.0
	e.hp = hp
	e.max_hp = hp
	e.speed = 58.0 if kind == "boss" else float(_config["enemy_speed"]) + minf(22.0, _elapsed * 0.4)
	e.damage = 18 if kind == "boss" else int(_config["enemy_damage"])
	e.kind = kind
	_enemies.append(e)


func _fire_shot(tx: float, ty: float, kind: String) -> void:
	var d := Vector2(tx - _player["x"], ty - _player["y"])
	if d.length() < 1.0:
		d = Vector2(1, 0)
	d = d.normalized()
	var method: Dictionary = _profile["method"]
	var speed := float(method["projectile_speed"]) * (1.9 if kind == "manual" else 1.55)
	var damage: int = int(method["attack_damage"]) if kind != "manual" else maxi(6, int(round(float(method["attack_damage"]) * 0.72)))
	var method_id: String = _profile["method_id"]
	var radius := 8.0 if method_id == "yanxin_jue" else 6.0 if method_id == "jinmang_jue" else 7.0
	var color: Color
	var visual := "orb"
	if method_id == "yanxin_jue":
		color = Color(1, 0.467, 0.216, 0.96)
		visual = "fireball"
	elif method_id == "jinmang_jue":
		color = Color(0.961, 0.835, 0.4, 0.96)
		visual = "goldSlash"
	else:
		color = Color(0.863, 0.933, 1.0, 0.94)
	_projectiles.append({
		"x": _player["x"], "y": _player["y"], "vx": d.x * speed, "vy": d.y * speed,
		"r": radius, "damage": damage, "kind": kind, "life": 1.4, "traveled": 0.0,
		"range": 680.0 if kind == "manual" else 740.0,
		"pierce": 1 if (method_id == "jinmang_jue" and kind != "manual") else 0,
		"hit_ids": {}, "color": color, "spell_id": "",
		"visual": visual, "angle": d.angle(), "scale": 0.76 if kind == "manual" else 0.66,
	})


func _apply_player_damage(amount: int) -> void:
	var final_d: int = maxi(1, int(round(amount - _player["defense"] * 0.45)))
	_player["hp"] -= final_d


func _apply_enemy_hit(e, damage: int, spell_id: String) -> void:
	var reduction := 0.0
	if e.kind == "boss":
		reduction = maxf(0.0, 0.15)
	var final_d: int = maxi(1, int(round(damage * (1.0 - reduction))))
	e.hp -= final_d
	if spell_id == "shuiren":
		e.slow_timer = maxf(e.slow_timer, 2.0)
	if spell_id == "huodan":
		e.burn_timer = maxf(e.burn_timer, 1.8)
		e.burn_dps = maxf(e.burn_dps, 8.0)
	_push_particle(e.x, e.y, e.r + 22.0, Color(1, 0.467, 0.216, 0.5), 0.24, "hitFire")
	if spell_id == "jinmang":
		_push_particle(e.x, e.y, e.r + 20.0, Color(1, 0.906, 0.561, 0.58), 0.18, "goldSlash", randf() * PI)
	else:
		_push_particle(e.x, e.y, 28.0, Color(1, 0.906, 0.561, 0.52), 0.3)


func _push_particle(x: float, y: float, r: float, color: Color, life := 0.45, visual := "ring", angle := 0.0) -> void:
	_particles.append({"x": x, "y": y, "r": r, "life": life, "max_life": life, "color": color, "visual": visual, "angle": angle})


func _nearest_enemy():
	var best := 1e12
	var target = null
	for e in _enemies:
		var score := Vector2(e.x - _player["x"], e.y - _player["y"]).length()
		if score < best:
			best = score
			target = e
	return target


## ---------- 渲染（对齐 web draw()） ----------

func _draw_arena() -> void:
	var rect := Rect2(Vector2.ZERO, _arena_size)
	# 主题底色（mouse 棕 / wish 紫黑）+ 斜网格
	var theme_color := Color(0.129, 0.106, 0.086, 0.46) if str(_config["theme"]) == "mouse" else Color(0.149, 0.098, 0.165, 0.42)
	_arena.draw_rect(rect, theme_color)
	var grid_color := Color(1, 0.925, 0.714, 0.08)
	var x := 0.0
	while x < _arena_size.x:
		_arena.draw_line(Vector2(x, 0), Vector2(x + _arena_size.y * 0.34, _arena_size.y), grid_color, 1.0)
		x += 72.0

	# 弹幕
	for p in _projectiles:
		var alpha := clampf(float(p["life"]) / 0.18, 0.15, 1.0)
		_draw_projectile(p, alpha)

	# 敌人
	for e in _enemies:
		_draw_enemy(e)

	# 玩家（player-combat 立绘 + 光环）
	var player_img: Texture = _fx_cache.get("player")
	if player_img:
		var r: float = _player["r"]
		var w := r * 3.7
		var h := r * 4.1
		var pos := Rect2(_player["x"] - w / 2.0, _player["y"] - h * 0.55, w, h)
		_arena.draw_texture_rect(player_img, pos, false)
	_arena.draw_arc(Vector2(_player["x"], _player["y"]), _player["r"] + 7.0, 0.0, TAU, 32, Color(0.506, 0.89, 1.0, 0.72), 2.0)

	# 粒子
	for pt in _particles:
		var alpha := float(pt["life"]) / float(pt["max_life"])
		var age := float(pt["max_life"]) - float(pt["life"])
		_draw_particle(pt, alpha, age)


func _draw_projectile(p: Dictionary, alpha: float) -> void:
	var visual: String = p["visual"]
	if visual == "fireball":
		var frames: Array = _fx_cache["fireball"]
		if frames.size() > 0 and frames[0]:
			var idx := int(_elapsed * 18.0) % frames.size()
			var img: Texture = frames[idx]
			var size := (86.0 if p["kind"] == "skill" else 70.0) * float(p["scale"])
			_arena.draw_set_transform(Vector2(p["x"], p["y"]), float(p["angle"]), Vector2.ONE)
			_arena.draw_texture_rect(img, Rect2(-size, -size * 0.224, size * 2.0, size * 0.45), false, Color(1, 1, 1, alpha))
			_arena.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
		return
	if visual == "goldSlash":
		var img: Texture = _fx_cache["goldSlash"]
		if img:
			var w := 96.0 if p["kind"] == "skill" else 76.0
			_arena.draw_set_transform(Vector2(p["x"], p["y"]), float(p["angle"]), Vector2.ONE)
			_arena.draw_texture_rect(img, Rect2(-w / 2.0, -w * 0.16, w, w * 0.32), false, Color(1, 1, 1, alpha))
			_arena.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
		return
	# orb：发光圆
	var color: Color = p["color"]
	_arena.draw_circle(Vector2(p["x"], p["y"]), float(p["r"]), Color(color.r, color.g, color.b, color.a * alpha))
	# 敌弹红光
	if p["kind"] == "enemy":
		_arena.draw_circle(Vector2(p["x"], p["y"]), float(p["r"]), Color(1, 0.337, 0.325, 0.9 * alpha))


func _draw_enemy(e) -> void:
	var img: Texture
	if e.kind == "boss":
		img = _fx_cache["boss_mouse"] if str(_config["theme"]) == "mouse" else _fx_cache["minion_wish"]
	else:
		img = _fx_cache["minion_mouse"] if str(_config["theme"]) == "mouse" else _fx_cache["minion_wish"]
	if img:
		var s: float = e.r * 2.7
		_arena.draw_texture_rect(img, Rect2(e.x - s / 2.0, e.y - s / 2.0, s, s), false)
	else:
		_arena.draw_circle(Vector2(e.x, e.y), e.r, Color("#5a2f25") if e.kind == "boss" else Color("#6b5a44"))
	# 头顶血条（黑底 + 红/绿黄）
	var bar_y: float = e.y - e.r - 14.0
	_arena.draw_rect(Rect2(e.x - e.r, bar_y, e.r * 2.0, 5.0), Color(0, 0, 0, 0.68))
	var fill_color := Color("#ff6f5f") if e.kind == "boss" else Color("#d9f28a")
	_arena.draw_rect(Rect2(e.x - e.r, bar_y, e.r * 2.0 * maxf(0.0, e.hp / e.max_hp), 5.0), fill_color)


func _draw_particle(pt: Dictionary, alpha: float, age: float) -> void:
	var visual: String = pt["visual"]
	if visual == "hitFire":
		var frames: Array = _fx_cache["hitFire"]
		if frames.size() > 0 and frames[0]:
			var idx := int(age * 16.0) % frames.size()
			var img: Texture = frames[idx]
			var w: float = float(pt["r"]) * 0.9
			_arena.draw_texture_rect(img, Rect2(float(pt["x"]) - w / 2.0, float(pt["y"]) - float(pt["r"]) * 0.25, w, w * 1.36), false, Color(1, 1, 1, alpha))
		return
	if visual == "goldSlash":
		var img: Texture = _fx_cache["goldSlash"]
		if img:
			var w: float = float(pt["r"]) * 1.5
			_arena.draw_set_transform(Vector2(float(pt["x"]), float(pt["y"])), float(pt["angle"]), Vector2.ONE)
			_arena.draw_texture_rect(img, Rect2(-w / 2.0, -w * 0.16, w, w * 0.32), false, Color(1, 1, 1, alpha))
			_arena.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
		return
	if visual == "fireBurst":
		var frames: Array = _fx_cache["fireBurst"]
		if frames.size() > 0 and frames[0]:
			var idx := int(age * 18.0) % frames.size()
			var img: Texture = frames[idx]
			var size: float = float(pt["r"]) * (1.35 - alpha * 0.1)
			_arena.draw_texture_rect(img, Rect2(float(pt["x"]) - size / 2.0, float(pt["y"]) - size / 2.0, size, size), false, Color(1, 1, 1, minf(0.9, alpha + 0.18)))
		return
	# ring：扩散圆环
	var color: Color = pt["color"]
	_arena.draw_arc(Vector2(float(pt["x"]), float(pt["y"])),
		float(pt["r"]) * (1.15 - alpha * 0.15), 0.0, TAU, 24,
		Color(color.r, color.g, color.b, color.a * alpha), 4.0)


## ---------- 敌人对象（支持 .x 与 ["x"] 双访问） ----------

class Enemy:
	var x := 0.0
	var y := 0.0
	var r := 18.0
	var hp := 0.0
	var max_hp := 0.0
	var speed := 72.0
	var damage := 5
	var attack_cd := 0.0
	var slow_timer := 0.0
	var burn_timer := 0.0
	var burn_dps := 0.0
	var kind := "minion"
	var id := 0

	func _get(property: StringName):
		match property:
			&"x": return x
			&"y": return y
			&"r": return r
			&"hp": return hp
			&"max_hp": return max_hp
			&"speed": return speed
			&"damage": return damage
			&"attack_cd": return attack_cd
			&"slow_timer": return slow_timer
			&"burn_timer": return burn_timer
			&"burn_dps": return burn_dps
			&"kind": return kind
			&"id": return id
		return null

	func _set(property: StringName, value: Variant) -> bool:
		match property:
			&"x": x = value
			&"y": y = value
			&"r": r = value
			&"hp": hp = value
			&"max_hp": max_hp = value
			&"speed": speed = value
			&"damage": damage = value
			&"attack_cd": attack_cd = value
			&"slow_timer": slow_timer = value
			&"burn_timer": burn_timer = value
			&"burn_dps": burn_dps = value
			&"kind": kind = value
			&"id": id = value
			_: return false
		return true
