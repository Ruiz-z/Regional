# Spec 004 — Riego inteligente por zona

## Contexto y objetivo
El corazón del producto: decidir cuándo/cuánto regar cada zona y ejecutar la acción, no solo recomendarla (constitution.md #6, diferenciador vs IRRIMODEL en `Recursos/Diferenciación vs IrriModel` del vault).

## Usuarios / actores
Agricultor/Administrador (consultan estado), ESP32 (reporta lecturas y ejecuta comandos).

## Historias de usuario
- H1: Como Agricultor quiero que cada zona se riegue automáticamente solo cuando lo necesita, sin intervención manual.
- H2: Como Agricultor quiero ver por qué el sistema decidió regar o no regar una zona.

## Requisitos funcionales (EARS)
- RF-1: CUANDO el ESP32 de una zona envía una lectura (`POST /readings` con humedad, temperatura), EL SISTEMA la persiste asociada a esa zona y su timestamp.
- RF-2: CUANDO se recibe una lectura, EL SISTEMA consulta el pronóstico de lluvia (OpenWeather) para la ubicación de la parcela.
- RF-3: EL SISTEMA calcula una recomendación de riego combinando: humedad actual vs. umbral de la zona, pronóstico de lluvia, y el score de un modelo entrenado con dataset (constitution.md #6).
- RF-4: EL SISTEMA responde a la request de lectura (RF-1) con un comando `REGAR {duración}` o `ESPERAR {próxima revisión}`, y la razón de la decisión (humedad, pronóstico, score).
- RF-5: CUANDO el ESP32 reporta que ejecutó un riego (`POST /irrigation-events`), EL SISTEMA registra el evento (zona, duración real, humedad antes/después de la siguiente lectura).
- RF-6: EL SISTEMA nunca aplica una decisión de riego a más de una zona por el estado de otra — cada zona se evalúa de forma independiente.
- RF-7: EL SISTEMA reevalúa la decisión de cada zona **cada 1 minuto**, en cada lectura del ESP32.
- RF-8: SI una decisión fue `ESPERAR` por pronóstico de lluvia (RF-4), ENTONCES EL SISTEMA compara, en la lectura del siguiente ciclo, el incremento real de humedad contra el esperado; si no subió lo suficiente, EL SISTEMA cambia la decisión a `REGAR` (riego de respaldo) y lo marca como "corrección por lluvia insuficiente" para Spec 006 (Notificaciones).
- RF-9: SI una zona recibe 3 ciclos de riego consecutivos (RF-4 = `REGAR`) sin que la humedad suba respecto a la lectura anterior, ENTONCES EL SISTEMA marca la zona como "anomalía de riego" y lo notifica según Spec 006 (posible falla física: válvula, sensor, suministro).

## Requisitos no funcionales
- Ciclo de lectura/decisión: cada 1 minuto (RF-7).
- Consumo de agua se mide en **tiempo regado (minutos)**, no en litros — evita depender de un caudal físico conocido.
- Mock de clima solo en tests automatizados (constitution.md #13).

## Casos límite
- Falla la consulta a OpenWeather → el sistema decide solo con humedad+modelo, sin pronóstico, y lo indica en la razón mostrada.
- Lectura de humedad fuera de rango físico (ej. negativa o >100%) → se descarta y se loguea, no se usa para decidir.

## Fuera de alcance
- **Riego manual/override por el Agricultor**: el sistema es 100% automático en v1, no existe botón de "regar ahora".
- Cálculo de volumen exacto de agua en litros (se mide en minutos regados, ver Requisitos no funcionales).

## Criterios de finalización
- RF-1 a RF-9 con test en verde (motor de decisión con distintos escenarios humedad/pronóstico, incluyendo el caso de corrección por lluvia insuficiente y el de anomalía) + demo física: una zona con humedad baja riega, otra con humedad normal no.

## Diagrama — ciclo completo de decisión (todos los casos)

```mermaid
flowchart TD
    R0(["ESP32 envía POST /readings\n{humidity, temperature} — cada 1 min (RF-7)"]) --> R1{"¿Lectura dentro\nde rango físico\n(0-100% humedad)?"}
    R1 -- No --> R2["Se descarta y se loguea\nno se usa para decidir"]
    R1 -- Sí --> R3["Persiste la lectura (RF-1)"]
    R3 --> R4{"¿OpenWeather\nresponde?"}
    R4 -- No --> R5["Decide solo con humedad+modelo\nsin pronóstico, lo indica en la razón"]
    R4 -- Sí --> R6["Incluye pronóstico de lluvia\nen la decisión"]
    R5 --> R7["Motor de decisión:\nhumedad vs. umbral + pronóstico + score del modelo (RF-3)"]
    R6 --> R7
    R7 --> R8{"¿Resultado?"}
    R8 -- ESPERAR --> R9{"¿La razón fue\n'esperar por lluvia'?"}
    R9 -- No --> R10["Responde ESPERAR\ncon la razón (RF-4)"]
    R9 -- Sí --> R11["Marca la zona para\nverificar en el siguiente ciclo (RF-8)"]
    R8 -- REGAR --> R12["Responde REGAR {duración}\ncon la razón (RF-4)"]
    R12 --> R13["ESP32 ejecuta y reporta\nPOST /irrigation-events (RF-5)"]
    R13 --> R14{"¿Es el 3er ciclo REGAR\nconsecutivo en esta zona\nsin subir humedad?"}
    R14 -- Sí --> R15["Marca 'anomalía de riego' (RF-9)\n→ notifica como CRÍTICA (Spec 006)"]
    R14 -- No --> R16["Continúa el ciclo normal"]

    V0(["Siguiente lectura tras un ESPERAR\npor lluvia (zona marcada en R11)"]) --> V1{"¿La humedad subió\nlo suficiente?"}
    V1 -- Sí --> V2["Pronóstico se cumplió,\nsigue en ESPERAR normal"]
    V1 -- No --> V3["Cambia decisión a REGAR\n(riego de respaldo, RF-8)"]
    V3 --> V4["Notifica 'corrección por lluvia\ninsuficiente' como INFORMATIVA (Spec 006)"]
```

## Dudas abiertas
- Ninguna bloqueante.
