import os
import tempfile

MODEL_SIZE = os.environ.get("SARKARISCRIPT_STT_MODEL", "base")
DEVICE = os.environ.get("SARKARISCRIPT_STT_DEVICE", "auto")
COMPUTE_TYPE = os.environ.get("SARKARISCRIPT_STT_COMPUTE", "auto")
MODEL_DIR = os.environ.get(
    "SARKARISCRIPT_STT_MODEL_DIR", os.path.expanduser("~/.cache/huggingface/hub")
)

_model = None


def _get_model():
    global _model
    if _model is None:
        from faster_whisper import WhisperModel

        _model = WhisperModel(
            MODEL_SIZE,
            device=DEVICE,
            compute_type=COMPUTE_TYPE,
            download_root=MODEL_DIR,
        )
    return _model


def is_available() -> bool:
    try:
        _get_model()
        return True
    except Exception:
        return False


def transcribe(data: bytes, language: str | None = None) -> dict:
    model = _get_model()
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
        tmp.write(data)
        tmp_path = tmp.name
    try:
        segments, info = model.transcribe(
            tmp_path,
            language=language if language and language != "und" else None,
            beam_size=5,
        )
        text = " ".join(seg.text.strip() for seg in segments).strip()
        return {
            "text": text,
            "language": info.language,
            "language_probability": round(float(info.language_probability), 4),
            "duration": round(info.duration, 2) if info.duration else None,
        }
    finally:
        os.unlink(tmp_path)
