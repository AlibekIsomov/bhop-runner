extends CanvasLayer

@onready var status_label: Label = $Control/PanelContainer/VBoxContainer/Header/StatusLabel
@onready var google_login_btn: Button = $Control/PanelContainer/VBoxContainer/AuthContainer/GoogleLoginBtn
@onready var dev_login_btn: Button = $Control/PanelContainer/VBoxContainer/AuthContainer/DevLoginBtn
@onready var dev_name_input: LineEdit = $Control/PanelContainer/VBoxContainer/AuthContainer/DevNameInput
@onready var logout_btn: Button = $Control/PanelContainer/VBoxContainer/AuthContainer/LogoutBtn
@onready var close_btn: Button = $Control/PanelContainer/VBoxContainer/Header/CloseBtn
@onready var scores_vbox: VBoxContainer = $Control/PanelContainer/VBoxContainer/ScrollContainer/ScoresVBox

func _ready() -> void:
	visible = false
	AuthManager.login_status_changed.connect(_on_login_status_changed)
	LeaderboardManager.leaderboard_loaded.connect(_on_leaderboard_loaded)
	update_auth_ui()

func _input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel") and visible:
		hide_leaderboard()

func show_leaderboard() -> void:
	visible = true
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	update_auth_ui()
	LeaderboardManager.fetch_leaderboard()

func hide_leaderboard() -> void:
	visible = false

func update_auth_ui() -> void:
	if AuthManager.is_logged_in:
		status_label.text = "Kirilgan: %s" % AuthManager.username
		google_login_btn.visible = false
		dev_login_btn.visible = false
		dev_name_input.visible = false
		logout_btn.visible = true
	else:
		status_label.text = "Tizimga kirilmagan"
		google_login_btn.visible = true
		dev_login_btn.visible = true
		dev_name_input.visible = true
		logout_btn.visible = false

func _on_login_status_changed(is_logged_in: bool, username: String) -> void:
	update_auth_ui()
	if is_logged_in:
		LeaderboardManager.fetch_leaderboard()

func _on_leaderboard_loaded(scores: Array) -> void:
	# Clear previous list
	for child in scores_vbox.get_children():
		child.queue_free()

	if scores.is_empty():
		var empty_lbl = Label.new()
		empty_lbl.text = "Hozircha rekordlar mavjud emas."
		empty_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		scores_vbox.add_child(empty_lbl)
		return

	# Add Header Row
	var header_hbox = HBoxContainer.new()
	var r_hdr = Label.new()
	r_hdr.text = "#"
	r_hdr.custom_minimum_size.x = 40
	var u_hdr = Label.new()
	u_hdr.text = "O'yinchi"
	u_hdr.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var s_hdr = Label.new()
	s_hdr.text = "Rekord (m)"
	s_hdr.custom_minimum_size.x = 100
	s_hdr.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT

	header_hbox.add_child(r_hdr)
	header_hbox.add_child(u_hdr)
	header_hbox.add_child(s_hdr)
	scores_vbox.add_child(header_hbox)

	var sep = HSeparator.new()
	scores_vbox.add_child(sep)

	# Populate Scores
	for entry in scores:
		var hbox = HBoxContainer.new()

		var rank_lbl = Label.new()
		rank_lbl.text = str(entry.get("rank", "-"))
		rank_lbl.custom_minimum_size.x = 40

		var user_lbl = Label.new()
		user_lbl.text = str(entry.get("username", "Anon"))
		user_lbl.size_flags_horizontal = Control.SIZE_EXPAND_FILL

		var score_lbl = Label.new()
		score_lbl.text = "%.1f m" % float(entry.get("score", 0.0))
		score_lbl.custom_minimum_size.x = 100
		score_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT

		if entry.get("username") == AuthManager.username:
			user_lbl.modulate = Color(0.3, 0.9, 0.3)
			score_lbl.modulate = Color(0.3, 0.9, 0.3)

		hbox.add_child(rank_lbl)
		hbox.add_child(user_lbl)
		hbox.add_child(score_lbl)

		scores_vbox.add_child(hbox)

func _on_google_login_btn_pressed() -> void:
	AuthManager.start_google_login()

func _on_dev_login_btn_pressed() -> void:
	var name_text = dev_name_input.text.trim_prefix(" ").trim_suffix(" ")
	if name_text.is_empty():
		name_text = "Player_" + str(randi_range(100, 999))
	AuthManager.dev_login(name_text)

func _on_logout_btn_pressed() -> void:
	AuthManager.logout()

func _on_close_btn_pressed() -> void:
	hide_leaderboard()
