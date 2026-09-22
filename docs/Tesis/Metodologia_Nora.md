33 

En el caso de la entrevista no estructurada, a pesar de no disponer de una guía de preguntas elaboradas previamente, “se orienta por unos objetivos preestablecidos que permiten definir el tema de la entrevista, de allí que el entrevistador deba poseer una gran habilidad para formular las interrogantes sin perder la coherencia” (Arias, 2012, p. 73). 

Esta técnica se utilizó durante las reuniones con el Ingeniero Manuel Rodríguez en la oficina de LCC OpenTech, C.A., con el fin de obtener los requerimientos que debían cumplir los sistemas para los que se desarrolló la propuesta arquitectónica. En el Anexo A se presenta el guion utilizado para llevar a cabo esta entrevista. 

# **Metodología de Desarrollo** 

Para el desarrollo de este proyecto se utilizó una metodología basada en el modelo incremental. Pressman (2010) define que el modelo incremental combina elementos de los flujos de proceso lineal y paralelo. El modelo incremental aplica las secuencias lineales de forma escalonada a medida que avanza el calendario de actividades como se muestra en la figura 8. 



<!-- Start of picture text -->
[J Comunicacién<br>2<br>g<br>é (Fy[Ly ModeladoPlaneacién (anslisis, disefo) -<br>3 [i Construccién (cédigo, prueba} Ce<br>2] DB Despliegue (entrega, retroalimentacién) Ota<br>3 e° entrega del nésimo<br>3 incremento # 2 e incremento<br>g<br>><br>2 CH} entrega del seguado<br>B | incremento # 1 incremento<br>a:<br>3<br>2 incremento<br>Calendario dal proyecto<br><!-- End of picture text -->

_Figura 8._ Modelo incremental _._ Tomado de _Pressman (2010)._ 

34 

Adicionalmente, Pressman (2010) afirma que cuando se utiliza un modelo incremental, es frecuente que el primer incremento sea el producto fundamental. Es decir, se abordan los requerimientos básicos, pero no se proporcionan muchas características suplementarias. El cliente usa el producto fundamental, o lo somete a una evaluación detallada. Como resultado del uso y/o evaluación, se realiza una planificación para el incremento que sigue. 

El proceso de desarrollo de una arquitectura de software es inherentemente incremental, razón por la que se optó por el uso de la metodología basada en el modelo incremental. Sin embargo, para el desarrollo de una arquitectura de software, se deben realizar un conjunto de actividades particulares. Para Cervantes, Velasco-Elizondo y Castro (2016) estas actividades son: 

1. **Definición de los requerimientos de la arquitectura:** Esta etapa se enfoca en la captura, documentación y priorización de requerimientos que influyen sobre la arquitectura y que, por lo habitual, se conocen en inglés como drivers arquitectónicos. 

2. **Diseño de la arquitectura:** La etapa de diseño es probablemente la más compleja del ciclo de desarrollo de la arquitectura. Durante esta etapa se definen las estructuras de las que se compone la arquitectura mediante la toma de decisiones de diseño. Esta creación estructural se hace por lo habitual con base en dos clases de soluciones abstractas probadas, llamadas patrones de diseño y tácticas, al igual que en soluciones concretas como las elecciones tecnológicas, tales como los frameworks. 

3. **Documentación de la arquitectura:** Una vez que ha sido creado el diseño de la arquitectura, es necesario darlo a conocer a otros 

35 

interesados en el sistema, como desarrolladores, responsables de implantación, líderes de proyecto o el cliente mismo. La comunicación exitosa depende por lo habitual de que el diseño sea documentado de forma apropiada 

4. **Evaluación de la arquitectura:** Dado que la arquitectura de software juega un rol crucial en el desarrollo, a efecto de identificar posibles riesgos o problemas es conveniente evaluar el diseño una vez que este ha sido documentado. La ventaja de la evaluación es que representa una actividad que puede realizarse de manera temprana (aun antes de codificar), y que el costo de corrección de los defectos identificados por medio de ella es mucho menor al costo que tendría enmendarlos después de que el sistema ha sido construido 

5. **Implementación de la arquitectura:** Una vez establecida la arquitectura, se construye el sistema. Durante esta etapa es importante evitar que ocurran desviaciones respecto del diseño definido por el arquitecto 

# **Procedimiento Metodológico** 

1. **Estudiar los principios y los patrones de diseño de arquitecturas basadas en microservicios:** Haciendo uso de la revisión documental, se realizó un estudio acerca de los distintos patrones existentes para el diseño de arquitecturas basadas en microservicios y de los principios y buenas practicas que deben ser tomados en cuenta a la hora de diseñar una arquitectura de software de este tipo. Adicionalmente, se realizó un estudio acerca de los aspectos relacionados con el diseño de arquitecturas de software y de las distintas tácticas que pueden ser utilizadas para dar cumplimiento a los requerimientos. Al finalizar este 

36 

estudio, se obtuvo como resultado las bases teóricas necesarias para llevar a cabo el diseño de la arquitectura de software basada en microservicios. 

2. **Determinar los requerimientos que debe satisfacer la arquitectura de microservicios y que dará soporte a los sistemas e-commerce de LCC OpenTech, C.A.:** Mediante una entrevista no estructurada, que se realizó durante las reuniones con el CEO de OpenTech, C.A., y complementando con la realización de la revisión documental, se definieron los requerimientos funcionales y no funcionales que deben cumplir los sistemas de e-commerce que desarrollará la empresa, obteniendo un listado de requerimientos, tanto funcionales como no funcionales, y una serie de diagramas de casos de uso donde se representó, de forma gráfica, los requerimientos funcionales establecidos. 

3. **Diseñar una arquitectura basada en microservicios que cumpla con los requerimientos establecidos:** En base a los requerimientos establecidos, se tomaron una serie de decisiones relacionadas a los componentes que formarían parte de la arquitectura de microservicios. Estas decisiones hacen referencia a los patrones de diseño que se utilizaron para la arquitectura, así como también las tácticas escogidas para dar cumplimiento a los requerimientos no funcionales. Adicionalmente, se realizó la documentación de la arquitectura de software, donde se definió que función cumple cada uno de los componentes de la arquitectura. De esta documentación, se obtuvo también el diagrama de la arquitectura de microservicios resultante. 

4. **Construir el prototipo del sistema para la arquitectura propuesta:** Siguiendo el diseño realizado para la arquitectura de microservicios, se 

37 

construyeron, de manera independiente un conjunto de microservicios, establecidos por el CEO de LCC OpenTech, C.A. Estos microservicios fueron desplegados en un clúster de Kubernetes, alojado en DigitalOcean, para lo cual fue necesario crear una imagen de Docker por cada microservicio desarrollado, y subir esas imágenes a repositorios en Docker Hub. También se desarrollaron las APIs Gateway, mediante las que se integraron los microservicios para dar respuesta a las peticiones recibidas. El resultado obtenido consistió en el conjunto de microservicios desarrollados que fueron desplegados en el clúster, conformando el prototipo del sistema diseñado. 

5. **Evaluar la arquitectura de microservicios desarrollada para el soporte de los sistemas e-commerce de LCC OpenTech, C.A.:** Para la evaluación de la arquitectura diseñada, el prototipo del sistema fue sometido a una prueba de carga, para medir la disponibilidad del sistema y su rendimiento; una prueba de resistencia, para validar que el sistema es capaz de recuperarse en caso de que ocurra una falla; y una prueba de funcionalidad, para validar que la arquitectura brinda el soporte necesario para el tipo de sistemas que desea desarrollar la empresa. Para la prueba de funcionalidad, se utilizaron dos aplicaciones desarrolladas por la empresa LCC OpenTech, C.A., una aplicación móvil y un sistema web. La realización de las pruebas permitió validar que la arquitectura cumple con los requerimientos no funcionales establecidos, demostrando que puede ser utilizada por la empresa para el desarrollo de sus sistemas de e-commerce. 

