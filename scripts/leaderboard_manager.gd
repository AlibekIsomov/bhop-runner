extends Node

signal leaderboard_loaded(scores: Array)
signal score_submitted(result: Dictionary)

const SERVER_URL := "http://localhost:3000"

func fetch_leaderboard(limit: int = 50) -> void:
	var http := HTTPRequest.new()
	add_child(http)
	http.request_completed.connect(func(_result, response_code, _headers, body):
		if response_code == 200:
			var json = JSON.parse_string(body.get_string_from_utf8())
			if json is Dictionary and json.has("leaderboard"):
				emit_signal("leaderboard_loaded", json["leaderboard"])
		else:
			emit_signal("leaderboard_loaded", [])
		http.queue_free()
	)
	http.request(SERVER_URL + "/api/leaderboard?limit=" + str(limit), [], HTTPClient.METHOD_GET)

func submit_score(score: float) -> void:
	if not AuthManager.is_logged_in or AuthManager.auth_token.is_empty():
		push_warning("Cannot submit score: User is not logged in")
		return

	var http := HTTPRequest.new()
	add_child(http)
	http.request_completed.connect(func(_result, response_code, _headers, body):
		if response_code == 200:
			var json = JSON.parse_string(body.get_string_from_utf8())
			if json is Dictionary:
				emit_signal("score_submitted", json)
				# Refresh leaderboard after submitting new score
				fetch_leaderboard()
		http.queue_free()
	)

	var headers = [
		"Content-Type: application/json",
		"Authorization: Bearer " + AuthManager.auth_token
	]
	var payload = JSON.stringify({"score": score})
	http.request(SERVER_URL + "/api/scores", headers, HTTPClient.METHOD_POST, payload)
