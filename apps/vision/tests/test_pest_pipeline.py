from app.detector import Detection
from app.pest_pipeline import PestPipeline


class FakeModel:
    def __init__(self, detections):
        self._detections = detections

    def predict(self, frame):
        return self._detections


ZONE_MAP = {(0, 0): "zone-a", (0, 1): "zone-b"}


def make_pipeline(detections):
    return PestPipeline(
        model=FakeModel(detections),
        zone_map=ZONE_MAP,
        frame_width=640,
        frame_height=480,
        rows=2,
        cols=2,
    )


def test_sin_detecciones_reporta_cero_en_todas_las_zonas_conocidas():
    pipeline = make_pipeline([])
    assert pipeline.count_by_zone(frame=None) == {"zone-a": 0, "zone-b": 0}


def test_una_deteccion_en_zona_a():
    detections = [Detection(x_center=50, y_center=50, confidence=0.9)]
    pipeline = make_pipeline(detections)
    result = pipeline.count_by_zone(frame=None)
    assert result["zone-a"] == 1
    assert result["zone-b"] == 0


def test_dos_detecciones_zonas_distintas_son_independientes():
    detections = [
        Detection(x_center=50, y_center=50, confidence=0.9),  # zone-a
        Detection(x_center=500, y_center=50, confidence=0.9),  # zone-b
    ]
    pipeline = make_pipeline(detections)
    result = pipeline.count_by_zone(frame=None)
    assert result == {"zone-a": 1, "zone-b": 1}


def test_multiples_detecciones_en_la_misma_zona_se_suman():
    detections = [
        Detection(x_center=10, y_center=10, confidence=0.9),
        Detection(x_center=20, y_center=20, confidence=0.9),
        Detection(x_center=30, y_center=30, confidence=0.9),
    ]
    pipeline = make_pipeline(detections)
    result = pipeline.count_by_zone(frame=None)
    assert result["zone-a"] == 3


def test_deteccion_fuera_del_zone_map_configurado_se_ignora():
    # cuadrante (1,1) no está en ZONE_MAP (solo se configuraron 2 zonas)
    detections = [Detection(x_center=600, y_center=450, confidence=0.9)]
    pipeline = make_pipeline(detections)
    result = pipeline.count_by_zone(frame=None)
    assert result == {"zone-a": 0, "zone-b": 0}
