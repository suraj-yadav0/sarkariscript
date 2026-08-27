# SarkariScript

**AI-powered government form navigator & auto-filler for Indian citizens.**
Type your goal in Hindi, English or Hinglish — get a dependency-mapped roadmap
across every portal involved, with forms pre-filled from a citizen profile you
enter once. Built for the "Build What Moves India" theme.

## What it does

| Feature | Where |
|---|---|
| Intent parser (Hindi / Hinglish / English → life event + city + conditions) | `backend/services/intent.py` — Gemini when `GEMINI_API_KEY` is set, deterministic on-device keyword engine otherwise |
| Knowledge base: 6 life events, 26 steps, 14 portals, real deep links | `backend/kb/knowledge_base.json` |
| Dependency-aware roadmap (topological DAG, conditional steps) | `/roadmap/[eventId]` |
| Smart form pre-filler ("fill once") | Citizen profile in browser storage, pre-fill badges per form field |
| Document checklist with upload-once reuse tracking | Step detail panels |
| Portal health monitor | Home page right rail |
| Complaint → RTI escalation pipeline (Sec 6(1) draft generator) | `/rti` |

Life events today: **Start a Business · Buy a Vehicle · Driving Licence · File ITR · File a Grievance · Fresh Passport**.
Adding a new journey = one JSON entry, no code changes.

## Architecture

```
frontend/  Next.js 16 (App Router, Tailwind v4, Phosphor icons)
backend/   Python FastAPI + httpx (Gemini REST), JSON knowledge base
```

The citizen profile, uploaded-document state and step progress live only in the
browser's localStorage — nothing personal leaves the device except fields you
explicitly submit to the demo API.

## Run it

Backend (Python 3.12):

```bash
cd backend
python3 -m venv .venv
./.venv/bin/pip install -r requirements.txt
./.venv/bin/uvicorn main:app --port 8000
```

Optional — enable Gemini intent parsing:

```bash
cp backend/.env.example backend/.env   # add GEMINI_API_KEY=...
# then: GEMINI_API_KEY=... uvicorn main:app --port 8000
```

Without a key the rule-based parser handles Hindi/Hinglish/English offline —
demos never break on venue Wi-Fi.

Frontend (Node 20+):

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
```

Set `NEXT_PUBLIC_API_URL` if the backend runs elsewhere.

## 2-minute demo script

1. Type *"Mujhe Lucknow mein kirana dukaan kholni hai"* → roadmap appears:
   Shram Suvidha → Udyam → GST REG-01 → FSSAI (food condition auto-detected;
   EPFO/MCA correctly excluded).
2. Open *My details*, fill name/PAN/Aadhaar once, return to the roadmap —
   GST fields show green "pre-filled" chips; only unique fields remain manual.
3. Tick a document once (e.g. Aadhaar) — it flips to uploaded in every step
   that needs it ("reused across forms" summary under the header).
4. Portal status board shows live uptime (real HTTP pings + response time,
   refreshed every 5 min) for all 14 portals.
5. Go to *RTI tool*: paste a CPGRAMS number pending 45 days → one click
   generates a print-ready Section 6(1) application.

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | liveness |
| GET | `/api/life-events[/{id}]` | knowledge base listing |
| POST | `/api/navigate` | `{query}` → intent + ordered roadmap |
| GET | `/api/portals/status` | live uptime board (real HTTP pings + response time, refreshed every 5 min) |
| POST | `/api/rti/draft` | complaint details → RTI letter |
| GET | `/api/stt/config` | whether the local speech-to-text engine is available |
| POST | `/api/stt/transcribe` | audio upload (webm/mp4/ogg) → text (multipart: `audio`, `language`) |

### Speech-to-text fallback

When the browser's native Web Speech API is unavailable or blocked (e.g.
Brave), the frontend records audio with `MediaRecorder` and sends it to
`POST /api/stt/transcribe`, which runs **local** [faster-whisper](https://github.com/SYSTRAN/faster-whisper)
— fully offline, no API key. The Whisper `base` model (~75 MB) is downloaded
from Hugging Face on first request.

Configure it with environment variables (optional):

| Variable | Default | Purpose |
|---|---|---|
| `SARKARISCRIPT_STT_MODEL` | `base` | Whisper model size (e.g. `tiny`, `base`, `small`) |
| `SARKARISCRIPT_STT_DEVICE` | `auto` | `cpu`, `cuda`, or `auto` |
| `SARKARISCRIPT_STT_COMPUTE` | `auto` | compute type override |
| `SARKARISCRIPT_STT_MODEL_DIR` | `~/.cache/huggingface/hub` | where the model is stored |

Speech-to-text (and live portal checks) depend on the environment that runs the
backend: the speech model caches on disk, and portal checks are cached in
process for 5 minutes.

> Disclaimer: demo/hackathon project. Not affiliated with the Government of
> India. Links point to official portals; always verify documents on the
> portal itself.
