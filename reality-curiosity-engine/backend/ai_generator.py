import json
import logging
import os
from typing import Any

from openai import OpenAI

logger = logging.getLogger(__name__)

DEFAULT_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
RELATIONS = ["supports", "contradicts", "extends", "related_to", "explains"]
CATEGORIES = ["Physics", "Philosophy", "Neuroscience", "AI", "Cosmology", "Speculative Theories"]
CONFIDENCE = ["strong scientific consensus", "debated theory", "speculative hypothesis"]

EXAMPLE_PROMPTS = {
    "initial": (
        "Question: What is time?\\n"
        "Return JSON with concepts, learning_path, deeper_questions."
    ),
    "expand": (
        "Question: What is time?\\n"
        "Focus concept: Entropy\\n"
        "Return JSON with 4-6 related concepts and semantic relationships."
    ),
}

# Module-level singleton — created once, reused for every request.
_client: OpenAI | None = None


def get_client() -> OpenAI | None:
    global _client
    if _client is None:
        key = os.getenv("OPENAI_API_KEY")
        if key:
            _client = OpenAI(api_key=key)
    return _client


def generate_initial_universe(question: str) -> dict[str, Any]:
    client = get_client()
    if client is None:
        return fallback_initial(question)

    prompt = (
        "You are building a living universe-of-ideas graph. "
        "Return strictly valid JSON with keys: concepts, learning_path, deeper_questions. "
        "concepts must have 5-7 objects with fields: name, category, relation, confidence, description, "
        "key_thinkers (array), related_fields (array), explanations {simple, standard, advanced}. "
        "learning_path must have 5-7 objects: name, reason, category, confidence. "
        "deeper_questions must have 3-5 strings. "
        f"Allowed categories: {', '.join(CATEGORIES)}. "
        f"Allowed relations: {', '.join(RELATIONS)}. "
        f"Allowed confidence values: {', '.join(CONFIDENCE)}. "
        f"User question: {question}"
    )

    data = _safe_json_completion(client, prompt)
    if not data:
        return fallback_initial(question)
    return _sanitize_initial(data, question)


def generate_node_expansion(question: str, focus_label: str) -> dict[str, Any]:
    client = get_client()
    if client is None:
        return fallback_expansion(question, focus_label)

    prompt = (
        "You are expanding a semantic knowledge graph. "
        "Return strictly valid JSON with key concepts. "
        "concepts must contain 4-6 objects with fields: name, category, relation, confidence, description, "
        "key_thinkers (array), related_fields (array), explanations {simple, standard, advanced}. "
        f"Allowed categories: {', '.join(CATEGORIES)}. "
        f"Allowed relations: {', '.join(RELATIONS)}. "
        f"Allowed confidence values: {', '.join(CONFIDENCE)}. "
        f"Root question: {question}. Focus concept: {focus_label}."
    )

    data = _safe_json_completion(client, prompt)
    if not data:
        return fallback_expansion(question, focus_label)

    concepts = _sanitize_concepts(data.get("concepts", []), min_items=4, max_items=6)
    if not concepts:
        return fallback_expansion(question, focus_label)
    return {"concepts": concepts}


