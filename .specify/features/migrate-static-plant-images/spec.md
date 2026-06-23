# Feature Specification: Migración de Imágenes Estáticas de Plantas (migrate-static-plant-images)

**Feature Branch**: `Dev`

**Created**: 2026-06-22

**Status**: Draft

**Input**: User request: "Analizar y reemplazar todas las instancias de las imágenes de plantas desde la carpeta public hacia instancias de R2."

## User Scenarios & Testing

### User Story 1 - Carga de imágenes en producción (Priority: P1)
El usuario entra a la landing page y navega por la tienda pública. Todas las imágenes (fondos de heros, categorías del sidebar e imágenes del submenú) se cargan correctamente sin errores 404, sirviéndose de forma directa y optimizada desde Cloudflare R2.

**Independent Test**:
1. Acceder a la ruta principal `/` y validar la presencia de los fondos de heros y categorías del sidebar.
2. Comprobar que en la consola de red (F12) no existan peticiones fallidas (404) hacia la ruta `/plants/...`.
3. Validar que los requests de imágenes botánicas se dirijan al dominio CDN de Cloudflare R2 (ej: `https://storage.sisparrow.com/plants/...`).

## Requirements

### Functional Requirements
- **FR-001**: Las imágenes del Hero (`TeslaSection`) y secciones de categorías (`CategoriesSection`) deben usar el helper `getImageUrl` para resolver dinámicamente sus rutas estáticas a Cloudflare R2.
- **FR-002**: El script de migración taxonómica de imágenes debe ser ampliado para detectar y subir de forma proactiva las imágenes locales fijas del landing page y sidebar a R2.
- **FR-003**: Se mantendrá la exclusión de `/app/public/plants` en `.vercelignore` para optimizar almacenamiento.

## Success Criteria
- **SC-001**: Cero errores 404 de recursos de imágenes de plantas en producción.
- **SC-002**: Tiempo de carga óptimo de las imágenes servidas mediante el CDN de Cloudflare R2.
