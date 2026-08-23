import hashlib
from datetime import datetime, timezone

from .intent import load_kb


def _seeded_status(portal_id: str, hour_bucket: int) -> str:
    digest = hashlib.sha256(f"{portal_id}:{hour_bucket}".encode()).hexdigest()
    value = int(digest[:8], 16) % 100
    if portal_id == "MCA":
        if value < 55:
            return "up"
        if value < 80:
            return "degraded"
        return "down"
    if value < 78:
        return "up"
    if value < 92:
        return "degraded"
    return "down"


def _latency_ms(portal_id: str, hour_bucket: int) -> int:
    digest = hashlib.sha256(f"lat:{portal_id}:{hour_bucket}".encode()).hexdigest()
    base = int(digest[:6], 16) % 900
    return 180 + (base * 4)


def portal_statuses() -> list[dict[str, object]]:
    hour_bucket = int(datetime.now(timezone.utc).timestamp() // 3600)
    statuses = []
    for portal in load_kb()["portals"]:
        status = _seeded_status(portal["id"], hour_bucket)
        statuses.append(
            {
                "portal_id": portal["id"],
                "name_en": portal["name_en"],
                "name_hi": portal["name_hi"],
                "short": portal["short"],
                "url": portal["url"],
                "status": status,
                "avg_latency_ms": _latency_ms(portal["id"], hour_bucket),
                "checked_at": datetime.now(timezone.utc).isoformat(),
            }
        )
    return statuses
