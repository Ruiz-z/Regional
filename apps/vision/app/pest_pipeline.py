from .detector import DetectionModel
from .zone_mapping import Centroid, quadrant_for_centroid


class PestPipeline:
    """Un frame -> conteo de detecciones por zona. Reporta explícitamente 0
    para zonas sin detección en este frame: el backend usa ese 0 para
    resetear su contador de frames consecutivos (spec-005 RF-2)."""

    def __init__(
        self,
        model: DetectionModel,
        zone_map: dict[tuple[int, int], str],
        frame_width: int,
        frame_height: int,
        rows: int,
        cols: int,
    ):
        self._model = model
        self._zone_map = zone_map
        self._frame_width = frame_width
        self._frame_height = frame_height
        self._rows = rows
        self._cols = cols

    def count_by_zone(self, frame) -> dict[str, int]:
        counts: dict[str, int] = {zone_id: 0 for zone_id in set(self._zone_map.values())}
        for detection in self._model.predict(frame):
            quadrant = quadrant_for_centroid(
                Centroid(detection.x_center, detection.y_center),
                self._frame_width,
                self._frame_height,
                self._rows,
                self._cols,
            )
            zone_id = self._zone_map.get(quadrant)
            if zone_id is not None:
                counts[zone_id] = counts.get(zone_id, 0) + 1
        return counts
