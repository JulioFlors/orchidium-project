# Requerimientos Ambientales por Género de Orquídea

Este documento consolida la investigación botánica de requerimientos abióticos (luz, temperatura, humedad y riego) específicos para los géneros y especies presentes en la colección del orquideario (extraídos de la base inicial de siembra `seed-data.ts`).

Las condiciones aquí descritas establecen los **rangos objetivo** para la configuración de alertas en la estación de monitoreo y las recetas de automatización de riego/clima.

---

## Análisis de Datos e Inferencias Botánicas (KPIs)

Para una gestión profesional del orquideario, no basta con medir datos crudos. El sistema infiere los siguientes indicadores clave:

### 1. DLI (Daily Light Integral)

Es la "dosis" total de luz (fotones) recibida en 24 horas. Se mide en **mol/m²/d**. Es el factor determinante para el crecimiento y la floración a largo plazo.

- **Factor de conversión**: $1\ klux \approx 18\ \mu mol/m^2/s$ (Luz solar).

### 2. VPD (Déficit de Presión de Vapor)

Mide la capacidad del aire para absorber humedad. Determina la tasa de transpiración y la apertura de estomas.

- **Día (Fotosíntesis)**: Rango ideal **0.8 - 1.2 kPa**.
- **Noche (Metabolismo CAM)**: Rango ideal **0.4 - 0.6 kPa**. Vital para que orquídeas como *Cattleya* respiren sin deshidratarse ni saturarse.
- **Zonas de Peligro**: $< 0.3\ kPa$ (Saturación/Hongos) o $> 1.6\ kPa$ (Estrés hídrico extremo).

### 3. DIF (Diferencial Térmico)

Diferencia entre el promedio de temperatura diurna y el promedio nocturno ($T_{avg\_dia} - T_{avg\_noche}$).

- **Importancia**: Un DIF positivo de al menos 5°C es esencial para inducir la maduración de pseudobulbos y la floración. Evita falsas lecturas por picos de calor momentáneos.

### 4. Riesgo Fúngico

Calculado por la persistencia de condiciones críticas durante la noche (Humedad $> 85\%$ y $VPD < 0.4\ kPa$).

- **Umbral de Alerta**: $> 4$ horas continuas en estas condiciones sin ventilación activa.

---

## 1. Género *Cattleya* y sus Híbridos (*Rhyncholaeliocattleya, Cattlianthe*)

Son las orquídeas predominantes en la colección (*C. Violacea*, *Rlc. George King*, *Cattlianthe Mary Elizabeth Bohn*, etc.). Conocidas por sus grandes flores y requerimientos luminosos específicos.

- **Luz (Iluminancia):** **21,500 a 37,700 lux**.
  - **Objetivo DLI:** **10 - 15 mol/m²/d**.
  - *Nota fisiológica:* Prefieren luz muy brillante pero *indirecta* (sombra del 65%-80% bajo invernadero). Las hojas deben lucir verde manzana o verde amarillento. Un verde oscuro intenso es síntoma de déficit de luz y previene la floración.
- **Temperatura:**
  - **Día:** 21°C - 29°C (70°F - 85°F).
  - **Noche:** 13°C - 22°C (55°F - 72°F).
  - **DIF Objetivo:** **5°C a 10°C**. Necesitan imperativamente este salto térmico para inducir la maduración de los brotes y la floración.
- **Humedad Relativa:** **50% a 80%**.
  - **VPD Nocturno:** **0.4 - 0.6 kPa**. Al ser plantas CAM, abren sus estomas de noche; un VPD fuera de este rango afecta su nutrición (transporte de Calcio).
