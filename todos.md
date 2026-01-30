# 📋 Tablero de Actividades - ORCHIDIUM PROJECT

**Última Actualización:** 28-01-2026

---

## 🎨 REFINAMIENTO DE UI/UX (Header)

Objetivo: Lograr una experiencia de navegación "nativa" y fluida.

* [x] **✨ Perfeccionamiento del NavbarDropdown (Mega Menu)**
  * [x] **Transición de Altura (Height Morphing):** El contenedor base (`card`) debe adaptar su altura suavemente al contenido del nuevo ítem seleccionado, sin saltos bruscos.
  * [x] **Cross-fade de Contenido:** Al cambiar entre ítems del menú (ej. de *Orquídeas* a *Insumos*), el contenido antiguo debe desvanecerse (`opacity: 0`) y el nuevo aparecer (`opacity: 1`) **sin movimientos espaciales** (sin deslizarse `x` o `y`).
  * [ ] **Layouts Específicos:** El diseño visual y maquetación de las rejillas (Grids) finales se abordará **post-funcionalidad**, una vez definidos sus componentes y lógica operativa.

---

## 🛣️ IMPLEMENTACIÓN DE VISTAS (Rutas)

Creación de la estructura de carpetas y páginas basada en `(orchidarium)/(titulo_principal)/pagina_especifica`.

* [ ] **✅ Validación de Estructura:** Revisar y confirmar que la estructura de carpetas y archivos en `(orchidarium)` cumpla con la convención de rutas y grupos definida.
* [ ] **🏠 Dashboard (`/orchidarium`)**
  * [ ] Estructura: `(dashboard)/monitoring`, `(dashboard)/timeline`, `(dashboard)/alerts`.
  * [ ] Paginas: `monitoring/page.tsx`, `timeline/page.tsx`, `alerts/page.tsx`.
* [ ] **🌺 Inventario (`/orchidarium/inventory`)**
  * [ ] Estructura: `(inventory)/species`, `(inventory)/stock`, `(inventory)/shop-manager`.
  * [ ] Paginas: `species/page.tsx`, `stock/page.tsx`, `shop-manager/page.tsx`.
* [ ] **🧪 Laboratorio (`/orchidarium/lab`)**
  * [ ] Estructura: `(lab)/supplies`, `(lab)/recipes`.
  * [ ] Paginas: `supplies/page.tsx`, `recipes/page.tsx`.
* [ ] **🏗️ Operaciones (`/orchidarium/operations`)**
  * [ ] Estructura: `(operations)/control`, `(operations)/planner`, `(operations)/history`.
  * [ ] Paginas: `control/page.tsx`, `planner/page.tsx`, `history/page.tsx`.
* [ ] **⚙️ Admin (`/orchidarium/settings`)**
  * [ ] Estructura: `(admin)/users`, `(admin)/system`.
  * [ ] Paginas: `users/page.tsx`, `system/page.tsx`.

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
