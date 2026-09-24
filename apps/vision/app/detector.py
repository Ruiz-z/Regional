from dataclasses import dataclass
from typing import Protocol, Sequence


@dataclass(frozen=True)
class Detection:
    x_center: float
    y_center: float
    confidence: float


class DetectionModel(Protocol):
    def predict(self, frame) -> Sequence[Detection]: ...


class YoloDetectionModel:
    """Wrapper sobre ultralytics YOLO — una sola clase objetivo, la plaga
    elegida (constitution.md #7). Import perezoso: no requiere torch
    instalado para correr los tests del resto del pipeline."""

    def __init__(self, weights_path: str, confidence_threshold: float = 0.5):
        from ultralytics import YOLO

        self._model = YOLO(weights_path)
        self._confidence_threshold = confidence_threshold

    def predict(self, frame) -> list[Detection]:
        results = self._model.predict(frame, verbose=False)[0]
        detections: list[Detection] = []
        for box in results.boxes:
            confidence = float(box.conf[0])
            if confidence < self._confidence_threshold:
                continue
            x1, y1, x2, y2 = (float(v) for v in box.xyxy[0])
            detections.append(
                Detection(
                    x_center=(x1 + x2) / 2,
                    y_center=(y1 + y2) / 2,
                    confidence=confidence,
                )
            )
        return detections
