# 📖 Runbox: Manual de Usuario

¡Bienvenido a **Runbox**! Tu interfaz gráfica moderna y ligera para la orquestación y automatización de infraestructuras IT mediante Ansible.

Runbox está diseñado para simplificar las ejecuciones de los *Playbooks* de Ansible (archivos YAML con tareas de automatización) sin necesidad de tener conocimientos avanzados en la línea de comandos de Linux.

> [!NOTE]
> **Credenciales de Acceso (Pruebas Locales):**
> Para acceder al portal, utiliza el usuario `administrator` y la contraseña `Usuario1.`

Destaca por ofrecer una experiencia visual **Premium y Moderna** (basada en el diseño de **Material Design 3**, modo claro/oscuro dinámico y componentes altamente responsivos), garantizando además la máxima seguridad (por ejemplo, impidiendo volver atrás al Login una vez iniciada la sesión).

---

## 🔐 Seguridad y Roles de Usuario (RBAC)

Runbox es una plataforma multiusuario que implementa un modelo de Control de Acceso Basado en Roles (RBAC). Dependiendo de tu usuario, verás una interfaz adaptada a tus permisos:

* **Administrador (`admin`):** Tiene privilegios completos sobre toda la plataforma. Es el único que ve la pestaña de "Usuarios" en el menú, y puede crear, editar y eliminar infraestructuras (Organizaciones, Inventarios, Hosts) y ejecutar cualquier Playbook.
* **Usuario Estándar (`user`):** Tiene una vista limpia y acotada. Sólo podrá visualizar y ejecutar Playbooks, e inspeccionar Inventarios que pertenezcan a las **Organizaciones que le hayan sido asignadas** por el administrador. No verá botones de creación o borrado de infraestructura para evitar accidentes.

---

## 🏢 Arquitectura y Jerarquía de Inventarios

Runbox utiliza un modelo jerárquico para organizar la infraestructura de forma clara:

1. **Organización:** El contenedor principal. Por ejemplo, departamentos como *Ventas* o *RRHH*.
2. **Inventario:** El entorno de trabajo asociado a una organización (Ej. *Datacenter Producción*).
3. **Grupos y Hosts:** Los equipos individuales agrupados lógicamente, que pueden contener variables de entorno o conexión.

*(Nota: Puedes encontrar más detalles técnicos sobre esta estructura en el [Manual Técnico](./manual_tecnico.md) y en el [README](./README.md)).*

---

## 🚀 Requisitos Previos e Inicialización

Para utilizar la herramienta, asegúrate de que Runbox esté en ejecución. El administrador del sistema puede proporcionarte una URL de acceso. 
Si lo ejecutas localmente, necesitarás tener instalado **Docker** y **Node.js**.

Para arrancar el ecosistema completo en tu máquina de desarrollo, simplemente abre una terminal en la raíz del proyecto y ejecuta:

```bash
./start.sh
```

Esto levantará tanto la base de datos como los servidores locales. Cuando termines de trabajar, puedes presionar `Ctrl + C` en esa misma terminal o ejecutar en otra ventana:

```bash
./stop.sh
```

---

## 🌐 Uso de la Aplicación Web

### 1. Navegación Principal
Al entrar a Runbox, verás un menú lateral con las principales opciones. Por defecto, aterrizarás en el **Dashboard** principal, donde tendrás una vista panorámica (métricas y gráficas) del estado de tu infraestructura y los últimos trabajos (Jobs) lanzados. Desde el menú lateral podrás acceder a Playbooks, Inventarios, Organizaciones (si tienes permisos) y Usuarios (solo Administradores).

### 2. Ejecución de un Playbook
1. Ve a la sección **Playbooks** en el menú lateral.
2. Verás tarjetas (Cards) listando todas las automatizaciones disponibles (ej. *Dummy Playbook (Test)*, *Actualizar Servidores Web*).
3. Haz clic en el botón de "Play" (Run) de color azul en la tarjeta deseada.
4. El sistema creará un **Trabajo (Job)** y te redirigirá automáticamente a la pantalla de la consola.

### 3. Creación de Playbooks desde Git (GitOps)
Además de los playbooks locales, los administradores pueden añadir playbooks alojados en repositorios Git externos.
1. En la vista de **Playbooks**, pulsa sobre **New Playbook**.
2. Rellena los datos básicos (Nombre, Inventario) y en el apartado de contenido, selecciona el tipo **Git Repository**.
3. Deberás introducir:
   * **URL del repositorio:** (Ej. `https://github.com/usuario/repo.git`)
   * **Rama (Branch):** (Ej. `main` o `master`)
   * **Archivo Playbook:** La ruta dentro del repositorio del archivo YAML (Ej. `playbooks/deploy.yaml`).
4. Al ejecutarse, Runbox clonará este código, lanzará la automatización y luego eliminará los archivos residuales.

### 4. Visualización en Tiempo Real (Consola)
Una vez en la vista de *Job Detail*, observarás una terminal negra clásica.
- No necesitas recargar la página; verás el texto aparecer línea a línea, tal y como si estuvieras delante del servidor de forma nativa.
- El sistema captura y te muestra tanto los procesos exitosos de Ansible como los posibles errores.
- Verás un botón (Badge) en la parte superior que indica el estado del Job: `En ejecución`, `Completado` o `Fallido`.

### 5. Consultar Ejecuciones Pasadas
Si te vas de la pantalla o cierras la pestaña por error, no te preocupes. Todo el progreso queda guardado en la base de datos de manera persistente. Si vuelves a ingresar a la URL del trabajo, el log histórico se cargará inmediatamente desde donde se quedó.
