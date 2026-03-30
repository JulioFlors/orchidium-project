# Estándares de Iluminancia (Lux) para Orquídeas

## Contexto Fotométrico

La **iluminancia** es la cantidad de flujo luminoso que incide sobre una superficie por unidad de área. Su unidad en el Sistema Internacional es el **lux (lx)**, que equivale a un lumen por metro cuadrado ($1\ lx = 1\ lm/m^2$).

Para el cultivo de orquídeas, el lux es la unidad estándar de referencia en la literatura técnica y botánica para determinar si una planta está recibiendo la energía necesaria para la fotosíntesis sin sufrir quemaduras solares.

## Tabla de Requerimientos por Género

| Nivel de Luz | Lux (min - max) | Géneros Típicos | Color de Hoja Ideal |
| :--- | :--- | :--- | :--- |
| **Bajo** | 10,000 - 15,000 | Phalaenopsis, Paphiopedilum | Verde oscuro moderado |
| **Medio** | 15,000 - 25,000 | Oncidium, Miltoniopsis, Odontoglossum | Verde pasto |
| **Alto** | 25,500 - 35,000 | Cattleya, Dendrobium, Laelia | Verde claro / amarillento |
| **Muy Alto** | 35,000 - 50,000+ | Vanda, Brassavola, Epidendrum | Verde muy claro |

> [!IMPORTANT]
> **Duración del día**: No solo importa la intensidad absoluta (lux), sino el fotoperiodo. La mayoría de las orquídeas tropicales requieren entre 10 y 14 horas de luz diaria.

## Equivalencias Comunes

Aunque el sistema utiliza Lux, es común encontrar referencias en *foot-candles* (fc) en literatura antigua o de EE.UU.:

- $1\ fc \approx 10.76\ lux$
- $1,500\ fc \approx 16,000\ lux$ (Rango Cattleya bajo)

## Lógica de Alertas en PristinoPlant

Basado en estos estándares, el sistema clasificará el estado de la iluminancia interior (Zona A) y exterior de la siguiente manera:

### Iluminancia Interior (Orquideario)

- **Bajo (< 8,000 lx)**: "Insuficiente" (Riesgo de falta de floración).
- **Óptimo (10,000 - 45,000 lx)**: "Optimal" (Cubre la mayoría de las especies de la colección).
- **Alto (> 45,000 lx)**: "Warning" (Riesgo de estrés térmico o quemaduras en especies de sombra).

### Iluminancia Exterior (Referencia)

- **Sombra/Nubes (< 20,000 lx)**: Luz indirecta.
- **Día Despejado (40,000 - 80,000 lx)**: Luz solar directa parcial.
- **Pleno Sol (> 100,000 lx)**: Intensidad máxima (Peligroso para exposición directa).
