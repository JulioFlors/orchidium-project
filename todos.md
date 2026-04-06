# 📋 Backlog de Ingeniería (Micro-Gerencia)

Este documento centraliza todas las tareas del proyecto, fusionando la Estrategia de 4 Fases con los requerimientos técnicos de infraestructura y hardware.

---

## 🏗️ FASE 0: INFRAESTRUCTURA & DEVOPS

*Objetivo:* Cimientos sólidos para el despliegue híbrido (Local/Cloud).

### ☁️ 0.1 Almacenamiento y Base de Datos

* [ ] **Vercel Blob / S3:** Implementar subida de imágenes de plantas a almacenamiento en la nube (Vercel Blob) en lugar de `public/local`, para persistencia en despliegues serverless.
* [ ] **InfluxDB VPS (Cubo Histórico):** Migrar de Cloud a instancia VPS propia.
  * [ ] Eliminar política de retención de 30 días.
  * [ ] Crear *Continuous Queries* (o Tareas en Flux/SQL) para realizar **Downsampling**: Resumir datos crudos (minuto a minuto) en un bucket secundario con resoluciones horarias (max, min, mean) para consultas de meses/años sin penalizar el rendimiento.
* [ ] **Dominio y SSL (Cloudflare):** Configurar dominio personalizado y proxy en Cloudflare para obtener HTTPS gratuito y seguro sin gestionar certificados en el VPS.

### 🚀 0.2 Despliegue de Servicios (Backend)

* [x] **Dockerización Producción:** Configurar los servicios de `ingest` y `scheduler` en un VPS.

---

## 🟣 FASE 1: FUNDAMENTOS DE GESTIÓN (Sistemas CRUD)

*Objetivo:* Poblar la base de datos con la realidad biológica y de insumos.

### 🌿 1.1 Gestión de Inventario (Taxonomía y Activos)

* [ ] **Sistema de Géneros (`Genus`):** CRUD completo con validación.
* [ ] **Sistema de Especies (`Species`):**
  * [ ] CRUD con Slug autogenerado.
  * [ ] Integración con componente de carga de imágenes (Vercel Blob).
* [ ] **Sistema de Plantas (`Plant`):** CRUD de activos vivos (Gemelo Digital).
* [ ] **Diario Biológico (Eventos):** CRUD para registrar "Avistamientos de Plagas", "Infección Fúngica" y "Floraciones". Este registro alimentará el Motor de Inferencias.

### 🌸 1.2 Tienda & Lógica de Negocio

* [ ] **CRUD Variantes (`ProductVariant`):** Gestión de precios y stock.
* [ ] **Mejoras UI Tienda:**
  * [ ] Filtro/sección para agrupar plantas con **Floración Activa** (Sincronizado con el Diario Biológico).
  * [ ] Cuando no estén agrupadas, aplicar label "Floración" (similar visualmente al label "Agotado") a los productos correspondientes.
  * [ ] Distintivo visual en la card de producto.

### 🧪 1.3 Gestión de Laboratorio (Insumos y Recetas)

*Objetivo:* Implementar los CRUD de `/supplies` (Insumos) y `/recipes` (Programas) usando **estrictamente componentes UI universales** para garantizar diseño consistente y escalabilidad.

* [ ] **Capa 0: Reutilización de UI (Universal Components):**
  * Identificar e implementar un Sistema de Diseño atómico basado en Tailwind y clsx-tailwind-merge en `src/components/ui/` para evitar código espagueti.
  * [ ] `Button.tsx`: Botón universal con variantes (`primary`, `secondary`, `destructive`, `ghost`, `outline`) y estados (`isLoading`, `disabled`).
  * [ ] `Card.tsx`: Contenedor semántico compuesto de `Card`, `CardHeader`, `CardTitle`, `CardContent`, y `CardFooter`.
  * [ ] `Table.tsx`: Sistema de tablas componibles (`Table`, `TableHeader`, `TableRow`, `TableHead`, `TableBody`, `TableCell`).
  * [ ] `Badge.tsx`: Píldoras indicadoras de estado.
  * [ ] Reemplazar las implementaciones ad-hoc en vistas existentes (ej. `AdminDashboard.tsx`) para asegurar que el sistema se adapte bien antes de construir el CRUD.
* [ ] **Página `/supplies` (Catálogo de Agroquímicos):**
  * [ ] Tabla universal para listar `Agrochemical` (Nombre, Tipo, Propósito, Instrucciones).
  * [ ] Modal/Panel unificado para **Crear/Editar** insumos (Fertilizante/Fitosanitario).
  * [ ] Lógica de Server Actions (`createSupply`, `updateSupply`, `deleteSupply`).
* [ ] **Página `/recipes` (Programas de Cultivo):**
  * [ ] Interfaces para listar `FertilizationProgram` y `PhytosanitaryProgram`.
  * [ ] Componente Constructor de Recetas: Permitir añadir N pasos (Cycles) y seleccionar el Agroquímico y Sequencia con un selector unificado.

### 👥 1.4 Gestión de Usuarios

