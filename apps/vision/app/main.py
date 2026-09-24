from fastapi import FastAPI

app = FastAPI(title="SmartRiego MX — Servicio de Visión")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
