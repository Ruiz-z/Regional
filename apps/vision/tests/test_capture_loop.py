from app.capture_loop import run_loop


class FakePipeline:
    def __init__(self, counts):
        self._counts = counts

    def count_by_zone(self, frame):
        return self._counts


class FakeClient:
    def __init__(self, fail_zones=None):
        self.calls = []
        self._fail_zones = fail_zones or set()

    def report_detection(self, zone_id, count):
        if zone_id in self._fail_zones:
            raise RuntimeError("backend caído")
        self.calls.append((zone_id, count))


def test_reporta_cada_zona_del_frame_capturado():
    pipeline = FakePipeline({"zone-a": 2, "zone-b": 0})
    client = FakeClient()
    run_loop(
        pipeline,
        client,
        capture_frame=lambda: "frame",
        interval_seconds=0,
        max_iterations=1,
    )
    assert set(client.calls) == {("zone-a", 2), ("zone-b", 0)}


def test_frame_none_no_reporta_nada_esa_iteracion():
    pipeline = FakePipeline({"zone-a": 5})
    client = FakeClient()
    run_loop(
        pipeline,
        client,
        capture_frame=lambda: None,
        interval_seconds=0,
        max_iterations=1,
    )
    assert client.calls == []


def test_fallo_al_reportar_una_zona_no_detiene_el_reporte_de_las_demas():
    pipeline = FakePipeline({"zone-a": 1, "zone-b": 2})
    client = FakeClient(fail_zones={"zone-a"})
    run_loop(
        pipeline,
        client,
        capture_frame=lambda: "frame",
        interval_seconds=0,
        max_iterations=1,
    )
    assert client.calls == [("zone-b", 2)]


def test_corre_exactamente_max_iterations_veces():
    pipeline = FakePipeline({"zone-a": 1})
    client = FakeClient()
    run_loop(
        pipeline,
        client,
        capture_frame=lambda: "frame",
        interval_seconds=0,
        max_iterations=3,
    )
    assert len(client.calls) == 3
