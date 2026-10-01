# Apéndices

## Apéndice A: Marco Normativo para la Especificación de Requerimientos del Sistema

El presente apéndice expone los criterios de calidad y taxonomías normativas empleadas para formular la Especificación de Requerimientos del Sistema (SRS) en el Capítulo IV del informe de grado, fundamentados en los estándares internacionales **IEEE 830 / ISO/IEC/IEEE 29148** (ingeniería de requerimientos) e **ISO/IEC 25010** (modelo de calidad del producto de software).

---

### 1. Criterios de Formulación de Requerimientos (IEEE 830 / ISO/IEC/IEEE 29148)

La Tabla Ap-A1 sintetiza las propiedades normativas que rigieron la redacción y validación de los requerimientos funcionales y no funcionales del sistema en el orquideario.

#### Tabla Ap-A1. *Criterios de formulación de requerimientos según IEEE 830 / ISO/IEC/IEEE 29148*

| Criterio | Descripción Normativa | Aplicación en la SRS de PristinoPlant |
| :--- | :--- | :--- |
| **No ambiguo** | Admite una única interpretación por parte de desarrolladores, jurados y usuarios. | Enunciados directos con terminología unívoca de agricultura protegida y software. |
| **Completo** | Describe todas las entradas, condiciones de procesamiento y salidas esperadas. | Especifica magnitudes ($T, HR, Lux$), duraciones en segundos y estados en base de datos. |
| **Verificable** | Puede comprobarse objetivamente mediante inspección, prueba en banco o demostración. | Cada requerimiento cuenta con método de verificación y resultado experimental observable. |
| **Consistente** | No presenta contradicciones lógicas ni operativas con otros requerimientos. | Coherencia entre automatización de riego, guardas ambientales y conmutación de potencia. |
| **Priorizable** | Permite jerarquizar su implementación de acuerdo a las fases del desarrollo incremental. | Requerimientos estructurados y distribuidos a lo largo de los siete (7) incrementos. |
| **Modificable** | Mantiene una estructura modular que facilita su revisión y ajuste sin efectos colaterales. | Desacoplamiento entre adquisición de borde, servicios backend y presentación web. |
| **Trazable** | Permite vincular la necesidad de origen con su diseño conceptual y código ejecutable. | Correspondencia directa entre necesidad del cultivador, módulo de software y prueba TDD. |

*Nota.* Adaptado de *Systems and software engineering — Life cycle processes — Requirements engineering* (ISO/IEC/IEEE 29148:2018).

---

### 2. Taxonomía de Calidad del Producto de Software (ISO/IEC 25010)

La Tabla Ap-A2 expone las características del modelo de calidad utilizadas para categorizar los requerimientos no funcionales y las restricciones técnicas de la plataforma.

#### Tabla Ap-A2. *Características de calidad del software según ISO/IEC 25010*

| Característica | Definición Estándar | Dimensión Técnica en PristinoPlant |
| :--- | :--- | :--- |
| **Adecuación Funcional** | Capacidad del producto para satisfacer las necesidades operativas declaradas. | Automatización hídrica desatendida, dosificación en laboratorio e inventario en mesas. |
| **Eficiencia de Desempeño** | Rendimiento relativo a la cantidad de recursos consumidos y tiempos de respuesta. | Muestreo telemétrico cada 60 s y latencia media de comando MQTT inferior a 350 ms. |
| **Compatibilidad** | Grado en que el sistema intercambia información en un entorno tecnológico común. | Interoperabilidad estandarizada entre microcontroladores ESP32, Mosquitto y Next.js. |
| **Usabilidad** | Facilidad de comprensión, aprendizaje, operabilidad y accesibilidad para el usuario. | Sistema de diseño modular responsivo y flujos interactivos de conmutación asistida. |
| **Confiabilidad** | Capacidad del sistema para mantener su nivel de rendimiento y tolerar fallos. | Guardas locales de hardware fail-safe en firmware y persistencia inmutable en `TaskLog`. |
| **Seguridad** | Protección de la información y salvaguarda del acceso a datos autorizados. | Cifrado MQTTS con TLS 1.3, autenticación por roles (RBAC) y aislamiento en contenedores. |
| **Mantenibilidad** | Facilidad con la que el producto puede ser modificado, corregido o adaptado. | Monorepositorio Turborepo con tipado estricto TypeScript y cero uso de tipo `any`. |
| **Portabilidad** | Facilidad con que el software puede ser transferido a otro entorno o servidor. | Contenerización homogénea y reproducible de microservicios mediante Docker Compose. |

*Nota.* Adaptado de *Systems and software Quality Requirements and Evaluation (SQuaRE)* (ISO/IEC 25010:2011).
