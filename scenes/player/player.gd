extends CharacterBody3D

# Source/Quake-style bhop movement. Ground has friction + capped speed,
# air has zero friction and its own (uncapped-by-ground-speed) accelerate,
# which is what lets air-strafing carry you past walk speed.

@export_group("Ground Movement")
@export var ground_speed: float = 7.0
@export var ground_accel: float = 14.0
@export var ground_friction: float = 6.0

@export_group("Air Movement")
@export var air_speed_cap: float = 2.0
@export var air_accelerate: float = 12.0

@export_group("Jump & Gravity")
@export var jump_force: float = 6.5
@export var gravity: float = 20.0
@export var auto_bhop: bool = true # ponytail: holding space auto-hops; set false for manual-timing bhop

@export_group("Camera")
@export var mouse_sensitivity: float = 0.0025
@export var base_fov: float = 75.0
@export var max_fov: float = 90.0
@export var fov_speed_max: float = 20.0

@export_group("Misc")
@export var fall_y_threshold: float = -15.0

signal fell_off_track

@onready var head: Node3D = $Head
@onready var camera: Camera3D = $Head/Camera3D

var _dead: bool = false
var _jump_was_held: bool = false

func _ready() -> void:
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE if Input.mouse_mode == Input.MOUSE_MODE_CAPTURED else Input.MOUSE_MODE_CAPTURED
		return
	if _dead:
		return
	if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		rotate_y(-event.relative.x * mouse_sensitivity)
		head.rotate_x(-event.relative.y * mouse_sensitivity)
		head.rotation.x = clamp(head.rotation.x, deg_to_rad(-89.0), deg_to_rad(89.0))

func _physics_process(delta: float) -> void:
	if _dead:
		return

	if global_position.y < fall_y_threshold:
		_dead = true
		fell_off_track.emit()
		return

	var forward_input := (1.0 if Input.is_key_pressed(KEY_W) else 0.0) - (1.0 if Input.is_key_pressed(KEY_S) else 0.0)
	var right_input := (1.0 if Input.is_key_pressed(KEY_D) else 0.0) - (1.0 if Input.is_key_pressed(KEY_A) else 0.0)
	var input_vec := Vector2(right_input, forward_input)
	if input_vec.length() > 1.0:
		input_vec = input_vec.normalized()

	var forward_dir := -global_transform.basis.z
	var right_dir := global_transform.basis.x
	var wishdir := forward_dir * input_vec.y + right_dir * input_vec.x
	wishdir.y = 0.0
	if wishdir.length() > 0.0001:
		wishdir = wishdir.normalized()

	var desired_speed := input_vec.length() * ground_speed
	var jump_held := Input.is_key_pressed(KEY_SPACE)

	if is_on_floor():
		_apply_friction(delta)
		_accelerate(wishdir, desired_speed, ground_accel, delta)
		var should_jump := jump_held if auto_bhop else (jump_held and not _jump_was_held)
		if should_jump:
			velocity.y = jump_force
		else:
			velocity.y = -1.0 # small stick-to-floor value; horizontal velocity is never touched here
	else:
		velocity.y -= gravity * delta
		var wishspeed: float = min(desired_speed, air_speed_cap)
		_accelerate(wishdir, wishspeed, air_accelerate, delta)

	_jump_was_held = jump_held

	move_and_slide()
	_update_fov()

func _apply_friction(delta: float) -> void:
	var speed := Vector2(velocity.x, velocity.z).length()
	if speed < 0.001:
		velocity.x = 0.0
		velocity.z = 0.0
		return
	var drop := speed * ground_friction * delta
	var new_speed: float = max(speed - drop, 0.0)
	var scale: float = new_speed / speed
	velocity.x *= scale
	velocity.z *= scale

# Classic Source/Quake accelerate: clamps how much speed can be added
# this frame toward wishdir, capped by wishspeed.
func _accelerate(wishdir: Vector3, wishspeed: float, accel: float, delta: float) -> void:
	var current_speed := velocity.dot(wishdir)
	var add_speed := wishspeed - current_speed
	if add_speed <= 0.0:
		return
	var accel_speed: float = min(accel * wishspeed * delta, add_speed)
	velocity.x += accel_speed * wishdir.x
	velocity.z += accel_speed * wishdir.z

func _update_fov() -> void:
	var speed := Vector2(velocity.x, velocity.z).length()
	var t: float = clamp(speed / fov_speed_max, 0.0, 1.0)
	camera.fov = lerp(base_fov, max_fov, t)

func get_distance() -> float:
	return -global_position.z
