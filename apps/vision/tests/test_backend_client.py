import json

import httpx
import respx

from app.backend_client import BackendClient


@respx.mock
def test_report_detection_envia_zoneid_count_y_device_key():
    route = respx.post("http://backend.test/pest-detections").mock(
        return_value=httpx.Response(200, json={"level": "NORMAL"})
    )
    client = BackendClient("http://backend.test", "clave-secreta")
    client.report_detection("zone-a", 3)

    assert route.called
    request = route.calls[0].request
    assert request.headers["x-device-key"] == "clave-secreta"
    assert json.loads(request.content) == {"zoneId": "zone-a", "count": 3}


@respx.mock
def test_report_detection_lanza_si_el_backend_responde_error():
    respx.post("http://backend.test/pest-detections").mock(
        return_value=httpx.Response(401)
    )
    client = BackendClient("http://backend.test", "clave-invalida")
    try:
        client.report_detection("zone-a", 1)
        assert False, "debió lanzar por status 401"
    except httpx.HTTPStatusError:
        pass
