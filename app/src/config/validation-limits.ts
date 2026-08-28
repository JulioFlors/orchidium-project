/**
 * Constantes centralizadas de límites de caracteres para PristinoPlant.
 * Usadas en atributos HTML (maxLength) y validaciones Zod (cliente y servidor).
 */
export const VALIDATION_LIMITS = {
  // Nombres botánicos y taxonómicos
  TAXONOMY_NAME_MAX: 60,
  GENUS_NAME_MIN: 4,
  GENUS_NAME_MAX: 50,
  SPECIES_NAME_MAX: 60,

  // Nombres y títulos generales (Insumos, Programas, Rutinas)
  TITLE_NAME_MAX: 80,
  PROGRAM_NAME_MAX: 50,
  SUPPLY_NAME_MAX: 80,

  // Textareas y Notas
  SHORT_NOTE_MAX: 300,
  OBSERVATION_MAX: 300,
  REASON_CANCEL_MAX: 300,
  LONG_DESC_MAX: 1500,

  // Usuarios y Checkout
  PERSON_NAME_MAX: 70,
  ADDRESS_FIELD_MAX: 120,
  PHONE_MAX: 20,
  ID_NUMBER_MAX: 20,
  ZIP_CODE_MAX: 15,
} as const
