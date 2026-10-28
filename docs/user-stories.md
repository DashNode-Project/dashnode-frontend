# Historias de usuario implementadas — EP-01 Autenticación y sesiones

> Texto original de las 5 HU de la épica (idéntico en `dashnode-backend` y
> `dashnode-frontend`). Estado del lote: COMPLETED (2026-10-11).
> Cada repositorio documenta en `code-structure.md` e `implementation-report.md`
> solo su capa; `integration-report.md` es el mismo en ambos.

## Matriz de trazabilidad HU → código → pruebas → evidencia

| HU | Capacidad | Código principal | Pruebas | Evidencia |
|---|---|---|---|---|
| HU_DN_01_01 | Página de presentación | Solo frontend (el backend no participa; la ruta pública no consulta datos protegidos) | Ver repositorio frontend | `docs/integration-report.md` |
| HU_DN_01_02 | Registro de Gerente | `app/modules/auth/application/use_cases.py` (`RegisterManagerUseCase`), `app/modules/auth/domain/{rules,errors,messages}.py`, `app/modules/auth/api/routes.py` (`POST /api/v1/auth/register`), `app/shared/infrastructure/hasher.py` | `tests/application/test_register_manager_use_case.py`, `tests/api/test_register_api.py`, `tests/unit/test_auth_rules.py` (hypothesis), `tests/integration/test_postgres_schema_and_registration.py` | `docs/implementation-report.md` |
| HU_DN_01_03 | Inicio de sesión | `app/modules/auth/application/session_use_cases.py` (`LoginUseCase`), `app/modules/auth/infrastructure/{models,repositories,session_tokens}.py`, `migrations/versions/002_*.py`, `POST /api/v1/auth/login` | `tests/application/test_login_use_case.py`, `tests/api/test_login_api.py`, `tests/integration/test_postgres_login_sessions.py` | `docs/implementation-report.md` |
| HU_DN_01_04 | Cerrar sesión | `LogoutUseCase`, `POST /api/v1/auth/logout` | `tests/application/test_logout_use_case.py`, `tests/api/test_logout_api.py`, integración PostgreSQL | `docs/implementation-report.md` |
| HU_DN_01_05 | Conservar sesión al recargar | `AuthenticateSessionUseCase`, `app/orchestration/security.py`, `GET /api/v1/auth/session` | `tests/api/test_session_api.py`, `test_login_api.py::test_session_expires_exactly_8_hours_after_login` | `docs/implementation-report.md` |
| Transversal | Contrato de error, CSRF por Origin, cabeceras, salud, configuración segura, scripts | `app/orchestration/{error_handling,middleware}.py`, `app/config.py`, `scripts/` | `tests/api/test_platform_api.py`, `tests/unit/test_shared_infrastructure_foundation.py`, `tests/unit/test_scripts_and_seed.py` | `docs/implementation-report.md` |

### Cobertura de tareas técnicas de backend / seguridad / BD / QA

| Tarea | Resolución |
|---|---|
| TK_DN_01_02_1 (BD) | Tabla `users` (nombre, correo único, hash, rol, estado) — migración 001; tipo `UtcDateTime` |
| TK_DN_01_02_3 / 4 / 6 | `RegisterManagerUseCase`: validaciones en servidor, Argon2id con sal, rol forzado a Gerente, error técnico genérico |
| TK_DN_01_02_7 / 8 | Pruebas listadas arriba; endpoint documentado en `docs/api-auth.md` y OpenAPI (`/docs`) |
| TK_DN_01_03_1 (BD) | Migración 002: `sessions` (solo digest SHA-256 del token) y `login_attempts` |
| TK_DN_01_03_3 / 4 / 5 | `LoginUseCase`: sesión en servidor, 5 intentos/15 min por cuenta, mensajes genéricos y cuenta desactivada |
| TK_DN_01_03_8 | `test_login_use_case.py`, `test_login_api.py`, integración PostgreSQL (concurrencia) |
| TK_DN_01_04_2 / 5 | `LogoutUseCase` y pruebas de rechazo de la sesión previa |
| TK_DN_01_05_1 / 2 / 5 | Cookie HttpOnly (`Max-Age` = 8 h + retención), `GET /auth/session`, pruebas de expiración |

### Decisiones y supuestos (no definidos literalmente por las HU)

| Tema | Decisión |
|---|---|
| Sesión vs. JWT del arquetipo | Las HU exigen sesión revocable en servidor + cookie HttpOnly: se retiró el flujo JWT (y `pyjwt`). |
| Mensajes no redactados por las HU | `NOT_AUTHENTICATED`: «Debe iniciar sesión para continuar.»; nombre > 100: «El nombre completo no puede superar los 100 caracteres.»; campos vacíos en login reutilizan «Todos los campos obligatorios deben ser diligenciados.» |
| Cuenta desactivada | Solo se revela con contraseña correcta (evita enumeración de cuentas). |
| Intentos fallidos | Se registran antes de verificar (seguro bajo concurrencia); los intentos rechazados no prolongan el bloqueo; un login correcto reinicia el contador; también aplica a correos inexistentes. |
| Expiración | Absoluta a las 8 h desde el login (sin renovación). La cookie vive `SESSION_COOKIE_RETENTION_HOURS` más para poder responder «Su sesión ha expirado…». |
| Cierre de sesión | Idempotente: una sesión desconocida/expirada también termina en «Sesión cerrada correctamente.» y limpia la cookie. |
| Ramas Git | El repositorio documenta trunk-based, pero la instrucción explícita del propietario exige `develop` + rama de épica; se sigue la instrucción. |
| Fuera de alcance | Recuperación de contraseña (HU_DN_01_06), desactivación de usuarios (HU_DN_01_17), redirección HU_DN_01_08: solo se dejó configuración de correo preparada. |

---

## Texto original de las historias de usuario (literal)

# Mitad de la Épica 1: Autenticación y Sesiones (EP-01)

---

## HU_DN_01_01 — Visualizar la página de presentación del producto antes de iniciar sesión

* **Épica**: EP-01 Autenticación y sesiones (AUT)
* **MVP**: MVP 1
* **Sprint**: Sprint 1
* **Rol**: Yo como Visitante
* **Característica / Funcionalidad**: Visualizar la página de presentación del producto antes de iniciar sesión
* **Razón / Resultado**: para conocer DashNode y llegar al formulario de ingreso o de registro sin necesitar una cuenta
* **Estado de validación**: Lista
* **Observación**: RF-AUT-07 (Prioridad SRS: Media). Pendiente cerrado: P-18.
* **Estimación**: 2 Puntos de Historia (Fibonacci)
* **Justificación de estimación**: Página estática pública con dos accesos y un mensaje de fallo, sin lógica de negocio.
* **Prioridad MoSCoW**: Should have
* **Justificación de prioridad**: Prioridad SRS Media; aporta la entrada pública al flujo, pero el MVP funciona accediendo directamente al inicio de sesión.
* **Notas del analista**: Los destinos de los accesos dependen de HU_DN_01_03 y HU_DN_01_02 del mismo sprint.

### Criterios de Aceptación

1. **Dónde**: Pantalla inicial pública, accesible sin sesión; desde ella se llega al inicio de sesión y al registro de Gerente.
2. **Campos (controles de la página)**:
* 2.1 Botón 'Iniciar sesión': abre HU_DN_01_03.
* 2.2 Enlace 'Registrarme como Gerente': abre HU_DN_01_02.
* 2.3 Contenido descriptivo del producto: nombre DashNode, propuesta de valor en una frase y resumen de los módulos principales (proyectos, backlog y sprints, reuniones, documentación, issues y asistente de IA).


3. **Validación**: Sin sesión válida la página se muestra completa.
4. **Restricción**: La página no muestra ni solicita datos de proyectos, usuarios ni páginas protegidas.
5. **Éxito**: Al cargar, el visitante ve la presentación con los dos accesos.
6. **Fallo técnico**: Si la información no puede cargarse se muestra 'No fue posible cargar la información. Intente nuevamente.'

### Definition of Ready (DoR)

* HU con rol, funcionalidad y razón definidos.
* Criterios de aceptación completos y sin pendientes por aclarar.
* Mensajes de éxito y fallo definidos.
* Estimada por el equipo.
* Priorizada.
* Sin dependencias bloqueantes sin resolver.
* Mockup o diseño de Figma de la página de presentación disponible.
* Textos de propuesta de valor y resumen de módulos aprobados por el interesado (P-18).

### Definition of Done (DoD)

* Código en la rama de desarrollo con revisión por pares.
* Todos los criterios de aceptación verificados.
* Pruebas unitarias y de aceptación pasando.
* Validaciones repetidas en el servidor.
* Mensajes literales exactos a los del backlog.
* Accesibilidad básica (no depender solo del color, operable con teclado).
* Sin errores de lint.
* Documentación actualizada.
* Demo aprobada por el Product Owner.
* La ruta pública no realiza ninguna solicitud de datos protegidos.
* Los accesos abren HU_DN_01_03 y HU_DN_01_02.

### Tareas Técnicas

* **TK_DN_01_01_1**: Maquetar la página pública de presentación con nombre, propuesta de valor y resumen de módulos
* *Tipo*: Frontend
* *Cubre criterios*: 1, 2.3


