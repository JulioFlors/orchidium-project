# 📋 Tablero de Actividades - ORCHIDIUM PROJECT

**Última Actualización:** 30-01-2026

---

## ☁️ INFRAESTRUCTURA HÍBRIDA (Local / Cloud)

Objetivo: Lograr que el sistema sea desplegable en la nube sin fricción, manteniendo un entorno local robusto.

### 1. Estandarización MQTT (HiveMQ Cloud & Mosquitto)

* [ ] **Seguridad Local:** Configurar Mosquitto (`mosquitto.conf`) para exigir usuario y contraseña (file authentication), replicando el comportamiento de HiveMQ.
* [ ] **Gestión de Credenciales:** Crear usuarios estándar (`admin`, `backend`, `device`) tanto en HiveMQ Cloud como en Mosquitto local.
* [ ] **Adaptación de Firmware:** Actualizar `secrets.py` en los ESP32 para soportar SSL/TLS (necesario para HiveMQ puerto 8883) y autenticación.
* [ ] **Variables de Entorno:** Refactorizar `.env` para soportar `MQTT_PROTOCOL` (mqtt/mqtts) y puertos dinámicos.

### 2. Almacenamiento y Base de Datos

* [ ] **InfluxDB Híbrido:** Validar que los servicios `ingest` y `scheduler` conmuten correctamente entre InfluxDB Docker (Local) e InfluxDB Cloud (Prod) según la variable `INFLUX_URL`.
* [ ] **Vercel Blob / S3:** Implementar subida de imágenes de plantas a almacenamiento en la nube (Vercel Blob) en lugar de `public/local`, para persistencia en despliegues serverless.

### 3. Despliegue de Servicios (Backend)

* [ ] **Dockerización de Producción:** Crear un `Dockerfile` optimizado para producción o configurar un servicio PaaS (como Railway o Render) para desplegar los contenedores `ingest` y `scheduler` que deben correr 24/7 (Vercel no sirve para esto porque es Serverless/Event-driven).

---

## 🛣️ IMPLEMENTACIÓN DE VISTAS (Rutas)

Creación de la estructura de carpetas y páginas basada en `(orchidarium)/(titulo_principal)/pagina_especifica`.

* [x] **✅ Validación de Estructura:** Revisar y confirmar que la estructura de carpetas y archivos en `(orchidarium)` cumpla con la convención de rutas y grupos definida.
* [x] **🏠 Dashboard (`/orchidarium`)**
  * [x] Estructura: `(dashboard)/monitoring`, `(dashboard)/timeline`, `(dashboard)/alerts`.
  * [x] Paginas: `monitoring/page.tsx`, `timeline/page.tsx`, `alerts/page.tsx`.
* [x] **🌺 Inventario (`/orchidarium/inventory`)**
  * [x] Estructura: `(inventory)/species`, `(inventory)/stock`, `(inventory)/shop-manager`.
  * [x] Paginas: `species/page.tsx`, `stock/page.tsx`, `shop-manager/page.tsx`.
* [x] **🧪 Laboratorio (`/orchidarium/lab`)**
  * [x] Estructura: `(lab)/supplies`, `(lab)/recipes`.
  * [x] Paginas: `supplies/page.tsx`, `recipes/page.tsx`.
* [x] **🏗️ Operaciones (`/orchidarium/operations`)**
  * [x] Estructura: `(operations)/control`, `(operations)/planner`, `(operations)/history`.
  * [x] Paginas: `control/page.tsx`, `planner/page.tsx`, `history/page.tsx`.
* [x] **⚙️ Admin (`/orchidarium/settings`)**
  * [x] Estructura: `(admin)/users`, `(admin)/system`.
  * [x] Paginas: `users/page.tsx`, `system/page.tsx`.

---

## 📡 LÓGICA IOT & CONECTIVIDAD (Backend/Frontend)

Una vez existan las vistas, inyectamos la "vida" al sistema.

### 1. Conectividad MQTT (Tiempo Real)

* [ ] **Cliente Web:** Implementar conexión Websocket a broker MQTT en el cliente (navegador).
* [ ] **Hook `useMqttConnection`:** Gestión de estado de conexión, suscripciones y reconexión.
* [ ] **Heartbeat:** Lógica para escuchar tópicos `.../status` y determinar Online/Offline.

### 2. Visualización y Control

* [ ] **Componentes de Sensores:** Cards reutilizables para Temperatura, Humedad, Luz.
* [ ] **Gráficos:** Implementación de librería (ej. Recharts) para datos en tiempo real.
* [ ] **Actuadores:** Interfaz de mando manual (Toggle Switches) para Riego/Luces.
* [ ] **Orquestador Frontend:** Lógica JS para manejar `start_delay` y `duration` en acciones manuales.

---

## 🎨 REFINAMIENTO DE UI/UX (Header)

Objetivo: Lograr una experiencia de navegación "nativa" y fluida.

* [x] **✨ Perfeccionamiento del NavbarDropdown (Mega Menu)**
  * [x] **Transición de Altura (Height Morphing):** El contenedor base (`card`) debe adaptar su altura suavemente al contenido del nuevo ítem seleccionado, sin saltos bruscos.
  * [x] **Cross-fade de Contenido:** Al cambiar entre ítems del menú (ej. de *Orquídeas* a *Insumos*), el contenido antiguo debe desvanecerse (`opacity: 0`) y el nuevo aparecer (`opacity: 1`) **sin movimientos espaciales** (sin deslizarse `x` o `y`).
  * [ ] **Layouts Específicos:** El diseño visual y maquetación de las rejillas (Grids) finales se abordará **post-funcionalidad**, una vez definidos sus componentes y lógica operativa.

---

## 🏪 LÓGICA DE NEGOCIO Y TIENDA

* [ ] **🌦️ Servicio Meteorológico:**
  * [ ] Integrar API externa (OpenWeather).
  * [ ] Algoritmo de comparación: "Sensor Lluvia Local" vs "Predicción API".
* [ ] **🌸 Mejoras en Tienda:**
  * [ ] **Filtro Floración:** Checkbox/Filtro para mostrar solo plantas en "Floración Activa".
  * [ ] Distintivo visual en la card de producto.

---

## ⏸️ PAUSADO: HARDWARE & FIRMWARE (Relay Modules v0.4.0)

> Pendiente de validación física de componentes.

* [ ] Integración Transductor de Presión (Protección de bomba).
* [ ] Migración lógica Sensor de Lluvia (Nodo Sensors -> Relays).
* [ ] Integración Sensor de Luminosidad (BH1750 via I2C).
