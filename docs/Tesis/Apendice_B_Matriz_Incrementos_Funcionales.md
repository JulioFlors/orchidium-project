# Apéndices

## Apéndice B: Matriz de Correspondencia Metodológica por Incremento

El presente apéndice consolida la descomposición modular y la trazabilidad de los siete (7) incrementos funcionales desarrollados en la plataforma PristinoPlant. Esta estructuración articula las cinco (5) fases del Modelo Incremental de Pressman (2010) con los cuatro (4) bloques conceptuales y las once (11) fases de la Metodología de Desarrollo Guiado por Pruebas para Sistemas Basados en Internet de las Cosas (TDDM4IoTS), formulada por Guerrero-Ulloa et al. (2020).

---

### 1. Entregables de Ingeniería por Incremento

La Tabla Ap-B1 detalla los módulos del sistema y los entregables técnicos consolidados en cada una de las siete iteraciones de desarrollo, garantizando que cada incremento aportó operatividad autónoma y evaluable en campo.

#### Tabla Ap-B1. *Módulos y entregables de ingeniería por incremento*

| Inc. | Módulo / Denominación | Entregables de Ingeniería Consolidados |
| :---: | :--- | :--- |
| **1** | **Plataforma Web Base y Modelado de Dominio** | Arquitectura web base en Next.js (App Router), monorepositorio Turborepo con tipado estricto en TypeScript, sistema de autenticación con control de acceso por roles (Better-Auth) y esquema relacional en PostgreSQL con datos semilla. |
| **2** | **Circuito Hidráulico, Tablero Eléctrico y Conmutación Física** | Red presurizada de 4 líneas independientes con bomba de 1 HP, tablero de potencia aislado en tres niveles de tensión (110VAC, 24VAC, 5VDC), protecciones inductivas y firmware base en MicroPython para conmutación segura de actuadores. |
| **3** | **Infraestructura Backend Distribuida, Orquestación y Operaciones** | Servicios contenerizados en Docker (PostgreSQL, InfluxDB, Mosquitto, Ingest, Scheduler), bróker MQTTS bajo TLS 1.3, temporizadores de seguridad fail-safe e interfaces web de control manual directo (`/control`), colas (`/queue`) y auditoría (`/history`). |
| **4** | **Estaciones Meteorológicas y Telemetría Ambiental** | Estación meteorológica exterior (EMA Exterior) e interior (EMA Interior en garita 3D), firmware de adquisición telemétrica, circuito de autorrecuperación física (*power-cycle* en GPIO 5) y tablero de monitoreo microclimático en tiempo real (`/monitoring`). |
| **5** | **Inferencia de Lluvia y Autonomía Hídrica** | Motor meteorológico de inferencia de lluvia sin sensores resistivos corrosivos (`rain-manager.ts`), motor de inferencia hídrica con matriz de vetos deliberativos por alternancia y saturación higrométrica, y monitor del oráculo (`/weather-oracle`). |
| **6** | **Catálogo, Inventario, Tienda y Cronograma de Dosificación** | Modelado de gemelos digitales por ejemplar (`SeedPlant`), catálogo botánico (`/catalog`), gestión de stock en mesas (`/stock`), tienda digital e-commerce con carrito y checkout por WhatsApp, y laboratorio de recetas y dosificación rotativa (`/lab`). |
| **7** | **Asistente Agronómico, Orquestación n8n y Resiliencia** | Integración del asistente inteligente conversacional para consultas botánicas y operativas, orquestación automatizada de flujos mediante n8n, canal de notificaciones y alertas al cultivador vía bot, y pruebas de resiliencia ante contingencias de red. |

*Nota.* Fuente: Elaboración propia fundamentada en el plan de desarrollo incremental de PristinoPlant.

---

### 2. Correspondencia Metodológica: Pressman y TDDM4IoTS

La Tabla Ap-B2 detalla la integración metodológica de cada incremento funcional, vinculando las fases del ciclo de vida de Pressman (2010) con las fases técnicas adoptadas de TDDM4IoTS (Guerrero-Ulloa et al., 2020).

#### Tabla Ap-B2. *Matriz de correspondencia metodológica por incremento*

| Inc. | Fases del Modelo Incremental (Pressman, 2010) | Fases TDDM4IoTS Adoptadas (Guerrero-Ulloa et al., 2020) |
| :---: | :--- | :---: |
| **1** | Comunicación, Planeación, Modelado, Construcción | **F1, F2, F3, F4, F7, F9** |
| **2** | Modelado, Construcción, Despliegue | **F1, F2, F4, F5, F6, F7, F8** |
| **3** | Planeación, Modelado, Construcción, Despliegue | **F1, F2, F3, F4, F7, F8, F9** |
| **4** | Modelado, Construcción, Despliegue | **F1, F3, F5, F6, F7, F8, F10** |
| **5** | Construcción, Despliegue | **F3, F5, F7, F8, F10, F11** |
| **6** | Modelado, Construcción, Despliegue | **F1, F2, F4, F7, F11** |
| **7** | Modelado, Construcción, Despliegue | **F4, F7, F8, F9, F11** |

*Nota.* Fuente: Elaboración propia a partir de las actividades de ingeniería ejecutadas en el proyecto.

---

### 3. Fases de la Metodología TDDM4IoTS

De acuerdo con Guerrero-Ulloa et al. (2020), las fases de TDDM4IoTS se estructuran bajo cuatro bloques conceptuales:

1. **Bloque I: Iniciación y Requisitos**
   * *F1 - Recopilación de Requisitos:* Levantamiento de necesidades agronómicas y operativas con el cultivador.
   * *F2 - Formulación de Requisitos de Alto Nivel:* Formalización de requerimientos funcionales y no funcionales (SRS).
   * *F3 - Lista Inicial de Casos de Prueba:* Definición de escenarios de validación para software, firmware y hardware.

2. **Bloque II: Diseño y Pruebas IoTS**
   * *F4 - Arquitectura del Sistema IoTS:* Diseño en capas (percepción, control de borde, red y decisión).
   * *F5 - Especificación de Casos de Prueba IoTS:* Formulación de pruebas eléctricas, de estanqueidad y de enlace telemétrico.
   * *F6 - Criterios de Aceptación de las Pruebas IoTS:* Tolerancias admisibles (tiempos de respuesta, presiones hidráulicas y aislamiento galvánico).

3. **Bloque III: Construcción Guiada por Pruebas**
   * *F7 - Creación del Entregable:* Ensamblaje físico de hardware, codificación de firmware o desarrollo de módulos de software.
   * *F8 - Casos de Prueba (TDD Red):* Ejecución de pruebas preliminares en banco para identificar fallas antes de la puesta en marcha.
   * *F9 - Desarrollo (TDD Green):* Implementación y ajuste de lógica para superar las pruebas unitarias y de integración.
   * *F10 - Refactorización (TDD Refactor):* Optimización de código (bytecode en MicroPython) y supresión de ruido (EMI/diafonía).

4. **Bloque IV: Evaluación y Entrega Final**
   * *F11 - Prueba de Aceptación Final y Despliegue Operativo:* Puesta en servicio en el orquideario, calibración empírica en condiciones reales y monitoreo continuo del cultivo.
