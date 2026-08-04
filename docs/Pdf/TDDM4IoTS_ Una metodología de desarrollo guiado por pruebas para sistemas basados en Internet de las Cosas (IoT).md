# **TDDM4IoTS: Una metodología de desarrollo guiado por pruebas para sistemas basados en Internet de las Cosas (IoT)**

**Gleiston Guerrero-Ulloa** ^{1,2}, **Miguel J. Hornos** ^{2} y **Carlos Rodríguez-Domínguez** ^{2} ^{1} Facultad de Ciencias de la Ingeniería, Universidad Técnica Estatal de Quevedo, Quevedo 120501, Ecuador (gguerrero@uteq.edu.ec) ^{2} Departamento de Lenguajes y Sistemas Informáticos, Universidad de Granada, 18071 Granada, España (gleiston@correo.ugr.es, {mhornos, carlosrodriguez}@ugr.es)

## **Resumen**

Este artículo presenta una metodología de desarrollo para Sistemas Basados en Internet de las Cosas (IoTS) que recopila ideas de varios de los paradigmas de desarrollo de software más destacados en la actualidad, como la Ingeniería Dirigida por Modelos (MDE) y el Desarrollo Guiado por Pruebas (TDD), además de incorporar los principios que gobiernan las metodologías ágiles de desarrollo de software, como SCRUM y XP. La metodología presentada aquí, denominada **Metodología de Desarrollo Guiado por Pruebas para IoTS (TDDM4IoTS)**, ha sido propuesta tras una revisión exhaustiva de diferentes metodologías de desarrollo de software, lo que nos llevó a concluir que ninguna de ellas está especialmente orientada hacia el desarrollo de IoTS. La metodología consta principalmente de once fases, cuyo orden de aplicación puede ser establecido por el equipo que desarrollará el proyecto en cuestión. En este documento, sugerimos un orden a seguir, así como herramientas de software existentes que podrían utilizarse como soporte para la obtención de los entregables correspondientes en cada fase.  
**Palabras clave:** Metodología de desarrollo de software · Desarrollo Guiado por Pruebas · Ingeniería Dirigida por Modelos · Metodologías ágiles · Internet de las Cosas (IoT) · Sistemas basados en IoT.

## **1 Introducción**

En la Ingeniería de Software, las propuestas de nuevos lenguajes y paradigmas de programación siempre han sido el tema principal, seguidas de cerca por las metodologías. Así, primero surgió la programación estructurada y luego se propusieron metodologías apropiadas para el Análisis y Diseño Estructurado (SAD). Del mismo modo, la programación orientada a objetos se propuso por primera vez en 1972 \[1\], mientras que las propuestas para el Análisis y Diseño Orientado a Objetos (OOAD) y una metodología para el desarrollo de software orientado a objetos se publicaron en 1978 \[2\] y 1982 \[3\]. Con la aparición de la era de Internet y la World Wide Web (WWW), los desarrolladores se enfrentaron a la necesidad de adaptar las metodologías existentes para el desarrollo de sistemas basados en la Web. La primera metodología de desarrollo Web documentada fue presentada por Schwabe y Rossi en 2002 \[4\]. Por lo tanto, tradicionalmente se ha considerado necesario revisar las metodologías de desarrollo tras la aparición de nuevos paradigmas tecnológicos en la Ingeniería de Software.  
Hoy en día, IoT es uno de los paradigmas tecnológicos más prominentes. Este término, acuñado por Ashton \[5\], surge del objetivo de "digitalizar objetos físicos" para que puedan interactuar perfectamente entre sí y con las personas que los rodean para mejorar sus estilos de vida y productividad \[6\]. IoT es el resultado de la confluencia/colaboración de varias áreas de investigación, como la comunicación y la cooperación, la localización e identificación, las redes de sensores y actuadores, el procesamiento integrado de información distribuida, la inteligencia artificial y las interfaces de usuario adaptativas, por nombrar solo algunos de los campos convergentes más importantes.  
Los primeros IoTS se desarrollaron utilizando metodologías *ad-hoc* específicas para cada equipo de desarrollo, surgidas de la adaptación correspondiente de las metodologías empleadas en el desarrollo de sistemas de información (SI) más tradicionales.  
Sin embargo, el desarrollo de IoTS difiere del desarrollo de sistemas informáticos tradicionales en varios aspectos clave. Por ejemplo, el desarrollo de IoTS implica necesariamente el despliegue y la configuración de componentes de hardware (sensores, actuadores, controladores...) para interactuar con el entorno físico y digital, lo cual no es el caso habitual en los SI tradicionales. Cada uno de los dispositivos de hardware desplegados en el entorno (como sensores, actuadores y ordenadores de placa única) requiere una programación y configuración específicas, así como la implementación de mecanismos de difusión de información (Publicar/Suscribir o Petición/Respuesta están entre los más comunes) para distribuir datos de manera eficiente y crear flujos de datos complejos entre ellos.  
Por otro lado, tanto en los SI tradicionales como en los IoTS, se deben implementar aplicaciones cliente para el usuario final, principalmente basadas en la web \[7\] o en dispositivos móviles \[8\], para interactuar con las personas, dependiendo de las necesidades de los propios usuarios \[9\]. Sin embargo, en la literatura, la gran mayoría de las metodologías de desarrollo de IoTS se centran exclusivamente en la implementación de software de configuración para dispositivos IoT o en un conjunto de aplicaciones para el usuario final, pero no cubren ambos aspectos al mismo tiempo. Además, ninguna de las metodologías estudiadas incorpora análisis de viabilidad o etapas de mantenimiento, sino que se centran en el diseño de software y la generación de código. En este artículo, proponemos una metodología para el desarrollo de IoTS que cubre todos estos aspectos al mismo tiempo. En consecuencia, los objetivos principales de este trabajo son:

> 1. Presentar una revisión exhaustiva de las metodologías de desarrollo de IoTS existentes, basadas en TDD, MDE y/o metodologías ágiles;  
> 2. Comprobar que no existe una metodología específicamente diseñada para el desarrollo de IoTS; y  
> 3. Proponer una nueva metodología de desarrollo para IoTS que, además del software encargado de la lógica de negocio y la interacción usuario-sistema, aborde la configuración y despliegue del hardware (sensores, actuadores, procesadores,...) y la programación de ordenadores de placa única (Arduino, Raspberry,...), para que puedan realizar un preprocesamiento adecuado de los datos capturados por los sensores.

El resto de este artículo se estructura de la siguiente manera: La Sect. 2 presenta el estado del arte sobre las metodologías de desarrollo de IoTS basadas en TDD, MDE y/o metodologías de desarrollo ágil. La Sección 3 propone una nueva metodología para el desarrollo de IoTS que intenta superar la ausencia de una metodología específica. Finalmente, la Sect. 4 resume nuestras conclusiones y trabajo futuro.

## **2 Estado del Arte**

Buscamos artículos publicados sobre metodologías de desarrollo de IoTS en la plataforma Web of Science. Se seleccionaron libros, capítulos de libros y artículos publicados en revistas de prestigio por considerarse más relevantes, y en inglés, al ser el idioma adoptado internacionalmente para publicaciones científicas. Los términos de búsqueda utilizados se muestran en la columna central de la Tabla 1\.

### **Tabla 1\. Palabras clave y cadenas de consulta utilizadas y número de resultados obtenidos**

| N.º | Estructura de la consulta | Resultados |
| :---- | :---- | :---- |
| **\#1** | $TS=$ (IoT OR "Internet of Things") | 15.597 |
| **\#2** | $TS=$ (Framework OR Method\*) | 8.957.432 |
| **\#3** | $TS=$ (Development OR Deploy OR Implement\* OR Design OR construct\*) | 7.384.102 |
| **\#4** | $TS=$ (Agile OR SCRUM OR XP OR "Extreme Programming" OR "Agile Inception" OR "Design Sprint" OR Kanban) | 14.452 |
| **\#5** | $TS=$ (TDD OR "Test-Driven Development" OR MDE OR "Model-Driven Engineering" OR MDA OR "Model-Driven Architecture" OR MDD OR "Model-Driven Development" OR "Model-Driven Design") | 71.897 |
| **\#6** | \#1 AND \#2 AND \#3 | 3.303 |
| **\#7** | \#4 OR \#5 | 86.224 |
| **\#8** | \#6 AND \#7 | 38 |

Como resultado, obtuvimos 38 documentos (ver última fila de la Tabla 1). Tras una revisión minuciosa de estos documentos, aquellos que no presentaban una metodología de desarrollo fueron descartados, seleccionándose finalmente 12 artículos (mostrados en la Tabla 2\) para un análisis más profundo.

### **Tabla 2\. Metodologías para el desarrollo de IoTS**