* **TK_DN_01_01_2**: Implementar el botón 'Iniciar sesión' y el enlace 'Registrarme como Gerente' con su navegación
* *Tipo*: Frontend
* *Cubre criterios*: 2.1, 2.2, 5


* **TK_DN_01_01_3**: Configurar la ruta como pública sin solicitar ni renderizar datos protegidos
* *Tipo*: Seguridad
* *Cubre criterios*: 3, 4


* **TK_DN_01_01_4**: Mostrar 'No fue posible cargar la información. Intente nuevamente.' ante fallo de carga
* *Tipo*: Frontend
* *Cubre criterios*: 6


* **TK_DN_01_01_5**: Escribir pruebas de aceptación de carga sin sesión, accesos y ausencia de datos protegidos
* *Tipo*: QA
* *Cubre criterios*: 3, 4, 5, 6



---

## HU_DN_01_02 — Registrar mi cuenta en la plataforma con el rol Gerente

* **Épica**: EP-01 Autenticación y sesiones (AUT)
* **MVP**: MVP 1
* **Sprint**: Sprint 1
* **Rol**: Yo como Visitante
* **Característica / Funcionalidad**: Registrar mi cuenta en la plataforma con el rol Gerente
* **Razón / Resultado**: para obtener una cuenta de Gerente y comenzar a organizar proyectos y equipos sin depender de un Administrador
* **Estado de validación**: Lista
* **Observación**: RF-AUT-01, RN-AUT-01, RN-AUT-02 (Prioridad SRS: Alta). Regla de negocio del cliente: registro público exclusivo Visitante → Gerente. Conflicto interno del SRS resuelto con K-01. Pendientes cerrados: P-01, P-19.
* **Estimación**: 5 Puntos de Historia (Fibonacci)
* **Justificación de estimación**: Formulario con cuatro campos validados en cliente y servidor, hash de contraseña y regla de rol resistente a manipulación.
* **Prioridad MoSCoW**: Must have
* **Justificación de prioridad**: Prioridad SRS Alta y regla explícita del cliente; es la única vía para crear el primer Gerente que habilita el flujo extremo a extremo.

### Criterios de Aceptación

1. **Dónde**: Pantalla 'Registro de Gerente', accesible desde la página de presentación y desde el inicio de sesión mediante el enlace 'Registrarme como Gerente'.
2. **Campos (el formulario contiene)**:
* 2.1 Nombre completo: texto, obligatorio, longitud máxima 100 caracteres. Si está vacío se muestra 'El nombre completo es obligatorio.'
* 2.2 Correo electrónico: texto, obligatorio, formato xxx@xxx.xxx y único en el sistema. Si el formato no es válido: 'El correo electrónico ingresado no tiene un formato válido.'; si ya existe: 'Ya existe una cuenta registrada con este correo electrónico.'
* 2.3 Contraseña: obligatoria, oculta por defecto con botón de visualización, de 8 a 64 caracteres con al menos una letra y un número. Si no cumple: 'La contraseña no cumple los requisitos mínimos de seguridad.'
* 2.4 Confirmar contraseña: obligatoria, mismas restricciones del campo 2.3 y debe coincidir con él; si no: 'Las contraseñas no coinciden.'
* 2.5 El formulario no incluye selector de rol: el rol asignado es siempre Gerente.
* 2.6 Botón 'Registrarme': inhabilitado mientras exista un campo obligatorio vacío.
* 2.7 Botón 'Cancelar': regresa al inicio de sesión sin guardar.


3. **Validación**: Al presionar 'Registrarme' el servidor repite todas las validaciones; si falta algún campo obligatorio se muestra 'Todos los campos obligatorios deben ser diligenciados.'
4. **Restricción**: La contraseña se almacena solo como hash con sal (Argon2 o bcrypt) y nunca se devuelve en respuestas ni registros. Toda solicitud pública que intente crear un usuario con rol Desarrollador o Administrador (aunque se manipule la petición) se rechaza con 'El registro público solo está disponible para el rol Gerente.' y no crea cuenta.
5. **Éxito**: 'Su cuenta de Gerente ha sido registrada correctamente. Puede iniciar sesión.' y se redirige al inicio de sesión.
6. **Fallo técnico**: Ante un error no anticipado (caída del servicio o tiempo de espera agotado) se muestra 'No fue posible completar la operación. Intente nuevamente.' sin alterar datos.

### Definition of Ready (DoR)

* HU con rol, funcionalidad y razón definidos.
* Criterios de aceptación completos y sin pendientes por aclarar.
* Mensajes de éxito y fallo definidos.
* Estimada por el equipo.
* Priorizada.
* Sin dependencias bloqueantes sin resolver.
* Mockup o diseño de Figma del formulario de registro disponible.
* Esquema de BD de usuarios y roles definido.
* Algoritmo de hash (Argon2 o bcrypt) acordado por el equipo.

### Definition of Done (DoD)

* Código en la rama de desarrollo con revisión por pares.
* Todos los criterios de aceptación verificados.
* Pruebas unitarias y de aceptación pasando.
* Validaciones repetidas en el servidor.
* Mensajes literales exactos a los del backlog.
* Accesibilidad básica (no depender solo del color, operable con teclado).
* Sin errores de lint.
* Documentación actualizada.
* Demo aprobada por el Product Owner.
* Contraseña almacenada solo como hash con sal y ausente de respuestas y registros.
* Una solicitud manipulada con rol Desarrollador o Administrador es rechazada y no crea cuenta.
* Correo único verificado en el servidor.

### Tareas Técnicas

* **TK_DN_01_02_1**: Definir el modelo de usuario con nombre, correo único, hash de contraseña, rol y estado
* *Tipo*: BD
* *Cubre criterios*: 2.2, 2.5, 4


* **TK_DN_01_02_2**: Construir el formulario 'Registro de Gerente' con validaciones de cliente y botones 'Registrarme' y 'Cancelar'
* *Tipo*: Frontend
* *Cubre criterios*: 1, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7


* **TK_DN_01_02_3**: Implementar el endpoint de registro que repite en el servidor todas las validaciones de campos y unicidad
* *Tipo*: Backend
* *Cubre criterios*: 2.1, 2.2, 2.3, 2.4, 3


* **TK_DN_01_02_4**: Aplicar hash con sal (Argon2 o bcrypt) y forzar el rol Gerente rechazando cualquier otro rol enviado
* *Tipo*: Seguridad
* *Cubre criterios*: 4


* **TK_DN_01_02_5**: Mostrar el mensaje de éxito y redirigir al inicio de sesión
* *Tipo*: Frontend
* *Cubre criterios*: 5


* **TK_DN_01_02_6**: Manejar el error no anticipado mostrando 'No fue posible completar la operación. Intente nuevamente.' sin alterar datos
* *Tipo*: Backend
* *Cubre criterios*: 6


* **TK_DN_01_02_7**: Escribir pruebas unitarias y de aceptación, incluida la petición manipulada con rol Desarrollador o Administrador
* *Tipo*: QA
* *Cubre criterios*: 2, 3, 4, 5, 6


* **TK_DN_01_02_8**: Documentar el endpoint de registro y sus códigos de respuesta
* *Tipo*: Documentación
* *Cubre criterios*: 3, 4



---

## HU_DN_01_03 — Iniciar sesión con mi correo y contraseña

* **Épica**: EP-01 Autenticación y sesiones (AUT)
* **MVP**: MVP 1
* **Sprint**: Sprint 1
* **Rol**: Yo como Administrador, Gerente o Desarrollador
* **Característica / Funcionalidad**: Iniciar sesión con mi correo y contraseña
* **Razón / Resultado**: para acceder únicamente a las funciones y datos que corresponden a mi rol
* **Estado de validación**: Lista
* **Observación**: RF-AUT-02 (Prioridad SRS: Crítica); RN-USU-08. Consolidada para los tres roles (sin diferencia funcional). Límite de intentos adoptado como definitivo.
* **Estimación**: 5 Puntos de Historia (Fibonacci)
* **Justificación de estimación**: Autenticación con hash, sesión en servidor, limitación de intentos, cuenta desactivada y redirección por tres roles.
* **Prioridad MoSCoW**: Must have
* **Justificación de prioridad**: Prioridad SRS Crítica; toda la funcionalidad autenticada del MVP depende de ella.
* **Notas del analista**: Los usuarios desactivados provienen de HU_DN_01_17 del mismo sprint; para probar el criterio 6 se requiere un usuario desactivado de prueba.

### Criterios de Aceptación

1. **Dónde**: Pantalla 'Inicio de sesión', accesible desde la presentación y desde la redirección por falta de sesión.
2. **Campos (el formulario contiene)**:
* 2.1 Correo electrónico: texto, obligatorio, formato xxx@xxx.xxx. Si el formato no es válido: 'El correo electrónico ingresado no tiene un formato válido.'
* 2.2 Contraseña: obligatoria, oculta por defecto con botón de visualización.
* 2.3 Botón 'Iniciar sesión': inhabilitado mientras algún campo esté vacío.
* 2.4 Enlace '¿Olvidó su contraseña?': abre HU_DN_01_06.


