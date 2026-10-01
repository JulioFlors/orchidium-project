# Guía Interna de Redacción y Estructura de Incrementos (Capítulo IV)

Este documento define el estándar metodológico, narrativo y estilístico obligatorio para redactar los incrementos funcionales en el Capítulo IV (*Construcción e Implementación Incremental*) del Trabajo Instrumental de Grado de PristinoPlant.

---

## 1. Filosofía Metodológica del Incremento

En el marco de la metodología **TDDM4IoTS** (Guerrero-Ulloa et al., 2020) y el modelo de proceso incremental (Pressman, 2010), un incremento **no es una simple bitácora de tareas completadas** ni una transcripción pasiva del diseño.

Cada incremento debe narrarse como una **unidad de evolución de ingeniería**, compuesta por:

1. **Una intención u objetivo de partida** (la necesidad técnica o agronómica que motivó la iteración).
2. **Un proceso activo de construcción y montaje** (software, hardware, firmware o infraestructura).
3. **Un reto o fallo de banco/campo documentado** (la prueba real donde el diseño inicial falló o se vio limitado).
4. **Un rediseño correctivo de ingeniería** (la solución técnica aplicada para superar el fallo).
5. **Una consolidación de entregables verificados** (el producto terminado y cómo se enlaza con el siguiente ciclo).

---

## 2. Jerarquía Tipográfica y Estilo (Normas APA Guayana)

Todo incremento debe apegarse estrictamente a los niveles de encabezado aprobados para el informe:

* **Nivel 2 (Fase o Sección Mayor):**  
  `## **Construcción e Implementación Incremental**`  
  *(Negrita, mayúsculas iniciales en palabras principales).*

* **Nivel 3 (Título del Incremento):**  
  `### **Incremento X: [título conciso en minúsculas].**`  
  *(Alineado a la izquierda, negrita, solo mayúscula inicial y nombres propios, punto y aparte final).*

* **Nivel 4 (Subsecciones internas del Incremento):**  
  `#### ***[Título de la subsección en minúsculas].***`  
  *(Alineado a la izquierda, negrita y cursiva, solo mayúscula inicial y nombres propios, punto y aparte final).*

* **Figuras y Tablas:**  
  * Encabezado de Figura: `![Figura X. Título descriptivo.](ruta)`  
  * Pie de Figura: `**_Figura X._** Título descriptivo.` seguido en la línea siguiente de `*Nota.* Descripción comenzando con verbo en presente ("Despliega...", "Ilustra...", "Modela...").`  
  * Encabezado de Tabla: `###### Tabla X. *Título en cursiva* {#id}`

---

## 3. Anatomía Estructural Canónica de un Incremento

Cada incremento debe estructurarse obligatoriamente bajo los siguientes cuatro bloques funcionales:

```text
[Nivel 3]  ### **Incremento X: ...**
               │
               ├── Bloque 1: Párrafo Introductorio (Propósito y Alcance)
               │
[Nivel 4]  ├── Bloque 2: Construcción, Montaje y Herramientas
               │
[Nivel 4]  ├── Bloque 3: Fallo en Banco / Campo y Rediseño de Ingeniería
               │
[Nivel 4]  └── Bloque 4: Entregables Consolidados (Cierre y Transición)
```

---

### Bloque 1: Párrafo Introductorio (Propósito y Alcance)

* **Qué DEBE contener:**
  * El **propósito técnico**: Qué necesidad funcional o física vino a cubrir este incremento.
  * La **situación de partida**: Qué se tenía antes (ej. riego manual, APIs regionales genéricas, falta de datos estructurados).
  * El **foco de las actividades**: Qué áreas de TDDM4IoTS se abordaron (prototipado en banco, tendido físico, servicios cloud, etc.).
  * El **horizonte de la iteración**: Hacia qué hito intermedio apuntaba el esfuerzo antes de pasar a la siguiente etapa.

* **Qué NUNCA debe contener (Regla de Cero Spoilers):**
  * ❌ *Prohibido adelantar conclusiones o inventarios de entregables:* Frases como *"El entregable de esta fase se concentró en entregar el tablero con contactor de 30A y el firmware compilado..."*.
  * ❌ *Motivo:* El entregable aún no ha sido narrado ni construido. Anticiparlo destruye la narrativa secuencial y duplica textualmente la subsección final.

* **Fórmula de redacción recomendada:**
  > *"El [número] incremento tuvo como propósito [acción técnica principal], orientando los esfuerzos a [resolver problema de partida o sustituir método previo]. En correspondencia con el marco metodológico TDDM4IoTS, esta iteración concentró sus actividades en [2 o 3 actividades de ingeniería clave], con miras a [objetivo operacional inmediato] antes de abordar [área reservada para el siguiente incremento]."*

---

### Bloque 2: Construcción, Montaje y Herramientas

* **Objetivo:** Explicar cómo se materializó el componente técnico de la iteración.
* **Aspectos a narrar:**
  * Herramientas y tecnologías empleadas en la construcción (ej. Next.js, MicroPython, Docker, scripts de soporte).
  * Montaje físico o lógico (ej. esquema de protoboard a riel DIN, arquitectura de carpetas, microservicios).
  * Decisiones técnicas deliberadas (ej. prescindir de bibliotecas UI externas para evitar dependencias, compilar a `.mpy` para ahorrar RAM).
* **Precaución:** No duplicar el *Diseño Detallado*. No volver a listar tablas de pines completas ni especificaciones de tuberías a menos que estén directamente vinculadas a la experiencia de construcción.

