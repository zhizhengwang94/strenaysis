from __future__ import annotations

import json
import os
import re
import socketserver
import uuid
import webbrowser
from datetime import datetime, timezone
from http.cookies import SimpleCookie
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler
from importlib import resources
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

from .exporter import build_export_bundle
from .openai_client import (
    DEFAULT_ROADMAP,
    generate_node_build,
    generate_roadmap,
    polish_node,
    refresh_roadmap_followups,
    synthesize_node_output,
)


ACCESS_COOKIE = "strenaysis_access"
ACCESS_CODE = "2825628257282931"
SAVE_DIRECTORY = "saved_problem_structures"
ACTION_DIRECTORY = "active_problem_structures"
PROBLEMS_DIRECTORY = "problems"
MAX_QUESTION_LENGTH = 600
MAX_CONTEXT_LENGTH = 2000

PROBLEM_TYPE_SHORT = {
    "descriptive_analysis": "descriptive",
    "predictive_modeling": "predictive",
    "experiment_causal_question": "causal",
    "operational_optimization": "optimization",
}


class AppHandler(SimpleHTTPRequestHandler):
    web_root: Path

    def __init__(self, *args, directory: str | None = None, **kwargs) -> None:
        super().__init__(*args, directory=str(self.web_root), **kwargs)

    def do_GET(self) -> None:  # noqa: N802
        if not self._is_authenticated():
            self._serve_unlock_page()
            return
        path = urlsplit(self.path).path
        if path == "/problems" or path.endswith("/problems"):
            self._handle_list_problems()
            return
        if "/problems/" in path and path.endswith("/assessment"):
            self._handle_get_assessment()
            return
        if path == "/api/problem-framings" or path.endswith("/api/problem-framings"):
            self._handle_list_problem_framings()
            return
        if path == "/api/action-problems" or path.endswith("/api/action-problems"):
            self._handle_list_action_problems()
            return
        if path == "/api/pipeline-overview" or path.endswith("/api/pipeline-overview"):
            self._handle_pipeline_overview()
            return
        if "/api/problem-framings/" in path:
            self._handle_get_problem_framing()
            return
        if path in {"", "/"}:
            self.path = "/step-1-home.html"
        super().do_GET()

    def do_POST(self) -> None:  # noqa: N802
        path = urlsplit(self.path).path
        if path == "/unlock":
            self._handle_unlock()
            return
        if not self._is_authenticated():
            self._send_json({"error": "Authentication required."}, status=HTTPStatus.UNAUTHORIZED)
            return
        if path == "/problems" or path.endswith("/problems"):
            self._handle_create_problem()
            return
        if path == "/api/roadmap" or path.endswith("/api/roadmap"):
            self._handle_generate_roadmap()
            return
        if path == "/api/polish-node" or path.endswith("/api/polish-node"):
            self._handle_polish_node()
            return
        if path == "/api/node-build" or path.endswith("/api/node-build"):
            self._handle_node_build()
            return
        if path == "/api/node-output" or path.endswith("/api/node-output"):
            self._handle_node_output()
            return
        if path == "/api/refresh-followups" or path.endswith("/api/refresh-followups"):
            self._handle_refresh_followups()
            return
        if path == "/api/export" or path.endswith("/api/export"):
            self._handle_export()
            return
        if "save-problem-framing" in path:
            self._handle_save_problem_framing()
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

    def _handle_create_problem(self) -> None:
        content_length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(content_length)
        try:
            body = json.loads(raw_body.decode("utf-8"))
        except json.JSONDecodeError:
            self._send_json({"error": "Invalid JSON body."}, status=HTTPStatus.BAD_REQUEST)
            return

        question = str(body.get("question", "")).strip()
        context = str(body.get("context", "")).strip()
        if not question:
            self._send_json({"error": "Question is required."}, status=HTTPStatus.BAD_REQUEST)
            return
        if len(question) > MAX_QUESTION_LENGTH:
            self._send_json(
                {"error": f"Question must be {MAX_QUESTION_LENGTH} characters or fewer."},
                status=HTTPStatus.BAD_REQUEST,
            )
            return
        if len(context) > MAX_CONTEXT_LENGTH:
            self._send_json(
                {"error": f"Context must be {MAX_CONTEXT_LENGTH} characters or fewer."},
                status=HTTPStatus.BAD_REQUEST,
            )
            return

        problem_id = uuid.uuid4().hex[:12]
        now = datetime.now(timezone.utc).isoformat()
        payload = {
            "id": problem_id,
            "question": question,
            "context": context,
            "problem_type": None,
            "recommended_type": None,
            "owner": None,
            "status": "in_progress",
            "current_step": 1,
            "created_at": now,
            "updated_at": now,
            "nodes": [],
        }

        problems_dir = self._problems_dir()
        problems_dir.mkdir(parents=True, exist_ok=True)
        (problems_dir / f"{problem_id}.json").write_text(
            json.dumps(payload, indent=2), encoding="utf-8"
        )
        self._send_json({"problem_id": problem_id}, status=HTTPStatus.CREATED)

    def _handle_list_problems(self) -> None:
        query = parse_qs(urlsplit(self.path).query)
        status_filter = (query.get("status") or [""])[0].strip().lower()

        problems_dir = self._problems_dir()
        problems_dir.mkdir(parents=True, exist_ok=True)
        items = []
        for path in sorted(problems_dir.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True):
            try:
                payload = json.loads(path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                continue
            status = str(payload.get("status", "")).strip().lower() or "in_progress"
            if status_filter and status_filter != "recent" and status != status_filter:
                continue

            question = str(payload.get("question", "")).strip()
            truncated = question if len(question) <= 100 else question[:97] + "..."
            items.append({
                "id": str(payload.get("id", "")),
                "question": truncated,
                "problem_type": payload.get("problem_type"),
                "current_step": int(payload.get("current_step", 1) or 1),
                "status": status,
                "updated_at": str(payload.get("updated_at", "")),
            })
        self._send_json({"items": items})

    def _handle_get_assessment(self) -> None:
        path = urlsplit(self.path).path
        parts = path.strip("/").split("/")
        if len(parts) < 3 or parts[-3] != "problems" or parts[-1] != "assessment":
            self._send_json({"error": "Invalid assessment path."}, status=HTTPStatus.BAD_REQUEST)
            return
        problem_id = parts[-2]

        file_path = self._problems_dir() / f"{problem_id}.json"
        if not file_path.exists():
            self._send_json({"error": "Problem not found."}, status=HTTPStatus.NOT_FOUND)
            return

        try:
            payload = json.loads(file_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            self._send_json({"error": "Could not read problem."}, status=HTTPStatus.INTERNAL_SERVER_ERROR)
            return

        if payload.get("nodes"):
            self._send_json(self._build_assessment_response(payload))
            return

        question = str(payload.get("question", "")).strip()
        context = str(payload.get("context", "")).strip()
        result = generate_roadmap(question, context, None)
        roadmap = result.roadmap or [item.copy() for item in DEFAULT_ROADMAP]

        nodes = []
        for i, item in enumerate(roadmap, start=1):
            nodes.append({
                "node_id": uuid.uuid4().hex[:12],
                "name": str(item.get("title", "")).strip(),
                "description": str(item.get("why", "")).strip(),
                "position": i,
                "status": "open",
                "questions_answered": 0,
                "questions_total": 0,
                "is_custom": False,
                "_breakdown": str(item.get("breakdown", "")),
                "_suggested_context": str(item.get("suggested_context", "")),
            })

        recommended = PROBLEM_TYPE_SHORT.get(result.inferred_problem_type)
        chosen = PROBLEM_TYPE_SHORT.get(result.problem_type) or recommended

        explanation_parts = []
        if result.assessment_title:
            explanation_parts.append(result.assessment_title.strip())
        if result.assessment_recap:
            explanation_parts.append(result.assessment_recap.strip())
        explanation = "\n".join(part for part in explanation_parts if part)

        payload["nodes"] = nodes
        payload["problem_type"] = chosen
        payload["recommended_type"] = recommended
        payload["explanation"] = explanation
        payload["current_step"] = max(int(payload.get("current_step", 1) or 1), 2)
        payload["updated_at"] = datetime.now(timezone.utc).isoformat()
        file_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

        self._send_json(self._build_assessment_response(payload))

    @staticmethod
    def _build_assessment_response(payload: dict) -> dict:
        return {
            "id": payload.get("id"),
            "question": payload.get("question", ""),
            "context": payload.get("context", ""),
            "problem_type": payload.get("problem_type"),
            "recommended_type": payload.get("recommended_type"),
            "explanation": payload.get("explanation", ""),
            "nodes": [
                {
                    "node_id": n.get("node_id"),
                    "name": n.get("name"),
                    "description": n.get("description"),
                    "position": n.get("position"),
                    "status": n.get("status", "open"),
                    "questions_answered": n.get("questions_answered", 0),
                    "questions_total": n.get("questions_total", 0),
                    "is_custom": n.get("is_custom", False),
                }
                for n in payload.get("nodes", [])
            ],
        }

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
        roadmap_titles = body.get("roadmap_titles", [])
        normalized_titles = [str(item).strip() for item in roadmap_titles if str(item).strip()] if isinstance(roadmap_titles, list) else []
        if not draft:
            self._send_json({"error": "A draft node description is required."}, status=HTTPStatus.BAD_REQUEST)
            return

        polished = polish_node(problem, problem_details, draft, normalized_titles)
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

    def _handle_refresh_followups(self) -> None:
        content_length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(content_length)
        try:
            body = json.loads(raw_body.decode("utf-8"))
        except json.JSONDecodeError:
            self._send_json({"error": "Invalid JSON body."}, status=HTTPStatus.BAD_REQUEST)
            return

        problem = str(body.get("problem", "")).strip()
        problem_details = str(body.get("problem_details", "")).strip()
        roadmap = body.get("roadmap", [])
        if not problem or not isinstance(roadmap, list):
            self._send_json({"error": "Problem and roadmap are required."}, status=HTTPStatus.BAD_REQUEST)
            return

        prompts = refresh_roadmap_followups(problem, problem_details, roadmap)
        self._send_json({"suggested_contexts": prompts})

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

    def _handle_save_problem_framing(self) -> None:
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            raw_body = self.rfile.read(content_length)
            try:
                body = json.loads(raw_body.decode("utf-8"))
            except json.JSONDecodeError:
                self._send_json({"error": "Invalid JSON body."}, status=HTTPStatus.BAD_REQUEST)
                return

            problem = str(body.get("problem", "")).strip()
            problem_name = str(body.get("problem_name", "")).strip()
            priority = str(body.get("priority", "")).strip()
            saved_date = str(body.get("saved_date") or body.get("saved_at") or "").strip()
            if not problem:
                self._send_json({"error": "Problem content is required."}, status=HTTPStatus.BAD_REQUEST)
                return
            if priority not in {"High", "Medium", "Low"}:
                self._send_json({"error": "Priority must be High, Medium, or Low."}, status=HTTPStatus.BAD_REQUEST)
                return

            storage_dir = self._storage_dir()
            storage_dir.mkdir(parents=True, exist_ok=True)
            safe_date = re.sub(r"[^0-9-]+", "-", saved_date).strip("-") or "undated"
            display_name = problem_name or f"Problem_{safe_date}"
            slug = self._slugify(display_name, max_length=64)
            base_filename = f"{safe_date}_{slug}" if slug else safe_date
            filename = f"{base_filename}.json"
            counter = 2
            while (storage_dir / filename).exists():
                filename = f"{base_filename}-{counter}.json"
                counter += 1

            nodes = body.get("nodes", []) if isinstance(body.get("nodes", []), list) else []
            action_count = 0
            ready_count = 0
            for node in nodes:
                if not isinstance(node, dict):
                    continue
                build = node.get("build", {})
                execution_items = build.get("execution_items", []) if isinstance(build, dict) else []
                action_count += len(execution_items) if isinstance(execution_items, list) else 0
                if str(node.get("suggested_context", "")).strip().lower() == "no additional suggested item":
                    ready_count += 1

            payload = {
                "problem": problem,
                "problem_name": display_name,
                "priority": priority,
                "saved_at": safe_date,
                "problem_type": str(body.get("problem_type", "")).strip(),
                "assessment_title": str(body.get("assessment_title", "")).strip(),
                "assessment_recap": str(body.get("assessment_recap", "")).strip(),
                "problem_details": str(body.get("problem_details", "")).strip(),
                "node_count": len(nodes),
                "ready_count": ready_count,
                "action_count": action_count,
                "nodes": nodes,
            }

            path = storage_dir / filename
            path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
            self._send_json({
                "saved": True,
                "filename": filename,
                "problem": problem,
                "problem_name": display_name,
                "priority": priority,
            })
        except Exception as exc:
            self._send_json({"error": f"Unable to save framing: {exc}"}, status=HTTPStatus.INTERNAL_SERVER_ERROR)

    def _handle_list_problem_framings(self) -> None:
        storage_dir = self._storage_dir()
        storage_dir.mkdir(parents=True, exist_ok=True)
        records = []
        for path in sorted(storage_dir.glob("*.json"), key=lambda item: item.stat().st_mtime, reverse=True):
            try:
                payload = json.loads(path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                continue
            records.append({
                "filename": path.name,
                "problem": str(payload.get("problem", "")).strip(),
                "problem_name": str(payload.get("problem_name", "")).strip(),
                "saved_at": str(payload.get("saved_at", "")).strip(),
                "priority": str(payload.get("priority", "")).strip() or "Medium",
                "problem_type": str(payload.get("problem_type", "")).strip() or "Not set",
                "node_count": int(payload.get("node_count", 0) or 0),
                "ready_count": int(payload.get("ready_count", 0) or 0),
                "action_count": int(payload.get("action_count", 0) or 0),
            })
        self._send_json({"items": records})

    def _handle_get_problem_framing(self) -> None:
        path = urlsplit(self.path).path
        filename = path.split("/api/problem-framings/", 1)[-1].strip()
        if not filename.endswith(".json"):
            self._send_json({"error": "Invalid saved framing request."}, status=HTTPStatus.BAD_REQUEST)
            return

        storage_dir = self._storage_dir()
        path = storage_dir / Path(filename).name
        if not path.exists():
            self._send_json({"error": "Saved framing not found."}, status=HTTPStatus.NOT_FOUND)
            return

        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            self._send_json({"error": "Saved framing is unreadable."}, status=HTTPStatus.INTERNAL_SERVER_ERROR)
            return
        self._send_json(payload)

    def _handle_list_action_problems(self) -> None:
        storage_dir = self._action_storage_dir()
        storage_dir.mkdir(parents=True, exist_ok=True)
        items = []
        in_progress = 0
        resolved = 0
        open_count = 0
        high_priority = 0
        due_this_week = 0
        next_due_dates: list[dict] = []

        for path in sorted(storage_dir.glob("*.json"), key=lambda item: item.stat().st_mtime, reverse=True):
            try:
                payload = json.loads(path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                continue

            status = str(payload.get("status", "")).strip() or "Open"
            priority = str(payload.get("priority", "")).strip() or "Medium"
            due_date = str(payload.get("due_date", "")).strip()

            if status.lower() == "resolved":
                resolved += 1
            elif status.lower() == "in progress":
                in_progress += 1
                open_count += 1
            else:
                open_count += 1

            if priority.lower() == "high":
                high_priority += 1

            due_sort = ""
            if re.fullmatch(r"\d{4}-\d{2}-\d{2}", due_date):
                due_sort = due_date
            items.append({
                "filename": path.name,
                "problem_name": str(payload.get("problem_name", "")).strip() or path.stem,
                "summary": str(payload.get("summary", "")).strip(),
                "status": status,
                "priority": priority,
                "owner": str(payload.get("owner", "")).strip() or "Owner not assigned",
                "approver": str(payload.get("approver", "")).strip() or "No approver listed",
                "due_date": due_date,
                "updated_at": str(payload.get("updated_at", "")).strip(),
                "workstream": str(payload.get("workstream", "")).strip() or "General",
            })

        from datetime import date, timedelta

        today = date.today()
        week_end = today + timedelta(days=7)
        for item in items:
            due_date = item["due_date"]
            if re.fullmatch(r"\d{4}-\d{2}-\d{2}", due_date):
                due = date.fromisoformat(due_date)
                if today <= due <= week_end:
                    due_this_week += 1
                next_due_dates.append({
                    "problem_name": item["problem_name"],
                    "due_date": due_date,
                    "status": item["status"],
                })

        next_due_dates.sort(key=lambda item: item["due_date"])

        self._send_json({
            "summary": {
                "in_progress": in_progress,
                "resolved": resolved,
                "open": open_count,
                "high_priority": high_priority,
                "due_this_week": due_this_week,
            },
            "calendar": next_due_dates[:5],
            "items": items,
        })

    def _handle_pipeline_overview(self) -> None:
        profile_dir = self._storage_dir()
        action_dir = self._action_storage_dir()
        profile_dir.mkdir(parents=True, exist_ok=True)
        action_dir.mkdir(parents=True, exist_ok=True)

        framed_items: list[dict] = []
        action_items: list[dict] = []

        for path in sorted(profile_dir.glob("*.json"), key=lambda item: item.stat().st_mtime, reverse=True):
            try:
                payload = json.loads(path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                continue
            framed_items.append({
                "problem_name": str(payload.get("problem_name", "")).strip() or str(payload.get("problem", "")).strip() or path.stem,
                "saved_at": str(payload.get("saved_at", "")).strip(),
                "priority": str(payload.get("priority", "")).strip() or "Medium",
                "problem_type": str(payload.get("problem_type", "")).strip() or "Not set",
            })

        for path in sorted(action_dir.glob("*.json"), key=lambda item: item.stat().st_mtime, reverse=True):
            try:
                payload = json.loads(path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                continue
            action_items.append({
                "problem_name": str(payload.get("problem_name", "")).strip() or path.stem,
                "status": str(payload.get("status", "")).strip() or "Open",
                "priority": str(payload.get("priority", "")).strip() or "Medium",
                "owner": str(payload.get("owner", "")).strip() or "Owner not assigned",
                "updated_at": str(payload.get("updated_at", "")).strip(),
                "due_date": str(payload.get("due_date", "")).strip(),
            })

        statuses = {"not_started": 0, "in_progress": 0, "resolved": 0, "blocked": 0}
        active_names = set()
        framed_names = {item["problem_name"].strip().lower() for item in framed_items}
        for item in action_items:
            active_names.add(item["problem_name"].strip().lower())
            status = item["status"].strip().lower()
            if status == "resolved":
                statuses["resolved"] += 1
            elif status == "in progress":
                statuses["in_progress"] += 1
            elif status == "blocked":
                statuses["blocked"] += 1
            else:
                statuses["not_started"] += 1

        framed_only = [
            item for item in framed_items
            if item["problem_name"].strip().lower() not in active_names
        ]
        activated_from_framed = sum(1 for name in active_names if name in framed_names)

        recent_activity = []
        for item in action_items[:8]:
            recent_activity.append({
                "problem_name": item["problem_name"],
                "stage": item["status"],
                "date": item["updated_at"] or item["due_date"],
                "owner": item["owner"],
            })
        for item in framed_only[:4]:
            recent_activity.append({
                "problem_name": item["problem_name"],
                "stage": "Framed",
                "date": item["saved_at"],
                "owner": "Not yet activated",
            })

        self._send_json({
            "summary": {
                "framed_total": len(framed_items),
                "activated_total": activated_from_framed,
                "active_total": len(action_items),
                "conversion_rate": round((activated_from_framed / len(framed_items)) * 100) if framed_items else 0,
                "framed_only": len(framed_only),
                "not_started": statuses["not_started"],
                "in_progress": statuses["in_progress"],
                "blocked": statuses["blocked"],
                "resolved": statuses["resolved"],
            },
            "stages": [
                {"label": "Framed", "count": len(framed_items), "tone": "framed"},
                {"label": "Activated", "count": len(action_items), "tone": "activated"},
                {"label": "Not Started", "count": statuses["not_started"], "tone": "waiting"},
                {"label": "In Progress", "count": statuses["in_progress"], "tone": "active"},
                {"label": "Resolved", "count": statuses["resolved"], "tone": "resolved"},
            ],
            "recent_activity": recent_activity[:10],
        })

    def _send_json(self, payload: dict, status: HTTPStatus = HTTPStatus.OK) -> None:
        encoded = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def end_headers(self) -> None:
        no_cache_paths = {
            "/",
            "/_shared.css",
            "/step-1-home.html",
            "/step-2-roadmap.html",
            "/step-3-buildup.html",
            "/step-4-summary.html",
        }
        if self.path in no_cache_paths:
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

    @staticmethod
    def _slugify(value: str, max_length: int = 80) -> str:
        cleaned = re.sub(r"[^a-zA-Z0-9]+", "-", value.strip().lower()).strip("-")
        cleaned = cleaned[:max_length].strip("-")
        return cleaned or "problem-framing"

    @staticmethod
    def _storage_dir() -> Path:
        return Path.cwd() / SAVE_DIRECTORY

    @staticmethod
    def _action_storage_dir() -> Path:
        return Path.cwd() / ACTION_DIRECTORY

    @staticmethod
    def _problems_dir() -> Path:
        return Path.cwd() / PROBLEMS_DIRECTORY

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