3. **Validación**: Con credenciales válidas y cuenta activa se concede el acceso según el rol (Administrador, Gerente o Desarrollador).
4. **Restricción**: La contraseña se compara contra su hash y la sesión se crea y valida en el servidor. Se permiten máximo 5 intentos fallidos en 15 minutos por cuenta (RNF-SEG-06); el sexto se rechaza con 'Ha superado el número de intentos permitidos. Intente nuevamente más tarde.'
5. **Éxito**: El sistema dirige a la pantalla de inicio del rol del usuario.
6. **Fallo**: Correo inexistente o contraseña incorrecta muestran el mismo mensaje 'Credenciales no válidas. Verifique su correo y contraseña.'; con credenciales correctas y cuenta desactivada se rechaza con 'Su cuenta está desactivada. Contacte al Administrador.' y no se inicia sesión.
7. **Fallo técnico**: Ante un error no anticipado (caída del servicio o tiempo de espera agotado) se muestra 'No fue posible completar la operación. Intente nuevamente.' sin alterar datos.

### Definition of Ready (DoR)

* HU con rol, funcionalidad y razón definidos.
* Criterios de aceptación completos y sin pendientes por aclarar.
* Mensajes de éxito y fallo definidos.
* Estimada por el equipo.
* Priorizada.
* Sin dependencias bloqueantes sin resolver.
* Mockup o diseño de Figma del inicio de sesión disponible.
* Esquema de BD de usuarios definido (TK_DN_01_02_1).
* Pantalla de inicio por rol definida.
* Mecanismo de sesión en servidor acordado (cookie HttpOnly, RNF-SEG-09).

### Definition of Done (DoD)

* Código en la rama de desarrollo con revisión por pares.
* Todos los criterios de aceptación verificados.
* Pruebas unitarias y de aceptación pasando.
* Validaciones repetidas en el servidor.
* Mensajes literales exactos a los del backlog.
* Accesibilidad básica (no depender solo del color, operable con teclado).
* Sin errores de lint.
* Documentación actualizada.
* Demo aprobada por el Product Owner.
* Contraseña comparada solo contra su hash.
* Sesión creada y validada en el servidor.
* Sexto intento fallido en 15 minutos rechazado (RNF-SEG-06).
* Mismo mensaje para correo inexistente y contraseña incorrecta.
* Cuenta desactivada no inicia sesión.

### Tareas Técnicas

* **TK_DN_01_03_1**: Crear el almacenamiento de sesiones y del contador de intentos fallidos por cuenta
* *Tipo*: BD
* *Cubre criterios*: 4


* **TK_DN_01_03_2**: Construir el formulario 'Inicio de sesión' con validación de formato, botón inhabilitado y enlace '¿Olvidó su contraseña?'
* *Tipo*: Frontend
* *Cubre criterios*: 1, 2.1, 2.2, 2.3, 2.4


* **TK_DN_01_03_3**: Implementar el endpoint que compara la contraseña contra su hash y crea la sesión en el servidor
* *Tipo*: Backend
* *Cubre criterios*: 3, 4


* **TK_DN_01_03_4**: Limitar a 5 intentos fallidos en 15 minutos por cuenta con el mensaje de bloqueo
* *Tipo*: Seguridad
* *Cubre criterios*: 4


* **TK_DN_01_03_5**: Devolver el mensaje genérico de credenciales no válidas y rechazar cuentas desactivadas con su mensaje
* *Tipo*: Backend
* *Cubre criterios*: 6


* **TK_DN_01_03_6**: Redirigir a la pantalla de inicio correspondiente al rol del usuario
* *Tipo*: Frontend
* *Cubre criterios*: 5


* **TK_DN_01_03_7**: Mostrar 'No fue posible completar la operación. Intente nuevamente.' ante error no anticipado
* *Tipo*: Frontend
* *Cubre criterios*: 7


* **TK_DN_01_03_8**: Escribir pruebas de credenciales válidas por rol, inválidas, cuenta desactivada y sexto intento
* *Tipo*: QA
* *Cubre criterios*: 3, 4, 5, 6, 7



---

## HU_DN_01_04 — Cerrar mi sesión

* **Épica**: EP-01 Autenticación y sesiones (AUT)
* **MVP**: MVP 1
* **Sprint**: Sprint 1
* **Rol**: Yo como Administrador, Gerente o Desarrollador
* **Característica / Funcionalidad**: Cerrar mi sesión
* **Razón / Resultado**: para evitar que otra persona use mi cuenta en el mismo equipo
* **Estado de validación**: Lista
* **Observación**: RF-AUT-03 (Prioridad SRS: Crítica); RN-AUT-03.
* **Estimación**: 2 Puntos de Historia (Fibonacci)
* **Justificación de estimación**: Acción única sin formulario: invalidar sesión en servidor y limpiar cliente.
* **Prioridad MoSCoW**: Must have
* **Justificación de prioridad**: Prioridad SRS Crítica; sin cierre de sesión el acceso no es seguro.

### Criterios de Aceptación

1. **Dónde**: Opción 'Cerrar sesión' del menú de usuario, visible en todas las vistas autenticadas.
2. **Campos**: No aplica captura de datos; la acción no requiere formulario.
3. **Validación**: Al activar la opción se invalida la sesión en el servidor y se limpia la sesión del cliente.
4. **Restricción**: Tras cerrar sesión, cualquier solicitud con la sesión previa se rechaza y ningún dato protegido permanece visible.
5. **Éxito**: El usuario regresa al inicio de sesión y se muestra 'Sesión cerrada correctamente.'
6. **Fallo técnico**: Ante un error no anticipado (caída del servicio o tiempo de espera agotado) se muestra 'No fue posible completar la operación. Intente nuevamente.' sin alterar datos.

### Definition of Ready (DoR)

* HU con rol, funcionalidad y razón definidos.
* Criterios de aceptación completos y sin pendientes por aclarar.
* Mensajes de éxito y fallo definidos.
* Estimada por el equipo.
* Priorizada.
* Sin dependencias bloqueantes sin resolver.
* Mockup o diseño de Figma del menú de usuario disponible.
* HU_DN_01_03 terminada (existe sesión que cerrar).

### Definition of Done (DoD)

* Código en la rama de desarrollo con revisión por pares.
* Todos los criterios de aceptación verificados.
* Pruebas unitarias y de aceptación pasando.
* Validaciones repetidas en el servidor.
* Mensajes literales exactos a los del backlog.
* Accesibilidad básica (no depender solo del color, operable con teclado).
* Sin errores de lint.
* Documentación actualizada.
* Demo aprobada por el Product Owner.
* Tras cerrar sesión, una solicitud con la sesión previa es rechazada.
* Ningún dato protegido permanece visible tras el cierre.

### Tareas Técnicas

* **TK_DN_01_04_1**: Agregar la opción 'Cerrar sesión' al menú de usuario en todas las vistas autenticadas
* *Tipo*: Frontend
* *Cubre criterios*: 1, 2


* **TK_DN_01_04_2**: Implementar el endpoint que invalida la sesión en el servidor
* *Tipo*: Backend
* *Cubre criterios*: 3, 4


* **TK_DN_01_04_3**: Limpiar la sesión del cliente y redirigir al inicio de sesión mostrando 'Sesión cerrada correctamente.'
* *Tipo*: Frontend
* *Cubre criterios*: 3, 4, 5


* **TK_DN_01_04_4**: Mostrar 'No fue posible completar la operación. Intente nuevamente.' ante error no anticipado
* *Tipo*: Frontend
* *Cubre criterios*: 6


* **TK_DN_01_04_5**: Escribir pruebas que verifiquen el rechazo de solicitudes con la sesión previa
* *Tipo*: QA
* *Cubre criterios*: 4, 5



---

## HU_DN_01_05 — Conservar mi sesión activa al recargar el navegador

* **Épica**: EP-01 Autenticación y sesiones (AUT)
* **MVP**: MVP 1
* **Sprint**: Sprint 1
* **Rol**: Yo como Administrador, Gerente o Desarrollador
* **Característica / Funcionalidad**: Conservar mi sesión activa al recargar el navegador
* **Razón / Resultado**: para no repetir el ingreso de credenciales durante mi jornada de trabajo
* **Estado de validación**: Lista
* **Observación**: RF-AUT-06 (Prioridad SRS: Alta); RNF-SEG-09. Pendiente cerrado: P-20.
* **Estimación**: 3 Puntos de Historia (Fibonacci)
* **Justificación de estimación**: Configuración de cookie segura, expiración de 8 h y restauración de vista sin formulario.
* **Prioridad MoSCoW**: Must have
* **Justificación de prioridad**: Prioridad SRS Alta; condición técnica de la sesión de la que dependen todas las vistas autenticadas.

### Criterios de Aceptación

1. **Dónde**: Cualquier vista autenticada.
2. **Campos**: No aplica captura de datos; la acción no requiere formulario.
3. **Validación**: Al recargar con una sesión vigente el usuario permanece autenticado en la misma vista.
4. **Restricción**: La sesión termina solo al cerrar sesión o al expirar; el almacenamiento local del navegador no contiene contraseñas ni credenciales en claro y el token no es legible por scripts (cookie HttpOnly, RNF-SEG-09). Duración de la sesión: 8 horas desde el inicio de sesión; al expirar se redirige al inicio de sesión (HU_DN_01_08).
5. **Éxito**: Tras recargar, el usuario continúa autenticado sin volver a iniciar sesión.
6. **Fallo**: Si la sesión expiró se redirige al inicio de sesión con 'Su sesión ha expirado. Inicie sesión nuevamente.'; si la información no puede cargarse se muestra 'No fue posible cargar la información. Intente nuevamente.'

