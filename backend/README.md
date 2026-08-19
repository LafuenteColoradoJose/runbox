# Runbox Backend (Node.js)

Este es el directorio del backend de **Runbox**, la API y orquestador basado en **Node.js** y **Express**.

## Características Principales

*   **Orquestación de Ansible**: Utiliza los procesos hijos (`child_process.spawn`) nativos de Node.js para ejecutar y controlar las tareas del sistema operativo y Ansible.
*   **WebSockets**: Implementa `socket.io` en el servidor HTTP para transmitir a los clientes (Frontend) las ejecuciones en tiempo real de los playbooks.
*   **Persistencia Síncrona**: Base de datos **SQLite** usando la librería `better-sqlite3`. Esto garantiza que, incluso bajo una gran presión de logs por stdout/stderr, las inserciones en la base de datos se hacen de manera segura y ordenada antes de ser transmitidas.

## Comandos de Desarrollo

Para iniciar el backend en modo desarrollo, desde la raíz del monorepo ejecuta:

```bash
node backend/server.js
```

El servidor REST y de WebSockets estará disponible en `http://localhost:3000/`.

## Requisitos del Sistema

Para el correcto funcionamiento del módulo `ansibleRunner.js`, el sistema host debe tener instalado:
*   `ansible`
*   `sshpass`

> Nota: La imagen de Docker automatiza estas dependencias. Para más detalles técnicos sobre el funcionamiento de los logs, consulta el `manual_tecnico.md` en la raíz del repositorio.
