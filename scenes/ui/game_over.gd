extends CanvasLayer

signal open_leaderboard_requested

@onready var distance_label: Label = $Control/CenterContainer/VBox/DistanceLabel
@onready var high_score_label: Label = $Control/CenterContainer/VBox/HighScoreLabel

func show_results(distance: float, is_new_high: bool) -> void:
	visible = true
	distance_label.text = "Distance: %.1f m" % distance
	if is_new_high:
		high_score_label.text = "NEW HIGH SCORE!"
	else:
		high_score_label.text = "Best: %.1f m" % SaveData.all_time_high

func _on_restart_button_pressed() -> void:
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	get_tree().reload_current_scene()

func _on_leaderboard_button_pressed() -> void:
	emit_signal("open_leaderboard_requested")
