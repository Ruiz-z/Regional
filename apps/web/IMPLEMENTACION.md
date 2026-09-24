# Administración web — FE-009 a FE-011

Referencia: `site/admin-usuarios.html`, `site/admin-dispositivos.html`, specs 001/003 y constitución. Las rutas `/admin/*` montan sus componentes únicamente para ADMIN; el backend sigue siendo responsable de validar el JWT y rol en cada request.

- FE-009: formulario de alta (`POST /users`, rol fijo AGRICULTOR), tabla de agricultores y estados de carga/error. `GET /users` no existe en el backend de dev; se informa la indisponibilidad y se muestran por separado las cuentas creadas durante la sesión. No se afirma envío de bienvenida ni se inventan nombre, número de parcelas o estado de cuenta.
- FE-010: listado, estado online/offline/revocado, registro asignado a zona, reasignación, revocación y regeneración. La clave se conserva únicamente en memoria hasta cerrar el aviso o salir de la pantalla; no se vuelve a consultar ni se guarda en almacenamiento local. Refresco cada 30 segundos.
- FE-011: ruta protegida y secciones de umbrales/integraciones. No hay contrato ni endpoints para consultar/modificar configuración global o secretos. La edición queda pendiente; no se almacenan secretos en el navegador ni se simula un guardado. No existe mockup específico de configuración global en site.

Las operaciones disponibles usan la API real sin fallback a mocks. Las tareas con endpoints faltantes no cumplen todavía sus criterios end-to-end. `docs/permissions.md` contiene referencias antiguas a fugas y riego manual: prevalece la constitución, por lo que estas pantallas no incorporan esas funciones.
