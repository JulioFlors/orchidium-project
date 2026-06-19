# Lista de Tareas: Ajuste de Modales Responsivos y Rediseño de QuickActionCard

## Fase 1: Modales Responsivos

- [x] Modificar `PestSightingModal.tsx` para integrar los botones en el children (quitar `footer` e `icon`), cambiar grid a responsivo y setear `size="md"`.
- [x] Modificar `FloweringModal.tsx` para integrar los botones en el children (quitar `footer` e `icon`), cambiar grid a responsivo y setear `size="md"`.

## Fase 2: Rediseño de Tarjetas (Descartado/Restaurado)

- [ ] Modificar `QuickActionCard.tsx` aplicando la Propuesta 2 (Hero Action Layout): badge "Pristino Engine" arriba, botón de acción explícito abajo con icono ChevronRight y microanimación hover. (Descartado)
- [ ] Actualizar `QuickActionsGrid.tsx` para pasar la nueva prop `actionLabel`. (Descartado)

## Fase 3: Validación y Limpieza

- [x] Ejecutar `pnpm lint` en la carpeta `app` — sin errores en archivos modificados.
- [x] Registrar los cambios en `commit.txt`.
