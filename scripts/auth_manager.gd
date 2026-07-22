extends Node

# Signal emitted when login state changes
signal login_status_changed(is_logged_in: bool, username: String)

const SESSION_FILE := "user://session.json"
const SERVER_URL := "http://localhost:3000"
const LOCAL_PORT := 8989

var is_logged_in: bool = false
var auth_token: String = ""
var username: String = ""
var avatar_url: String = ""

var _tcp_server: TCPServer

func _ready() -> void:
	load_session()

func _process(_delta: float) -> void:
	# Poll for incoming OAuth redirect on local TCP server
	if _tcp_server and _tcp_server.is_connection_available():
		var peer: StreamPeerTCP = _tcp_server.take_connection()
		if peer:
			_handle_http_client_callback(peer)

func load_session() -> void:
	if not FileAccess.file_exists(SESSION_FILE):
		return

	var file := FileAccess.open(SESSION_FILE, FileAccess.READ)
	if not file:
		return

	var json_str := file.get_as_text()
	var json = JSON.parse_string(json_str)
	if json is Dictionary:
		auth_token = json.get("token", "")
		username = json.get("username", "")
		avatar_url = json.get("avatar_url", "")
		if not auth_token.is_empty():
			is_logged_in = true
			emit_signal("login_status_changed", true, username)
			verify_token()

func save_session(token: String, uname: String, avatar: String = "") -> void:
	auth_token = token
	username = uname
	avatar_url = avatar
	is_logged_in = true

	var data := {
		"token": auth_token,
		"username": username,
		"avatar_url": avatar_url
	}

	var file := FileAccess.open(SESSION_FILE, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(data))

	emit_signal("login_status_changed", true, username)

func logout() -> void:
	auth_token = ""
	username = ""
	avatar_url = ""
	is_logged_in = false
	if FileAccess.file_exists(SESSION_FILE):
		DirAccess.remove_absolute(SESSION_FILE)
	emit_signal("login_status_changed", false, "")

## Dev/Guest Login for instant testing without OAuth setup
func dev_login(player_name: String) -> void:
	var http := HTTPRequest.new()
	add_child(http)
	http.request_completed.connect(func(_result, response_code, _headers, body):
		if response_code == 200:
			var json = JSON.parse_string(body.get_string_from_utf8())
			if json is Dictionary and json.has("token"):
				var token = json["token"]
				var user_dict = json.get("user", {})
				save_session(token, user_dict.get("username", player_name), user_dict.get("avatar_url", ""))
		http.queue_free()
	)

	var headers = ["Content-Type: application/json"]
	var body = JSON.stringify({"username": player_name})
	http.request(SERVER_URL + "/auth/dev-login", headers, HTTPClient.METHOD_POST, body)

## Start Google OAuth2 Login flow via system browser
func start_google_login() -> void:
	stop_local_server()
	_tcp_server = TCPServer.new()
	var err = _tcp_server.listen(LOCAL_PORT)
	if err != OK:
		push_error("Could not start local HTTP listener on port %d" % LOCAL_PORT)
		return

	var auth_url = SERVER_URL + "/auth/google?godot_port=" + str(LOCAL_PORT)
	OS.shell_open(auth_url)

func stop_local_server() -> void:
	if _tcp_server:
		_tcp_server.stop()
		_tcp_server = null

func _handle_http_client_callback(peer: StreamPeerTCP) -> void:
	# Read HTTP request sent by browser
	var req_text := ""
	while peer.get_status() == StreamPeerTCP.STATUS_CONNECTED and peer.get_available_bytes() > 0:
		req_text += peer.get_utf8_string(peer.get_available_bytes())
		OS.delay_msec(10)

	if "GET /callback" in req_text:
		# Extract query params
		var token := ""
		var uname := ""

		if "token=" in req_text:
			var token_start = req_text.find("token=") + 6
			var token_end = req_text.find("&", token_start)
			if token_end == -1:
				token_end = req_text.find(" ", token_start)
			token = req_text.substr(token_start, token_end - token_start).uri_decode()

		if "username=" in req_text:
			var uname_start = req_text.find("username=") + 9
			var uname_end = req_text.find("&", uname_start)
			if uname_end == -1:
				uname_end = req_text.find(" ", uname_start)
			uname = req_text.substr(uname_start, uname_end - uname_start).uri_decode()

		if not token.is_empty():
			save_session(token, uname)

		# Send HTTP 200 response to browser
		var html_resp = "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nConnection: close\r\n\r\n<html><body><h2>Logged in! Return to Bhop Runner.</h2></body></html>"
		peer.put_data(html_resp.to_utf8_buffer())

	peer.disconnect_from_host()
	stop_local_server()

func verify_token() -> void:
	if auth_token.is_empty():
		return

	var http := HTTPRequest.new()
	add_child(http)
	http.request_completed.connect(func(_res, code, _h, body):
		if code != 200:
			logout()
		else:
			var json = JSON.parse_string(body.get_string_from_utf8())
			if json is Dictionary and json.has("user"):
				var u = json["user"]
				username = u.get("username", username)
				avatar_url = u.get("avatar_url", avatar_url)
		http.queue_free()
	)
	var headers = ["Authorization: Bearer " + auth_token]
	http.request(SERVER_URL + "/auth/me", headers, HTTPClient.METHOD_GET)