### Definition of Ready (DoR)

* HU con rol, funcionalidad y razón definidos.
* Criterios de aceptación completos y sin pendientes por aclarar.
* Mensajes de éxito y fallo definidos.
* Estimada por el equipo.
* Priorizada.
* Sin dependencias bloqueantes sin resolver.
* HU_DN_01_03 terminada (existe sesión en servidor).
* Coordinación con HU_DN_01_08 para la redirección al expirar.

### Definition of Done (DoD)

* Código en la rama de desarrollo con revisión por pares.
* Todos los criterios de aceptación verificados.
* Pruebas unitarias y de aceptación pasando.
* Validaciones repetidas en el servidor.
* Mensajes literales exactos a los del backlog.
* Accesibilidad básica (no depender solo del color, operable con teclado).
* Sin errores de lint.
* Documentación actualizada.
* Demo aprobada por el Product Owner.
* Token en cookie HttpOnly no legible por scripts (RNF-SEG-09).
* Almacenamiento local sin contraseñas ni credenciales en claro.
* Sesión expira a las 8 horas del inicio.

### Tareas Técnicas

* **TK_DN_01_05_1**: Configurar la cookie de sesión HttpOnly con expiración de 8 horas desde el inicio de sesión
* *Tipo*: Seguridad
* *Cubre criterios*: 4


* **TK_DN_01_05_2**: Implementar el endpoint que valida la sesión vigente al cargar cualquier vista
* *Tipo*: Backend
* *Cubre criterios*: 1, 3


* **TK_DN_01_05_3**: Restaurar el estado autenticado en la misma vista al recargar el navegador
* *Tipo*: Frontend
* *Cubre criterios*: 2, 3, 5


* **TK_DN_01_05_4**: Redirigir al inicio de sesión con el mensaje de sesión expirada y mostrar el mensaje de fallo de carga
* *Tipo*: Frontend
* *Cubre criterios*: 6


* **TK_DN_01_05_5**: Escribir pruebas de recarga con sesión vigente, sesión expirada y ausencia de credenciales en almacenamiento local
* *Tipo*: QA
* *Cubre criterios*: 3, 4, 5, 6

---

## Estado de implementación — HU_DN_01_06 … HU_DN_01_10 (Sprint 1)

| HU | Estado | Evidencia |
| --- | --- | --- |
| HU_DN_01_06 | Implementado | `ForgotPasswordPage`, `POST /auth/password-reset/request`, `ForgotPasswordPage.test.tsx` |
| HU_DN_01_07 | Implementado | `SetPasswordPage`, `POST /auth/password-reset/confirm`, `SetPasswordPage.test.tsx` |
| HU_DN_01_08 | Implementado | `RequireAuth` guarda `returnTo`; login redirige tras autenticación |
| HU_DN_01_09 | Implementado | `MESSAGES.accessDenied`; panel admin muestra 403 literal |
| HU_DN_01_10 | Implementado | `UsersPage` restablecer contraseña, `POST /auth/admin/users/{id}/password-reset` |
| Landing (extra) | Implementado | Navbar, preview, roadmap, trazabilidad, CTA registro, footer demo; panel auth izquierdo (lg+) |

---

## Estado de implementación — EP-02 (HU_DN_01_11 … HU_DN_01_16, Sprint 1)

| HU | Estado | Evidencia |
| --- | --- | --- |
| HU_DN_01_11 | Implementado | `UsersPage` formulario «Crear usuario», `POST /auth/admin/users`, tests `UsersPage.test.tsx` |
| HU_DN_01_12 | Implementado | «Invitar Desarrollador», `POST /auth/manager/users/invite`, tests invite en `UsersPage.test.tsx` |
| HU_DN_01_13 | Implementado | UI sin rol Administrador; servidor 403 en manipulación de rol admin |
| HU_DN_01_14 | Implementado | Tabla con filtros, estados Activo/Desactivado, `UsersAdmin.integration.test.tsx` |
| HU_DN_01_16 | Implementado | Modal «Editar usuario», `PATCH /auth/admin/users/{id}`, mensajes literales |

---

## Estado de implementación — EP-02 (HU_DN_01_17 … HU_DN_01_21, Sprint 1)

| HU | Estado | Evidencia |
| --- | --- | --- |
| HU_DN_01_17 | Implementado | `UsersPage` diálogo Desactivar/Confirmar, `POST .../deactivate`, mensajes literales |
| HU_DN_01_18 | Implementado | Acción Reactivar + confirmación, `POST .../reactivate` |
| HU_DN_01_19 | Implementado | Aviso dinámico de tareas pendientes al abrir modal de desactivación |
| HU_DN_01_20 | Implementado | `PermissionsPage`, enlace «Permisos y roles» en menú de usuario |
| HU_DN_01_21 | Implementado | `ProfilePage`, subida multipart, `applySessionUser` en sesión |

---

## Estado de implementación — EP-03 (HU_DN_02_22 … HU_DN_02_26, Sprint 2)

| HU | Estado | Evidencia |
| --- | --- | --- |
| HU_DN_02_22 | Implementado | `ProjectsPage` + modal «Crear proyecto», `features/projects/api.ts`, tests `ProjectsPage.test.tsx` |
| HU_DN_02_23 | Implementado | `ProjectDetailPage` modal «Editar proyecto», tests en `ProjectDetailPage.test.tsx` |
| HU_DN_02_24 | Implementado | Selector «Estado» en resumen, `updateProjectStatus`, tests de reversión en error |
| HU_DN_02_25 | Implementado | «Cambiar gerente responsable», validación gerente obligatorio |
| HU_DN_02_26 | Implementado | «Eliminar proyecto» solo admin, confirmación literal, `ProjectDetailPage.admin.test.tsx` |
| HU_DN_02_27 | Implementado | Sección Miembros, modal «Agregar miembro», `addProjectMember` |
| HU_DN_02_28 | Implementado | «Retirar» + confirmación literal, `removeProjectMember` |
| HU_DN_02_29 | Implementado | Listado con gerente/stack, vacío «No tiene proyectos asignados.» |
| HU_DN_02_30 | Implementado | `ProjectWorkspaceLayout` + pestañas SRS, placeholder con toast |
| HU_DN_02_31 | Implementado | Tarjetas de salud en Resumen, `getProjectHealth` |

Notificaciones: `lib/toast/ToastProvider.tsx` (10 s, esquina inferior derecha); `UnderDevelopmentBridge` reemplaza el aviso fijo en `AppShell`.

---

## Estado de implementación — EP-04 Disponibilidad del equipo (HU_DN_02_32 … HU_DN_02_34, Sprint 3)

| HU | Estado | Evidencia |
| --- | --- | --- |
| HU_DN_02_32 | Implementado | `AvailabilityPage` ruta `/disponibilidad`, componente `WeeklyGrid`, cuadrícula interactiva 7 días x 24h, alternancia disponible/no disponible, selector de semana con inicio en lunes, botones guardar/cancelar cambios, mensajes literales (`AVAILABILITY_SAVED`, `NO_CHANGES_TO_SAVE`), tests `AvailabilityPage.test.tsx`. |
| HU_DN_02_33 | Implementado | Reutilización de disponibilidad previa, visualización de badge/indicador «Heredada» cuando `is_inherited: true` sin reingreso de datos, tests en `AvailabilityPage.test.tsx`. |
| HU_DN_02_34 | Implementado | Componente `TeamAvailabilityGrid` en pestaña «Equipo» (solo Administrador y Gerente; Desarrollador denegado), una fila por usuario y 24 columnas horarias por día, indicadores textuales («D» / «ND») y visuales, tests en `AvailabilityPage.test.tsx`. |

---

## Estado de implementación — EP-05 Agendamiento y reuniones (HU_DN_03_35 … HU_DN_03_36, Sprint 3)

| HU | Estado | Evidencia |
| --- | --- | --- |
| HU_DN_03_35 | Implementado | Componente `ScheduleMeetingSection` con validación estricta de formulario: intervalo horario (inicio < fin), al menos un día, al menos un participante, duración en horas completas que quepa en el intervalo. Botón «Buscar horarios» inhabilitado hasta cumplir criterios. Tests en `validation.test.ts` y `AvailabilityPage.test.tsx`. |
| HU_DN_03_36 | Implementado | Búsqueda y cálculo de horarios disponibles en 24h agrupados por día excluyendo reuniones programadas, mensaje literal de no disponibilidad (`NO_AVAILABLE_SLOTS`), modal de confirmación y agendamiento de reunión (`createMeeting`) con notificación toast (`meetingCreated`). Tests en `AvailabilityPage.test.tsx`. |

---

## HU_DN_03_37 — Seleccionar horario disponible para abrir la ventana de confirmación
**Como** Gerente  
**Quiero** Seleccionar un horario disponible para abrir la ventana de confirmación  
**Para** fijar la reunión directamente, sin pedir a los participantes que elijan

### Criterios de aceptación
1. Dónde: lista de horarios resultante de HU_DN_03_36.
2. Campos: control:
   2.1 Cada horario disponible es un elemento seleccionable.
