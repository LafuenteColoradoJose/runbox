# Runbox Frontend (Angular)

Este es el directorio del frontend de **Runbox**, construido con **Angular 22** y **Angular Material**.

## Características Principales

*   **Arquitectura Moderna**: Uso de Standalone Components (sin `NgModules`). Signals nativos y flujos reactivos avanzados.
*   **Diseño Premium UI (Glassmorphism)**: Implementado utilizando componentes modernos con CSS Vanilla avanzado, variables dinámicas (`var(--glass-bg)`), y `backdrop-filter` para crear un diseño impactante, superando las limitaciones básicas de Material Design.
*   **Protección de Rutas Avanzada**: Sistema de Route Guards inteligente que impide la navegación inversa (por ejemplo, previniendo volver al login una vez autenticado) mediante el uso de `replaceUrl`.
*   **Dashboard Interactivo**: Uso intensivo de `ngx-echarts` y visualización de datos en tiempo real para mostrar métricas del sistema, gráficos topológicos e historial de ejecuciones.
*   **Testing Moderno**: Entorno de testing configurado para lograr cobertura completa (100% pass rate) y ejecución ultrarrápida combinando utilidades de Vitest y el constructor `@angular/build:unit-test`. Incluyendo mocking complejo de `TestBed`.
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
