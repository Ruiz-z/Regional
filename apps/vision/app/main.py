import logging

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

from .backend_client import BackendClient
from .config import settings

app = FastAPI(title="SmartRiego MX — Servicio de Visión")
logger = logging.getLogger(__name__)

# Import perezoso del clasificador real (mismo criterio que
# TeachableMachineClassifier/YoloDetectionModel: no requiere tensorflow
# instalado para correr los tests de este módulo con un doble de prueba).
_classifier = None


def _get_classifier():
    global _classifier
    if _classifier is None:
        from .classifier import TeachableMachineClassifier

        _classifier = TeachableMachineClassifier(
            settings.classifier_model_path,
            settings.classifier_labels_path,
            confidence_threshold=settings.confidence_threshold,
        )
    return _classifier


class DetectRequest(BaseModel):
    zoneId: str


class DetectResponse(BaseModel):
    detected: bool
    confidence: float | None


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/detect", response_model=DetectResponse)
def detect(
    body: DetectRequest, x_internal_secret: str = Header(default="")
) -> DetectResponse:
    """Botón "Llamar dron": detección puntual con la cámara USB (distinta de
    la cámara 0, que ya corre en loop continuo para Zona 1 vía
    run_camera.py). Abre la cámara, lee UN frame, la libera enseguida — no
    compite por el dispositivo con el loop continuo."""
    if not settings.internal_secret or x_internal_secret != settings.internal_secret:
        raise HTTPException(status_code=401, detail="Secreto interno inválido")

    import cv2

    camera = cv2.VideoCapture(settings.on_demand_camera_index)
    try:
        ok, frame = camera.read()
    finally:
        camera.release()

    if not ok or frame is None:
        raise HTTPException(
            status_code=503, detail="No se pudo capturar un frame de la cámara"
        )

    detections = _get_classifier().predict(frame)
    detected = len(detections) > 0
    confidence = detections[0].confidence if detected else None

    try:
        BackendClient(settings.api_base_url, settings.device_api_key).report_detection(
            body.zoneId, 1 if detected else 0
        )
    except Exception as exc:  # best-effort: la detección ya se calculó igual
        logger.warning("Fallo al reportar detección puntual: %s", exc)

    return DetectResponse(detected=detected, confidence=confidence)
