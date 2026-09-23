# Constitución — SmartRiego MX

1. **Stack fijo**: backend NestJS+Prisma+Postgres; web Next.js+shadcn; móvil Expo+Expo Router; firmware ESP32 en C++/Arduino (PlatformIO). No se introducen frameworks nuevos sin actualizar esta constitución primero.
2. **Arquitectura por dominio** en las tres capas (parcelas, riego, fugas, clima, notificaciones), nunca por capa técnica — ver la nota "Arquitectura de referencia" del vault de notas.
3. **Rol único v1**: Agricultor/dueño de parcela. Sin roles técnico/administrador separados en esta iteración.
4. **N parcelas configurables** por el agricultor vía CRUD (cultivo, ubicación, umbrales) — el prototipo físico demuestra 2, el modelo soporta N desde el inicio.
5. **Decisión de riego explicable**: reglas ponderadas + score de un modelo entrenado con dataset; toda recomendación muestra su razón (humedad, pronóstico, score) — nunca una caja negra.
6. **Detección de fugas por balance de flujo** entrada/salida del canal (sensores de flujo), con umbral configurable por parcela — no se usa humedad del suelo para detectar fugas.
7. **Paro de emergencia**: el agricultor puede detener riego/bombas de inmediato (web o móvil) ante alerta de fuga; el sistema también dispara el paro automáticamente si la pérdida supera el umbral crítico.
8. **Comunicación IoT por HTTP REST**: el ESP32 solo mide y obedece comandos; el backend es la única fuente de verdad del estado de válvulas/bombas.
9. **Notificaciones** push (móvil) y en dashboard (web) ante fuga detectada o recomendación de riego pendiente.
10. **Histórico**: toda lectura y decisión se persiste para graficar consumo y ahorro de agua en el tiempo.
11. **Clima real** vía OpenWeather; mock solo permitido en tests automatizados.
12. **Tests obligatorios** en: motor de decisión de riego, detección de fugas, endpoint de paro de emergencia, endpoint de ingestión de lecturas del ESP32.
13. **Fuera de alcance v1**: multi-usuario/organización, roles técnico/administrador separados, control de válvulas reales más allá del prototipo de mesa.
14. **Idioma**: código e identificadores en inglés, documentación y specs en español.
15. **Antes de tocar código**: leer esta constitución y la spec activa en `docs/specs/`; cualquier cambio de alcance actualiza primero la spec, nunca el código directo.
