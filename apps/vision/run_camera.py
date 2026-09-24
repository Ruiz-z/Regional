"""Punto de entrada real (cámara física): cámara -> inferencia -> POST
/pest-detections. No se ejecuta en tests (requiere cv2 + una cámara/webcam
conectada); ver app/capture_loop.py para la lógica testeada del loop.
"""

import logging

import cv2

from app.backend_client import BackendClient
from app.capture_loop import run_loop
from app.config import settings
from app.detector import YoloDetectionModel
from app.pest_pipeline import PestPipeline

logging.basicConfig(level=logging.INFO)


def main() -> None:
    camera = cv2.VideoCapture(0)
    camera.set(cv2.CAP_PROP_FRAME_WIDTH, settings.frame_width)
    camera.set(cv2.CAP_PROP_FRAME_HEIGHT, settings.frame_height)

    def capture_frame():
        ok, frame = camera.read()
        return frame if ok else None

    model = YoloDetectionModel(
        settings.weights_path, confidence_threshold=settings.confidence_threshold
    )
    pipeline = PestPipeline(
        model=model,
        zone_map=settings.zone_map,
        frame_width=settings.frame_width,
        frame_height=settings.frame_height,
        rows=settings.grid_rows,
        cols=settings.grid_cols,
    )
    client = BackendClient(settings.api_base_url, settings.device_api_key)

    try:
        run_loop(pipeline, client, capture_frame, settings.capture_interval_seconds)
    finally:
        camera.release()


if __name__ == "__main__":
    main()
