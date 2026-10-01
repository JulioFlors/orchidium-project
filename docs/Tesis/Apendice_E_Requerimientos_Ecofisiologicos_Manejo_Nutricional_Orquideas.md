# Apéndices

## Apéndice E. Fundamentos Ecofisiológicos y Manejo de Orquídeas

El presente apéndice expone los fundamentos biológicos, bioclimáticos y de nutrición mineral de las especies cultivadas en el orquideario PristinoPlant (San Félix, Estado Bolívar). Esta documentación técnica constituye el soporte biológico formal que justifica los umbrales de decisión basados en **temperatura ($T$)**, **humedad relativa ($HR$)** e **iluminancia solar ($Lux$)** en el servicio `Scheduler`, el modelado taxonómico en el catálogo de plantas y las reglas de compatibilidad química en el laboratorio de dosificación.

---

### 1. Entorno Bioclimático y Cultivo Protegido en PristinoPlant

El diseño de la plataforma se fundamenta en la caracterización ambiental empírica de San Félix (clima tropical cálido), sustentada en la serie telemétrica consolidada por la Estación Meteorológica Exterior (EMA Exterior) y la Estación Meteorológica Interior (EMA Interior):

* **Condiciones Críticas en la Intemperie (EMA Exterior):** 
  1. *Régimen Térmico Extremo:* Temperatura diurna promedio de $36.1^\circ\text{C}$ (08:00–16:00 h), con picos térmicos sostenidos entre $40.0^\circ\text{C}$ y $42.0^\circ\text{C}$ durante las horas de radiación cenital, descendiendo de noche a $26.0^\circ\text{C}$.
  2. *Radiación Solar:* Iluminancia diurna promedio de $34.460\text{ lux}$ con máximos directos superiores a $45.000\text{ lux}$.
  3. *Demanda Hídrica:* Caídas agudas de humedad relativa diurna hasta valores críticos de $45\%$--$55\%$ en las horas de mayor insolación, contrastadas con saturación nocturna superior al $90\%$.
* **Amortiguamiento Real Bajo la Malla Sombra (EMA Interior):** 
  El contraste continuo entre ambas estaciones demuestra la eficacia del microclima bajo cultivo protegido:
  1. *Filtrado Lumínico Eficiente:* La malla sombra proporciona una **atenuación diurna media del $88.5\%$**, reduciendo los más de $34.000\text{ lux}$ exteriores a un promedio interior de **$4.020\text{ lux}$**, eliminando el riesgo de fotooxidación y quemaduras en las hojas.
  2. *Amortiguamiento Térmico:* La ventilación pasiva y el sombreado producen un **descenso térmico diurno promedio de $-6.5^\circ\text{C}$** respecto al exterior (el interior promedia $29.6^\circ\text{C}$). En días de calor extremo exterior ($> 40^\circ\text{C}$), el diferencial alcanza entre $-8.0^\circ\text{C}$ y $-9.3^\circ\text{C}$.
  3. *Estabilidad Higrométrica:* La humedad relativa interior diurna promedia **$74.0\%$** (superior al exterior), previniendo la deshidratación de las raíces aéreas sin propiciar encharcamientos continuos.
* **Géneros Botánicos en Cultivo:**
  1. ***Cattleya*:** Orquídea epífita de pseudobulbos y hojas coriáceas. Requiere buena iluminación filtrada y un ciclo estricto de secado radicular completo entre riegos.
  2. ***Dendrobium*:** Orquídea de cañas cilíndricas que demanda alternancia estacional entre crecimiento húmedo y reposo seco para inducir la brotación de varas florales.
  3. ***Phalaenopsis*:** Orquídea monopodial muy sensible al exceso de radiación directa y con alta demanda de humedad ambiental estable.
  4. **Colecciones Complementarias:** Rosas del desierto (*Adenium obesum*), cactus y suculentas en áreas sin automatización hidráulica, gestionadas mediante el catálogo unificado y órdenes de dosificación manual.

---

### 2. Fundamentación Biológica de las Reglas de Inferencia

Las decisiones automatizadas del servicio `Scheduler` sustituyen los riegos empíricos por reglas basadas en la respuesta biológica de la planta frente a los sensores de temperatura, humedad y luz:

* **Dinámica del Velamen Radicular y Veto por Alternancia Interdiaria:**
  Las raíces de las orquídeas epífitas están recubiertas por el *velamen*, un tejido esponjoso que absorbe agua con gran rapidez. Si el sustrato permanece empapado por más de 24 a 48 horas seguidas, la falta de oxígeno en las raíces provoca **asfixia radicular (anoxia)** y pudrición negra causada por hongos fitopatógenos (*Phytophthora*, *Pythium*). Por ello, el sistema impone la **alternancia interdiaria**: si el día anterior llovió ($\ge 20\text{ min}$) o se completó un ciclo de aspersión, el riego del día siguiente se cancela automáticamente para permitir la oxigenación y secado del sustrato.
* **Enfriamiento de Suelo ante Estrés Térmico ($T > 34^\circ\text{C}$):**
  Cuando la temperatura supera los $34^\circ\text{C}$, las orquídeas cierran sus estomas foliares para no perder agua, deteniendo su crecimiento. Regar el follaje bajo calor intenso causaría quemaduras y proliferación bacteriana; por ello, el sistema acciona la **humectación de piso (Línea 3)**. El agua esparcida en el suelo se evapora, absorbiendo calor del ambiente y reduciendo la temperatura interior entre $2^\circ\text{C}$ y $4^\circ\text{C}$ sin mojar las hojas.
