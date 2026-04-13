from __future__ import annotations

import json
import os
import socketserver
import webbrowser
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler
from importlib import resources
from pathlib import Path

from .exporter import build_export_bundle
from .openai_client import DEFAULT_ROADMAP, generate_node_build, generate_roadmap, polish_node, synthesize_node_output


class AppHandler(SimpleHTTPRequestHandler):
    web_root: Path

    def __init__(self, *args, directory: str | None = None, **kwargs) -> None:
        super().__init__(*args, directory=str(self.web_root), **kwargs)

    def do_GET(self) -> None:  # noqa: N802
        if self.path in {"", "/"}:
            self.path = "/index.html"
        super().do_GET()

    def do_POST(self) -> None:  # noqa: N802
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
