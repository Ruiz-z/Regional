import logging
import time
from typing import Callable, Optional

from .backend_client import BackendClient
from .pest_pipeline import PestPipeline

logger = logging.getLogger(__name__)


def run_loop(
    pipeline: PestPipeline,
    client: BackendClient,
    capture_frame: Callable[[], object],
    interval_seconds: float,
    max_iterations: Optional[int] = None,
) -> None:
    """capture_frame se inyecta (en vez de llamar directo a cv2) para poder
    testear el loop sin cámara real. Un fallo al reportar una zona no debe
    tumbar el loop ni bloquear el reporte de las demás zonas."""
    iterations = 0
    while max_iterations is None or iterations < max_iterations:
        frame = capture_frame()
        if frame is not None:
            counts = pipeline.count_by_zone(frame)
            for zone_id, count in counts.items():
                try:
                    client.report_detection(zone_id, count)
                except Exception as exc:
                    logger.warning("Fallo al reportar detección de %s: %s", zone_id, exc)

        iterations += 1
        if max_iterations is None or iterations < max_iterations:
            time.sleep(interval_seconds)
