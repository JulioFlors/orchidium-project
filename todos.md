# 📋 Backlog de Ingeniería (Micro-Gerencia)

Este documento centraliza todas las tareas del proyecto, fusionando la Estrategia de 4 Fases con los requerimientos técnicos de infraestructura y hardware.

---

## 🏗️ FASE 0: INFRAESTRUCTURA & DEVOPS

*Objetivo:* Cimientos sólidos para el despliegue híbrido (Local/Cloud).

### ☁️ 0.1 Almacenamiento y Base de Datos

* [ ] **Vercel Blob / S3:** Implementar subida de imágenes de plantas a almacenamiento en la nube (Vercel Blob) en lugar de `public/local`, para persistencia en despliegues serverless. <!-- Prioridad: Alta -->
* [ ] **InfluxDB Híbrido:** Validar conmutación entre servicio local (Docker) y Cloud según `INFLUX_URL`.

### 🚀 0.2 Despliegue de Servicios (Backend)

* [ ] **Dockerización Producción:** Configurar `Dockerfile` optimizado o servicio PaaS (Railway/Render) para `ingest` y `scheduler` (servicios 24/7).

---

## 🟣 FASE 1: FUNDAMENTOS DE GESTIÓN (Sistemas CRUD)

*Objetivo:* Poblar la base de datos con la realidad biológica y de insumos.

### 🌿 1.1 Gestión de Inventario (Taxonomía y Activos)

* [ ] **Sistema de Géneros (`Genus`):** CRUD completo con validación.
* [ ] **Sistema de Especies (`Species`):**
  * [ ] CRUD con Slug autogenerado.
  * [ ] Integración con componente de carga de imágenes (Vercel Blob).
* [ ] **Sistema de Plantas (`Plant`):** CRUD de activos vivos (Gemelo Digital).

### 🌸 1.2 Tienda & Lógica de Negocio

* [ ] **CRUD Variantes (`ProductVariant`):** Gestión de precios y stock.
* [ ] **Mejoras UI Tienda:**
  * [ ] Filtro "En Floración Activa" (Checkbox).
  * [ ] Distintivo visual en la card de producto.

### 🧪 1.3 Gestión de Laboratorio (Insumos)

* [ ] **Catálogo de Agroquímicos:** CRUD Clasificado (Fertilizante/Fitosanitario) con instrucciones de uso.

### 👥 1.4 Gestión de Usuarios

* [ ] **Panel Admin:** Promover/Degradar usuarios.
* [ ] **Mi Cuenta:** Botón "Cerrar Sesión" y gestión básica.

---

## 🎮 FASE 2: NÚCLEO OPERATIVO (Control Manual)

*Objetivo:* Control en tiempo real con feedback inmediato.

### ⚙️ 2.1 Backend: Abstracción

* [x] **API de Comandos:** Implementado como **Cliente MQTT Directo** para latencia cero.
* [x] **Seguridad:** Implementado **Exclusión Mutua** en Frontend y Timeout de 10min.

### 🎛️ 2.2 Frontend: Centro de Control (`/operations/control`)

* [x] **Conectividad MQTT (Cliente):**
  * [x] Hook `useMqttConnection`: Gestión de estado, suscripciones y reconexión.
  * [x] Lógica **Heartbeat**: Indicador UI Online/Offline basado en tópicos `.../status`.
* [x] **UI de Mando:**
  * [x] **Grid Acciones:** Regar, Nebulizar, Humedecer, Fertirriego.
  * [x] **Orquestador JS:** Manejo de exclusión mutua y timeouts visuales.
* [ ] **Refinamiento UI/UX:** Pulido general de la página de operaciones.
* [ ] **Smart Safety Checks (Roadmap):** Modal de confirmación "Pre-Flight" consultando sensores.
  * [ ] **Gestión de Orfandad (Offline Fallback):** Implementar lógica para desactivar visualmente las cards activas (transcurrido el tiempo estipulado) si el dispositivo se desconecta ("offline"), evitando estados inconsistentes en la UI.

### 📅 2.3 Agendamiento (Nueva Vista)

* [ ] **Separación Lógica:** Mover "Tareas Programadas" a su propia vista/componente, independiente del control manual inmediato.

---

## 🧠 FASE 3: AUTOMATIZACIÓN INTELIGENTE

*Objetivo:* El sistema se cuida solo.

### 📅 3.1 Gestión de Rutinas

* [ ] **CRUD Programas de Cultivo:** Creación de secuencias de fertilización.
* [ ] **Scheduler UI:** Interfaz para gestionar `AutomationSchedule` (Crons).

### 🌤️ 3.2 WeatherGuard (Inteligencia)

* [ ] **Servicio Meteorológico Híbrido:**
  * [ ] Integrar API externa (Ej: OpenWeatherMap).
  * [ ] **Algoritmo de Decisión:** Comparar "Sensor Lluvia Local" vs "Predicción API" para cancelar riegos programados.

---

## ✨ FASE 4: EXPERIENCIA (Dashboard)

*Objetivo:* Visualización de datos para toma de decisiones.

### 📊 4.1 UI/UX & Visualización

* [ ] **Gráficos en Tiempo Real:** Implementar Recharts para Temperatura/Humedad.
* [ ] **Componentes de Sensores:** Cards reutilizables con datos en vivo.
* [ ] **Layouts:** Refinar Grids y transiciones (Morphing/Cross-fade) post-funcionalidad.

---

## 🛡️ DEUDA TÉCNICA & SEGURIDAD

* [ ] **HiveMQ ACLs (Permisos):** Configurar listas de control de acceso (ACLs) en HiveMQ Cloud una vez que la arquitectura esté 100% estable.
  * Objetivo: Restringir permisos por usuario (Frontend solo publicar en `/cmd`, etc).
  * Nota: Actualmente todos los usuarios tienen permisos `PUB/SUB` totales.

---

## 🔌 HARDWARE (Pausado / Pendiente Validación)
>
> Tareas físicas pendientes de validación de componentes.

* [ ] **Integración Transductor de Presión:** Lógica de protección de bomba en seco.
* [ ] **Migración Sensor Lluvia:** Mover lógica de nodo `Sensors` a `Relays` (si aplica).
* [ ] **Sensor de Luminosidad:** Integración final BH1750 via I2C.
