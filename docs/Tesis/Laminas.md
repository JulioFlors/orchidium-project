# Guion y Estructura de Diapositivas para la Defensa de Grado
```
Documento rector de discurso, estructura visual y correlación temática de las láminas para la defensa del Trabajo Instrumental de Grado: **«Sistema de Gestión de Invernaderos Basado en Agricultura Inteligente para el Cultivo de Orquídeas»**.
```
* **Autor:** Julio César Flores Silva
* **Tutor Académico:** Prof. José Francisco Fonseca Droy
* **Tutor Empresarial:** Ing. Richard José García Martínez
* **Institución:** Universidad Católica Andrés Bello (UCAB Guayana)
```
---
```
## Índice de Láminas Desarrolladas
```
### Fundamentación y Marco Metodológico (Capítulos I, II y III)
1. [Lámina 1: Planteamiento del Problema](#lámina-1-planteamiento-del-problema)
2. [Lámina 2: Objetivo General](#lámina-2-objetivo-general)
3. [Lámina 3: Objetivos Específicos (Parte 1: Analizar y Diseñar)](#lámina-3-objetivos-específicos-parte-1)
4. [Lámina 4: Objetivos Específicos (Parte 2: Implementar, Validar y Documentar)](#lámina-4-objetivos-específicos-parte-2)
5. [Lámina 5: Aportes Tecnológicos](#lámina-5-aportes-tecnológicos)
6. [Lámina 6: Aportes Funcionales](#lámina-6-aportes-funcionales)
7. [Lámina 7: Marco Teórico](#lámina-7-marco-teórico)
8. [Lámina 8: Marco Metodológico](#lámina-8-marco-metodológico)
```
### Capítulo IV: Desarrollo y Resultados de Ingeniería
* **Fase 1: Análisis y Estudio Inicial**
  * [Lámina 1.1: Requisitos de Dominio y Entorno de Cultivo](#lámina-11-requisitos-de-dominio-y-entorno-de-cultivo)
  * [Lámina 1.2: Requisitos Funcionales del Sistema](#lámina-12-requisitos-funcionales-del-sistema)
  * [Lámina 1.3: Requisitos No Funcionales y Criterios de Rendimiento](#lámina-13-requisitos-no-funcionales-y-criterios-de-rendimiento)
  * [Lámina 1.4: Selección Justificada del Stack Tecnológico](#lámina-14-selección-justificada-del-stack-tecnológico)
* **Fase 2: Diseño Conceptual**
  * [Lámina 2.1: Arquitectura Conceptual y Segregación por Capas (C4)](#lámina-21-arquitectura-conceptual-y-segregación-por-capas-c4)
  * [Lámina 2.2: Modelo de Datos Híbrido (Relacional y Series Temporales)](#lámina-22-modelo-de-datos-híbrido)
  * [Lámina 2.3: Flujo de Deliberación y Lógica de Riego](#lámina-23-flujo-de-deliberación-y-lógica-de-riego)
* **Fase 3: Diseño Básico**
  * [Lámina 3.1: Selección de Hardware y Topología Distribuida](#lámina-31-selección-de-hardware-y-topología-distribuida)
  * [Lámina 3.2: Arquitectura Lógica de Servicios Contenerizados (Docker Compose)](#lámina-32-arquitectura-lógica-de-servicios-contenerizados)
  * [Lámina 3.3: Comunicación y Flujo de Datos (MQTT Pub/Sub)](#lámina-33-comunicación-y-flujo-de-datos-mqtt)
* **Fase 4: Diseño Detallado**
  * [Lámina D.1A: Tablero y Circuito Eléctrico (Potencia y Control)](#lámina-d1a-tablero-y-circuito-eléctrico)
  * [Lámina D.1B: Circuito Hidráulico Presurizado (Impulsión y Modularidad)](#lámina-d1b-circuito-hidráulico-presurizado)
  * [Lámina D.2A: Firmware Embebido y Resiliencia en Silicio](#lámina-d2a-firmware-embebido-y-resiliencia-en-silicio)
  * [Lámina D.2B: Motores de Inferencia Deterministas](#lámina-d2b-motores-de-inferencia-deterministas)
* **Fase 5: Construcción e Implementación Incremental**
  * [Incremento 1: Plataforma Base y Modelo de Dominio](#incremento-1-plataforma-base-y-modelo-de-dominio)
  * [Incremento 2: Infraestructura Física, Conmutación Eléctrica e Hidráulica (4 Láminas)](#incremento-2-infraestructura-física-conmutación-eléctrica-e-hidráulica)
  * [Incremento 3: Infraestructura Backend Distribuida, Orquestación y Operaciones](#incremento-3-infraestructura-backend-distribuida-orquestación-y-operaciones)
    * [Lámina 3.1: Infraestructura Backend Distribuida](#lámina-31-infraestructura-backend-distribuida)
    * [Lámina 3.2: Automatización de Operaciones (DevOps e IoT-Ops)](#lámina-32-automatización-de-operaciones-devops-e-iot-ops)
    * [Lámina 3.3: Bróker Mosquitto Autoalojado](#lámina-33-bróker-mosquitto-autoalojado)
    * [Lámina 3.4: Driver de Transporte Parchado (simple2.py)](#lámina-34-driver-de-transporte-parchado-simple2py)
    * [Lámina 3.5: Runtime Asíncrono del ESP32](#lámina-35-runtime-asíncrono-del-esp32)
    * [Lámina 3.6: Arquitectura Borde Delgado (Thin Edge)](#lámina-36-arquitectura-borde-delgado-thin-edge)
    * [Lámina 3.7: Servicios Backend y Suite de Operaciones](#lámina-37-servicios-backend-y-suite-de-operaciones)
  * [Incremento 4: Estaciones Meteorológicas y Telemetría Ambiental](#incremento-4-estaciones-meteorológicas-y-telemetría-ambiental)
    * [Lámina 4.1: Estaciones Meteorológicas y Telemetría Ambiental](#lámina-41-estaciones-meteorológicas-y-telemetría-ambiental)
    * [Lámina 4.2: EMA Exterior y Mitigación de Ruido en Campo (Figura 8)](#lámina-42-ema-exterior-y-mitigación-de-ruido-en-campo-figura-8)
    * [Lámina 4.3: EMA Interior en Garita Stevenson 3D (Figura 9)](#lámina-43-ema-interior-en-garita-stevenson-3d-figura-9)
    * [Lámina 4.4: Resiliencia de Sensores y Autorrecuperación Física (Relé 8)](#lámina-44-resiliencia-de-sensores-y-autorrecuperación-física-relé-8)
    * [Lámina 4.5: Caracterización del Microclima (/monitoring y /botanics)](#lámina-45-caracterización-del-microclima-monitoring-y-botanics)
    * [Lámina 4.6: Auditoría Técnica Remota Asíncrona (iot_debug)](#lámina-46-auditoría-técnica-remota-asíncrona-iot_debug)
  * [Incremento 5: Inferencia de Lluvia y Autonomía Hídrica](#incremento-5-inferencia-de-lluvia-y-autonomía-hídrica)
    * [Lámina 5.1: Motor de Inferencia Hídrica y Jerarquía Sensorial](#lámina-51-motor-de-inferencia-hídrica-y-jerarquía-sensorial)
    * [Lámina 5.2: Falla Crítica en Campo: Corrosión del Sensor de Lluvia (Figura 11)](#lámina-52-falla-crítica-en-campo-corrosión-del-sensor-de-lluvia-figura-11)
    * [Lámina 5.3: Rediseño: Motor de Inferencia Meteorológica](#lámina-53-rediseño-motor-de-inferencia-meteorológica)
    * [Lámina 5.4: Criterios Deterministas de Cese y Reconstrucción Histórica](#lámina-54-criterios-deterministas-de-cese-y-reconstrucción-histórica)
  * [Incremento 6: Catálogo, Inventario, Tienda y Cronograma de Dosificación](#incremento-6-catálogo-inventario-tienda-y-cronograma-de-dosificación)
    * [Lámina 6.1: Catálogo Taxonómico y Trazabilidad Individual](#lámina-61-catálogo-taxonómico-y-trazabilidad-individual)
    * [Lámina 6.2: Seguimiento Fenológico y Ciclo de Floración](#lámina-62-seguimiento-fenológico-y-ciclo-de-floración)
    * [Lámina 6.3: Desacoplamiento Operativo y Cronograma de Dosificación](#lámina-63-desacoplamiento-operativo-y-cronograma-de-dosificación)
    * [Lámina 6.4: Comercio Botánico y Reserva Atómica por WhatsApp](#lámina-64-comercio-botánico-y-reserva-atómica-por-whatsapp)
  * [Incremento 7: Asistente Agronómico, Orquestación n8n y Resiliencia](#incremento-7-asistente-agronómico-orquestación-n8n-y-resiliencia)
    * [Lámina 7.1: Notificaciones Proactivas y Orquestación con n8n](#lámina-71-notificaciones-proactivas-y-orquestación-con-n8n)
    * [Lámina 7.2: Protocolo de Confirmación Previa en Agroquímicos (Human-in-the-Loop)](#lámina-72-protocolo-de-confirmación-previa-en-agroquímicos-human-in-the-loop)
    * [Lámina 7.3: Diagnóstico Correlacionado y Mantenimiento del Filtro (Figura 13)](#lámina-73-diagnóstico-correlacionado-y-mantenimiento-del-filtro-figura-13)
* **Fase de Validación del Funcionamiento (Casos de Estudio en Campo)**
  * [Lámina V.1: Validación de Gobernanza y Resiliencia en Campo (Figura 14)](#lámina-v1-validación-de-gobernanza-y-resiliencia-en-campo-figura-14)
  * [Lámina V.2: Validación de Autonomía Agronómica y Supervisión](#lámina-v2-validación-de-autonomía-agronómica-y-supervisión)
* **Fase de Documentación del Prototipo y Transferencia**
  * [Lámina DOC.1: Documentación del Prototipo y Transferencia Tecnológica](#lámina-doc1-documentación-del-prototipo-y-transferencia-tecnológica)
* **Capítulo V: Conclusiones y Recomendaciones**
  * [Lámina C.1: Conclusiones: Objetivos 1 al 3 (Análisis, Diseño e Implementación)](#lámina-c1-conclusiones-objetivos-1-al-3-análisis-diseño-e-implementación)
  * [Lámina C.2: Conclusiones: Objetivos 4 y 5 (Validación, Documentación y Aporte Global)](#lámina-c2-conclusiones-objetivos-4-y-5-validación-documentación-y-aporte-global)
  * [Lámina R.1: Recomendaciones para Trabajos Futuros y Escalabilidad](#lámina-r1-recomendaciones-para-trabajos-futuros-y-escalabilidad)
* [Auditoría Integral de Tiempos y Calibración para Defensa de 30 Minutos](#auditoría-integral-de-tiempos-y-calibración-para-defensa-de-30-minutos)
```
---
```
## Lámina 1: Planteamiento del Problema
```
### Estructura y Contenido en Lámina
```
* **Título:** `PLANTEAMIENTO DEL PROBLEMA`
* **Cintillo / Pregunta Central:**
  > *De la gestión empírica al control autónomo y trazable en el cultivo de orquídeas*
```
```
          ┌─────────────────────── SITUACIÓN ACTUAL ───────────────────────┐
          │                                                                │
          │    [Ícono: Grifo / Reloj]           [Ícono: Termómetro alerta] │
          │         RIEGO EMPÍRICO                   VACÍO TELEMÉTRICO     │
          │ Frecuencia fija y riego a       Sin datos ambientales; estrés  │
          │ ciegas sin evaluar secado real. térmico (>34 °C) y regulación  │
          │                                 térmica ineficiente.           │
          │                                                                │
          │    [Ícono: Raíz dañada]             [Ícono: Libreta tachada]   │
          │        RIESGO RADICULAR                  DESFASE OPERATIVO     │
          │ Asfixia del velamen (anoxia) y  Plan en papel vs. realidad en  │
          │ proliferación de hongos         campo: aplicaciones tardías    │
          │ fitopatógenos.                  o descontinuadas.              │
          └────────────────────────────────────────────────────────────────┘
```
          ┌─────────────────────────── PROPUESTA ──────────────────────────┐
          │                                                                │
          │    [Ícono: Microchip / Escudo]      [Ícono: Garita 3D]         │
          │       RIEGO DELIBERATIVO                TELEMETRÍA CONTINUA    │
          │ Motor de inferencia con veto    Estaciones EMA en garitas 3D:  │
          │ automático ante lluvia o        supervisión en tiempo real     │
          │ saturación ambiental.           vía MQTT/TLS.                  │
          │                                                                │
          │    [Ícono: Hoja sana / ODS]         [Ícono: Bot / Asistente]   │
          │      SANIDAD Y EFICIENCIA               ASISTENTE AGRONÓMICO   │
          │ Preservación radicular y uso    Formulación guiada y alertas   │
          │ eficiente de agua y             interactivas en Telegram con   │
          │ agroquímicos (ODS 6 y 12).      patrón Human-in-the-Loop.      │
          └────────────────────────────────────────────────────────────────┘
```
```
### Discurso / Pitch Oral (Tiempo estimado: ~90 segundos)
```
> «Para comprender el origen de esta investigación, debemos situarnos en la singularidad biológica de la familia *Orchidaceae*. Las orquídeas epífitas no crecen en tierra común; sus raíces están recubiertas por un tejido esponjoso llamado **velamen radicular**, adaptado para absorber humedad rápidamente por capilaridad pero con una demanda estricta de aireación posterior.
```
> Al analizar la **Situación Actual** en las instalaciones de PristinoPlant bajo invernaderos tradicionales de malla sombra, se identificaron cuatro limitaciones operativas críticas:
```
> 1. Primero, el **riego empírico**, ejecutado bajo una frecuencia interdiaria sin control del secado en el interior del sustrato.
> 2. Segundo, un **vacío telemétrico**, donde la falta de instrumental in situ provocaba que durante los picos de mayor temperatura y baja humedad relativa, el cultivador dejara una manguera abierta en el suelo por tiempo indefinido, generando desperdicio hídrico y una regulación térmica ineficiente.
> 3. Tercero, un severo **riesgo radicular**: al no controlar el espaciado adecuado entre riegos, la superficie del sustrato aparenta estar seca mientras el interior permanece húmedo, provocando sobre-riego, **asfixia del velamen por anoxia** y proliferación letal de hongos fitopatógenos.
> 4. Y finalmente, un marcado **desfase operativo**: la dosificación de agroquímicos y la planificación de los ciclos de fertilización y fumigación dependían del registro manual llevado por el cultivador, provocando aplicaciones tardías o descontinuadas.
```
> Frente a esta realidad, la **Propuesta** consolida una plataforma de Agricultura Inteligente fundamentada en cuatro pilares de solución:
```
> 1. Sustituir los temporizadores ciegos por un **riego deliberativo**, gobernado por motores de inferencia con capacidad de veto automático ante lluvia o saturación.
> 2. Implementar **telemetría continua** mediante estaciones meteorológicas automáticas (EMA) en garitas 3D con transmisión segura MQTT/TLS.
> 3. Garantizar la **sanidad vegetal y el uso eficiente de recursos**, protegiendo las raíces y optimizando el consumo de agua dulce y productos químicos bajo los ODS 6 y 12.
> 4. E integrar un **asistente agronómico interactivo**, que vincula la formulación asistida en la web con notificaciones móviles en Telegram bajo el patrón *Human-in-the-Loop*, cerrando para siempre la brecha entre la planificación y la ejecución en campo.»
```
### Frase de Transición hacia Lámina 2
> *«Para dar respuesta a estas limitaciones, se definió el objetivo general de esta investigación...»*
```
---
```
## Lámina 2: Objetivo General
```
### Estructura y Contenido en Lámina
```
* **Título:** `OBJETIVO GENERAL`
* **Caja de Contenido (Izquierda):**
  > *Desarrollar un sistema de gestión de invernaderos basado en agricultura inteligente para el cultivo de orquídeas.*
* **Elemento Visual (Derecha):** Ilustración técnica del tablero eléctrico de conmutación y nodo embebido implementado.
```
### Discurso / Pitch Oral (Tiempo estimado: ~30 segundos)
```
> «Atendiendo a esta problemática, nos planteamos como **Objetivo General**:
```
> **Desarrollar un sistema de gestión de invernaderos basado en agricultura inteligente para el cultivo de orquídeas.**
```
> Este objetivo no se limitó a crear una automatización aislada de riego. Implicó concebir una solución integral que acopla hardware físico de conmutación y potencia —como el tablero eléctrico que observamos en pantalla— con adquisición telemétrica continua y una plataforma de software distribuida para la toma de decisiones agronómicas.»
```
### Frase de Transición hacia Lámina 3
> *«Para alcanzar este objetivo general, trazamos una ruta metodológica estructurada en cinco objetivos específicos, iniciando por las fases de análisis y diseño...»*
```
---
```
## Lámina 3: Objetivos Específicos (Parte 1)
```
### Estructura y Contenido en Lámina
```
* **Título:** `OBJETIVOS ESPECÍFICOS`
* **Ítem ①:**
  > *Analizar los conceptos y herramientas referentes al cultivo de orquídeas basado en agricultura inteligente, a fin de identificar las características del sistema a desarrollar.*
* **Ítem ②:**
  > *Diseñar en función del análisis realizado, un sistema de gestión de invernaderos basado en agricultura inteligente para el cultivo de orquídeas.*
```
### Discurso / Pitch Oral (Tiempo estimado: ~40 segundos)
```
> «La primera etapa del proyecto abordó la conceptualización y el modelado del sistema:
```
> * A través del **primer objetivo**, nos dedicamos a **analizar** a profundidad los requerimientos ecofisiológicos de las orquídeas, las labores agronómicas de PristinoPlant y las tecnologías IoT disponibles, permitiéndonos delimitar los casos de uso y las especificaciones funcionales del sistema.
```
> * Seguidamente, en el **segundo objetivo**, procedimos a **diseñar** la arquitectura desacoplada en cuatro capas, el circuito hidráulico presurizado multilínea, los esquemas electrónicos del tablero de control y los modelos de persistencia de datos.»
```
### Frase de Transición hacia Lámina 4
> *«Una vez consolidados los modelos de diseño, la ruta de ingeniería avanzó hacia la materialización física, la experimentación y el cierre documental...»*
```
---
```
## Lámina 4: Objetivos Específicos (Parte 2)
```
### Estructura y Contenido en Lámina
```
* **Título:** `OBJETIVOS ESPECÍFICOS`
* **Ítem ③:**
  > *Implementar el sistema de gestión de invernaderos basado en agricultura inteligente para el cultivo de orquídeas, según el diseño realizado.*
* **Ítem ④:**
  > *Validar el sistema de gestión de invernaderos basado en agricultura inteligente para el cultivo de orquídeas, respecto al análisis realizado.*
* **Ítem ⑤:**
  > *Realizar la documentación formal del sistema de gestión de invernaderos basado en agricultura inteligente para el cultivo de orquídeas.*
```
### Discurso / Pitch Oral (Tiempo estimado: ~50 segundos)
```
> «Las tres etapas restantes completaron el ciclo de vida del proyecto:
```
> * En el **tercer objetivo**, nos enfocamos en **implementar** la solución: ensamblamos el tablero de potencia, desplegamos las estaciones meteorológicas en campo, programamos el firmware en MicroPython sobre ESP32 y construimos los servicios en la nube junto con la aplicación web.
```
> * En el **cuarto objetivo**, procedimos a **validar** el comportamiento del sistema in situ, evaluando la precisión de los motores de inferencia meteorológica e hídrica y la estabilidad del circuito hidráulico frente a condiciones ambientales reales.
```
> * Finalmente, el **quinto objetivo** consistió en **documentar** formalmente los manuales técnicos, de operación y de usuario, asegurando la sostenibilidad del prototipo y la transferencia tecnológica efectiva.»
```
### Frase de Transición hacia Lámina 5
> *«El cumplimiento de estos objetivos de ingeniería se tradujo en aportes tangibles para el sector, comenzando por los aportes tecnológicos...»*
```
---
```
## Lámina 5: Aportes Tecnológicos
```
### Estructura y Contenido en Lámina
```
* **Título:** `APORTES TECNOLÓGICOS`
* **Ítem ①:**
  * **Título:** `ARQUITECTURA REPRODUCIBLE (ODS 9).`
  * **Texto:** *Hardware libre (ESP32), impresión 3D y MQTT/TLS.*
* **Ítem ②:**
  * **Título:** `AUTONOMÍA DELIBERATIVA.`
  * **Texto:** *Motor de inferencia de lluvia y Motor de inferencia de riego.*
* **Ítem ③:**
  * **Título:** `TRANSFERENCIA TECNOLÓGICA.`
  * **Texto:** *Conocimiento abierto aplicable por PristinoPlant y la SOC.*
```
### Discurso / Pitch Oral (Tiempo estimado: ~50 segundos)
```
> «En el plano de la ingeniería, el proyecto consolida tres aportes tecnológicos medulares:
```
> 1. Primero, una **arquitectura reproducible alineada al ODS 9**: demostramos que es posible implementar un sistema IoT industrial y robusto a bajo costo, prescindiendo de costosos kits propietarios al integrar microcontroladores de código abierto ESP32, manufactura aditiva 3D y comunicación cifrada MQTT/TLS.
> 2. Segundo, dotamos a la infraestructura de **autonomía deliberativa**: el sistema no opera con simples temporizadores; integra un **motor de inferencia meteorológica** que detecta lluvia sin depender de sensores físicos corrosivos y un **motor de inferencia hídrica** que delibera vetos preventivos de riego en tiempo real.
> 3. Y tercero, la **transferencia tecnológica**: generamos un cuerpo de conocimiento práctico sobre diseño y construcción de invernaderos inteligentes aplicable tanto por PristinoPlant como por la Sociedad Orquideológica del Caroní.»
```
### Frase de Transición hacia Lámina 6
> *«En paralelo a estos avances técnicos, la plataforma genera un impacto directo en la operación agronómica y la sostenibilidad del cultivo...»*
```
---
```
## Lámina 6: Aportes Funcionales
```
### Estructura y Contenido en Lámina
```
* **Título:** `APORTES FUNCIONALES`
* **Ítem ①:**
  * **Título:** `EFICIENCIA HÍDRICA (ODS 6).`
  * **Texto:** *Veto deliberativo que suspende el riego ante lluvia o saturación.*
* **Ítem ②:**
  * **Título:** `RESILIENCIA CLIMÁTICA (ODS 13).`
  * **Texto:** *Supervisión continua frente a picos térmicos e hidroclimáticos.*
* **Ítem ③:**
  * **Título:** `VALOR FENOLÓGICO Y COMERCIAL.`
  * **Texto:** *Gemelo digital con historial de floración y catálogo e-commerce.*
```
### Discurso / Pitch Oral (Tiempo estimado: ~50 segundos)
```
> «En el ámbito operativo y ambiental, los aportes funcionales destacan en tres frentes:
```
> 1. En la **eficiencia hídrica bajo el ODS 6**, optimizamos el consumo de agua dulce gracias al veto deliberativo, el cual cancela automáticamente los accionamientos si el sustrato o el ambiente ya están saturados, erradicando riegos redundantes.
> 2. En la **resiliencia climática bajo el ODS 13**, dotamos al cultivador de supervisión continua para mitigar los picos de estrés térmico superiores a 34 °C mediante rutinas planificadas y datos objetivos.
> 3. Y en el **valor fenológico y comercial**, transformamos el orquideario mediante el concepto de **gemelo digital**: cada planta física cuenta con un registro unívoco de su historial y frecuencia de floración anual, conectando el seguimiento biológico directamente con el catálogo del comercio electrónico.»
```
### Frase de Transición hacia Lámina 7
> *«Habiendo expuesto el impacto funcional y tecnológico del proyecto, corresponde analizar los estándares de ingeniería y fundamentos científicos que sustentan la solución...»*
```
---
```
## Lámina 7: Marco Teórico
```
### Estructura y Contenido en Lámina
```
* **Título:** `MARCO TEÓRICO`
* **Cintillo Superior:**
  > *Estándares de ingeniería, protocolos seguros y ecofisiología vegetal.*
```
```
 ┌────────────────────────────────────┐  ┌────────────────────────────────────┐
 │        ARQUITECTURA EN CAPAS       │  │      COMUNICACIÓN TELEMÉTRICA      │
 │ • Modelo de 4 capas para IoTS.     │  │ • Protocolo MQTT (Pub/Sub M2M).    │
 │ • Desacoplamiento hardware, red,   │  │ • Cifrado robusto TLS v1.2.        │
 │   datos y aplicación.              │  │ • Cargas útiles JSON livianas.     │
 ├────────────────────────────────────┤  ├────────────────────────────────────┤
 │        PERSISTENCIA POLÍGLOTA      │  │     MICROCLIMA Y ECOFISIOLOGÍA     │
 │ • InfluxDB: Ingesta masiva de      │  │ • Magnitudes base (T, HR, Luz):    │
 │   series temporales microclimáticas│  │   Telemetría base para alimentar   │
 │ • PostgreSQL: Transaccionalidad    │  │   los motores de inferencia.       │
 │   ACID para inventario y lógica    │  │ • Analítica avanzada (VPD y DLI):  │
 │   de negocio.                      │  │   Datos agronómicos procesados.    │
 └────────────────────────────────────┘  └────────────────────────────────────┘
```
```
### Discurso / Pitch Oral (Tiempo estimado: ~75 segundos)
```
> «Para materializar esta solución era indispensable fundamentar el sistema en estándares consolidados de ingeniería informática articulados con la realidad agronómica y biológica del cultivo.
```
> La base teórica se estructuró en cuatro pilares:
```
> 1. Primero, a nivel estructural, adoptamos el **Modelo de 4 capas para IoTS de Gubbi et al.** Esto nos permitió un **desacoplamiento total**: aislar la percepción física en campo, del transporte de red, la persistencia en la nube y la capa de aplicación web, asegurando que cualquier falla en un sensor no comprometa la disponibilidad del sistema.
> 2. Segundo, en la **comunicación telemétrica**, seleccionamos el estándar **MQTT bajo el patrón Publicación/Suscripción**. Es un protocolo sumamente liviano para redes restringidas que opera con cargas útiles JSON y, de manera crítica, implementa **cifrado robusto TLS v1.2** sobre el puerto 8883 con autenticación individual, blindando los comandos de conmutación de potencia contra accesos no autorizados.
> 3. Tercero, resolvimos el almacenamiento mediante una **persistencia políglota**: utilizamos **InfluxDB**, una base de datos de series temporales especializada en absorber la ingesta masiva y continua de telemetría sin bloqueos; y la complementamos con **PostgreSQL**, garantizando **consistencia transaccional ACID** para el inventario unívoco, los usuarios y la lógica de negocio.
> 4. Y finalmente, en las **variables ecofisiológicas y microclimáticas**, el proyecto abordó dos niveles:
>    * Por un lado, realizamos un **análisis exhaustivo de las tres magnitudes físicas fundamentales: temperatura, humedad relativa e iluminancia**, segmentándolas en **rangos de trabajo** y correlacionando el microclima interior con el exterior. Esta comprensión profunda del comportamiento ambiental fue la base matemática indispensable para **codificar y calibrar los motores de inferencia** (detección de lluvia y veto hídrico preventivo), reflejados de forma intuitiva para el cultivador en la interfaz `/monitoring`.
>    * Y por otro lado, el sistema procesa estas lecturas hacia métricas biofísicas avanzadas como el **Déficit de Presión de Vapor (VPD)** y la **Integral de Luz Diaria (DLI)** en la interfaz `/botanics`. Dado que el cultivador no está aún familiarizado con estos conceptos complejos, incorporamos una **guía formativa interactiva** en la plataforma, permitiéndole aprender progresivamente a interpretar el estrés vegetal para la **preservación del velamen radicular y la prevención de anoxia**.»
```
### Frase de Transición hacia Lámina 8
> *«Ahora bien, contar con fundamentos teóricos sólidos no es suficiente si no se dispone de una metodología capaz de gobernar un proyecto donde convergen software en la nube, microcontroladores y tuberías presurizadas...»*
```
---
```
## Lámina 8: Marco Metodológico
```
### Estructura y Contenido en Lámina
```
* **Título:** `MARCO METODOLÓGICO`
* **Subtítulo:** *Ciclo de vida híbrido adaptado a la convergencia hardware-software*
```
```
 ┌────────────────────────────────────┬────────────────────────────────────┐
 │         MODELO INCREMENTAL         │        METODOLOGÍA TDDM4IoTS       │
 │            (Pressman)              │       (Guerrero-Ulloa et al.)      │
 ├────────────────────────────────────┼────────────────────────────────────┤
 │ • 7 Incrementos Funcionales:       │ • Ciclo Test-Driven:               │
 │   Entregables operativos evaluables│   - Pre-implementación: Pruebas    │
 │   y desplegados in situ.           │     unitarias y banco de pruebas.  │
 │                                    │   - Despliegue: Validación real    │
 │ • Prototipado Secuencial:          │     en condiciones de orquideario. │
 │   Cada funcionalidad se itera y    │   - Refactorización continua:      │
 │   estabiliza antes de construir el │     Evolución y cierre antes de    │
 │   siguiente nivel de complejidad.  │     avanzar al siguiente incremento│
 │                                    │                                    │
 │ • Mitigación de Riesgos:           │ • Observabilidad:                  │
 │   Supera la rigidez de la cascada  │   Interfaces de depuración y       │
 │   y la inviabilidad de Scrum puro. │   auditoría (debugging-iot,        │
 │                                    │   monitoring, scheduler).          │
 └────────────────────────────────────┴────────────────────────────────────┘
```
```
### Discurso / Pitch Oral (Tiempo estimado: ~80 segundos)
```
> «Por esta razón, diseñamos una estrategia metodológica híbrida que separa la gobernanza temporal de la rigurosidad técnica de ingeniería:
```
> Como **macroestructura de gestión**, seleccionamos el **Modelo Incremental de Pressman**, articulado en **7 incrementos funcionales con entregables operativos desplegados in situ**.  
> ¿Por qué este modelo? Porque en sistemas embebidos y de control físico existe una **dependencia jerárquica estricta**: era técnicamente inviable programar la aplicación web o los motores de inferencia sin haber estabilizado previamente el tablero eléctrico, la bomba de 1 HP y la red hidráulica. El prototipado secuencial nos permitió aislar y validar cada funcionalidad antes de elevar la complejidad, **superando la rigidez tardía de la cascada y la inviabilidad física de Scrum puro**, el cual asume que todo componente físico se puede refactorizar en código en un sprint de dos semanas.
```
> En paralelo, como **microestructura técnica especializada en IoT**, adoptamos la metodología **TDDM4IoTS de Guerrero-Ulloa et al.**, aplicando un **ciclo Test-Driven continuo** en cada incremento:  
> 1. En la **pre-implementación**, iteramos y calibramos en banco de pruebas simulando señales y cargas.  
> 2. Durante el **despliegue**, sometimos el módulo a las condiciones reales de intemperie y calor del orquideario.  
> 3. Y mediante **refactorización continua**, pulimos tanto el firmware como el backend hasta estabilizar por completo el entregable antes de autorizar la transición al siguiente incremento.
```
> Por último, dado que la interacción entre hardware y software es imperceptible a simple vista, desarrollamos **herramientas propias de observabilidad y depuración** como el panel `/admin`, el módulo `/monitoring` y la trazabilidad del *Scheduler*, garantizando control, certidumbre y auditoría total durante todo el desarrollo.»
```
### Puente de Entrada hacia el Capítulo IV (Desarrollo y Resultados)
> *«Respaldados por estos estándares teóricos y bajo esta gobernanza metodológica incremental, procedemos a revisar la ingeniería de detalle, la construcción física y los resultados de validación obtenidos en cada una de las fases del sistema.»*
```
---
```
## Resumen de Tiempos y Ritmo Acumulado
```
| Lámina | Contenido Principal | Tiempo Estimado | Ritmo de Exposición |
| :--- | :--- | :---: | :--- |
| **Lámina 1** | Planteamiento del Problema | 1 min 30 s | Ritmo pausado, empático con el dolor agronómico |
| **Lámina 2** | Objetivo General | 0 min 30 s | Claro, enfático, apoyado en el gráfico del tablero |
| **Lámina 3** | Objetivos Específicos (Parte 1: 1 y 2) | 0 min 40 s | Secuencial, conceptual (Análisis y Diseño) |
| **Lámina 4** | Objetivos Específicos (Parte 2: 3, 4 y 5) | 0 min 50 s | Práctico, ingenieril (Implementar, Validar, Documentar) |
| **Lámina 5** | Aportes Tecnológicos | 0 min 50 s | Innovador, resolución en silicio e inferencia |
| **Lámina 6** | Aportes Funcionales | 0 min 50 s | Sostenibilidad (ODS) y valor comercial (Gemelo digital) |
| **Lámina 7** | Marco Teórico | 1 min 10 s | Técnico, resolutivo, arquitectura y protocolos |
| **Lámina 8** | Marco Metodológico | 1 min 20 s | Firmeza de criterio: Pressman + TDDM4IoTS |
| **Total** | **Apertura y Fundamentación** | **~7 min 40 s** | **Ventana perfecta para dedicar ~12 min al Capítulo IV** |
```
```
---
```
# CAPÍTULO IV: DESARROLLO Y RESULTADOS DE INGENIERÍA
```
---
```
## Fase 1: Análisis y Estudio Inicial
```
### Lámina 1.1: Requisitos de Dominio y Entorno de Cultivo
* **Título:** `FASE 1: REQUISITOS DE DOMINIO Y ENTORNO`
* **Píldora de Subtítulo:** `Diagnóstico agroclimático del cultivo de orquídeas en Guayana`
* **Estructura Visual:** 3 tarjetas horizontales de ancho completo.
```
#### Elementos de Contenido
* **Tarjeta 1: Fisiología de Orquídeas Epífitas:** `El velamen radicular demanda ciclos rápidos de hidratación y aireación profunda.` (79 caracteres)
* **Tarjeta 2: Microclima Hiperlocal:** `Picos térmicos de 34 °C y 45% HR bajo malla sombra exigen regulación térmica.` (78 caracteres)
* **Tarjeta 3: Riesgo Radicular Frecuente:** `El encharcamiento prolongado detona asfixia por anoxia y proliferación fúngica.` (79 caracteres)
```
#### Discurso de Defensa (~35 seg)
> «El desarrollo del sistema inició en el invernadero con la caracterización fisiológica de la familia *Orchidaceae*. Al ser especies epífitas, sus raíces absorben agua velozmente a través del velamen radicular pero requieren una inmediata oxigenación; si el sustrato permanece saturado, la planta colapsa por anoxia en menos de 48 horas. En el clima de Guayana, registramos picos de 34 °C y humedades relativas de 45% que obligaban a regar a ciegas para bajar la temperatura. Esta contradicción entre el calor sofocante y el peligro de pudrición estableció el requisito agronómico central: sustituir el criterio empírico por un control ambiental preciso y deliberativo.»
```
---
```
### Lámina 1.2: Requisitos Funcionales del Sistema
* **Título:** `FASE 1: REQUISITOS FUNCIONALES DEL SISTEMA`
* **Píldora de Subtítulo:** `Capacidades operativas prioritarias identificadas`
* **Estructura Visual:** Opción 1 (4 píldoras con título separado de contenido).
```
#### Elementos de Contenido
1. `[Riego por zonas]` → `Accionamiento independiente de líneas hidráulicas según propósitos agronómicos.` (80 caracteres)
2. `[Telemetría in situ]` → `Captura continua de temperatura, humedad, iluminancia y lluvia local en tiempo real.` (84 caracteres)
3. `[Formulación guiada]` → `Cálculo asistido de dosis de agroquímicos y fertilizantes según volumen de agua.` (80 caracteres)
4. `[Alertas y bot móvil]` → `Notificaciones interactivas en Telegram con confirmación Human-in-the-Loop.` (75 caracteres)
```
#### Discurso de Defensa (~35 seg)
> «Del diagnóstico agronómico derivamos cuatro requisitos funcionales indispensables: primero, la sectorización del riego para comandar de forma independiente líneas de microaspersión, nebulización y agroquímicos; segundo, la instrumentación de telemetría in situ para medir temperatura, humedad, iluminancia y lluvia en el propio microclima; tercero, la formulación agronómica guiada para eliminar los errores humanos al mezclar fertilizantes y fungicidas; y cuarto, un canal de notificaciones en tiempo real vía Telegram que involucra al cultivador antes de cualquier aplicación química mediante el patrón *Human-in-the-Loop*.»
```
---
```
### Lámina 1.3: Requisitos No Funcionales y Criterios de Rendimiento
* **Título:** `FASE 1: REQUISITOS NO FUNCIONALES Y CRITERIOS`
* **Píldora de Subtítulo:** `Fiabilidad, latencia, seguridad y autonomía operativa`
* **Estructura Visual:** Opción 1 (4 píldoras con título separado de contenido).
```
#### Elementos de Contenido
1. `[Alta resiliencia]` → `Operación local autónoma y fail-safe ante cortes de red WiFi o caída del servidor.` (83 caracteres)
2. `[Baja latencia]` → `Respuesta de conmutación electromecánica menor a dos segundos desde el comando web.` (84 caracteres)
3. `[Transporte seguro]` → `Cifrado punto a punto mediante MQTTS (TLS 1.2) y autenticación estricta por roles.` (83 caracteres)
4. `[Bajo consumo]` → `Ciclos de Deep Sleep en estaciones portables para maximizar la autonomía energética.` (84 caracteres)
```
#### Discurso de Defensa (~35 seg)
> «En paralelo, definimos los requisitos no funcionales que condicionan la estabilidad técnica: la resiliencia física ante contingencias, garantizando que un corte de internet nunca deje una válvula abierta; una latencia de conmutación inferior a dos segundos para un mando reactivo; seguridad y transporte cifrado mediante MQTTS bajo TLS para proteger las órdenes de campo; y una estricta eficiencia energética mediante modos de reposo profundo en nodos portables que conviven entre las orquídeas sin cables de alimentación.»
```
---
```
### Lámina 1.4: Selección Justificada del Stack Tecnológico
* **Título:** `FASE 1: SELECCIÓN DEL STACK TECNOLÓGICO`
* **Píldora de Subtítulo:** `Convergencia de tecnologías robustas y de código abierto`
* **Estructura Visual:** Opción 1 (4 píldoras con título separado de contenido).
```
#### Elementos de Contenido
1. `[Hardware embebido]` → `Microcontroladores ESP32 por su doble núcleo, conectividad WiFi y bajo costo.` (79 caracteres)
2. `[Firmware reactivo]` → `MicroPython con uasyncio para orquestar concurrencia sin bloquear el silicio.` (78 caracteres)
3. `[Servidor e ingesta]` → `Node.js y Docker Compose unificando PostgreSQL 17 y motor InfluxDB 3-core.` (74 caracteres)
4. `[Frontend interactivo]` → `Next.js y Tailwind CSS construyendo interfaces propias sin librerías pesadas.` (78 caracteres)
```
#### Discurso de Defensa (~35 seg)
> «Para materializar estos requerimientos seleccionamos un stack de código abierto de alta confiabilidad: microcontroladores ESP32 de doble núcleo por su versatilidad de radio y coste; MicroPython con la librería asíncrona uasyncio en el firmware para ejecutar múltiples corrutinas sin colapsar la memoria; una arquitectura contenerizada en Docker con PostgreSQL 17 relacional e InfluxDB 3-core para telemetría continua; y Next.js con Tailwind CSS en la web, diseñando componentes nativos a medida para evitar la pesadez de librerías visuales de terceros.»
```
---
```
## Fase 2: Diseño Conceptual
```
### Lámina 2.1: Arquitectura Conceptual y Segregación por Capas (C4)
* **Título:** `FASE 2: ARQUITECTURA CONCEPTUAL (C4)`
* **Píldora de Subtítulo:** `Descomposición modular en tres capas de responsabilidad aislada`
* **Estructura Visual:** 3 tarjetas horizontales de ancho completo.
```
#### Elementos de Contenido
* **Tarjeta 1: Capa de Campo (Edge):** `Nodos ESP32 ejecutando lectura sensorial, conmutación física y guardas locales.` (80 caracteres)
* **Tarjeta 2: Capa de Servidor (Core):** `Bróker Mosquitto, Ingest telemétrico y Scheduler con deliberación determinista.` (79 caracteres)
* **Tarjeta 3: Capa de Usuario (App):** `Plataforma web en Next.js y bot en Telegram para supervisión remota interactiva.` (81 caracteres)
```
#### Discurso de Defensa (~35 seg)
> «Bajo el modelo C4 estructuramos el sistema en tres capas estrictamente desacopladas: la Capa de Campo, compuesta por los nodos embebidos que instrumentan sensores y gobiernan los relés con salvaguardas de corte local; la Capa de Servidor, que aloja el bróker de mensajería, el servicio Ingest y el motor deliberativo Scheduler; y la Capa de Usuario, que proporciona interfaces web reactivas y un bot en Telegram, logrando que la caída de un nivel jamás comprometa la integridad de los demás.»
```
---
```
### Lámina 2.2: Modelo de Datos Híbrido
* **Título:** `FASE 2: MODELO DE DATOS HÍBRIDO`
* **Píldora de Subtítulo:** `Coexistencia de base de datos relacional y series temporales`
* **Estructura Visual:** Opción 2 (Banner principal + 3 píldoras con título separado).
```
#### Elementos de Contenido
- **Banner Superior:** `SEGREGACIÓN DE DATOS TRANSACCIONALES FRENTE A RÁFAGAS TELEMÉTRICAS` (65 caracteres)
1. `[Modelo relacional]` → `PostgreSQL gestiona usuarios, catálogo botánico, rutinas y trazabilidad Prisma.` (80 caracteres)
2. `[Series temporales]` → `InfluxDB almacena métricas ambientales de alta frecuencia sin degradar consultas.` (82 caracteres)
3. `[Object Storage R2]` → `Cloudflare R2 almacena fotografías botánicas desacopladas de la base de datos.` (79 caracteres)
```
#### Discurso de Defensa (~35 seg)
> «Un error recurrente en proyectos IoT es almacenar lecturas ambientales en bases de datos relacionales, saturando los índices. Diseñamos un modelo híbrido: PostgreSQL con Prisma ORM administra exclusivamente las entidades transaccionales como usuarios, especies botánicas y órdenes programadas; mientras InfluxDB 3-core asume las series temporales de alta frecuencia, garantizando retención histórica continua y agregaciones instantáneas sin ralentizar el servidor.»
```
---
```
### Lámina 2.3: Flujo de Deliberación y Lógica de Riego
* **Título:** `FASE 2: FLUJO DE DELIBERACIÓN Y RIEGO`
* **Píldora de Subtítulo:** `Ciclo de decisión del Scheduler y supervisión determinista de vetos`
* **Estructura Visual:** 3 tarjetas horizontales de ancho completo.
```
#### Elementos de Contenido
* **Tarjeta 1: Disparador Temporal:** `El Scheduler evalúa cada 60 segundos las tareas programadas activas en la BD.` (78 caracteres)
* **Tarjeta 2: Evaluación de Vetos:** `Comprueba lluvia in situ, ventanas de cese pluvial y el estado de la red física.` (80 caracteres)
* **Tarjeta 3: Despacho Confiable:** `Publica comandos de conmutación temporizados con acuse de recibo y bitácora.` (76 caracteres)
```
#### Discurso de Defensa (~35 seg)
> «La inteligencia del sistema reside en el flujo deliberativo del Scheduler. Cada 60 segundos, el motor consulta las tareas pendientes en la base de datos relacional. Antes de emitir cualquier orden, interroga a InfluxDB para evaluar las condiciones microclimáticas: si detecta lluvia reciente o suelo anegado, veta la orden de inmediato y registra la justificación agronómica en la bitácora histórica. Solo si el entorno es seguro, despacha el comando hacia el hardware con tiempos de corte garantizados.»
```
---
```
## Fase 3: Diseño Básico
```
### Lámina 3.1: Selección de Hardware y Topología Distribuida
* **Título:** `FASE 3: SELECCIÓN DE HARDWARE Y TOPOLOGÍA`
* **Píldora de Subtítulo:** `Distribución física de nodos y buses de instrumentación`
* **Estructura Visual:** Opción 1 (4 píldoras con título separado de contenido).
```
#### Elementos de Contenido
1. `[Nodo actuador]` → `ESP32 central gobernando módulo relé de 4 canales y bomba periférica de 1 HP.` (78 caracteres)
2. `[EMA exterior]` → `Sensores protegidos a la intemperie (DHT22, BH1750, lluvia) alimentados a 5VDC.` (79 caracteres)
3. `[EMA interior]` → `Estación portable en garita Stevenson 3D operando bajo batería y Deep Sleep.` (77 caracteres)
4. `[Buses aislados]` → `Conexiones I2C, One-Wire y señales digitales con aislamiento optoacoplado.` (75 caracteres)
```
#### Discurso de Defensa (~35 seg)
> «En el diseño básico definimos la topología física del invernadero dividiendo los roles de campo: un Nodo Actuador energizado permanentemente en el tablero eléctrico para conmutar la bomba de 1 HP y las electroválvulas; una Estación Exterior (EMA) cableada para medir radiación y lluvia continua; y una Estación Interior (EMA) portable en garita impresa en 3D para monitorear el microclima entre las plantas. Cada sensor se conectó a buses dedicados con aislamiento optoacoplado en las bobinas de relé para proteger los microcontroladores de ruidos inductivos.»
```
---
```
### Lámina 3.2: Arquitectura Lógica de Servicios Contenerizados
* **Título:** `FASE 3: ARQUITECTURA DE SERVICIOS EN DOCKER`
* **Píldora de Subtítulo:** `Orquestación modular en VPS mediante Docker Compose`
* **Estructura Visual:** 3 tarjetas horizontales de ancho completo.
```
#### Elementos de Contenido
* **Tarjeta 1: Base de Datos y Telemetría:** `Contenedores dedicados para PostgreSQL 17.3 y motor InfluxDB 3-core con TLS.` (77 caracteres)
* **Tarjeta 2: Mensajería y Automatización:** `Instancia Eclipse Mosquitto con puertos segregados y motor de flujos n8n.` (74 caracteres)
* **Tarjeta 3: Microservicios Core:** `Demonios Ingest y Scheduler desacoplados en Node.js corriendo 24/7 en Linux.` (76 caracteres)
```
#### Discurso de Defensa (~35 seg)
> «Para el entorno de backend estructuramos una arquitectura contenerizada sobre Docker Compose en Linux Ubuntu Server. Esta separación por servicios garantiza que la base de datos relacional, el almacén telemétrico InfluxDB, el bróker de mensajería Mosquitto y los procesos de fondo Ingest y Scheduler operen en entornos aislados con reinicio automático ante fallos, compartiendo volúmenes de almacenamiento persistente y certificados de seguridad compartidos.»
```
---
```
### Lámina 3.3: Comunicación y Flujo de Datos (MQTT Pub/Sub)
* **Título:** `FASE 3: COMUNICACIÓN Y MENSAJERÍA MQTT`
* **Píldora de Subtítulo:** `Topología Pub/Sub, jerarquía de tópicos y entrega confiable con QoS 1`
* **Estructura Visual:** Opción 1 (4 píldoras con título separado de contenido).
```
#### Elementos de Contenido
1. `[Tópicos jerárquicos]` → `Estructura por dispositivo, magnitud y canal (cmd, status, readings, state).` (78 caracteres)
2. `[Garantía QoS 1]` → `Comandos críticos de conmutación despachados con acuse de recibo obligatorio.` (78 caracteres)
3. `[Estado LWT]` → `Mensaje Last Will retiene desconexiones abruptas del nodo en el servidor.` (74 caracteres)
4. `[Segregación de red]` → `Aislamiento de tráfico telemétrico frente a órdenes de control electromecánico.` (80 caracteres)
```
#### Discurso de Defensa (~35 seg)
> «La comunicación se diseñó sobre el protocolo MQTT bajo una jerarquía semántica de tópicos que independiza los canales de telemetría de las órdenes de control. Para los comandos de riego implementamos calidad de servicio QoS 1 con acuse de recibo obligatorio, asegurando que ninguna orden se extravíe; mientras que para la supervisión de vida útil empleamos mensajes Last Will and Testament retenidos, permitiendo que el servidor detecte de inmediato si un nodo pierde conexión física o alimentación.»
```
---
```
## Fase 4: Diseño Detallado
```
### Lámina D.1A: Tablero y Circuito Eléctrico (Potencia y Control)
* **Título:** `DISEÑO DETALLADO: TABLERO Y CIRCUITO ELÉCTRICO`
* **Píldora de Subtítulo:** `Distribución de potencia trifrontal: 110VAC, 24VAC y 5VDC`
* **Estructura Visual:** 3 tarjetas horizontales de ancho completo.
```
#### Elementos de Contenido
* **Tarjeta 1: Línea de Fuerza (110VAC):** `Alimentación general y mando de bomba periférica mediante contactor de 30A.` (76 caracteres)
* **Tarjeta 2: Línea Hidráulica (24VAC):** `Transformador de 40VA gobernando electroválvulas solenoides con total seguridad.` (80 caracteres)
* **Tarjeta 3: Línea de Control (5VDC):** `Fuente conmutada para nodo ESP32, relevadores optoacoplados y sensores de campo.` (81 caracteres)
```
#### Discurso de Defensa (~35 seg)
> «En el diseño eléctrico detallado segregamos tres niveles de tensión indispensables para la seguridad en entornos húmedos: una línea de fuerza a 110 VAC que alimenta la motobomba de 1 HP a través de un contactor industrial de 30 amperios, aislando los picos inductivos de los relés; una línea de 24 VAC derivada de un transformador de 40 VA para conmutar las electroválvulas de riego bajo voltaje seguro para humanos; y una línea estabilizada a 5 VDC para alimentar la electrónica del ESP32 y los sensores.»
```
---
```
### Lámina D.1B: Circuito Hidráulico Presurizado
* **Título:** `DISEÑO DETALLADO: CIRCUITO HIDRÁULICO PRESURIZADO`
* **Píldora de Subtítulo:** `Impulsión, filtrado, cebado y distribución modular en 4 líneas`
* **Estructura Visual:** Opción 1 (4 píldoras con título separado de contenido).
```
#### Elementos de Contenido
1. `[Bomba de impulsión]` → `Bomba periférica de 1 HP presurizando el cabezal a 40 PSI en régimen estable.` (78 caracteres)
2. `[Filtrado de anillas]` → `Filtro de 120 mesh que previene la obturación de microaspersores y boquillas.` (77 caracteres)
3. `[Entradas duales]` → `Electroválvulas de selección entre suministro de agua limpia o agroquímicos.` (77 caracteres)
4. `[Distribución cuádruple]` → `Cuatro líneas de salida para aspersión, nebulización, fertilización y suelo.` (77 caracteres)
```
#### Discurso de Defensa (~35 seg)
> «El cabezal hidráulico se dimensionó para garantizar presiones uniformes de 40 PSI a lo largo de todas las mesas de cultivo. El circuito incorpora una bomba periférica de 1 HP con válvula antirretorno y cebado automático, un filtro de anillas de 120 mesh para evitar la obstrucción de los microaspersores por sedimentos, dos válvulas de entrada para alternar entre agua pura y el tanque de fertilización, y un múltiple de cuatro electroválvulas de salida dedicadas a los diferentes sectores de la plantación.»
```
---
```
### Lámina D.2A: Firmware Embebido y Resiliencia en Silicio
* **Título:** `DISEÑO DETALLADO: FIRMWARE Y RESILIENCIA EN SILICIO`
* **Píldora de Subtítulo:** `Concurrencia uasyncio, exclusión mutua y cortes fail-safe`
* **Estructura Visual:** 3 tarjetas horizontales de ancho completo.
```
#### Elementos de Contenido
* **Tarjeta 1: Bucle No Bloqueante:** `Runtime reactivo en MicroPython basado en corrutinas asíncronas uasyncio.` (74 caracteres)
* **Tarjeta 2: Exclusión Mutua (Lock):** `Candado asyncio.Lock protegiendo el canal de red contra colisión de tramas SSL.` (80 caracteres)
* **Tarjeta 3: Salvaguarda Fail-Safe:** `Temporizador local de seguridad que corta el paso de agua si se pierde la red.` (79 caracteres)
```
#### Discurso de Defensa (~35 seg)
> «El firmware del ESP32 fue concebido como un runtime reactivo de alta confiabilidad. Empleando uasyncio, el microcontrolador gestiona en paralelo la lectura de sensores, la escucha de red y el gobierno de relés sin congelamientos. Implementamos un candado de exclusión mutua asyncio.Lock que impide que una publicación telemétrica colisione con un comando entrante, y una salvaguarda fail-safe en el silicio que apaga la bomba y cierra las válvulas automáticamente si expira el tiempo prefijado, garantizando que el sistema sea inmune a caídas de red.»
```
---
```
### Lámina D.2B: Motores de Inferencia Deterministas
* **Título:** `DISEÑO DETALLADO: MOTORES DE INFERENCIA`
* **Píldora de Subtítulo:** `Deliberación algorítmica determinista para la protección del cultivo`
* **Estructura Visual:** Opción 2 (Banner superior + 3 píldoras con título separado).
```
#### Elementos de Contenido
- **Banner Superior:** `MODELOS MATEMÁTICOS DE DELIBERACIÓN EN EL SCHEDULER` (49 caracteres)
1. `[Inferencia de lluvia]` → `Derivadas higrotérmicas en ventanas deslizantes de 10 a 30 min por ramas de luz.` (81 caracteres)
2. `[Criterios de cese]` → `Cuatro reglas deterministas por recuperación solar, ascenso térmico o sequedad.` (80 caracteres)
3. `[Inferencia hídrica]` → `Jerarquía EMA Interior/Exterior, ventanas de veto pluvial y alternancia de riego.` (82 caracteres)
```
#### Discurso de Defensa (~35 seg)
> «Para dotar al sistema de criterio agronómico sin recurrir a modelos de caja negra, desarrollamos motores de inferencia deterministas en el Scheduler. El algoritmo detecta eventos de lluvia evaluando caídas bruscas en la radiación solar acopladas a saltos positivos en la humedad relativa y caídas de temperatura en ventanas deslizantes de 10 a 30 minutos. Al validarse la lluvia o registrarse una ventana de cese insuficiente, el motor emite un veto hídrico preventivo que suspende los riegos automáticos, protegiendo las raíces de la asfixia por anoxia.»
```
---
```
## Fase 5: Construcción e Implementación Incremental
```
---
```
### Incremento 1: Plataforma Base y Modelo de Dominio
* **Título:** `INCREMENTO 1: PLATAFORMA BASE Y MODELO DE DOMINIO`
* **Píldora de Subtítulo:** `Configuración del repositorio, diseño UI/UX y modelado de datos`
* **Estructura Visual:** Opción 1 (4 píldoras con título separado de contenido).
```
#### Elementos de Contenido
1. `[Monorepositorio]` → `Turborepo modular para integrar firmware, microservicios, base de datos y app web.` (83 caracteres)
2. `[Diseño UI/UX]` → `Componentes construidos a medida, prescindiendo de librerías visuales de terceros.` (82 caracteres)
3. `[Modelo de dominio]` → `Esquema Prisma: inventario botánico, usuarios, rutinas hidráulicas y dosificación.` (83 caracteres)
4. `[Datos semilla]` → `Datos semilla para maquetar la UI/UX y reconstruir la BD de desarrollo.` (72 caracteres)
```
#### Discurso de Defensa (~35 seg)
> «El primer incremento materializó los cimientos del software. Configuramos un monorepositorio con Turborepo que unifica el firmware en MicroPython, los microservicios en TypeScript y la aplicación web. Diseñamos un sistema de diseño UI/UX propio con Tailwind CSS, eliminando librerías de componentes externas para mantener el control total del rendimiento visual. En paralelo, estructuramos el modelo relacional con Prisma ORM definiendo las entidades botánicas, las zonas de riego y los perfiles de usuario, poblando el sistema con datos semilla reproducibles para pruebas.»
```
---
```
### Incremento 2: Infraestructura Física, Conmutación Eléctrica e Hidráulica
```
#### Lámina 2.1: Cabezal Hidráulico Presurizado
* **Título:** `INCREMENTO 2: CABEZAL HIDRÁULICO PRESURIZADO`
* **Píldora de Subtítulo:** `Impulsión, doble línea de entrada y distribución modular en 4 sectores`
* **Layout:** Split 50/50 (Render 3D de ingeniería a la izquierda, 3 tarjetas redondeadas a la derecha).
* **Elementos:**
  1. `Impulsión y cebado`: Bomba periférica de 1 HP presurizando a 40 PSI constantes con válvula antirretorno.
  2. `Filtrado y entradas duales`: Filtro de 120 mesh y selección entre agua limpia o agroquímicos.
  3. `Distribución cuádruple`: Cuatro electroválvulas de 24 VAC para independizar líneas de riego.
* **Pitch (~30 seg):**
  > «En el segundo incremento construimos el cabezal hidráulico presurizado. Integramos la motobomba de 1 HP con cebado continuo, un filtro de anillas para proteger los emisores, y un sistema de entrada dual que permite alternar agua pura con fertilización. A la salida, montamos un múltiple de cuatro electroválvulas de solenoide para gobernar las diferentes áreas de cultivo de forma aislada y segura.»
```
#### Lámina 2.2: Líneas de Riego en Cultivo
* **Título:** `INCREMENTO 2: LÍNEAS DE RIEGO EN CULTIVO`
* **Píldora de Subtítulo:** `Despliegue de microaspersores y cobertura uniforme sobre las orquídeas`
* **Layout:** Split 50/50 (Fotografía de las mesas de cultivo e instalación hidráulica a la izquierda, 3 tarjetas a la derecha).
* **Elementos:**
  1. `Tuberías y emisores`: Tendido en PVC y polietileno con microaspersores calibrados por caudal.
  2. `Distribución sectorizada`: Cobertura uniforme sobre las mesas sin zonas secas ni escurrimientos.
  3. `Pruebas de presión`: Certificación hidráulica a 40 PSI sin fugas mecánicas ni caídas de flujo.
* **Pitch (~30 seg):**
  > «Sobre las mesas de cultivo desplegamos las cuatro líneas de riego. Calibramos la altura y separación de los microaspersores para generar una nube de aspersión homogénea que hidrata el velamen radicular de cada ejemplar sin producir salpicaduras agresivas que dañen las hojas. La red se probó bajo presión nominal continua, validando la estabilidad de flujo en cada sector.»
```
#### Lámina 2.3: Protoboard y Runtime Base
* **Título:** `INCREMENTO 2: PROTOBOARD Y RUNTIME BASE`
* **Píldora de Subtítulo:** `Primer prototipado del runtime y verificación electromecánica local`
* **Layout:** Split 50/50 (Fotografía del circuito en protoboard con ESP32 y relés a la izquierda, 3 tarjetas a la derecha).
* **Elementos:**
  1. `Prototipado en banco`: Montaje en protoboard para validar la conmutación segura del ESP32.
  2. `Runtime uasyncio base`: Primera versión del runtime reactivo gobernando tareas no bloqueantes.
  3. `Verificación en red local`: Pruebas de encendido y corte temporizado mediante MQTT Explorer.
* **Pitch (~30 seg):**
  > «Antes de fabricar el tablero final, prototipamos el circuito de conmutación en protoboard. Aquí desarrollamos la primera versión del runtime reactivo en MicroPython basado en uasyncio, gobernando la cola de mensajes y ejecutando conmutaciones temporizadas mediante MQTT Explorer en red local, certificando que los transitorios eléctricos de los relés no perturbaran al microcontrolador.»
```
#### Lámina 2.4: Tablero Eléctrico Implementado
* **Título:** `INCREMENTO 2: TABLERO ELÉCTRICO IMPLEMENTADO`
* **Píldora de Subtítulo:** `Ensamblaje final con contactor de potencia y aislamiento electromecánico`
* **Layout:** Split 50/50 (Fotografía del tablero de madera terminado y cableado a la izquierda, 3 tarjetas a la derecha).
* **Elementos:**
  1. `Montaje estructurado`: Ensamblaje en tablero con canaletas y regletas de distribución segura.
  2. `Contactor industrial 30A`: Aislamiento de potencia de 110 VAC para proteger la electrónica de control.
  3. `Transformador y fuentes`: Salidas dedicadas de 24 VAC para electroválvulas y 5 VDC para el ESP32.
* **Pitch (~30 seg):**
  > «Con el circuito validado, construimos el tablero de control definitivo. Incorporamos un contactor industrial de 30 amperios para absorber las corrientes de arranque de la motobomba de 1 HP, canalizando por separado la fuerza a 110 VAC, los 24 VAC para las bobinas de las válvulas y los 5 VDC de la electrónica, logrando un montaje robusto y seguro para operar en el orquideario.»
```
---
```
### Incremento 3: Infraestructura Backend Distribuida, Orquestación y Operaciones
```
#### Lámina 3.1: Infraestructura Backend Distribuida
* **Título:** `INCREMENTO 3: INFRAESTRUCTURA BACKEND DISTRIBUIDA`
* **Píldora de Subtítulo:** `Evolución desde Docker local y serverless hasta nube privada autogestionada`
* **Layout:** Opción 1 (4 píldoras con título separado de contenido).
* **Estructura Visual (Canva):**
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ INCREMENTO 3: INFRAESTRUCTURA BACKEND DISTRIBUIDA                                      │
│          ✦ Evolución desde Docker local y serverless hasta nube privada... ✦           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [ Límite serverless]   Next.js en Vercel es sin estado y no admite procesos backend    │
│                        continuos 24/7.                                                 │
│                                                                                        │
│ [ Datos sin caducidad] PostgreSQL sin cuotas y motor InfluxDB con retención histórica  │
│                        indefinida.                                                     │
│                                                                                        │
│ [ Servicios 24/7   ]   Servicio Ingest y Scheduler desacoplados corriendo sin depender │
│                        de la web.                                                      │
│                                                                                        │
│ [ Autonomía operativa] Consolida bases de datos, bróker y microservicios en una        │
│                        infraestructura autosuficiente.                                 │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
* **Elementos:**
  1. `[Límite serverless]` *(17 chars)* → `Next.js en Vercel es sin estado y no admite procesos backend continuos 24/7.` *(76 chars)*
  2. `[Datos sin caducidad]` *(19 chars)* → `PostgreSQL sin cuotas y motor InfluxDB con retención histórica indefinida.` *(74 chars)*
  3. `[Servicios 24/7]` *(14 chars)* → `Servicio Ingest y Scheduler desacoplados corriendo sin depender de la web.` *(74 chars)*
  4. `[Autonomía operativa]` *(19 chars)* → `Consolida bases de datos, bróker y microservicios en una infraestructura autosuficiente.` *(88 chars)*
* **Pitch (~35 seg):**
  > «La verdadera razón técnica de migrar a un VPS autogestionado radica en la naturaleza de Next.js y Vercel: operan bajo un esquema serverless sin estado orientado a peticiones transitorias, lo que impide ejecutar procesos de backend residentes las 24 horas del día de forma continua. A esto se sumaba la necesidad crítica de autoalojar PostgreSQL para no agotar cuotas externas de cómputo, retener la telemetría histórica en InfluxDB de forma indefinida —frente al límite de 30 días de la capa gratuita en la nube— y configurar nuestros propios certificados SSL para el bróker Mosquitto. La respuesta no fue contratar múltiples plataformas externas de pago, sino consolidar una nube privada autosuficiente mediante Docker en el VPS, reuniendo almacenamiento, mensajería y microservicios bajo control propio, sin costos por uso ni dependencia de terceros.»
* **Frase de Transición hacia Lámina 3.2:**
  > *«Una vez definida la infraestructura en el VPS, el siguiente paso fue garantizar que su mantenimiento y despliegue no dependieran de procesos manuales propensos a error, adoptando prácticas de automatización DevOps...»*
```
---
```
#### Lámina 3.2: Automatización de Operaciones (DevOps e IoT-Ops)
* **Título:** `INCREMENTO 3: AUTOMATIZACIÓN DE OPERACIONES (DEVOPS)`
* **Píldora de Subtítulo:** `Prácticas de automatización para despliegue continuo en VPS y microcontroladores`
* **Layout:** Opción 1 (4 píldoras con título separado de contenido).
* **Estructura Visual (Canva):**
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ INCREMENTO 3: AUTOMATIZACIÓN DE OPERACIONES (DEVOPS)                                   │
│    ✦ Prácticas de automatización para despliegue continuo en VPS y microcontroladores ✦│
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [ Despliegue en VPS]   deploy.sh sincroniza Git, orquesta Docker cloud y poda caché    │
│                        automáticamente.                                                │
│                                                                                        │
│ [ Gestión de llaves]   renew_certs.sh automatiza Certbot efímero y permisos por UID    │
│                        en el servidor.                                                 │
│                                                                                        │
│ [ CLI propio mprun ]   Automatiza con flags: compila a .mpy, gestiona librerías        │
│                        por manifest.json y flashea.                                    │
│                                                                                        │
│ [ Actualización OTA]   Al arrancar, el nodo compara su versión contra el manifest y    │
│                        se actualiza.                                                   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
* **Elementos:**
  1. `[Despliegue en VPS]` *(17 chars)* → `deploy.sh sincroniza Git, orquesta Docker cloud y poda caché automáticamente.` *(77 chars)*
  2. `[Gestión de llaves]` *(17 chars)* → `renew_certs.sh automatiza Certbot efímero y permisos por UID en el servidor.` *(76 chars)*
  3. `[CLI propio mprun]` *(16 chars)* → `Automatiza con flags: compila a .mpy, gestiona librerías por manifest.json y flashea.` *(85 chars)*
  4. `[Actualización OTA]` *(17 chars)* → `Al arrancar, el nodo compara su versión contra el manifest y se actualiza.` *(74 chars)*
* **Pitch (~35 seg):**
  > «Un aspecto diferenciador del proyecto fue adoptar prácticas de automatización y operaciones, conocidas como DevOps, tanto en el servidor como en los dispositivos de campo. En el VPS, implementamos scripts propios en Bash: deploy.sh para sincronizar el repositorio Git, compilar perfiles en Docker y podar caché huérfana de forma desatendida; y renew_certs.sh para renovar certificados SSL con un contenedor efímero de Certbot, gestionando dinámicamente el firewall UFW y los permisos por UID de cada contenedor. Para los microcontroladores, desarrollamos mprun, una herramienta de comandos propia en PowerShell: mediante flags específicas automatiza la compilación a bytecode .mpy para ahorrar RAM, lee nuestro manifest.json —que opera de forma análoga a un package.json para resolver e inyectar solo las librerías necesarias en /lib—, acelera el flasheo de código y permite formatear la Flash de forma nuclear ante fallos críticos. Y en paralelo, incorporamos actualización remota Over-The-Air, donde cada nodo compara su versión contra el manifiesto al iniciar y se actualiza autónomamente por red.»
* **Frase de Transición hacia Lámina 3.3:**
  > *«Con las herramientas de despliegue y certificados operativos, procedimos a resolver el corazón de las comunicaciones: el bróker Eclipse Mosquitto bajo cifrado MQTTS...»*
```
---
```
#### Lámina 3.3: Bróker Mosquitto Autoalojado
* **Título:** `INCREMENTO 3: BRÓKER MOSQUITTO AUTOALOJADO`
* **Píldora de Subtítulo:** `Segregación de puertos, discriminación de certificados y control de acceso`
* **Layout:** Opción 1 (4 píldoras con título separado de contenido).
* **Estructura Visual (Canva):**
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ INCREMENTO 3: BRÓKER MOSQUITTO AUTOALOJADO                                             │
│          ✦ Segregación de puertos, discriminación de certificados y... ✦               │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [ Doble listener   ]   Puerto 8883 para hardware ESP32 y puerto 8884 con WSS para      │
│                        clientes web.                                                   │
│                                                                                        │
│ [ Certificado hoja ]   Entrega solo cert.pem al ESP32 evitando desbordar la memoria    │
│                        con fullchain.pem.                                              │
│                                                                                        │
│ [ Control de roles ]   Credenciales aisladas en passwd para discriminar Web, Backend y │
│                        Dispositivos.                                                   │
│                                                                                        │
│ [ Sesiones huérfanas]  Expiración a 30m y tcp_nodelay para depurar clientes zombie en │
│                        el servidor.                                                    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
* **Elementos:**
  1. `[Doble listener]` *(14 chars)* → `Puerto 8883 para hardware ESP32 y puerto 8884 con WSS para clientes web.` *(72 chars)*
  2. `[Certificado hoja]` *(16 chars)* → `Entrega solo cert.pem al ESP32 evitando desbordar la memoria con fullchain.pem.` *(79 chars)*
  3. `[Control de roles]` *(16 chars)* → `Credenciales aisladas en passwd para discriminar Web, Backend y Dispositivos.` *(77 chars)*
  4. `[Sesiones huérfanas]` *(18 chars)* → `Expiración a 30m y tcp_nodelay para depurar clientes zombie en el servidor.` *(75 chars)*
* **Pitch (~35 seg):**
  > «Al autoalojar Eclipse Mosquitto en nuestro VPS enfrentamos un reto crítico: el tamaño de los certificados SSL. La entrega de la cadena completa de confianza (fullchain.pem) saturaba la memoria RAM del ESP32 durante la negociación. Para solventarlo, configuramos dos listeners segregados: el puerto 8883 para el hardware, configurado para enviar únicamente el certificado hoja cert.pem liviano, y el puerto 8884 sobre WebSockets con la cadena completa para los navegadores. Adicionalmente, implementamos control de acceso por roles en el archivo passwd para aislar el tráfico web, el backend y los microcontroladores, y definimos la expiración de sesiones a 30 minutos para depurar clientes huérfanos en el servidor.»
* **Frase de Transición hacia Lámina 3.4:**
  > *«Configurados los puertos y certificados en el servidor, nos trasladamos al microcontrolador para interactuar con este canal cifrado, donde la librería estándar presentaba severas fallas de manejo de sockets...»*
```
---
```
#### Lámina 3.4: Driver de Transporte Parchado (`simple2.py`)
* **Título:** `INCREMENTO 3: DRIVER DE TRANSPORTE SIMPLE2.PY`
* **Píldora de Subtítulo:** `Parches a bajo nivel contra fugas de memoria, conexiones zombie y bloqueos`
* **Layout:** Opción 1 (4 píldoras con título separado de contenido).
* **Estructura Visual (Canva):**
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ INCREMENTO 3: DRIVER DE TRANSPORTE SIMPLE2.PY                                          │
│          ✦ Parches a bajo nivel contra fugas de memoria, conexiones... ✦               │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [ Cierre de conexión]  Cierre forzoso de la conexión TCP base si falla TLS, evitando   │
│                        errores EBUSY.                                                  │
│                                                                                        │
│ [ Lectura con poll ]   Uso de uselect.poll para detectar caídas silenciosas y evitar   │
│                        bucles infinitos.                                               │
│                                                                                        │
│ [ Escritura robusta]   Protección contra saturación de buffer y control de flujo en    │
│                        redes inestables.                                               │
│                                                                                        │
│ [ Driver de bajo nivel] Actúa solo como enlace crudo; no gestiona la lógica de sesión  │
│                        ni reconexión.                                                  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
* **Elementos:**
  1. `[Cierre de conexión]` *(18 chars)* → `Cierre forzoso de la conexión TCP base si falla TLS, evitando errores EBUSY.` *(76 chars)*
  2. `[Lectura con poll]` *(16 chars)* → `Uso de uselect.poll para detectar caídas silenciosas y evitar bucles infinitos.` *(79 chars)*
  3. `[Escritura robusta]` *(17 chars)* → `Protección contra saturación de buffer y control de flujo en redes inestables.` *(78 chars)*
  4. `[Driver de bajo nivel]` *(20 chars)* → `Actúa solo como enlace crudo; no gestiona la lógica de sesión ni reconexión.` *(76 chars)*
* **Pitch (~35 seg):**
  > «Para interactuar con el bróker, la librería estándar umqtt.simple resultó insuficiente debido a fugas en el manejo de conexiones. Si la negociación TLS fallaba, la conexión TCP quedaba abierta, acumulando conexiones zombies que bloqueaban al microcontrolador con el error EBUSY. Desarrollamos la versión parchada simple2.py, donde forzamos el cierre de la conexión base ante cualquier fallo e introdujimos uselect.poll para detectar caídas silenciosas de red y evitar bucles bloqueantes. Sin embargo, es vital subrayar que simple2.py operaba únicamente como un conductor de transporte crudo; no resolvía la persistencia de sesión, ni reconexiones ante cortes de WiFi, ni la concurrencia entre corrutinas. Esa estabilidad exigió desarrollar el runtime asíncrono en el microcontrolador.»
* **Frase de Transición hacia Lámina 3.5:**
  > *«Sin embargo, un driver parchado solo resuelve el transporte crudo. Lograr que el ESP32 mantuviera sesiones ininterrumpidas de más de 24 horas exigió desarrollar un runtime asíncrono reactivo en el silicio...»*
```
---
```
#### Lámina 3.5: Runtime Asíncrono del ESP32
* **Título:** `INCREMENTO 3: RUNTIME ASÍNCRONO DEL ESP32`
* **Píldora de Subtítulo:** `Núcleo reactivo multitarea para sesiones MQTTS continuas de +24H`
* **Layout:** Opción 1 (4 píldoras con título separado de contenido).
* **Estructura Visual (Canva):**
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ INCREMENTO 3: RUNTIME ASÍNCRONO DEL ESP32                                              │
│          ✦ Núcleo reactivo multitarea para sesiones MQTTS continuas de +24H ✦          │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [ Conector y pings ]   Gestiona el ciclo de sesión, reintentos con backoff y pings     │
│                        periódicos cada 29s.                                            │
│                                                                                        │
│ [ Exclusión mutua  ]   Candado asyncio.Lock para evitar colisiones entre telemetría    │
│                        saliente y comandos.                                            │
│                                                                                        │
│ [ Cola desacoplada ]   Patrón productor-consumidor que procesa mensajes MQTT sin       │
│                        bloquear el tráfico.                                            │
│                                                                                        │
│ [ Watchdog y salud ]   Filtro de RAM libre (>48 KB), watchdog de hardware de 125s y    │
│                        recuperación física.                                            │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
* **Elementos:**
  1. `[Conector y pings]` *(16 chars)* → `Gestiona el ciclo de sesión, reintentos con backoff y pings periódicos cada 29s.` *(80 chars)*
  2. `[Exclusión mutua]` *(15 chars)* → `Candado asyncio.Lock para evitar colisiones entre telemetría saliente y comandos.` *(81 chars)*
  3. `[Cola desacoplada]` *(16 chars)* → `Patrón productor-consumidor que procesa mensajes MQTT sin bloquear el tráfico.` *(78 chars)*
  4. `[Watchdog y salud]` *(16 chars)* → `Filtro de RAM libre (>48 KB), watchdog de hardware de 125s y recuperación física.` *(81 chars)*
* **Pitch (~35 seg):**
  > «Mantener una conexión MQTT cifrada y estable en un microcontrolador ESP32 no depende únicamente del driver de red, sino del runtime asíncrono que orquesta el dispositivo. Desarrollamos un núcleo reactivo compartido basado en uasyncio gobernado por cuatro pilares: en primer lugar, la corrutina mqtt_connector_task, que coordina reconexiones automáticas ante parpadeos de WiFi y despacha pings periódicos cada 29 segundos para mantener vivo el canal en el bróker. En segundo lugar, un candado de exclusión mutua asyncio.Lock que impide colisiones y corrupción de tramas TLS cuando coincide el envío de telemetría con la llegada de órdenes remotas. En tercer lugar, un patrón productor-consumidor que almacena los mensajes entrantes en una cola en RAM para procesarlos de forma diferida sin trabar la red. Y finalmente, un watchdog jerárquico de hardware de 125 segundos combinado con recolección preventiva de memoria RAM, logrando una estabilidad operativa que certificó sesiones MQTTS continuas de más de 24 horas en campo.»
* **Frase de Transición hacia Lámina 3.6:**
  > *«Para dotar a este runtime de la memoria RAM necesaria para los buffers TLS y garantizar observabilidad total, rediseñamos la arquitectura hacia un modelo de borde delgado...»*
```
---
```
#### Lámina 3.6: Arquitectura Borde Delgado (*Thin Edge*)
* **Título:** `INCREMENTO 3: ARQUITECTURA BORDE DELGADO (THIN EDGE)`
* **Píldora de Subtítulo:** `Desacoplamiento funcional entre microcontrolador y servidor en la nube`
* **Layout:** Opción 1 (4 píldoras con título separado de contenido).
* **Estructura Visual (Canva):**
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ INCREMENTO 3: ARQUITECTURA BORDE DELGADO (THIN EDGE)                                   │
│    ✦ Desacoplamiento funcional entre microcontrolador y servidor en la nube ✦          │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [ Retiro de NVS    ]   Eliminación de NVS en Flash para liberar 15 KB de RAM para      │
│                        buffers criptográficos.                                         │
│                                                                                        │
│ [ Scheduler central]   El servidor asume la persistencia de colas, trazabilidad y      │
│                        deliberación.                                                   │
│                                                                                        │
│ [ Cliente delgado  ]   El ESP32 opera como ejecutor disciplinado con salvaguardas de   │
│                        corte locales.                                                  │
│                                                                                        │
│ [ Estado en caliente]  Tras reconexión, el nodo sincroniza su estado real sin requerir │
│                        escrituras en Flash.                                            │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
* **Elementos:**
  1. `[Retiro de NVS]` *(15 chars)* → `Eliminación de NVS en Flash para liberar 15 KB de RAM para buffers criptográficos.` *(82 chars)*
  2. `[Scheduler central]` *(19 chars)* → `El servidor asume la persistencia de colas, trazabilidad y deliberación.` *(73 chars)*
  3. `[Cliente delgado]` *(17 chars)* → `El ESP32 opera como ejecutor disciplinado con salvaguardas de corte locales.` *(76 chars)*
  4. `[Estado en caliente]` *(20 chars)* → `Tras reconexión, el nodo sincroniza su estado real sin requerir escrituras en Flash.` *(84 chars)*
* **Pitch (~35 seg):**
  > «En las primeras versiones del firmware, el nodo actuador implementaba un gestor local en memoria Flash denominado NVSManager. Este esquema consumía recursos críticos de memoria y volvía opaco el comportamiento del dispositivo. Rediseñamos la arquitectura migrando a un modelo de borde delgado: eliminamos este módulo para liberar más de 15 kilobytes de memoria RAM indispensables para los buffers criptográficos TLS, delegando la persistencia de estado, la recuperación en caliente y la reconciliación de colas al microservicio Scheduler. De este modo, el microcontrolador se transformó en un ejecutor disciplinado y altamente reactivo, preservando salvaguardas electromecánicas locales mientras el servidor asume la trazabilidad y la observabilidad completa.»
* **Frase de Transición hacia Lámina 3.7:**
  > *«Al centralizar la memoria y la gobernanza en el servidor, construimos los servicios backend desacoplados y la suite web de operaciones en Next.js para el control del orquideario.»*
```
---
```
#### Lámina 3.7: Servicios Backend y Suite de Operaciones
* **Título:** `INCREMENTO 3: SERVICIOS BACKEND Y OPERACIONES`
* **Píldora de Subtítulo:** `Desacoplamiento de Ingest y Scheduler junto a interfaces de supervisión`
* **Layout:** Opción 1 (4 píldoras con título separado de contenido).
* **Estructura Visual (Canva):**
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ INCREMENTO 3: SERVICIOS BACKEND Y OPERACIONES                                          │
│    ✦ Desacoplamiento de Ingest y Scheduler junto a interfaces de supervisión ✦        │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [ Servicio Ingest  ]   Conexión MQTT permanente 24/7 y persistencia directa de eventos │
│                        en InfluxDB.                                                    │
│                                                                                        │
│ [ Servicio Scheduler]  Cerebro del nodo actuador: automatiza el circuito bajo          │
│                        secuencias temporizadas fijas.                                  │
│                                                                                        │
│ [ Mando y cola web ]   Módulos /control con temporizador seguro y /queue con           │
│                        cancelación en vivo.                                            │
│                                                                                        │
│ [ Rutinas y bitácora]  Módulos /schedules para rutinas por zonas e /history para       │
│                        auditoría forense.                                              │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
* **Elementos:**
  1. `[Servicio Ingest]` *(15 chars)* → `Conexión MQTT permanente 24/7 y persistencia directa de eventos en InfluxDB.` *(74 chars)*
  2. `[Servicio Scheduler]` *(18 chars)* → `Cerebro del nodo actuador: automatiza el circuito bajo secuencias temporizadas fijas.` *(85 chars)*
  3. `[Mando y cola web]` *(16 chars)* → `Módulos /control con temporizador seguro y /queue con cancelación en vivo.` *(74 chars)*
  4. `[Rutinas y bitácora]` *(18 chars)* → `Módulos /schedules para rutinas por zonas e /history para auditoría forense.` *(76 chars)*
* **Pitch (~35 seg):**
  > «El modelo de servidor en Next.js está concebido para resolver peticiones HTTP transitorias sin estado, lo cual resulta incompatible con sostener conexiones persistentes por MQTT. Para resolverlo, desacoplamos la lógica operativa en dos servicios independientes en Node.js que corren dentro de contenedores Docker 24/7: el Servicio Ingest, encargado de sostener la conexión MQTT continua para validar y persistir los eventos y estados del nodo en InfluxDB; y el Servicio Scheduler, concebido como el cerebro que gestiona el nodo actuador y se encarga de ejecutar de forma autónoma la automatización del circuito hidráulico, orquestando las colas de riego y despachando los comandos hacia los relés bajo secuencias temporizadas predefinidas. Liberada de estas tareas de fondo, la aplicación web Next.js se centró en la suite operativa: /control para el accionamiento manual seguro; /queue para supervisar y cancelar tareas en tiempo real; /schedules para la planificación recurrente; e /history como bitácora forense de auditoría.»
* **Frase de Transición hacia el Incremento 4:**
  > *«Consolidada la infraestructura de servidor, la mensajería cifrada y la suite web de conmutación, el siguiente paso fue dotar al sistema de percepción ambiental in situ mediante el diseño e instalación de estaciones meteorológicas propias en el Incremento 4.»*
```
---
```
---
```
### Incremento 4: Estaciones Meteorológicas y Telemetría Ambiental
```
#### Lámina 4.1: Estaciones Meteorológicas y Telemetría Ambiental
* **Título:** `INCREMENTO 4: ESTACIONES METEOROLÓGICAS (EMA)`
* **Píldora de Subtítulo:** `Captura continua de temperatura, humedad, luz y lluvia en el orquideario`
* **Layout:** Opción 1 (4 píldoras con título separado de contenido).
* **Estructura Visual (Canva):**
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ INCREMENTO 4: ESTACIONES METEOROLÓGICAS (EMA)                                          │
│     ✦ Captura continua de temperatura, humedad, luz y lluvia en el orquideario ✦       │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [ Demanda botánica ]   El orquideario exige medir en tiempo real temperatura,          │
│                        humedad relativa y luz.                                         │
│                                                                                        │
│ [ Red dual de EMA  ]   Dos estaciones: una exterior a la intemperie y una interior     │
│                        entre las plantas.                                              │
│                                                                                        │
│ [ Cadencia de datos]   Publicación periódica de lotes de mediciones de sensores al     │
│                        bróker por MQTTS.                                               │
│                                                                                        │
│ [ Series temporales]   Persistencia en InfluxDB de las lecturas para el análisis       │
│                        agronómico del cultivo.                                         │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
* **Elementos:**
  1. `[Demanda botánica]` *(18 chars)* → `El orquideario exige medir en tiempo real temperatura, humedad relativa y luz.` *(78 chars)*
  2. `[Red dual de EMA]` *(17 chars)* → `Dos estaciones: una exterior a la intemperie y una interior entre las plantas.` *(78 chars)*
  3. `[Cadencia de datos]` *(18 chars)* → `Publicación periódica de lotes de mediciones de sensores al bróker por MQTTS.` *(77 chars)*
  4. `[Series temporales]` *(18 chars)* → `Persistencia en InfluxDB de las lecturas para el análisis agronómico del cultivo.` *(81 chars)*
* **Pitch (~35 seg):**
  > «El cultivo de orquídeas presenta una extrema sensibilidad ambiental: la transpiración de las hojas, la apertura de sus estomas y el riesgo de quemaduras térmicas dependen directamente de las condiciones inmediatas de temperatura, humedad y radiación solar. Para registrar estas variables de forma continua y confiable, desarrollamos dos Estaciones Meteorológicas Automatizadas basadas en microcontroladores ESP32: una estación exterior instalada a la intemperie para registrar el clima del entorno, y una estación interior ubicada directamente entre las plantas en las mesas de cultivo. Ambas estaciones toman mediciones periódicas y transmiten sus lotes de datos bajo MQTTS cifrado hacia el motor InfluxDB, construyendo la base histórica necesaria para calcular métricas agronómicas clave y supervisar el orquideario.»
* **Frase de Transición hacia Lámina 4.2:**
  > *«Con la red de monitoreo estructurada, pasamos a la construcción y despliegue del primer nodo de campo: la Estación Meteorológica Exterior...»*
```
---
```
#### Lámina 4.2: EMA Exterior y Mitigación de Ruido en Campo (Figura 8)
* **Título:** `INCREMENTO 4: ESTACIÓN METEOROLÓGICA EXTERIOR (EMA)`
* **Píldora de Subtítulo:** `Monitoreo perimetral a 5VDC y mitigación de ruido electromagnético en Cat6`
* **Layout:** Opción 50/50 (Mitad Izquierda: Foto Real Figura 8 / Mitad Derecha: 3 Tarjetas de Contenido).
* **Estructura Visual (Canva):**
```
┌────────────────────────────────────────┬───────────────────────────────────────────────┐
│ INCREMENTO 4: ESTACIÓN EXTERIOR (EMA)  │ ✦ Monitoreo perimetral a 5VDC y mitigación... ✦│
├────────────────────────────────────────┼───────────────────────────────────────────────┤
│                                        │ [Alimentación y régimen]                      │
│                                        │ Energizada a 5VDC desde el tablero, transmite │
│         [ FOTO REAL FIGURA 8           │ 10 muestras cada 10 min por MQTTS.            │
│         EMA Exterior: Sensores         │                                               │
│       Protegidos de la Intemperie      │ [Mitigación de ruido]                         │
│             en el Invernadero ]        │ Líneas digitales trenzadas con su retorno     │
│                                        │ GND/VCC en Cat6 de 10m suprimen ruido.        │
│                                        │                                               │
│                                        │ [Protección intemperie]                       │
│                                        │ Sensores instalados en el exterior para       │
│                                        │ registrar radiación y clima ambiental.        │
└────────────────────────────────────────┴───────────────────────────────────────────────┘
```
* **Elementos (Columna Derecha):**
  1. `[Alimentación y régimen]` *(24 chars)* → `Energizada a 5VDC desde el tablero, transmite 10 muestras cada 10 min por MQTTS.` *(80 chars)*
  2. `[Mitigación de ruido]` *(21 chars)* → `Líneas digitales trenzadas con su retorno GND/VCC en Cat6 de 10m suprimen ruido.` *(80 chars)*
  3. `[Protección intemperie]` *(23 chars)* → `Caracteriza el clima exterior para saber qué mitiga la infraestructura del invernadero.` *(78 chars)*
* **Pitch (~35 seg):**
  > «La Estación Meteorológica Exterior, apreciable en la Figura 8, se energizó a 5VDC directamente desde el tablero eléctrico para sostener un muestreo ambiental ininterrumpido a la intemperie, despachando ráfagas de 10 muestras cada 10 minutos por MQTTS. Durante las primeras pruebas de campo, el tendido de 10 metros de cable Cat6 entre el tablero y los sensores indujo severas interferencias electromagnéticas que arrojaban lecturas erráticas. El diagnóstico reveló que las líneas de datos viajaban agrupadas en un par desbalanceado; resolvimos el fallo trenzando físicamente cada línea digital con su respectivo retorno de referencia de alimentación dentro de su propio par en el cable Cat6, suprimiendo por completo el ruido inducido.»
* **Frase de Transición hacia Lámina 4.3:**
  > *«Garantizada la telemetría en el perímetro exterior, el siguiente reto fue medir las condiciones ambientales directamente sobre las mesas de cultivo con la EMA Interior...»*
```
---
```
#### Lámina 4.3: EMA Interior en Garita Stevenson 3D (Figura 9)
* **Título:** `INCREMENTO 4: ESTACIÓN METEOROLÓGICA INTERIOR (EMA)`
* **Píldora de Subtítulo:** `Unidad móvil autónoma para registrar el microclima entre las mesas de cultivo`
* **Layout:** Opción 50/50 (Mitad Izquierda: Foto Real Figura 9 / Mitad Derecha: 3 Tarjetas de Contenido).
* **Estructura Visual (Canva):**
```
┌────────────────────────────────────────┬───────────────────────────────────────────────┐
│ INCREMENTO 4: ESTACIÓN INTERIOR (EMA)  │ ✦ Unidad móvil autónoma para registrar el     │
│                                        │   microclima entre las mesas de cultivo ✦     │
├────────────────────────────────────────┼───────────────────────────────────────────────┤
│                                        │ [Ventilación pasiva]                          │
│                                        │ Celosías impresas en 3D que evitan radiación  │
│         [ FOTO REAL FIGURA 9           │ directa asegurando flujo de aire.             │
│         EMA Interior en Garita         │                                               │
│          Stevenson 3D sobre            │ [Estrategia energética]                       │
│           Mesa de Cultivo ]            │ Mantiene la radio WiFi apagada el 98% del     │
│                                        │ tiempo para maximizar la batería.             │
│                                        │                                               │
│                                        │ [Transmisión en lote]                         │
│                                        │ Despierta cada 10 min, guarda en RTC RAM y    │
│                                        │ transmite un lote de 6 muestras por hora.     │
└────────────────────────────────────────┴───────────────────────────────────────────────┘
```
* **Elementos (Columna Derecha):**
  1. `[Ventilación pasiva]` *(20 chars)* → `Celosías impresas en 3D que evitan radiación directa asegurando flujo de aire.` *(78 chars)*
  2. `[Estrategia energética]` *(23 chars)* → `Mantiene la radio WiFi apagada el 98% del tiempo para maximizar la batería.` *(75 chars)*
  3. `[Transmisión en lote]` *(22 chars)* → `Despierta cada 10 min, guarda en RTC RAM y transmite un lote de 6 muestras por hora.` *(84 chars)*
* **Pitch (~35 seg):**
  > «Para medir las variables que inciden directamente sobre las plantas sin tender cableados invasivos, diseñamos la EMA Interior que observamos en la Figura 9: concebida como una unidad móvil autónoma para caracterizar los microclimas específicos entre las distintas mesas de cultivo. Su chasis, una garita tipo Stevenson fabricada mediante manufactura aditiva 3D, incorpora celosías que protegen al sensor de la radiación solar directa y del rocío, garantizando ventilación pasiva constante. Para dotarla de máxima autonomía con batería, el ESP32 mantiene su módem WiFi apagado durante el noventa y ocho por ciento de su ciclo de vida: el nodo despierta cada diez minutos en reposo profundo, toma las lecturas y las resguarda en su memoria volátil protegida RTC RAM. Cumplida una hora, activa la radio únicamente para despachar el lote consolidado de seis muestras por MQTTS, minimizando drásticamente el consumo energético.»
* **Frase de Transición hacia Lámina 4.4:**
  > *«Con ambas estaciones desplegadas, debimos enfrentar un fenómeno crítico de degradación en los sensores tras semanas de funcionamiento continuo...»*
```
---
```
#### Lámina 4.4: Resiliencia de Sensores y Autorrecuperación Física (Relé 8)
* **Título:** `INCREMENTO 4: RESILIENCIA Y AUTORRECUPERACIÓN FÍSICA`
* **Píldora de Subtítulo:** `Ciclo de potencia en Relé 8, drenado capacitivo y autoescala lumínica`
* **Layout:** Opción 1 (4 píldoras con título separado de contenido).
* **Estructura Visual (Canva):**
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ INCREMENTO 4: RESILIENCIA Y AUTORRECUPERACIÓN FÍSICA                                   │
│    ✦ Ciclo de potencia en Relé 8, drenado capacitivo y autoescala lumínica ✦           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [ Guarda de bus digital] Detección automática tras 3 fallos consecutivos de            │
│                        comunicación en los buses.                                      │
│                                                                                        │
│ [ Ciclo en Relé 8  ]   Corte forzado de 200 ms que drena capacitores y recupera el     │
│                        sensor sin reiniciar.                                           │
│                                                                                        │
│ [ Autoescala lumínica] Ajuste dinámico de MTreg en el BH1750 para expandir el rango    │
│                        útil a 121.000 Lux.                                             │
│                                                                                        │
│ [ Sincronización RTC]  El Scheduler sincroniza el reloj interno y calibra el           │
│                        fotoperiodo en cada inicio.                                     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
* **Elementos:**
  1. `[Guarda de bus digital]` *(23 chars)* → `Detección automática tras 3 fallos consecutivos de comunicación en los buses.` *(77 chars)*
  2. `[Ciclo en Relé 8]` *(17 chars)* → `Corte forzado de 200 ms que drena capacitores y recupera el sensor sin reiniciar.` *(81 chars)*
  3. `[Autoescala lumínica]` *(21 chars)* → `Ajuste dinámico de MTreg en el BH1750 para expandir el rango útil a 121.000 Lux.` *(80 chars)*
  4. `[Sincronización RTC]` *(20 chars)* → `El Scheduler sincroniza el reloj interno y calibra el fotoperiodo en cada inicio.` *(81 chars)*
* **Pitch (~35 seg):**
  > «Tras periodos prolongados de operación continua, los sensores ambientales sufrían congelamientos esporádicos en su circuitería integrada debido a transitorios residuales, bloqueando los buses digitales e inutilizando el reinicio de software. Para solucionarlo sin reiniciar el ESP32 ni perder la sesión MQTTS, conectamos la alimentación de los sensores al Relé 8 en el tablero de control: ante tres fallos consecutivos de bus, el firmware o el Scheduler comandan un ciclo forzado de potencia de 200 milisegundos que drena los capacitores y revive la comunicación en dos segundos. A esto sumamos autoescala dinámica en el sensor BH1750 para medir hasta 121.000 Lux bajo sol directo, y sincronización horaria por el Scheduler para suspender el muestreo nocturno.»
* **Frase de Transición hacia Lámina 4.5:**
  > *«Resuelta la estabilidad física y electrónica de los sensores, estructuramos la visualización y análisis agronómico de estos datos en la plataforma web...»*
```
---
```
#### Lámina 4.5: Caracterización del Microclima (/monitoring y /botanics)
* **Título:** `INCREMENTO 4: CARACTERIZACIÓN DEL MICROCLIMA`
* **Píldora de Subtítulo:** `Herramientas para caracterizar el microclima interno y externo del orquideario`
* **Layout:** Opción 1 (4 píldoras con título separado de contenido).
* **Estructura Visual (Canva):**
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ INCREMENTO 4: CARACTERIZACIÓN DEL MICROCLIMA                                           │
│    ✦ Herramientas para caracterizar el microclima interno y externo del orquideario ✦  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [ Suite del cultivador] Herramienta principal para caracterizar el microclima interno   │
│                        y externo del cultivo.                                          │
│                                                                                        │
│ [ Segmentación de luz ] Divide 14h de luz en amanecer, fotoperiodo y atardecer para    │
│                        promediar sin anomalías.                                        │
│                                                                                        │
│ [ Bloques día y noche ] Clasifica día y noche excluyendo amanecer y atardecer para     │
│                        evitar datos anómalos.                                          │
│                                                                                        │
│ [ Analítica botánica  ] Procesa en ciclos de 24h: DLI, VPD promedio, diferencial       │
│                        día/noche y estrés hídrico.                                     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
* **Elementos:**
  1. `[Suite del cultivador]` *(22 chars)* → `Herramienta principal para caracterizar el microclima interno y externo del cultivo.` *(84 chars)*
  2. `[Segmentación de luz]` *(21 chars)* → `Divide 14h de luz en amanecer, fotoperiodo y atardecer para promediar sin anomalías.` *(84 chars)*
  3. `[Bloques día y noche]` *(22 chars)* → `Clasifica día y noche excluyendo amanecer y atardecer para evitar datos anómalos.` *(81 chars)*
  4. `[Analítica botánica]` *(20 chars)* → `Procesa en ciclos de 24h: DLI, VPD promedio, diferencial día/noche y estrés hídrico.` *(84 chars)*
* **Pitch (~35 seg):**
  > «Las interfaces /monitoring y /botanics constituyen la herramienta principal desarrollada y puesta a disposición de los cultivadores para caracterizar con rigor agronómico el microclima interno frente al entorno exterior. Para que el análisis no se contamine con lecturas sesgadas, implementamos una estricta segmentación temporal: en la iluminancia, delimitamos un fotoperiodo de 14 horas dividido en amanecer, fotoperiodo y atardecer, aislando el rango central donde la radiación es estable y se puede promediar sin introducir datos anómalos de las penumbras. Del mismo modo, para temperatura y humedad agrupamos las lecturas en bloques diurnos y nocturnos, excluyendo deliberadamente las horas de transición del amanecer y atardecer. Con esta base limpia, el módulo /botanics procesa en ciclos de 24 horas las métricas ecofisiológicas determinantes para las orquídeas: la Integral de Luz Diaria (DLI), el Déficit de Presión de Vapor (VPD), el diferencial térmico día/noche y las horas acumuladas bajo estrés hídrico o saturación fúngica.»
* **Frase de Transición hacia Lámina 4.6:**
  > *«Para mantener la observabilidad completa de esta infraestructura sin sobrecargar a los nodos ni trasladar computadoras al orquideario, desarrollamos un panel de auditoría remota...»*
```
---
```
#### Lámina 4.6: Auditoría Técnica Remota Asíncrona (iot_debug)
* **Título:** `INCREMENTO 4: AUDITORÍA TÉCNICA REMOTA ASÍNCRONA`
* **Píldora de Subtítulo:** `Supervisión de salud en silicio sin cables y protocolo asíncrono en reposo`
* **Layout:** Opción 1 (4 píldoras con título separado de contenido).
* **Estructura Visual (Canva):**
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ INCREMENTO 4: AUDITORÍA TÉCNICA REMOTA ASÍNCRONA                                       │
│    ✦ Supervisión de salud en silicio sin cables y protocolo asíncrono en reposo ✦      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [ Auditoría sin cables] Panel /admin?view=iot_debug para inspeccionar RAM libre,       │
│                        RSSI y buses vía web.                                           │
│                                                                                        │
│ [ Diagnóstico síncrono] Telemetría de salud inmediata para el nodo continuo conectado  │
│                        al tablero.                                                     │
│                                                                                        │
│ [ Protocolo asíncrono ] El Scheduler encola peticiones para la EMA en Deep Sleep sin   │
│                        romper su reposo.                                               │
│                                                                                        │
│ [ Consumo en ventana  ] El nodo despierta a la hora, ejecuta el diagnóstico y despacha │
│                        su estado de salud.                                             │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
* **Elementos:**
  1. `[Auditoría sin cables]` *(22 chars)* → `Panel /admin?view=iot_debug para inspeccionar RAM libre, RSSI y buses vía web.` *(78 chars)*
  2. `[Diagnóstico síncrono]` *(22 chars)* → `Telemetría de salud inmediata para el nodo continuo conectado al tablero.` *(73 chars)*
  3. `[Protocolo asíncrono]` *(21 chars)* → `El Scheduler encola peticiones para la EMA en Deep Sleep sin romper su reposo.` *(78 chars)*
  4. `[Consumo en ventana]` *(20 chars)* → `El nodo despierta a la hora, ejecuta el diagnóstico y despacha su estado de salud.` *(82 chars)*
* **Pitch (~35 seg):**
  > «Desarrollamos el panel /admin?view=iot_debug para inspeccionar la salud interna de los microcontroladores directamente desde la web, consultando parámetros críticos como memoria RAM libre, nivel de señal WiFi RSSI y estado de los buses digitales sin requerir cables en el orquideario. Para la EMA Interior, que permanece en reposo profundo para ahorrar batería, diseñamos un protocolo asíncrono mediado por el Scheduler: el usuario encola la petición de diagnóstico desde la web y el servidor la retiene; cuando el nodo despierta en su ventana horaria de transmisión, consume la orden, ejecuta el diagnóstico y despacha su telemetría de salud sin alterar su ciclo de sueño ni agotar su batería.»
* **Frase de Transición hacia el Incremento 5:**
  > *«Con la infraestructura de conmutación del Incremento 2, los servicios backend y mensajería del Incremento 3, y la red de telemetría ambiental del Incremento 4 consolidados, el sistema contaba con todos los órganos sensoriales y motores para integrar la inteligencia deliberativa y el control automático en el Incremento 5.»*
```
---
```
### Incremento 5: Inferencia de Lluvia y Autonomía Hídrica
```
#### Lámina 5.1: Motor de Inferencia Hídrica y Jerarquía Sensorial
* **Título:** INCREMENTO 5: INFERENCIA HÍDRICA Y JERARQUÍA
* **Píldora de Subtítulo:** Deliberación adaptativa, jerarquía sensorial y vetos agronómicos deterministas
* **Layout:** Opción 1 (4 píldoras con título separado de contenido).
* **Estructura Visual (Canva):**
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ INCREMENTO 5: INFERENCIA HÍDRICA Y JERARQUÍA                                           │
│  ✦ Deliberación adaptativa, jerarquía sensorial y vetos agronómicos deterministas ✦    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [ Riego adaptativo   ] Delibera si cada riego programado es seguro o se cancela,       │
│                        garantizando espaciar ciclos.                                   │
│                                                                                        │
│ [ Jerarquía sensorial] Prioriza lecturas de EMA Interior y conmuta a EMA Exterior si   │
│                        faltan datos en 30 min.                                         │
│                                                                                        │
│ [ Veto por historial ] Cruza lluvia de 3 días y radiación solar (<26 klx) para         │
│                        postergar la aspersión.                                         │
│                                                                                        │
│ [ Reglas por actuador] Aplica ventanas pluviales de 4 a 8 h para nebulización y        │
│                        enfriamiento en piso.                                           │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
* **Elementos:**
  1. [Riego adaptativo] *(18 chars)* → Delibera si cada riego programado es seguro o se cancela, garantizando espaciar ciclos. *(85 chars)*
  2. [Jerarquía sensorial] *(21 chars)* → Prioriza lecturas de EMA Interior y conmuta a EMA Exterior si faltan datos en 30 min. *(85 chars)*
  3. [Veto por historial] *(20 chars)* → Cruza lluvia de 3 días y radiación solar (<26 klx) para postergar la aspersión. *(79 chars)*
  4. [Reglas por actuador] *(21 chars)* → Aplica ventanas pluviales de 4 a 8 h para nebulización y enfriamiento en piso. *(78 chars)*
* **Pitch (~35 seg):**
  > «Una vez instrumentada la red telemétrica, el quinto incremento transformó el servicio Scheduler en un sistema de riego adaptativo: ante cada tarea programada por el cultivador, el motor delibera si es seguro proceder o si debe cancelarse, protegiendo al cultivo de las propias automatizaciones humanas y garantizando el espaciamiento mínimo entre riegos. Para deliberar con precisión, el sistema prioriza las lecturas de la EMA Interior de los últimos 30 minutos y conmuta a la EMA Exterior como respaldo ante cualquier fallo. Con estos datos climáticos, el motor evalúa las reglas de veto: cruza el historial pluvial de tres días con la radiación solar para postergar la aspersión si hubo lluvia o días nublados con menos de 26.000 lux, mientras que para nebulización y enfriamiento en piso aplica ventanas pluviales más estrechas de 4 a 8 horas.»
* **Frase de Transición hacia Lámina 5.2:**
  > *«No obstante, para que estas decisiones de veto fueran confiables, dependíamos de la detección oportuna de lluvia, donde enfrentamos un grave fallo de hardware en campo...»*
```
---
```
#### Lámina 5.2: Falla Crítica en Campo: Corrosión del Sensor de Lluvia (Figura 11)
* **Título:** INCREMENTO 5: CORROSIÓN DEL SENSOR DE LLUVIA
* **Píldora de Subtítulo:** ✦ Electrólisis galvánica acelerada, lluvias ficticias y descarte de transductor ✦
* **Layout:** Opción 50/50 con Matriz de 6 Píldoras (Mitad Izquierda: 6 Píldoras de Palabras Clave / Mitad Derecha: Foto Real Figura 11 - Sensor Corroído).
* **Estructura Visual (Canva):**
`
┌────────────────────────────────────────┬───────────────────────────────────────────────┐
│ INCREMENTO 5: CORROSIÓN SENSOR LLUVIA  │ ✦ Electrólisis galvánica acelerada, lluvias   │
│                                        │   ficticias y descarte de transductor ✦       │
├────────────────────────────────────────┴───────────────────────────────────────────────┤
│ ┌──────────────────────────┐ ┌──────────────────────────┐                              │
│ │  Muestreo dinámico       │ │  Depuración telemétrica  │                              │
│ └──────────────────────────┘ └──────────────────────────┘                              │
│ ┌──────────────────────────┐ ┌──────────────────────────┐     [ FOTO REAL FIGURA 11    │
│ │  Electrólisis galvánica  │ │  Lluvias ficticias +8h   │      Degradación Severa      │
│ └──────────────────────────┘ └──────────────────────────┘     del Sensor Resistivo     │
│ ┌──────────────────────────┐ ┌──────────────────────────┐      de Lluvia (MH-RD)       │
│ │  Veto indebido de riego  │ │  Descarte de hardware    │       por Electrólisis ]     │
│ └──────────────────────────┘ └──────────────────────────┘                              │
└────────────────────────────────────────────────────────────────────────────────────────┘
`
* **Elementos (Matriz 2x3 de Píldoras Clave):**
  1. Muestreo dinámico *(17 chars)*
  2. Depuración telemétrica *(22 chars)*
  3. Electrólisis galvánica *(22 chars)*
  4. Lluvias ficticias +8h *(20 chars)*
  5. Veto indebido de riego *(22 chars)*
  6. Descarte de hardware *(20 chars)*
* **Pitch (~35 seg):**
  > «La Figura 11 ilustra el fallo físico más determinante del proyecto: la degradación acelerada del sensor resistivo de gotas MH-RD. Para integrarlo en campo habíamos implementado toda una lógica de soporte: herramientas web de diagnóstico y un muestreo adaptativo que aceleraba la lectura a un minuto si la iluminancia bajaba de 15.000 lux ante tormentas inminentes, o la espaciaba a cinco minutos en calma. Sin embargo, la presencia continua de agua y la tensión de sensado desataron una electrólisis acelerada, carcomiendo las pistas metálicas en menos de 30 días. Los cortocircuitos resultantes reportaban lluvias ficticias continuas de más de ocho horas, provocando que el Scheduler vetara indebidamente los riegos programados. Este fallo empírico demostró que el problema no era de software ni de muestreo, sino la inviabilidad física de los transductores resistivos en intemperie, justificando su descarte definitivo.»
* **Frase de Transición hacia Lámina 5.3:**
  > *«Ante la inviabilidad de los sensores resistivos en campo, rediseñamos la solución reemplazando el sensor físico por un motor virtual de inferencia meteorológica...»*

---

#### Lámina 5.3: Rediseño: Motor de Inferencia Meteorológica
* **Título:** INCREMENTO 5: INFERENCIA METEOROLÓGICA DE LLUVIA
* **Píldora de Subtítulo:** Detección virtual en ventanas de 10 a 30 min por gradientes físicos ambientales
* **Layout:** Opción 1 (4 píldoras con título separado de contenido).
* **Estructura Visual (Canva):**
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ INCREMENTO 5: INFERENCIA METEOROLÓGICA DE LLUVIA                                       │
│  ✦ Detección virtual en ventanas de 10 a 30 min por gradientes físicos ambientales ✦   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [ Sustitución en código] Algoritmo virtual sin sensores mecánicos ni componentes       │
│                          expuestos a corrosión.                                        │
│                                                                                        │
│ [ Detección diurna     ] Disparo ante caída abrupta de luz (>25.000 Lux) junto a       │
│                          ascenso rápido de humedad.                                    │
│                                                                                        │
│ [ Detección nocturna   ] Ventanas de 10 a 30 min evaluando pendiente térmica negativa  │
│                          y saturación del aire.                                        │
│                                                                                        │
│ [ Filtros de estabilidad] Exige persistencia temporal en derivadas para ignorar paso   │
│                          de nubes aisladas.                                            │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
* **Elementos:**
  1. [Sustitución en código] *(23 chars)* → Algoritmo virtual sin sensores mecánicos ni componentes expuestos a corrosión. *(77 chars)*
  2. [Detección diurna] *(18 chars)* → Disparo ante caída abrupta de luz (>25.000 Lux) junto a ascenso rápido de humedad. *(82 chars)*
  3. [Detección nocturna] *(20 chars)* → Ventanas de 10 a 30 min evaluando pendiente térmica negativa y saturación del aire. *(83 chars)*
  4. [Filtros de estabilidad] *(24 chars)* → Exige persistencia temporal en derivadas para ignorar paso de nubes aisladas. *(77 chars)*
* **Pitch (~35 seg):**
  > «En lugar de añadir otro sensor físico que volviera a fallar mecánicamente, la solución de ingeniería fue puramente algorítmica: desarrollamos un motor de inferencia meteorológica embebido en el backend. El motor vigila ventanas deslizantes de diez, veinte y treinta minutos analizando gradientes físicos simultáneos. Durante el día, detecta la lluvia al correlacionar una caída abrupta de iluminancia superior a 25.000 lux con un incremento veloz en la humedad relativa. En horas nocturnas, donde la luz es nula, evalúa la derivada térmica negativa junto al ascenso súbito de humedad propia del frente de tormenta. Para filtrar falsos positivos por nubes pasajeras, el algoritmo exige persistencia temporal en las derivadas, reconociendo el inicio de la lluvia con absoluta certeza y cero componentes expuestos.»
* **Frase de Transición hacia Lámina 5.4:**
  > *«Con el inicio de la precipitación detectado de forma virtual, el siguiente desafío consistió en determinar el momento exacto en que la lluvia cesaba...»*
```
---
```
#### Lámina 5.4: Criterios Deterministas de Cese y Reconstrucción Histórica
* **Título:** INCREMENTO 5: CESE PLUVIAL Y CALIBRACIÓN
* **Píldora de Subtítulo:** Cuatro reglas de cese, persistencia de eventos y herramienta rebuild-rain-history
* **Layout:** Opción 1 (4 píldoras con título separado de contenido).
* **Estructura Visual (Canva):**
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ INCREMENTO 5: CESE PLUVIAL Y CALIBRACIÓN                                               │
│  ✦ Cuatro reglas de cese, persistencia de eventos y herramienta rebuild-rain-history ✦ │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [ Cuatro reglas de cese] Concluye lluvia por caída de humedad (<82%), rebote de luz o  │
│                          estabilización térmica.                                       │
│                                                                                        │
│ [ Persistencia PostgreSQL] Registra marcas de inicio, fin y duración para auditoría y │
│                          supervisión en /monitoring.                                   │
│                                                                                        │
│ [ Calibración paramétrica] Herramienta rebuild-rain-history.ts procesa telemetría      │
│                          para afinar umbrales.                                         │
│                                                                                        │
│ [ Autonomía hídrica    ] Protege las orquídeas contra la asfixia radicular optimizando │
│                          el consumo de agua.                                           │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
* **Elementos:**
  1. [Cuatro reglas de cese] *(23 chars)* → Concluye lluvia por caída de humedad (<82%), rebote de luz o estabilización térmica. *(83 chars)*
  2. [Persistencia PostgreSQL] *(26 chars)* → Registra marcas de inicio, fin y duración para auditoría y supervisión en /monitoring. *(86 chars)*
  3. [Calibración paramétrica] *(25 chars)* → Herramienta rebuild-rain-history.ts procesa telemetría para afinar umbrales. *(75 chars)*
  4. [Autonomía hídrica] *(19 chars)* → Protege las orquídeas contra la asfixia radicular optimizando el consumo de agua. *(81 chars)*
* **Pitch (~35 seg):**
  > «Tan importante como detectar el inicio de la precipitación era determinar su conclusión exacta para reanudar el cálculo del espaciamiento hídrico. El motor implementa cuatro reglas deterministas de cese: caída de humedad relativa por debajo del 82%, descenso continuo durante dos ventanas consecutivas, rebote significativo de luz natural o estabilización de la curva térmica. Cada evento se persiste en PostgreSQL con su marca de inicio, fin y duración neta, haciéndose visible en la interfaz /monitoring. Además, desarrollamos la herramienta CLI rebuild-rain-history.ts, que permitió reprocesar meses de telemetría histórica en InfluxDB para calibrar empíricamente los umbrales del algoritmo contra las bitácoras reales del orquideario, consolidando una autonomía hídrica robusta.»
* **Frase de Transición hacia Lámina 6.1:**
  > *«Garantizada la autonomía hídrica del invernadero, el siguiente paso fue dotar al sistema de control agronómico individualizado y un canal de comercialización en línea...»*
```
---
```
### Incremento 6: Catálogo, Inventario, Tienda y Cronograma de Dosificación
```
#### Lámina 6.1: Catálogo Taxonómico y Trazabilidad Individual
* **Título:** `INCREMENTO 6: CATÁLOGO Y TRAZABILIDAD INDIVIDUAL`
* **Píldora de Subtítulo:** `Organización botánica, carga multimedia en nube y control unívoco por maceta`
* **Layout:** Opción 1 (4 píldoras con título separado de contenido).
* **Estructura Visual (Canva):**
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ INCREMENTO 6: CATÁLOGO Y TRAZABILIDAD INDIVIDUAL                                       │
│    ✦ Organización botánica, carga multimedia en nube y control unívoco por maceta ✦    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [ Jerarquía taxonómica ] Organiza tipos de plantas, géneros y especies con sus         │
│                          requerimientos de cultivo.                                    │
│                                                                                        │
│ [ Almacenamiento nube  ] Carga directa multimedia con enlaces prefirmados evitando     │
│                          sobrecargar el servidor.                                      │
│                                                                                        │
│ [ Trazabilidad maceta  ] Registro unívoco de cada espécimen con fecha, tamaño de       │
│                          maceta, precio y salud.                                       │
│                                                                                        │
│ [ Plantas madre y venta] Diferencia operativamente los ejemplares comerciales de las   │
│                          plantas de reproducción.                                      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
* **Elementos:**
  1. `[Jerarquía taxonómica]` *(22 chars)* → `Organiza tipos de plantas, géneros y especies con sus requerimientos de cultivo.` *(80 chars)*
  2. `[Almacenamiento nube]` *(21 chars)* → `Carga directa multimedia con enlaces prefirmados evitando sobrecargar el servidor.` *(82 chars)*
  3. `[Trazabilidad maceta]` *(21 chars)* → `Registro unívoco de cada espécimen con fecha, tamaño de maceta, precio y salud.` *(79 chars)*
  4. `[Plantas madre y venta]` *(23 chars)* → `Diferencia operativamente los ejemplares comerciales de las plantas de reproducción.` *(84 chars)*
* **Pitch (~35 seg):**
  > «La gestión tradicional en viveros se apoyaba en estimaciones globales sin individualización por maceta, perdiendo la historia biológica de las plantas. Para superar esta limitación, en el sexto incremento construimos un catálogo taxonómico jerárquico que organiza tipos de plantas, géneros y especies con sus descriptores agronómicos. La entrega de galerías fotográficas se optimizó mediante enlaces prefirmados que suben imágenes directamente desde el navegador a un almacenamiento de objetos en la nube, evitando sobrecargar el servidor web. Sobre esta estructura implementamos la trazabilidad física unívoca: cada ejemplar se registra con su fecha de siembra, tamaño de maceta, precio y condición biológica, discriminando operativamente las plantas comercializables de las plantas madre destinadas a reproducción.»
* **Frase de Transición hacia Lámina 6.2:**
  > *«Esta individualización por maceta sentó las bases para registrar el comportamiento biológico de cada orquídea en el módulo fenológico...»*
```
---
```
#### Lámina 6.2: Seguimiento Fenológico y Ciclo de Floración
* **Título:** `INCREMENTO 6: SEGUIMIENTO FENOLÓGICO Y FLORACIÓN`
* **Píldora de Subtítulo:** `Historial de floración por ejemplar y proyección biológica en la tienda online`
* **Layout:** Opción 1 (4 píldoras con título separado de contenido).
* **Estructura Visual (Canva):**
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ INCREMENTO 6: SEGUIMIENTO FENOLÓGICO Y FLORACIÓN                                       │
│   ✦ Historial de floración por ejemplar y proyección biológica en la tienda online ✦   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [ Registro de floración] Historial unívoco de eventos florales por espécimen en su     │
│                          ficha biológica.                                              │
│                                                                                        │
│ [ Métricas fenológicas ] Calcula duración en días de la flor, frecuencia anual y meses │
│                          de actividad floral.                                          │
│                                                                                        │
│ [ Ejemplar destacado   ] Proyecta las estadísticas biológicas del mejor espécimen en   │
│                          la tienda online.                                             │
│                                                                                        │
│ [ Evidencia botánica   ] Enriquece la ficha comercial con datos fenológicos reales y   │
│                          trazables.                                                    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
* **Elementos:**
  1. `[Registro de floración]` *(23 chars)* → `Historial unívoco de eventos florales por espécimen en su ficha biológica.` *(74 chars)*
  2. `[Métricas fenológicas]` *(22 chars)* → `Calcula duración en días de la flor, frecuencia anual y meses de actividad floral.` *(82 chars)*
  3. `[Ejemplar destacado]` *(20 chars)* → `Proyecta las estadísticas biológicas del mejor espécimen en la tienda online.` *(77 chars)*
  4. `[Evidencia botánica]` *(20 chars)* → `Enriquece la ficha comercial con datos fenológicos reales y trazables.` *(70 chars)*
* **Pitch (~35 seg):**
  > «Complementamos la administración unívoca con un módulo de seguimiento fenológico que audita los ciclos de floración en la ficha de cada ejemplar. El sistema calcula variables biológicas clave: la duración en días de la flor abierta, la frecuencia anual de floración y los meses del año con mayor actividad reproductiva. Lo verdaderamente innovador es su integración con el canal comercial: la plataforma proyecta automáticamente las métricas del ejemplar destacado en la tienda en línea. De este modo, la ficha del producto no ofrece descripciones genéricas, sino evidencia botánica real, comprobable y trazable del cultivo que genera confianza inmediata en el comprador.»
* **Frase de Transición hacia Lámina 6.3:**
  > *«Al mismo tiempo que gestionábamos el ciclo biológico, necesitábamos resolver la logística operativa de las aplicaciones agroquímicas...»*
```
---
```
#### Lámina 6.3: Desacoplamiento Operativo y Cronograma de Dosificación
* **Título:** `INCREMENTO 6: CRONOGRAMA DE DOSIFICACIÓN AGRONÓMICA`
* **Píldora de Subtítulo:** `Integración de aspersión manual y fertirriego hidráulico en cronograma unificado`
* **Layout:** Opción 1 (4 píldoras con título separado de contenido).
* **Estructura Visual (Canva):**
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ INCREMENTO 6: CRONOGRAMA DE DOSIFICACIÓN AGRONÓMICA                                    │
│   ✦ Integración de aspersión manual y fertirriego hidráulico en cronograma unificado ✦ │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [ Desacople operativo  ] Separa la aspersión manual en zonas remotas del fertirriego   │
│                          por circuito hidráulico.                                      │
│                                                                                        │
│ [ Interfaces duales    ] Programación de aplicaciones manuales y cronograma integrado  │
│                          para todo el vivero.                                          │
│                                                                                        │
│ [ Proyecciones por zona] Cálculo de aplicaciones futuras mediante expresiones          │
│                          temporales para cada sector.                                  │
│                                                                                        │
│ [ Ciclo de vida tareas ] Auditoría de estados: aplicaciones pendientes, completadas    │
│                          o expiradas tras 24h.                                         │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
* **Elementos:**
  1. `[Desacople operativo]` *(22 chars)* → `Separa la aspersión manual en zonas remotas del fertirriego por circuito hidráulico.` *(84 chars)*
  2. `[Interfaces duales]` *(19 chars)* → `Programación de aplicaciones manuales y cronograma integrado para todo el vivero.` *(81 chars)*
  3. `[Proyecciones por zona]` *(23 chars)* → `Cálculo de aplicaciones futuras mediante expresiones temporales para cada sector.` *(81 chars)*
  4. `[Ciclo de vida tareas]` *(22 chars)* → `Auditoría de estados: aplicaciones pendientes, completadas o expiradas tras 24h.` *(80 chars)*
* **Pitch (~35 seg):**
  > «En el orquideario coexisten zonas tecnificadas con riego automatizado y sectores que dependen de aspersiones manuales. Para articular ambas labores sin duplicar esfuerzos, desacoplamos la operativa mediante dos interfaces web: una para programar la ejecución manual de los planes formulados en el laboratorio agroquímico, y otra que consolida el cronograma de dosificación unificado para todo el vivero. El sistema proyecta las aplicaciones futuras mediante expresiones temporales y audita el ciclo de vida de cada tarea —clasificándolas en pendientes, completadas o expiradas tras 24 horas de inactividad—, unificando la fertirrigación por tubería con el trabajo manual en una única bitácora agronómica centralizada.»
* **Frase de Transición hacia Lámina 6.4:**
  > *«Con el inventario individualizado y las labores agronómicas sincronizadas, consolidamos la experiencia de venta digital...»*
```
---
```
#### Lámina 6.4: Comercio Botánico y Reserva Atómica por WhatsApp
* **Título:** `INCREMENTO 6: COMERCIO BOTÁNICO Y PASARELA ASISTIDA`
* **Píldora de Subtítulo:** `Cómputo reactivo de inventario, tasa oficial BCV y reserva atómica por WhatsApp`
* **Layout:** Opción 1 (4 píldoras con título separado de contenido).
* **Estructura Visual (Canva):**
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ INCREMENTO 6: COMERCIO BOTÁNICO Y PASARELA ASISTIDA                                    │
│   ✦ Cómputo reactivo de inventario, tasa oficial BCV y reserva atómica por WhatsApp ✦  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [ Existencias reactivas] Cálculo de disponibilidad en tiempo real sumando solo         │
│                          ejemplares aptos para la venta.                               │
│                                                                                        │
│ [ Tasa oficial BCV     ] Precios base en dólares con conversión dinámica a bolívares   │
│                          según la tasa del día.                                        │
│                                                                                        │
│ [ Reserva atómica 60m  ] Bloqueo transaccional de plantas durante sesenta minutos      │
│                          erradicando la sobreventa.                                    │
│                                                                                        │
│ [ Pasarela por WhatsApp] Despacho de pedido con mensaje estructurado para remitir       │
│                          comprobantes al cultivador.                                   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
* **Elementos:**
  1. `[Existencias reactivas]` *(23 chars)* → `Cálculo de disponibilidad en tiempo real sumando solo ejemplares aptos para la venta.` *(85 chars)*
  2. `[Tasa oficial BCV]` *(18 chars)* → `Precios base en dólares con conversión dinámica a bolívares según la tasa del día.` *(82 chars)*
  3. `[Reserva atómica 60m]` *(21 chars)* → `Bloqueo transaccional de plantas durante sesenta minutos erradicando la sobreventa.` *(83 chars)*
  4. `[Pasarela por WhatsApp]` *(23 chars)* → `Despacho de pedido con mensaje estructurado para remitir comprobantes al cultivador.` *(84 chars)*
* **Pitch (~35 seg):**
  > «La tienda en línea articula la comercialización digital estructurando la navegación por géneros y especies, con precios base en dólares y conversión reactiva a bolívares según la tasa oficial del Banco Central de Venezuela. Para garantizar una sincronización perfecta con el vivero físico, el sistema computa las existencias en tiempo real sumando exclusivamente los ejemplares aptos para la venta. Al procesar una orden, ejecutamos una transacción atómica que bloquea los ejemplares bajo reserva durante sesenta minutos y despacha un mensaje estructurado hacia la API de WhatsApp para coordinar el comprobante de pago con el cultivador, erradicando por completo el riesgo de sobreventa.»
* **Frase de Transición hacia el Incremento 7:**
  > *«Consolidada la plataforma agronómica y comercial, el Incremento 7 cerró el sistema integrando un asistente conversacional en Telegram, la orquestación de flujos reactivos con n8n y la validación de resiliencia integral.»*
```
---
```
### Incremento 7: Asistente Agronómico, Orquestación n8n y Resiliencia
```
#### Lámina 7.1: Notificaciones Proactivas y Orquestación con n8n
* **Título:** `INCREMENTO 7: ASISTENTE AGRONÓMICO Y N8N`
* **Píldora de Subtítulo:** `Canal proactivo de mensajería con n8n, bot de Telegram y comandos rápidos`
* **Layout:** Opción 1 (4 píldoras con título separado de contenido).
* **Estructura Visual (Canva):**
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ INCREMENTO 7: ASISTENTE AGRONÓMICO Y N8N                                               │
│    ✦ Canal proactivo de mensajería con n8n, bot de Telegram y comandos rápidos ✦       │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [ Alerta proactiva     ] Sustituye avisos pasivos de la web por notificaciones push    │
│                          inmediatas al equipo.                                         │
│                                                                                        │
│ [ Flujos con n8n       ] Microflujos en Docker desacoplados de Next.js que conectan    │
│                          PostgreSQL y Telegram.                                        │
│                                                                                        │
│ [ Enrutador de comandos] Consultas móviles rápidas de estado (/status), dosificación   │
│                          (/dosing) y filtro.                                           │
│                                                                                        │
│ [ Resolución /complete ] Teclados en línea para asentar labores manuales en la base de │
│                          datos sin entrar a la web.                                    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
* **Elementos:**
  1. `[Alerta proactiva]` *(18 chars)* → `Sustituye avisos pasivos de la web por notificaciones push inmediatas al equipo.` *(80 chars)*
  2. `[Flujos con n8n]` *(16 chars)* → `Microflujos en Docker desacoplados de Next.js que conectan PostgreSQL y Telegram.` *(81 chars)*
  3. `[Enrutador de comandos]` *(23 chars)* → `Consultas móviles rápidas de estado (/status), dosificación (/dosing) y filtro.` *(79 chars)*
  4. `[Resolución /complete]` *(23 chars)* → `Teclados en línea para asentar labores manuales en la base de datos sin entrar a la web.` *(88 chars)*
* **Pitch (~35 seg):**
  > «Aunque la plataforma web contaba con un centro de notificaciones, su naturaleza era puramente pasiva, provocando que contingencias operativas críticas pasaran desapercibidas durante días. Para erradicar este aislamiento y garantizar una supervisión proactiva y colectiva, integramos en el VPS la plataforma de orquestación n8n contenerizada en Docker, conectada directamente a PostgreSQL y a la API de Telegram. A través de PristinoBot, establecimos un canal centralizado con comandos móviles optimizados: /status para consultar la salud de los nodos, /dosing para el cronograma de agroquímicos y teclados interactivos con /complete que permiten a cualquier cultivador marcar tareas manuales como terminadas, actualizando la base de datos al instante sin ingresar a la web.»
* **Frase de Transición hacia Lámina 7.2:**
  > *«Esta comunicación interactiva fue determinante para resolver la seguridad operativa en la línea de agroquímicos...»*
```
---
```
#### Lámina 7.2: Protocolo de Confirmación Previa en Agroquímicos (Human-in-the-Loop)
* **Título:** `INCREMENTO 7: CONFIRMACIÓN PREVIA EN FERTIRRIEGO`
* **Píldora de Subtítulo:** `Patrón humano en el bucle para la autorización segura del fertirriego`
* **Layout:** Opción 1 (4 píldoras con título separado de contenido).
* **Estructura Visual (Canva):**
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ INCREMENTO 7: CONFIRMACIÓN PREVIA EN FERTIRRIEGO                                       │
│        ✦ Patrón humano en el bucle para la autorización segura del fertirriego ✦       │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [ Preparación de mezcla] Exige confirmación de la preparación física de agroquímicos   │
│                          en el tanque auxiliar.                                        │
│                                                                                        │
│ [ Aviso de 12 horas    ] Envío automático de notificación push interactiva doce horas  │
│                          antes de la rutina.                                           │
│                                                                                        │
│ [ Botones interactivos ] Opciones en línea para confirmar el tanque, posponer 24h o    │
│                          cancelar la tarea.                                            │
│                                                                                        │
│ [ Patrón en el bucle   ] El Scheduler solo ejecuta la conmutación tras la autorización │
│                          explícita de un usuario.                                      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
* **Elementos:**
  1. `[Preparación de mezcla]` *(23 chars)* → `Exige confirmación de la preparación física de agroquímicos en el tanque auxiliar.` *(82 chars)*
  2. `[Aviso de 12 horas]` *(19 chars)* → `Envío automático de notificación push interactiva doce horas antes de la rutina.` *(80 chars)*
  3. `[Botones interactivos]` *(22 chars)* → `Opciones en línea para confirmar el tanque, posponer 24h o cancelar la tarea.` *(77 chars)*
  4. `[Patrón en el bucle]` *(20 chars)* → `El Scheduler solo ejecuta la conmutación tras la autorización explícita de un usuario.` *(86 chars)*
* **Pitch (~35 seg):**
  > «La automatización de la línea de agroquímicos exigió un protocolo estricto bajo el patrón Human-in-the-Loop: a diferencia del agua pura, el fertirriego demanda que el cultivador prepare físicamente la mezcla en el tanque auxiliar antes de conmutar las bombas y válvulas. Para evitar que las rutinas expiraran por falta de atención en la web, el Scheduler programa la labor en estado preliminar y delega en n8n el envío de una alerta push interactiva 12 horas antes de la ejecución. El mensaje presenta botones para confirmar el tanque, posponer la rutina 24 horas o cancelarla. Solo cuando un cultivador confirma explícitamente la preparación física, el sistema autoriza la tarea en PostgreSQL para su despacho seguro.»
* **Frase de Transición hacia Lámina 7.3:**
  > *«Junto a la dosificación, el bot resolvió dos puntos ciegos de mantenimiento físico que amenazaban la continuidad operativa...»*
```
---
```
#### Lámina 7.3: Diagnóstico Correlacionado y Mantenimiento del Filtro (Figura 13)
* **Título:** `INCREMENTO 7: DIAGNÓSTICO Y MANTENIMIENTO PREVENTIVO`
* **Píldora de Subtítulo:** `Detección correlacionada de batería y mantenimiento del filtro de disco`
* **Layout:** Opción 50/50 (Mitad Izquierda: Captura Figura 13 - Notificaciones Telegram / Mitad Derecha: 3 Tarjetas de Contenido).
* **Estructura Visual (Canva):**
```
┌────────────────────────────────────────┬───────────────────────────────────────────────┐
│ INCREMENTO 7: DIAGNÓSTICO Y MANTENIM.  │ ✦ Detección correlacionada de batería y       │
│                                        │   mantenimiento del filtro de disco ✦         │
├────────────────────────────────────────┼───────────────────────────────────────────────┤
│                                        │ [Guarda de 10 minutos]                        │
│                                        │ Compara el estado de la EMA frente al         │
│         [ CAPTURA FIGURA 13            │ actuador para confirmar batería agotada.      │
│       Notificaciones y Botones         │                                               │
│       Interactivos de Asistente        │ [Cadencia de 2 días]                          │
│          PristinoBot en la             │ Aviso matutino y reiteración pre-riego para   │
│         Aplicación Telegram ]          │ limpiar el filtro de disco del cabezal.       │
│                                        │                                               │
│                                        │ [Asentado con /filter]                        │
│                                        │ Registra al cultivador, fecha de limpieza y   │
│                                        │ reprograma el temporizador de dos días.       │
└────────────────────────────────────────┴───────────────────────────────────────────────┘
```
* **Elementos (Columna Derecha):**
  1. `[Guarda de 10 minutos]` *(22 chars)* → `Compara el estado de la EMA frente al actuador para confirmar batería agotada.` *(78 chars)*
  2. `[Cadencia de 2 días]` *(20 chars)* → `Aviso matutino y reiteración pre-riego para limpiar el filtro de disco del cabezal.` *(83 chars)*
  3. `[Asentado con /filter]` *(22 chars)* → `Registra al cultivador, fecha de limpieza y reprograma el temporizador de dos días.` *(83 chars)*
* **Pitch (~35 seg):**
  > «En la Figura 13 observamos los flujos de mantenimiento preventivo y diagnóstico correlacionado en Telegram. Para la EMA Interior, implementamos una regla con guarda de diez minutos: si la estación a batería se desconecta mientras el nodo actuador conectado a la red eléctrica sigue en línea, el sistema descarta fallos de Wi-Fi y alerta de inmediato el agotamiento de batería. Asimismo, para evitar que la acumulación de sedimentos en el filtro de disco redujera la presión hacia los microaspersores, fijamos una cadencia de limpieza de dos días: transcurrido ese lapso, el bot emite una alerta matutina y reitera el aviso una hora antes de cada riego. Al realizar la labor, el operador ejecuta /filter y confirma con un botón en línea, quedando registrado con su nombre y reiniciando el ciclo preventivo.»
* **Frase de Transición hacia la Validación y Cierre:**
  > *«Con los siete incrementos completados, la solución integró la totalidad de sus subsistemas físicos, de software y de comunicación, procediendo a su validación experimental en campo bajo cuatro casos de estudio reales.»*
```
```
```
---
```
### Fase de Validación del Funcionamiento (Casos de Estudio en Campo)
```
#### Lámina V.1: Validación de Gobernanza y Resiliencia en Campo (Figura 14)
* **Título:** `VALIDACIÓN: GOBERNANZA Y RESILIENCIA EN CAMPO`
* **Píldora de Subtítulo:** `✦ Supervisión desatendida 24/7 y respuesta determinista ante fallos de red ✦`
* **Layout:** Opción 50/50 (Mitad Izquierda: Captura Figura 14 - Resiliencia y Tolerancia a Fallos de Red / Mitad Derecha: 3 Tarjetas de Contenido).
* **Estructura Visual (Canva):**
```
┌────────────────────────────────────────┬────────────────────────────────────────┐
│ VALIDACIÓN: GOBERNANZA Y RESILIENCIA   │ ✦ Supervisión desatendida 24/7 y       │
│                                        │   respuesta determinista ante fallos ✦ │
├────────────────────────────────────────┴────────────────────────────────────────┤
│                                        │ [Gobernanza 24/7]                      │
│                                        │ Orquestación continua desatendida con  │
│         [ CAPTURA FIGURA 14            │ confirmación ACK en MQTTS y bitácoras  │
│         Resiliencia y Tolerancia       │ atómicas.                              │
│             a Fallos de Red            │                                        │
│          en Rutinas Hídricas           │ [Despacho de remanente]                │
│         Interrupción y Reanudación     │ Ante corte de red, pausa la rutina de  │
│            de Riego en /history ]      │ 10 min a los 2 min y reanuda los 8 min │
│                                        │ restantes.                             │
│                                        │                                        │
│                                        │ [Reinicio en Relé 8]                   │
│                                        │ Corte de potencia de 200 ms solventa   │
│                                        │ bloqueos en sensores sin reiniciar el  │
│                                        │ controlador.                           │
└────────────────────────────────────────┴────────────────────────────────────────┘
```
* **Elementos (Columna Derecha):**
  1. `[Gobernanza 24/7]` *(17 chars)* → `Orquestación continua desatendida con confirmación ACK en MQTTS y bitácoras atómicas.` *(85 chars)*
  2. `[Despacho de remanente]` *(23 chars)* → `Ante corte de red, pausa la rutina de 10 min a los 2 min y reanuda los 8 min restantes.` *(87 chars)*
  3. `[Reinicio en Relé 8]` *(19 chars)* → `Corte de potencia de 200 ms solventa bloqueos en sensores sin reiniciar el controlador.` *(87 chars)*
* **Pitch (~35 seg):**
  > «Con la plataforma integrada en el orquideario, procedimos a validar su comportamiento continuo bajo escenarios reales. En el primer caso de estudio comprobamos la gobernanza autónoma desatendida las 24 horas del día: el Scheduler centralizó la mensajería MQTTS coordinando bombas y electroválvulas mediante tramas confirmadas por acuse de recibo, registrando cada decisión de forma atómica. En el segundo caso, validamos la tolerancia a fallos ante contingencias de red, tal como ilustra la Figura 14: ante un corte de enlace a los dos minutos de un riego programado de diez, el nodo actuador detuvo la impulsión de inmediato para evitar sobre-riego; al restablecerse la conectividad, el planificador despachó automáticamente los ocho minutos restantes. Asimismo, el ciclo de potencia de 200 milisegundos en el Relé 8 solventó bloqueos transitorios en el bus I2C en menos de dos segundos, sin reiniciar el microcontrolador ni degradar la sesión TLS con el bróker.»
* **Frase de Transición hacia Lámina V.2:**
  > *«Comprobada la resiliencia física de la red y el hardware, el siguiente paso fue validar el criterio agronómico de los motores deliberativos...»*
```
---
```
#### Lámina V.2: Validación de Autonomía Agronómica y Supervisión
* **Título:** `VALIDACIÓN: AUTONOMÍA Y SUPERVISIÓN AGRONÓMICA`
* **Píldora de Subtítulo:** `✦ Prevención de asfixia radicular, mitigación térmica y control en el bucle ✦`
* **Layout:** Opción 1 (4 Píldoras Horizontales).
* **Estructura Visual (Canva):**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ VALIDACIÓN: AUTONOMÍA Y SUPERVISIÓN AGRONÓMICA                                  │
│   ✦ Prevención de asfixia radicular, mitigación térmica y control en el bucle ✦ │
├─────────────────────────────────────────────────────────────────────────────────┤
│ [ Inferencia climática ] Detección algorítmica de lluvias diurnas y nocturnas   │
│                          sin falla por corrosión galvánica.                     │
│                                                                                 │
│ [ Vetos anti-asfixia   ] Bloqueo de riego ante lluvia o saturación higrométrica │
│                          para proteger la zona radicular.                       │
│                                                                                 │
│ [ Enfriamiento pasivo  ] Pulsos de humectación en piso bajo radiación cenital   │
│                          bajan temperatura sin mojar hojas.                     │
│                                                                                 │
│ [ Supervisión en bucle ] Control manual seguro con temporizador en web y        │
│                          confirmación de mezclas por Telegram.                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```
* **Elementos:**
  1. `[Inferencia climática]` *(22 chars)* → `Detección algorítmica de lluvias diurnas y nocturnas sin falla por corrosión galvánica.` *(87 chars)*
  2. `[Vetos anti-asfixia]` *(20 chars)* → `Bloqueo de riego ante lluvia o saturación higrométrica para proteger la zona radicular.` *(87 chars)*
  3. `[Enfriamiento pasivo]` *(21 chars)* → `Pulsos de humectación en piso bajo radiación cenital bajan temperatura sin mojar hojas.` *(87 chars)*
  4. `[Supervisión en bucle]` *(22 chars)* → `Control manual seguro con temporizador en web y confirmación de mezclas por Telegram.` *(85 chars)*
* **Pitch (~35 seg):**
  > «El tercer caso de estudio validó la toma de decisiones autónomas y la mitigación de estrés microclimático en las plantas. La sustitución del sensor resistivo por el motor de inferencia meteorológica garantizó una detección precisa de lluvia sin degradación física. Sobre esta base, el motor hídrico aplicó vetos automáticos ante lluvia activa, precipitaciones recientes o saturación higrométrica, impidiendo el anegamiento del sustrato y protegiendo las raíces contra la asfixia radicular. Paralelamente, durante las horas de radiación cenital, el sistema activó pulsos de humectación en el piso de grava, logrando un enfriamiento evaporativo pasivo que redujo la temperatura ambiental sin mojar el follaje susceptible a hongos. Finalmente, en el cuarto caso de estudio, los cultivadores operaron el sistema mediante las interfaces web y el asistente en Telegram, interactuando con disparos manuales seguros y autorizando mezclas con el patrón Human-in-the-Loop.»
* **Frase de Transición hacia Lámina DOC.1:**
  > *«Para asegurar que esta solución fuera reproducible, mantenible y transferible al personal del orquideario, formalizamos su ingeniería mediante una rigurosa documentación...»*
```
---
```
### Fase de Documentación del Prototipo y Transferencia
```
#### Lámina DOC.1: Documentación del Prototipo y Transferencia Tecnológica
* **Título:** `DOCUMENTACIÓN DEL PROTOTIPO Y TRANSFERENCIA`
* **Píldora de Subtítulo:** `✦ Manuales técnicos, memoria constructiva y guías operativas del orquideario ✦`
* **Layout:** Opción 1 (4 Píldoras Horizontales).
* **Estructura Visual (Canva):**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ DOCUMENTACIÓN DEL PROTOTIPO Y TRANSFERENCIA                                     │
│   ✦ Manuales técnicos, memoria constructiva y guías operativas del orquideario ✦│
├─────────────────────────────────────────────────────────────────────────────────┤
│ [ Manual Técnico       ] Contenedores Docker, scripts .sh, firmware MicroPython │
│                          y motor en Apéndices H y F.                            │
│                                                                                 │
│ [ Memoria Constructiva ] Modelado 3D de garitas, tablero eléctrico y cableado   │
│                          estructurado en Apéndice G.                            │
│                                                                                 │
│ [ Manual de Operación  ] Guía para los cinco módulos web, dosificación          │
│                          agronómica y bot en Apéndice E.                        │
│                                                                                 │
│ [ Transferencia campo  ] Capacitación al equipo de cultivadores para            │
│                          autogestión y mantenimiento preventivo.                │
└─────────────────────────────────────────────────────────────────────────────────┘
```
* **Elementos:**
  1. `[Manual Técnico]` *(16 chars)* → `Contenedores Docker, scripts .sh, firmware MicroPython y motor en Apéndices H y F.` *(82 chars)*
  2. `[Memoria Constructiva]` *(22 chars)* → `Modelado 3D de garitas, tablero eléctrico y cableado estructurado en Apéndice G.` *(80 chars)*
  3. `[Manual de Operación]` *(21 chars)* → `Guía para los cinco módulos web, dosificación agronómica y bot en Apéndice E.` *(77 chars)*
  4. `[Transferencia campo]` *(22 chars)* → `Capacitación al equipo de cultivadores para autogestión y mantenimiento preventivo.` *(83 chars)*
* **Pitch (~35 seg):**
  > «La última fase del Capítulo IV consolidó la transferencia tecnológica del prototipo a través de tres cuerpos documentales exhaustivos. En primer lugar, el Manual Técnico y los apéndices H y F formalizan la arquitectura de contenedores Docker, los scripts de automatización en shell, las variables de entorno, el firmware de los microcontroladores y la máquina de estados del motor deliberativo. En segundo lugar, la Memoria Constructiva en el Apéndice G documenta el modelado 3D de las garitas Stevenson, el ensamblaje electromecánico del tablero y el cableado estructurado blindado. Y en tercer lugar, el Manual de Operación en el Apéndice E instruye al personal sobre los cinco módulos de la aplicación web y los comandos de Telegram. Esta documentación permitió capacitar con éxito al equipo de cultivadores, garantizando la autogestión y sostenibilidad operativa del orquideario sin dependencia del desarrollador.»
* **Frase de Transición hacia el Capítulo V (Conclusiones y Recomendaciones):**
  > *«Con la ingeniería, la validación experimental y la transferencia tecnológica plenamente consolidadas, cerramos el Capítulo IV y damos paso a las conclusiones y recomendaciones finales de este trabajo de grado.»*


---

# CAPÍTULO V: CONCLUSIONES Y RECOMENDACIONES

---

## Fase de Conclusiones

### Lámina C.1: Conclusiones: Objetivos 1 al 3 (Análisis, Diseño e Implementación)
* **Título:** CONCLUSIONES: ANÁLISIS, DISEÑO E IMPLEMENTACIÓN
* **Píldora de Subtítulo:** ✦ Logro de objetivos 1, 2 y 3: especificación, arquitectura y construcción ✦
* **Layout:** Opción 1 (3 Filas Horizontales con píldora a la izquierda y cápsula a la derecha).
* **Estructura Visual (Canva):**
`
┌─────────────────────────────────────────────────────────────────────────────────┐
│ CONCLUSIONES: ANÁLISIS, DISEÑO E IMPLEMENTACIÓN                                 │
│   ✦ Logro de objetivos 1, 2 y 3: especificación, arquitectura y construcción ✦  │
├─────────────────────────────────────────────────────────────────────────────────┤
│ [ Obj. 1: Análisis       ] Diagnóstico ecofisiológico formalizó 19              │
│                            requerimientos funcionales y 9 no funcionales.       │
│                                                                                 │
│ [ Obj. 2: Diseño         ] Arquitectura desacoplada por capas con MQTTS,       │
│                            InfluxDB, firmware asíncrono y motores.              │
│                                                                                 │
│ [ Obj. 3: Implementación ] Siete incrementos con TDDM4IoTS, Thin Edge           │
│                            liberando 15 KB y autorrecuperación física.          │
└─────────────────────────────────────────────────────────────────────────────────┘
`
* **Elementos:**
  1. [Obj. 1: Análisis] *(16 chars)* → Diagnóstico ecofisiológico formalizó 19 requerimientos funcionales y 9 no funcionales. *(86 chars)*
  2. [Obj. 2: Diseño] *(14 chars)* → Arquitectura desacoplada por capas con MQTTS, InfluxDB, firmware asíncrono y motores. *(85 chars)*
  3. [Obj. 3: Implementación] *(22 chars)* → Siete incrementos con TDDM4IoTS, Thin Edge liberando 15 KB y autorrecuperación física. *(86 chars)*
* **Pitch (~35 seg):**
  > «Al contrastar los objetivos específicos con los resultados de ingeniería, ratificamos su cumplimiento estricto. En el **primer objetivo de análisis**, el diagnóstico ecofisiológico formalizó 19 requerimientos funcionales y 9 no funcionales que tradujeron las necesidades del cultivo en criterios medibles. En el **segundo objetivo de diseño**, la descomposición en capas estructuró una arquitectura modular bajo canales MQTTS seguros, series temporales en InfluxDB, firmware asíncrono y motores deliberativos. Y en el **tercer objetivo de implementación**, el modelo incremental junto a TDDM4IoTS guió siete iteraciones que resolvieron desafíos físicos de campo: optimizamos la memoria en los ESP32 con una arquitectura Thin Edge que liberó 15 KB de RAM, dotamos de autorrecuperación física a los sensores con el Relé 8 y superamos la corrosión reemplazando hardware defectuoso por inferencia algorítmica.»
* **Frase de Transición hacia Lámina C.2:**
  > *«Completada la construcción, los dos objetivos finales consolidaron la validación experimental y la transferencia tecnológica...»*

---

### Lámina C.2: Conclusiones: Objetivos 4 y 5 (Validación, Documentación y Aporte Global)
* **Título:** CONCLUSIONES: VALIDACIÓN, DOCUMENTACIÓN Y APORTE
* **Píldora de Subtítulo:** ✦ Logro de objetivos 4 y 5: verificación en campo, transferencia y lazo cerrado ✦
* **Layout:** Opción 1 (3 Filas Horizontales con píldora a la izquierda y cápsula a la derecha).
* **Estructura Visual (Canva):**
`
┌─────────────────────────────────────────────────────────────────────────────────┐
│ CONCLUSIONES: VALIDACIÓN, DOCUMENTACIÓN Y APORTE                                │
│  ✦ Logro de objetivos 4 y 5: verificación en campo, transferencia y lazo ✦      │
├─────────────────────────────────────────────────────────────────────────────────┤
│ [ Obj. 4: Validación     ] 28 requerimientos cumplidos, 57 días de inferencia   │
│                            pluvial y 137 vetos contra anoxia.                   │
│                                                                                 │
│ [ Obj. 5: Documentación  ] Manuales técnico, de operación y memoria             │
│                            constructiva para autogestión sin dependencia.       │
│                                                                                 │
│ [ Aporte Global          ] Sustitución de la gestión empírica tradicional por   │
│                            control autónomo en lazo cerrado.                    │
└─────────────────────────────────────────────────────────────────────────────────┘
`
* **Elementos:**
  1. [Obj. 4: Validación] *(18 chars)* → 28 requerimientos cumplidos, 57 días de inferencia pluvial y 137 vetos contra anoxia. *(85 chars)*
  2. [Obj. 5: Documentación] *(21 chars)* → Manuales técnico, de operación y memoria constructiva para autogestión sin dependencia. *(87 chars)*
  3. [Aporte Global] *(15 chars)* → Sustitución de la gestión empírica tradicional por control autónomo en lazo cerrado. *(84 chars)*
* **Pitch (~35 seg):**
  > «En el **cuarto objetivo de validación**, las pruebas continuas desatendidas confirmaron el cumplimiento pleno de los 28 requerimientos técnicos: el motor de inferencia meteorológica demostró detección precisa durante 57 días históricos contrastados con bitácora, mientras que el motor hídrico auditó 369 tareas y ejecutó 137 vetos autónomos, protegiendo las raíces contra la asfixia radicular. En el **quinto objetivo de documentación**, formalizamos los manuales técnico, operacional y la memoria constructiva en los apéndices F, G y H, garantizando la transferencia tecnológica y la autogestión local del personal. En conclusión general, la plataforma sustituyó con éxito el manejo empírico e intuitivo por un control telemétrico autónomo en lazo cerrado, transformando el cuidado del orquídeario en una gestión técnica orientada por datos.»
* **Frase de Transición hacia Lámina R.1:**
  > *«Esta experiencia empírica acumulada en producción fundamentó directrices técnicas precisas para la evolución y escalabilidad del orquideario...»*

---

### Lámina R.1: Recomendaciones para Trabajos Futuros y Escalabilidad
* **Título:** CAPÍTULO V: RECOMENDACIONES TÉCNICAS
* **Píldora de Subtítulo:** ✦ Directrices para la consolidación, instrumentación y escalabilidad del sistema ✦
* **Layout:** Opción 1 (4 Píldoras Horizontales con título separado de contenido).
* **Estructura Visual (Canva):**
`
┌─────────────────────────────────────────────────────────────────────────────────┐
│ CAPÍTULO V: RECOMENDACIONES TÉCNICAS                                            │
│   ✦ Directrices para la consolidación, instrumentación y escalabilidad... ✦     │
├─────────────────────────────────────────────────────────────────────────────────┤
│ [ Filtrado primario    ] Filtro de sedimentos previo a la bomba para            │
│                          respaldar el filtro de disco del cabezal.              │
│                                                                                 │
│ [ Sensores en sustrato ] Sondas industriales SHT40 sinterizadas en macetas      │
│                          de prueba para curvas de secado.                       │
│                                                                                 │
│ [ Pluviómetro mecánico ] Módulo tipping-bucket con interrupciones ISR en        │
│                          firmware para medir lámina en mm.                      │
│                                                                                 │
│ [ Autonomía fotovoltaica] Panel solar con controlador de litio en EMA Interior  │
│                          para portabilidad continua.                            │
└─────────────────────────────────────────────────────────────────────────────────┘
`
* **Elementos:**
  1. [Filtrado primario] *(17 chars)* → Filtro de sedimentos previo a la bomba para respaldar el filtro de disco del cabezal. *(85 chars)*
  2. [Sensores en sustrato] *(20 chars)* → Sondas industriales SHT40 sinterizadas en macetas de prueba para curvas de secado. *(82 chars)*
  3. [Pluviómetro mecánico] *(20 chars)* → Módulo tipping-bucket con interrupciones ISR en firmware para medir lámina en mm. *(81 chars)*
  4. [Autonomía fotovoltaica] *(22 chars)* → Panel solar con controlador de litio en EMA Interior para portabilidad continua. *(80 chars)*
* **Pitch (~45 seg):**
  > «Con miras a consolidar y proyectar la solución, formulamos cuatro recomendaciones puntuales de ingeniería: primero, en el circuito hidráulico, instalar un prefiltro de sedimentos previo a la bomba para evitar que el filtro de disco sature prematuramente tras seis ciclos, estabilizando el caudal y protegiendo la motobomba de 1 HP; segundo, en el área agronómica, insertar sensores de grado industrial con filtro sinterizado tipo Sensirion SHT40 dentro de macetas de experimentación, caracterizando las curvas reales de retención hídrica de nuevos sustratos sin arriesgar ejemplares comerciales por anoxia; tercero, en la EMA Exterior, incorporar un pluviómetro mecánico de balancín gestionado por interrupciones de hardware en MicroPython para cuantificar milímetros de lámina precipitada sin bloquear el runtime asíncrono; y cuarto, en la EMA Interior, integrar captación solar fotovoltaica para dotarla de autosuficiencia energética continua, preservando su portabilidad espacial entre las mesas sin demandar recargas periódicas de batería.»
* **Frase de Cierre de la Defensa de Grado:**
  > *«Con estas recomendaciones cerramos la exposición formal de nuestro Trabajo Instrumental de Grado. Agradezco sinceramente a mi tutor académico, tutor empresarial, jurado evaluador y a la Universidad Católica Andrés Bello por su acompañamiento. Quedo a partir de este instante a su entera disposición para responder a sus observaciones y preguntas. Muchas gracias.»*

---

# AUDITORÍA INTEGRAL DE TIEMPOS Y ESTRATEGIA DE CALIBRACIÓN (VENTANA DE 30 MINUTOS)

```
Auditoría cronométrica detallada de las 56 láminas del discurso de defensa y plan táctico de calibración de ritmo (pacing) para garantizar una exposición exitosa y controlada dentro del límite estricto de 30 minutos reglamentarios.
```

## 1. Resumen Cronométrico Nominal por Bloques

| Bloque Temático | Láminas | Tiempo Nominal Acumulado | Promedio por Lámina | Porcentaje del Tiempo |
| :--- | :---: | :---: | :---: | :---: |
| **Apertura y Fundamentación** (Cap. I, II y III) | Láminas 1 a 8 (8) | 7 min 45 s (465 s) | ~58.1 s | 21.7 % |
| **Fase 1: Análisis y Requisitos** (Cap. IV) | Láminas 1.1 a 1.4 (4) | 2 min 20 s (140 s) | 35.0 s | 6.5 % |
| **Fase 2: Diseño Conceptual** (Cap. IV) | Láminas 2.1 a 2.3 (3) | 1 min 45 s (105 s) | 35.0 s | 4.9 % |
| **Fase 3: Diseño Básico** (Cap. IV) | Láminas 3.1 a 3.3 (3) | 1 min 45 s (105 s) | 35.0 s | 4.9 % |
| **Fase 4: Diseño Detallado** (Cap. IV) | Láminas D.1A a D.2B (4) | 2 min 20 s (140 s) | 35.0 s | 6.5 % |
| **Incrementos 1 y 2: Infraestructura y Potencia** | Inc. 1 + Láminas 2.1 a 2.4 (5) | 2 min 35 s (155 s) | 31.0 s | 7.2 % |
| **Incrementos 3 y 4: Backend, Telemetría y EMA** | Láminas 3.1 a 4.6 (13) | 7 min 35 s (455 s) | 35.0 s | 21.2 % |
| **Incrementos 5, 6 y 7: Inferencia, App y Bot** | Láminas 5.1 a 7.3 (11) | 6 min 25 s (385 s) | 35.0 s | 18.0 % |
| **Validación y Documentación** (Cap. IV) | Láminas V.1, V.2 y DOC.1 (3) | 1 min 45 s (105 s) | 35.0 s | 4.9 % |
| **Capítulo V: Conclusiones y Recomendaciones** | Láminas C.1 y R.1 (2) | 1 min 30 s (90 s) | 45.0 s | 4.2 % |
| **TOTAL NOMINAL (56 Láminas)** | **56 Láminas** | **35 min 45 s (2145 s)** | **~38.3 s** | **100.0 %** |

> [!WARNING]
> **Superación de la Ventana Reglamentaria en Régimen Nominal:**  
> A un ritmo pausado y discursivo completo (35-45 segundos por lámina), el tiempo total suma **35 minutos y 45 segundos**, excediendo el tope de 30 minutos por **5 minutos y 45 segundos**.  
> En una defensa de grado, agotar el tiempo antes de exponer los resultados, conclusiones y recomendaciones genera penalización de la calificación o corte abrupto por parte del jurado.

---

## 2. Estrategia de Calibración Táctica para la Ventana de 30 Minutos

Para realizar una defensa impecable, el objetivo cronométrico real no debe ser 30:00 (en el borde), sino **27 minutos de exposición efectiva (con 3 minutos de colchón de seguridad)** para imprevistos de cambio de diapositiva, pausas respiratorias o preguntas introductorias del jurado.

### Plan de Ajuste de Ritmo (Pacing) por Secciones

1. **Apertura y Fundamentación (Meta: 6 min 00 s — Ahorro: -1 min 45 s):**
   * *Lámina 1 (Planteamiento):* Compactar de 90s a **60s**. Ir directo a la contradicción agronómica: "riego ciego interdiario vs. asfixia del velamen".
   * *Láminas 2, 3 y 4 (Objetivos):* Totalizar en **1 min 30 s** (en lugar de 2 min). Los objetivos específicos 1 y 2 se enuncian de forma ágil; 3, 4 y 5 se ligan a los entregables físicos.
   * *Láminas 7 y 8 (Teoría y Metodología):* Reducir de 2m 35s a **1m 50s**. Enfatizar únicamente el desacoplamiento C4/MQTT y la justificación de TDDM4IoTS frente a la inviabilidad de Scrum puro.

2. **Capítulo IV: Fases 1 a 4 de Diseño (Meta: 6 min 00 s — Ahorro: -1 min 50 s):**
   * Dado que son 14 láminas conceptuales y de diseño de detalle, reducir el pitch de 35s a **25-28s por lámina**.
   * El diseño visual en pantalla (píldoras y diagramas) ya comunica el detalle; el ponente debe resaltar únicamente la decisión de ingeniería (ej. "3 tensiones segregadas en el tablero", "exclusión mutua asyncio.Lock", "persistencia políglota Influx/Postgres").

3. **Capítulo IV: Incrementos 1 al 7 y Validación (Meta: 13 min 30 s — Ahorro: -2 min 00 s):**
   * Son 29 láminas de desarrollo experimental.
   * Aplicar el ritmo de **27-30s por lámina** en aquellas donde se muestran figuras reales (Figuras 8, 9, 11, 13 y 14), apoyándose en la imagen para explicar el problema y la solución sin redundancias verbales.
   * Destacar con fuerza los hitos protagónicos: la resolución de la corrosión por el motor de lluvia (Lámina 5.3), los 137 vetos de riego en producción (Lámina V.2) y el ciclo forzado en Relé 8 (Lámina 4.4).

4. **Capítulo V: Conclusiones y Recomendaciones (Meta: 1 min 30 s — Firme y Contundente):**
   * *Lámina C.1 (Conclusiones):* **45s** con tono resolutivo, ratificando el éxito de la plataforma en lazo cerrado y la satisfacción de los 28 requisitos.
   * *Lámina R.1 (Recomendaciones):* **45s** enumerando las 4 directrices de escalabilidad y agradeciendo al jurado.

### Resumen del Cronograma Calibrado (27 Minutos Objetivo)

| Etapa de la Defensa | Tiempo Nominal | Tiempo Calibrado (Objetivo) | Margen / Ahorro |
| :--- | :---: | :---: | :---: |
| **1. Apertura, Problema y Metodología** (Láminas 1 a 8) | 7 min 45 s | **6 min 00 s** | -1 min 45 s |
| **2. Fases de Análisis y Diseño** (Láminas 1.1 a D.2B) | 7 min 50 s | **6 min 00 s** | -1 min 50 s |
| **3. Incrementos y Construcción** (Incrementos 1 al 7) | 15 min 20 s | **12 min 30 s** | -2 min 50 s |
| **4. Validación y Documentación** (Láminas V.1 a DOC.1) | 1 min 45 s | **1 min 30 s** | -0 min 15 s |
| **5. Conclusiones y Recomendaciones** (Láminas C.1 y R.1) | 1 min 30 s | **1 min 30 s** | 0 min 00 s |
| **Tiempo de Exposición Efectiva** | **35 min 45 s** | **27 min 30 s** | **-8 min 15 s** |
| **Colchón de Reserva de Seguridad** | - | **2 min 30 s** | +2 min 30 s |
| **VENTANA TOTAL DISPONIBLE** | - | **30 min 00 s** | **¡Alineación Perfecta!** |
