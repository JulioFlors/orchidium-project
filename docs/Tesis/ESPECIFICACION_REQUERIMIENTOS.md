# Especificación de Requisitos de Software y Hardware — Sistema PristinoPlant

**Documento**: Especificación Formal de Requisitos (SRS) para el Trabajo Instrumental de Grado (TIG)  
**Institución**: Universidad Católica Andrés Bello (UCAB Extensión Guayana) — Facultad de Ingeniería  
**Proyecto**: Sistema de Gestión de Invernaderos Basado en Agricultura Inteligente para el Cultivo de Orquídeas  
**Autor**: Julio Flores  
**Referencia Normativa**: Estándar IEEE 830 / ISO/IEC/IEEE 29148 / ISO/IEC 25010  

---

## 1. Introducción y Propósito del Sistema

El presente documento define la especificación formal de Requisitos Funcionales (RF) y Requisitos No Funcionales (RNF) para la plataforma ciber-física **PristinoPlant**. El sistema está diseñado para tecnificar y automatizar el cultivo, monitoreo ambiental, nutrición y comercialización de orquídeas en el vivero de PristinoPlant (San Félix, Estado Bolívar, Venezuela), integrando computación de borde (Edge Computing con ESP32), servicios de orquestación en la nube (Docker en VPS) y una aplicación web interactiva (Next.js).

### 1.1. Acciones Principales del Sistema

El sistema articula su operación en cuatro grandes ciclos de acción ciber-física:

1. **Ciclo de Adquisición y Análisis Microclimático:** Captura telemétrica continua de variables de campo (temperatura, humedad relativa e iluminancia), consolidación de analítica diaria por zona de cultivo e identificación de eventos pluviales.
2. **Ciclo de Operaciones Hidráulicas y Riego:**
   * *Accionamiento Manual:* Conmutación inmediata de electroválvulas y bomba con temporizadores de corte autónomo.
   * *Accionamiento Diferido:* Gestión de colas de tareas con cuenta regresiva, reprogramación o cancelación preventiva.
   * *Accionamiento Programado:* Ejecución recurrente automatizada mediante orquestación en el microservicio Scheduler, sujeta a vetos y espaciamiento reactivo ante el microclima.
   * *Trazabilidad Operacional:* Auditoría histórica de cada tarea ejecutada, registrando duración real, operador, origen y motivos de veto ambiental.
3. **Ciclo Agronómico y de Laboratorio:**
   * *Gestión de Insumos:* Catálogo de agroquímicos puros y formulación de recetas compuestas con proporciones de dilución balanceadas.
   * *Planificación de Programas:* Estructuración de secuencias rotativas nutricionales y fitosanitarias para evitar resistencia biológica.
   * *Programación de la Ejecución:* Calendarización (día de la semana, hora y zonas) para aplicación manual o automatizada mediante la línea de agroquímicos del circuito hidráulico.
4. **Ciclo Comercial y Cierre de Ventas:** Publicación de catálogo en línea, selección multimoneda (USD/VES), congelamiento temporal de existencias (12 horas) y canalización de comprobantes de pago hacia WhatsApp para su posterior conciliación.

---

## 2. Requerimientos Funcionales (RF)

Los requerimientos funcionales definen las capacidades fundamentales del sistema, estructurados en 7 módulos operativos afines. Cada requisito describe el comportamiento del sistema de forma atemporal, abstracta y concisa, cumpliendo con la restricción de formato para tablas formales de grado ($\le 175$ caracteres).

### Tabla 1. Requerimientos funcionales del sistema

| Cód. | Descripción |
| :---: | :--- |
| **Módulo I** | **Seguridad y Acceso** |
| **RF01** | Gestionar el registro y autenticación de usuarios mediante credenciales, administrando el control de acceso basado en roles. |
| **Módulo II** | **Comercio Electrónico y Gestión de Ventas** |
| **RF02** | Explorar el catálogo botánico de la tienda con búsqueda de texto y filtros dinámicos por género y categoría. |
| **RF03** | Consultar la información botánica de la especie, galería de imágenes, precios por tamaño de maceta y disponibilidad para añadir al carrito. |
| **RF04** | Gestionar los productos seleccionados, actualizar cantidades por tamaño de maceta y calcular los subtotales de compra en tiempo real. |
| **RF05** | Gestionar datos de facturación y entrega, registrar el método de pago seleccionado y canalizar la verificación manual del pago de la orden multimoneda. |
| **RF06** | Conciliar pagos de pedidos online, autorizar despachos y registrar ventas comerciales directas realizadas en el orquideario. |
| **Módulo III** | **Inventario Físico y Gemelos Digitales** |
| **RF07** | Administrar el catálogo botánico de especies, registrando datos taxonómicos, referencias de floración y documentación fotográfica. |
| **RF08** | Registrar y gestionar plantas físicas individuales en invernadero, controlando su tamaño de maceta, estado y ubicación en mesas de cultivo. |
| **RF09** | Vincular variantes comerciales con el stock físico en mesa, fijar precios en USD y procesar avisos de reposición a clientes interesados. |

---

### Tabla 1. Requerimientos funcionales del sistema (Cont.)

