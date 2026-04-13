from __future__ import annotations

import json
import os
import socketserver
import webbrowser
from http.cookies import SimpleCookie
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler
from importlib import resources
from pathlib import Path
from urllib.parse import parse_qs

from .exporter import build_export_bundle
from .openai_client import DEFAULT_ROADMAP, generate_node_build, generate_roadmap, polish_node, synthesize_node_output


ACCESS_COOKIE = "strenaysis_access"
ACCESS_CODE = "2825628257282931"


class AppHandler(SimpleHTTPRequestHandler):
    web_root: Path

    def __init__(self, *args, directory: str | None = None, **kwargs) -> None:
        super().__init__(*args, directory=str(self.web_root), **kwargs)

    def do_GET(self) -> None:  # noqa: N802
        if not self._is_authenticated():
            self._serve_unlock_page()
            return
        if self.path in {"", "/"}:
            self.path = "/index.html"
        super().do_GET()

    def do_POST(self) -> None:  # noqa: N802
        if self.path == "/unlock":
            self._handle_unlock()
            return
        if not self._is_authenticated():
            self._send_json({"error": "Authentication required."}, status=HTTPStatus.UNAUTHORIZED)
            return
        if self.path == "/api/roadmap":
            self._handle_generate_roadmap()
            return
        if self.path == "/api/polish-node":
            self._handle_polish_node()
            return
        if self.path == "/api/node-build":
            self._handle_node_build()
            return
        if self.path == "/api/node-output":
            self._handle_node_output()
            return
        if self.path == "/api/export":
            self._handle_export()
            return
        self.send_error(HTTPStatus.NOT_FOUND, "Unknown endpoint")

    def _handle_generate_roadmap(self) -> None:
        content_length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(content_length)
        try:
            body = json.loads(raw_body.decode("utf-8"))
        except json.JSONDecodeError:
            self._send_json({"error": "Invalid JSON body."}, status=HTTPStatus.BAD_REQUEST)
            return

        problem = str(body.get("problem", "")).strip()
        problem_details = str(body.get("problem_details", "")).strip()
        problem_type = str(body.get("problem_type", "")).strip() or None
        if not problem:
            self._send_json({"error": "Problem to Solve is required."}, status=HTTPStatus.BAD_REQUEST)
            return

        result = generate_roadmap(problem, problem_details, problem_type)
        self._send_json({
            "problem": problem,
            "problem_details": problem_details,
            "roadmap": result.roadmap or [item.copy() for item in DEFAULT_ROADMAP],
            "source": result.source,
            "problem_type": result.problem_type,
            "inferred_problem_type": result.inferred_problem_type,
            "assessment_title": result.assessment_title,
            "assessment_recap": result.assessment_recap,
        })

    def _handle_polish_node(self) -> None:
        content_length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(content_length)
        try:
            body = json.loads(raw_body.decode("utf-8"))
        except json.JSONDecodeError:
            self._send_json({"error": "Invalid JSON body."}, status=HTTPStatus.BAD_REQUEST)
            return

        problem = str(body.get("problem", "")).strip()
        problem_details = str(body.get("problem_details", "")).strip()
        draft = str(body.get("draft", "")).strip()
        if not draft:
            self._send_json({"error": "A draft node description is required."}, status=HTTPStatus.BAD_REQUEST)
            return

        polished = polish_node(problem, problem_details, draft)
        self._send_json(polished)

    def _handle_node_build(self) -> None:
        content_length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(content_length)
        try:
            body = json.loads(raw_body.decode("utf-8"))
        except json.JSONDecodeError:
            self._send_json({"error": "Invalid JSON body."}, status=HTTPStatus.BAD_REQUEST)
            return

        problem = str(body.get("problem", "")).strip()
        problem_details = str(body.get("problem_details", "")).strip()
        problem_type = str(body.get("problem_type", "")).strip()
        node_title = str(body.get("node_title", "")).strip()
        node_why = str(body.get("node_why", "")).strip()
        node_breakdown = str(body.get("node_breakdown", "")).strip()
        if not problem or not node_title:
            self._send_json({"error": "Problem and node title are required."}, status=HTTPStatus.BAD_REQUEST)
            return

        scaffold = generate_node_build(
            problem=problem,
            problem_details=problem_details,
            problem_type=problem_type,
            node_title=node_title,
            node_why=node_why,
            node_breakdown=node_breakdown,
        )
        self._send_json(scaffold)

    def _handle_node_output(self) -> None:
        content_length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(content_length)
        try:
            body = json.loads(raw_body.decode("utf-8"))
        except json.JSONDecodeError:
            self._send_json({"error": "Invalid JSON body."}, status=HTTPStatus.BAD_REQUEST)
            return

        problem = str(body.get("problem", "")).strip()
        node_title = str(body.get("node_title", "")).strip()
        if not problem or not node_title:
            self._send_json({"error": "Problem and node title are required."}, status=HTTPStatus.BAD_REQUEST)
            return

        result = synthesize_node_output(
            problem=problem,
            problem_details=str(body.get("problem_details", "")).strip(),
            node_title=node_title,
            node_description=str(body.get("node_description", "")).strip(),
            node_breakdown=str(body.get("node_breakdown", "")).strip(),
            key_question=str(body.get("key_question", "")).strip(),
            extracted_context=str(body.get("extracted_context", "")).strip(),
            execution_items=body.get("execution_items", []) if isinstance(body.get("execution_items", []), list) else [],
        )
        self._send_json(result)

    def _handle_export(self) -> None:
        content_length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(content_length)
        try:
            body = json.loads(raw_body.decode("utf-8"))
        except json.JSONDecodeError:
            self._send_json({"error": "Invalid JSON body."}, status=HTTPStatus.BAD_REQUEST)
            return

        export_format = str(body.get("format", "")).strip().lower()
        if export_format not in {"docx", "pptx"}:
            self._send_json({"error": "Export format must be docx or pptx."}, status=HTTPStatus.BAD_REQUEST)
            return

        try:
            payload, filename, content_type = build_export_bundle(body, export_format)
        except Exception:
            self._send_json({"error": "Unable to generate the export file."}, status=HTTPStatus.INTERNAL_SERVER_ERROR)
            return

        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def _send_json(self, payload: dict, status: HTTPStatus = HTTPStatus.OK) -> None:
        encoded = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def end_headers(self) -> None:
        if self.path in {"/", "/index.html", "/app.js", "/styles.css"}:
            self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
            self.send_header("Pragma", "no-cache")
            self.send_header("Expires", "0")
        super().end_headers()

    def _is_authenticated(self) -> bool:
        raw_cookie = self.headers.get("Cookie", "")
        if not raw_cookie:
            return False
        cookie = SimpleCookie()
        cookie.load(raw_cookie)
        return cookie.get(ACCESS_COOKIE) is not None and cookie[ACCESS_COOKIE].value == ACCESS_CODE

    def _handle_unlock(self) -> None:
        content_length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(content_length).decode("utf-8")
        fields = parse_qs(raw_body)
        passcode = (fields.get("passcode") or [""])[0].strip()
        if passcode != ACCESS_CODE:
            self._serve_unlock_page(error="Incorrect passcode. Please try again.", status=HTTPStatus.UNAUTHORIZED)
            return

        self.send_response(HTTPStatus.SEE_OTHER)
        self.send_header("Location", "/")
        self.send_header("Set-Cookie", f"{ACCESS_COOKIE}={ACCESS_CODE}; Path=/; HttpOnly; SameSite=Lax")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()

    def _serve_unlock_page(
        self,
        error: str = "",
        status: HTTPStatus = HTTPStatus.OK,
    ) -> None:
        error_html = (
            f'<div class="unlock-error">{self._escape_html(error)}</div>'
            if error
            else '<div class="unlock-helper">Enter the passcode to open the Strenaysis workspace.</div>'
        )
        html = f"""<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Unlock Strenaysis</title>
    <style>
      :root {{
        color-scheme: light;
        --bg: #eff4fb;
        --panel: rgba(255, 255, 255, 0.96);
        --border: rgba(34, 87, 122, 0.14);
        --text: #1b2430;
        --muted: #657486;
        --primary: #22577a;
        --primary-dark: #17384f;
        --danger: #9f2d2d;
        --danger-bg: #fce8e8;
        --shadow: 0 20px 48px rgba(24, 45, 66, 0.12);
      }}
      * {{ box-sizing: border-box; }}
      body {{
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        font-family: "Segoe UI", "Inter", "Helvetica Neue", Arial, sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at top left, rgba(238, 244, 250, 0.95), transparent 32%),
          radial-gradient(circle at bottom right, rgba(208, 220, 232, 0.34), transparent 24%),
          linear-gradient(180deg, #f7f9fc, #eaf0f7 62%, #e5ebf4);
      }}
      .unlock-shell {{
        width: min(100%, 460px);
        padding: 34px 32px 28px;
        border-radius: 24px;
        border: 1px solid var(--border);
        background: var(--panel);
        box-shadow: var(--shadow);
      }}
      .unlock-eyebrow {{
        margin: 0 0 10px;
        font-size: 0.82rem;
        font-weight: 800;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--primary);
      }}
      h1 {{
        margin: 0 0 12px;
        font-size: 2rem;
        line-height: 1.1;
        color: var(--primary-dark);
      }}
      .unlock-copy {{
        margin: 0 0 22px;
        color: var(--muted);
        line-height: 1.6;
      }}
      .unlock-helper,
      .unlock-error {{
        margin-bottom: 16px;
        padding: 12px 14px;
        border-radius: 14px;
        font-size: 0.96rem;
      }}
      .unlock-helper {{
        border: 1px solid var(--border);
        background: #f6f9fc;
        color: var(--muted);
      }}
      .unlock-error {{
        border: 1px solid rgba(159, 45, 45, 0.18);
        background: var(--danger-bg);
        color: var(--danger);
      }}
      label {{
        display: block;
        margin-bottom: 10px;
        font-size: 0.88rem;
        font-weight: 700;
        color: var(--primary-dark);
      }}
      input {{
        width: 100%;
        padding: 14px 16px;
        border-radius: 14px;
        border: 1px solid rgba(34, 87, 122, 0.16);
        background: #fff;
        font-size: 1rem;
        color: var(--text);
        outline: none;
      }}
      input:focus {{
        border-color: rgba(34, 87, 122, 0.4);
        box-shadow: 0 0 0 4px rgba(34, 87, 122, 0.08);
      }}
      button {{
        width: 100%;
        margin-top: 18px;
        padding: 14px 16px;
        border: none;
        border-radius: 999px;
        background: linear-gradient(135deg, #22577a, #17384f);
        color: #fff;
        font-size: 1rem;
        font-weight: 700;
        cursor: pointer;
      }}
      button:hover {{
        filter: brightness(1.02);
      }}
    </style>
  </head>
  <body>
    <main class="unlock-shell">
      <p class="unlock-eyebrow">Protected Workspace</p>
      <h1>Unlock Strenaysis</h1>
      <p class="unlock-copy">This shared environment is currently gated with a simple passcode before launch.</p>
      {error_html}
      <form method="post" action="/unlock">
        <label for="passcode">Passcode</label>
        <input id="passcode" name="passcode" type="password" autocomplete="current-password" autofocus />
        <button type="submit">Open Workspace</button>
      </form>
    </main>
  </body>
</html>"""
        encoded = html.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    @staticmethod
    def _escape_html(value: str) -> str:
        return (
            str(value)
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;")
            .replace("'", "&#x27;")
        )

    def log_message(self, format: str, *args) -> None:  # noqa: A003
        return


class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True


def run(host: str | None = None, port: int | None = None) -> None:
    resolved_host = host or os.getenv("HOST", "0.0.0.0")
    resolved_port = port or int(os.getenv("PORT", "8000"))
    with resources.as_file(resources.files("strenaysis").joinpath("web")) as web_root:
        handler = type("StrenaysisHandler", (AppHandler,), {"web_root": Path(web_root)})
        with ReusableTCPServer((resolved_host, resolved_port), handler) as httpd:
            public_host = "127.0.0.1" if resolved_host == "0.0.0.0" else resolved_host
            url = f"http://{public_host}:{resolved_port}"
            print(f"Strenaysis is running at {url}")
            print("Press Ctrl+C to stop.")
            if os.getenv("STRENAYSIS_OPEN_BROWSER", "1") == "1" and resolved_host in {"127.0.0.1", "localhost"}:
                try:
                    webbrowser.open(url)
                except Exception:
                    pass
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print("\nServer stopped.")
