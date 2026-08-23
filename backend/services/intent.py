import json
import os
import re
import unicodedata
from functools import lru_cache
from pathlib import Path
from typing import Any

import httpx

KB_PATH = Path(__file__).resolve().parent.parent / "kb" / "knowledge_base.json"
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")


@lru_cache(maxsize=1)
def load_kb() -> dict[str, Any]:
    with open(KB_PATH, encoding="utf-8") as f:
        return json.load(f)


def get_life_events() -> list[dict[str, Any]]:
    return load_kb()["life_events"]


def get_event(event_id: str) -> dict[str, Any] | None:
    for ev in get_life_events():
        if ev["id"] == event_id:
            return ev
    return None


def normalize(text: str) -> str:
    text = unicodedata.normalize("NFKC", text).lower()
    text = re.sub(r"[^\w\s\u0900-\u097F]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def tokenize(text: str) -> set[str]:
    return set(normalize(text).split())


CITY_HINTS = [
    "meerut", "lucknow", "delhi", "mumbai", "pune", "kanpur", "varanasi",
    "jaipur", "ahmedabad", "surat", "bhopal", "indore", "patna", "noida",
    "gurgaon", "gurugram", "hyderabad", "chennai", "bangalore", "bengaluru",
    "kolkata", "nagpur", "agra", "prayagraj", "gorakhpur", "ranchi",
]

CONDITION_HINTS = {
    "sells_food": ["kirana", "grocery", "food", "restaurant", "khana", "sabzi", "sweet", "mithai", "cafe", "bakery", "canteen"],
    "has_employees": ["employee", "staff", "karmer", "karmchari", "hiring", "hire", "naukar", "worker"],
    "incorporate_company": ["private limited", "pvt ltd", "pvt.", "llp", "limited company", "incorporate"],
}


def rule_based_parse(text: str) -> dict[str, Any]:
    norm = normalize(text)
    tokens = tokenize(text)

    scores: dict[str, float] = {}
    matched: dict[str, list[str]] = {}
    for event in get_life_events():
        score = 0.0
        hits: list[str] = []
        for kw_group, weight in (("en", 1.5), ("roman", 1.8), ("hi", 1.8)):
            for kw in event["keywords"].get(kw_group, []):
                kwn = normalize(kw)
                if " " in kwn:
                    if kwn in norm:
                        score += weight * 1.4
                        hits.append(kw)
                elif kwn in tokens:
                    score += weight
                    hits.append(kw)
        scores[event["id"]] = score
        matched[event["id"]] = hits

    best_id = max(scores, key=lambda k: scores[k])
    total = sum(scores.values()) or 1.0
    confidence = round(min(0.98, max(0.35, scores[best_id] / total)), 2)

    detected_lang = "en"
    if any("\u0900" <= ch <= "\u097F" for ch in text):
        detected_lang = "hi"
    elif any(w in tokens for w in ("mujhe", "karna", "hai", "chahta", "chahiye", "kholna", "banvana")):
        detected_lang = "hinglish"

    city = next((c.title() for c in CITY_HINTS if c in tokens), None)

    conditions = {
        cid: any(hint in norm for hint in hints)
        for cid, hints in CONDITION_HINTS.items()
    }

    ranked = sorted(scores.items(), key=lambda kv: kv[1], reverse=True)[:3]
    return {
        "event_id": best_id,
        "confidence": confidence,
        "detected_language": detected_lang,
        "city": city,
        "conditions": conditions,
        "matched_keywords": matched[best_id],
        "alternatives": [{"event_id": eid, "score": round(s, 2)} for eid, s in ranked[1:] if s > 0],
        "engine": "rules",
    }


GEMINI_PROMPT = """You are the intent parser for SarkariScript, an Indian government services navigator.
Classify the user's request into exactly one life_event_id from this list:

{events}

Rules:
- Understand Hindi (Devanagari), English and Hinglish (Roman-script Hindi).
- Respond ONLY with JSON matching this schema:
{{"event_id": "<id>", "confidence": <0-1>, "detected_language": "<en|hi|hinglish>", "city": "<city name or null>", "conditions": {{"sells_food": bool, "has_employees": bool, "incorporate_company": bool}}, "reasoning": "<one short line>"}}
- conditions.sells_food=true only if the business involves food/grocery.
- conditions.has_employees=true only if hiring staff is mentioned.
- conditions.incorporate_company=true only if Pvt Ltd / LLP is mentioned.

User request: "{query}"
"""


async def gemini_parse(text: str, api_key: str) -> dict[str, Any] | None:
    events_list = "\n".join(
        f'- {ev["id"]}: {ev["name_en"]} ({ev["name_hi"]})'
        for ev in get_life_events()
    )
    payload = {
        "contents": [{"parts": [{"text": GEMINI_PROMPT.format(events=events_list, query=text)}]}],
        "generationConfig": {"responseMimeType": "application/json", "temperature": 0.1},
    }
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={api_key}"
    try:
        async with httpx.AsyncClient(timeout=12) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            content = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
            parsed = json.loads(content)
    except Exception:
        return None

    event_id = parsed.get("event_id")
    if not isinstance(event_id, str) or get_event(event_id) is None:
        return None

    valid_ids = {ev["id"] for ev in get_life_events()}
    parsed.setdefault("confidence", 0.8)
    parsed["matched_keywords"] = rule_based_parse(text)["matched_keywords"].get(event_id, [])
    parsed["alternatives"] = []
    parsed["engine"] = "gemini"
    parsed["city"] = parsed.get("city") or None
    conds = parsed.get("conditions") or {}
    parsed["conditions"] = {
        cid: bool(conds.get(cid, False)) for cid in CONDITION_HINTS
    }
    assert event_id in valid_ids
    return parsed


async def parse_intent(text: str) -> dict[str, Any]:
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if api_key:
        result = await gemini_parse(text, api_key)
        if result:
            return result
    return rule_based_parse(text)


def build_roadmap(event_id: str, conditions: dict[str, bool]) -> dict[str, Any]:
    event = get_event(event_id)
    if event is None:
        raise ValueError(f"Unknown life event: {event_id}")

    portals = {p["id"]: p for p in load_kb()["portals"]}
    docs_catalog = {d["id"]: d for d in load_kb()["documents_catalog"]}

    steps = []
    for step in event["steps"]:
        flag = step.get("optional_flag")
        included = not flag or bool(conditions.get(flag["condition_id"], False))
        resolved_step = {**step}
        portal = portals.get(step["portal"], {})
        resolved_step["portal_info"] = portal
        resolved_step["included"] = included
        if flag:
            resolved_step["condition_label_en"] = flag["label_en"]
            resolved_step["condition_label_hi"] = flag["label_hi"]
        resolved_step["docs_resolved"] = [
            {
                **docs_catalog[d["doc"]],
                "mandatory": d["mandatory"],
            }
            for d in step["docs_required"]
            if d["doc"] in docs_catalog
        ]
        steps.append(resolved_step)

    id_to_step = {s["id"]: s for s in steps}
    ordered: list[dict[str, Any]] = []
    visited: set[str] = set()

    def visit(sid: str) -> None:
        if sid in visited or sid not in id_to_step:
            return
        visited.add(sid)
        step = id_to_step[sid]
        if not step.get("included", True):
            return
        for dep in step.get("depends_on", []):
            visit(dep)
        ordered.append(step)

    for s in steps:
        visit(s["id"])

    excluded = [s for s in steps if not s.get("included", True)]

    doc_usage: dict[str, int] = {}
    for s in steps:
        for d in s["docs_resolved"]:
            doc_usage[d["id"]] = doc_usage.get(d["id"], 0) + 1

    reusable_docs = sorted((did, n) for did, n in doc_usage.items() if n > 1)

    return {
        "event": event,
        "steps": ordered,
        "excluded_steps": excluded,
        "reusable_docs": [
            {"doc_id": did, "used_in_steps": n} for did, n in reusable_docs
        ],
    }
