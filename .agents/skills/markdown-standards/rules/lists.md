# Estándares de Listas

Las listas en Pristinoplant deben ser consistentes e indentadas correctamente para asegurar que los procesadores (como Next.js o el motor de IA) las interpreten como una sola estructura.

## MD032 - Líneas en blanco alrededor de listas

Toda lista debe estar separada de los párrafos adyacentes por una línea en blanco.

❌ **Incorrecto:**

```markdown
Aquí la lista:
- Ítem 1
- Ítem 2
```

✅ **Correcto:**

```markdown
Aquí la lista:

- Ítem 1
- Ítem 2
```

## MD007 - Indentación de sub-listas (2 espacios)

La indentación debe ser de **2 espacios** exactos. Usar 4 o tabulaciones causará errores en el linter.

❌ **Incorrecto:**

```markdown
- Padre
    - Hijo (4 espacios)
```

✅ **Correcto:**

```markdown
- Padre
  - Hijo (2 espacios)
```

## MD004 - Estilo de viñetas consistente

Usar siempre el guion (`-`) para listas no ordenadas.

❌ **Incorrecto:**

```markdown
* Ítem 1
+ Ítem 2
```

✅ **Correcto:**

```markdown
- Ítem 1
- Ítem 2
```

## MD029 - Prefijos de listas ordenadas (Estilo 1/2/3)

Las listas ordenadas deben seguir una secuencia incremental (1, 2, 3...) o ser consistentes (1, 1, 1...). En Pristinoplant preferimos la secuencia incremental para mayor claridad humana.

✅ **Correcto:**

```markdown
1. Primero
2. Segundo
3. Tercero
```
