# Gestión de parcelas y zonas — FE-012

La ruta `/parcels/manage` replica los paneles y tablas de `site/gestion-parcelas.html` mediante componentes reales. Permite crear, editar y eliminar parcelas (nombre, ubicación, cultivo) y zonas (nombre, umbral de humedad entre 0 y 100%). Las eliminaciones exigen confirmación y explican la desvinculación de dispositivos.

Se usa el contrato real de `ParcelsController` y `ZonesController`: GET/POST `/parcels`, PATCH/DELETE `/parcels/:id`, POST `/parcels/:id/zones` y PATCH/DELETE `/parcels/:id/zones/:zoneId`. No hay mocks ni almacenamiento local de datos de parcelas. El JWT acompaña todas las llamadas; el backend verifica ownership y permite al administrador operar sobre cualquier parcela.

Los datos se actualizan tras una respuesta exitosa. Un fallo conserva el formulario y muestra el error. Se impiden envíos duplicados y acciones simultáneas durante el guardado. Se incluyen estados de carga, sin parcelas, sin zonas y error de lectura.

La validación end-to-end contra backend con Postgres requiere un entorno configurado y cuentas de Agricultor/Administrador; no se considera cumplida únicamente con lint o compilación.
