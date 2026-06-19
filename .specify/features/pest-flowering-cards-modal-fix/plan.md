# Plan de Implementación: Ajuste de Modales Responsivos

Ajuste de la adaptabilidad móvil de los modales de control botánico en el Orchidarium.

## Análisis de Causa Raíz (Modales)

1. **Footer Fijo (`footer` Prop)**:
   - `PestSightingModal.tsx` y `FloweringModal.tsx` usan la prop `footer` de `<Modal>`. Esto fija los botones al fondo del modal y limita el cuerpo del modal a `max-h-[70vh] overflow-y-auto`.
   - Cuando se abre el teclado móvil en formularios largos, el footer fijo reduce drásticamente el espacio útil, ocultando inputs y dropdowns.
   - En `ScheduleFormModal` y `FertigationModal`, los botones están integrados al final del children (dentro del flujo de scroll). Esto permite un comportamiento elástico y natural al abrir el teclado.

2. **Tamaño Grande (`size="lg"`)**:
   - Se usa el tamaño por defecto `lg` (512px) en lugar de `md` (448px). `md` es más compacto y se adapta mejor a pantallas medianas y móviles sin desperdiciar espacio.

3. **Controles en Grid Estático (`grid-cols-2`)**:
   - Los formularios dividen campos en grids fijos de 2 columnas sin breakpoints responsivos. En móviles pequeños, los selectores colisionan o truncan su contenido.

4. **Dropdowns con `overflow-y-auto`**:
   - `SelectDropdown` desplegado dentro del cuerpo del modal con scroll forzado colisiona con el scrollbar e interfiere con el footer fijo.
5. **Icono en Header**: Los headers de los modales no deben incluir iconos. Quitar prop `icon` de `<Modal>`.

---

## Cambios Propuestos

### Componentes de Modales

#### [MODIFY] [PestSightingModal.tsx](file:///c:/Dev/pristinoplant/app/src/app/(orchidarium)/orchidarium/ui/components/PestSightingModal.tsx)
- Quitar prop `icon` de `<Modal>` (sin iconos en header).
- Quitar prop `footer` de `<Modal>`.
- Mover los botones a un div de control al final del `children` (formulario), con bordes y espaciados correspondientes, imitando a `ScheduleFormModal`.
- Cambiar grid de Zona/Severidad de `grid-cols-2` a `grid-cols-1 sm:grid-cols-2`.
- Añadir prop `size="md"` a `<Modal>`.

#### [MODIFY] [FloweringModal.tsx](file:///c:/Dev/pristinoplant/app/src/app/(orchidarium)/orchidarium/ui/components/FloweringModal.tsx)
- Quitar prop `icon` de `<Modal>` (sin iconos en header).
- Quitar prop `footer` de `<Modal>`.
- Mover los botones al final del contenido del formulario.
- Cambiar grid de Zona/Filtro a `grid-cols-1 sm:grid-cols-2`.
- Añadir prop `size="md"` a `<Modal>`.

---

## Plan de Verificación

### Pruebas Manuales
- Abrir modales en vista responsiva móvil (Chrome DevTools, 375px/412px de ancho).
- Simular apertura del teclado enfocando campos de texto y notas, verificando que los botones de acción hagan scroll y no queden ocultos.
- Validar que `SelectDropdown` se despliegue y sea operable.
- Ejecutar `pnpm lint:fix` en la carpeta `app` para asegurar cumplimiento con estándares TypeScript/ESLint.
