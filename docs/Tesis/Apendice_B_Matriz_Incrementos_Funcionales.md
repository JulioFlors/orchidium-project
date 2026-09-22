# Apéndices

## Apéndice B: Matriz de Incrementos Funcionales

El presente apéndice expone la matriz de trazabilidad y correspondencia metodológica de los seis (6) incrementos funcionales desarrollados para la plataforma PristinoPlant. Esta estructuración operacional articula las cinco (5) fases del Modelo Incremental de Pressman (2010) con los cuatro (4) bloques conceptuales y las once (11) fases de la Metodología de Desarrollo Guiado por Pruebas para Sistemas Basados en Internet de las Cosas (TDDM4IoTS), formulada por Guerrero-Ulloa et al. (2020) y respaldada por Hornos y Quinde (2024).

---

### 1. Entregables de Ingeniería por Incremento

La Tabla Ap-B1 consolida los módulos del sistema y los productos técnicos concretos generados en cada una de las iteraciones de desarrollo, garantizando que cada incremento proporcionó operatividad autónoma y valor tangible en campo.

#### Tabla Ap-B1. *Módulos y entregables de ingeniería por incremento*

| Inc. | Módulo / Denominación | Entregables de Ingeniería Consolidados |
| :---: | :--- | :--- |
| **1** | **Plataforma Web Base y Catálogos Taxonómico y Agroquímico** | Arquitectura web base, sistema visual UI/UX accesible, modelo de datos relacional para el catálogo taxonómico botánico e inventario de insumos agronómicos. |
| **2** | **Circuito Hidráulico, Tablero de Potencia y Automatización** | Circuito hidráulico presurizado de 4 líneas independientes, tablero eléctrico con aislamiento en tres niveles de tensión y firmware base para conmutación segura de actuadores. |
| **3** | **Infraestructura Backend Distribuida, Orquestación y Operaciones** | Arquitectura backend en servicios contenerizados (Docker), bróker de mensajería MQTTS sobre TLS, servicio orquestador desatendido 24/7 e interfaces de control y programación de riego. |
| **4** | **Estaciones Meteorológicas y Telemetría Ambiental** | Estaciones meteorológicas automatizadas (exterior e interior), firmware de adquisición telemétrica, circuito de autorrecuperación (*power cycle*), supresión de interferencias y monitoreo en tiempo real. |
| **5** | **Inferencia de Lluvia y Autonomía Hídrica** | Motor de inferencia de riego basado en umbrales microclimáticos (VPD), motor heurístico de precipitación pluvial sin sensores corrosivos y documentación formal de validación en campo. |
| **6** | **Inventario y Comercio en Línea** | Modelo de gemelos digitales para seguimiento individualizado por ejemplar (`SeedPlant`), control de ocupación espacial en mesas de cultivo y canal de comercio electrónico integrado. |

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

*Nota.* Fuente: Elaboración propia a partir de las actividades de ingeniería ejecutadas en el proyecto.

---

### 3. Taxonomía de Fases de la Metodología TDDM4IoTS

En concordancia con el principio de adaptabilidad enunciado por Guerrero-Ulloa et al. (2020, p. 77), el marco TDDM4IoTS organiza el desarrollo de soluciones de Internet de las Cosas en once (11) fases estructuradas bajo cuatro (4) bloques conceptuales:

1. **Bloque I: Iniciación y Requisitos**
   * *Fase 1 (F1) - Recopilación de Requisitos:* Levantamiento de necesidades agronómicas y operativas con el cultivador.
   * *Fase 2 (F2) - Formulación de Requisitos de Alto Nivel:* Formalización de requerimientos funcionales y no funcionales (SRS).
   * *Fase 3 (F3) - Lista Inicial de Casos de Prueba:* Definición de escenarios de validación para software, firmware y hardware.

2. **Bloque II: Diseño y Pruebas IoTS**
   * *Fase 4 (F4) - Arquitectura del Sistema IoTS:* Diseño en capas (percepción, control de borde, red y decisión).
   * *Fase 5 (F5) - Especificación de Casos de Prueba IoTS:* Formulación de pruebas eléctricas, de estanqueidad y de enlace telemétrico.
   * *Fase 6 (F6) - Criterios de Aceptación de las Pruebas IoTS:* Establecimiento de tolerancias admisibles (p. ej., tiempos de respuesta, presiones hidráulicas y aislamiento galvánico).

3. **Bloque III: Construcción Guiada por Pruebas**
   * *Fase 7 (F7) - Creación del Entregable:* Ensamblaje físico de hardware, codificación de firmware o desarrollo de módulos de software.
   * *Fase 8 (F8) - Casos de Prueba (TDD Red):* Ejecución de pruebas preliminares en banco para identificar fallas antes de la puesta en marcha.
   * *Fase 9 (F9) - Desarrollo (TDD Green):* Implementación y ajuste de lógica para superar las pruebas unitarias y de integración.
   * *Fase 10 (F10) - Refactorización (TDD Refactor):* Optimización de código (p. ej., bytecode `.mpy` en MicroPython) y mejoras de supresión de ruido (EMI/diafonía).

4. **Bloque IV: Evaluación y Entrega Final**
   * *Fase 11 (F11) - Prueba de Aceptación Final, Despliegue Operativo, Mantenimiento y Evolución:* Puesta en servicio en el orquideario, calibración empírica en condiciones reales y monitoreo continuo del cultivo.
