import asyncio
import time
from datetime import datetime, timezone

import httpx

from .intent import load_kb

REFRESH_SECONDS = 300

_cache: dict[str, object] | None = None
_cache_ts: float = 0.0
_lock = asyncio.Lock()

TIMEOUT = httpx.Timeout(15.0)
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
    )
}


def _health_from(response: httpx.Response | None, latency_ms: int) -> str:
    if response is None:
        return "down"
    code = response.status_code
    if code < 400:
        return "up"
    if code < 500:
        return "degraded"
    return "down"


async def _ping(portal: dict) -> dict:
    started = time.perf_counter()
    url = portal["url"]
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=True,
                                     headers=HEADERS) as client:
            resp = await client.get(url)
        latency_ms = int((time.perf_counter() - started) * 1000)
        status = _health_from(resp, latency_ms)
    except Exception:
        latency_ms = int((time.perf_counter() - started) * 1000)
        status = "down"

    return {
        "portal_id": portal["id"],
        "name_en": portal["name_en"],
        "name_hi": portal["name_hi"],
        "short": portal["short"],
        "url": url,
        "status": status,
        "avg_latency_ms": latency_ms,
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }


async def _refresh() -> list[dict]:
    portals = load_kb()["portals"]
    results = await asyncio.gather(*(_ping(p) for p in portals))
    return list(results)


async def portal_statuses(force: bool = False) -> list[dict]:
    global _cache, _cache_ts
    async with _lock:
        if force or _cache is None or (time.monotonic() - _cache_ts) >= REFRESH_SECONDS:
            try:
                results = await _refresh()
            except Exception:
                if _cache is not None:
                    return list(_cache)
                raise
            _cache = list(results)
            _cache_ts = time.monotonic()
        return list(_cache)
