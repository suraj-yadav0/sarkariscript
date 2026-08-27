# SarkariScript Backend

Python **FastAPI** service powering SarkariScript: intent parsing, roadmap
generation, live portal health, RTI drafting, and a local speech-to-text
fallback.

## Run it

```bash
python3 -m venv .venv
./.venv/bin/pip install -r requirements.txt
./.venv/bin/uvicorn main:app --port 8000
```

Interactive docs: http://localhost:8000/docs

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | liveness |
| GET | `/api/life-events[/{id}]` | knowledge base listing |
| POST | `/api/navigate` | `{query}` → intent + ordered roadmap |
| GET | `/api/portals/status` | live uptime board (`?force=1` re-pings immediately) |
| POST | `/api/rti/draft` | complaint details → RTI letter |
| GET | `/api/stt/config` | whether the local speech-to-text engine is available |
| POST | `/api/stt/transcribe` | audio upload (webm/mp4/ogg) → text |

## Services

| Service | File | Notes |
|---|---|---|
| Intent / roadmap | `services/intent.py` | Gemini via `GEMINI_API_KEY`, deterministic on-device engine otherwise |
| Portal health | `services/portals.py` | real HTTP pings (httpx), status + response time, cached in process for 5 min |
| RTI draft | `services/rti.py` | Section 6(1) letter generator |
| Speech-to-text | `services/stt.py` | local faster-whisper; no API key, model auto-downloaded on first use |

### Portal health

Pings each URL from `kb/knowledge_base.json` concurrently with `httpx`. Status
is derived from the HTTP response: `<400` up, `400–499` degraded, `500+`/error
down. `avg_latency_ms` is the real round-trip time. Results are cached for 300s;
passing `?force=1` (`GET /api/portals/status?force=1`) bypasses the cache for an
immediate re-check (used by the refresh button).

### Speech-to-text

Used by the frontend as a fallback when the browser's native Web Speech API is
unavailable or blocked (e.g. Brave). Accepts multipart `audio` plus an optional
`language` (ISO 639-1, e.g. `hi`):

```bash
curl -F "audio=@speech.webm" -F "language=hi" \
  http://localhost:8000/api/stt/transcribe
```

Response:

```json
{ "text": "…", "language": "hi", "language_probability": 0.98, "duration": 2.1 }
```

Configuration (environment variables):

| Variable | Default | Purpose |
|---|---|---|
| `SARKARISCRIPT_STT_MODEL` | `base` | Whisper model size (`tiny`, `base`, `small`, …) |
| `SARKARISCRIPT_STT_DEVICE` | `auto` | `cpu`, `cuda`, or `auto` |
| `SARKARISCRIPT_STT_COMPUTE` | `auto` | compute type override |
| `SARKARISCRIPT_STT_MODEL_DIR` | `~/.cache/huggingface/hub` | model cache dir |

## Configuration

See `.env.example`. Optional keys: `GEMINI_API_KEY`, `GEMINI_MODEL`, and the
`SARKARISCRIPT_STT_*` variables above.
