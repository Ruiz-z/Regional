from app.zone_mapping import Centroid, quadrant_for_centroid


def test_centroid_en_cuadrante_superior_izquierdo():
    centroid = Centroid(x=50, y=50)
    assert quadrant_for_centroid(centroid, 640, 480, rows=2, cols=2) == (0, 0)


def test_centroid_en_cuadrante_inferior_derecho():
    centroid = Centroid(x=600, y=450)
    assert quadrant_for_centroid(centroid, 640, 480, rows=2, cols=2) == (1, 1)


def test_centroid_en_cuadrante_superior_derecho():
    centroid = Centroid(x=500, y=50)
    assert quadrant_for_centroid(centroid, 640, 480, rows=2, cols=2) == (0, 1)


def test_centroid_justo_en_el_borde_no_se_sale_del_grid():
    centroid = Centroid(x=640, y=480)
    assert quadrant_for_centroid(centroid, 640, 480, rows=2, cols=2) == (1, 1)


def test_centroid_negativo_no_se_sale_del_grid():
    centroid = Centroid(x=-10, y=-10)
    assert quadrant_for_centroid(centroid, 640, 480, rows=2, cols=2) == (0, 0)


def test_grid_de_3x3():
    centroid = Centroid(x=320, y=240)
    assert quadrant_for_centroid(centroid, 640, 480, rows=3, cols=3) == (1, 1)
