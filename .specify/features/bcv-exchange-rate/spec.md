# Feature Specification: Tasa de Cambio BCV (bcv-exchange-rate)

**Feature Branch**: `Dev`

**Created**: 2026-06-18

**Status**: Draft

**Input**: User description: "Obtener cada día el valor del dólar oficial para el día vigente desde la página bcv.org.ve para implementar un toggle que cambie la moneda de la tienda para visualizar dólares o bolívares."

## User Scenarios & Testing

### User Story 1 - Sincronización Automática de Tasa BCV (Priority: P1)

El sistema debe obtener diariamente el tipo de cambio oficial del dólar estadounidense (USD) a bolívares (VES) desde el sitio del Banco Central de Venezuela (https://www.bcv.org.ve/). La sincronización debe ejecutarse de forma automática a las 8:30 PM (hora Caracas). Si el valor del día siguiente no se encuentra publicado aún o la petición falla, se reintentará cada hora hasta obtenerlo con éxito. El registro histórico se guardará en la base de datos.

**Why this priority**: Es el fundamento técnico. Sin la tasa guardada en el backend, no se puede realizar la conversión ni la visualización en la tienda.

**Independent Test**: Ejecutar el cron job o un script manual de prueba. Verificar que se haga la petición HTTP a BCV, se extraiga el valor correcto (ej. 602.33) y la fecha de vigencia asociada, y se almacene en la base de datos.

**Acceptance Scenarios**:

1. **Given** que el planificador (scheduler) ejecuta la tarea diaria a las 8:30 PM, **When** la tasa del día siguiente está publicada y la petición es exitosa, **Then** el sistema almacena la tasa con su fecha valor y cesa los reintentos.
2. **Given** que la tasa del día siguiente no está publicada o hay error de red, **When** falla la obtención, **Then** el sistema reintenta la consulta cada hora y registra la advertencia en los logs.
3. **Given** que no se puede obtener una tasa actualizada por múltiples fallos continuos, **When** no existe una tasa válida para el día vigente, **Then** el frontend mostrará por defecto los precios en dólares y deshabilitará temporalmente la conversión a bolívares.

---

### User Story 2 - Toggle de Moneda en Tienda (Priority: P2)

El cliente de la tienda debe poder alternar mediante un botón (toggle) ubicado en el menú lateral (Sidebar), justo debajo del control de tema claro/oscuro (ThemeToggle), siguiendo su mismo diseño. La preferencia de moneda elegida por el usuario debe persistir en su navegador (Local Storage).

**Why this priority**: Permite al usuario final cambiar dinámicamente la experiencia visual de precios de la tienda.

**Independent Test**: Hacer click en el selector de moneda "USD / Bs.", verificar que cambie el estado en el cliente y que el valor seleccionado persista tras refrescar la página.

**Acceptance Scenarios**:

1. **Given** que el usuario no ha seleccionado ninguna moneda, **When** visita la tienda por primera vez, **Then** la moneda por defecto debe ser USD.
2. **Given** que el usuario cambia la moneda a VES (Bs.), **When** se recarga la página, **Then** el selector debe mantenerse en VES y mostrar los precios en bolívares.

---

### User Story 3 - Conversión Dinámica de Precios (Priority: P3)

El sistema debe convertir los precios de los productos en tiempo real basándose en la tasa de cambio vigente guardada para la fecha actual de Caracas (es decir, tasa con `date <= hoy` ordenado por fecha desc). La conversión debe reflejarse en:
- El catálogo de productos (Product Grid).
- El detalle del producto (AddToCart).
- El carrito de compras (CartView).
- La gestión de pedidos y checkout.

**Why this priority**: Asegura que todo el embudo de compras de la tienda refleje consistentemente la moneda elegida.

**Independent Test**: Seleccionar VES, verificar que una planta de $35 muestre su precio en bolívares basado en la tasa oficial vigente para el día de hoy (ej. $35 * 602.33 = Bs. 21,081.55).

**Acceptance Scenarios**:

1. **Given** la moneda seleccionada es VES, **When** el usuario visualiza los productos en el catálogo, **Then** los precios deben formatearse con el símbolo `Bs.` y usar separadores numéricos adecuados (`es-VE`).
2. **Given** la moneda seleccionada es USD, **When** el usuario realiza la visualización, **Then** los precios deben mostrarse en el formato original en dólares con el símbolo `$`.

### Edge Cases

- **Tasa BCV Desactualizada el Fin de Semana**: BCV no actualiza tasas los sábados y domingos; el viernes emite la tasa del lunes. El sistema debe poder usar la tasa vigente disponible para el día en curso.
- **Error Crítico de Conexión (Fallback)**: Si el scraper falla por bloqueo de IP o cambios en la página de BCV, el sistema debe usar una tasa por defecto de respaldo (hardcoded o la última conocida en DB) y alertar al administrador a través de logs.

## Requirements

### Functional Requirements

- **FR-001**: Crear modelo de base de datos `ExchangeRate` en Prisma para registrar las tasas diarias oficiales de BCV.
- **FR-002**: Implementar una tarea programada (cron) en el servicio `scheduler` que se ejecute a las 8:30 PM (hora Caracas, UTC-4) para obtener la tasa vigente del día siguiente. Si falla o no está publicada, reintentar cada hora.

- **FR-003**: Implementar un scraper resiliente en Node/TypeScript que consuma `https://www.bcv.org.ve/`, maneje bypass de SSL si es necesario, y extraiga la tasa oficial usando expresiones regulares seguras.
- **FR-004**: Crear un endpoint de API o Server Action `/api/exchange-rate` para proveer la tasa vigente actual (`date <= hoy` ordenado desc) de la tienda.
- **FR-005**: Crear un estado global en el frontend (ej. Zustand o Context) para gestionar la moneda activa y guardar la selección en Local Storage.
- **FR-006**: Modificar los componentes visuales de precios (`ProductGridItem`, `AddToCart`, `CartView`) para calcular y formatear los precios según la moneda activa.

### Key Entities

- **ExchangeRate**: Registro histórico de tasas del BCV.
  - `id`: UUID.
  - `rate`: Decimal/Float (ej: 602.33240000).
  - `currency`: String (por defecto "USD").
  - `date`: DateTime (fecha valor de la tasa).
  - `createdAt`: DateTime.
  - `updatedAt`: DateTime.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Sincronización automática diaria sin intervención humana con reintentos horarios si es necesario.
- **SC-002**: Conversión instantánea de precios en el frontend (< 50ms al cambiar el toggle).
- **SC-003**: Cero interrupción del sitio de la tienda si falla la conexión con BCV (uso del fallback).

