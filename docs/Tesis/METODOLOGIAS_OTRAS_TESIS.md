# Análisis Comparativo de Metodologías de Desarrollo en Otras Tesis

Este documento recopila y analiza los enfoques metodológicos empleados en proyectos de grado afines (Sandoval y Moreno) para servir de insumo y contraste con la metodología adoptada en el proyecto **PristinoPlant**.

---

## 1. Caso 1: Tesis Sandoval (Robot Educativo Concurrente)

### 1.1. Resumen de la Selección Metodológica
* **Contexto del Proyecto**: Diseño y construcción de un robot educativo basado en el paradigma concurrente para niños de 6 a 8 años.
* **Dilema Metodológico (Tradicional vs. Ágil)**:
  * Descarta el enfoque ágil debido a que **no contaba con interacción constante con los usuarios finales**, lo cual limita la aplicación efectiva de los principios ágiles sobre retroalimentación continua (Sommerville, 2011; Koch, 2005).
  * Opta por un enfoque tradicional estructurado que proporciona mayor control del proceso y definición clara de etapas.
* **Comparativa de Modelos Tradicionales**:
  * Evaluó Cascada, Espiral, Incremental y Prototipos mediante matriz multicriterio (adaptabilidad al cambio, manejo de complejidad, riesgo técnico e interacción con usuario).
  * **Selección Final**: **Modelo Incremental** (Pressman, 2010).

### 1.2. Justificación y Fases del Modelo Incremental (Pressman, 2010)
* **Justificación**: Gestión modular de la complejidad, pruebas progresivas, incorporación sucesiva de funcionalidades e integración gradual de hardware y software (mitigación de riesgos técnicos).
* **Fases Aplicadas**:
  1. **Comunicación**: Levantamiento de requerimientos y fundamentación teórica del pensamiento computacional.
  2. **Planeación**: Definición de incrementos, actividades, recursos y cronograma de hardware y software.
  3. **Modelado**: Selección de componentes electrónicos, estructura física y lógica de control concurrente.
  4. **Construcción**: Ensamble físico y codificación de software en incrementos con pruebas continuas.
  5. **Despliegue**: Pruebas de funcionamiento del robot, validación y documentación formal.

---

## 2. Caso 2: Tesis Moreno (Estación Meteorológica Escolar e IDE)

### 2.1. Resumen del Enfoque Híbrido / Complementario
* **Contexto del Proyecto**: Estación meteorológica física prototipo integrada con una plataforma de software/IDE para contexto escolar.
* **Estrategia Metodológica Dual**:
  1. **Hardware (Estación Física)**: Metodología basada en **Prototipos** (Pressman, 2010).
  2. **Software (Plataforma e IDE)**: Metodología basada en el **Modelo Incremental** (Pressman, 2010).

### 2.2. Fases y Desglose Metodológico
* **Modelo Basado en Prototipos (Hardware de la Estación)**:
  * *Comunicación y Requerimientos*: Identificar variables ambientales, restricciones de robustez, costo y contexto escolar.
  * *Planificación y Diseño Rápido*: Selección preliminar de sensores, microcontroladores y esquema de conexión.
  * *Construcción del Prototipo*: Ensamble físico y conexiones eléctricas provisionales.
  * *Evaluación y Retroalimentación*: Calidad de lecturas, estabilidad de conexiones y riesgos físicos.
  * *Refinamiento y Consolidación*: Reorganización de cableado, mejora de conectores y fijación estructural.
* **Modelo Incremental (Software / IDE / Integración)**:
  * *Comunicación*: Requerimientos globales de la plataforma.
  * *Planeación del Incremento*: Alcance y cronograma del incremento funcional.
  * *Modelado (Análisis y Diseño)*: Especificación de funciones, arquitectura inicial y datos.
  * *Construcción*: Codificación y pruebas de unidad e integración.
  * *Despliegue y Retroalimentación*: Entrega para feedback e iteración al siguiente incremento.

---

## 3. Matriz de Contraste con PristinoPlant

| Criterio | Tesis Sandoval | Tesis Moreno | Proyecto PristinoPlant |
| :--- | :--- | :--- | :--- |
| **Dominio** | Robótica Educativa (HW + SW Concurrente). | Meteorología Escolar (Estación HW + IDE SW). | **Agricultura Inteligente / Invernaderos (HW Potencia + Sensores + Edge + Cloud + E-commerce).** |
| **Paradigma Base** | Modelo Incremental puro (Pressman). | Híbrido: Prototipos (HW) + Incremental (SW). | **Modelo Incremental (Macroestructura Pressman) + TDDM4IoTS (Microestructura TDD e ingeniería IoT).** |
| **Tratamiento del Hardware** | Construcción progresiva en las fases de modelado y construcción. | Ciclos rápidos de refinamiento empírico de prototipos. | **TDDM4IoTS**: Pruebas de aceptación previas, desacople por capas, protección eléctrica (24V/30A), resiliencia de conexión y descarte documentado. |
| **Gestión de la Complejidad** | Tareas manejables divididas en entregables. | Separación tajante entre equipo físico y software. | **Monorepositorio en 6 Iteraciones Integrales**, sincronizando firmware MicroPython, servicios Docker, reglas de inferencia y plataforma web. |
| **Referencia Teórica** | Pressman (2010), Sommerville (2011). | Pressman (2010). | **Pressman (2010), Guerrero-Ulloa et al. (2020) [TDDM4IoTS], y Hornos & Quinde (2024) [Review IoT].** |
