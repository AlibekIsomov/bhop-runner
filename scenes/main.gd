extends Node3D

@onready var player: CharacterBody3D = $Player
@onready var track_manager = $TrackManager
@onready var hud = $HUD
@onready var game_over_ui = $GameOver
@onready var leaderboard_ui = $LeaderboardUI

func _ready() -> void:
	player.fell_off_track.connect(_on_player_fell)
	game_over_ui.open_leaderboard_requested.connect(_on_open_leaderboard)
	track_manager.start(player)
	hud.set_player(player)

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed:
		if event.keycode == KEY_L or event.keycode == KEY_TAB:
			if leaderboard_ui.visible:
				leaderboard_ui.hide_leaderboard()
			else:
				_on_open_leaderboard()

func _on_player_fell() -> void:
	var distance: float = player.get_distance()
	var is_new_high := SaveData.report_run(distance)
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	game_over_ui.show_results(distance, is_new_high)

func _on_open_leaderboard() -> void:
	leaderboard_ui.show_leaderboard()
