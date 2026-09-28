import numpy as np
import pytest

from app.classifier import TeachableMachineClassifier


class FakeInterpreter:
    """Doble de tf.lite.Interpreter: evita requerir tensorflow real en la
    suite de tests (mismo criterio que YoloDetectionModel/ultralytics —
    import perezoso en __init__, nunca ejecutado acá)."""

    def __init__(self, output):
        self._output = np.array([output], dtype="float32")

    def set_tensor(self, index, value):
        pass

    def invoke(self):
        pass

    def get_tensor(self, index):
        return self._output


def make_classifier(output, confidence_threshold=0.5):
    classifier = object.__new__(TeachableMachineClassifier)
    classifier._interpreter = FakeInterpreter(output)
    classifier._input_detail = {"index": 0, "dtype": np.dtype("float32")}
    classifier._output_detail = {"index": 0}
    classifier._labels = ["Malas", "Buenas"]
    classifier._confidence_threshold = confidence_threshold
    return classifier


def make_frame():
    return np.zeros((480, 640, 3), dtype="uint8")


def test_malas_con_confianza_alta_devuelve_una_deteccion_centrada_en_el_frame():
    classifier = make_classifier([0.9, 0.1])  # índice 0 = Malas
    result = classifier.predict(make_frame())
    assert len(result) == 1
    assert result[0].x_center == 320
    assert result[0].y_center == 240
    assert result[0].confidence == pytest.approx(0.9)


def test_malas_con_confianza_por_debajo_del_umbral_no_reporta_nada():
    classifier = make_classifier([0.6, 0.4], confidence_threshold=0.8)
    assert classifier.predict(make_frame()) == []


def test_buenas_no_reporta_nada_aunque_tenga_confianza_alta():
    classifier = make_classifier([0.1, 0.9])  # índice 1 = Buenas
    assert classifier.predict(make_frame()) == []
