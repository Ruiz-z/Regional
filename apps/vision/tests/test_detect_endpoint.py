import dataclasses
from types import SimpleNamespace
from unittest.mock import patch

import httpx
import numpy as np
import respx
from fastapi.testclient import TestClient

from app.config import settings as base_settings
from app.detector import Detection
from app.main import app

client = TestClient(app)


def _settings_with(**overrides):
    return dataclasses.replace(base_settings, **overrides)


def _fake_camera(frame_ok=True):
    camera = SimpleNamespace()
    frame = np.zeros((480, 640, 3), dtype="uint8") if frame_ok else None
    camera.read = lambda: (frame_ok, frame)
    camera.release = lambda: None
    return camera


def test_detect_rechaza_sin_secreto_interno():
    with patch("app.main.settings", _settings_with(internal_secret="el-secreto")):
        res = client.post("/detect", json={"zoneId": "zone-a"})
    assert res.status_code == 401


def test_detect_rechaza_con_secreto_incorrecto():
    with patch("app.main.settings", _settings_with(internal_secret="el-secreto")):
        res = client.post(
            "/detect",
            json={"zoneId": "zone-a"},
            headers={"X-Internal-Secret": "otro"},
        )
    assert res.status_code == 401


@respx.mock
def test_detect_reporta_deteccion_y_devuelve_confianza():
    respx.post("http://backend.test/pest-detections").mock(
        return_value=httpx.Response(200, json={"level": "MONITOREO"})
    )
    fake_classifier = SimpleNamespace(
        predict=lambda frame: [Detection(x_center=1, y_center=1, confidence=0.87)]
    )
    settings = _settings_with(
        internal_secret="el-secreto", api_base_url="http://backend.test"
    )
    with patch("app.main.settings", settings), patch(
        "cv2.VideoCapture", return_value=_fake_camera()
    ), patch("app.main._get_classifier", return_value=fake_classifier):
        res = client.post(
            "/detect",
            json={"zoneId": "zone-a"},
            headers={"X-Internal-Secret": "el-secreto"},
        )
    assert res.status_code == 200
    assert res.json() == {"detected": True, "confidence": 0.87}


@respx.mock
def test_detect_sin_deteccion_devuelve_confidence_null():
    respx.post("http://backend.test/pest-detections").mock(
        return_value=httpx.Response(200, json={"level": "NORMAL"})
    )
    fake_classifier = SimpleNamespace(predict=lambda frame: [])
    settings = _settings_with(
        internal_secret="el-secreto", api_base_url="http://backend.test"
    )
    with patch("app.main.settings", settings), patch(
        "cv2.VideoCapture", return_value=_fake_camera()
    ), patch("app.main._get_classifier", return_value=fake_classifier):
        res = client.post(
            "/detect",
            json={"zoneId": "zone-a"},
            headers={"X-Internal-Secret": "el-secreto"},
        )
    assert res.status_code == 200
    assert res.json() == {"detected": False, "confidence": None}


def test_detect_devuelve_503_si_la_camara_no_da_frame():
    settings = _settings_with(internal_secret="el-secreto")
    with patch("app.main.settings", settings), patch(
        "cv2.VideoCapture", return_value=_fake_camera(frame_ok=False)
    ):
        res = client.post(
            "/detect",
            json={"zoneId": "zone-a"},
            headers={"X-Internal-Secret": "el-secreto"},
        )
    assert res.status_code == 503
