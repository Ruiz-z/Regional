from dataclasses import dataclass


@dataclass(frozen=True)
class Centroid:
    x: float
    y: float


def quadrant_for_centroid(
    centroid: Centroid,
    frame_width: int,
    frame_height: int,
    rows: int,
    cols: int,
) -> tuple[int, int]:
    """Mapea el centroide de una detección a (fila, columna) de un grid fijo
    de cuadrantes que coincide con las zonas físicas de la maqueta — sin
    calibración manual (spec-005, casos límite)."""
    col = min(cols - 1, max(0, int(centroid.x / frame_width * cols)))
    row = min(rows - 1, max(0, int(centroid.y / frame_height * rows)))
    return row, col
