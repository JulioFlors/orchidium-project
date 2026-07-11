# Tasks: Catálogo Unificado (unified-catalog)

Checklist de tareas de micro-gerencia para implementar la feature de catálogo consolidado en la ruta `/catalog`.

## Fase 1: Creación de la Estructura de Rutas 🗺️
- [ ] **Crear la Carpeta `/catalog`**:
  - [ ] Añadir `app/src/app/(orchidarium)/(inventory)/catalog/page.tsx` para el panel consolidado.
  - [ ] Añadir `app/src/app/(orchidarium)/(inventory)/catalog/[id]/page.tsx` para la edición de especies.
- [ ] **Redirección de Rutas Obsoletas**:
  - [ ] Configurar Next.js para redirigir peticiones de `/genus` y `/species` hacia `/catalog`.
  - [ ] Actualizar enlaces en `routes.tsx` y en el sidebar del administrador.

## Fase 2: Cabecera Dinámica y Responsividad 🎨
- [ ] **Cabecera de Tarjetas**:
  - [ ] Implementar la rejilla de `EnvironmentCard` en la nueva página `/catalog`.
  - [ ] Configurar las clases responsivas en Tailwind para que la tercera tarjeta (`Especies`) ocupe `col-span-2` en pantallas medianas (`md`) y vuelva a `col-span-1` en pantallas grandes (`lg`).
  - [ ] Obtener métricas dinámicas en el servidor (cantidades de tipos, géneros y especies) y pasarlas como props.

## Fase 3: Integración de Menús de Acción y Reglas de Seguridad 🔒
- [ ] **ActionMenu en Títulos**:
  - [ ] Integrar el componente `ActionMenu` junto al título del Género en la lista inferior de especies.
- [ ] **Lógica de Protección en Server Actions**:
  - [ ] Modificar `deleteGenus` para denegar el borrado si tiene especies asociadas (`_count.species > 0`).
  - [ ] Modificar `deleteSpecies` para denegar el borrado si tiene plantas físicas asociadas (`_count.plants > 0`).
  - [ ] Limitar `updateGenus` para que solo actualice el campo `name`.
- [ ] **Gestión de Errores en UI**:
  - [ ] Implementar toasts que muestren mensajes de error descriptivos al intentar eliminar elementos bloqueados.

## Fase 4: Interfaz de Edición de Especie WYSIWYG `/catalog/[id]` 🌸
- [ ] **Clonar Interfaz de Producto**:
  - [ ] Crear el componente `CatalogProductEdit.tsx` copiando visualmente la estructura de la página comercial de producto (`ProductClientWrapper.tsx`).
  - [ ] Implementar campos de edición en caliente (inputs de texto para el título, textareas estilizados para descripción botánica).
  - [ ] Integrar el gestor de imágenes de R2 para que el administrador pueda subir/eliminar las fotos directamente y ver cómo se visualizan en la galería de fotos.

## Fase 5: Aseguramiento de Calidad 🧪
- [ ] Validar que al cambiar información de una especie en `/catalog/[id]`, los cambios se reflejen de inmediato al visitar su respectiva página comercial.
- [ ] Intentar borrar un Género con especies y una Especie con plantas para comprobar los bloqueos de seguridad.
- [ ] Correr `pnpm lint` y `pnpm build` para asegurar la entrega sin errores de código.