3. Validación: solo se pueden seleccionar horarios de la lista de resultados.
4. Restricción: los participantes no tienen ninguna acción para elegir horario (RN-AGE-01).
5. Éxito: al seleccionar un horario se abre la ventana de confirmación con fecha, hora, duración y participantes en solo lectura.
6. Fallo técnico: ante un error no anticipado (caída del servicio o tiempo de espera agotado) se muestra 'No fue posible completar la operación. Intente nuevamente.' sin alterar datos.

**Fecha recepción:** 2026-10-13  
**Estado:** COMPLETED

---

## HU_DN_03_38 — Programar una reunión desde la ventana de confirmación
**Como** Gerente  
**Quiero** Programar una reunión desde la ventana de confirmación  
**Para** dejar registrada la reunión y avisar a los participantes

### Criterios de aceptación
1. Dónde: ventana de confirmación abierta desde HU_DN_03_37.
2. Campos: la ventana contiene:
   2.1 Título: texto, obligatorio, longitud máxima 100 caracteres. Si está vacío: 'El título de la reunión es obligatorio.'
   2.2 Tipo: lista desplegable obligatoria con Daily, Planning, Review, Retro y General. Si falta: 'Seleccione el tipo de reunión.'
   2.3 Ubicación o enlace: texto opcional, prellenado y editable con el enlace predeterminado del proyecto cuando existe. Si tiene formato de URL inválido: 'El enlace de la reunión no tiene un formato de URL válido.'
   2.4 Proyecto asociado: lista desplegable obligatoria con los proyectos que el usuario gestiona (Administrador: todos), que prellena el enlace predeterminado del proyecto; todos los participantes deben ser miembros del proyecto. Si falta: 'Debe seleccionar un proyecto.'; si algún participante no es miembro: 'Todos los participantes deben ser miembros del proyecto seleccionado.'
   2.5 Fecha, hora, duración y participantes: solo lectura.
   2.6 Botón 'Confirmar reunión' y botón 'Cancelar'.
3. Validación: título, tipo y proyecto son obligatorios; se puede confirmar sin enlace.
4. Restricción: el enlace es opcional y el predeterminado del proyecto es solo una sugerencia (RN-AGE-03); no se modifica ningún calendario externo (RN-AGE-04). Una reunión concurrente de un mismo participante se rechaza con 'Uno o más participantes ya tienen una reunión en ese horario.'
5. Éxito: 'Reunión programada correctamente.'; se redirige al apartado de reuniones donde aparece, y cada participante recibe una notificación.
6. Fallo técnico: ante un error no anticipado (caída del servicio o tiempo de espera agotado) se muestra 'No fue posible completar la operación. Intente nuevamente.' sin alterar datos.

**Fecha recepción:** 2026-10-13  
**Estado:** COMPLETED

---

## HU_DN_03_39 — Consultar la lista de reuniones próximas y pasadas
**Como** Gerente o Desarrollador participante  
**Quiero** Consultar la lista de reuniones próximas y pasadas  
**Para** conocer mis compromisos y revisar las reuniones ya realizadas

### Criterios de aceptación
1. Dónde: apartado 'Reuniones', vista 'Lista'.
2. Campos: la lista muestra:
   2.1 Filtro con las opciones 'Próximas' y 'Pasadas'.
   2.2 Por reunión: título, tipo, fecha y hora, duración y estado.
   2.3 Orden: las próximas por fecha ascendente; las pasadas, separadas.
3. Validación: el alcance depende del rol: el Administrador ve todas; el Gerente, las propias y las de sus proyectos; el Desarrollador, solo aquellas en las que participa.
4. Restricción: «próxima» significa fecha y hora futuras (S-06); una reunión cancelada deja de contarse como próxima.
5. Éxito: se muestran las reuniones del alcance del usuario; si no hay: 'No hay reuniones para mostrar.'
6. Fallo técnico: si la información no puede cargarse se muestra 'No fue posible cargar la información. Intente nuevamente.'

**Fecha recepción:** 2026-10-13  
**Estado:** COMPLETED

---

## HU_DN_03_40 — Visualizar las reuniones en una vista de calendario
**Como** Gerente o Desarrollador participante  
**Quiero** Visualizar las reuniones en una vista de calendario  
**Para** ver mis reuniones distribuidas en el tiempo y alternar con la lista

### Criterios de aceptación
1. Dónde: apartado 'Reuniones', conmutador 'Lista / Calendario'.
2. Campos: controles:
   2.1 Conmutador entre las vistas 'Lista' y 'Calendario'.
   2.2 En el calendario cada reunión muestra título y tipo en texto distinguible.
3. Validación: ambas vistas muestran exactamente el mismo conjunto de reuniones del usuario.
4. Restricción: se respeta el mismo alcance por rol de la lista de reuniones.
5. Éxito: al alternar la vista se muestra el calendario con las reuniones del usuario.
6. Fallo técnico: si la información no puede cargarse se muestra 'No fue posible cargar la información. Intente nuevamente.'

**Fecha recepción:** 2026-10-13  
**Estado:** COMPLETED

---

## HU_DN_03_41 — Consultar el detalle de una reunión
**Como** Gerente o Desarrollador participante  
**Quiero** Consultar el detalle de una reunión  
**Para** conocer sus datos completos y acceder a las acciones disponibles

### Criterios de aceptación
1. Dónde: al seleccionar una reunión en la lista o el calendario.
2. Campos: el detalle muestra:
   2.1 Título, tipo, proyecto, fecha y hora, duración, ubicación o enlace y estado.
   2.2 Creador y participantes con su respuesta (pendiente, aceptada o rechazada).
   2.3 Resumen y URL del acta cuando existan.
   2.4 Acciones según el rol: 'Enviar a Google Calendar', 'Aceptar / Rechazar', 'Cancelar reunión' (solo creador) y 'Registrar resumen y acta'.
3. Validación: el tipo de reunión se muestra con texto distinguible.
4. Restricción: un Desarrollador solo accede al detalle de reuniones en las que participa; en otro caso recibe acceso denegado.
5. Éxito: se muestra el detalle completo de la reunión.
6. Fallo técnico: si la información no puede cargarse se muestra 'No fue posible cargar la información. Intente nuevamente.'

**Fecha recepción:** 2026-10-13  
**Estado:** COMPLETED

---

## HU_DN_03_42 — Abrir Google Calendar con un evento prellenado de la reunión, con copia de sus datos si la apertura falla
**Como** Gerente o Desarrollador participante  
**Quiero** Abrir Google Calendar con un evento prellenado de la reunión, con copia de sus datos si la apertura falla  
**Para** guardar la reunión en mi calendario con un solo paso y no perder la información si la integración externa falla

### Criterios de aceptación
1. Dónde: detalle de la reunión, acción 'Enviar a Google Calendar'; tras un fallo al abrir Google Calendar, el mismo detalle de la reunión.
2. Campos: datos prellenados en el evento (2.1) y controles que aparecen si la apertura falla (2.2):
   2.1 Título, fecha y hora, duración, enlace y correos de los integrantes.
   2.2 Mensaje de error y botón 'Copiar datos de la reunión'.
3. Validación: el usuario confirma la creación del evento dentro de Google Calendar; el fallo de la integración no cambia el estado ni los datos de la reunión.
4. Restricción: el sistema no crea ni modifica eventos sin acción y autorización del usuario (RN-AGE-04); no almacena credenciales de Google (RNF-COM-02); el relleno de invitados no está garantizado (R-04); la reunión permanece registrada (RNF-FIA-01). Puede enviar cualquier participante de la reunión (Administrador, Gerente o Desarrollador participante), no solo quien la programa.
5. Éxito: al pulsar la acción se abre Google Calendar con el evento prellenado; al copiar se muestra 'Datos de la reunión copiados.'
6. Fallo: al fallar la apertura: 'No fue posible abrir Google Calendar. Puede copiar los datos de la reunión.'; si el portapapeles no está disponible: 'No fue posible copiar los datos. Cópielos manualmente.'
7. Fallo técnico: ante un error no anticipado (caída del servicio o tiempo de espera agotado) se muestra 'No fue posible completar la operación. Intente nuevamente.' sin alterar datos.

**Fecha recepción:** 2026-10-13  
**Estado:** COMPLETED

---

## HU_DN_03_44 — Responder la invitación a una reunión aceptándola o rechazándola
**Como** Gerente o Desarrollador participante  
**Quiero** Responder la invitación a una reunión aceptándola o rechazándola  
**Para** informar al organizador si asistiré

### Criterios de aceptación
1. Dónde: detalle de una reunión en la que soy invitado.
2. Campos: controles:
   2.1 Botón 'Aceptar' y botón 'Rechazar'.
3. Validación: la respuesta pasa de pendiente a aceptada o rechazada y puede modificarse antes de que la reunión ocurra.
4. Restricción: no se puede responder una reunión cancelada ni ya realizada.
5. Éxito: 'Su respuesta ha sido registrada.' y el organizador la ve en la lista de participantes.
6. Fallo: reunión cancelada: 'La reunión fue cancelada; no es posible responder.'
7. Fallo técnico: ante un error no anticipado (caída del servicio o tiempo de espera agotado) se muestra 'No fue posible completar la operación. Intente nuevamente.' sin alterar datos.

