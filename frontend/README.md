# Runbox Frontend (Angular)

Este es el directorio del frontend de **Runbox**, construido con **Angular 22** y **Angular Material**.

## Características Principales

*   **Arquitectura Moderna**: Uso de Standalone Components (sin `NgModules`).
*   **Diseño**: Implementado utilizando componentes puramente de Material Design.
*   **Terminal en Tiempo Real**: Uso de `xterm.js` con el aditamento `fit-addon`. Control de repintado optimizado a través de `requestAnimationFrame`.
*   **Comunicación Websocket**: Se utiliza la librería `socket.io-client` para la recepción de streamings de `stdout` y `stderr` provenientes del orquestador Ansible.

## Comandos de Desarrollo

Para iniciar el servidor de desarrollo, desde la raíz del monorepo ejecuta:

```bash
npm run start --workspace=frontend
```

La aplicación estará disponible en `http://localhost:4200/`. Cualquier cambio en el código recargará automáticamente la aplicación.

## Estructura de Directorios

*   `src/app/core/`: Componentes estructurales (Sidenav, Toolbar) y servicios inyectables (Socket, Playbooks).
*   `src/app/components/`: Componentes reutilizables de UI (Terminal, Tarjetas, Badges).
*   `src/app/pages/`: Vistas completas que son manejadas por el Router de Angular.

> Nota: Consulta el `manual_tecnico.md` en la raíz del repositorio para obtener más información sobre el flujo de datos y la arquitectura global.