| Cód. | Descripción |
| :---: | :--- |
| **Módulo IV** | **Dosificación y Laboratorio Agronómico** |
| **RF10** | Administrar el inventario de agroquímicos puros y formular recetas de mezclas compuestas con proporciones de dilución balanceadas. |
| **RF11** | Configurar programas nutricionales y fitosanitarios por ciclos rotativos secuenciales para mitigar la resistencia biológica. |
| **RF12** | Programar la ejecución manual o automatizada de planes agronómicos, determinando día de la semana, hora de inicio y zonas de aplicación. |
| **Módulo V** | **Telemetría y Monitoreo Ambiental** |
| **RF13** | Capturar de forma continua la telemetría ambiental transmitida por los nodos meteorológicos. |
| **RF14** | Procesar consolidados diarios e indicadores agronómicos por zona de cultivo, visualizando datos climáticos en tiempo real y procesados. |
| **RF15** | Monitorear y caracterizar eventos de lluvia en el orquideario, registrando la presencia, duración temporal y finalización de la precipitación. |
| **Módulo VI** | **Operaciones Hidráulicas y Riego Autónomo** |
| **RF16** | Conmutar manualmente actuadores hidráulicos con auto-apagado y gestionar colas de tareas diferidas con posibilidad de cancelación. |
| **RF17** | Automatizar rutinas de riego mediante programación recurrente, regulándolas con vetos y espaciamiento reactivo ante el microclima. |
| **RF18** | Auditar el historial de operaciones hídricas, registrando duración real, operador, origen de la tarea y causas de veto ambiental. |
| **Módulo VII** | **Notificaciones del Sistema** |
| **RF19** | Emitir notificaciones y alertas al usuario ante eventos operativos, estados del sistema o requerimientos de confirmación interactiva. |

---

## 3. Requerimientos No Funcionales (RNF)

En la tabla 2, se presentan las restricciones técnicas, atributos de calidad y niveles de servicio que garantizan la usabilidad, resiliencia y seguridad de la infraestructura implementada, formulados bajo el estándar internacional **ISO/IEC 25010**.

### Tabla 2. Requerimientos no funcionales del sistema

| Cód. | Categoría ISO 25010 | Descripción |
| :---: | :--- | :--- |
| **RNF01** | Restricción de Infraestructura | Disponer de una fuerte señal de la red wifi en el orquideario para asegurar una conexión continua de los nodos embebidos. |
| **RNF02** | Confiabilidad y Resiliencia | Retomar operaciones tras cortes eléctricos o inestabilidad Wi-Fi, garantizando su ejecución segura únicamente dentro de una ventana de oportunidad válida. |
| **RNF03** | Mantenibilidad y Modularidad | Desacoplar funcionalmente las capas de adquisición de borde, persistencia, orquestación y presentación para facilitar el mantenimiento del sistema. |
| **RNF04** | Tolerancia a Fallos | Detectar fallas en sensores de estaciones meteorológicas, intentar restablecer la operatividad telemétrica de forma autónoma y reflejar el incidente en logs del sistema. |
| **RNF05** | Eficiencia en Dispositivos | Garantizar disponibilidad continua superior a 24 horas mediante ejecución en bytecode, mitigación de fragmentación de memoria y resiliencia autónoma de red. |
| **RNF06** | Seguridad de la Información | Cifrar todas las comunicaciones entre nodos de campo, servidor y aplicación web mediante estándares criptográficos seguros. |
| **RNF07** | Capacidad y Persistencia | Almacenar el histórico de datos telemétricos sin restricciones de tiempo ni caducidad forzada, asegurando disponibilidad para análisis a largo plazo. |
| **RNF08** | Trazabilidad y Auditoría | Garantizar la trazabilidad integral de todo evento del sistema: decisiones de riego autónomo, accionamientos hidráulicos, telemetría ambiental y diagnóstico de los nodos. |
| **RNF09** | Mantenibilidad y Diagnóstico | Monitorear y depurar el estado operativo de los nodos embebidos de forma remota desde la interfaz web, sin requerir conexión física en campo. |

---

## 4. Matriz de Trazabilidad entre Módulos y Requisitos

La siguiente tabla resume la articulación de los requisitos funcionales con los componentes físicos y lógicos de la arquitectura de PristinoPlant:

| Módulo Funcional | Requisitos Asociados | Componente / Servicio | Nivel de Ejecución |
| :--- | :---: | :--- | :--- |
| **Módulo I: Seguridad y Acceso** | RF01 | Next.js / Better-Auth / PostgreSQL | Servidor Web / Cloud |
| **Módulo II: Comercio Electrónico y Ventas** | RF02 – RF06 | Next.js (Shop) / Zustand / WhatsApp API | Servidor Web / Cliente |
| **Módulo III: Inventario y Gemelos Digitales** | RF07 – RF09 | Next.js (Inventory) / Prisma ORM | Servidor Web / Base de Datos |
| **Módulo IV: Dosificación y Laboratorio** | RF10 – RF12 | Next.js (Lab) / Tablero 24V / Scheduler | Web / Microservicio |
| **Módulo V: Telemetría y Monitoreo** | RF13 – RF15 | Nodos EMA (ESP32) / Mosquitto / InfluxDB | Borde (Edge) / Docker VPS |
| **Módulo VI: Operaciones y Riego Autónomo** | RF16 – RF18 | Nodo Actuador (ESP32) / Scheduler Engine | Borde (Edge) / Docker VPS |
| **Módulo VII: Notificaciones del Sistema** | RF19 | Servicio Ingest / WebSocket / UI Banner | Microservicio / Frontend |