**Fecha recepción:** 2026-10-13  
**Estado:** COMPLETED

---

## HU_DN_03_45 — Cancelar una reunión que programé
**Como** Gerente creador de la reunión  
**Quiero** Cancelar una reunión que programé  
**Para** avisar al equipo cuando una reunión ya no se realizará

### Criterios de aceptación
1. Dónde: detalle de la reunión, acción 'Cancelar reunión' (visible solo para el creador).
2. Campos: diálogo de confirmación:
   2.1 Mensaje: '¿Está seguro de que desea cancelar esta reunión? Se notificará a los participantes.'
   2.2 Botón 'Confirmar' y botón 'Cancelar'.
3. Validación: sin confirmación no se cancela.
4. Restricción: solo quien creó la reunión puede cancelarla, sin importar su rol; un Administrador no puede cancelar una reunión creada por un Gerente: se rechaza con 'Solo el creador de la reunión puede cancelarla.' (RN-AGE-05).
5. Éxito: 'Reunión cancelada correctamente.'; la reunión pasa a Cancelada, deja de contarse como próxima y los participantes reciben una notificación.
6. Fallo técnico: ante un error no anticipado (caída del servicio o tiempo de espera agotado) se muestra 'No fue posible completar la operación. Intente nuevamente.' sin alterar datos.

**Fecha recepción:** 2026-10-13  
**Estado:** COMPLETED

---

## HU_DN_03_46 — Registrar el resumen y la URL del acta de una reunión realizada
**Como** Gerente  
**Quiero** Registrar el resumen y la URL del acta de una reunión realizada  
**Para** dejar constancia de lo tratado y los acuerdos de la reunión

### Criterios de aceptación
1. Dónde: detalle de una reunión realizada, acción 'Registrar resumen y acta'.
2. Campos: el formulario contiene:
   2.1 Resumen: texto, obligatorio, longitud máxima 2000 caracteres. Si está vacío: 'El resumen es obligatorio.'
   2.2 URL del acta: texto con formato de URL, opcional. Si no es válida: 'La URL del acta no tiene un formato válido.'
   2.3 Botón 'Guardar' y botón 'Cancelar'.
3. Validación: una URL inválida se rechaza.
4. Restricción: solo aplica a reuniones realizadas; una reunión pasa a «realizada» automáticamente cuando su hora de fin ya transcurrió, sin acción manual.
5. Éxito: 'Resumen y acta guardados correctamente.' y ambos datos se muestran en el detalle.
6. Fallo técnico: ante un error no anticipado (caída del servicio o tiempo de espera agotado) se muestra 'No fue posible completar la operación. Intente nuevamente.' sin alterar datos.

**Fecha recepción:** 2026-10-13  
**Estado:** COMPLETED

---

## EP-06 — Backlog TAR (HU_DN_04_47 … HU_DN_04_55)

Lote Sprint 4 / MVP 2 recibido 2026-10-20. Implementación en rama `feature/ep-06-backlog-tar`.

| ID | Estado |
|---|---|
| HU_DN_04_47 | COMPLETED |
| HU_DN_04_48 | COMPLETED |
| HU_DN_04_49 | COMPLETED |
| HU_DN_04_50 | COMPLETED |
| HU_DN_04_51 | COMPLETED |
| HU_DN_04_52 | COMPLETED |
| HU_DN_04_53 | COMPLETED |
| HU_DN_04_54 | COMPLETED |
| HU_DN_04_55 | COMPLETED |

## EP-06 — Backlog TAR (HU_DN_04_56 … HU_DN_04_61)

Recibidas 2026-10-20.

| ID | Estado |
|---|---|
| HU_DN_04_56 | COMPLETED |
| HU_DN_04_57 | COMPLETED |
| HU_DN_04_58 | COMPLETED |
| HU_DN_04_59 | COMPLETED |
| HU_DN_04_60 | COMPLETED |
| HU_DN_04_61 | COMPLETED |

Pantallas: registro de horas y estado en el backlog, filtros, Mis tareas (`/mis-tareas`) e invitación (`/invitacion`).

## EP-07 — Sprints SPR (HU_DN_05_63 … HU_DN_05_71)

| ID | Estado | UI |
|---|---|---|
| HU_DN_05_63 … 67 | COMPLETED | `ProjectSprintsTab`, asignación desde backlog |
| HU_DN_05_68 | COMPLETED | Burndown en métricas del sprint activo |
| HU_DN_05_69 | COMPLETED | Modal finalizar sprint |
| HU_DN_05_70 | COMPLETED | Selector destino HUs incompletas |
| HU_DN_05_71 | COMPLETED | Historial de sprints cerrados |

---

## EP-08 — Tablero Kanban (HU_DN_05_72 … HU_DN_05_76)

| ID | Título | Estado |
|---|---|---|
| HU_DN_05_72 | Visualizar el tablero Kanban del sprint activo en columnas | COMPLETED |
| HU_DN_05_73 | Mover tarjetas de tarea entre columnas mediante drag & drop o menú | COMPLETED |
| HU_DN_05_74 | Aplicar límites de trabajo en progreso (WIP) por columna | COMPLETED |
| HU_DN_05_75 | Filtrar las tarjetas del tablero Kanban | COMPLETED |
| HU_DN_05_76 | Visualizar bloqueos o dependencias en las tarjetas del tablero | COMPLETED |

### HU_DN_05_72 — Visualizar el tablero Kanban del sprint activo en columnas
**Como** Administrador, Gerente o Desarrollador  
**Quiero** Visualizar el tablero Kanban del sprint activo en columnas  
**Para** monitorear el flujo visual de trabajo de las tareas del sprint en tiempo real
**Criterios de aceptación:**
1. Dónde: Pestaña “Tablero Kanban” dentro del proyecto activo.
2. Campos: La vista organiza las tarjetas de tarea en 6 columnas estándar: 2.1 Por hacer (TODO), 2.2 En progreso (IN_PROGRESS), 2.3 Revisión de código (CODE_REVIEW), 2.4 Pruebas (TESTING), 2.5 Corrección (CORRECTION), 2.6 Completada (DONE).
3. Validación: Cada tarjeta de tarea muestra: título, tipo de tarea, avatar del responsable, etiqueta de HU padre y contador de horas (estimadas vs. trabajadas).
4. Restricción: El Desarrollador visualiza únicamente las tarjetas correspondientes a sus propias tareas dentro del proyecto; Administrador y Gerente visualizan la totalidad de tarjetas del sprint activo.
5. Éxito: Muestra las columnas renderizadas con sus tarjetas; si no hay sprint activo: 'No hay ningún sprint activo en este proyecto.'
6. Fallo técnico: Si la información no puede cargarse se muestra 'No fue posible cargar la información. Intente nuevamente.'

**Fecha recepción:** 2026-10-28  
**Estado:** COMPLETED

---

### HU_DN_05_73 — Mover tarjetas de tarea entre columnas mediante drag & drop o menú
**Como** Administrador, Gerente o Desarrollador (solo mis tareas)  
**Quiero** Mover tarjetas de tarea entre columnas mediante drag & drop o menú  
**Para** actualizar el estado del trabajo de manera ágil e intuitiva
**Criterios de aceptación:**
1. Dónde: Tablero Kanban del sprint activo.
2. Campos: Arrastre de tarjeta o menú contextual de la tarjeta con opción "Mover a...".
3. Validación: Al soltar la tarjeta en una nueva columna, el sistema invoca la transición de estado correspondiente (HU_DN_04_57).
4. Restricción: El Desarrollador solo puede arrastrar o mover sus propias tareas. Si intenta mover una tarjeta ajena: 'Solo puede cambiar el estado de sus propias tareas.' No se permite arrastrar manualmente hacia o desde la columna Corrección (mensaje: 'El estado Corrección solo cambia al reportar o resolver un fix.').
5. Éxito: 'Estado de la tarea actualizado.' y la tarjeta se fija en la columna destino.
6. Fallo técnico: Si la API rechaza el movimiento, la tarjeta regresa automáticamente (rollback visual) a su columna de origen y se muestra el mensaje de error.

**Fecha recepción:** 2026-10-28  
**Estado:** COMPLETED

---

### HU_DN_05_74 — Aplicar límites de trabajo en progreso (WIP) por columna
**Como** Administrador o Gerente  
**Quiero** Aplicar límites de trabajo en progreso (WIP) por columna  
**Para** prevenir cuellos de botella y evitar la sobrecarga de trabajo en fases del flujo
**Criterios de aceptación:**
1. Dónde: Configuración de cabecera de cada columna del tablero Kanban.
2. Campos: 2.1 Límite WIP: campo numérico entero positivo o "Sin límite".
3. Validación: Si el número de tarjetas en una columna supera su límite WIP configurado, la cabecera de la columna cambia a color de advertencia (rojo/naranja) y muestra 'Límite WIP superado ([Actual]/[Límite])'.
4. Restricción: El límite WIP es de carácter informativo/advertencia (soft-limit) y no bloquea el movimiento de tarjetas, permitiendo flexibilidad operativa.
5. Éxito: 'Límite WIP actualizado correctamente.'
6. Fallo técnico: Ante un error no anticipado se muestra 'No fue posible completar la operación. Intente nuevamente.' sin alterar datos.

**Fecha recepción:** 2026-10-28  
**Estado:** COMPLETED

