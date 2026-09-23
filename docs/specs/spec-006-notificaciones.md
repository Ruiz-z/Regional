# Spec 006 — Notificaciones (push, dashboard, email vía Resend)

## Contexto y objetivo
Avisar al Agricultor (y resumir al Administrador) cuando pasa algo que requiere atención, por los tres canales decididos: push, dashboard, y email (Resend) para alertas críticas, transaccionales y resumen periódico.

Nota de diseño: como el riego es 100% automático y se reevalúa cada minuto (Spec 004), no existe una notificación genérica de "riego pendiente" — el sistema se autocorrige solo en el siguiente ciclo. En su lugar hay dos alertas más precisas: una informativa (el sistema se autocorrigió) y una de anomalía (algo requiere atención humana).

## Usuarios / actores
Agricultor (recibe push+dashboard+email de sus parcelas), Administrador (ve todo en dashboard; recibe transaccionales que él mismo dispara).

## Historias de usuario
- H1: Como Agricultor quiero recibir una notificación push cuando se confirma una plaga en mi parcela.
- H2: Como Agricultor quiero recibir un email si no tengo la app abierta y hay una alerta crítica.
- H3: Como Administrador quiero que un nuevo Agricultor reciba un email de bienvenida al darlo de alta.
- H4: Como Agricultor quiero un resumen periódico por email de mi consumo de agua y eventos.
- H5: Como Agricultor quiero saber si el sistema tuvo que corregir una decisión porque no llovió lo esperado, aunque no tenga que hacer nada al respecto.
- H6: Como Agricultor quiero enterarme de inmediato si una zona lleva varios riegos seguidos sin que la humedad suba, porque puede ser una falla física.

## Requisitos funcionales (EARS)
- RF-1: CUANDO el sistema aplica una "corrección por lluvia insuficiente" (Spec 004 RF-8), EL SISTEMA crea una notificación **informativa** ("se pospuso el riego esperando lluvia, no fue suficiente, se inició riego de respaldo") asociada al Agricultor dueño de la zona — no requiere acción del usuario.
- RF-2: CUANDO el sistema detecta una "anomalía de riego" (Spec 004 RF-9: 3 ciclos de riego seguidos sin subir humedad), EL SISTEMA crea una notificación de **severidad crítica** ("posible falla en zona X: se ha regado 3 veces seguidas sin efecto") asociada al Agricultor dueño de la zona.
- RF-3: CUANDO se confirma un foco de plaga (Spec 005 RF-3), EL SISTEMA crea una notificación de severidad crítica asociada al Agricultor dueño de la zona.
- RF-4: EL SISTEMA envía cada notificación por push (móvil, vía Expo push token) y la refleja como alerta en el dashboard web, sin importar su severidad.
- RF-5: SI una notificación es de severidad crítica (RF-2, RF-3), ENTONCES EL SISTEMA además envía un email vía Resend, como respaldo del push. Las informativas (RF-1) no generan email.
- RF-6: CUANDO un Administrador crea una cuenta de Agricultor (Spec 001 RF-6), EL SISTEMA envía un email transaccional de bienvenida vía Resend.
- RF-7: CUANDO un usuario solicita reset de password, EL SISTEMA envía un email con el enlace/código vía Resend.
- RF-8: EL SISTEMA envía un email de resumen **semanal** a cada Agricultor con su consumo de agua y eventos del periodo.
- RF-9: EL SISTEMA marca cada notificación como leída/no leída y lo refleja en el listado del dashboard/app.
- RF-10: EL SISTEMA permite al Administrador ver un listado agregado de todas las notificaciones de todos los Agricultores (constitution.md #3, superset).

## Requisitos no funcionales
- Ninguna credencial de Resend/push se commitea al repo (constitution.md #15).

## Casos límite
- Agricultor sin token push registrado (no instaló la app) → solo recibe dashboard + email si es crítica.
- Fallo al enviar por Resend → se reintenta o se loguea el error, no bloquea el resto del flujo (la notificación push/dashboard ya se envió igual).
- Varias anomalías de riego seguidas en la misma zona sin resolverse → no se re-notifica en cada ciclo adicional, solo al momento de la primera confirmación (evita spam); se re-notifica si la zona vuelve a Normal y luego reincide.

## Fuera de alcance
- Notificaciones por SMS. Configuración granular de qué canal prefiere cada usuario (v1 usa las reglas fijas de arriba, no un centro de preferencias).

## Criterios de finalización
- RF-1 a RF-10 con test en verde (creación de notificación ante cada evento simulado: corrección por lluvia, anomalía, foco de plaga) + demo manual: provocar una anomalía de riego y un foco de plaga y ver ambas alertas llegar por los tres canales, y confirmar que una corrección por lluvia insuficiente solo aparece en dashboard/push, no por email.

## Dudas abiertas
- Ninguna bloqueante.
