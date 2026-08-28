import asyncio
import time
from datetime import datetime, timezone

import httpx

from .intent import load_kb

REFRESH_SECONDS = 300
MAX_CONCURRENT = 12

_cache: dict[str, object] | None = None
_cache_ts: float = 0.0
_lock = asyncio.Lock()

TIMEOUT = httpx.Timeout(20.0)
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    ),
    "Accept": (
        "text/html,application/xhtml+xml,application/xml;q=0.9,"
        "image/avif,image/webp,*/*;q=0.8"
    ),
    "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
}

_semaphore = asyncio.Semaphore(MAX_CONCURRENT)


def _health_from(response: httpx.Response | None) -> str:
    if response is None:
        return "down"
    code = response.status_code
    if code < 400 or code in (403, 429):
        return "up"
    if code < 500:
        return "degraded"
    return "down"


async def _request(url: str, method: str) -> httpx.Response | None:
    try:
        async with httpx.AsyncClient(
            timeout=TIMEOUT, follow_redirects=True, headers=HEADERS
        ) as client:
            return await client.request(method, url)
    except Exception:
        return None


async def _fetch(url: str) -> httpx.Response | None:
    async with _semaphore:
        response = await _request(url, "GET")

        if response is None or response.status_code >= 500:
            await asyncio.sleep(1)
            response = await _request(url, "GET")

        if response is None or response.status_code >= 400:
            head = await _request(url, "HEAD")
            if head is not None:
                response = head

        return response


async def _ping(portal: dict) -> dict:
    started = time.perf_counter()
    url = portal["url"]
    response = await _fetch(url)
    latency_ms = int((time.perf_counter() - started) * 1000)

    return {
        "portal_id": portal["id"],
        "name_en": portal["name_en"],
        "name_hi": portal["name_hi"],
        "short": portal["short"],
        "url": url,
        "status": _health_from(response),
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
