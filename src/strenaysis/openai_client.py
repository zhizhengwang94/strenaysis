from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass
from typing import Any
from urllib import error, request

PROBLEM_TYPE_LABELS = {
    "descriptive_analysis": "Descriptive Analysis",
    "predictive_modeling": "Predictive Modeling",
    "experiment_causal_question": "Experiment / Causal Question",
    "operational_optimization": "Operational Optimization",
}

ROADMAP_TEMPLATES = {
    "descriptive_analysis": ["Objective", "Metric", "Segmentation", "Drivers", "Data", "Result", "Takeaway"],
    "predictive_modeling": ["Objective", "Metric", "Drivers", "Data", "Model", "Decision", "Result", "Takeaway"],
    "experiment_causal_question": ["Objective", "Metric", "Hypotheses", "Data", "Experiment Design", "Decision", "Result", "Takeaway"],
    "operational_optimization": ["Objective", "Metric", "Constraints", "Drivers", "Data", "Decision", "Impact", "Takeaway"],
}

NODE_WHY = {
    "Objective": "Defines the business question precisely so the analysis solves the right problem.",
    "Metric": "Defines success and guardrails so every later trade-off stays grounded.",
    "Segmentation": "Shows where to cut the problem so the analysis is comparable and decision-useful.",
    "Drivers": "Identifies the key levers and hypotheses that most likely explain the outcome.",
    "Data": "Clarifies what evidence exists, what is missing, and what can credibly answer the question.",
    "Model": "Chooses the analytical engine that best supports prediction, ranking, or prioritization.",
    "Decision": "Translates the analysis into a concrete business action, threshold, or targeting rule.",
    "Result": "Summarizes the expected or observed performance so the recommendation is evidence-backed.",
    "Takeaway": "Packages the final message into the clearest recommendation, caveats, and next steps.",
    "Hypotheses": "Frames the causal stories worth testing before jumping into intervention design.",
    "Experiment Design": "Specifies how to estimate causal impact cleanly and credibly.",
    "Constraints": "Makes the real-world limits explicit so the framework stays actionable.",
    "Impact": "Sizes the business upside and trade-offs so action can be prioritized rationally.",
}

DEFAULT_PROBLEM_TYPE = "predictive_modeling"
NO_ADDITIONAL_SUGGESTED_ITEM = "No Additional Suggested Item"


@dataclass
class OpenAIResult:
    roadmap: list[dict[str, str]]
    source: str
    problem_type: str
    inferred_problem_type: str
    assessment_title: str
    assessment_recap: str


DEFAULT_ROADMAP = [{"title": t, "why": NODE_WHY[t], "breakdown": "", "suggested_context": ""} for t in ROADMAP_TEMPLATES[DEFAULT_PROBLEM_TYPE]]


