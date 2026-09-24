# Spec 003 — Registro y autenticación de dispositivos IoT

## Contexto y objetivo
El ESP32 (riego) y el servicio de visión (plagas) necesitan mandar datos al backend de forma segura y quedar asignados a una zona específica (constitution.md #10).

## Usuarios / actores
Administrador (da de alta/revoca dispositivos), ESP32/servicio de visión (consumen la API con su key).

## Historias de usuario
- H1: Como Administrador quiero registrar un dispositivo y asignarlo a una zona para que sus lecturas se apliquen ahí.
- H2: Como Administrador quiero revocar la key de un dispositivo comprometido o dado de baja.

## Requisitos funcionales (EARS)
- RF-1: CUANDO un Administrador registra un dispositivo (`POST /devices` con tipo `ESP32`/`VISION_SERVICE` y `zoneId`), EL SISTEMA genera una API key única y la muestra una sola vez.
- RF-2: EL SISTEMA exige el header `X-Device-Key` en todo endpoint de ingestión (`/readings`, `/pest-detections`) y lo valida contra un dispositivo activo.
- RF-3: SI la API key no corresponde a ningún dispositivo activo, ENTONCES EL SISTEMA responde 401 y no persiste el payload.
- RF-4: CUANDO un Administrador revoca un dispositivo (`DELETE /devices/:id` o `POST /devices/:id/revoke`), EL SISTEMA invalida su key inmediatamente.
- RF-5: EL SISTEMA muestra en el panel de Administrador el estado de cada dispositivo: online (lectura en los últimos 5 minutos) u offline (sin lectura en más de 5 minutos).

## Requisitos no funcionales
- La API key no se puede volver a mostrar tras su creación (solo regenerar, invalidando la anterior).

## Casos límite
- Dispositivo reasignado a otra zona → conserva su key, cambia solo `zoneId`.
- Dos dispositivos del mismo tipo en la misma zona → permitido (ej. sensor de humedad + actuador separados).
- Dispositivo revocado que sigue mandando requests → siempre 401, aunque la key haya sido válida antes.
- Regenerar key de un dispositivo activo → la key anterior deja de funcionar de inmediato, aunque el dispositivo no haya sido revocado.

## Fuera de alcance
- Aprovisionamiento automático (zero-touch); el alta siempre la hace un Administrador manualmente.

## Criterios de finalización
- RF-1 a RF-5 con test en verde + demo manual: registrar un dispositivo, mandar una lectura con su key, revocarlo y confirmar que la siguiente lectura es rechazada.

## Diagrama — todos los casos de ingestión con API key

```mermaid
flowchart TD
    Start(["Dispositivo (ESP32/servicio de visión)\nenvía POST /readings o /pest-detections"]) --> HasKey{"¿Trae header\nX-Device-Key?"}
    HasKey -- No --> R401a["401 Unauthorized\nno persiste payload (RF-2)"]
    HasKey -- Sí --> Lookup{"¿La key existe\nen la base?"}
    Lookup -- No --> R401b["401 Unauthorized\nno persiste payload (RF-3)"]
    Lookup -- Sí --> Revoked{"¿El dispositivo\nestá revocado?"}
    Revoked -- Sí --> R401c["401 Unauthorized\naunque la key haya sido válida antes"]
    Revoked -- No --> Regenerated{"¿La key coincide con\nla versión vigente?\n(no fue regenerada)"}
    Regenerated -- No, key vieja --> R401d["401 Unauthorized\nkey anterior invalidada al regenerar"]
    Regenerated -- Sí --> Persist["Persiste el payload\nasociado a zoneId del dispositivo"]
    Persist --> UpdateLastSeen["Actualiza lastSeenAt del dispositivo\n(usado para online/offline, RF-5)"]
    UpdateLastSeen --> R200["200 OK"]
```

```mermaid
flowchart TD
    A0(["Administrador: alta de dispositivo"]) --> A1["POST /devices\n{type, zoneId}"]
    A1 --> A2["Sistema genera API key única"]
    A2 --> A3["Se muestra UNA SOLA VEZ al Administrador"]
    A3 --> A4["Administrador carga la key\nen el firmware/config del dispositivo"]

    A0b(["Administrador: gestión posterior"]) --> B1{"Acción"}
    B1 -- "Revocar" --> B2["Invalida la key de inmediato"] --> B3["Dispositivo pasa a 401\nen cualquier request futuro"]
    B1 -- "Regenerar key" --> B4["Genera nueva key, invalida la anterior"] --> B5["Se muestra la nueva UNA SOLA VEZ"]
    B1 -- "Reasignar zona" --> B6["Cambia zoneId,\nconserva la misma key"]
```

## Dudas abiertas
- Ninguna bloqueante.
