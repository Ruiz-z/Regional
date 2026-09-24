# SmartRiego MX móvil

Expo SDK 57 y Expo Router. Referencias visuales: `site/m-inicio.html`, `m-parcela.html`, `m-zona.html` y `m-notificaciones.html`.

## Ejecutar

Configurar `EXPO_PUBLIC_API_URL` con una URL accesible desde el dispositivo. La app requiere un Agricultor real y no activa mocks cuando falta configuración. Ejecutar `pnpm --filter mobile start`. Las notificaciones remotas requieren development build y credenciales EAS; Expo Go Android no las soporta.

Verificación: `pnpm --filter mobile lint`, `pnpm --filter mobile typecheck`, `pnpm --filter mobile test`.

## Implementado y dependencias

- AP-003/AP-004: lista real de parcelas, consulta independiente de zonas y navegación protegida. El backend actual no publica telemetría: se representa como sin datos, nunca como Normal o humedad cero.
- AP-005: pantalla de zona, policy Agricultor propietario/estado/cooldown y solicitud POST `/zones/:id/treat`. No se habilita mientras falten estado de plaga y último tratamiento. Riego siempre automático; tratamiento localizado y simulado con agua. El criterio E2E queda pendiente de un endpoint de lectura de estado/telemetría.
- AP-006: feed GET `/notifications`, severidad y lectura PATCH `/notifications/:id/read`; contratos pendientes de implementar en backend. Un 404 se muestra como servicio no disponible, no como lista vacía exitosa. Push usa payload `{zoneId, parcelId}` validado, espera sesión y apertura del navegador. Cada zona ofrece en desarrollo una notificación local para probar el toque. No hay registro de token remoto porque no existe endpoint; permisos concedidos no significan envío remoto habilitado.
- AP-007: datos disponibles de sesión, permisos y cierre de sesión. Cambio de contraseña deshabilitado y pendiente: no existe endpoint, no se simula éxito.

## Prueba de navegación push

Con development build y sesión Agricultor: conceder permisos desde Perfil, abrir una zona y pulsar «Simular notificación de esta zona». Tocar la notificación abre esa zona. Repetir con app en segundo plano; para arranque frío enviar un push con `data: {zoneId, parcelId}`. La zona se consulta con autorización del backend. Un payload externo o incompleto no navega.

Las pruebas unitarias cubren payloads malformados, autorización de tratamientos, cooldown de 10 minutos y ausencia de telemetría. No sustituyen prueba física del dispositivo ni E2E contra endpoints todavía ausentes.

## Integración

La rama parte de `dev` y recupera el scaffold de `origin/feature/001-autenticacion-mobile`, ausente en `dev`, preservando los componentes AP parciales existentes. Incluye dependencias de specs 001/004/005/006 necesarias para que la app compile como unidad.
