import httpx


class BackendClient:
    """Llama a POST /pest-detections del backend con la API key del
    dispositivo (mismo mecanismo de Spec 003, DeviceType.VISION_SERVICE)."""

    def __init__(self, base_url: str, device_api_key: str, timeout: float = 5.0):
        self._base_url = base_url.rstrip("/")
        self._headers = {"X-Device-Key": device_api_key}
        self._timeout = timeout

    def report_detection(self, zone_id: str, count: int) -> httpx.Response:
        response = httpx.post(
            f"{self._base_url}/pest-detections",
            json={"zoneId": zone_id, "count": count},
            headers=self._headers,
            timeout=self._timeout,
        )
        response.raise_for_status()
        return response
