# **Apéndice O. Modelado y Fabricación 3D de la Garita Meteorológica**

El presente apéndice documenta el diseño mecánico, modelado tridimensional y esquema de ensamblaje de la garita meteorológica portátil tipo Stevenson desarrollada para proteger la instrumentación de la Estación Meteorológica Automatizada Interior (EMA Interior) en el orquideario PristinoPlant.

---

### 1. Requerimientos de Diseño y Selección de Materiales

La medición precisa del microclima en invernaderos exige aislar los transductores higrotérmicos de la incidencia directa de la radiación solar y de las salpicaduras del sistema de riego, sin obstruir la circulación natural de las corrientes de aire. Los protectores comerciales de plástico convencionales presentan costos elevados o dimensiones incompatibles con las restricciones de espacio en mesas de cultivo, lo que motivó el diseño a medida de una estructura compacta y modular mediante manufactura aditiva (impresión 3D).

Para la fabricación de las piezas se seleccionó copoliéster PETG (tereftalato de polietileno glicol) en color blanco reflectante. Este termoplástico ofrece una alta resistencia mecánica, estabilidad dimensional ante temperaturas superiores a 70°C e inmunidad a la degradación por radiación ultravioleta (UV), evitando el alabeo o la decoloración prematura que sufren materiales estándar como el PLA bajo las condiciones tropicales de Ciudad Guayana.

---

### 2. Estructura Mecánica y Persianas de Ventilación Natural

La geometría de la garita se basa en un arreglo concéntrico de persianas cónicas superpuestas (louvers). La inclinación y curvatura de los álabes impiden la penetración de luz cenital o gotas de agua pulverizada hacia la cámara interior, promoviendo a su vez un efecto convectivo pasivo que renueva continuamente el aire alrededor del sensor DHT22.

El diseño se fragmentó en seis componentes modulares ensamblables mediante encajes mecánicos y tornillería de acero inoxidable, facilitando labores de mantenimiento e inspección de la electrónica:

##### ***Figura Ap-O1.*** Cuerpo de la Garita.
Estructura exterior cilíndrica con lamas inclinadas para ventilación convectiva natural y protección contra radiación directa.

##### ***Figura Ap-O2.*** Base de la Garita.
Placa inferior con perforaciones de drenaje y anclajes mecánicos para montaje sobre trípodes o perfiles de malla sombra.

##### ***Figura Ap-O3.*** Carcasa del Porta Batería.
Compartimiento aislado diseñado para alojar una celda recargable de iones de litio formato 18650 (3.7V / 2500 mAh).

##### ***Figura Ap-O4.*** Base del ESP32 y Módulo de Carga.
Bandeja de fijación con guías para el microcontrolador ESP32 de 30 pines y la placa controladora de carga TP4056 con puerto USB.

##### ***Figura Ap-O5.*** Base del Contenedor Interno Vista Interior.
Cámara de protección intermedia que resguarda el bus de cableado y los conectores contra humedad por condensación.

##### ***Figura Ap-O6.*** Base y Tope del Contenedor Interno.
Tapa superior deflectora de sellado que corona la estructura y desvía el agua de lluvia exterior hacia los laterales.
