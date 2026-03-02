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

### 🧪 1.3 Gestión de Laboratorio (Insumos)

* [ ] **Catálogo de Agroquímicos:** CRUD Clasificado (Fertilizante/Fitosanitario) con instrucciones de uso.

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
* [ ] **WeatherGuard Básico:** "Si llovió > X mm, cancelar riego".

### 💡 3.2 Motor de Inferencias (El Cerebro Analítico)

* [ ] **Módulo Backend Independiente:** Crear servicio/script cron que se ejecute a las 23:55 diariamente.
* [ ] **Cálculo de Métricas:** Programar algoritmos para:
  * [ ] DLI (Daily Light Integral) con factor de conversión dinámico (Sol vs. Luz Artificial nocturna).
  * [ ] DIF (Promedio Temp Diurna - Promedio Temp Nocturna).
  * [ ] VPD Horario (Déficit de Presión de Vapor).
* [ ] **Reglas Epidemiológicas:** Modelo de "Horas de Humedad Foliar" para disparar alertas de riesgo de hongos.
* [ ] **Machine Learning Ligero:** Función para cruzar avistamientos de plagas (Fase 1.1) con el histórico de InfluxDB de las 3 semanas previas.

### 🌤️ 3.3 WeatherGuard (Inteligencia Predictiva Híbrida)

*Objetivo:* Evitar riegos redundantes y prevenir pudrición de raíces anticipándose al clima.

* [ ] **Integración de API Meteorológica:** Conectar el backend a una API externa (Ej. OpenWeatherMap o WeatherAPI) geolocalizada en Ciudad Guayana.
* [ ] **Algoritmo de Decisión Proactiva/Reactiva:** Crear la lógica en el Scheduler que evalúe dos factores antes de abrir una válvula:
  * *Reactivo (Local):* Consultar InfluxDB -> ¿La duración de lluvia local en las últimas 24h superó el umbral? (Sensor físico).
  * *Proactivo (Nube):* Consultar API -> ¿La probabilidad de precipitación (PoP) para las próximas 3 horas es mayor al 70%?
  * *Acción:* Si cualquiera de las dos es verdadera, cancelar o posponer el riego programado y registrar el motivo en el Log.

---

## ✨ FASE 4: EXPERIENCIA (Dashboard)

*Objetivo:* Visualización de datos para toma de decisiones.

### 📊 4.1 UI/UX & Visualización

### 📊 4.1 UI/UX & Visualización Avanzada

* [x] **Gráficos en Tiempo Real:** Implementar Recharts para Temperatura/Humedad.
* [x] **Layouts y Accesibilidad:** Refinar Grids, transiciones, eliminación de marcos de enfoque.
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
* [ ] **Integración Transductor de Presión:** Desarrollar la logica para detectar irregularidades en el funcionamiento del sistema que indiquen que se debe de limpiar el filtro de agua que esta ubicado entre la salida de la bomba y la entrada de todas las lineas de riego. y que cuando se ensucia el filtro hace que la bomba se sobre esfuerce y no salga agua suficiente en las lineas de riego. (la funcion del filtro es proteger los aspersores de suciedad que cause una obstrupcion)
* [ ] **Migración Sensor Lluvia al Nodo Actuador:** Mover lógica `rain_monitor_task()` del firmware Sensors al firmware Relays. Integrar sensores cableados (BH1750 exterior + sensor de gotas de lluvia) al ESP32 del tablero de control. Considerar ESP32 adicional si la carga de procesamiento es excesiva.
  * **Tópicos MQTT:** La estación exterior debe publicar en `PristinoPlant/Environmental_Monitoring/Exterior/readings` y `/status` para ser captada automáticamente por el ingest y el frontend (zona `EXTERIOR`).
  * **Consideración clave:** El frontend se suscribe a `PristinoPlant/Environmental_Monitoring/#` — los tópicos del actuador (`/Actuator_Controller/`) no caen bajo este patrón. Opciones: (A) publicar desde el actuador reutilizando el árbol `Environmental_Monitoring/Exterior/` o (B) crear suscripción adicional en el frontend.
  * **BH1750 interior adicional:** Evaluar si cablear un segundo BH1750 + DHT22 dentro del invernadero al tablero, para no depender 100% del dispositivo móvil con batería.
* [ ] **Sensor de Luminosidad externo:** Desarrollar la logica para calcular la diferencia de iluminancia entre lo que reporta el firmware de `Sensors` ubicado en el orquideario protegido por malla-sombra y la realidad de externa del orquideario. (el sensor esta ubicado en el techo de una casa de 2 pisos que le da sombra parcial al orquideario luego de las 12 cuando el sol rota. El sensor mide la iluminancia que recibe del sol sin ningun obtaculo, mientras que el sensor interno mide la iluminancia que recibe del sol filtrada por la malla-sombra (+ la posible sombra parcial de la casa). la diferencia entre ambos sensores indica la cantidad de luz que se pierde debido a la malla-sombra. pudiendo cuantificar el porcentaje que filtra la malla-sombra.) tambien sirve para medir de manera mas acertada si el clima esta nublado, templado o soleado.
