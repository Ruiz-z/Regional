import json
import os
from dataclasses import dataclass, field

from dotenv import load_dotenv

# Sin esto, python-dotenv nunca carga .env y todos los os.getenv() de abajo
# devuelven sus defaults (puerto equivocado, sin API key, ZONE_MAP vacío) —
# el servicio corre "silencioso" sin reportar nada y sin ningún error visible.
load_dotenv()


def _parse_zone_map(raw: str) -> dict[tuple[int, int], str]:
    """ZONE_MAP viene como JSON {"fila,col": "zoneId"} — mapeo fijo de
    cuadrante a zona física de la maqueta (spec-005, casos límite: sin
    calibración manual)."""
    if not raw:
        return {}
    parsed: dict[str, str] = json.loads(raw)
    zone_map: dict[tuple[int, int], str] = {}
    for key, zone_id in parsed.items():
        row_str, col_str = key.split(",")
        zone_map[(int(row_str), int(col_str))] = zone_id
    return zone_map


@dataclass(frozen=True)
class Settings:
    api_base_url: str = os.getenv("API_BASE_URL", "http://localhost:4000")
    device_api_key: str = os.getenv("DEVICE_API_KEY", "")
    grid_rows: int = int(os.getenv("GRID_ROWS", "2"))
    grid_cols: int = int(os.getenv("GRID_COLS", "2"))
    frame_width: int = int(os.getenv("FRAME_WIDTH", "640"))
    frame_height: int = int(os.getenv("FRAME_HEIGHT", "480"))
    confidence_threshold: float = float(os.getenv("CONFIDENCE_THRESHOLD", "0.5"))
    capture_interval_seconds: float = float(
        os.getenv("CAPTURE_INTERVAL_SECONDS", "5")
    )
    weights_path: str = os.getenv("YOLO_WEIGHTS_PATH", "yolo11n.pt")
    # "classifier" (Teachable Machine, default) o "yolo" (detector real por
    # cajas, cuando exista un modelo entrenado propio).
    model_backend: str = os.getenv("MODEL_BACKEND", "classifier")
    classifier_model_path: str = os.getenv(
        "CLASSIFIER_MODEL_PATH", "app/models/pest_classifier.tflite"
    )
    classifier_labels_path: str = os.getenv(
        "CLASSIFIER_LABELS_PATH", "app/models/labels.txt"
    )
    zone_map: dict[tuple[int, int], str] = field(
        default_factory=lambda: _parse_zone_map(os.getenv("ZONE_MAP", ""))
    )
    # Botón "Llamar dron" (POST /detect): autentica la llamada backend -> acá.
    # Sin valor, /detect rechaza siempre (falla cerrado, mismo criterio que
    # CronSecretGuard del lado del backend).
    internal_secret: str = os.getenv("VISION_INTERNAL_SECRET", "")
    # Cámara USB (distinta de la cámara 0, que ya usa el loop continuo de
    # run_camera.py para Zona 1).
    on_demand_camera_index: int = int(os.getenv("ON_DEMAND_CAMERA_INDEX", "1"))


settings = Settings()
