# 📋 Tablero de Actividades

**Fecha:** 18-01-2026
**Estado General:** 🏗️ Fase de Construcción: Implementación del Layout "Tesla-Account" y Rutas de Gestión.

---

## 🚀 FASE 1: ARQUITECTURA DE UI Y NAVEGACIÓN (Prioridad Alta)

El objetivo inmediato es establecer el "esqueleto" visual del panel de administración antes de conectar los datos.

### 1. 📐 Layout & Estructura Base

* [ ] **Grid System (Escritorio vs Móvil):**
  * [ ] Definir CSS Grid: Columna fija `280px` (Sidebar) + `1fr` (Contenido) para Desktop (`>= tds-lg`).
  * [ ] Definir Stack: `1fr` (Solo contenido) para Mobile (`< tds-lg`).
  * [ ] **Limpieza:** Asegurar que el layout del Orquideario **NO** herede componentes de la Tienda (SearchBox, Carrito).

### 2. 📱 Navegación Móvil (Réplica Tesla)

* [ ] **Componente `MobileSectionTrigger`:**
  * [ ] Estructura: Botón que contiene `<h1>` con el título actual.
  * [ ] **Estilos:**
    * [ ] `ScrimIcon`: Círculo de 34px (invisible por defecto, gris en active).
    * [ ] `Typography`: Texto `font-medium`, `text-lg`, con padding-left reservado para el icono.
    * [ ] `Chevron`: Indicador visual de desplegable a la derecha.
* [ ] **Modal de Navegación (Menú Full-Screen):**
  * [ ] **Backdrop:** Fondo con `bg-canvas/60` y **`backdrop-blur-xl`**.
  * [ ] **Lista:** Reutilizar enlaces del sidebar pero centrados/adaptados a móvil.
  * [ ] **Cierre:** Botón "X" o texto alineado a la derecha del header del modal.

### 3. 🖥️ Navegación de Escritorio

* [ ] **Sidebar "Invisible":**
  * [ ] Posición `sticky`.
  * [ ] Estilos: Sin bordes ni fondo (`bg-transparent`).
  * [ ] Interacción: Texto gris medio (`--color-secondary`) que pasa a color primario en hover.

---

## 🛣️ FASE 2: IMPLEMENTACIÓN DE VISTAS (Rutas)

Creación de las páginas y conexión con el nuevo archivo de configuración de rutas (`orchidariumRoutes`).

* [ ] **🏠 Dashboard (`/orchidarium`)**
  * [ ] Estructura base del "Home" administrativo.
  * [ ] Preparar slots para widgets (Clima, Agenda, Alertas).
* [ ] **🌺 Inventario (`/orchidarium/inventory`)**
  * [ ] **Tab Plantas:** Tabla/Grid de gestión de especies (CRUD Prisma).
  * [ ] **Tab Insumos:** Tabla de Agroquímicos (CRUD con stock y dosis).
* [ ] **📅 Planificador (`/orchidarium/planner`)**
  * [ ] Vista de Calendario.
  * [ ] Interfaz de creación de Rutinas.
* [ ] **📡 Monitoreo IoT (`/orchidarium/monitoring`)**
  * [ ] Estructura para visualizar Zonas.
  * [ ] Listado técnico de dispositivos.
* [ ] **⚙️ Ajustes (`/orchidarium/settings`)**
  * [ ] Gestión de usuarios y configuración global.

---

## 📡 FASE 3: LÓGICA IOT & CONECTIVIDAD (Backend/Frontend)

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

## 🏪 FASE 4: LÓGICA DE NEGOCIO Y TIENDA

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
