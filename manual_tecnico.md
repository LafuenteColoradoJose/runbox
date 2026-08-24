# ⚙️ Runbox: Manual Técnico

Este documento describe la arquitectura técnica, las decisiones de diseño y las instrucciones de despliegue del proyecto **Runbox** (Orquestador estilo Ansible AWX / Semaphore UI).

> [!NOTE]
> **Credenciales de Acceso (Pruebas Locales):**
> Los seeds de la base de datos de SQLite configuran por defecto el usuario `administrator` con la contraseña `Usuario1.` para realizar pruebas.

## 🏗️ Arquitectura General

El proyecto utiliza una arquitectura basada en un **Monorepo** con NPM Workspaces que divide la aplicación en dos grandes módulos: `frontend` y `backend`.

### Stack Tecnológico
*   **Frontend**: Angular 22 (Standalone Components, Signals-ready), Angular Material 3 (con Theming Dinámico M3), RxJS, Socket.io-client, Xterm.js.
*   **Backend**: Node.js v22, Express, Socket.io, better-sqlite3.
*   **Sistema y Orquestación**: Ansible, SSHPass.
*   **Infraestructura**: Docker (Multistage Build).

---

## 🏢 Arquitectura y Jerarquía de Inventarios

El modelo de datos relacional refleja una jerarquía estándar para plataformas de automatización, optimizada para control de accesos basado en roles (RBAC) y la herencia de variables:

1. **Organizations (`organizations`)**: El nivel superior (Ej. departamentos como *Ventas* o *RRHH*).
2. **Inventories (`inventories`)**: Agrupaciones de infraestructura pertenecientes a una organización (Ej. *AWS Production*).
3. **Groups (`groups`)**: Agrupaciones lógicas de hosts (Ej. *web_servers*). Pueden almacenar variables compartidas en formato JSON.
4. **Hosts (`hosts`)**: Máquinas finales gestionadas por Ansible, asociadas a uno o más grupos (`host_groups`). También soportan variables JSON individuales.
5. **Users & Playbooks (`users`, `user_organizations`, `playbooks`)**: Los usuarios tienen un `role` (admin/user). Los usuarios normales están vinculados a organizaciones mediante la tabla puente `user_organizations`. Los Playbooks también pueden pertenecer a un `organization_id`. Esta estructura soporta el filtrado restrictivo del sistema.

### Mecanismo de Seguridad (RBAC)
Tanto la API como el Frontend (UI) se coordinan para el control de acceso:
* **Nivel Base de Datos / API:** Los endpoints transaccionales (POST/PUT/DELETE) sobre la infraestructura y la gestión de usuarios están protegidos por el middleware `requireAdmin`. Además, las sentencias SQL filtran los `SELECT` usando la tabla `user_organizations` cuando el request proviene de un rol `user`, asegurando que no puedan ver ni ejecutar (en `/api/playbooks/run`) recursos fuera de sus organizaciones.
* **Nivel UI:** El frontend utiliza inyección de dependencias con Signals (`authService.currentUser()?.role`) para suprimir renderizados condicionales (`@if`). Los usuarios estándar no cargan en el DOM los botones de edición/creación, ni rutas protegidas (ej. menú Users), ofreciendo una experiencia sin frustraciones ni errores de permisos.

---

## 💻 Frontend (Angular)

El frontend está estructurado siguiendo las mejores prácticas de Angular moderno (sin `NgModules`). 
*   **App Shell**: Utiliza Angular Material para proporcionar un `Sidenav` y un `Toolbar` persistentes.
*   **Enrutamiento**: Declarativo en `app.routes.ts`.
    *   `/dashboard`: Vista principal con gráficas (ECharts) de métricas del sistema, hosts y trabajos recientes. Todas las tablas incluyen soporte para paginación y ordenamiento.
    *   `/playbooks`: Muestra la cuadrícula (Grid) de Playbooks disponibles.
    *   `/jobs/:id`: Muestra la consola en tiempo real (Xterm.js) para un trabajo en ejecución.
*   **WebSockets**: Implementados a través de un servicio inyectable (`SocketService`) que gestiona la conexión bidireccional con el servidor para la captura de logs (`log_stream` y `job_status`).
*   **Consola y Gráficos**: `TerminalViewerComponent` monta una terminal de `xterm.js` con soporte para ResizeObserver. Además, se utilizan componentes visuales con `ngx-echarts` para monitorización de estados.

---

## 🛠️ Backend (Node.js)

El servidor actúa como un puente entre la base de datos, el cliente web y los binarios del sistema operativo (Ansible).

*   **API REST**: Expone endpoints bajo `/api/` para listar playbooks y lanzar tareas (`POST /api/playbooks/:id/run`).
*   **Base de Datos (SQLite)**: Se utiliza `better-sqlite3` por su sincronía, ideal para escrituras concurrentes de logs. La base de datos (`runbox.db`) consta de una tabla `jobs` con las columnas: `id`, `playbook_name`, `status`, `log_output`, `created_at` y `updated_at`.
*   **Ansible Runner**: Lógica encapsulada en `ansibleRunner.js`. Utiliza el módulo `child_process.spawn` nativo de Node.js.
    1. Lanza el proceso `ansible-playbook`.
    2. Escucha los eventos `data` de los streams `stdout` y `stderr`.
    3. Concatena los logs y hace un `UPDATE` síncrono en la base de datos (columna `log_output`).
    4. Inmediatamente después, emite el payload por Socket.io al cliente conectado a la "sala" (`room`) correspondiente al `jobId`.