---

### HU_DN_05_75 — Filtrar las tarjetas del tablero Kanban
**Como** Administrador, Gerente o Desarrollador  
**Quiero** Filtrar las tarjetas del tablero Kanban  
**Para** enfocar la vista en tareas específicas por responsable, historia o tipo
**Criterios de aceptación:**
1. Dónde: Barra superior de herramientas del tablero Kanban.
2. Campos: 2.1 Texto libre: búsqueda por título de tarea. 2.2 Responsable: desplegable con miembros del proyecto. 2.3 Historia de Usuario: desplegable con HUs del sprint actual. 2.4 Tipo de tarea: Frontend, Backend, BD, QA, etc.
3. Validación: Oculta dinámicamente las tarjetas que no coincidan con los criterios seleccionados.
4. Restricción: El Desarrollador filtra únicamente entre las tarjetas que tiene visibles.
5. Éxito: Muestra solo las tarjetas coincidentes en sus respectivas columnas.
6. Fallo: Sin coincidencias: las columnas se muestran vacías con el aviso 'No se encontraron tarjetas con los filtros aplicados.'

**Fecha recepción:** 2026-10-28  
**Estado:** COMPLETED

---

### HU_DN_05_76 — Visualizar bloqueos o dependencias en las tarjetas del tablero
**Como** Administrador, Gerente o Desarrollador  
**Quiero** Visualizar bloqueos o dependencias en las tarjetas del tablero  
**Para** identificar rápidamente los impedimentos que detienen el avance del trabajo
**Criterios de aceptación:**
1. Dónde: Tarjeta de tarea dentro del tablero Kanban.
2. Campos: 2.1 Badge de bloqueo: ícono distintivo (candado/alerta roja) en la esquina de la tarjeta. 2.2 Detalle al hacer clic/hover: muestra el motivo del bloqueo o la tarea dependiente no completada.
3. Validación: Se activa cuando la tarea tiene un flag de impedimento reportado o una tarea predecesora pendiente.
4. Restricción: Visible para todos los usuarios que tengan acceso a la tarjeta.
5. Éxito: Muestra la insignia visual de bloqueo claramente diferenciada en la tarjeta.
6. Fallo técnico: Si los datos del bloqueo no cargan se omiten los detalles adicionales manteniendo el ícono de alerta básico.

**Fecha recepción:** 2026-10-28  
**Estado:** COMPLETED

---

## Épica 09: Documentación y base de conocimiento

### HU_DN_06_77 — Registrar una entrada de documentación en un proyecto
**Como** Administrador, Gerente o Desarrollador  
**Quiero** Registrar una entrada de documentación en un proyecto  
**Para** dejar el conocimiento del proyecto disponible, previa aprobación
**Criterios de aceptación:**
1. Dónde: Pestaña “Conocimiento” del proyecto, botón “Nueva entrada”.
2. Campos: El formulario contiene:
   2.1 Título: texto, obligatorio, longitud máxima 100 caracteres. Si está vacío: 'El título es obligatorio.'
   2.2 Categoría: lista desplegable obligatoria con Técnica, Funcional, Reunión, General y Prompt. Si falta: 'Seleccione una categoría.'
   2.3 Objetivo: texto, opcional.
   2.4 Etiquetas: texto, opcionales.
   2.5 Contenido: texto propio.
   2.6 Enlace externo: URL con formato válido. Si no es válida: 'El enlace no tiene un formato de URL válido.'
   2.7 Botón “Registrar entrada” y botón “Cancelar”.
3. Validación: Debe existir contenido de texto o enlace externo; si faltan ambos: 'Ingrese contenido o un enlace externo.'
4. Restricción: No se almacenan archivos, solo texto y/o enlace (S-07); el sistema avisa que la visibilidad en DashNode no controla los permisos del recurso externo (RN-DOC-03); todo texto se escapa al mostrarse (RNF-SEG-10).
5. Éxito: 'Entrada registrada correctamente. Quedó pendiente de aprobación.'; la entrada queda en estado Pendiente y no es visible para otros desarrolladores hasta ser aprobada (RN-DOC-05).
6. Fallo técnico: Ante un error no anticipado se muestra 'No fue posible completar la operación. Intente nuevamente.' sin alterar datos.

**Fecha recepción:** 2026-10-28  
**Estado:** COMPLETED

---

### HU_DN_06_78 — Editar una entrada de documentación
**Como** autor de la entrada, Administrador o Gerente  
**Quiero** Editar una entrada de documentación  
**Para** corregir o completar la información registrada
**Criterios de aceptación:**
1. Dónde: Pestaña “Conocimiento”, acción “Editar” de la entrada.
2. Campos: El formulario contiene:
   2.1 Los mismos campos y reglas de HU_DN_06_77, precargados.
   2.2 Botón “Guardar cambios” y botón “Cancelar”.
3. Validación: El autor edita sus entradas Pendientes o Rechazadas; el Administrador y el Gerente editan cualquier entrada del proyecto.
4. Restricción: Un Desarrollador no edita entradas ajenas ni aprobadas y recibe acceso denegado. Al editar una entrada ya aprobada, esta vuelve al estado Pendiente y deja de ser visible para el Desarrollador hasta que otro aprobador la apruebe de nuevo.
5. Éxito: 'Entrada actualizada correctamente.'
6. Fallo técnico: Ante un error no anticipado se muestra 'No fue posible completar la operación. Intente nuevamente.' sin alterar datos.

**Fecha recepción:** 2026-10-28  
**Estado:** COMPLETED

---

### HU_DN_06_79 — Eliminar una entrada de documentación
**Como** Administrador o Gerente  
**Quiero** Eliminar una entrada de documentación  
**Para** retirar entradas erróneas u obsoletas de la base de conocimiento
**Criterios de aceptación:**
1. Dónde: Pestaña “Conocimiento”, acción “Eliminar” de la entrada.
2. Campos: Diálogo de confirmación:
   2.1 Mensaje: '¿Está seguro de que desea eliminar esta entrada?'
   2.2 Botón “Confirmar” y botón “Cancelar”.
3. Validación: Sin confirmación no se elimina.
4. Restricción: Solo Administrador y Gerente eliminan entradas; el Desarrollador recibe acceso denegado. El borrado es lógico: la entrada deja de listarse y consultarse, pero se conserva en base de datos.
5. Éxito: 'Entrada eliminada correctamente.' y deja de listarse.
6. Fallo técnico: Ante un error no anticipado se muestra 'No fue posible completar la operación. Intente nuevamente.' sin alterar datos.

**Fecha recepción:** 2026-10-28  
**Estado:** COMPLETED

---

### HU_DN_06_80 — Consultar el listado de entradas de documentación del proyecto
**Como** Administrador, Gerente o Desarrollador  
**Quiero** Consultar el listado de entradas de documentación del proyecto  
**Para** encontrar la información documentada del proyecto
**Criterios de aceptación:**
1. Dónde: Pestaña “Conocimiento” del proyecto.
2. Campos: El listado muestra por entrada:
   2.1 Título, categoría, objetivo, estado de aprobación (Pendiente, Aprobada o Rechazada) y enlace.
   2.2 Las entradas ancladas aparecen destacadas al inicio.
3. Validación: El Administrador y el Gerente ven todas las entradas del proyecto; el Desarrollador, solo las aprobadas con visibilidad habilitada y las propias.
4. Restricción: Una entrada restringida o no aprobada no aparece al Desarrollador (RN-DOC-02).
5. Éxito: Se listan las entradas permitidas; sin entradas: 'No hay entradas de documentación.' con la acción sugerida “Nueva entrada”.
6. Fallo técnico: Si la información no puede cargarse se muestra 'No fue posible cargar la información. Intente nuevamente.'

**Fecha recepción:** 2026-10-28  
**Estado:** COMPLETED

---

### HU_DN_06_81 — Recibir acceso denegado al consultar directamente una entrada restringida o no aprobada
**Como** Desarrollador  
**Quiero** Recibir acceso denegado al consultar directamente una entrada restringida o no aprobada  
**Para** que la información no autorizada no se exponga aunque conozca su identificador
**Criterios de aceptación:**
1. Dónde: Solicitud directa de una entrada por su identificador o ruta.
2. Campos: No aplica captura de datos; la acción no requiere formulario.
3. Validación: Si la entrada está restringida o no aprobada y no es del solicitante, el servidor deniega la consulta.
4. Restricción: La respuesta no incluye contenido ni enlace externo; el autor conserva acceso a sus propias entradas (RN-DOC-02).
5. Éxito: Se muestra 'No tiene acceso a esta entrada.'
6. Fallo técnico: Ante un error no anticipado se muestra 'No fue posible completar la operación. Intente nuevamente.' sin alterar datos.

**Fecha recepción:** 2026-10-28  
**Estado:** COMPLETED

---

### HU_DN_06_82 — Control de visibilidad de documentación para desarrolladores
**Como** Administrador o Gerente  
**Quiero** Alternar la visibilidad de una entrada de documentación aprobada para los desarrolladores  
**Para** controlar qué información aprobada está disponible para el equipo de desarrollo

