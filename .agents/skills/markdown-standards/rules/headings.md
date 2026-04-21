# Estándares de Encabezados (Headings)

Los encabezados definen la jerarquía y navegabilidad del documento. Su correcto uso es vital para el renderizado consistente.

## MD041 - Primer encabezado debe ser H1

Todo archivo de Pristinoplant debe comenzar con un encabezado de nivel 1.

❌ **Incorrecto:**

```markdown
Contexto del proyecto.
# Título Principal
```

✅ **Correcto:**

```markdown
# Título Principal

Contexto del proyecto.
```

## MD001 - Incremento de niveles de uno en uno

No se deben saltar niveles en la jerarquía (ej. de H1 a H3).

❌ **Incorrecto:**

```markdown
# Nivel 1
### Nivel 3 (Salto detectado)
```

✅ **Correcto:**

```markdown
# Nivel 1
## Nivel 2
### Nivel 3
```

## MD022 - Líneas en blanco alrededor de encabezados

Este es el error más común. Los encabezados deben estar aislados por líneas vacías.

❌ **Incorrecto:**

```markdown
## Sección
Contenido pegado.
```

✅ **Correcto:**

```markdown
## Sección

Contenido separado.
```

## MD025 - Un solo H1 por documento

Solo el título principal debe ser H1. Las subsecciones deben ser H2 o menores.

✅ **Correcto:**

```markdown
# Título Único
## Subsección
```