| Ref. | Enfoques | IoTS General | Dominio |
| :---- | :---- | :---- | :---- |
| **\[10\]** | MDE |  | Farolas inteligentes |
| **\[11\]** | MDD, SOA | X | Automóviles |
| **\[12\]** | MDD, MDA | X | Aplicaciones móviles |
| **\[13\]** | Diseño basado en componentes, BIP, Diseño incremental | X | Sistemas de Redes de Área Personal Inalámbricas |
| **\[14\]** | MDD |  | Domótica, IIoT |
| **\[15\]** | MDE | X | Monitoreo de salud |
| **\[16\]** | SOA, Principios de desarrollo ágil |  | Sistemas de gestión ambiental y de riesgos para IIoT |
| **\[17\]** | Marco SCRUM, Metamodelos, SOA | ✓ | Hogares Inteligentes |
| **\[18\]** | MDE, SOA | ✓ | General |
| **\[19\]** | MDA |  | Red de Sensores Inalámbricos |
| **\[20\]** | Cascada, Principios ágiles | ✓ | No aplicado |
| **\[21\]** | División por roles o responsabilidades | ✓ | Edificios Inteligentes |

*Abreviaturas:* MDD: Desarrollo Dirigido por Modelos; SOA: Arquitectura Orientada a Servicios; MDA: Arquitectura Dirigida por Modelos; IIoT: IoT Industrial; BIP: Prioridad de Interacción del Comportamiento; Metodología para IoTS en general: ✓; Metodología para IoTS específico: X.

### **2.1 Fundamentos de las Metodologías Revisadas**

Ninguno de los documentos analizados relacionados con TDD presentaba una metodología de desarrollo para IoTS, a diferencia de los relacionados con MDE y metodologías de desarrollo ágil. La Tabla 2 muestra las referencias donde se encontraron las diferentes metodologías, así como los enfoques en los que se basan, además del tipo de IoTS y el dominio para el cual fueron desarrolladas o aplicadas.  
En TDD4IoTS, hemos integrado algunas de las etapas metodológicas más comunes que se proponen en la literatura estudiada para resolver los desafíos de IoTS. Además de ellas, hemos incorporado las ventajas de TDD para incrementar la calidad del software (cumplimiento de requisitos, detección de errores, mayor confiabilidad del software, etc.).

### **2.2 Análisis de las Metodologías Existentes**

El estudio de los requisitos del sistema es el primer paso en el desarrollo de un sistema. Por lo tanto, debería ser la primera fase en la metodología aplicada a su desarrollo. La Tabla 3 (mencionada en el texto original) compara las metodologías existentes enfocadas en el análisis de requisitos.

Al analizar el estado del arte, nos dimos cuenta de que algunos trabajos \[10, 11\] no mencionan los requisitos del sistema, omitiendo esta fase. El resto coincide en su importancia. La metodología en \[12\] profundiza en las herramientas de recolección. Mientras que \[13-15\] asumen que los requisitos están disponibles antes de comenzar, \[16, 17\] consideran que rara vez están disponibles al inicio. Nos inclinamos por esta última postura, proponiendo TDD4IoTS con un fuerte énfasis en la obtención y análisis continuo de requisitos.

La naturaleza de los IoTS exige considerar cuidadosamente todos los estados y transiciones del sistema, ya que debe reaccionar ante eventos del entorno.

## **3 Metodología Propuesta: TDDM4IoTS**

Estas fases se repetirán iterativamente para cada entregable. Sin embargo, en el desarrollo de algunos entregables, puede no ser necesario aplicar algunas fases (representadas con líneas discontinuas en la Fig. 1 original). Por ejemplo, puede no ser necesario realizar el análisis preliminar en una segunda iteración o el refinamiento del modelo. El equipo debe estimar el esfuerzo y la duración. La negociación entre el cliente y el equipo sobre la prioridad de los entregables será vital para el éxito, a diferencia de SCRUM, donde el cliente (Product Owner) asigna unilateralmente las prioridades \[23-25\].

TDDM4IoTS requiere asignarle la responsabilidad del facilitador del proyecto al miembro con más experiencia en gestión de proyectos y liderazgo. Los desarrolladores bajo TDDM4IoTS no están sujetos a imposiciones de tareas, sino a negociaciones. El facilitador no es responsable de todo el proyecto, solo gestiona la negociación entre los equipos de desarrollo. La responsabilidad recae en todos sus miembros. Se adopta una gestión horizontal y autoorganizada con equipos ágiles no superiores a 10 personas \[23, 26\]. Cada equipo tendrá un máximo de 3 desarrolladores equilibrados en conocimiento \[26\].

### **Tabla 4\. Roles y responsabilidades en TDDM4IoTS**

