# Flujos por módulo — SmartRiego MX (borrador para corregir)

Basado en `constitution.md`. Esto es previo a la spec formal de cada módulo — sirve para acordar el flujo antes de escribir RF en EARS. Corregir aquí antes de pasar a [[Spec 001]] por módulo.

## 1. Autenticación y roles

```mermaid
sequenceDiagram
    participant U as Usuario (Agricultor/Admin)
    participant W as Web/Móvil
    participant API as Backend

    U->>W: email + password
    W->>API: POST /auth/login
    API->>API: verificar hash (bcrypt) + generar JWT (incluye role)
    API-->>W: JWT
    W->>API: request con Authorization: Bearer JWT
    API->>API: Guard valida JWT + chequea role requerido
    API-->>W: respuesta (200 o 403 si el role no alcanza)
```

**A corregir:** ¿el Administrador da de alta a los Agricultores (no hay auto-registro), o cualquiera se puede registrar como Agricultor?

## 2. Registro de dispositivos IoT (ESP32 / Raspberry Pi)

```mermaid
sequenceDiagram
    participant Admin
    participant W as Web (panel admin)
    participant API as Backend
    participant Dev as ESP32 / Raspberry Pi

    Admin->>W: Registrar dispositivo (tipo, parcela, zona)
    W->>API: POST /devices
    API->>API: generar API key única
    API-->>Admin: mostrar API key (una sola vez)
    Admin->>Dev: cargar API key en firmware/config
    Dev->>API: request con header X-Device-Key
    API->>API: validar key contra dispositivo registrado
    API-->>Dev: 200 (aceptado) / 401 (rechazado)
```

**A corregir:** ¿la key se puede regenerar/revocar desde el panel? ¿un dispositivo puede moverse de zona sin volver a registrarse?

## 3. Riego inteligente (ciclo por zona)

```mermaid
sequenceDiagram
    participant Z as Zona (sensores + ESP32)
    participant API as Backend
    participant Clima as OpenWeather
    participant V as Válvula/Bomba

    loop cada N minutos
        Z->>API: POST /readings {humedad, temp, zoneId}
        API->>Clima: consultar pronóstico (ubicación de la parcela)
        Clima-->>API: pronóstico de lluvia
        API->>API: motor de decisión (reglas + score modelo + pronóstico)
        alt necesita riego
            API-->>Z: comando REGAR {duración/volumen}
            Z->>V: abrir válvula
            V-->>Z: confirmación
            Z->>API: POST /irrigation-events {ejecutado, duración real}
            API->>API: notificar (dashboard/push) si aplica
        else no necesita riego
            API-->>Z: comando ESPERAR {próxima revisión}
        end
    end
```

**A corregir:** ¿el ESP32 pide permiso antes de regar (como en el diagrama) o el backend empuja el comando de forma proactiva (requeriría algo tipo polling corto o WebSocket, no solo REST)? Esto define si es *pull* (ESP32 pregunta "¿qué hago?") o *push* (backend avisa). Con HTTP REST simple, lo natural es *pull*: el ESP32 manda su lectura y en la misma respuesta recibe el comando.

## 4. Detección de plagas (ciclo por zona)

```mermaid
sequenceDiagram
    participant Cam as Cámara cenital
    participant RPi as Raspberry Pi (YOLO)
    participant API as Backend
    participant Act as Aspersor/bomba (tratamiento)

    loop cada frame (cada X segundos)
        Cam->>RPi: frame
        RPi->>RPi: inferencia YOLO (clase única: plaga objetivo)
        RPi->>RPi: mapear detecciones a zona por posición en imagen
        RPi->>API: POST /pest-detections {zoneId, count, timestamp}
        API->>API: acumular detecciones en ventana de tiempo por zona
        alt count supera umbral en N frames consecutivos
            API->>API: confirmar foco, clasificar nivel (Monitoreo/Intervención)
            alt nivel = Intervención
                API-->>RPi: comando TRATAR {zoneId}
                RPi->>Act: activar aspersor (agua) solo en esa zona
                Act-->>RPi: confirmación
                RPi->>API: POST /pest-treatments {ejecutado}
                API->>API: notificar (dashboard/push)
            end
        end
    end
```

**A corregir:** ¿cuántos frames consecutivos / qué ventana de tiempo define "confirmado"? ¿el tratamiento tiene un cooldown (no repetir cada pocos segundos sobre la misma zona)?

## 5. Notificaciones (push + dashboard + email vía Resend)

```mermaid
flowchart LR
    E1[Foco de plaga confirmado] --> N[Backend crea notificación]
    E2[Riego pendiente / ejecutado] --> N
    E3[Admin da de alta a un Agricultor] --> Trans[Email transaccional]
    E4[Cron diario/semanal] --> Rep[Email de resumen]

    N --> P[Push al móvil del Agricultor dueño]
    N --> D[Badge/alerta en dashboard web]
    N -.crítica.-> R1[Resend: email de alerta]
    Trans --> R2[Resend: bienvenida / reset password]
    Rep --> R3[Resend: resumen de consumo y eventos]
    N -.copia.-> Admin[Administrador ve todas]
```

Tres usos de Resend, a definir en la spec del módulo:
1. **Alertas críticas** (foco de plaga, fallo de dispositivo) — email como respaldo del push, no lo reemplaza.
2. **Transaccionales de cuenta** — bienvenida cuando el Administrador da de alta a un Agricultor, reset de password.
3. **Resumen periódico** — reporte de consumo/eventos por email.

**A corregir:**
- ¿El Administrador recibe push de todo, o solo ve un resumen al entrar al dashboard?
- ¿Cada cuánto va el resumen periódico (diario/semanal) y quién lo recibe (solo Agricultor de esa parcela, o también Admin)?
- ¿Toda alerta crítica manda email, o solo si no hubo confirmación de lectura del push en X minutos?

## 6. Histórico y reportes

```mermaid
flowchart LR
    R1[irrigation_events] --> H[Tabla histórico]
    R2[pest_detections / pest_treatments] --> H
    H --> G1[Gráfica: consumo de agua por parcela/zona]
    H --> G2[Gráfica: ahorro estimado vs. riego continuo]
    H --> G3[Timeline: intervenciones de plaga por zona]
```

**A corregir:** ¿"ahorro estimado" se calcula contra qué línea base (riego fijo diario, por ejemplo)? Falta definir la fórmula si se quiere mostrar ese número en el pitch.

---

Ver [[Home]] · [[Constitucion]] · [[Recursos/Concepto — Riego y plagas]]