**Criterios de aceptación:**
1. Dónde: Pestaña “Conocimiento” del proyecto, conmutador de visibilidad en la tarjeta de entrada aprobada.
2. Campos: Interruptor/conmutador “Visible para desarrolladores” (activo/inactivo).
3. Validación: Solo se puede alternar la visibilidad de entradas en estado Aprobada (`APPROVED`).
4. Restricción: Solo Administrador y Gerente pueden modificar la visibilidad. Una entrada no aprobada no puede ser visible para desarrolladores (`is_visible_to_devs = False`). El cambio genera trazabilidad en registro de auditoría (`audit_logs`, RNF-SEG-07).
5. Éxito: Se muestra 'Visibilidad actualizada correctamente.' y el estado visual se actualiza de inmediato.
6. Fallo: Si la entrada no está aprobada, se rechaza con 'Solo se puede cambiar la visibilidad de entradas aprobadas.' Ante error técnico: 'No fue posible completar la operación. Intente nuevamente.'

**Fecha recepción:** 2026-10-28  
**Estado:** COMPLETED

---

### HU_DN_06_83 — Visualización de cola de aprobación de documentación
**Como** Administrador o Gerente  
**Quiero** Consultar la cola de entradas de documentación pendientes de aprobación  
**Para** revisar y gestionar las solicitudes de documentación enviadas por el equipo

**Criterios de aceptación:**
1. Dónde: Pestaña “Cola de aprobación” en la sección de Conocimiento del proyecto.
2. Campos: Lista de entradas pendientes con: título, autor, categoría, fecha de creación y acciones directas (Aprobar, Rechazar).
3. Validación: Si no hay entradas pendientes, se muestra el estado vacío: 'No hay entradas pendientes de aprobación.'
4. Restricción: Si un Desarrollador intenta acceder a la cola, el servidor deniega el acceso con HTTP 403 Forbidden.
5. Éxito: Se listan todas las entradas en estado `PENDING` del proyecto con contador visual.
6. Fallo técnico: Ante un error de conexión se muestra 'No fue posible cargar la información. Intente nuevamente.'

**Fecha recepción:** 2026-10-28  
**Estado:** COMPLETED

---

### HU_DN_06_84 — Aprobación de entrada de documentación
**Como** Administrador o Gerente  
**Quiero** Aprobar una entrada de documentación pendiente  
**Para** validar su contenido y ponerla a disposición del proyecto

**Criterios de aceptación:**
1. Dónde: Cola de aprobación de documentación, botón “Aprobar” de la entrada.
2. Campos: Acción directa (sin formulario adicional requerido).
3. Validación: Solo se pueden procesar entradas en estado Pendiente (`PENDING`).
4. Restricción (RN-DOC-01): Si el usuario que intenta aprobar es el mismo autor de la entrada, la acción se deshabilita y se muestra 'No puede aprobar su propia entrada.' (también validado en backend con 403 Forbidden).
5. Éxito: Se muestra 'Entrada aprobada correctamente.', el estado pasa a `APPROVED`, `is_visible_to_devs` queda habilitado por defecto y la entrada sale de la cola de aprobación. Registra trazabilidad en `audit_logs` (RNF-SEG-07).
6. Fallo técnico: Ante un error no anticipado se muestra 'No fue posible completar la operación. Intente nuevamente.'

**Fecha recepción:** 2026-10-28  
**Estado:** COMPLETED

---

### HU_DN_06_85 — Rechazo de entrada de documentación con retroalimentación
**Como** Administrador o Gerente  
**Quiero** Rechazar una entrada de documentación pendiente indicando observaciones  
**Para** que el autor conozca los motivos del rechazo y realice las correcciones necesarias

**Criterios de aceptación:**
1. Dónde: Cola de aprobación de documentación, botón “Rechazar” de la entrada.
2. Campos: Modal con:
   2.1 Campo de texto multilínea “Motivo de rechazo (opcional)”.
   2.2 Botón “Confirmar rechazo” y botón “Cancelar”.
3. Validación: Solo se pueden rechazar entradas en estado Pendiente (`PENDING`).
4. Restricción: Solo Administrador y Gerente pueden rechazar. La entrada pasa a `REJECTED`, sale de la cola de aprobación y se oculta para otros desarrolladores. El autor conserva acceso exclusivo para consultar el motivo, editarla y reenviarla. Registra auditoría (RNF-SEG-07).
5. Éxito: Se muestra 'Entrada rechazada correctamente.'
6. Fallo técnico: Ante un error no anticipado se muestra 'No fue posible completar la operación. Intente nuevamente.'

**Fecha recepción:** 2026-10-28  
**Estado:** COMPLETED

---

### HU_DN_06_86 — Reenvío de entrada rechazada a nueva revisión
**Como** Desarrollador, Gerente o Administrador (autor de la entrada rechazada)  
**Quiero** Reenviar una entrada de documentación rechazada a aprobación tras realizar ajustes  
**Para** que sea nuevamente revisada por el Administrador o Gerente

**Criterios de aceptación:**
1. Dónde: Tarjeta de entrada en estado Rechazada (`REJECTED`) en la base de conocimiento o modal de edición.
2. Campos: El formulario muestra el motivo de rechazo previo como referencia y permite actualizar título, categoría, objetivo, contenido o recurso externo. Botón “Reenviar a aprobación”.
3. Validación: Solo se pueden reenviar entradas en estado Rechazada (si no: 'Solo se pueden reenviar entradas rechazadas.').
4. Restricción: Solo el autor original de la entrada puede reenviarla. Al confirmar el reenvío, el estado cambia a Pendiente (`PENDING`), `is_visible_to_devs` se mantiene activo para el ciclo de revisión, y reaparece en la cola de aprobación.
5. Éxito: Se muestra 'Entrada reenviada a aprobación.'
6. Fallo técnico: Ante un error no anticipado se muestra 'No fue posible completar la operación. Intente nuevamente.'

**Fecha recepción:** 2026-10-28  
**Estado:** COMPLETED

---

## Estado de implementación — EP-09 Documentación y base de conocimiento (HU_DN_06_77 … HU_DN_06_86)

| HU | Estado | Evidencia |
| --- | --- | --- |
| HU_DN_06_77 | Implementado | Pestaña "Conocimiento", modal `DocumentationModal`, validaciones requeridas, aviso de recurso externo (RN-DOC-03), estado inicial `PENDING`, toast `ENTRY_CREATED`. Tests: `ProjectKnowledgeTab.test.tsx`, `api.test.ts`. |
| HU_DN_06_78 | Implementado | Botón editar visible según `can_edit`, modal con datos precargados, aviso de reinicio de estado `STATUS_RESET_NOTICE` al editar entradas aprobadas (RN-DOC-05), toast `ENTRY_UPDATED`. Tests: `ProjectKnowledgeTab.test.tsx`. |
| HU_DN_06_79 | Implementado | Botón eliminar visible según `can_delete` (solo Admin/Gerente), modal de confirmación `DeleteDocumentationModal` con texto literal exacto, borrado lógico, toast `ENTRY_DELETED`. Tests: `ProjectKnowledgeTab.test.tsx`. |
| HU_DN_06_80 | Implementado | Pestaña `ProjectKnowledgeTab` en espacio de trabajo (`/proyectos/:projectId/conocimiento`), entradas ancladas con badge "Anclado" al inicio, filtros de búsqueda/categoría/estado, estado vacío con mensaje literal. Tests: `ProjectKnowledgeTab.test.tsx`. |
| HU_DN_06_81 | Implementado | Manejo de rechazo 403 Forbidden con mensaje exacto `'No tiene acceso a esta entrada.'` impidiendo visualización de contenido no autorizado. Tests: `ProjectKnowledgeTab.test.tsx`. |
| HU_DN_06_82 | Implementado | Conmutador interactivo "Visible para devs" / "Oculto para devs" en tarjetas aprobadas para Gerente/Admin, llamada a `toggleDocumentationVisibility`, toast `VISIBILITY_UPDATED`. Tests: `ProjectKnowledgeTab.test.tsx`, `api.test.ts`. |
| HU_DN_06_83 | Implementado | Subpestaña "Cola de aprobación" con contador de pendientes (`ApprovalQueueView`), lista con título, autor, categoría, fecha y acciones directas, estado vacío `NO_PENDING_ENTRIES`, control de acceso 403. Tests: `ProjectKnowledgeTab.test.tsx`, `api.test.ts`. |
| HU_DN_06_84 | Implementado | Botón "Aprobar", restricción RN-DOC-01 para auto-aprobación con botón deshabilitado y mensaje literal `CANNOT_APPROVE_OWN_ENTRY`, actualización reactiva de cola y toast `ENTRY_APPROVED`. Tests: `ProjectKnowledgeTab.test.tsx`, `api.test.ts`. |
| HU_DN_06_85 | Implementado | Modal `RejectDocumentationModal` con campo de texto opcional para observaciones, botón de confirmación de rechazo, toast `ENTRY_REJECTED` y actualización de cola. Tests: `ProjectKnowledgeTab.test.tsx`, `api.test.ts`. |
| HU_DN_06_86 | Implementado | Botón "Reenviar a aprobación" visible al autor en tarjetas rechazadas, visualización de observaciones de rechazo previo en tarjeta y modal, validación de estado `REJECTED`, toast `ENTRY_RESUBMITTED`. Tests: `ProjectKnowledgeTab.test.tsx`, `api.test.ts`. |