---

## 🧪 Testing y Calidad de Código

Runbox implementa un sólido enfoque de pruebas automatizadas en ambos extremos de la pila (Backend y Frontend), alcanzando una cobertura de código (Test Coverage) superior al 80% y garantizando que el sistema sea estable para su uso en producción.

*   **Framework de Testing:** Se utiliza **Vitest** en ambos entornos, en lugar de frameworks tradicionales como Jest o Karma/Jasmine, debido a su velocidad (basado en Vite), API compatible y capacidades modernas.
*   **Backend:** Los tests se enfocan en las operaciones sobre la base de datos (SQLite), el control de acceso de las rutas (middlewares de RBAC) y el módulo aislable de `ansibleRunner`. Dependencias externas y procesos hijos (`child_process`) son simulados mediante Mocks de Vitest para garantizar un aislamiento total sin depender de Ansible instalado.
*   **Frontend:** Se testean extensivamente los componentes y servicios de Angular usando `TestBed` integrado con Vitest. Elementos del navegador como `ResizeObserver` y librerías de UI pesadas (ej. diálogos de Material, WebSockets o ECharts) son apropiadamente mockeados para asegurar rápidez y aislamiento en los tests unitarios.

---

## 🐳 Despliegue con Docker

El proyecto contiene un `Dockerfile` optimizado (_multistage build_).

1.  **Etapa de Compilación (`builder`)**: Usa la imagen `node:22`. Descarga dependencias de desarrollo y compila la aplicación Angular en código estático optimizado.
2.  **Etapa de Ejecución (`production`)**: Usa `node:22-slim`. 
    *   Instala los binarios del SO: `apt-get install ansible sshpass`.
    *   Instala *únicamente* las dependencias de producción de Node (`npm install --production`).
    *   Copia los estáticos de Angular dentro de `/backend/public`.
    *   Express sirve simultáneamente la API y los estáticos de Angular en el puerto `3000`.

### Ventaja del Contenedor (Plug & Play)
La principal ventaja de este despliegue es que **el contenedor es completamente autónomo**. Al instalar Ansible y SSHPass dentro de la imagen Docker en la etapa de producción, **no necesitas instalar Ansible ni Node.js en tu servidor físico o máquina host**. Simplemente necesitas tener instalado Docker; levantas el contenedor y la aplicación está lista para usarse, empaquetando todo el ecosistema y dependencias operativas en una sola caja.

### Comandos de Despliegue (Producción)
```bash
# Construir la imagen
docker build -t runbox .

# Ejecutar el contenedor en segundo plano en el puerto 3001
docker run -d -p 3001:3000 --name runbox runbox:latest
```

---

## 💻 Entorno de Desarrollo Local

Para facilitar el desarrollo y las pruebas sin depender puramente de la reconstrucción de la imagen Docker en cada paso, el proyecto cuenta con dos scripts de conveniencia en la raíz:

### `start.sh`
Orquesta el arranque secuencial de:
1. El contenedor Docker de pruebas (`runbox_test`).
2. El servidor Backend de Express (`node backend/server.js`) en el puerto 3000.
3. El servidor de desarrollo de Angular (`ng serve`) en el puerto 4200.

Intercepta la señal de apagado (`Ctrl+C`) para derivar su ejecución a `stop.sh`.

### `stop.sh`
Detiene el ecosistema de forma ordenada mediante `pkill` (delimitado al usuario actual para evitar matar procesos del contenedor) y comandos nativos de Docker:
1. Detiene el Frontend.
2. Detiene el Backend local.
3. Apaga el contenedor Docker.

---

## 🤖 Desarrollo impulsado por IA Agéntica (Agentic AI)

Dado el paradigma actual donde la programación asistida por agentes autónomos de IA es un estándar en la industria, el desarrollo de **Runbox** se ha beneficiado enormemente del uso de "Skills" (habilidades) específicas para la IA. 

En concreto, se han empleado las siguientes herramientas agénticas:
*   **Skill de Angular**: Para asegurar que el código generado sigue las convenciones más modernas del framework (Angular 18+), componentes standalone, signal-based reactivity (Signals) y las mejores prácticas de inyección de dependencias.
*   **Agent Skills de Addy Osmani** ([https://github.com/addyosmani/agent-skills](https://github.com/addyosmani/agent-skills)): Una potente suite de habilidades que proporciona al agente de IA flujos de trabajo estructurados. Se ha utilizado para diseñar interfaces estables (API), revisión cruzada de código (*code review*), y desarrollo guiado por pruebas (*TDD*), garantizando así un código robusto, escalable y con una alta cobertura de tests.
