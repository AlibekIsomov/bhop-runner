extends CanvasLayer

@onready var distance_label: Label = $Margin/VBox/DistanceLabel
@onready var speed_label: Label = $Margin/VBox/SpeedLabel
@onready var best_label: Label = $Margin/VBox/BestLabel

var player: CharacterBody3D = null

func set_player(p: CharacterBody3D) -> void:
	player = p

func _process(_delta: float) -> void:
	if player == null:
		return
	var distance: float = player.get_distance()
	var speed := Vector2(player.velocity.x, player.velocity.z).length()
	SaveData.session_best = max(SaveData.session_best, distance)
	distance_label.text = "Distance: %.1f m" % distance
	speed_label.text = "Speed: %.1f m/s" % speed
	best_label.text = "Session Best: %.1f m" % SaveData.session_best
