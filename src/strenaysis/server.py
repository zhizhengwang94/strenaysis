from __future__ import annotations

import json
import socketserver
import webbrowser
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler
from importlib import resources
from pathlib import Path

from .openai_client import DEFAULT_ROADMAP, generate_roadmap, polish_node


class AppHandler(SimpleHTTPRequestHandler):
    web_root: Path

    def __init__(self, *args, directory: str | None = None, **kwargs) -> None:
        super().__init__(*args, directory=str(self.web_root), **kwargs)

    def do_POST(self) -> None:  # noqa: N802
        if self.path == "/api/roadmap":
            self._handle_generate_roadmap()
            return
        if self.path == "/api/polish-node":
            self._handle_polish_node()
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

    def _send_json(self, payload: dict, status: HTTPStatus = HTTPStatus.OK) -> None:
        encoded = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def log_message(self, format: str, *args) -> None:  # noqa: A003
        return


class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True


def run(host: str = "127.0.0.1", port: int = 8000) -> None:
    with resources.as_file(resources.files("strenaysis").joinpath("web")) as web_root:
        handler = type("StrenaysisHandler", (AppHandler,), {"web_root": Path(web_root)})
        with ReusableTCPServer((host, port), handler) as httpd:
            url = f"http://{host}:{port}"
            print(f"Strenaysis is running at {url}")
            print("Press Ctrl+C to stop.")
            try:
                webbrowser.open(url)
            except Exception:
                pass
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print("\nServer stopped.")
