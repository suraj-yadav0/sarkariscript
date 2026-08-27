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
    # Retain English, digits, and Indian script unicode range (\u0900 to \u0D7F)
    text = re.sub(r"[^\w\s\u0900-\u0D7F]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def tokenize(text: str) -> set[str]:
    return set(normalize(text).split())


CITY_HINTS = [
    "meerut", "lucknow", "delhi", "mumbai", "pune", "kanpur", "varanasi",
    "jaipur", "ahmedabad", "surat", "bhopal", "indore", "patna", "noida",
    "gurgaon", "gurugram", "hyderabad", "chennai", "bangalore", "bengaluru",
    "kolkata", "nagpur", "agra", "prayagraj", "gorakhpur", "ranchi",
    "কলকাতা", "ঢাকা", "சென்னை", "హైదరాబాద్", "ಬೆಂಗಳೂರು", "અમદાવાદ", "पुणे", "मुंबई"
]

CONDITION_HINTS = {
    "sells_food": [
        "kirana", "grocery", "food", "restaurant", "khana", "sabzi", "sweet", "mithai", "cafe", "bakery", "canteen",
        "दुकान", "किराना", "खाद्य", "भोजन", "মিষ্টি", "মুদি", "খাবার", "கடை", "உணவு", "కిరాణా", "ఆహారం", "કરિયાણા", "ખોરાક", "ದಿನಸಿ", "ಆಹಾರ"
    ],
    "has_employees": [
        "employee", "staff", "karmer", "karmchari", "hiring", "hire", "naukar", "worker", "कर्मचारी", "কর্মী", "ஊழியர்", "ఉద్యోగి", "કર્મચારી", "ಉದ್ಯೋಗಿ"
    ],
    "incorporate_company": [
        "private limited", "pvt ltd", "pvt.", "llp", "limited company", "incorporate", "प्राइवेट लिमिटेड", "কোম্পানি", "நிறுவனம்", "సంస్థ", "કંપની"
    ],
}

REGIONAL_KEYWORDS: dict[str, dict[str, list[str]]] = {
    "start_business": {
        "bn": ["দোকান", "ব্যবসা", "ফার্ম", "কোম্পানি", "উদ্যোগ", "জিএসটি", "খুলতে"],
        "mr": ["दुकान", "व्यवसाय", "उद्योग", "कंपनी", "सुरू", "जीएसटी", "व्यापार"],
        "ta": ["தொழில்", "கடை", "நிறுவனம்", "வியாபாரம்", "தொடங்க", "ஜிஎஸ்டி"],
        "te": ["వ్యాపారం", "దుకాణం", "సంస్థ", "ప్రారంభించడానికి", "జీఎస్టీ", "షాప్"],
        "gu": ["દુકાન", "વ્યવસાય", "ધંધો", "કંપની", "શરૂ", "જીએસટી"],
        "kn": ["ವ್ಯಾಪಾರ", "ಅಂಗಡಿ", "ಸಂಸ್ಥೆ", "ಪ್ರಾರಂಭಿಸಲು", "ಜಿಎಸ್‌ಟಿ"],
    },
    "buy_vehicle": {
        "bn": ["গাড়ি", "বাইক", "রেজিস্ট্রেশন", "আরসি", "ফাস্ট্যাগ", "বীমা", "কিনতে"],
        "mr": ["गाडी", "वाहन", "नोंदणी", "आरसी", "फास्टॅग", "विमा", "खरेदी"],
        "ta": ["வாகனம்", "கார்", "பைக்", "பதிவு", "ஆர்சி", "FASTag", "காப்பீடு"],
        "te": ["వాహనం", "కారు", "బైక్", "రిజిస్ట్రేషన్", "ఆర్సీ", "ఫాస్టాగ్", "కొనుగోలు"],
        "gu": ["ગાડી", "વાહન", "રજીસ્ટ્રેશન", "આરસી", "ફાસ્ટેગ", "વીમો", "ખરીદવી"],
        "kn": ["ವಾಹನ", "ಕಾರು", "ಬೈಕ್", "ನೋಂದಣಿ", "ಆರ್‌ಸಿ", "ಫಾಸ್ಟ್‌ಟ್ಯಾಗ್", "ಖರೀದಿ"],
    },
    "driving_license": {
        "bn": ["ড্রাইভিং", "লাইসেন্স", "লার্নার", "ডিএল", "সারথী", "চালানোর"],
        "mr": ["ड्रायव्हिंग", "लायसन्स", "परवाना", "लर्निंग", "डीएल", "सारथी"],
        "ta": ["ஓட்டுநர்", "உரிமம்", "பழகுநர்", "DL", "சாரதி", "லைசென்ஸ்"],
        "te": ["డ్రైవింగ్", "లైసెన్స్", "లెర్నర్స్", "డీఎల్", "సారథి"],
        "gu": ["ડ્રાઇવિંગ", "લાયસન્સ", "લર્નિંગ", "ડીએલ", "સારથી"],
        "kn": ["ಚಾಲನಾ", "ಪರವಾನಗಿ", "ಡ್ರೈವಿಂಗ್", "ಲೈಸೆನ್ಸ್", "ಡಿಎಲ್"],
    },
    "file_itr": {
        "bn": ["আয়কর", "ট্যাক্স", "রিটার্ন", "রিফান্ড", "আইটিআর", "দাখিল"],
        "mr": ["आयकर", "टॅक्स", "परतावा", "रिटर्न", "आयटीआर", "फायलिंग"],
        "ta": ["வருமான", "வரி", "தாக்கல்", "ரீஃபண்ட்", "ITR", "ரிட்டர்ன்"],
        "te": ["ఆదాయపు", "పన్ను", "రిటర్న్", "రీఫండ్", "ఐటీఆర్", "దాఖలు"],
        "gu": ["ઇન્કમ", "ટેક્સ", "રિટર્ન", "રિફંડ", "આઈટીઆર", "ફાઇલિંગ"],
        "kn": ["ಆದಾಯ", "ತೆರಿಗೆ", "ರಿಟರ್ನ್", "ಮರುಪಾವತಿ", "ಐಟಿಆರ್", "ಸಲ್ಲಿಕೆ"],
    },
    "file_complaint": {
        "bn": ["অভিযোগ", "সিপিগ্রামস", "আরটিআই", "অমীমাংসিত", "সমস্যা"],
        "mr": ["तक्रार", "सीपीजीआरएएमएस", "आरटीआय", "प्रलंबित", "अडकली"],
        "ta": ["புகார்", "CPGRAMS", "ஆர்டிஐ", "நிலுவை", "சிக்கல்"],
        "te": ["ఫిర్యాదు", "సీపీగ్రామ్స్", "ఆర్‌టీఐ", "పెండింగ్"],
        "gu": ["ફરિયાદ", "સીપીગ્રામ્સ", "આરટીઆઈ", "પેન્ડિંગ", "અટકી"],
        "kn": ["ದೂರು", "ಸಿಪಿಜಿಆರ್‌ಎಎಂಎಸ್", "ಆರ್‌ಟಿಐ", "ಬಾಕಿ"],
    },
    "fresh_passport": {
        "bn": ["পাসপোর্ট", "বিদেশ", "পাসপোর্ট সেবা", "ভেরিফিকেশন"],
        "mr": ["पासपोर्ट", "परदेश", "पासपोर्ट सेवा", "पडताळणी"],
        "ta": ["பாஸ்போர்ட்", "வெளிநாடு", "விண்ணப்பம்", "சரிபார்ப்பு"],
        "te": ["పాస్‌పోర్ట్", "విదేశం", "సేవా", "వెరిఫికేషన్"],
        "gu": ["પાસપોર્ટ", "વિદેશ", "પાસપોર્ટ સેવા", "વેરિફિકેશન"],
        "kn": ["ಪಾಸ್‌ಪೋರ್ಟ್", "ವಿದೇಶ", "ಸೇವೆ", "ಪರಿಶೀಲನೆ"],
    },
}


def detect_language(text: str, tokens: set[str]) -> str:
    if any("\u0980" <= ch <= "\u09FF" for ch in text):
        return "bn"
    if any("\u0B80" <= ch <= "\u0BFF" for ch in text):
        return "ta"
    if any("\u0C00" <= ch <= "\u0C7F" for ch in text):
        return "te"
    if any("\u0A80" <= ch <= "\u0AFF" for ch in text):
        return "gu"
    if any("\u0C80" <= ch <= "\u0CFF" for ch in text):
        return "kn"
    if any("\u0900" <= ch <= "\u097F" for ch in text):
        if any(w in text for w in ("आहे", "करायचा", "करायची", "दुकानाचा", "पुण्यात", "गाडीची", "मिळवायचा", "दाखल")):
            return "mr"
        return "hi"
    if any(w in tokens for w in ("mujhe", "karna", "hai", "chahta", "chahiye", "kholna", "banvana", "kholni", "kharidni")):
        return "hinglish"
    return "en"


def rule_based_parse(text: str) -> dict[str, Any]:
    norm = normalize(text)
    tokens = tokenize(text)

    scores: dict[str, float] = {}
    matched: dict[str, list[str]] = {}
    for event in get_life_events():
        score = 0.0
        hits: list[str] = []
        eid = event["id"]

        # Check existing KB keyword groups
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

        # Check regional Indian language keywords
        if eid in REGIONAL_KEYWORDS:
            for lang_code, kw_list in REGIONAL_KEYWORDS[eid].items():
                for kw in kw_list:
                    kwn = normalize(kw)
                    if kwn in norm or kwn in tokens:
                        score += 2.0
                        hits.append(kw)

        scores[eid] = score
        matched[eid] = hits

    best_id = max(scores, key=lambda k: scores[k])
    total = sum(scores.values()) or 1.0
    confidence = round(min(0.98, max(0.35, scores[best_id] / total)), 2)

    detected_lang = detect_language(text, tokens)

    city = next((c.title() for c in CITY_HINTS if c in tokens or c in norm), None)

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
- Understand English, Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada and Hinglish (Roman-script Hindi/Indian text).
- Respond ONLY with JSON matching this schema:
{{"event_id": "<id>", "confidence": <0-1>, "detected_language": "<en|hi|bn|mr|ta|te|gu|kn|hinglish>", "city": "<city name or null>", "conditions": {{"sells_food": bool, "has_employees": bool, "incorporate_company": bool}}, "reasoning": "<one short line>"}}
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
