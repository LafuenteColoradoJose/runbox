# ⚙️ Runbox: Manual Técnico

Este documento describe la arquitectura técnica, las decisiones de diseño y las instrucciones de despliegue del proyecto **Runbox** (Orquestador estilo Ansible AWX / Semaphore UI).

## 🏗️ Arquitectura General

El proyecto utiliza una arquitectura basada en un **Monorepo** con NPM Workspaces que divide la aplicación en dos grandes módulos: `frontend` y `backend`.

### Stack Tecnológico
*   **Frontend**: Angular 22 (Standalone Components, Signals-ready), Angular Material, RxJS, Socket.io-client, Xterm.js.
*   **Backend**: Node.js v22, Express, Socket.io, better-sqlite3.
*   **Sistema y Orquestación**: Ansible, SSHPass.
*   **Infraestructura**: Docker (Multistage Build).

---

## 💻 Frontend (Angular)

El frontend está estructurado siguiendo las mejores prácticas de Angular moderno (sin `NgModules`). 
*   **App Shell**: Utiliza Angular Material para proporcionar un `Sidenav` y un `Toolbar` persistentes.
*   **Enrutamiento**: Declarativo en `app.routes.ts`.
    *   `/playbooks`: Muestra la cuadrícula (Grid) de Playbooks disponibles.
    *   `/jobs/:id`: Muestra la consola en tiempo real (Xterm.js) para un trabajo en ejecución.
*   **WebSockets**: Implementados a través de un servicio inyectable (`SocketService`) que gestiona la conexión bidireccional con el servidor para la captura de logs (`log_stream` y `job_status`).
*   **Consola**: `TerminalViewerComponent` monta una terminal de `xterm.js`. El redimensionamiento se maneja con `ResizeObserver` y `requestAnimationFrame` para evitar sobrecargas de rendimiento en el DOM y errores de "ResizeObserver loop limit exceeded".

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

## 🐳 Despliegue con Docker

El proyecto contiene un `Dockerfile` optimizado (_multistage build_).

1.  **Etapa de Compilación (`builder`)**: Usa la imagen `node:22`. Descarga dependencias de desarrollo y compila la aplicación Angular en código estático optimizado.
2.  **Etapa de Ejecución (`production`)**: Usa `node:22-slim`. 
    *   Instala los binarios del SO: `apt-get install ansible sshpass`.
    *   Instala *únicamente* las dependencias de producción de Node (`npm install --production`).
    *   Copia los estáticos de Angular dentro de `/backend/public`.
    *   Express sirve simultáneamente la API y los estáticos de Angular en el puerto `3000`.

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
