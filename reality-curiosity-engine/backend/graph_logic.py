import json
import logging
import re
import sqlite3
import uuid
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

CATEGORIES = {
    "Physics",
    "Philosophy",
    "Neuroscience",
    "AI",
    "Cosmology",
    "Speculative Theories",
}

RELATION_TYPES = {"supports", "contradicts", "extends", "related_to", "explains"}
CONFIDENCE_LEVELS = {
    "strong scientific consensus",
    "debated theory",
    "speculative hypothesis",
}

# SQLite DB lives next to this file.
_DB_PATH = Path(__file__).parent / "sessions.db"


@dataclass
class Node:
    id: str
    label: str
    category: str
    confidence: str
    description: str
    key_thinkers: list[str]
    related_fields: list[str]
    explanations: dict[str, str]
    depth: int
    is_path: bool = False


@dataclass
class Edge:
    source: str
    target: str
    relation: str


@dataclass
class GraphSession:
    question: str
    nodes: dict[str, Node] = field(default_factory=dict)
    edges: list[Edge] = field(default_factory=list)
    deeper_questions: list[str] = field(default_factory=list)
    curiosity_path_ids: list[str] = field(default_factory=list)


def _get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(_DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            question TEXT NOT NULL,
            graph_json TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now'))
        )
        """
    )
    conn.commit()
    return conn


def _session_to_dict(session: GraphSession) -> dict[str, Any]:
    return {
        "question": session.question,
        "nodes": {k: asdict(v) for k, v in session.nodes.items()},
        "edges": [asdict(e) for e in session.edges],
        "deeper_questions": session.deeper_questions,
        "curiosity_path_ids": session.curiosity_path_ids,
    }


def _session_from_dict(data: dict[str, Any]) -> GraphSession:
    session = GraphSession(question=data["question"])
    session.deeper_questions = data.get("deeper_questions", [])
    session.curiosity_path_ids = data.get("curiosity_path_ids", [])
    for node_data in data.get("nodes", {}).values():
        node = Node(**node_data)
        session.nodes[node.id] = node
    for edge_data in data.get("edges", []):
        session.edges.append(Edge(**edge_data))
    return session


class GraphStore:
    def __init__(self) -> None:
        # In-memory cache to avoid hitting SQLite on every request.
        self._cache: dict[str, GraphSession] = {}
        _get_db().close()  # Ensure DB + table exists at startup.

    def create_session(self, question: str) -> str:
        session_id = str(uuid.uuid4())
        root = Node(
            id="root",
            label=question,
            category="Philosophy",
            confidence="debated theory",
            description="Central question used to generate the concept universe.",
            key_thinkers=["Aristotle", "Einstein", "Tegmark"],
            related_fields=["Epistemology", "Physics"],
            explanations={
                "simple": "This is your starting question.",
                "standard": "The graph branches out from this anchor into theories and fields.",
                "advanced": "Treat this as the root ontology node that constrains expansion semantics.",
            },
            depth=0,
            is_path=True,
        )
        session = GraphSession(question=question)
        session.nodes[root.id] = root
        session.curiosity_path_ids = ["root"]
        self._cache[session_id] = session
        self._persist(session_id, session)
        return session_id

    def get_session(self, session_id: str) -> GraphSession | None:
        if session_id in self._cache:
            return self._cache[session_id]
        # Try loading from SQLite.
        try:
            conn = _get_db()
            row = conn.execute("SELECT graph_json FROM sessions WHERE id = ?", (session_id,)).fetchone()
            conn.close()
            if row:
                session = _session_from_dict(json.loads(row["graph_json"]))
                self._cache[session_id] = session
                return session
        except Exception as exc:
            logger.warning("Failed to load session %s from DB: %s", session_id, exc)
        return None

    def add_concepts(self, session_id: str, source_id: str, concepts: list[dict[str, Any]]) -> list[str]:
        session = self._cache[session_id]
        source = session.nodes[source_id]
        added_ids: list[str] = []

        for concept in concepts:
            label = str(concept.get("name", "")).strip()
            if not label:
                continue

            node_id = self._make_node_id(label)
            if node_id not in session.nodes:
                session.nodes[node_id] = Node(
                    id=node_id,
                    label=label,
                    category=normalize_category(str(concept.get("category", "Philosophy"))),
                    confidence=normalize_confidence(str(concept.get("confidence", "debated theory"))),
                    description=str(concept.get("description", "")).strip(),
                    key_thinkers=clean_string_list(concept.get("key_thinkers", []), 5),
                    related_fields=clean_string_list(concept.get("related_fields", []), 5),
                    explanations=normalize_explanations(concept.get("explanations", {}), label),
                    depth=source.depth + 1,
                )
                added_ids.append(node_id)
            else:
                # Fill missing metadata when a concept reappears.
                node = session.nodes[node_id]
                node.key_thinkers = node.key_thinkers or clean_string_list(concept.get("key_thinkers", []), 5)
                node.related_fields = node.related_fields or clean_string_list(concept.get("related_fields", []), 5)
                if not node.description:
                    node.description = str(concept.get("description", "")).strip()

            relation = normalize_relation(str(concept.get("relation", "related_to")))
            if not self._edge_exists(session.edges, source.id, node_id, relation):
                session.edges.append(Edge(source=source.id, target=node_id, relation=relation))

        self._persist(session_id, session)
        return added_ids

    def set_deeper_questions(self, session_id: str, questions: list[str]) -> None:
        session = self._cache[session_id]
        session.deeper_questions = [q.strip() for q in questions if isinstance(q, str) and q.strip()][:5]
        self._persist(session_id, session)

    def set_curiosity_path(self, session_id: str, steps: list[dict[str, str]]) -> None:
        session = self._cache[session_id]
        session.curiosity_path_ids = ["root"]
        previous_id = "root"

        for step in steps[:7]:
            label = str(step.get("name", "")).strip()
            if not label:
                continue

            node_id = self._make_node_id(label)
            if node_id not in session.nodes:
                session.nodes[node_id] = Node(
                    id=node_id,
                    label=label,
                    category=normalize_category(str(step.get("category", "Philosophy"))),
                    confidence=normalize_confidence(str(step.get("confidence", "debated theory"))),
                    description=str(step.get("reason", "Part of the recommended learning path.")).strip(),
                    key_thinkers=[],
                    related_fields=[],
                    explanations={
                        "simple": f"Path step: {label}.",
                        "standard": str(step.get("reason", "Recommended progression.")).strip(),
                        "advanced": "This step builds conceptual continuity for the topic.",
                    },
                    depth=session.nodes[previous_id].depth + 1,
                )

            session.nodes[node_id].is_path = True
            session.curiosity_path_ids.append(node_id)
            if not self._edge_exists(session.edges, previous_id, node_id, "extends"):
                session.edges.append(Edge(source=previous_id, target=node_id, relation="extends"))
            previous_id = node_id

        self._persist(session_id, session)

    def serialize(self, session_id: str) -> dict[str, Any]:
        session = self._cache[session_id]
        return {
            "nodes": [
                {
                    "id": node.id,
                    "label": node.label,
                    "category": node.category,
                    "confidence": node.confidence,
                    "description": node.description,
                    "key_thinkers": node.key_thinkers,
                    "related_fields": node.related_fields,
                    "explanations": node.explanations,
                    "depth": node.depth,
                    "is_path": node.is_path,
                }
                for node in session.nodes.values()
            ],
            "links": [
                {"source": edge.source, "target": edge.target, "relation": edge.relation}
                for edge in session.edges
            ],
            "deeper_questions": session.deeper_questions,
            "curiosity_path": session.curiosity_path_ids,
        }

    def _persist(self, session_id: str, session: GraphSession) -> None:
        try:
            conn = _get_db()
            conn.execute(
                "INSERT OR REPLACE INTO sessions (id, question, graph_json) VALUES (?, ?, ?)",
                (session_id, session.question, json.dumps(_session_to_dict(session))),
            )
            conn.commit()
            conn.close()
        except Exception as exc:
            logger.warning("Failed to persist session %s: %s", session_id, exc)

    @staticmethod
    def _make_node_id(label: str) -> str:
        slug = re.sub(r"[^a-z0-9]+", "-", label.lower().strip()).strip("-")
        return slug or f"node-{uuid.uuid4().hex[:8]}"

    @staticmethod
    def _edge_exists(edges: list[Edge], source: str, target: str, relation: str) -> bool:
        return any(e.source == source and e.target == target and e.relation == relation for e in edges)


def clean_string_list(value: Any, max_items: int) -> list[str]:
    if not isinstance(value, list):
        return []
    cleaned = [str(v).strip() for v in value if str(v).strip()]
    return cleaned[:max_items]


def normalize_category(value: str) -> str:
    for category in CATEGORIES:
        if value.lower().strip() == category.lower().strip():
            return category
    return "Philosophy"


def normalize_relation(value: str) -> str:
    lowered = value.lower().strip().replace(" ", "_")
    return lowered if lowered in RELATION_TYPES else "related_to"


def normalize_confidence(value: str) -> str:
    lowered = value.lower().strip()
    for level in CONFIDENCE_LEVELS:
        if lowered == level:
            return level
    return "debated theory"


def normalize_explanations(raw: Any, label: str) -> dict[str, str]:
    if not isinstance(raw, dict):
        raw = {}
    simple = str(raw.get("simple", f"{label} is relevant to the central question.")).strip()
    standard = str(raw.get("standard", f"{label} connects to the topic through conceptual overlap.")).strip()
    advanced = str(raw.get("advanced", f"{label} can be analyzed via formal models and frameworks.")).strip()
    return {"simple": simple, "standard": standard, "advanced": advanced}
