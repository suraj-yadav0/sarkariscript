from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.intent import build_roadmap, get_event, get_life_events, parse_intent
from services.portals import portal_statuses
from services.rti import draft_rti

app = FastAPI(title="SarkariScript API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class NavigateIn(BaseModel):
    query: str


class RtiDraftIn(BaseModel):
    applicant_name: str = ""
    applicant_address: str = ""
    applicant_phone: str = ""
    applicant_email: str = ""
    department: str = ""
    grievance_number: str = ""
    filed_on: str = ""
    subject: str = ""
    days_pending: int = 30
    info_sought: str | None = None


@app.get("/api/health")
def health() -> dict:
    return {"ok": True, "service": "sarkariscript", "version": "1.0.0"}


@app.get("/api/life-events")
def life_events() -> list[dict]:
    return [
        {k: v for k, v in ev.items() if k != "steps"}
        for ev in get_life_events()
    ]


@app.get("/api/life-events/{event_id}")
def life_event(event_id: str) -> dict:
    event = get_event(event_id)
    if event is None:
        raise HTTPException(status_code=404, detail="Life event not found")
    return event


@app.post("/api/navigate")
async def navigate(payload: NavigateIn) -> dict:
    query = payload.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query is empty")
    intent = await parse_intent(query)
    roadmap = build_roadmap(intent["event_id"], intent.get("conditions", {}))
    return {"intent": intent, **roadmap}


@app.get("/api/portals/status")
async def portals_status(force: bool = False) -> dict:
    return {"portals": await portal_statuses(force=force)}


@app.post("/api/rti/draft")
def rti_draft(payload: RtiDraftIn) -> dict:
    return draft_rti(payload.model_dump())
