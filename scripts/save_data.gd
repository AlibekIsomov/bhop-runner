extends Node

# ponytail: single-slot high score, ConfigFile is plenty for one float

const SAVE_PATH := "user://highscore.save"

var all_time_high: float = 0.0
var session_best: float = 0.0

func _ready() -> void:
	_load()

func _load() -> void:
	var cfg := ConfigFile.new()
	if cfg.load(SAVE_PATH) == OK:
		all_time_high = cfg.get_value("scores", "high_score", 0.0)

func _save() -> void:
	var cfg := ConfigFile.new()
	cfg.set_value("scores", "high_score", all_time_high)
	cfg.save(SAVE_PATH)

## Records a finished run. Returns true if it beat the all-time high.
func report_run(distance: float) -> bool:
	session_best = max(session_best, distance)

	# Submit score to online backend leaderboard if user is logged in
	if AuthManager.is_logged_in:
		LeaderboardManager.submit_score(distance)

	if distance > all_time_high:
		all_time_high = distance
		_save()
		return true
	return false

