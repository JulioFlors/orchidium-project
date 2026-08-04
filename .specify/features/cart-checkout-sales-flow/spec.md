# Especificación de Funcionalidad: Carrito, Facturación, Reserva de Stock y Registro de Ventas

## 1. Visión General
Implementación completa del flujo e-commerce y punto de venta administrativo de Pristinoplant:
- **Checkout Único Progresivo (`/checkout`)**: Experiencia en una única ruta gestionada mediante `useCheckoutStore` (Zustand), permitiendo avanzar/retroceder entre Paso 1 y Paso 2 sin perder estado.
- **Correcciones UI & Integración R2 en Carrito**:
  - Imágenes sincronizadas desde Cloudflare R2 usando utilidades centralizadas (`getImageUrl`).
  - `QuantityDropdown` conectado al stock real disponible por variante (`quantity` en DB).
  - Resumen del pedido con Tasa BCV real dinamizada (`ExchangeRate`).
  - Ajuste de layout responsivo para precios en Bolívares (VES), ampliando el contenedor lateral para evitar rupturas de línea.
- **Gestión de Direcciones de Usuario**: CRUD de direcciones guardadas + selección activa.
- **Reserva de Stock**: Congelamiento de stock al confirmar Paso 2 mientras se verifica el pago.
- **Historial de Compras (`/account/orders`)**: Ficha de pedidos y estados para el cliente.
- **Panel Admin de Pedidos (`/admin/orders`)**: Validación/Aprobación de pagos y cancelación con liberación de reserva.
- **Carrito de Ventas Admin / POS (`/admin/sales` & `/stock/[id]`)**: Carrito administrativo para venta masiva directa, permitiendo elegir variantes y ejemplares físicos específicos (`PlantInstance`), además del botón individual "Registrar Venta" en Gemelo Digital.

## 2. Modelos de Datos (Prisma)
- **UserAddress**: Direcciones del usuario (Cédula/RIF, teléfono, dirección, ciudad, estado, zipCode, isDefault).
- **Order**: Órdenes con `#ORD-XXXX`, estado (`PENDING_PAYMENT`, `PAYMENT_VERIFYING`, `PAID`, `DISPATCHED`, `CANCELLED`), método de pago, subtotales USD/VES, tasa BCV, snapshot de dirección y facturación.
- **OrderItem**: Ítems de la orden asociados a `ProductVariant` y opcionalmente a `Plant` física.
- **SaleRecord**: Registro contable de ventas (Online u Offline/POS admin).
- **PlantStatus**: Estados `RESERVED`, `SOLD` añadidos a `PlantStatus`.

## 3. Flujo Cliente (Storefront Checkout Único & Carrito UI)
1. **Carrito Storefront (`CartView.tsx` & `useCartStore`)**:
   - Renderizado dinámico de imágenes R2 (`getImageUrl`).
   - Selector de cantidad limitado al max stock real de la variante.
   - Formato multimoneda USD/VES holgado para montos de varios dígitos.
   - Muestra explícita de Tasa BCV vigente en el resumen del pedido.
2. **Ruta Única `/checkout` (Zustand `useCheckoutStore`)**:
   - **Step 1 (Datos & Pago)**: Selección/edición de dirección de envío, datos de facturación, método de pago. Botón "Continuar al Resumen".
   - **Step 2 (Resumen & Confirmación)**: Vista previa con montos en USD/VES (Tasa BCV real), desglose de ítems. Botón "Confirmar Pedido".
   - **Navegación Fluida**: Botón "Volver al Paso 1" preserva todos los campos ingresados sin recargar ni perder datos.
3. **Ficha de Pago / Orden Creada (`/checkout/order/[id]`)**:
   - Reserva de stock activada.
   - Datos bancarios según método elegido (Pago Móvil, Zelle, Banesco Panamá, etc.).
   - Botón directo de WhatsApp con mensaje precargado (`#ORD-XXXX` + comprobante).
4. **Mi Cuenta (`/account/orders` y `/account/addresses`)**:
   - CRUD de direcciones y consulta de estado de pedidos.

## 4. Flujo Admin y Carrito de Ventas Manuales
1. **Carrito Admin / POS (`/admin/sales/new`)**:
   - Carrito multicondición para seleccionar múltiples variantes y asignación de ejemplares físicos específicos (`PlantInstance` por ID).
   - Generación de `SaleRecord` y pase automático de ejemplares a `SOLD`.
2. **Gemelo Digital (`/stock/[id]`)**:
   - Item "Registrar Venta" en `ActionMenu` de `PlantInstanceCard` (pasa planta a `SOLD` y crea `SaleRecord`).
   - Opción "Añadir a Carrito de Venta Admin" para agrupar ejemplares físicos antes de cerrar la venta masiva.
3. **Gestión de Órdenes Web (`/admin/orders`)**:
   - Aprobación de pago (marca `PAID` y descuenta stock definitivo).
   - Rechazo/Cancelación (marca `CANCELLED` y libera stock reservado).