* [x] **Panel Admin:** Promover/Degradar usuarios.
* [x] **Mi Cuenta:** Botón "Cerrar Sesión" y gestión básica.

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
* [x] **Refinamiento UI/UX:** Pulido general de la página de operaciones y monitoreo (Skeletons, Recharts accessibility fixes, Select-none).
* [ ] **Smart Safety Checks (Roadmap):** Modal de confirmación "Pre-Flight" consultando sensores.
  * [x] **Gestión de Orfandad (Offline Fallback):** Implementar lógica para desactivar visualmente las cards y estados (Zombie/Offline) basándose en intervalos dinámicos de MQTT.
* [ ] **Confirmación de Agroquímicos (Manual):** Cuando el usuario active manualmente un circuito de Fertirriego o Fumigación desde `/control`, se debe exigir una confirmación explícita de que el tanque auxiliar (Relé 2) ha sido preparado con el producto correspondiente. El circuito debe ejecutarse por un máximo de 5 minutos.

### 📅 2.3 Agendamiento

* [x] **Separación Lógica:** Mover "Tareas Programadas" a su propia vista/componente, independiente del control manual inmediato (`/planner`).

---

## 🧠 FASE 3: AUTOMATIZACIÓN INTELIGENTE

*Objetivo:* El sistema se cuida solo y aprende de su entorno.

### 📅 3.1 Gestión de Rutinas (Scheduler)

* [ ] **CRUD Programas de Cultivo:** Creación de secuencias de fertilización completas.
* [x] **Scheduler Diferido:** Motor de ejecución backend (Polling DB) e UI para agendar Tareas Diferidas Manuales.
* [ ] **Scheduler UI (Crons Recurrentes):** Interfaz para gestionar `AutomationSchedule` (rutinas continuas).
* [ ] **Confirmación de Agroquímicos (Diferido/Automatizado):** Las tareas de Fertirriego y Fumigación programadas (diferidas o cron) deben solicitar confirmación al usuario **1 hora antes** de la ejecución. El usuario confirma que el tanque ha sido preparado. Si no hay confirmación antes de la hora programada, la tarea se cancela automáticamente con nota auditable (`WAITING_CONFIRMATION` → `CANCELLED`). Depende del **Sistema de Notificaciones** (ver sección transversal).
* [x] **WeatherGuard Básico:** "Si llovió > X mm, cancelar riego" o si hay precipitaciones pronosticadas.
* [x] **Integración Ingest/Scheduler:** Suscripción reactiva a eventos de lluvia (`rain/event`, `rain/state`) para toma de decisiones instantánea.

### 💡 3.2 Motor de Inferencias (El Cerebro Analítico)

> Ver especificaciones en `docs/specs/04-environmental-inference-engine.md`

* [ ] **Fase 3.2.1 - Estabilización de Tiempo Real (Smooth Data):**
  * [ ] Modificar la API/WebSocket de telemetría para que retorne Medias Móviles Simples (SMA de 10-15 min) en vez de lecturas crudas puras (elimina parpadeos UI por nubes/reflejos).
* [ ] **Fase 3.2.2 - Agregación de VPD:**
  * [ ] Backend: Añadir cálculo de Déficit de Presión de Vapor (VPD) combinando Temp/Humedad para inferir transpiración de fluidos en las orquídeas.
* [ ] **Fase 3.2.3 - Worker de Agregación Diaria (CRON 23:55):**
  * [ ] Crear script/servicio independiente para Downsampling de InfluxDB.
  * [ ] Calcular métricas botánicas: DLI (Daily Light Integral) convirtiendo Lux a PPFD, y DIF (Salto Térmico Día-Noche).
  * [ ] Calcular Riesgo Epidemiológico: "Horas de Humedad Foliar" consecutivas (>85% HR sin salto térmico).
  * [ ] Persistir resumen procesado diario en base de datos central.
* [ ] **Machine Learning Ligero:** Función para cruzar avistamientos de plagas (Fase 1.1) con los históricos de InfluxDB.

### 🌤️ 3.3 WeatherGuard (Inteligencia Predictiva Híbrida)

*Objetivo:* Evitar riegos redundantes y prevenir pudrición de raíces anticipándose al clima.

* [x] **Integración de API Meteorológica Atmosférica:** Conectar el backend a APIs externas (Open-Meteo y OpenWeatherMap) para Ciudad Guayana.
* [x] **Integración de API Agrícola (AgroMonitoring):** Oráculo capaz de leer el estado del suelo (humedad y temperatura a 10cm) mediante polígonos satelitales.
* [x] **Algoritmo de Decisión Proactiva/Reactiva (Scheduler):** Evaluar múltiples factores antes de abrir una válvula:
  * *Reactivo (Físico):* Consultar InfluxDB -> ¿La lluvia local en 24h superó el umbral? (Sensor `EXTERIOR`).
  * *Reactivo (Satelital):* Consultar AgroMonitoring -> ¿El suelo ya tiene suficiente humedad base?
  * *Proactivo (Nube):* Consultar OWM/Open-Meteo -> ¿La probabilidad de precipitación (PoP) para las próximas 3 horas es mayor al 70%?
  * *Acción:* Cancelar o posponer riego y auditar el motivo.

