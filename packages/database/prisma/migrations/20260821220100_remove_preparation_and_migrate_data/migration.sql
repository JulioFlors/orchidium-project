-- Migrar datos de preparation a dosageValue y dosageUnit para insumos simples
UPDATE "Agrochemical"
SET
  "dosageValue" = CASE
    WHEN "dosageValue" IS NOT NULL THEN "dosageValue"
    WHEN "preparation" ILIKE '%1/4 cdita%' OR "preparation" ILIKE '%0.25%' THEN 0.25
    WHEN "preparation" ILIKE '%50:50%' OR "preparation" ILIKE '%50%' THEN 50
    WHEN "preparation" ~ '^[0-9]+(\.[0-9]+)?' THEN (SUBSTRING("preparation" FROM '^[0-9]+(\.[0-9]+)?'))::DOUBLE PRECISION
    ELSE 1
  END,
  "dosageUnit" = CASE
    WHEN "dosageUnit" IS NOT NULL THEN "dosageUnit"
    WHEN "preparation" ILIKE '%1/4 cdita por planta%' OR "preparation" ILIKE '%cdita por planta%' OR "preparation" ILIKE '%cdita%' THEN 'CDITA_PLANTA'::"DosageUnit"
    WHEN "preparation" ILIKE '%cda/L%' OR "preparation" ILIKE '%cda%' THEN 'CDA_L'::"DosageUnit"
    WHEN "preparation" ILIKE '%50:50%' THEN 'PORCENTAJE'::"DosageUnit"
    WHEN "preparation" ILIKE '%g/L%' OR "preparation" ILIKE '%g / L%' OR "preparation" ILIKE '%g%' THEN 'G_L'::"DosageUnit"
    WHEN "preparation" ILIKE '%ml/L%' OR "preparation" ILIKE '%ml / L%' OR "preparation" ILIKE '%mL/L%' OR "preparation" ILIKE '%ml%' THEN 'ML_L'::"DosageUnit"
    ELSE 'ML_L'::"DosageUnit"
  END
WHERE "isMix" = false AND ("dosageValue" IS NULL OR "dosageUnit" IS NULL);

-- Limpiar valores para mezclas compuestas
UPDATE "Agrochemical"
SET "dosageValue" = NULL, "dosageUnit" = NULL
WHERE "isMix" = true;

-- Eliminar columna preparation de Agrochemical
ALTER TABLE "Agrochemical" DROP COLUMN "preparation";
