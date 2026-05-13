import os
import time
from typing import Any

from flask import Flask, jsonify, request

from ai_generator import EXAMPLE_PROMPTS, generate_initial_universe, generate_node_expansion
from graph_logic import GraphStore

app = Flask(__name__)
store = GraphStore()

# Simple in-memory rate limiting: IP -> last request timestamp
_rate_limit: dict[str, float] = {}
RATE_LIMIT_SECONDS = 2

# Session TTL cleanup
SESSION_TTL_SECONDS = 3600  # 1 hour


def _cleanup_expired_sessions() -> None:
    now = time.time()
    expired = [sid for sid, sess in store.sessions.items() if now - sess.created_at > SESSION_TTL_SECONDS]
    for sid in expired:
        del store.sessions[sid]


@app.get("/api/health")
def health() -> Any:
    return jsonify({"ok": True})


@app.get("/api/prompts/examples")
def prompt_examples() -> Any:
    return jsonify(EXAMPLE_PROMPTS)


@app.post("/api/graph/start")
def start_graph() -> Any:
    try:
        payload = request.get_json() or {}
    except Exception as exc:
        app.logger.warning("Failed to parse JSON in /api/graph/start: %s", exc)
        return jsonify({"error": "Invalid JSON"}), 400
    question = str(payload.get("question", "")).strip()
    if not question:
        return jsonify({"error": "Question is required."}), 400

    session_id = store.create_session(question)
    generated = generate_initial_universe(question)

    store.add_concepts(session_id, "root", generated.get("concepts", []))
    store.set_curiosity_path(session_id, generated.get("learning_path", []))
    store.set_deeper_questions(session_id, generated.get("deeper_questions", []))

    return jsonify({"session_id": session_id, "graph": store.serialize(session_id)})


@app.post("/api/graph/expand")
def expand_node() -> Any:
    _cleanup_expired_sessions()

    ip = request.remote_addr or ""
    now = time.time()
    if ip in _rate_limit and now - _rate_limit[ip] < RATE_LIMIT_SECONDS:
        return jsonify({"error": "Too many requests. Please wait before expanding again."}), 429
    _rate_limit[ip] = now

    try:
        payload = request.get_json() or {}
    except Exception as exc:
        app.logger.warning("Failed to parse JSON in /api/graph/expand: %s", exc)
        return jsonify({"error": "Invalid JSON"}), 400
    session_id = str(payload.get("session_id", "")).strip()
    node_id = str(payload.get("node_id", "")).strip()

    if not session_id or not node_id:
        return jsonify({"error": "session_id and node_id are required."}), 400

    session = store.get_session(session_id)
    if session is None:
        return jsonify({"error": "Session not found."}), 404

    node = session.nodes.get(node_id)
    if node is None:
        return jsonify({"error": "Node not found."}), 404

    generated = generate_node_expansion(session.question, node.label)
    store.add_concepts(session_id, node_id, generated.get("concepts", []))

    return jsonify({"session_id": session_id, "graph": store.serialize(session_id)})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=True)