---

### Bloque 3: Fallo en Banco / Campo y Rediseño de Ingeniería

Este bloque es el **núcleo de credibilidad técnica** del documento. Demuestra que el sistema fue efectivamente construido, probado y depurado en la realidad, no simulado sobre papel.

* **Estructura tripartita del fallo:**
  1. **El síntoma observable:** Qué ocurrió durante las pruebas (ej. relés soldados por arco, caída fatal `EBUSY`, diafonía con datos corruptos, pistas corroídas en 30 días, golpe de ariete que destruyó el transductor, falsas alarmas de red).
  2. **La causa física o computacional:** Diagnóstico riguroso (ej. pico inductivo de la bomba de 11A superando los 10A del relé; fragmentación de RAM dinámica por debajo de 45 KB impidiendo `wrap_socket`; falta de apantallamiento en pares no balanceados; electrólisis tropical).
  3. **El rediseño de ingeniería aplicado:** Qué solución definitiva se implementó (ej. contactor de 30A comandado por relé; extracción de persistencia a Node.js con *Hot State Recovery*; trenzado diferencial por par Cat6; reemplazo de sensores físicos por algoritmos de inferencia; patrón *Human-in-the-Loop* con ventanas de guarda).

---

### Bloque 4: Entregables Consolidados (Conclusión del Incremento)

* **Objetivo:** Es el **único lugar** donde se formaliza el balance de cierre y se entregan cuentas de la iteración.
* **Qué DEBE contener:**
  1. **Inventario tangible:** Qué productos específicos quedaron terminados y operativos (hardware instalado, servicios desplegados, interfaces disponibles, algoritmos calibrados).
  2. **Validación superada:** Bajo qué condición quedó probado (ej. conmutación verificada con MQTT Explorer, 57 días de simulación histórica, 369 tareas auditadas en producción).
  3. **Llamadas a apéndices y figuras:** Enlace explícito a la Tabla Ap-B1 (Apéndice B), figuras de evidencia (Apéndice F) y diagramas del capítulo.
  4. **Puente lógico hacia el siguiente incremento:** Cómo este resultado habilita de forma natural la iteración que sigue.

* **Fórmula de redacción recomendada:**
  > *"Como resultado de este incremento, se entregó [lista de productos tangibles y operativos], verificados mediante [método de prueba o validación en banco/campo]. Este hito consolidó [capacidad técnica alcanzada], habilitando el punto de partida para que la siguiente iteración abordara [enfoque del siguiente incremento] (véase Tabla Ap-B1 del Apéndice B, Figura X y Flujo Y del **Apéndice F**)."*

---

## 4. Reglas Estilísticas y de Vocabulario Obligatorias

### Regla 1: Erradicar nombres crudos de tablas o modelos de código
* ❌ *Incorrecto:* `SeedPlant`, `Species`, `ProductVariant`, `DailyEnvironmentStat`, `DosingLog`, `FilterCleaningLog`.
* ✅ *Correcto (términos naturales de dominio):*
  * En lugar de `Species` $\rightarrow$ *catálogo taxonómico de especies botánicas*.
  * En lugar de `SeedPlant` $\rightarrow$ *ejemplares individuales en mesa* o *trazabilidad de plantas*.
  * En lugar de `ProductVariant` $\rightarrow$ *presentaciones comerciales según tamaño de maceta*.
  * En lugar de `DailyEnvironmentStat` $\rightarrow$ *resúmenes diarios estructurados en la base de datos relacional*.
  * En lugar de `DosingLog` $\rightarrow$ *bitácora de registro agronómico*.

### Regla 2: Evitar lenguaje inflado o metafórico
* ❌ *Incorrecto:* "Edificar el andamiaje visual", "planta electromecánica sectorizada", "laboratorio de prototipado", "chasis digital".
* ✅ *Correcto:* "Construir la plataforma web base", "circuito hidráulico presurizado y sectorizado", "prototipado electrónico en banco de pruebas", "interfaz de usuario".

### Regla 3: Tono sobrio, directo y en tiempo pretérito perfecto simple
* La construcción narra hechos ya acontecidos y verificados: *se implementó*, *se detectó*, *se rediseñó*, *se comprobó*.
* La extensión ideal de cada párrafo es de **4 a 8 líneas de texto**, manteniendo ideas unitarias y evitando oraciones kilométricas.

---

## 5. Lista de Chequeo (Checklist) para Validación de Incrementos

Antes de dar por finalizada la redacción de un incremento, verificar los siguientes puntos:

- [ ] ¿El título cumple con Nivel 3 APA (`### **Incremento X: [título en minúsculas].**`)?
- [ ] ¿El párrafo inicial define propósito, necesidad previa y alcance sin adelantar los entregables finales?
- [ ] ¿Las subsecciones internas tienen encabezados Nivel 4 (`#### ***[título en minúsculas].***`)?
- [ ] ¿Existe una subsección explícita que detalle una falla real de banco/campo y su rediseño de ingeniería?
- [ ] ¿Se eliminaron todos los nombres crudos de tablas relacionales o modelos ORM?
- [ ] ¿Las figuras y tablas respetan el formato de rótulo y nota explicativa APA Guayana?
- [ ] ¿La subsección final (`#### ***Entregables consolidados.***`) sintetiza los productos tangibles, su validación y la referencia cruzada con los Apéndices B y F?
- [ ] ¿El cierre establece un puente lógico claro hacia el incremento siguiente?
