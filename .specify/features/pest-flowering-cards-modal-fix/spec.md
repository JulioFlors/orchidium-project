# Especificación: Ajuste de Modales Responsivos

## Contexto
Los modales de avistamiento de plagas (`PestSightingModal.tsx`) y registro de floración (`FloweringModal.tsx`) presentan problemas de adaptabilidad en dispositivos móviles (pantallas pequeñas y con teclado en pantalla abierto), a diferencia de otros modales operativos del sistema.

## Problemas Identificados en Modales
1. **Footer Fijo**: Uso de la prop `footer` en `<Modal>` fija el pie del modal, limitando la altura útil del cuerpo (`max-h-[70vh]`) y causando colisiones en móviles con teclado virtual abierto.
2. **Tamaño no Óptimo**: Uso de tamaño `lg` por defecto en lugar de `md` que es más compacto.
3. **Grid Rígido**: Grid de 2 columnas (`grid-cols-2`) sin breakpoints responsivos, apretando controles en pantallas angostas.
4. **Comportamiento del Dropdown**: Los selectores `SelectDropdown` absolutos colisionan con el contenedor de scroll del modal.

## Requerimientos
1. Modificar `PestSightingModal` y `FloweringModal` para no usar la prop `footer` de `Modal` (o adaptarla), integrando los botones dentro del children/formulario para un scroll natural.
2. Cambiar tamaño a `size="md"`.
3. Hacer que las cuadrículas internas usen clases responsivas (`grid-cols-1 sm:grid-cols-2`).