* **Veto por Saturación Higrométrica ($HR \ge 85\%$ y $HR \ge 98\%$):**
  Si la humedad relativa supera el $85\%$ durante 4 horas continuas, el sustrato no puede evaporar el agua retenida. En consecuencia, el sistema veta cualquier rutina de aspersión programada. Asimismo, si se registran entre 6 y 8 bloques horarios consecutivos con humedad $\ge 98\%$, el sistema identifica un temporal continuo y bloquea preventivamente toda operación hidráulica.
* **Discriminación Lumínica Solar ($Lux$):**
  El luxómetro permite clasificar la jornada en tres ramas operativas (Rama A: Nublado $\le 15.000\text{ lux}$; Rama B: Soleado $> 26.000\text{ lux}$; Rama C: Intermedio). Bajo sol pleno continuo ($\ge 26.000\text{ lux}$), cualquier caída de temperatura aislada se descarta como lluvia, previniendo falsos vetos en momentos de máxima demanda de luz.

---

### 3. Modelo Taxonómico y Trazabilidad Fenológica

La estructura en la base de datos relacional (PostgreSQL / Prisma ORM) trasciende el inventario comercial tradicional al reflejar las características biológicas del cultivo:

* **Estructura Relacional Taxonómica:**
  1. `PlantType`: Categorización macro (Orquídeas, Suculentas, Cactus, Rosas del Desierto).
  2. `PlantGenus`: Agrupación por género (*Cattleya*, *Dendrobium*, *Phalaenopsis*) con descriptores de hábito y frecuencia de riego.
  3. `PlantSpecies`: Ficha biológica con descripción botánica, color característico de floración (`glowColor`) y galería fotográfica.
  4. `Plant`: Gemelo digital de la maceta individual (`SeedPlant`), enlazado con su tamaño (`PotSize`), mesa física y estado.
* **Segregación de Ejemplares:**
  1. *Plantas Madres:* Especímenes élite reservados exclusivamente para propagación vegetativa o conservación botánica; no disponibles para la venta.
  2. *Ejemplares Comerciales:* Macetas disponibles en la tienda digital con reserva atómica durante el proceso de compra.
* **Trazabilidad Fenológica de Floración:**
  Registro por ejemplar de la fecha de brote de vara, apertura de flor y marchitamiento. El sistema consolida estos eventos para calcular automáticamente: duración promedio de floración en días, frecuencia anual de floración y meses típicos de floración en la ficha pública de la especie.

---

### 4. Dosificación Agronómica y Seguridad en Laboratorio

El módulo de laboratorio (`/lab`) asegura la correcta preparación de mezclas y previene daños mecánicos o biológicos:

* **Prevención de Incompatibilidad Química:**
  Los fertilizantes ricos en Calcio soluble (Nitrato de Calcio) **nunca deben mezclarse con Sulfatos ni Fosfatos** en el tanque presurizado. La reacción química produce precipitados insolubles como el **Sulfato de Calcio (yeso)**:
  $$\text{Ca}^{2+} + \text{SO}_4^{2-} \longrightarrow \text{CaSO}_4 \downarrow$$
  Estos cristales sólidos obstruyen de inmediato los filtros de disco de 120 mesh y traban los solenoides de las electroválvulas. La interfaz de formulación de recetas valida los ingredientes para impedir estas combinaciones.
* **Rotación de Principios Activos (FRAC / IRAC):**
  Para evitar que plagas o patógenos desarrollen resistencia genética, el programador de dosificación rota sistemáticamente los mecanismos de acción de fungicidas (códigos FRAC) e insecticidas (códigos IRAC), intercalando aplicaciones de lavado con agua pura entre tratamientos.

---

### 5. Matriz Paramétrica de Referencia Operativa

La Tabla Ap-E1 sintetiza los umbrales climáticos y agronómicos que rigen las decisiones automáticas del sistema:

#### Tabla Ap-E1. *Límites y umbrales agronómicos para orquídeas epífitas en PristinoPlant*

| Variable / Magnitud | Rango Estándar | Umbral Crítico | Acción Algorítmica y Control en Sistema |
| :--- | :---: | :---: | :--- |
| **Temperatura Diurna ($T$)** | $24.0\text{ -- }30.0^\circ\text{C}$ | $> 34.0^\circ\text{C}$ | Conmuta humectación de piso (Línea 3) para enfriamiento evaporativo sin mojar follaje. |
| **Temperatura Nocturna ($T$)** | $18.0\text{ -- }22.0^\circ\text{C}$ | $< 15.0^\circ\text{C}$ | Auditoría telemétrica continua y cálculo del diferencial día/noche ($\Delta T$). |
| **Humedad Relativa ($HR$)** | $65.0\text{ -- }80.0\%$ | $\ge 85.0\%$ (4h) | Veto preventivo de la rutina de aspersión general por falta de evaporación. |
| **Saturación Sostenida ($HR$)** | $< 90.0\%$ | $\ge 98.0\%$ (6-8h) | Bloqueo absoluto de operaciones hídricas por temporal pluvial continuo. |
| **Iluminancia Solar ($Lux$)** | $15.000\text{ -- }25.000\text{ lux}$ | $\ge 26.000\text{ lux}$ | Descarta falsos positivos de lluvia bajo sol pleno y clasifica la rama de inferencia diurna. |
| **Dilución de Fertilizantes** | $0.5\text{ -- }1.0\text{ g/L}$ | $> 1.25\text{ g/L}$ | Alerta en el configurador de recetas para prevenir quemaduras de raíces por sobredosis. |
| **Compatibilidad Química** | Mezclas homogéneas | Calcio + Sulfatos/Fosfatos | Bloqueo de formulación para evitar precipitación de yeso y obstrucción de electroválvulas. |

*Nota.* Fuente: Elaboración propia a partir de las validaciones de campo en el orquideario PristinoPlant.
