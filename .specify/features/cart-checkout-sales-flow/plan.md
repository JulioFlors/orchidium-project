# Plan de Arquitectura: Checkout Único Progresivo, Ventas Admin, UI Fixes y Protocolo Prisma

## 1. Protocolo Estricto de Base de Datos (Biblia Prisma - Pristinoplant)
1. **PROHIBIDO `db push`**: Todos los cambios se formalizarán mediante archivos de migración `.sql` inmutables en `packages/database/prisma/migrations/`.
2. **Generación con Flag `-o` (Evitar UTF-16/BOM)**:
   - Se utilizará la opción `-o` para evitar la corruptela de bytes NUL (UTF-16/BOM) producida por la redirección `>` de PowerShell:
     `pnpm --filter @package/database prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script -o prisma/migrations/<timestamp>_add_cart_checkout_sales_models/migration.sql`
   - O en su defecto, la secuencia oficial de generación de migraciones del proyecto: `pnpm --filter @package/database prisma migrate dev --name add_cart_checkout_sales_models --create-only`.
3. **Revisión Manual del SQL**: Verificar que el script generado no contenga sentencias `DROP` destructivas sobre tablas existentes (`Plant`, `Species`, `User`, etc.).
4. **Despliegue Limpio**: Aplicación con `pnpm --filter @package/database prisma migrate deploy`.

## 2. Ajustes UI y Correcciones en Carrito (`CartView.tsx`)
- **Imágenes R2**: Conectar `getImageUrl` sobre `species.images` y fallback seguro para variantes.
- **Selector de Cantidad Real**: Limitar la cantidad máxima seleccionable en `QuantityDropdown` según `variant.quantity` en DB.
- **Tasa BCV Real**: Cargar la tasa vigente desde `ExchangeRate` y mostrar `Tasa referencial del BCV: Bs. XX.XX / USD`.
- **Layout Responsivo VES**: Rediseñar la columna de precios e ítems del carrito con un ancho flexible/mayor (ej. `min-w-[120px]` o alineación flex-col/row adaptativa) para que las cifras elevadas en Bolívares se muestren en una sola línea sin desbordes.

## 3. Arquitectura de Estado Frontend (Zustand Stores)
- **`useCartStore`**: Gestiona el carrito de compras e-commerce (variantes, cantidades, subtotal).
- **`useCheckoutStore`**: Zustand store para el checkout progresivo en `/checkout`.
  - `currentStep`: `1 | 2`.
  - `selectedAddressId`: string | null.
  - `shippingAddressData`: FormState (nombre, cédula/RIF, dirección, ciudad, estado, teléfono).
  - `billingInfoData`: FormState (misma dirección o datos de facturación explícitos).
  - `paymentMethod`: `PAGO_MOVIL | ZELLE | BANESCO_PANAMA | TRANSFERENCIA_VES | EFECTIVO_DIVISAS`.
  - Métodos: `setStep(step)`, `setAddressData()`, `setBillingData()`, `setPaymentMethod()`, `resetCheckout()`.
- **`useAdminSaleStore`**: Carrito de ventas POS para el administrador.
  - Permite acumular variantes y ejemplares físicos específicos (`PlantInstance` ID) antes de procesar una venta directa múltiple.

## 4. Esquema de Base de Datos (`schema.prisma`)
- `UserAddress`, `Order`, `OrderItem`, `SaleRecord`.
- Enums: `OrderStatus`, `PaymentMethod`, `SaleType`, `PlantStatus` (+`RESERVED`, `SOLD`).

## 5. Rutas y Vistas
- **Ruta Única `/checkout`**:
  - `CheckoutView.tsx`: Renderiza dinámicamente `CheckoutStep1Form` o `CheckoutStep2Summary` según `checkoutStore.currentStep`.
  - Transición fluida con animaciones micro (GSAP / Framer Motion).
- **Ruta `/checkout/order/[id]`**:
  - Detalle de pago, instrucciones bancarias, tasa BCV y enlace a WhatsApp.
- **Ruta `/admin/sales`**:
  - Carrito POS admin para registro de ventas directas múltiples asociando ejemplares físicos (`PlantInstance`).
- **Ruta `/stock/[id]`**:
  - ActionMenu en `PlantInstanceCard`: "Registrar Venta Directa" + "Añadir a Carrito Admin".

## 6. Server Actions
- `address-actions.ts`: CRUD de direcciones.
- `order-actions.ts`: `createOrder` (Paso 2 → Orden + Reserva stock), `confirmOrderPayment`, `cancelOrder`.
- `sales-actions.ts`: `createBulkAdminSale` (venta carrito POS admin), `registerSinglePlantSale`.