def generate_roadmap(problem: str, problem_details: str = "", forced_problem_type: str | None = None) -> OpenAIResult:
    inferred_type = _classify_problem_type(problem, problem_details)
    fallback_type = forced_problem_type or inferred_type
    fallback_roadmap = _build_fallback_roadmap(problem, problem_details, fallback_type)
    fallback_title, fallback_recap = _build_problem_assessment(problem, problem_details, fallback_type, inferred_type)

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return OpenAIResult(fallback_roadmap, "fallback", fallback_type, inferred_type, fallback_title, fallback_recap)

    prompt = (
        "You are helping structure a generic data-analysis or data-science case interview. "
        "Classify the problem into exactly one of: descriptive_analysis, predictive_modeling, experiment_causal_question, operational_optimization. "
        "Then produce an interview-style assessment and a roadmap framework matched to that type.\n\n"
        "Templates:\n"
        "- descriptive_analysis: Objective, Metric, Segmentation, Drivers, Data, Result, Takeaway\n"
        "- predictive_modeling: Objective, Metric, Drivers, Data, Model, Decision, Result, Takeaway\n"
        "- experiment_causal_question: Objective, Metric, Hypotheses, Data, Experiment Design, Decision, Result, Takeaway\n"
        "- operational_optimization: Objective, Metric, Constraints, Drivers, Data, Decision, Impact, Takeaway\n\n"
        "Return JSON with keys: problem_type, assessment_title, assessment_recap, roadmap. "
        "assessment_title should be a short framing line. assessment_recap should be 3-4 short labeled lines separated by newline characters. "
        "Each roadmap item must contain title, why, breakdown, suggested_context. The roadmap must follow the exact template for the chosen problem type in the exact order. "
        "why should be one sentence. breakdown must be concrete and tailored to the problem, written as 3-5 short labeled lines separated by newline characters. "
        "Prefer descriptive_analysis when the main ask is to understand what is happening, why a metric is moving, or what the root causes are, even if the metric is churn, risk, or another predictive outcome. "
        "Choose predictive_modeling only when the prompt explicitly asks to predict, rank, score, target, prioritize entities for action, or build a model for intervention. "
        "Use a consultancy-style, MECE structure. suggested_context must ask for only the single most important missing context that would strengthen this node. "
        "Do not create a chain of clever follow-up questions. One practical, sufficient question is enough. "
        f"If enough context already exists, return exactly: '{NO_ADDITIONAL_SUGGESTED_ITEM}'. "
        "For Metric, prefer Business metric / Decision metric / Model metric. For Data, prefer Behavioral / Value-related / Historical outcome / Profile / Contextual buckets.\n\n"
        f"Problem to solve: {problem}\n"
        f"Problem details: {problem_details or 'None provided.'}\n"
        f"Forced problem type: {forced_problem_type or 'None. Infer the best fit.'}"
    )
    payload = {
        "model": os.getenv("OPENAI_MODEL", "gpt-4.1-mini"),
        "input": prompt,
        "text": {
            "format": {
                "type": "json_schema",
                "name": "roadmap_response",
                "schema": {
                    "type": "object",
                    "properties": {
                        "problem_type": {"type": "string", "enum": list(PROBLEM_TYPE_LABELS.keys())},
                        "assessment_title": {"type": "string"},
                        "assessment_recap": {"type": "string"},
                        "roadmap": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "title": {"type": "string"},
                                    "why": {"type": "string"},
                                    "breakdown": {"type": "string"},
                                    "suggested_context": {"type": "string"},
                                },
                                "required": ["title", "why", "breakdown", "suggested_context"],
                                "additionalProperties": False,
                            },
                            "minItems": 1,
                        },
                    },
                    "required": ["problem_type", "assessment_title", "assessment_recap", "roadmap"],
                    "additionalProperties": False,
                },
            },
        },
    }
    req = request.Request(
        "https://api.openai.com/v1/responses",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with request.urlopen(req, timeout=45) as response:
            body = json.loads(response.read().decode("utf-8"))
    except (error.URLError, error.HTTPError, TimeoutError, json.JSONDecodeError):
        return OpenAIResult(fallback_roadmap, "fallback", fallback_type, inferred_type, fallback_title, fallback_recap)

    parsed = _extract_roadmap_response(body)
    if not parsed:
        return OpenAIResult(fallback_roadmap, "fallback", fallback_type, inferred_type, fallback_title, fallback_recap)

    problem_type = forced_problem_type or parsed["problem_type"]
    roadmap = _align_roadmap_to_template(parsed["roadmap"], problem, problem_details, problem_type)
    source = "openai" if roadmap else "fallback"
    return OpenAIResult(
        roadmap or fallback_roadmap,
        source,
        problem_type,
        inferred_type,
        parsed["assessment_title"] or fallback_title,
        parsed["assessment_recap"] or fallback_recap,
    )


def polish_node(problem: str, problem_details: str, draft: str, existing_titles: list[str] | None = None) -> dict[str, str]:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return _fallback_polish_node(problem, problem_details, draft, existing_titles or [])

    existing_titles_text = ", ".join(title for title in (existing_titles or []) if title.strip()) or "None"
    prompt = (
        "You are polishing a roadmap stage for a data science workflow. Return JSON with keys title, why, breakdown, suggested_context, recommendation, advisory. "
        "title must be concise, under 3 words. why must be one sentence. breakdown must be a consultancy-style MECE structure written as 3-5 short labeled lines. "
        "recommendation must be one of: recommended, caution. "
        "If the proposed node seems redundant, out of scope, or already substantially covered by an existing roadmap stage, set recommendation to caution and explain why in advisory. "
        "If the node is a good addition, set recommendation to recommended and use advisory to briefly explain how it strengthens the roadmap. "
        f"suggested_context should ask what extra context would make the node more precise, or exactly '{NO_ADDITIONAL_SUGGESTED_ITEM}' if enough context exists.\n\n"
        f"Problem to solve: {problem}\nProblem details: {problem_details or 'None provided.'}\nExisting roadmap stages: {existing_titles_text}\nDraft stage request: {draft}"
    )
    payload = {
        "model": os.getenv("OPENAI_MODEL", "gpt-4.1-mini"),
        "input": prompt,
        "text": {
            "format": {
                "type": "json_schema",
                "name": "polish_node_response",
                "schema": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "why": {"type": "string"},
                        "breakdown": {"type": "string"},
                        "suggested_context": {"type": "string"},
                        "recommendation": {"type": "string", "enum": ["recommended", "caution"]},
                        "advisory": {"type": "string"},
                    },
                    "required": ["title", "why", "breakdown", "suggested_context", "recommendation", "advisory"],
                    "additionalProperties": False,
                },
            },
        },
    }
    req = request.Request(
        "https://api.openai.com/v1/responses",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with request.urlopen(req, timeout=45) as response:
            body = json.loads(response.read().decode("utf-8"))
    except (error.URLError, error.HTTPError, TimeoutError, json.JSONDecodeError):
        return _fallback_polish_node(problem, problem_details, draft, existing_titles or [])

    polished = _extract_polished_node(body)
    return polished or _fallback_polish_node(problem, problem_details, draft, existing_titles or [])


def generate_node_build(
    problem: str,
    problem_details: str,
    problem_type: str,
    node_title: str,
    node_why: str,
    node_breakdown: str,
) -> dict[str, Any]:
    fallback = _fallback_node_build(problem, problem_details, problem_type, node_title, node_why, node_breakdown)
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return fallback

    prompt = (
        "You are translating one roadmap node into a concrete execution plan for a data analyst or data scientist. "
        "Your job is to convert high-level structure into actionable next steps. "
        "Return JSON with keys execution_summary, key_question, workstreams, extracted_context, open_questions, execution_items, output. "
        "execution_summary should be a short paragraph describing what this node needs to achieve operationally. "
        "key_question should be one sentence. extracted_context should be 3-5 short lines tailored to the problem and this node. "
        "workstreams should be 2-4 execution buckets. Each workstream must contain name, purpose, priority, completion_criteria. "
        "open_questions should be 0-4 unresolved questions that could block or change the work. "
        "execution_items should be 2-6 concrete actions. Each execution item must contain action, owner, collaborator, source, artifact, approval, blockers. "
        "Make each row operationally useful: what needs to be done now, who to talk to, where the information or data should come from, what deliverable should be created, whether approval is needed, and what could block progress. "
        "Treat the node breakdown as the structure to translate, not as text to restate. "
        "Break it into work that a real analyst can execute next week. "
        "When helpful, use one execution item per major breakdown bucket plus one cross-cutting item for quality, alignment, or synthesis. "
        "Avoid generic advice like 'analyze the data' unless you specify the dataset, stakeholder, or artifact. "
        "If the node is Data, think in terms of data gathering, source mapping, data profiling, quality checks, and access alignment. "
        "If the node is Metric, think in terms of KPI alignment, baseline definitions, dashboard definitions, and sign-off. "
        "If no approval is needed, say exactly 'No approval needed'. If no major blocker exists, say exactly 'No blocker identified yet.'. "
        "output should synthesize what this node will produce and why the listed actions are enough to move the roadmap forward. "
        "The best output sounds like a concise implementation brief, not a glossary note. "
        "Keep it professional, concrete, and immediately editable.\n\n"
        f"Problem to solve: {problem}\n"
        f"Problem details: {problem_details or 'None provided.'}\n"
        f"Problem type: {problem_type or 'Not set'}\n"
        f"Node name: {node_title}\n"
        f"Node description: {node_why}\n"
        f"Node breakdown:\n{node_breakdown}"
    )
    payload = {
        "model": os.getenv("OPENAI_MODEL", "gpt-4.1-mini"),
        "input": prompt,
        "text": {
            "format": {
                "type": "json_schema",
                "name": "node_build_response",
                "schema": {
                    "type": "object",
                    "properties": {
                        "execution_summary": {"type": "string"},
                        "key_question": {"type": "string"},
                        "workstreams": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "name": {"type": "string"},
                                    "purpose": {"type": "string"},
                                    "priority": {"type": "string"},
                                    "completion_criteria": {"type": "string"},
                                },
                                "required": ["name", "purpose", "priority", "completion_criteria"],
                                "additionalProperties": False,
                            },
                        },
                        "extracted_context": {"type": "string"},
                        "open_questions": {"type": "array", "items": {"type": "string"}},
                        "execution_items": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "action": {"type": "string"},
                                    "owner": {"type": "string"},
                                    "collaborator": {"type": "string"},
                                    "source": {"type": "string"},
                                    "artifact": {"type": "string"},
                                    "approval": {"type": "string"},
                                    "blockers": {"type": "string"},
                                },
                                "required": ["action", "owner", "collaborator", "source", "artifact", "approval", "blockers"],
                                "additionalProperties": False,
                            },
                            "minItems": 1,
                        },
                        "output": {"type": "string"},
                    },
                    "required": ["execution_summary", "key_question", "workstreams", "extracted_context", "open_questions", "execution_items", "output"],
                    "additionalProperties": False,
                },
            },
        },
    }
    req = request.Request(
        "https://api.openai.com/v1/responses",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with request.urlopen(req, timeout=45) as response:
            body = json.loads(response.read().decode("utf-8"))
    except (error.URLError, error.HTTPError, TimeoutError, json.JSONDecodeError):
        return fallback

    parsed = _extract_node_build(body)
    return parsed or fallback


def synthesize_node_output(
    problem: str,
    problem_details: str,
    node_title: str,
    node_description: str,
    node_breakdown: str,
    key_question: str,
    extracted_context: str,
    execution_items: list[dict[str, str]],
) -> dict[str, Any]:
    fallback = _fallback_node_output(node_title, node_description, key_question, extracted_context, execution_items)
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return fallback

    prompt = (
        "You are writing the final synthesized output for one roadmap node in a business-to-analytics planning workspace. "
        "Return JSON with keys output and output_sections. "
        "The output should be concise, professional, and useful in a later roadmap review. "
        "Do not restate the node at a high level. Translate it into an execution-ready synthesis. "
        "output_sections must contain four strings: focus, work_to_complete, owners_and_sources, risks_and_handoff. "
        "Write them as deck background context, not as chatty notes. "
        "The combined output should be 4 short labeled lines separated by newline characters with this style: "
        "'Focus:', 'What will be done:', 'Who and where:', 'Deliverable and risk:'. "
        "The note should make it obvious what the team needs to do next, who is involved, where the information comes from, what artifact will be created, and what main risk or approval remains. "
        "Synthesize across the execution items instead of only repeating the first one. "
        "Name the major workstreams or action themes when possible.\n\n"
        f"Problem: {problem}\n"
        f"Problem details: {problem_details or 'None provided.'}\n"
        f"Node name: {node_title}\n"
        f"Node description: {node_description}\n"
        f"Node breakdown:\n{node_breakdown}\n\n"
        f"Key question:\n{key_question}\n\n"
        f"Extracted context:\n{extracted_context}\n\n"
        f"Execution items:\n{json.dumps(execution_items)}"
    )
    payload = {
        "model": os.getenv("OPENAI_MODEL", "gpt-4.1-mini"),
        "input": prompt,
        "text": {
            "format": {
                "type": "json_schema",
                "name": "node_output_response",
                "schema": {
                    "type": "object",
                    "properties": {
                        "output": {"type": "string"},
                        "output_sections": {
                            "type": "object",
                            "properties": {
                                "focus": {"type": "string"},
                                "work_to_complete": {"type": "string"},
                                "owners_and_sources": {"type": "string"},
                                "risks_and_handoff": {"type": "string"},
                            },
                            "required": ["focus", "work_to_complete", "owners_and_sources", "risks_and_handoff"],
                            "additionalProperties": False,
                        },
                    },
                    "required": ["output", "output_sections"],
                    "additionalProperties": False,
                },
            },
        },
    }
    req = request.Request(
        "https://api.openai.com/v1/responses",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with request.urlopen(req, timeout=45) as response:
            body = json.loads(response.read().decode("utf-8"))
    except (error.URLError, error.HTTPError, TimeoutError, json.JSONDecodeError):
        return fallback

    for item in body.get("output", []):
        for content in item.get("content", []):
            if content.get("type") == "output_text" and "text" in content:
                try:
                    parsed = json.loads(content["text"])
                except json.JSONDecodeError:
                    continue
                output = str(parsed.get("output", "")).strip()
                output_sections = parsed.get("output_sections")
                if output and isinstance(output_sections, dict):
                    focus = str(output_sections.get("focus", "")).strip()
                    work_to_complete = str(output_sections.get("work_to_complete", "")).strip()
                    owners_and_sources = str(output_sections.get("owners_and_sources", "")).strip()
                    risks_and_handoff = str(output_sections.get("risks_and_handoff", "")).strip()
                    if focus and work_to_complete and owners_and_sources and risks_and_handoff:
                        return {
                            "output": output,
                            "output_sections": {
                                "focus": focus,
                                "work_to_complete": work_to_complete,
                                "owners_and_sources": owners_and_sources,
                                "risks_and_handoff": risks_and_handoff,
                            },
                        }
    return fallback


def refresh_roadmap_followups(
    problem: str,
    problem_details: str,
    roadmap: list[dict[str, Any]],
) -> list[str]:
    fallback = _fallback_refresh_roadmap_followups(problem, problem_details, roadmap)
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return _postprocess_followup_prompts(problem, problem_details, roadmap, fallback)

    prompt = (
        "You are refreshing node follow-up prompts for a business-to-analytics roadmap. "
        "Return JSON with one key: suggested_contexts. "
        "It must be an array of strings with exactly one entry per roadmap node, in the same order as provided. "
        "Each entry must be either one practical missing-context question for that node or exactly "
        f"'{NO_ADDITIONAL_SUGGESTED_ITEM}'. "
        "Downstream nodes must ingest upstream information. "
        "If a later node's missing context is already covered by the original problem, the detailed context, or answers already captured in earlier nodes, do not ask it again. "
        "Do not create chains of endless follow-up questions. Ask only the single most important missing question when it is still needed.\n\n"
        f"Problem to solve: {problem}\n"
        f"Problem details: {problem_details or 'None provided.'}\n"
        f"Roadmap state:\n{json.dumps(roadmap, ensure_ascii=True)}"
    )
    payload = {
        "model": os.getenv("OPENAI_MODEL", "gpt-4.1-mini"),
        "input": prompt,
        "text": {
            "format": {
                "type": "json_schema",
                "name": "refresh_followups_response",
                "schema": {
                    "type": "object",
                    "properties": {
                        "suggested_contexts": {
                            "type": "array",
                            "items": {"type": "string"},
                        },
                    },
                    "required": ["suggested_contexts"],
                    "additionalProperties": False,
                },
            },
        },
    }
    req = request.Request(
        "https://api.openai.com/v1/responses",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with request.urlopen(req, timeout=45) as response:
            body = json.loads(response.read().decode("utf-8"))
    except (error.URLError, error.HTTPError, TimeoutError, json.JSONDecodeError):
        return _postprocess_followup_prompts(problem, problem_details, roadmap, fallback)

    parsed = _extract_refresh_followups(body, len(roadmap))
    base = parsed or fallback
    return _postprocess_followup_prompts(problem, problem_details, roadmap, base)

def _extract_roadmap_response(body: dict[str, Any]) -> dict[str, Any] | None:
    output = body.get("output", [])
    for item in output:
        for content in item.get("content", []):
            if content.get("type") != "output_text" or "text" not in content:
                continue
            try:
                parsed = json.loads(content["text"])
            except json.JSONDecodeError:
                continue
            problem_type = str(parsed.get("problem_type", "")).strip()
            roadmap = parsed.get("roadmap")
            if problem_type in PROBLEM_TYPE_LABELS and isinstance(roadmap, list):
                return {
                    "problem_type": problem_type,
                    "assessment_title": str(parsed.get("assessment_title", "")).strip(),
                    "assessment_recap": str(parsed.get("assessment_recap", "")).strip(),
                    "roadmap": roadmap,
                }
    return None


def _extract_polished_node(body: dict[str, Any]) -> dict[str, str] | None:
    output = body.get("output", [])
    for item in output:
        for content in item.get("content", []):
            if content.get("type") == "output_text" and "text" in content:
                try:
                    parsed = json.loads(content["text"])
                except json.JSONDecodeError:
                    continue
                title = str(parsed.get("title", "")).strip()
                why = str(parsed.get("why", "")).strip()
                breakdown = str(parsed.get("breakdown", "")).strip()
                suggested_context = str(parsed.get("suggested_context", "")).strip()
                recommendation = str(parsed.get("recommendation", "")).strip() or "recommended"
                advisory = str(parsed.get("advisory", "")).strip()
                if title and why and breakdown and suggested_context:
                    return {
                        "title": title,
                        "why": why,
                        "breakdown": breakdown,
                        "suggested_context": suggested_context,
                        "recommendation": recommendation,
                        "advisory": advisory,
                    }
    return None


def _extract_node_build(body: dict[str, Any]) -> dict[str, Any] | None:
    output = body.get("output", [])
    for item in output:
        for content in item.get("content", []):
            if content.get("type") != "output_text" or "text" not in content:
                continue
            try:
                parsed = json.loads(content["text"])
            except json.JSONDecodeError:
                continue
            execution_summary = str(parsed.get("execution_summary", "")).strip()
            key_question = str(parsed.get("key_question", "")).strip()
            workstreams = parsed.get("workstreams")
            extracted_context = str(parsed.get("extracted_context", "")).strip()
            open_questions = parsed.get("open_questions")
            execution_items = parsed.get("execution_items")
            synthesis = str(parsed.get("output", "")).strip()
            if (
                execution_summary
                and key_question
                and extracted_context
                and synthesis
                and isinstance(workstreams, list)
                and isinstance(open_questions, list)
                and isinstance(execution_items, list)
                and execution_items
            ):
                cleaned_workstreams = []
                for raw in workstreams:
                    if not isinstance(raw, dict):
                        continue
                    workstream = {
                        "name": str(raw.get("name", "")).strip(),
                        "purpose": str(raw.get("purpose", "")).strip(),
                        "priority": str(raw.get("priority", "")).strip(),
                        "completion_criteria": str(raw.get("completion_criteria", "")).strip(),
                    }
                    if all(workstream.values()):
                        cleaned_workstreams.append(workstream)
                cleaned_items = []
                for raw in execution_items:
                    if not isinstance(raw, dict):
                        continue
                    entry = {
                        "action": str(raw.get("action", "")).strip(),
                        "owner": str(raw.get("owner", "")).strip(),
                        "collaborator": str(raw.get("collaborator", "")).strip(),
                        "source": str(raw.get("source", "")).strip(),
                        "artifact": str(raw.get("artifact", "")).strip(),
                        "approval": str(raw.get("approval", "")).strip(),
                        "blockers": str(raw.get("blockers", "")).strip(),
                    }
                    if all(entry.values()):
                        cleaned_items.append(entry)
                if cleaned_items and cleaned_workstreams:
                    return {
                        "execution_summary": execution_summary,
                        "key_question": key_question,
                        "workstreams": cleaned_workstreams,
                        "extracted_context": extracted_context,
                        "open_questions": [str(item).strip() for item in open_questions if str(item).strip()],
                        "execution_items": cleaned_items,
                        "output": synthesis,
                    }
    return None


def _extract_refresh_followups(body: dict[str, Any], expected_count: int) -> list[str] | None:
    output = body.get("output", [])
    for item in output:
        for content in item.get("content", []):
            if content.get("type") != "output_text" or "text" not in content:
                continue
            try:
                parsed = json.loads(content["text"])
            except json.JSONDecodeError:
                continue
            suggested_contexts = parsed.get("suggested_contexts")
            if not isinstance(suggested_contexts, list) or len(suggested_contexts) != expected_count:
                continue
            cleaned = [str(value or "").strip() or NO_ADDITIONAL_SUGGESTED_ITEM for value in suggested_contexts]
            return cleaned
    return None


def _fallback_node_build(
    problem: str,
    problem_details: str,
    problem_type: str,
    node_title: str,
    node_why: str,
    node_breakdown: str,
) -> dict[str, Any]:
    audience = _detect_audience(f"{problem} {problem_details}".lower())
    breakdown_parts = _parse_breakdown_lines(node_breakdown)
    subject = _infer_subject(problem, problem_details)
    key_question = f"What needs to be true for the {node_title.lower()} stage to support the final decision cleanly?"
    execution_summary = (
        f"The immediate goal is to translate the {node_title.lower()} node into concrete work that can be assigned, "
        "executed, and reviewed without ambiguity."
    )
    extracted_context = "\n".join([
        f"Problem link: {node_title} should support the core question '{problem}'.",
        f"Node role: {node_why}",
        f"Structured scope: {node_breakdown.splitlines()[0] if node_breakdown.splitlines() else node_breakdown}",
        f"Problem type lens: {PROBLEM_TYPE_LABELS.get(problem_type, PROBLEM_TYPE_LABELS[DEFAULT_PROBLEM_TYPE])}.",
    ])
    workstreams = [
        {
            "name": "Scope and Alignment",
            "purpose": f"Define what the {node_title.lower()} node must answer before deeper work starts.",
            "priority": "high",
            "completion_criteria": "Stakeholders agree on the node objective and decision use.",
        },
        {
            "name": "Execution Setup",
            "purpose": f"Gather the inputs, systems, and owners needed to complete the {node_title.lower()} node.",
            "priority": "high",
            "completion_criteria": "The team knows what to pull, from where, and who owns each dependency.",
        },
    ]
    execution_items = [
        {
            "action": f"Align on what {node_title.lower()} means for {audience.lower()} and confirm the decision use.",
            "owner": "Analytics lead",
            "collaborator": "Business owner",
            "source": "Problem statement and stakeholder notes",
            "artifact": f"Working definition for the {node_title.lower()} node",
            "approval": "Business owner sign-off",
            "blockers": "Ambiguous objective or conflicting stakeholder definitions.",
        },
        {
            "action": f"Gather the core inputs needed to complete the {node_title.lower()} node and document any missing evidence.",
            "owner": "Data analyst",
            "collaborator": "Data engineering or system owner",
            "source": "Internal systems, source tables, and existing documentation",
            "artifact": f"Source inventory for the {node_title.lower()} node",
            "approval": "Data access approval",
            "blockers": "Missing data access, unclear source definitions, or weak historical coverage.",
        },
    ]
    if node_title.lower() in {"decision", "impact", "takeaway", "result"}:
        execution_items.append(
            {
                "action": f"Review the {node_title.lower()} recommendation with the business team and pressure-test feasibility before finalizing.",
                "owner": "Business stakeholder",
                "collaborator": "Analytics lead",
                "source": "Draft recommendation and supporting evidence",
                "artifact": f"Decision-ready readout for {node_title.lower()}",
                "approval": "Leadership review",
                "blockers": "Budget, capacity, policy, or execution concerns remain unresolved.",
            }
        )
    else:
        execution_items.append(
            {
                "action": f"Translate the {node_title.lower()} findings into a reusable artifact for the next roadmap stage.",
                "owner": "Analytics lead",
                "collaborator": "Data analyst",
                "source": f"Completed {node_title.lower()} work products",
                "artifact": f"Reusable handoff for the next node after {node_title.lower()}",
                "approval": "No approval needed",
                "blockers": "Node output is still too generic to support downstream work.",
            }
        )

    if node_title.lower() == "data":
        execution_summary = (
            "The immediate goal is to identify the required data sources, confirm access, assess quality, and create "
            "a usable data-readiness package for churn analysis."
        )
        workstreams = [
            {
                "name": "Source Inventory",
                "purpose": "Map each required data type to a concrete system, table, and owner.",
                "priority": "high",
                "completion_criteria": "All core source systems, owners, and access paths are documented.",
            },
            {
                "name": "Data Quality Validation",
                "purpose": "Confirm the most important fields are reliable enough for analysis.",
                "priority": "high",
                "completion_criteria": "Core fields have been profiled and major risks are documented.",
            },
            {
                "name": "Analysis Dataset Build",
                "purpose": "Define the first analysis-ready table and the gaps that remain.",
                "priority": "high",
                "completion_criteria": "A documented dataset plan exists with required fields, keys, and known limitations.",
            },
        ]
        execution_items = [
            {
                "action": "List the required behavioral, value-related, historical, profile, and contextual datasets and map each one to a concrete system or table.",
                "owner": "Data analyst",
                "collaborator": "Data engineering or BI owner",
                "source": "CRM, billing, product telemetry, support logs, campaign systems",
                "artifact": "Data source inventory with system and table mapping",
                "approval": "Data access approval",
                "blockers": "Source ownership is unclear or access has not been provisioned.",
            },
            {
                "action": "Run initial data profiling on the shortlisted sources to check completeness, granularity, join keys, and usable history for churn analysis.",
                "owner": "Data analyst",
                "collaborator": "Analytics engineering",
                "source": "Candidate source tables and schema documentation",
                "artifact": "Data quality and profiling report",
                "approval": "No approval needed",
                "blockers": "Tables do not align on subscriber keys or history is too short for the use case.",
            },
            {
                "action": "Confirm with business stakeholders which fields are required now versus later so the first dataset pull is scoped to decision-relevant evidence.",
                "owner": "Analytics lead",
                "collaborator": "Retention lead",
                "source": "Roadmap node breakdown and stakeholder priorities",
                "artifact": "Prioritized data request list",
                "approval": "Business owner sign-off",
                "blockers": "Stakeholders want a broader data pull than the current timeline supports.",
            },
        ]
    open_questions = [
        f"What still needs clarification before the {node_title.lower()} node can be executed confidently?",
    ]
    if node_title.lower() == "data":
        plan = _build_data_plan(problem, problem_details, problem_type, subject, breakdown_parts)
        execution_summary = plan["execution_summary"]
        workstreams = plan["workstreams"]
        execution_items = plan["execution_items"]
        open_questions = plan["open_questions"]
    elif node_title.lower() == "metric":
        plan = _build_metric_plan(problem, problem_details, subject, breakdown_parts)
        execution_summary = plan["execution_summary"]
        workstreams = plan["workstreams"]
        execution_items = plan["execution_items"]
        open_questions = plan["open_questions"]
    elif breakdown_parts:
        plan = _build_breakdown_plan(node_title, subject, breakdown_parts)
        workstreams = plan["workstreams"]
        execution_items = plan["execution_items"]
        open_questions = plan["open_questions"]
    output = _fallback_node_output(
        node_title,
        node_why,
        key_question,
        extracted_context,
        execution_items,
    )
    return {
        "execution_summary": execution_summary,
        "key_question": key_question,
        "workstreams": workstreams,
        "extracted_context": extracted_context,
        "open_questions": open_questions,
        "execution_items": execution_items,
        "output": output,
    }


def _fallback_node_output(
    node_title: str,
    node_description: str,
    key_question: str,
    extracted_context: str,
    execution_items: list[dict[str, str]],
) -> dict[str, Any]:
    focus = key_question or node_description or f"What needs to happen in {node_title}?"
    action_summary = _summarize_execution_actions(execution_items)
    people_summary = _summarize_people_and_sources(execution_items)
    deliverable_summary = _summarize_deliverables_and_risks(execution_items)
    output = "\n".join([
        f"Focus: {focus}",
        f"What will be done: {action_summary}",
        f"Who and where: {people_summary}",
        f"Deliverable and risk: {deliverable_summary}",
    ])
    return {
        "output": output,
        "output_sections": {
            "focus": focus,
            "work_to_complete": action_summary,
            "owners_and_sources": people_summary,
            "risks_and_handoff": deliverable_summary,
        },
    }


def _parse_breakdown_lines(text: str) -> list[tuple[str, str]]:
    parts = []
    for raw in str(text).splitlines():
        line = raw.strip().lstrip("-").strip()
        if not line:
            continue
        if ":" in line:
            label, detail = line.split(":", 1)
            parts.append((label.strip(), detail.strip()))
        else:
            parts.append((line, line))
    return parts


def _infer_subject(problem: str, problem_details: str) -> str:
    combined = f"{problem} {problem_details}".lower()
    if "subscriber" in combined:
        return "subscribers"
    if "customer" in combined:
        return "customers"
    if "user" in combined:
        return "users"
    if "merchant" in combined:
        return "merchants"
    if "account" in combined:
        return "accounts"
    return "the target population"


def _build_data_plan(
    problem: str,
    problem_details: str,
    problem_type: str,
    subject: str,
    breakdown_parts: list[tuple[str, str]],
) -> dict[str, Any]:
    system_hint = _detect_data_sources(problem, problem_details)
    if not breakdown_parts:
        breakdown_parts = [
            ("Behavioral data", f"Usage and activity signals for {subject}"),
            ("Value-related data", f"Commercial value, spend, revenue, or margin for {subject}"),
            ("Historical outcome data", f"Past outcomes, interventions, or responses for {subject}"),
        ]

    scope_items = []
    for label, detail in breakdown_parts[:5]:
        scope_items.append({
            "action": f"Define the required fields for {label.lower()} and map them to the best available source for {subject}.",
            "owner": "Data analyst",
            "collaborator": "Data engineering or system owner",
            "source": system_hint,
            "artifact": f"{label} source map with required fields and join keys",
            "approval": "Data access approval" if "telemetry" in system_hint.lower() or "billing" in system_hint.lower() else "No approval needed",
            "blockers": f"Field definitions for {label.lower()} are unclear or the source owner has not confirmed availability.",
        })

    profiling_item = {
        "action": "Run data profiling on the shortlisted sources to validate completeness, freshness, segment coverage, and joinability before building the first analysis dataset.",
        "owner": "Data analyst",
        "collaborator": "Analytics engineering",
        "source": system_hint,
        "artifact": "Data profiling report with quality risks and recommended fixes",
        "approval": "No approval needed",
        "blockers": "Join keys are inconsistent across systems or the history window is too short for the target analysis.",
    }
    alignment_item = {
        "action": "Review the source map and profiling findings with the business owner so the first data pull is scoped to the decision-critical evidence only.",
        "owner": "Analytics lead",
        "collaborator": "Business owner",
        "source": "Roadmap node breakdown, source inventory, and profiling report",
        "artifact": "Prioritized data request and first-pass analysis dataset plan",
        "approval": "Business owner sign-off",
        "blockers": "Stakeholders ask for more data than the current timeline, access, or engineering capacity supports.",
    }
    execution_items = (scope_items + [profiling_item, alignment_item])[:6]
    workstreams = [
        {
            "name": "Data Scope Translation",
            "purpose": "Turn each data bucket in the roadmap into a concrete request with fields, systems, and owners.",
            "priority": "high",
            "completion_criteria": "Each required data bucket is mapped to a source, owner, and join path.",
        },
        {
            "name": "Data Readiness Validation",
            "purpose": "Pressure-test whether the shortlisted sources are reliable enough for the intended analysis.",
            "priority": "high",
            "completion_criteria": "The team has a profiling view of completeness, freshness, and key data risks.",
        },
        {
            "name": "Decision-Ready Dataset Plan",
            "purpose": "Narrow the data pull to what the business decision actually needs now.",
            "priority": "high",
            "completion_criteria": "A prioritized dataset plan is approved for the first analysis pass.",
        },
    ]
    open_questions = [
        "What is the official outcome definition and look-forward window for this case?",
        f"Which systems contain the most reliable identifier for linking {subject} across sources?",
        "Which contextual sources are available immediately and which require separate access or engineering work?",
    ]
    execution_summary = (
        "The data node should translate the roadmap buckets into a concrete source plan, validate data readiness, "
        "and produce a first-pass dataset request that the analyst team can execute without ambiguity."
    )
    return {
        "execution_summary": execution_summary,
        "workstreams": workstreams,
        "execution_items": execution_items,
        "open_questions": open_questions,
    }


def _build_metric_plan(problem: str, problem_details: str, subject: str, breakdown_parts: list[tuple[str, str]]) -> dict[str, Any]:
    if not breakdown_parts:
        breakdown_parts = [
            ("Business metric", f"Top business value metric for {subject}"),
            ("Decision metric", "Targeting or prioritization rule"),
            ("Model metric", "Technical score used to judge model usefulness"),
        ]
    execution_items = []
    for label, _detail in breakdown_parts[:4]:
        execution_items.append({
            "action": f"Define the exact {label.lower()} to use, including formula, time window, baseline, and decision relevance.",
            "owner": "Analytics lead",
            "collaborator": "Business owner",
            "source": "Problem statement, finance definitions, and existing reporting logic",
            "artifact": f"{label} definition sheet with formula and business interpretation",
            "approval": "Business owner sign-off" if "business" in label.lower() or "decision" in label.lower() else "No approval needed",
            "blockers": f"The team has not aligned on what success means for the {label.lower()} yet.",
        })
    execution_items.append({
        "action": "Build a lightweight scorecard or dashboard mock so stakeholders can see how the chosen metrics will be reviewed during execution.",
        "owner": "Data analyst",
        "collaborator": "BI or analytics engineering",
        "source": "Agreed metric definitions and historical baseline cuts",
        "artifact": "Metric scorecard mockup with baseline and target view",
        "approval": "No approval needed",
        "blockers": "Historical baselines are inconsistent across reports.",
    })
    workstreams = [
        {
            "name": "Metric Definition",
            "purpose": "Lock the formulas, windows, and business meaning of each metric bucket.",
            "priority": "high",
            "completion_criteria": "Business, decision, and technical metrics are clearly defined and non-conflicting.",
        },
        {
            "name": "Baseline Alignment",
            "purpose": "Anchor the chosen metrics to current-state performance and target thresholds.",
            "priority": "high",
            "completion_criteria": "A baseline and target range exists for the core metrics.",
        },
        {
            "name": "Reporting Setup",
            "purpose": "Show how the metrics will be reviewed once the analysis starts.",
            "priority": "medium",
            "completion_criteria": "A review-ready scorecard or dashboard mock exists.",
        },
    ]
    open_questions = [
        "Which metric should drive the final business decision if the business and technical metrics disagree?",
        "What target threshold or improvement level would count as success for leadership?",
    ]
    return {
        "execution_summary": "The metric node should lock the exact success measures, tie them to a baseline, and produce a review-ready scorecard for the rest of the roadmap.",
        "workstreams": workstreams,
        "execution_items": execution_items[:6],
        "open_questions": open_questions,
    }


def _build_breakdown_plan(node_title: str, subject: str, breakdown_parts: list[tuple[str, str]]) -> dict[str, Any]:
    execution_items = []
    for label, detail in breakdown_parts[:4]:
        execution_items.append({
            "action": f"Translate {label.lower()} into a concrete workstream by clarifying what must be reviewed, who should be involved, and what evidence is needed.",
            "owner": "Analytics lead",
            "collaborator": "Relevant business owner",
            "source": detail or "Problem statement and roadmap breakdown",
            "artifact": f"{label} working note with owners, inputs, and next-step decision",
            "approval": "No approval needed",
            "blockers": f"The current {label.lower()} scope is still too broad to assign cleanly.",
        })
    if execution_items:
        execution_items.append({
            "action": f"Synthesize the {node_title.lower()} work into one handoff that the next roadmap stage can use without repeating discovery work.",
            "owner": "Data analyst",
            "collaborator": "Analytics lead",
            "source": f"Completed {node_title.lower()} workstreams",
            "artifact": f"{node_title} handoff brief",
            "approval": "No approval needed",
            "blockers": "The node output is still phrased as summary rather than executable work.",
        })
    workstreams = [
        {
            "name": "Node Translation",
            "purpose": f"Convert the {node_title.lower()} breakdown into concrete tasks, owners, and evidence needs.",
            "priority": "high",
            "completion_criteria": f"Each major {node_title.lower()} bucket is represented by executable work.",
        },
        {
            "name": "Handoff Readiness",
            "purpose": f"Package the {node_title.lower()} node so the next stage can start with minimal rework.",
            "priority": "medium",
            "completion_criteria": "The node has a clean output, owners, and unresolved questions clearly documented.",
        },
    ]
    open_questions = [
        f"Which part of the {node_title.lower()} node still lacks a named owner or source?",
    ]
    return {
        "workstreams": workstreams,
        "execution_items": execution_items[:6],
        "open_questions": open_questions,
    }


def _detect_data_sources(problem: str, problem_details: str) -> str:
    combined = f"{problem} {problem_details}".lower()
    systems = []
    for candidate in ["CRM", "billing", "telemetry", "support logs", "usage logs", "campaign systems", "product analytics", "finance reporting"]:
        if candidate.lower() in combined:
            systems.append(candidate)
    if systems:
        return ", ".join(systems)
    return "CRM, billing, product telemetry, support logs, campaign systems"


def _summarize_execution_actions(execution_items: list[dict[str, str]]) -> str:
    actions = [item.get("action", "").strip().rstrip(".") for item in execution_items if item.get("action")]
    if not actions:
        return "No execution items captured yet."
    top_actions = actions[:3]
    return "; ".join(top_actions) + ("." if top_actions else "")


def _summarize_people_and_sources(execution_items: list[dict[str, str]]) -> str:
    owners = []
    collaborators = []
    sources = []
    for item in execution_items:
        owner = item.get("owner", "").strip()
        collaborator = item.get("collaborator", "").strip()
        source = item.get("source", "").strip()
        if owner and owner not in owners:
            owners.append(owner)
        if collaborator and collaborator not in collaborators:
            collaborators.append(collaborator)
        if source and source not in sources:
            sources.append(source)
    if not owners and not collaborators and not sources:
        return "Owner, collaborators, and sources are not set yet."
    people = ", ".join((owners + collaborators)[:4]) or "Team to be defined"
    source_text = "; ".join(sources[:2]) or "sources to be confirmed"
    return f"Involve {people} and use {source_text}."


def _summarize_deliverables_and_risks(execution_items: list[dict[str, str]]) -> str:
    artifacts = []
    approvals = []
    blockers = []
    for item in execution_items:
        artifact = item.get("artifact", "").strip()
        approval = item.get("approval", "").strip()
        blocker = item.get("blockers", "").strip()
        if artifact and artifact not in artifacts:
            artifacts.append(artifact)
        if approval and approval not in approvals:
            approvals.append(approval)
        if blocker and blocker not in blockers:
            blockers.append(blocker)
    artifact_text = ", ".join(artifacts[:2]) or "required artifacts to be defined"
    approval_text = ", ".join(approvals[:2]) or "approvals to be defined"
    blocker_text = blockers[0] if blockers else "No blocker identified yet."
    return f"Create {artifact_text}; approvals: {approval_text}; main risk: {blocker_text}"


def _normalize_roadmap(raw_roadmap: list[Any], problem: str, problem_details: str) -> list[dict[str, str]]:
    cleaned = []
    for item in raw_roadmap:
        if isinstance(item, str) and item.strip():
            title = item.strip()
            cleaned.append({
                "title": title,
                "why": NODE_WHY.get(title, f"Clarifies why {title.lower()} should be considered in the analysis flow."),
                "breakdown": _fallback_breakdown(problem, problem_details, title),
                "suggested_context": _fallback_suggested_context(problem, problem_details, title),
            })
            continue
        if isinstance(item, dict):
            title = str(item.get("title", "")).strip()
            why = str(item.get("why", "")).strip()
            breakdown = str(item.get("breakdown", "")).strip()
            suggested_context = str(item.get("suggested_context", "")).strip()
            if title:
                cleaned.append({
                    "title": title,
                    "why": why or NODE_WHY.get(title, f"Clarifies why {title.lower()} should be considered in the analysis flow."),
                    "breakdown": breakdown or _fallback_breakdown(problem, problem_details, title),
                    "suggested_context": suggested_context or _fallback_suggested_context(problem, problem_details, title),
                })
    return cleaned


def _align_roadmap_to_template(raw_roadmap: list[Any], problem: str, problem_details: str, problem_type: str) -> list[dict[str, str]]:
    normalized = _normalize_roadmap(raw_roadmap, problem, problem_details)
    by_title = {item["title"].lower(): item for item in normalized}
    aligned = []
    for title in ROADMAP_TEMPLATES.get(problem_type, ROADMAP_TEMPLATES[DEFAULT_PROBLEM_TYPE]):
        existing = by_title.get(title.lower(), {})
        aligned.append({
            "title": title,
            "why": existing.get("why") or NODE_WHY[title],
            "breakdown": existing.get("breakdown") or _fallback_breakdown(problem, problem_details, title),
            "suggested_context": existing.get("suggested_context") or _fallback_suggested_context(problem, problem_details, title),
        })
    return aligned


def _fallback_polish_node(problem: str, problem_details: str, draft: str, existing_titles: list[str]) -> dict[str, str]:
    normalized = " ".join(str(draft).split()).strip()
    if not normalized:
        return {
            "title": "New Node",
            "why": "Adds a custom stage to capture an extra part of the decision process.",
            "breakdown": _fallback_breakdown(problem, problem_details, "New Node"),
            "suggested_context": _fallback_suggested_context(problem, problem_details, "New Node"),
            "recommendation": "recommended",
            "advisory": "This looks like a reasonable additional stage if you need to cover something beyond the default framework.",
        }

    words = normalized.replace("/", " ").replace("-", " ").split()
    short_title = " ".join(words[:3]).title() if words else "New Node"
    duplicate_title = _find_existing_title_overlap(short_title, existing_titles)
    recommendation = "recommended"
    advisory = "This looks like a useful extension to the roadmap and can be added if you want an explicit extra step."
    if duplicate_title:
        recommendation = "caution"
        advisory = (
            f"This proposed step appears to overlap with '{duplicate_title}'. "
            "It may already be covered by the current roadmap, so only add it if you want to separate that work more explicitly."
        )
    elif len(words) <= 1 and short_title.lower() not in {"risk", "scope", "ops", "qa"}:
        recommendation = "caution"
        advisory = (
            "This proposed step still feels broad or ambiguous. It may not add a clear new stage to the roadmap yet, "
            "so refine the intent before creating it."
        )
    return {
        "title": short_title,
        "why": f"Adds a focused stage for {normalized.lower()} so the roadmap covers that consideration explicitly.",
        "breakdown": _fallback_breakdown(problem, problem_details, short_title),
        "suggested_context": _fallback_suggested_context(problem, problem_details, short_title),
        "recommendation": recommendation,
        "advisory": advisory,
    }


def _find_existing_title_overlap(candidate: str, existing_titles: list[str]) -> str:
    candidate_tokens = {token for token in re.split(r"[^a-zA-Z0-9]+", candidate.lower()) if token}
    for title in existing_titles:
        existing = str(title).strip()
        if not existing:
            continue
        if existing.lower() == candidate.lower():
            return existing
        existing_tokens = {token for token in re.split(r"[^a-zA-Z0-9]+", existing.lower()) if token}
        if candidate_tokens and existing_tokens and candidate_tokens.issubset(existing_tokens):
            return existing
        if candidate_tokens and existing_tokens and existing_tokens.issubset(candidate_tokens):
            return existing
    return ""


def _build_fallback_roadmap(problem: str, problem_details: str, problem_type: str) -> list[dict[str, str]]:
    return [{
        "title": title,
        "why": NODE_WHY[title],
        "breakdown": _fallback_breakdown(problem, problem_details, title),
        "suggested_context": _fallback_suggested_context(problem, problem_details, title),
    } for title in ROADMAP_TEMPLATES.get(problem_type, ROADMAP_TEMPLATES[DEFAULT_PROBLEM_TYPE])]


def _fallback_refresh_roadmap_followups(
    problem: str,
    problem_details: str,
    roadmap: list[dict[str, Any]],
) -> list[str]:
    refreshed: list[str] = []
    for index, raw_node in enumerate(roadmap):
        next_prompt = _fallback_agent_review_prompt(problem, problem_details, roadmap, index)
        refreshed.append(next_prompt or NO_ADDITIONAL_SUGGESTED_ITEM)
    return refreshed


def _postprocess_followup_prompts(
    problem: str,
    problem_details: str,
    roadmap: list[dict[str, Any]],
    prompts: list[str],
) -> list[str]:
    working_roadmap: list[dict[str, Any]] = []
    reviewed: list[str] = []
    for index, raw_node in enumerate(roadmap):
        node = dict(raw_node) if isinstance(raw_node, dict) else {}
        proposed = str(prompts[index] if index < len(prompts) else node.get("suggested_context", "")).strip()
        node["suggested_context"] = proposed or str(node.get("suggested_context", "")).strip() or NO_ADDITIONAL_SUGGESTED_ITEM
        working_roadmap.append(node)
        final_prompt = _fallback_agent_review_prompt(problem, problem_details, working_roadmap, index)
        final_prompt = final_prompt or NO_ADDITIONAL_SUGGESTED_ITEM
        reviewed.append(final_prompt)
        working_roadmap[index]["suggested_context"] = final_prompt
    return reviewed


def _build_followup_coverage_text(problem_details: str, nodes: list[dict[str, Any]]) -> str:
    parts = [problem_details or ""]
    for node in nodes:
        if not isinstance(node, dict):
            continue
        build_log = node.get("build_log", {})
        if isinstance(build_log, dict):
            parts.extend([
                str(build_log.get("execution_summary", "")).strip(),
                str(build_log.get("key_question", "")).strip(),
                str(build_log.get("extracted_context", "")).strip(),
            ])
            raw_open_questions = build_log.get("open_questions", [])
            if isinstance(raw_open_questions, list):
                parts.extend(str(item).strip() for item in raw_open_questions if str(item).strip())
            raw_workstreams = build_log.get("workstreams", [])
            if isinstance(raw_workstreams, list):
                for item in raw_workstreams:
                    if isinstance(item, dict):
                        parts.extend([
                            str(item.get("name", "")).strip(),
                            str(item.get("purpose", "")).strip(),
                            str(item.get("completion_criteria", "")).strip(),
                        ])
                    else:
                        text = str(item).strip()
                        if text:
                            parts.append(text)
        raw_threads = node.get("follow_up_threads", [])
        if not isinstance(raw_threads, list):
            continue
        for thread in raw_threads:
            if not isinstance(thread, dict):
                continue
            prompt = str(thread.get("prompt", "")).strip()
            if prompt:
                parts.append(prompt)
            raw_responses = thread.get("responses", [])
            if not isinstance(raw_responses, list):
                continue
            for response in raw_responses:
                if not isinstance(response, dict):
                    continue
                response_text = str(response.get("text", "")).strip()
                if response_text:
                    parts.append(response_text)
    return "\n".join(part for part in parts if str(part).strip())


def _fallback_agent_review_prompt(
    problem: str,
    problem_details: str,
    roadmap: list[dict[str, Any]],
    index: int,
) -> str:
    if index < 0 or index >= len(roadmap):
        return NO_ADDITIONAL_SUGGESTED_ITEM
    node = roadmap[index] if isinstance(roadmap[index], dict) else {}
    title = str(node.get("title", "")).strip()
    if not title:
        return NO_ADDITIONAL_SUGGESTED_ITEM

    global_context = _build_followup_coverage_text(problem_details, roadmap)
    coverage = _infer_context_coverage(f"{problem.lower()} {global_context.lower()}")

    if title.lower() == "metric":
        if coverage["metric_family"] and coverage["decision"] and coverage["horizon"] and coverage["success"]:
            return NO_ADDITIONAL_SUGGESTED_ITEM

    if title.lower() == "objective":
        if coverage["decision"] and coverage["horizon"] and coverage["success"]:
            return NO_ADDITIONAL_SUGGESTED_ITEM

    if title.lower() == "segmentation":
        if coverage["segments"]:
            return NO_ADDITIONAL_SUGGESTED_ITEM

    if title.lower() == "drivers":
        if coverage["drivers"]:
            return NO_ADDITIONAL_SUGGESTED_ITEM

    if title.lower() == "data":
        if coverage["data"]:
            return NO_ADDITIONAL_SUGGESTED_ITEM

    if title.lower() == "model":
        model_objective_present = any(
            token in global_context.lower()
            for token in [
                "uplift",
                "ranking",
                "prediction",
                "explanation",
                "uplift modeling",
                "churn prediction",
                "risk model",
            ]
        )
        model_action_present = any(
            token in global_context.lower()
            for token in [
                "trigger targeted retention interventions",
                "targeted retention interventions",
                "retention interventions",
                "offers, bundles, outreach",
                "outreach",
                "what action will use the model",
                "action will use the model",
                "use the model",
                "target action",
                "prioritize customers",
                "who will respond",
            ]
        )
        descriptive_no_model = any(
            token in global_context.lower()
            for token in [
                "no model yet",
                "start descriptively",
                "before deciding if prediction is needed",
                "before deciding if a model is needed",
            ]
        )
        if descriptive_no_model:
            return NO_ADDITIONAL_SUGGESTED_ITEM
        if model_objective_present and model_action_present:
            return NO_ADDITIONAL_SUGGESTED_ITEM

    if title.lower() == "decision":
        if coverage["actions"]:
            return NO_ADDITIONAL_SUGGESTED_ITEM

    if title.lower() == "result":
        if coverage["result"]:
            return NO_ADDITIONAL_SUGGESTED_ITEM

    if title.lower() == "takeaway":
        if coverage["takeaway"]:
            return NO_ADDITIONAL_SUGGESTED_ITEM

    return _fallback_suggested_context(problem, global_context, title)


def _build_problem_assessment(
    problem: str,
    problem_details: str,
    problem_type: str,
    inferred_problem_type: str,
) -> tuple[str, str]:
    label = PROBLEM_TYPE_LABELS.get(problem_type, PROBLEM_TYPE_LABELS[DEFAULT_PROBLEM_TYPE])
    audience = _detect_audience(f"{problem} {problem_details}".lower())
    inferred_label = PROBLEM_TYPE_LABELS.get(inferred_problem_type, label)
    explanation = _problem_type_explanation(problem, problem_details, problem_type, inferred_problem_type)
    recap = [
        f"Problem type: {label}",
        f"Decision lens: {_assessment_decision_lens(problem_type)}",
        f"Interview recap: {_assessment_recap(problem, problem_details, audience)}",
        f"Agent view: {inferred_label}",
        f"Framework implication: Start with {_template_intro(problem_type)} before adding custom nodes if needed.",
    ]
    return explanation, "\n".join(recap)


def _classify_problem_type(problem: str, problem_details: str = "") -> str:
    combined = f"{problem} {problem_details}".lower()
    if any(term in combined for term in ["a/b", "ab test", "experiment", "incrementality", "lift test", "causal", "treatment", "control", "holdout"]):
        return "experiment_causal_question"
    if any(term in combined for term in ["optimize", "allocation", "budget", "capacity", "scheduling", "routing", "inventory", "operations", "resource", "constraint"]):
        return "operational_optimization"
    descriptive_cues = [
        "why ",
        "why is",
        "why are",
        "what happened",
        "understand",
        "root cause",
        "root causes",
        "increase in",
        "decrease in",
        "seen a",
        "has seen a",
        "especially in",
        "concerned because",
        "not translating into",
    ]
    predictive_cues = [
        "predict",
        "prediction",
        "forecast",
        "risk score",
        "propensity",
        "uplift",
        "rank",
        "ranking",
        "scoring",
        "who to target",
        "target customers",
        "prioritize customers",
        "prioritise customers",
        "who will churn",
        "which customers",
        "intervention",
    ]
    if any(term in combined for term in descriptive_cues) and not any(term in combined for term in predictive_cues):
        return "descriptive_analysis"
    if any(term in combined for term in ["predict", "prediction", "forecast", "churn", "risk", "propensity", "uplift", "rank", "ranking", "scoring", "who to target"]):
        return "predictive_modeling"
    return "descriptive_analysis"


def _fallback_suggested_context(problem: str, problem_details: str, title: str) -> str:
    combined = f"{' '.join(problem.lower().split())} {' '.join(problem_details.lower().split())}".strip()
    audience = _detect_audience(combined)
    coverage = _infer_context_coverage(combined)
    if _is_context_sufficient(combined, title):
        return NO_ADDITIONAL_SUGGESTED_ITEM
    if title.lower() == "objective":
        missing = []
        if not coverage["decision"]:
            missing.append("business decision")
        if not coverage["horizon"]:
            missing.append("time horizon")
        if not coverage["success"]:
            missing.append("success definition")
        if not missing:
            return NO_ADDITIONAL_SUGGESTED_ITEM
        return f"What exact {', '.join(missing)} should be added so the objective is unambiguous?"
    if title.lower() == "metric":
        if coverage["metric_family"]:
            return NO_ADDITIONAL_SUGGESTED_ITEM
        if coverage["horizon"] and coverage["success"]:
            return "Which business metric, decision metric, and model metric should be tracked separately so the scorecard is explicit?"
        if coverage["decision"] and (coverage["horizon"] or coverage["success"]):
            return f"Which business metric, decision metric, and model metric should we define for {audience.lower()} so the metric scorecard is complete?"
    prompts = {
        "objective": "What exact business decision, time horizon, and success definition should be added so the objective is unambiguous?",
        "metric": f"What business goal, target horizon, and success threshold should we add for {audience.lower()} to tighten the metric definition?",
        "segmentation": "Which segment cuts matter most here, such as customer type, value tier, geography, lifecycle stage, or product group?",
        "drivers": "What suspected causes, lifecycle stages, or operational frictions should be added to the problem statement so the driver tree is sharper?",
        "data": "What systems, time window, segment definitions, or unavailable data sources should be added so the data scope is more concrete?",
        "model": "Should the problem statement clarify whether the goal is ranking, prediction, uplift, or explanation, and what action will use the model?",
        "hypotheses": "What causal stories, competing explanations, or business hypotheses should be stated explicitly before testing impact?",
        "experiment design": "What treatment, control, randomization unit, timing, and guardrails should be added so the experiment design is concrete?",
        "constraints": "What budget, capacity, policy, operational, or timing constraints should be added so optimization is realistic?",
        "decision": "What intervention options, budget limits, capacity constraints, or targeting rules should be added so the decision logic is clearer?",
        "impact": "What upside, cost, trade-off, or service-level target should be stated so impact can be sized credibly?",
        "result": "What impact expectation, ROI threshold, or stakeholder outcome would help define a more concrete result?",
        "takeaway": "What audience, final recommendation style, or executive concern should be added so the takeaway lands more cleanly?",
    }
    return prompts.get(title.lower(), f"What extra context should be added to the problem statement so the {title.lower()} node becomes more precise?")


def _infer_context_coverage(combined_text: str) -> dict[str, bool]:
    return {
        "decision": any(token in combined_text for token in [
            "business decision", "decision to support", "whether to invest", "whether to launch",
            "whether to continue", "targeted retention program", "prioritize", "who to target",
        ]),
        "horizon": any(token in combined_text for token in [
            "time horizon", "target horizon", "next 90 days", "90 days", "6-9 months", "6–9 months",
            "6-12 months", "6–12 months", "2-3 quarters", "2–3 quarters", "next quarter",
        ]),
        "success": any(token in combined_text for token in [
            "success definition", "success threshold", "reduce monthly churn", "retention by", "improve 90-day retention",
            "improve 90 day retention", "without materially reducing", "overall arpu", "margin", "unit economics",
            "roi", "payback",
        ]),
        "metric_family": any(token in combined_text for token in [
            "business metric", "decision metric", "model metric", "auc", "pr-auc", "pr auc", "recall", "calibration",
        ]),
        "segments": any(token in combined_text for token in [
            "segment", "tenure bucket", "tenure buckets", "arpu tier", "arpu tiers", "geography",
            "product type", "customer type", "lifecycle", "mid-tenure", "mid tenure",
        ]),
        "drivers": any(token in combined_text for token in [
            "pricing friction", "promo expiration", "promo expiry", "competitor", "under-utilization",
            "under utilization", "network degradation", "latency", "outages", "customer service friction",
            "repeat calls", "usage decline", "complaints", "driver", "root cause",
        ]),
        "data": any(token in combined_text for token in [
            "crm", "billing", "network telemetry", "support systems", "support tickets", "product usage",
            "behavioral data", "value-related data", "historical outcome data", "profile data",
            "observation", "historical backtest", "time window", "data source",
        ]),
        "actions": any(token in combined_text for token in [
            "intervention options", "discount", "retention offer", "bundle", "service fix", "outreach",
            "engagement", "targeting logic", "budget", "capacity", "policy rules", "who to target",
        ]),
        "result": any(token in combined_text for token in [
            "expected impact", "roi", "payback", "incremental retained revenue", "result",
            "cohort retention", "reduction in", "impact expectation", "stakeholder outcome",
        ]),
        "takeaway": any(token in combined_text for token in [
            "executive takeaway", "what the company should do", "next quarter", "recommendation",
            "audience", "ceo", "cmo", "head of retention", "risks", "trade-offs", "trade offs",
        ]),
    }


def _is_context_sufficient(combined_text: str, title: str) -> bool:
    checks = {
        "objective": [["business goal", "maximize", "reduce avoidable churn", "objective"], ["90 days", "6-12 months", "time horizon", "next quarter"], ["success threshold", "guardrail", "constraint", "unit economics"]],
        "metric": [["business goal", "maximize", "unit economics"], ["90 days", "6-12 months", "target horizon", "retention by +3pp"], ["success threshold", "retention cost", "ltv", "reduce monthly churn"]],
        "segmentation": [["tenure buckets", "lifecycle", "mid-tenure", "customer type"], ["arpu", "value tier", "geography", "product type"]],
        "drivers": [["lifecycle stages", "mid-tenure", "onboarding", "promo expiry"], ["pricing friction", "competitor", "usage decline", "complaints"], ["network degradation", "customer service", "installation delays"]],
        "data": [["crm", "billing", "network telemetry", "support systems"], ["observation", "prediction", "historical backtest", "time window"], ["tenure buckets", "arpu", "geography", "product type"]],
        "model": [["uplift", "churn prediction", "ranking", "explanation layer"], ["limited budget", "prioritize customers for intervention"]],
        "hypotheses": [["pricing", "service", "network", "experience"], ["competitor", "promotion", "value mismatch", "friction"]],
        "experiment design": [["treatment", "control", "holdout", "randomization"], ["guardrail", "duration", "sample size", "eligibility"]],
        "constraints": [["budget", "capacity", "policy rules", "timing"], ["call center", "technician", "margin", "service level"]],
        "decision": [["intervention options", "discount", "service fix", "engagement"], ["budget", "capacity", "policy rules", "targeting logic"]],
        "impact": [["incremental", "roi", "payback", "cost"], ["saved", "service level", "capacity", "trade-off"]],
        "result": [["incremental retained revenue", "roi", "payback period"], ["high-value churn", "cohort retention", "threshold"]],
        "takeaway": [["ceo", "cmo", "head of retention", "audience"], ["where churn is coming from", "why it", "what to do"], ["expected impact", "risks", "trade-offs", "prioritization"]],
    }
    groups = checks.get(title.lower(), [])
    matched = sum(1 for group in groups if any(token in combined_text for token in group))
    return bool(groups) and matched >= max(2, len(groups) - 1)

def _fallback_breakdown(problem: str, problem_details: str, title: str) -> str:
    combined_text = f"{' '.join(problem.lower().split())} {' '.join(problem_details.lower().split())}".strip()
    audience = _detect_audience(combined_text)
    title_key = title.lower()
    if title_key == "objective":
        return "\n".join([f"Business ask: {_objective_ask(combined_text)}", f"Decision to support: {_objective_decision(combined_text)}", f"Scope: {_objective_scope(combined_text, audience)}", "Output: A crisp problem statement that defines what we are solving and what good looks like."])
    if title_key == "metric":
        return "\n".join([f"Business metric: {_business_metric(combined_text, audience)}", f"Decision metric: {_decision_metric(combined_text, audience)}", f"Model metric: {_model_metric(combined_text)}", f"Output: A clear scorecard for '{problem or 'this problem'}' that aligns business impact, targeting, and model quality."])
    if title_key == "segmentation":
        return "\n".join([f"Value segments: {_segmentation_value(combined_text, audience)}", f"Lifecycle segments: {_segmentation_lifecycle(combined_text, audience)}", f"Structural segments: {_segmentation_structure(combined_text)}", "Output: A segmentation lens that makes patterns comparable and actions more targeted."])
    if title_key == "drivers":
        return "\n".join([f"Behavioral drivers: {_behavioral_drivers(combined_text, audience)}", f"Commercial drivers: {_commercial_drivers(combined_text)}", f"Operational drivers: {_operational_drivers(combined_text)}", "Output: A MECE driver tree showing which levers most likely move the core metric."])
    if title_key == "data":
        return "\n".join([f"Behavioral data: {_behavioral_data(combined_text, audience)}", f"Value-related data: {_value_data(combined_text, audience)}", f"Historical outcome data: {_historical_data(combined_text)}", f"Profile data: {_profile_data(combined_text, audience)}", f"Contextual / structural data: {_contextual_data(combined_text)}"])
    if title_key == "hypotheses":
        return "\n".join([f"Behavior hypothesis: {_hypothesis_behavior(combined_text, audience)}", f"Commercial hypothesis: {_hypothesis_commercial(combined_text)}", f"Experience hypothesis: {_hypothesis_experience(combined_text)}", "Output: A short testable hypothesis set that can be validated with causal evidence."])
    if title_key == "model":
        return "\n".join([f"Problem framing: {_model_framing(combined_text)}", f"Candidate approach: {_model_build(combined_text)}", f"Validation: {_model_validation(combined_text)}", "Decision use: Translate model output into prioritization or intervention thresholds."])
    if title_key == "experiment design":
        return "\n".join([f"Treatment setup: {_experiment_treatment(combined_text)}", f"Measurement plan: {_experiment_measurement(combined_text)}", f"Validity guardrails: {_experiment_guardrails(combined_text)}", "Output: A credible design for estimating incremental impact, not just correlation."])
    if title_key == "constraints":
        return "\n".join([f"Budget limits: {_constraint_budget(combined_text)}", f"Operational limits: {_constraint_operations(combined_text)}", f"Policy limits: {_constraint_policy(combined_text)}", "Output: A realistic action space that respects what the business can actually execute."])
    if title_key == "decision":
        return "\n".join([f"Targeting rule: {_targeting_rule(combined_text, audience)}", f"Prioritization: {_prioritization_rule(combined_text)}", f"Action rule: {_decision_use(combined_text, audience)}", "Governance: Define thresholds, ownership, and guardrails before rollout."])
    if title_key == "impact":
        return "\n".join([f"Value upside: {_impact_value(combined_text)}", f"Cost trade-off: {_impact_cost(combined_text)}", f"Operational effect: {_impact_operations(combined_text)}", "Output: A business case sizing the likely upside and the key execution trade-offs."])
    if title_key == "result":
        return "\n".join([f"Business impact: {_result_focus(combined_text)}", f"Segment view: {_segment_view(combined_text, audience)}", "Uncertainty: Show downside risk, confidence level, and major sensitivity assumptions.", "Output: A concise results page linking expected lift to the decision recommendation."])
    if title_key == "takeaway":
        return "\n".join([f"Bottom line: Summarize the best path forward for {audience}.", "Recommendation: State the clearest action and why it wins versus alternatives.", "Caveats: State the biggest assumptions, blind spots, and operational risks.", "Next step: Name the immediate decision or experiment to run."])
    return "\n".join([f"Key question: How does {title.lower()} help answer '{problem or 'this problem'}'?", f"What to define: Clarify the role of {title.lower()} for {audience}.", "Output: A concrete artifact that makes this stage usable in the final recommendation."])


def _detect_audience(problem_text: str) -> str:
    if "tmt" in problem_text:
        return "TMT users"
    if "enterprise" in problem_text:
        return "enterprise users"
    if "subscriber" in problem_text or "subscription" in problem_text:
        return "subscribers"
    if "customer" in problem_text:
        return "customers"
    if "user" in problem_text:
        return "users"
    return "the target segment"


def _assessment_decision_lens(problem_type: str) -> str:
    if problem_type == "descriptive_analysis":
        return "Understand what is happening, where it is happening, and what likely explains it."
    if problem_type == "experiment_causal_question":
        return "Estimate incremental impact credibly before scaling an action."
    if problem_type == "operational_optimization":
        return "Choose the best action mix under real-world constraints."
    return "Prioritize whom to target or what to predict so the business can act."


def _assessment_recap(problem: str, problem_details: str, audience: str) -> str:
    if "churn" in problem.lower():
        return f"We need to understand why churn is moving for {audience.lower()}, identify where the risk concentrates, and translate that into a prioritization and intervention plan."
    if "revenue" in problem.lower() or "pricing" in problem.lower():
        return "We need to link the commercial question to a clear value metric, identify the most important segments, and determine which action materially improves revenue or margin."
    if problem_details:
        return "We should restate the objective, isolate the decision to support, and make sure the framework matches the business context already provided."
    return "We should restate the ask in business terms, identify the right evidence, and build a framework that leads cleanly to a decision."


def _template_intro(problem_type: str) -> str:
    return " -> ".join(ROADMAP_TEMPLATES.get(problem_type, ROADMAP_TEMPLATES[DEFAULT_PROBLEM_TYPE])[:3])


def _problem_type_explanation(
    problem: str,
    problem_details: str,
    selected_problem_type: str,
    inferred_problem_type: str,
) -> str:
    selected_label = PROBLEM_TYPE_LABELS.get(selected_problem_type, PROBLEM_TYPE_LABELS[DEFAULT_PROBLEM_TYPE])
    inferred_label = PROBLEM_TYPE_LABELS.get(inferred_problem_type, selected_label)
    selected_reason = _problem_type_reason(problem, problem_details, selected_problem_type)
    inferred_reason = _problem_type_reason(problem, problem_details, inferred_problem_type)
    if selected_problem_type == inferred_problem_type:
        return f"This fits {selected_label.lower()} because {selected_reason}."
    return (
        f"The selected template is {selected_label.lower()}, but the agent sees stronger signs of "
        f"{inferred_label.lower()} because {inferred_reason}."
    )


def _problem_type_reason(problem: str, problem_details: str, problem_type: str) -> str:
    combined = f"{problem} {problem_details}".lower()
    if problem_type == "predictive_modeling":
        if "churn" in combined:
            return "the question is about ranking or predicting who is at risk so the business can target action"
        return "the case is centered on predicting an outcome or prioritizing entities for action"
    if problem_type == "descriptive_analysis":
        if "churn" in combined:
            return "the main need is to understand why churn is rising, where it concentrates, and what likely explains the pattern"
        return "the main need is to understand what happened, where it happened, and what likely explains the pattern"
    if problem_type == "experiment_causal_question":
        return "the core ask is whether an intervention caused lift, so causal design matters more than raw prediction"
    if problem_type == "operational_optimization":
        return "the problem depends on choosing the best action under budget, capacity, or policy constraints"
    return "the structure should match the dominant decision need in the problem"


def _objective_ask(problem_text: str) -> str:
    if "churn" in problem_text:
        return "reduce avoidable churn while protecting positive unit economics"
    if "pricing" in problem_text or "revenue" in problem_text:
        return "improve revenue or margin without harming strategic guardrails"
    return "turn the business question into a measurable analysis objective"


def _objective_decision(problem_text: str) -> str:
    if "churn" in problem_text:
        return "decide which customers to prioritize, what action to take, and how success will be judged"
    if "experiment" in problem_text or "causal" in problem_text:
        return "decide whether the treatment should scale, stop, or be redesigned"
    return "define the business action or recommendation this work should unlock"


def _objective_scope(problem_text: str, audience: str) -> str:
    if "churn" in problem_text:
        return f"focus on the highest-risk {audience.lower()}, the relevant time horizon, and the economic guardrails"
    return f"define the entity, time horizon, and decision context for {audience.lower()}"


def _business_metric(problem_text: str, audience: str) -> str:
    if "churn" in problem_text or "retention" in problem_text:
        return f"retained revenue, retained {audience.lower()}, churn rate, and expected lifetime value preserved"
    if "revenue" in problem_text or "pricing" in problem_text:
        return "incremental revenue, margin lift, and lifetime value"
    if "engagement" in problem_text or "adoption" in problem_text:
        return "active usage, feature adoption, and downstream retention"
    return "the main business KPI, guardrail metrics, and segment-level impact"


def _decision_metric(problem_text: str, audience: str) -> str:
    if "churn" in problem_text:
        return f"who to target among {audience.lower()}, what risk threshold to use, and whether to prioritize high-value cases"
    if "pricing" in problem_text or "revenue" in problem_text:
        return "which users to target, what offer or threshold to apply, and how to prioritize high-value opportunities"
    return "which segment to target, what threshold to use, and how to prioritize limited intervention capacity"


def _model_metric(problem_text: str) -> str:
    if "churn" in problem_text:
        return "AUC or PR-AUC for ranking, Recall if missing churners is costly, and calibration for action thresholds"
    if "ranking" in problem_text or "recommendation" in problem_text:
        return "AUC or NDCG for ranking quality, recall at K, and calibration if actions depend on score cutoffs"
    return "the model-quality metric that best supports ranking, classification, or causal decision-making"


def _segmentation_value(problem_text: str, audience: str) -> str:
    return f"value tiers, profitability bands, and strategic importance across {audience.lower()}"


def _segmentation_lifecycle(problem_text: str, audience: str) -> str:
    if "churn" in problem_text:
        return f"onboarding, habit formation, mid-tenure risk, and renewal stages for {audience.lower()}"
    return f"new, growing, mature, and at-risk lifecycle stages for {audience.lower()}"

def _segmentation_structure(problem_text: str) -> str:
    return "product, geography, channel, and customer-type cuts that may explain different behaviors"


def _behavioral_drivers(problem_text: str, audience: str) -> str:
    if "churn" in problem_text:
        return f"usage drop-off, engagement decline, and product friction signals for {audience.lower()}"
    return f"behavior changes, adoption signals, and usage intensity for {audience.lower()}"


def _commercial_drivers(problem_text: str) -> str:
    if "churn" in problem_text:
        return "pricing sensitivity, contract value, offer attractiveness, and renewal economics"
    if "revenue" in problem_text:
        return "willingness to pay, order size, and monetization mix"
    return "revenue mix, pricing, and value realization factors"


def _operational_drivers(problem_text: str) -> str:
    if "churn" in problem_text:
        return "support issues, service disruptions, outreach quality, and channel effectiveness"
    return "service quality, operational friction, and execution constraints"


def _behavioral_data(problem_text: str, audience: str) -> str:
    if "churn" in problem_text:
        return f"usage patterns, transactions, engagement frequency, recency, and trends over time for {audience.lower()}"
    return f"behavior logs, feature usage, frequency, recency, and time trends for {audience.lower()}"


def _value_data(problem_text: str, audience: str) -> str:
    if "churn" in problem_text:
        return f"revenue, spend, balances, order size, and lifetime value for {audience.lower()}"
    return "revenue contribution, margin, spend, balances, and customer value indicators"


def _historical_data(problem_text: str) -> str:
    if "churn" in problem_text:
        return "past churn, defaults, delays, prior interventions, and repeated behavior patterns"
    return "historical outcomes, prior conversions, past incidents, and repeated behavior patterns"


def _profile_data(problem_text: str, audience: str) -> str:
    return f"customer type, geography, tenure, demographics, and segment markers for {audience.lower()}"


def _contextual_data(problem_text: str) -> str:
    if "churn" in problem_text:
        return "pricing changes, product updates, service interactions, channels, campaigns, and external events"
    return "campaigns, product changes, channel effects, seasonality, and external context"


def _hypothesis_behavior(problem_text: str, audience: str) -> str:
    return f"behavior change among {audience.lower()} signals whether the outcome is driven by engagement, habit, or usage deterioration"


def _hypothesis_commercial(problem_text: str) -> str:
    if "churn" in problem_text:
        return "pricing, promotion expiry, or competitive offers may explain the observed deterioration"
    return "commercial exposure, pricing, or value perception may be driving the observed pattern"


def _hypothesis_experience(problem_text: str) -> str:
    return "service friction, fulfillment issues, or experience gaps may be causing the measured outcome"


def _model_framing(problem_text: str) -> str:
    if "churn" in problem_text:
        return "a churn-risk ranking problem, a probability classification problem, or a causal uplift problem"
    if "experiment" in problem_text or "impact" in problem_text:
        return "causal inference, forecasting, or classification"
    return "classification, ranking, forecasting, or causal estimation"


def _model_build(problem_text: str) -> str:
    if "churn" in problem_text:
        return "a risk model, segment-specific thresholds, and possibly uplift logic if interventions are expensive"
    if "revenue" in problem_text:
        return "a response model, value model, or causal impact model depending on the action"
    return "the simplest model that reliably supports the business decision"


def _model_validation(problem_text: str) -> str:
    if "churn" in problem_text:
        return "track AUC or PR-AUC, recall for high-risk cases, calibration, and segment-level stability"
    return "track the decision-relevant metric, calibration if needed, and robustness by segment"


def _experiment_treatment(problem_text: str) -> str:
    return "define the treatment, control, eligibility, and randomization unit before measuring lift"


def _experiment_measurement(problem_text: str) -> str:
    return "set primary metric, guardrails, measurement window, and minimum detectable effect"


def _experiment_guardrails(problem_text: str) -> str:
    return "check contamination risk, selection bias, operational feasibility, and fairness or policy concerns"


def _constraint_budget(problem_text: str) -> str:
    return "available spend, margin tolerance, and payback expectations that cap feasible action"


def _constraint_operations(problem_text: str) -> str:
    return "team capacity, channel throughput, service availability, and execution timing limits"


def _constraint_policy(problem_text: str) -> str:
    return "eligibility rules, policy limits, customer experience guardrails, and compliance boundaries"


def _decision_use(problem_text: str, audience: str) -> str:
    if "churn" in problem_text:
        return f"decide which {audience.lower()} receive retention outreach, what offer they get, and how aggressive the intervention should be"
    if "revenue" in problem_text:
        return "decide who gets targeted, what treatment to apply, and when to avoid low-return actions"
    return "turn scores or insights into targeting, prioritization, and action thresholds"


def _targeting_rule(problem_text: str, audience: str) -> str:
    if "churn" in problem_text:
        return f"choose which {audience.lower()} enter the intervention pool based on risk and value"
    return f"choose which {audience.lower()} should receive action first"


def _prioritization_rule(problem_text: str) -> str:
    if "churn" in problem_text:
        return "prioritize high-value and high-risk users when intervention capacity is limited"
    return "rank opportunities by expected impact, feasibility, and value concentration"


def _impact_value(problem_text: str) -> str:
    if "churn" in problem_text:
        return "retained revenue, lifetime value protected, and value concentrated in the highest-priority cohorts"
    return "incremental value, margin upside, or service-level improvement from the chosen action"


def _impact_cost(problem_text: str) -> str:
    return "intervention cost, operational burden, and downside risk relative to expected upside"


def _impact_operations(problem_text: str) -> str:
    return "what this choice means for capacity, service quality, and scalability over the execution horizon"


def _result_focus(problem_text: str) -> str:
    if "churn" in problem_text:
        return "retention lift, revenue saved, intervention cost, and performance by high-value segment"
    if "revenue" in problem_text:
        return "incremental revenue, ROI, segment lift, and downside risk"
    return "expected business lift, uncertainty bounds, and operational implications"


def _segment_view(problem_text: str, audience: str) -> str:
    if "churn" in problem_text:
        return f"compare lift across high-value {audience.lower()}, moderate-risk users, and low-priority segments"
    return f"compare impact across the most important {audience.lower()} segments"
