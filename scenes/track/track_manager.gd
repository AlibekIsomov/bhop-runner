extends Node3D

const SEGMENT_LENGTH := 40.0

@export var spawn_ahead: float = 120.0
@export var despawn_behind: float = 40.0

# difficulty: 1 = easy, 2 = medium, 3 = hard. Weighted pick below shifts
# toward higher difficulty as distance grows (roughly every 200m).
const SEGMENTS := [
	{"scene": preload("res://scenes/track/segments/segment_flat.tscn"), "difficulty": 1},
	{"scene": preload("res://scenes/track/segments/segment_stairs.tscn"), "difficulty": 1},
	{"scene": preload("res://scenes/track/segments/segment_gap_medium.tscn"), "difficulty": 2},
	{"scene": preload("res://scenes/track/segments/segment_platforms.tscn"), "difficulty": 2},
	{"scene": preload("res://scenes/track/segments/segment_gap_wide.tscn"), "difficulty": 3},
]

var player: Node3D = null
var next_spawn_z: float = 0.0
var active_segments: Array = []
var _started: bool = false
var _first_spawn: bool = true

func start(p: Node3D) -> void:
	player = p
	_started = true
	_update_spawn()

func _process(_delta: float) -> void:
	if not _started:
		return
	_update_spawn()
	_update_despawn()

func _update_spawn() -> void:
	while next_spawn_z > player.global_position.z - spawn_ahead:
		_spawn_segment()

func _spawn_segment() -> void:
	var scene: PackedScene
	if _first_spawn:
		scene = SEGMENTS[0]["scene"] # always start on the flat segment
		_first_spawn = false
	else:
		scene = _pick_weighted(-next_spawn_z)
	var inst := scene.instantiate() as Node3D
	inst.position.z = next_spawn_z
	add_child(inst)
	active_segments.append(inst)
	next_spawn_z -= SEGMENT_LENGTH

func _update_despawn() -> void:
	for seg in active_segments.duplicate():
		if seg.position.z - player.global_position.z > despawn_behind:
			active_segments.erase(seg)
			seg.queue_free()

func _pick_weighted(distance: float) -> PackedScene:
	var tier: int = clamp(int(distance / 200.0), 0, 2)
	var weights: Array = []
	var total := 0.0
	for entry in SEGMENTS:
		var w: float = _weight_for(entry["difficulty"], tier)
		weights.append(w)
		total += w
	var r := randf() * total
	var acc := 0.0
	for i in SEGMENTS.size():
		acc += weights[i]
		if r <= acc:
			return SEGMENTS[i]["scene"]
	return SEGMENTS[-1]["scene"]

func _weight_for(difficulty: int, tier: int) -> float:
	var preferred := tier + 1
	var dist: int = abs(difficulty - preferred)
	if dist == 0:
		return 3.0
	elif dist == 1:
		return 1.0
	else:
		return 0.3