| Rol | Descripción | Responsabilidades |
| :---- | :---- | :---- |
| **Facilitador del proyecto** | Experto con amplia experiencia en gestión de proyectos y desarrollo ágil de IoTS. Solucionador de conflictos, capacitador y líder innato \[27, 28\]. | (1) Apoyar al equipo en sus objetivos. (2) Aportar experiencia a los entregables. (3) Negociar aspectos del desarrollo con el cliente (orden, tiempo, recursos...). |
| **Consejero** | Miembro del equipo de desarrollo que se convierte en "líder" (sin designación formal) por su desempeño. | Instruir a sus compañeros en los temas de su dominio. |
| **Cliente / Usuario final** | Persona con buena comunicación y conocimiento de toda la funcionalidad del IoTS que encarga el desarrollo. | (1) Contribuir a los requisitos del IoTS. (2) Aprobar la funcionalidad de los entregables y del IoTS final. |
| **Equipo de desarrollo** | Grupo multidisciplinario de expertos en los dominios del proyecto, responsable del desarrollo. Facilitadores de conocimiento y experiencia. | (1) Negociar aspectos del desarrollo con el cliente (orden, tiempo, recursos...). (2) Crear entregables que cumplan con los requisitos. |

Podemos concluir que:

> 1. SCRUM se basa en principios ágiles.  
> 2. IoT abarca complejidad de software, hardware, comunicaciones, nube e interconexiones.  
> 3. SCRUM y XP ignoran requisitos no funcionales, los cuales son vitales en IoT \[31\]. Por ello, TDDM4IoTS adapta lo mejor del manifiesto ágil a las particularidades de IoT.

### **3.1 Fundamentos de TDDM4IoTS**

> * **Valores y Principios del Desarrollo Ágil:** Prioriza individuos, software funcional, colaboración y respuesta al cambio \[29, 30\]. Cumple los 12 principios ágiles considerando la integración de hardware y software.  
> * **TDD como Metodología Ágil:** Escribir primero las pruebas y luego el código garantiza que el software responda exactamente a las necesidades del cliente (las pruebas especifican formalmente los casos de uso) \[22, 32-34\]. Integra conceptos de XP \[36\] y la separación de pruebas de SCRUM \[23\].  
> * **MDE:** La heterogeneidad tecnológica de IoT hace que la Ingeniería Dirigida por Modelos sea clave para reutilizar modelos y transformarlos en código ejecutable \[37\].

### **3.2 Fases de TDDM4IoTS**

Las herramientas en cada fase son de libre elección por los desarrolladores. Se recomiendan entre 3 y 5 reuniones presenciales semanales para asegurar la comunicación fluida \[ cite: 1\].

#### **(1) Análisis Preliminar**

Objetivo: obtener un estudio de viabilidad global (tecnológica, económica, operativa) y análisis del contexto de despliegue.

> * **Análisis de requisitos:** Funcionales (lista de entregables y prioridades) y no funcionales (escalabilidad, estética, intrusividad).  
> * **Análisis de tecnología:** Hardware disponible/existente, herramientas de configuración, almacenamiento y desarrollo.  
> * **Análisis del entorno:** Puntos de energía, red, métodos de interacción.  
> * **Análisis de viabilidad:** Técnica, económica y operativa (incluyendo mantenimiento programado).

*Herramientas sugeridas:* OpenProj, GanttProject, dotProject, MS-Project.

#### **(2) Diseño de la Capa Tecnológica**

Objetivo: primer diseño global del sistema como guía.

> * *Herramientas sugeridas:* Circuito.io o Fritzing para esquemas de hardware (por ejemplo, con placas Arduino). Define la arquitectura general.

#### **(3) Análisis Detallado de Requisitos**

Objetivo: detallar entregables específicos iteración por iteración. El cliente define las pruebas junto con los desarrolladores para eliminar ambigüedades mediante uso de UML, casos de uso, diagramas de estado y despliegue.

#### **(4) Generación y Adaptación de Modelos**

Objetivo: abstraer la heterogeneidad de tecnologías usando MDE. Generación automática de código o esquemas de base de datos desde diagramas de clases \[10, 18\].

> * *Lenguajes y herramientas:* UML, BPMN, StarUML, ArgoUML, MagicDraw, Visual Studio, Lucidchart, VisualParadigm.

#### **(5) Generación de Pruebas**

Siguiendo TDD, las pruebas se dividen en:

> 1. **Escritas por desarrolladores:** Pruebas unitarias (cobertura de funciones y excepciones) y pruebas de integración.  
> 2. **Documentadas por el cliente:** Pruebas de aceptación y funcionales \[22\].