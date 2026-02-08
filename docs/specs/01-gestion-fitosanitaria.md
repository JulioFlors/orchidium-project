# Especificación de Requisitos: Módulo de Gestión Fitosanitaria y Base de Conocimientos

## 1. Visión General

Este módulo tiene como objetivo la construcción de una **Base de Conocimientos** que relacione las condiciones ambientales (temperatura, humedad, luz) y la temporalidad (mes del año) con la probabilidad de aparición de plagas y hongos específicos.

La finalidad última es **recomendar la aplicación preventiva de productos fitosanitarios** basada en datos y probabilidad, en lugar de esquemas rígidos y agresivos por calendario, optimizando así los recursos y la salud de las plantas.

## 2. Antecedentes y Justificación

* **Problema:** Los esquemas tradicionales (ej. aplicar 3 ciclos de pesticida todos los meses) son costosos y agresivos para el cultivo. El control manual y la memoria del cultivador son falibles y difíciles de escalar.
* **Referencia:** Se toma como inspiración sistemas industriales (como el mencionado 'AC') que utilizan estaciones meteorológicas para "pronosticar" riesgos fitosanitarios comparando datos en tiempo real con bases de datos históricas.
* **Estrategia:** Combinar una **"Data General"** (conocimiento a priori, bibliografía, NASA) con una **"Data Local"** (experiencia empírica del invernadero específico) para lograr una precisión creciente ("aprendizaje").

## 3. Objetivos del Sistema

1. **Predicción Preventiva:** Alertar sobre la probabilidad de plagas antes de que sean visualmente evidentes, basándose en las condiciones favorables para su desarrollo.
2. **Registro de Evidencia (Feedback):** Facilitar al usuario la captura de "lo que realmente pasó" (avistamientos reales, efectividad de tratamientos).
3. **Convergencia de Datos:** Permitir que el sistema compare sus predicciones teóricas con la realidad observada para "aprender" y ajustar las recomendaciones futuras (construcción de experiencia local).

## 4. Requerimientos Funcionales

### 4.1. Base de Conocimientos (Knowledge Base)

El sistema debe gestionar una base de datos de referencia que incluya:

* **Catálogo de Plagas/Hongos:** Nombre, descripción.
* **Condiciones Favorables:**
  * Rangos de Temperatura y Humedad detonantes.
  * Estacionalidad (Meses de mayor incidencia).
* **Protocolos de Tratamiento:**
  * Producto sugerido (vinculado al inventario de insumos).
  * Dosis y Frecuencia (Ciclos).

### 4.2. Motor de Recomendaciones (El "Experto")

* **Input:** Datos de sensores en tiempo real (Estación Meteorológica) + Fecha actual.
* **Proceso:** Comparar inputs vs. Condiciones Favorables en la Base de Conocimientos.
* **Output:** Notificación/Alerta: *"Condiciones favorables para [Plaga X]. Se recomienda iniciar protocolo preventivo con [Producto Y]"*.

### 4.3. Registro de Operaciones y Observaciones (Bitácora)

Interfaz para que el usuario valide y alimente el sistema:

* **Registro de Avistamiento:** *"Hoy vi [Plaga X] en [Zona A]"*.
  * Permite validar si la predicción fue correcta o si apareció una plaga no prevista.
* **Registro de Aplicación:** *"Apliqué [Producto Y] (Dosis Z) el [Fecha]"*.
* **Registro de Evaluación:** *"Post-aplicación: La plaga disminuyó/desapareció/persistió"*.

### 4.4. Visualización y Aprendizaje

* **Dashboard:**
  * Visualización de Riesgos Actuales (Semáforo de Plagas).
  * Calendario de Aplicaciones Sugeridas vs. Realizadas.
* **Histórico:**
  * Reportes que permitan ver patrones anuales (ej. *"En Mayo siempre sube la araña roja si la humedad baja del 40%"*).
  * Comparativa de Eficacia de tratamientos anteriores.

## 5. Flujo de Trabajo de Usuario (User Journey)

1. **Consulta:** El usuario revisa el Dashboard. El sistema indica: *"Riesgo Alto de Hongos por lluvia continua"*.
2. **Decisión:** El usuario decide aplicar un fungicida preventivo.
3. **Ejecución y Registro:** El usuario aplica y registra la acción en el sistema.
4. **Confirmación:** Días después, el usuario inspecciona y registra: *"Sin presencia de hongos"*.
5. **Aprendizaje:** El sistema guarda este evento exitoso asociado a las condiciones climáticas de esa semana.

## 6. Consideraciones Técnicas

* **Persistencia:** Se requiere una estructura de datos robusta para almacenar series temporales de condiciones climáticas vinculadas a eventos de plagas.
* **Interfaz:** Debe ser rápida y accesible (móvil) para registrar observaciones "in situ" dentro del invernadero.
* **Escalabilidad:** El sistema debe ser útil desde el día 1 (usando Data General) y volverse más preciso con el tiempo (añadiendo Data Local).
