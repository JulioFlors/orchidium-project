# 🌸 PristinoPlant | Hoja de Ruta Estratégica (Macro)

> **Visión:** Gestión de Invernaderos de Precisión mediante Gemelos Digitales e Inteligencia Ambiental.

Este documento define la estrategia de alto nivel dividida en 4 fases de ingeniería. Para el detalle técnico de tareas diarias, consultar `todos.md`.

---

## 🏗️ FASE 0: Infraestructura & DevOps (Cimientos)

*Objetivo:* Asegurar estabilidad, despliegue continuo y calidad de código.

* [x] **Dockerización:** Despliegue de microservicios en VPS.
* [x] **Calidad de Código:** Unificación de ESLint y corrección de crashes en configuraciones modulares.
* [x] **Protocolos de Agente:** Implementación de trazabilidad mandatoria y autónoma en bitácoras.

## 🏗️ FASE 1: Fundamentos de Gestión (La Estructura de Datos)

*Objetivo:* Construir la "verdad" del sistema. Antes de controlar el hardware, el software debe entender qué está gestionando.

### 1.1 Catálogo y Trazabilidad (Inventario)

Implementación de sistemas CRUD completos para modelar la realidad biológica y comercial (rutas `/genus`, `/species`, `/plants`, `/store`).

* **Taxonomía Base:** CRUD de Géneros (`Genus`) y Especies (`Species`).
* **Pipeline de Imágenes (AOT):** Sistema de compresión en Cliente (`browser` -> `WebP` sub-300KB) -> Hosting Dedicado en VPS. Cero consumo Vercel Image Optimization quota.
* **Activos Vivos:** Gestión de Plantas individuales (Gemelos Digitales) con rastreo de estado e ID (`Plant`).
* [x] **Diario Biológico:** Registro de eventos del ciclo de vida (Floraciones, Plagas) cruzados con los Gemelos Digitales para análisis ambiental.
* **Tienda (E-commerce):** Gestión de Variantes Comerciales (`ProductVariant`), cruzando Taxonomía con Ventas.
* [x] **Tienda (Sync):** Integración de estados biológicos en el catálogo comercial (Etiquetas y secciones dinámicas).

### 1.2 Recursos del Laboratorio

Gestión de los insumos necesarios para el mantenimiento de la vida.

* [x] **Agroquímicos:** Inventario de Fertilizantes y Fitosanitarios.
* [x] **Programas:** Definición de "Recetas" (Programas de Fertilización y Fumigación) que agrupan ciclos de aplicación.

### 1.3 Control de Acceso (RBAC)

* Gestión de Usuarios y Roles (Admin Promotion).
* Seguridad de rutas administrativas.

---

## 🎮 FASE 2: Núcleo Operativo (Control Manual & Abstracción)

*Objetivo:* "One-Click Farming". Abstraer la complejidad del protocolo MQTT para ofrecer una experiencia de usuario simple y poderosa.

### 2.1 La Capa de Abstracción (Backend)

El usuario no sabe qué es un relé o un tópico MQTT. El sistema traduce intenciones en comandos.

* **Orquestación de Comandos:** Transformar "Humedecer Suelo" en: `Abrir Válvula Main -> Abrir Válvula Suelo -> Encender Bomba`.
* **Gestión de Tiempos:** Inmediato (Toggle), Temporizado (Auto-apagado) y Diferido (Programado).

### 2.2 Interfaz de Control (Frontend)

* Panel de Operaciones en tiempo real (`/operations/control`).
* Feedback visual inmediato del estado de los actuadores (Socket/MQTT Hooks).
* **Confirmación de Agroquímicos:** Modal obligatorio antes de activar circuitos de Fertirriego/Fumigación que valide la preparación del tanque auxiliar.

---

## 🧠 FASE 3: Automatización Inteligente (La Mente de la Colmena)

*Objetivo:* Automatización persistente que toma decisiones basándose en el contexto ambiental.

### 3.1 Gestión de Rutinas (Scheduler CRUD - El Músculo)

Interfaz para crear/editar/eliminar rutinas de automatización (`AutomationSchedule`). Riegos, Fertilización, etc., con bloqueos simples en tiempo real (ej. Sensor de lluvia).

* [x] **Confirmación Previa de Agroquímicos:** Las tareas de Fertirriego/Fumigación requieren confirmación del usuario 1h antes. Sin confirmación, la tarea se cancela automáticamente. Depende del Sistema de Notificaciones.

### 3.2 WeatherGuard (El Escudo Preventivo)

* [x] **Algoritmo de Precisión Híbrida**: Cruza la telemetría del sensor de lluvia local (pasado/presente) con las APIs meteorológicas globales (Open-Meteo/OWM para pronóstico de lluvia futura) y Análisis de Suelos Satelital (AgroMonitoring para medir la humedad actual de la tierra). El sistema cancela riegos si el suelo ya está húmedo o si se avecina una tormenta, optimizando el agua y previniendo enfermedades por exceso de humedad.

### 3.3 Motor de Inferencias (El Cerebro)

* [x] **Inference Engine (v1):** Implementación de lazo cerrado de decisión cruzando telemetría InfluxDB (SMA), VWC (AgroMonitoring) y Pronóstico (Open-Meteo).
* [ ] **Segmentación Circadiana:** Comprensión de las 4 fases del día (Valle Nocturno, Rampa Matutina, Pico Diurno, Transición Vespertina).
* [ ] **Métricas Complejas:** Cálculo diario del DLI (Daily Light Integral) discriminando luz solar de artificial, y VPD (Déficit de Presión de Vapor).
* [ ] **Predicción Epidemiológica:** Cruce del historial ambiental con el "Diario Biológico" para alertar sobre condiciones propensas a hongos o plagas específicas.

---

## ✨ FASE 4: Experiencia y Visualización

*Objetivo:* Pulido visual y métricas para la toma de decisiones humanas.

### 4.1 Dashboard Vivo y Analítico

* Visualización en tiempo real y micro-visión (24h) con sombreado contextual (Día/Noche) y escalas logarítmicas para iluminancia.
* Macro-visión (7/30 días) usando condensación de datos (Velas/Cajas) para promedios, máximos y mínimos.
* Componentes Skeletons y UX select-none.

### 4.2 Lógica Avanzada de Sensores (Hardware)

* Eficiencia Energética: Implementación de Deep Sleep en nodos remotos.
* Cálculo de Transmisión de Luz (Malla vs Sol directo).

### 4.3 Arquitectura Zero-Spinner (Hidratación)

* Implementación sistemática de Hidratación Server-to-Client en todas las vistas de datos.
* Eliminación de parpadeos y estados de carga iniciales para una experiencia instantánea (Instant Web App).

### 4.4 Gestión de Cuenta

* Perfil de usuario, cambio de contraseña y eliminación de cuenta (GDPR).

### 4.5 Sistema de Notificaciones (Transversal)

* Integración con Telegram/WhatsApp para notificaciones bidireccionales (alertas, confirmaciones).
* Web Push Notifications como canal secundario.
* Log de interacciones visible en la web.

### 4.5 Observabilidad del Sistema

* Registro de eventos `online`/`offline` de todos los nodos (Sensors, Actuador) y servicios backend (Scheduler, Ingest) en InfluxDB.
* Correlación automática de desconexiones con tareas fallidas para generar notas de diagnóstico.
* Dashboard de salud en `/orchidarium`: estado de nodos, uptime, última lectura.
* Notificaciones de desconexión/reconexión de nodos vía Telegram/WhatsApp.
* Flexible por zona: nuevos nodos Sensors se registran automáticamente.
* Ver: `docs/observability_architecture.md`.
