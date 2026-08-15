# Lista de Tareas: Carrito, Checkout Único y Ventas Admin

- [x] **Fase 1: Modelo de Datos & Migraciones Prisma (Protocolo Biblia BD)**
  - [x] Añadir enums `OrderStatus`, `PaymentMethod`, `SaleType` a `schema.prisma`.
  - [x] Añadir `SOLD` y `RESERVED` a `PlantStatus`.
  - [x] Crear modelos `UserAddress`, `Order`, `OrderItem`, `SaleRecord` en `schema.prisma`.
  - [x] Generar migración SQL usando flag `-o` (UTF-8 sin BOM) o `prisma migrate dev --create-only`.
  - [x] Verificar script SQL (sin `DROP` accidental).
  - [x] Eliminar las columnas `quantity` y `available` redundantes de `ProductVariant` en `schema.prisma`, `seed-data.ts` y migración SQL dedicada.
  - [x] Aplicar migración con `prisma migrate deploy`.

- [x] **Fase 2: State Management & Correcciones UI Carrito (`CartView.tsx`)**
  - [x] Habilitar y tipar `useCartStore`.
  - [x] Conectar imágenes de productos en el carrito usando la utilidad `getImageUrl` (compatibilidad R2).
  - [x] Conectar `QuantityDropdown` con el stock real disponible en DB por variante.
  - [x] Mostrar el valor numérico de la Tasa BCV vigente en la card de resumen del pedido.
  - [x] Ampliar el espacio/layout de precios a la derecha para evitar rupturas de línea en cifras en Bolívares (VES).
  - [x] Crear `useCheckoutStore` (gestión de Step 1 / Step 2 y formulario persistente en `/checkout`).
  - [x] Crear `useAdminSaleStore` (carrito de ventas POS para administrador con asignación de `PlantInstance`).

- [x] **Fase 3: Server Actions**
  - [x] `address-actions.ts`: CRUD direcciones de usuario.
  - [x] `order-actions.ts`: Creación de orden con reserva de stock, consulta cliente/admin, aprobación/cancelación.
  - [x] `sales-actions.ts`: Registro de venta manual masiva (POS admin) y venta de planta individual desde Gemelo Digital.


- [ ] **Fase 4: Storefront (Ruta Única `/checkout` & Mi Cuenta)**
  - [ ] Implementar vista unificada `/checkout` con selector de Step 1 (Datos & Pago) y Step 2 (Resumen & Confirmación).
  - [ ] Construir `/checkout/order/[id]` (Instrucciones de pago, tasa BCV y enlace a WhatsApp).
  - [ ] Construir `/account/addresses` y `/account/orders`.

- [ ] **Fase 5: Carrito Admin POS & Gemelo Digital (`/stock`)**
  - [ ] Construir `/admin/orders` para aprobación/rechazo de pagos y envíos.
  - [ ] Construir Carrito POS Admin (`/admin/sales`) para selección de variantes y ejemplares físicos específicos (`PlantInstance`).
  - [ ] Actualizar `PlantInstanceCard` y `StockDetailView` (`/stock/[id]`) con opciones "Registrar Venta" y "Añadir a Carrito Admin".

- [ ] **Fase 6: Verificación & Linting**
  - [ ] Ejecutar `pnpm lint:fix`.
  - [ ] Pruebas E2E de navegación Step 1 ↔ Step 2 sin pérdida de estado.