- **Riego:** Secado rápido. El sustrato debe **secarse casi completamente** entre ciclos de riego. Típicamente un riego a saturación cada 5-7 días en etapa de crecimiento, extendiéndose a 10 días en invierno o época de frío.
- **Fuentes de consulta:**
  - [AOS - Cattleya Culture Sheet](https://www.aos.org/orchids/culture-sheets/cattleya.aspx)
  - [Missouri Botanical Garden - Cattleya Care](https://www.missouribotanicalgarden.org/)

---

## 2. Género *Dendrobium*

Un género inmenso, de los cuales la colección mantiene híbridos comerciales (ej. *D. Ocean Blue*, *D. Striata*, *D. Diamond*). Generalmente corresponden a la sección *Phalaenanthe* o *Spatulata* (afines al clima cálido).

- **Luz (Iluminancia):** **30,000 a 53,800 lux**.
  - **Objetivo DLI:** **12 - 20 mol/m²/d**.
  - *Nota fisiológica:* Son extremadamente tolerantes a la intensidad de luz, ubicándose en los rangos más altos para orquídeas comerciales. Pueden recibir sol directo de las primeras horas de la mañana.
- **Temperatura (Clima cálido):**
  - **Día:** 24°C - 30°C (75°F - 85°F).
  - **Noche:** 16°C - 18°C (60°F - 65°F).
  - **DIF Objetivo:** **8°C a 12°C**.
- **Humedad Relativa:** **50% a 70%**.
  - **VPD Objetivo:** **0.6 - 1.2 kPa**.
- **Riego:** Durante la temporada de crecimiento (primavera-verano) demandan agua frecuente y abundante dado su fuerte metabolismo, sin dejar que el sustrato repose mojado por días. Pueden requerir riego 2 veces por semana si están en cestas aéreas.
- **Fuentes de consulta:**
  - [AOS - Dendrobium Culture](https://www.aos.org/orchids/culture-sheets/dendrobium.aspx)
  - [Guna Orchids - Dendrobium Care](https://gunaorchids.com/)

---

## 3. Género *Dimerandra* (Ej. *Dimerandra stenopetala*)

Orquídeas epífitas de caña delgada, típicas de áreas tropicales cálidas americanas (origen selvas húmedas).

- **Luz (Iluminancia):** **Alta luminiscencia** (> 35,000 lux).
  - **Objetivo DLI:** **15 - 25 mol/m²/d**.
  - *Nota fisiológica:* Toleran sol directo de la aurora. La luz estimula rebrotes (keikis) y en ocasiones el follaje adopta un bronceado/coloración rojiza, lo cual es normal mientras no existan quemaduras localizadas.
- **Temperatura:** Zonas Calurosas (Warm to Hot).
  - **Día:** 25°C - 30°C.
  - **Noche:** 21°C - 23°C.
- **Humedad Relativa:** Extremadamente alta. **80% a 95%**.
  - **Riesgo Fúngico:** Muy alto debido a la baja evaporación nocturna. Requiere monitoreo constante de VPD ($> 0.4\ kPa$).
- **Riego:** A pesar de la alta humedad exigida, sus finas raíces deben transpirar velozmente. Toleran riegos pesados seguidos de excelente aeración (secado en 24-48 horas).
- **Fuentes de consulta:**
  - [EarthOne - Orchid Types](https://earthone.io/)

---

## 4. Género *Encyclia* (Ej. *Encyclia cordigera*)

Especie de gran aprecio por el aroma embriagador y a vainilla/chocolate de sus flores. Registrada en la base de datos como *Enciclea Cordijera*.

- **Luz (Iluminancia):** **25,000 a 35,000 lux**.
  - **Objetivo DLI:** **10 - 14 mol/m²/d**.
  - *Nota fisiológica:* La intensidad luminosa es el factor detonantee primario en la producción de los ésteres volátiles de su fragancia.
- **Temperatura:** Intermedio / Cálida.
  - **Día:** 25°C - 33°C.
  - **Noche:** 16°C - 19°C.
  - **DIF Objetivo:** **9°C a 14°C**.
- **Humedad Relativa:** **60% a 80%**.
  - **VPD Objetivo:** **0.5 - 1.0 kPa**.
- **Riego:** Gracias a sus pseudobulbos redondeados (almacenes de agua) tienen excelente resistencia a la sequía. Riego generoso, esperando que el sustrato seque casi por completo.
- **Fuentes de consulta:**
  - [AOS - Encyclia](https://www.aos.org/orchids/orchids-a-to-z/letter-e/encyclia.aspx)
  - [Gardino Nursery](https://gardinonursery.com/)