def _safe_json_completion(client: OpenAI, prompt: str) -> dict[str, Any]:
    try:
        response = client.chat.completions.create(
            model=DEFAULT_MODEL,
            messages=[
                {"role": "system", "content": "You output concise, valid JSON only."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            response_format={"type": "json_object"},
        )
        text = response.choices[0].message.content or "{}"
        payload = json.loads(text)
        if isinstance(payload, dict):
            return payload
    except Exception as exc:
        logger.warning("AI completion failed: %s", exc)
    return {}


def _sanitize_initial(payload: dict[str, Any], question: str) -> dict[str, Any]:
    concepts = _sanitize_concepts(payload.get("concepts", []), min_items=5, max_items=7)
    path = payload.get("learning_path", [])
    questions = payload.get("deeper_questions", [])

    clean_path = []
    if isinstance(path, list):
        for step in path[:7]:
            if not isinstance(step, dict):
                continue
            name = str(step.get("name", "")).strip()
            if not name:
                continue
            clean_path.append(
                {
                    "name": name,
                    "reason": str(step.get("reason", "Builds understanding step by step.")).strip(),
                    "category": _normalize_choice(str(step.get("category", "Philosophy")), CATEGORIES, "Philosophy"),
                    "confidence": _normalize_choice(
                        str(step.get("confidence", "debated theory")),
                        CONFIDENCE,
                        "debated theory",
                    ),
                }
            )

    clean_questions = []
    if isinstance(questions, list):
        clean_questions = [str(q).strip() for q in questions if str(q).strip()][:5]

    if len(concepts) < 5 or len(clean_path) < 5 or len(clean_questions) < 3:
        return fallback_initial(question)

    return {
        "concepts": concepts,
        "learning_path": clean_path,
        "deeper_questions": clean_questions,
    }


def _sanitize_concepts(raw: Any, min_items: int, max_items: int) -> list[dict[str, Any]]:
    if not isinstance(raw, list):
        return []

    concepts: list[dict[str, Any]] = []
    for item in raw[:max_items]:
        if not isinstance(item, dict):
            continue
        name = str(item.get("name", "")).strip()
        if not name:
            continue

        concept = {
            "name": name,
            "category": _normalize_choice(str(item.get("category", "Philosophy")), CATEGORIES, "Philosophy"),
            "relation": _normalize_choice(str(item.get("relation", "related_to")), RELATIONS, "related_to"),
            "confidence": _normalize_choice(
                str(item.get("confidence", "debated theory")),
                CONFIDENCE,
                "debated theory",
            ),
            "description": str(item.get("description", "")).strip(),
            "key_thinkers": _list_str(item.get("key_thinkers", []), 5),
            "related_fields": _list_str(item.get("related_fields", []), 5),
            "explanations": {
                "simple": str(item.get("explanations", {}).get("simple", f"{name} in simple terms.")).strip(),
                "standard": str(item.get("explanations", {}).get("standard", f"{name} at a normal level.")).strip(),
                "advanced": str(item.get("explanations", {}).get("advanced", f"{name} in technical terms.")).strip(),
            },
        }
        concepts.append(concept)

    return concepts if len(concepts) >= min_items else []


def _normalize_choice(value: str, allowed: list[str], default: str) -> str:
    lowered = value.lower().strip().replace(" ", "_")
    for candidate in allowed:
        if lowered == candidate.lower().strip().replace(" ", "_"):
            return candidate
    return default


def _list_str(value: Any, max_items: int) -> list[str]:
    if not isinstance(value, list):
        return []
    return [str(v).strip() for v in value if str(v).strip()][:max_items]


def fallback_initial(question: str) -> dict[str, Any]:
    if "time" in question.lower():
        concepts = [
            _concept("General Relativity", "Physics", "explains", "strong scientific consensus"),
            _concept("Entropy", "Physics", "explains", "strong scientific consensus"),
            _concept("Arrow of Time", "Cosmology", "extends", "debated theory"),
            _concept("Quantum Mechanics", "Physics", "related_to", "strong scientific consensus"),
            _concept("Block Universe Theory", "Philosophy", "contradicts", "speculative hypothesis"),
            _concept("Presentism", "Philosophy", "contradicts", "debated theory"),
        ]
        return {
            "concepts": concepts,
            "learning_path": [
                _path("Classical Time Intuition", "Start from everyday temporal experience.", "Philosophy", "debated theory"),
                _path("Thermodynamics", "Understand irreversibility and entropy growth.", "Physics", "strong scientific consensus"),
                _path("General Relativity", "See how time dilates with gravity and speed.", "Physics", "strong scientific consensus"),
                _path("Quantum Time Problems", "Explore unresolved issues between quantum and gravity.", "Physics", "debated theory"),
                _path("Block Universe", "Evaluate whether past, present, and future coexist.", "Philosophy", "speculative hypothesis"),
                _path("Consciousness of Time", "Connect physical time to perceived time.", "Neuroscience", "debated theory"),
            ],
            "deeper_questions": [
                "Does entropy create time or only measure it?",
                "Can time exist without conscious observers?",
                "Is the present moment physically real?",
                "Could quantum gravity eliminate time fundamentally?",
            ],
        }

    concepts = [
        _concept("Quantum Mechanics", "Physics", "explains", "strong scientific consensus"),
        _concept("Philosophy of Mind", "Philosophy", "related_to", "debated theory"),
        _concept("Consciousness Studies", "Neuroscience", "extends", "debated theory"),
        _concept("Information Theory", "AI", "supports", "strong scientific consensus"),
        _concept("Cosmology", "Cosmology", "related_to", "strong scientific consensus"),
    ]
    return {
        "concepts": concepts,
        "learning_path": [
            _path("Foundational Definitions", "Clarify terms and assumptions.", "Philosophy", "debated theory"),
            _path("Empirical Evidence", "Map what experiments can establish.", "Physics", "strong scientific consensus"),
            _path("Competing Theories", "Compare explanatory power.", "Philosophy", "debated theory"),
            _path("Interdisciplinary Synthesis", "Bridge fields and models.", "AI", "debated theory"),
            _path("Open Problems", "Identify unresolved contradictions.", "Speculative Theories", "speculative hypothesis"),
        ],
        "deeper_questions": [
            "What assumptions does this question hide?",
            "Which parts are empirically testable?",
            "What would falsify the leading theory?",
        ],
    }


def fallback_expansion(question: str, focus_label: str) -> dict[str, Any]:
    key = focus_label.lower()
    if "entropy" in key:
        concepts = [
            _concept("Thermodynamics", "Physics", "explains", "strong scientific consensus"),
            _concept("Information Theory", "AI", "extends", "strong scientific consensus"),
            _concept("Heat Death of the Universe", "Cosmology", "extends", "debated theory"),
            _concept("Statistical Mechanics", "Physics", "supports", "strong scientific consensus"),
            _concept("Boltzmann Brain", "Speculative Theories", "contradicts", "speculative hypothesis"),
        ]
        return {"concepts": concepts[:6]}

    concepts = [
        _concept(f"{focus_label} Foundations", "Philosophy", "explains", "debated theory"),
        _concept(f"{focus_label} in Physics", "Physics", "related_to", "strong scientific consensus"),
        _concept(f"{focus_label} and Mind", "Neuroscience", "extends", "debated theory"),
        _concept(f"{focus_label} Computational Models", "AI", "supports", "debated theory"),
    ]
    return {"concepts": concepts}


def _concept(name: str, category: str, relation: str, confidence: str) -> dict[str, Any]:
    return {
        "name": name,
        "category": category,
        "relation": relation,
        "confidence": confidence,
        "description": f"{name} is relevant when examining big questions about reality.",
        "key_thinkers": ["Einstein", "Boltzmann"],
        "related_fields": ["Metaphysics", "Complexity Science"],
        "explanations": {
            "simple": f"{name} in plain language.",
            "standard": f"{name} with core ideas and context.",
            "advanced": f"{name} with formal and technical framing.",
        },
    }


def _path(name: str, reason: str, category: str, confidence: str) -> dict[str, str]:
    return {"name": name, "reason": reason, "category": category, "confidence": confidence}
