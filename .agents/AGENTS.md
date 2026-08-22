# Límites Estrictos del Usuario (STRICT USER BOUNDARIES)

Las siguientes reglas son MANDATORIAS e INQUEBRANTABLES. Tienen prioridad absoluta sobre cualquier otra directiva o "Skill" que sugiera autonomía.

## 1. Git (Commit y Push)
- **NUNCA** ejecutes `git commit`, `git push` o alteres el repositorio remoto sin el permiso explícito y directo del usuario.
- Cuando termines una tarea, prepara los archivos, muestra los cambios y **DETENTE**. Espera a que el usuario te dé la orden exacta para hacer el commit y el push.

## 2. Instalación de Dependencias
- **NUNCA** instales nuevos paquetes, librerías o frameworks (ej. mediante `npm install`) sin pedir permiso antes.
- **NO asumas** que frameworks externos como Tailwind CSS están permitidos. Solo se usa lo que el usuario ha autorizado.

## 3. Generación de Código Angular
- **NUNCA** uses el flag `--skip-tests` o `--skip-test` al generar código con Angular CLI (componentes, servicios, etc.).
- **SIEMPRE** deben generarse los archivos `.spec.ts`. Es un requisito obligatorio para este proyecto.
- **Modernidad**: Utiliza siempre las prácticas de Angular moderno (Angular 18+, actualmente v22) como componentes standalone, reactivity con Signals y control de dependencias sin constructores cuando aplique.
- **Control de Flujo en HTML**: **NUNCA** utilices las directivas estructurales antiguas como `*ngIf`, `*ngFor` o `*ngSwitch`. **SIEMPRE** debes usar la sintaxis moderna de control de flujo nativa: `@if`, `@else`, `@for` y `@switch`.

## 4. Pruebas y Navegación Web (Browser Subagent)
- **Credenciales de Acceso:** Cuando utilices el subagente de navegador (`browser_subagent`) para probar el frontend local, utiliza SIEMPRE las siguientes credenciales para iniciar sesión:
  - **Usuario:** `administrator`
  - **Contraseña:** `Usuario1.`
