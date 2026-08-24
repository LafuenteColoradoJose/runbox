# Runbox

**Runbox** es una plataforma de desarrollo interno (Internal Developer Platform - IDP) ligera que facilita y democratiza la ejecución de Infraestructura como Código (IaC). Permite organizar y operar entornos, automatizaciones y playbooks mediante un portal web intuitivo y de autoservicio.

Este proyecto ha sido desarrollado con una arquitectura robusta orientada a un entorno empresarial:
- **Backend:** Node.js, Express, Better-SQLite3, Vitest (Testing)
- **Frontend:** Angular 22, Material Design, ECharts (Topología y Dashboard de métricas), Vitest (Testing)

> [!NOTE]
> **Credenciales de Acceso (Pruebas Locales):**
> Para probar la aplicación, utiliza el usuario `administrator` y la contraseña `Usuario1.`

---

## 📚 Documentación

En este repositorio se encuentran los manuales completos del proyecto:

1. **[Manual de Usuario](./manual_de_usuario.md)**
   Toda la información orientada al usuario final, sobre cómo navegar, usar la interfaz, crear inventarios, organizaciones, etc.

2. **[Manual Técnico](./manual_tecnico.md)**
   Información profunda para desarrolladores, arquitectura del sistema, estructura de la base de datos, APIs y cómo compilar/ejecutar el proyecto localmente.

---

## 🏢 Arquitectura, Jerarquía y RBAC (Control de Acceso)

Runbox utiliza un modelo jerárquico estándar en la industria para organizar la infraestructura, diseñado intrínsecamente para un control de acceso granular basado en roles (RBAC):

1. **Organización:** El contenedor principal (Ej. departamentos como *Ventas* o *RRHH*).
2. **Inventario:** El entorno de trabajo aislado (Ej. *Datacenter Producción* o *Nube AWS*).
3. **Grupos y Hosts:** Los equipos individuales y las agrupaciones lógicas, los cuales pueden tener asociadas **Variables (JSON)** profesionales que hereda la infraestructura inferior.

### Control de Acceso (Roles)
* **Administrador (`admin`):** Tiene acceso global. Puede crear/editar/eliminar organizaciones, inventarios, hosts y usuarios. Puede ver y lanzar todos los Playbooks del sistema.
* **Usuario (`user`):** Tiene un acceso restringido. Sólo puede ver y operar sobre las **Organizaciones** que el administrador le haya asignado explícitamente. Consecuentemente, sólo puede lanzar Playbooks y visualizar inventarios pertenecientes a sus organizaciones, sin capacidad de alterarlos (solo lectura y ejecución).

---

## 🚀 Despliegue y Ejecución Rápida

El proyecto cuenta con scripts bash para facilitar su gestión local en modo demonio (usando `pm2`):

- **Arrancar el entorno de Desarrollo (Frontend + Backend):**
  ```bash
  ./start.sh
  ```
  *(Nota: Para ejecutarlo de forma local pura con este script, el host necesita tener instalado `ansible` y `sshpass`).*

- **Detener el entorno:**
  ```bash
  ./stop.sh
  ```

### 🐳 Despliegue en Producción (Docker)

Runbox está diseñado bajo una filosofía **"Plug & Play"** mediante contenedores. Gracias a su `Dockerfile`, **no necesitas instalar Ansible, Node.js ni bases de datos en tu servidor de producción**. El contenedor empaqueta su propio mini-sistema operativo con Ansible y la base de datos preinstalados. Sólo necesitas tener Docker y ejecutar:

```bash
docker build -t runbox .
docker run -d -p 3000:3000 --name runbox runbox:latest
```

---
*Desarrollado para demostrar capacidades avanzadas en arquitectura web y gestión de inventarios.*
