# Feature Specification: Landing Page Estilo Tesla (shop-landing-page)

**Feature Branch**: `Dev`

**Created**: 2026-06-18

**Status**: Draft

**Input**: User description: "Diseñar un landing page para la ruta principal de la tienda estilo Tesla, con lógica de floración activa y plantas destacadas (más vendidos)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Experiencia Snap Scroll y Hero (Priority: P1)

El usuario entra a la ruta principal de la tienda (`/`) y es recibido por secciones de pantalla completa con desplazamiento magnético (Scroll Snapping). El Header es transparente al inicio, pero si hace hover o scroll recupera su fondo y blur. Cada sección muestra un fondo de alta definición, textos superiores y CTAs gemelos inferiores.

**Why this priority**: Es la primera impresión y define la experiencia de interacción central inspirada en Tesla.

**Independent Test**: Visitar la ruta `/`, validar que el scroll se alinee magnéticamente al borde de cada sección. Verificar que el Header sea transparente en el Hero 1 y se difumine al hacer hover sobre él o al hacer scroll hacia abajo.

**Acceptance Scenarios**:

1. **Given** un usuario en la parte superior del Hero 1, **When** hace hover en el Header transparente, **Then** el Header adquiere un fondo semi-translúcido para legibilidad.
2. **Given** un usuario que hace scroll hacia abajo, **When** pasa el umbral de 20px, **Then** el Header se vuelve fijo (sticky) y adquiere su fondo sólido por defecto.
3. **Given** la interacción de desplazamiento, **When** el usuario realiza scroll manual, **Then** el navegador ajusta de forma magnética el inicio de cada sección a la pantalla completa (`snap-y`).

---

### User Story 2 - Productos Destacados por Criterio Comercial (Priority: P2)

El usuario navega por las secciones finales y encuentra dos cuadrículas de productos dedicadas: **"Floración Activa"** (especies con plantas disponibles en floración real) y **"Los más vendidos"** (especies destacadas por el administrador).

**Why this priority**: Evita mostrar productos de forma aleatoria, organizando la tienda de acuerdo al estado real del invernadero y la estrategia comercial del orquideario.

**Independent Test**: Registrar una floración en el administrador y comprobar que aparezca dinámicamente en la sección "Floración Activa". Activar el destacado de una especie y verificar que aparezca en "Los más vendidos".

**Acceptance Scenarios**:

1. **Given** el catálogo de especies, **When** el administrador marca una especie como destacada, **Then** esta especie aparece en la sección "Los más vendidos" de la landing page.
2. **Given** el estado biológico del orquideario, **When** una planta está en floración activa, **Then** su especie correspondiente aparece dinámicamente en la sección "Floración Activa".

---

### User Story 3 - Gestión de Especies Destacadas (Priority: P3)

El administrador de la tienda entra a `/shop-manager` y puede marcar o desmarcar el toggle de "Destacado" para cada especie. Esta acción actualiza de inmediato el campo en base de datos.

**Why this priority**: Habilita al administrador a curar la sección de "Los más vendidos" (máximo 9 plantas).

**Independent Test**: Visitar `/shop-manager`, hacer click en el switch/checkbox de destacado y refrescar la base de datos para validar el estado del campo.

**Acceptance Scenarios**:

1. **Given** la lista de gestión de la tienda, **When** el administrador activa el toggle de destacado en una especie, **Then** el valor de `isFeatured` cambia a `true` en la base de datos y se refresca el frontend.

### Edge Cases

- **Sin plantas en Floración**: Si no hay ninguna especie en floración activa en el invernadero, la sección "Floración Activa" no debe renderizarse en absoluto para evitar una rejilla vacía.
- **Exceso de Destacadas**: Si el administrador marca más de 9 especies como destacadas, la landing page solo debe renderizar las 9 más recientes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La ruta raíz `/` de la tienda debe cargar la landing page estilo Tesla que fluye a nivel de ventana de forma natural (se descartó Scroll Snapping por usabilidad con el Footer).
- **FR-002**: El Header debe alternar sus clases CSS de transparencia y hover basándose en el estado de scroll (`scrollY > 20`) y de hover (`isHeaderHovered`).
- **FR-003**: Se definió `isFeatured` como opcional (default false) en los tipos del frontend.
- **FR-004**: Se implementó el componente reutilizable `TeslaSection` con soporte responsivo y un único botón de acción blanco traslúcido.
- **FR-005**: La sección "Floración Activa" se calcula de manera dinámica filtrando especies que tengan plantas asociadas en estado `AVAILABLE` con un `FloweringEvent` donde `endDate` sea nulo.
- **FR-006**: La sección de gestión `/shop-manager` incluye la columna "Destacado" de forma visual, pero su actualización a base de datos está comentada temporalmente para evitar fallos de esquema en producción.

### Key Entities

- **Species**: Atributo opcional: `isFeatured` (Boolean).
- **FloweringEvent**: Atributo de cruce: `endDate` (DateTime, opcional).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Transición fluida del Header al hacer scroll o hover en la cabecera.
- **SC-002**: Cero saltos de layout en el Header al alternar transparencia.
- **SC-003**: Adaptabilidad impecable del color de textos y SearchBox del Header según el tema del sistema (Light/Dark Mode) en el estado transparente.

## Assumptions

- El Footer se renderiza de forma natural al final de la página.
- El campo `isFeatured` se migrará a base de datos en una fase posterior.
