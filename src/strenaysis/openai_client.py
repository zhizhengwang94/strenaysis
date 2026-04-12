from __future__ import annotations

import json
import os
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
        "Use a consultancy-style, MECE structure. suggested_context must ask what extra problem-statement context would strengthen this node. "
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


def polish_node(problem: str, problem_details: str, draft: str) -> dict[str, str]:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return _fallback_polish_node(problem, problem_details, draft)

    prompt = (
        "You are polishing a roadmap stage for a data science workflow. Return JSON with keys title, why, breakdown, suggested_context. "
        "title must be concise, under 3 words. why must be one sentence. breakdown must be a consultancy-style MECE structure written as 3-5 short labeled lines. "
        f"suggested_context should ask what extra context would make the node more precise, or exactly '{NO_ADDITIONAL_SUGGESTED_ITEM}' if enough context exists.\n\n"
        f"Problem to solve: {problem}\nProblem details: {problem_details or 'None provided.'}\nDraft stage request: {draft}"
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
                    },
                    "required": ["title", "why", "breakdown", "suggested_context"],
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
        return _fallback_polish_node(problem, problem_details, draft)

    polished = _extract_polished_node(body)
    return polished or _fallback_polish_node(problem, problem_details, draft)

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
                if title and why and breakdown and suggested_context:
                    return {"title": title, "why": why, "breakdown": breakdown, "suggested_context": suggested_context}
    return None


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


def _fallback_polish_node(problem: str, problem_details: str, draft: str) -> dict[str, str]:
    normalized = " ".join(str(draft).split()).strip()
    if not normalized:
        return {
            "title": "New Node",
            "why": "Adds a custom stage to capture an extra part of the decision process.",
            "breakdown": _fallback_breakdown(problem, problem_details, "New Node"),
            "suggested_context": _fallback_suggested_context(problem, problem_details, "New Node"),
        }

    words = normalized.replace("/", " ").replace("-", " ").split()
    short_title = " ".join(words[:3]).title() if words else "New Node"
    return {
        "title": short_title,
        "why": f"Adds a focused stage for {normalized.lower()} so the roadmap covers that consideration explicitly.",
        "breakdown": _fallback_breakdown(problem, problem_details, short_title),
        "suggested_context": _fallback_suggested_context(problem, problem_details, short_title),
    }


def _build_fallback_roadmap(problem: str, problem_details: str, problem_type: str) -> list[dict[str, str]]:
    return [{
        "title": title,
        "why": NODE_WHY[title],
        "breakdown": _fallback_breakdown(problem, problem_details, title),
        "suggested_context": _fallback_suggested_context(problem, problem_details, title),
    } for title in ROADMAP_TEMPLATES.get(problem_type, ROADMAP_TEMPLATES[DEFAULT_PROBLEM_TYPE])]


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
    if any(term in combined for term in ["predict", "prediction", "forecast", "churn", "risk", "propensity", "uplift", "rank", "ranking", "scoring", "who to target"]):
        return "predictive_modeling"
    return "descriptive_analysis"


def _fallback_suggested_context(problem: str, problem_details: str, title: str) -> str:
    combined = f"{' '.join(problem.lower().split())} {' '.join(problem_details.lower().split())}".strip()
    audience = _detect_audience(combined)
    if _is_context_sufficient(combined, title):
        return NO_ADDITIONAL_SUGGESTED_ITEM
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
