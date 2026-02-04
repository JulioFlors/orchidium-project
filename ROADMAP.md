# 🌸 PristinoPlant | Hoja de Ruta Estratégica (Macro)

> **Visión:** Gestión de Invernaderos de Precisión mediante Gemelos Digitales e Inteligencia Ambiental.

Este documento define la estrategia de alto nivel dividida en 4 fases de ingeniería. Para el detalle técnico de tareas diarias, consultar `todos.md`.

---

## 🏗️ FASE 1: Fundamentos de Gestión (La Estructura de Datos)

*Objetivo:* Construir la "verdad" del sistema. Antes de controlar el hardware, el software debe entender qué está gestionando.

### 1.1 Catálogo y Trazabilidad (Inventario)

Implementación de sistemas CRUD completos para modelar la realidad biológica.

* **Taxonomía:** Gestión de Géneros y Especies (La base genética).
* **Activos Vivos:** Gestión de Plantas individuales (Gemelos Digitales) con rastreo de estado y ubicación.
* **Tienda:** Gestión de Variantes de Producto (Lógica de venta y stock).

### 1.2 Recursos del Laboratorio

Gestión de los insumos necesarios para el mantenimiento de la vida.

* **Agroquímicos:** Inventario de Fertilizantes y Fitosanitarios.
* **Programas:** Definición de "Recetas" (Programas de Fertilización y Fumigación) que agrupan ciclos de aplicación.

### 1.3 Control de Acceso (RBAC)

* Gestión de Usuarios y Roles (Admin Promotion).
* Seguridad de rutas administrativas.

---

## 🎮 FASE 2: Núcleo Operativo (Control Manual & Abstracción)

*Objetivo:* "One-Click Farming". Abstraer la complejidad del protocolo MQTT para ofrecer una experiencia de usuario simple y poderosa.

### 2.1 La Capa de Abstracción (Backend)

El usuario no sabe qué es un relé o un tópico MQTT. El sistema traduce intenciones en comandos.

* **Orquestación de Comandos:** Transformar "Humedecer Suelo" en: `Abrir Válvula Main -> Abrir Válvula Suelo -> Encender Bomba`.
* **Gestión de Tiempos:**
  * **Inmediato:** Start/Stop manual (Toggle).
  * **Temporizado:** "Humedecer por 10 minutos".
  * **Diferido:** "Humedecer a las 4:00 PM por 15 minutos".

### 2.2 Interfaz de Control (Frontend)

* Panel de Operaciones en tiempo real (`/operations/control`).
* Feedback visual inmediato del estado de los actuadores (Socket/MQTT Hooks).

---

## 🧠 FASE 3: Automatización Inteligente (La Mente de la Colmena)

*Objetivo:* Automatización persistente que toma decisiones basándose en el contexto ambiental.

### 3.1 Gestión de Rutinas (Scheduler CRUD)

Interfaz para crear/editar/eliminar rutinas de automatización (`AutomationSchedule`).

* **Tipos:** Riego, Fertilización, Fumigación, Humidificación.
* **Persistencia:** Las rutinas viven en la base de datos y se recargan al reiniciar el servicio.

### 3.2 Inteligencia Ambiental (WeatherGuard)

El sistema evalúa si es seguro ejecutar una tarea programada.

* **Fuentes de Datos:**
  * Estación Meteorológica Local (Sensores MQTT).
  * API Clima Externa (Predicción).
* **Lógica de Decisión:** "Si llovió > 5mm en la última hora O hay > 80% probabilidad de lluvia, SALTAR riego programado".
* *Nota:* El control manual (Fase 2) siempre tiene prioridad y no puede ser bloqueado por esta lógica.

---

## ✨ FASE 4: Experiencia y Visualización

*Objetivo:* Pulido visual y métricas para la toma de decisiones humanas.

### 4.1 Dashboard Vivo

* Visualización de datos históricos y en tiempo real (Temperaturas, Humedad, Luz).
* Gráficos interactivos de eventos (Lluvias, Riegos ejecutados).

### 4.2 Gestión de Cuenta

* Perfil de usuario, cambio de contraseña y eliminación de cuenta (GDPR).
