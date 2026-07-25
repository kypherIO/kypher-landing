#!/usr/bin/env python3
"""
Optional feedback API for Bible Bot — SQLite, standard library only.

Turn this on only if you want suggestions stored on the server instead of
going out through the mailto: link in the footer. It uses SQLite (a single
file, no daemon, no memory overhead) rather than Postgres/MySQL, which
would be a poor trade on a 1 GB box.

Endpoints
  POST /api/feedback   {"message": "...", "email": "optional"}
  GET  /api/feedback   (localhost only) — read submissions back

Install: see README.md in this directory.
"""
import json
import os
import re
import sqlite3
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

DB_PATH = os.environ.get("FEEDBACK_DB", "/var/lib/biblebot/feedback.db")
HOST = os.environ.get("FEEDBACK_HOST", "127.0.0.1")
PORT = int(os.environ.get("FEEDBACK_PORT", "8081"))

MAX_MESSAGE = 4000
MAX_EMAIL = 254
RATE_LIMIT_SECONDS = 20  # per IP, between submissions

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
_last_seen: dict[str, float] = {}


def init_db() -> None:
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    with sqlite3.connect(DB_PATH) as db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS feedback (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT    NOT NULL DEFAULT (datetime('now')),
                message    TEXT    NOT NULL,
                email      TEXT,
                user_agent TEXT
            )
        """)
        db.execute("CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at)")


class Handler(BaseHTTPRequestHandler):
    server_version = "BibleBotFeedback/1.0"

    def _json(self, code: int, payload: dict) -> None:
        body = json.dumps(payload).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self) -> None:
        if self.path.rstrip("/") != "/api/feedback":
            return self._json(404, {"error": "not found"})

        # Caddy passes the real client IP through this header.
        ip = self.headers.get("X-Forwarded-For", self.client_address[0]).split(",")[0].strip()
        now = time.time()
        if now - _last_seen.get(ip, 0) < RATE_LIMIT_SECONDS:
            return self._json(429, {"error": "Please wait a moment before sending again."})

        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > 16_384:
                return self._json(400, {"error": "bad request"})
            data = json.loads(self.rfile.read(length))
        except (ValueError, json.JSONDecodeError):
            return self._json(400, {"error": "invalid JSON"})

        message = (data.get("message") or "").strip()
        email = (data.get("email") or "").strip()

        if not message:
            return self._json(400, {"error": "Message is required."})
        if len(message) > MAX_MESSAGE:
            return self._json(400, {"error": f"Message must be under {MAX_MESSAGE} characters."})
        if email and (len(email) > MAX_EMAIL or not EMAIL_RE.match(email)):
            return self._json(400, {"error": "That email address doesn't look right."})

        with sqlite3.connect(DB_PATH) as db:
            db.execute(
                "INSERT INTO feedback (message, email, user_agent) VALUES (?, ?, ?)",
                (message, email or None, self.headers.get("User-Agent", "")[:500]),
            )
        _last_seen[ip] = now
        self._json(201, {"ok": True})

    def do_GET(self) -> None:
        if self.path.rstrip("/") != "/api/feedback":
            return self._json(404, {"error": "not found"})
        # Read access is loopback-only; Caddy never proxies GET here.
        if self.client_address[0] not in ("127.0.0.1", "::1"):
            return self._json(403, {"error": "forbidden"})
        with sqlite3.connect(DB_PATH) as db:
            rows = db.execute(
                "SELECT id, created_at, message, email FROM feedback ORDER BY id DESC LIMIT 200"
            ).fetchall()
        self._json(200, {"count": len(rows), "items": [
            {"id": r[0], "created_at": r[1], "message": r[2], "email": r[3]} for r in rows
        ]})

    def log_message(self, fmt, *args):
        pass  # journald already records what we need via the unit


if __name__ == "__main__":
    init_db()
    print(f"feedback api on http://{HOST}:{PORT} (db: {DB_PATH})", flush=True)
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