---

## ✨ FASE 4: EXPERIENCIA (Dashboard)

*Objetivo:* Visualización de datos para toma de decisiones.

### 📊 4.1 UI/UX & Visualización

### 📊 4.1 UI/UX & Visualización Avanzada

* [x] **Gráficos en Tiempo Real:** Implementar Recharts para Temperatura/Humedad.
* [x] **Layouts y Accesibilidad:** Refinar Grids, transiciones, eliminación de marcos de enfoque.
* [x] **Lógica de Clima Inteligente:** Detección de "Falla de Sensor", "Obsoleto" y validación robusta de paleta de colores TDS.
* [ ] **Micro-Visión (Vista 24h):**
  * [ ] Implementar **Escala Logarítmica** en el eje Y de Iluminancia (para ver sutiles variaciones de 100lx y picos de 60,000lx simultáneamente).
  * [ ] Implementar **Sombreado Contextual** (Fondo gris/azulado) durante las horas del Valle Nocturno y Transición Vespertina.
* [ ] **Macro-Visión (Vista 7-30 días):** Desarrollar Gráficos de Bandas de Rango (Range Area) o Velas (Candlestick) mostrando Máximos, Mínimos y Promedios diarios.

---

## 📲 SISTEMA DE NOTIFICACIONES E INTERACCIONES (Transversal)

> Sistema transversal que habilita la comunicación bidireccional entre PristinoPlant y el usuario fuera de la aplicación web.

### 📨 Canal de Notificaciones

* [ ] **Integración con Telegram o WhatsApp:** Implementar un bot/canal que permita enviar notificaciones al usuario (alertas, solicitudes de confirmación, reportes). Elegir la opción más rápida, gratuita y mantenible tanto en desarrollo como en producción.
* [ ] **Web Push Notifications:** Notificaciones del navegador como canal secundario para usuarios que no tengan la app abierta. Permite reaccionar en ventanas de oportunidad (ej: confirmar agroquímicos antes de ejecución).

### 🔄 Tipos de Interacción

* [ ] **Notificaciones Informativas:** Alertas de estado del sistema que no requieren respuesta (ej: "Riego completado", "Nodo Actuador offline").
* [ ] **Notificaciones con Confirmación:** Solicitudes que requieren acción del usuario (ej: "¿El tanque de fertirriego está preparado? Confirmar/Cancelar").
* [ ] **Confirmación vía Web:** Permitir que la confirmación también se pueda otorgar desde la aplicación web (fallback al canal de mensajería).

### 📋 Registro de Interacciones

* [ ] **Log de Notificaciones:** Registrar todas las notificaciones enviadas, su estado (enviada/leída/respondida) y la respuesta del usuario, visible en un apartado de la web.

---

## 🛡️ DEUDA TÉCNICA & SEGURIDAD

* [ ] **HiveMQ ACLs (Permisos):** Configurar listas de control de acceso (ACLs) en HiveMQ Cloud. Restringir Frontend a solo `/cmd`.

---

## 🔌 HARDWARE (Pausado / Pendiente Validación)
>
> Tareas físicas pendientes de validación de componentes.

* [ ] **Optimización Energética (Sensors ESP32):** Implementar `machine.deepsleep()`. Investigar y decidir entre:
  * **Deep Sleep Cíclico:** Boot → WiFi → Publish → Sleep (máximo ahorro, ~10µA).
  * **Deep Sleep Adaptativo:** Intervalos variables por hora del día (3-15 min según fase circadiana).
  * **Light Sleep:** Mantiene RAM/WiFi, menor ahorro (~2mA) pero mantiene MQTT.
  * **Delta Publishing:** Solo publicar cuando el cambio supere un umbral (ej: ΔTemp > 0.5°C).
  * Reducir frecuencia de OTA checks (ej: 1 de cada N boots).
* [x] **Integración Transductor de Presión:** Desarrollar la logica para detectar el circuito activo y reportarlo en el payload (v0.6.1).
* [x] **Renombrar Light Intensity a Illuminance:** Uniformar el término técnico en todo el sistema (firmware, ingest, database, frontend) (v0.6.1).
* [x] **Optimización Status Exterior:** Unificar el status de la estación exterior con el del nodo actuador para ahorrar recursos (v0.6.1).
* [x] **Migración Sensor Lluvia al Nodo Actuador:** ~~Mover lógica `rain_monitor_task()` del firmware Sensors al firmware Relays.~~ Migrado en v0.6.0. Incluye BH1750 exterior + sensor de gotas de lluvia + transductor de presión. Tópicos MQTT bajo `PristinoPlant/Environmental_Monitoring/Exterior/`.
* [x] **Sensor de Iluminancia externo:** ~~Desarrollar la logica para calcular la diferencia de iluminancia.~~ Implementado en v0.6.0 como `exterior_publish_task()` en el nodo actuador. Publica en `Exterior/readings` para comparar con el BH1750 interior.
