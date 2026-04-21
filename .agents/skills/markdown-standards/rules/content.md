# Estándares de Contenido y Estilo

Estas reglas aseguran que el archivo sea "limpio" y fácil de leer tanto en editores de texto plano como en plataformas renderizadas.

## MD012 - Múltiples líneas en blanco consecutivas

No usar más de una línea en blanco para separar párrafos o secciones.

❌ **Incorrecto:**

```markdown
Párrafo 1.


Párrafo 2.
```

✅ **Correcto:**

```markdown
Párrafo 1.

Párrafo 2.
```

## MD013 - Longitud de línea (Desactivada)

En Pristinoplant, la regla de longitud de línea (80 caracteres) está **DESACTIVADA** porque confiamos en el ajuste de línea (Word Wrap) del editor de cada desarrollador. Sin embargo, se recomienda no exceder longitudes absurdas en párrafos únicos.

## MD010 - No usar Tabulaciones (No Hard Tabs)

Usar siempre espacios. Las tabulaciones se renderizan de forma inconsistente entre sistemas operativos.

✅ **Correcto:**
Usar la configuración de "Espaces: 2" en VS Code.

## MD009 - Espacios al final de línea (Trailing Spaces)

No debe haber espacios invisibles al final de las líneas de texto.

✅ **Consejo:**
El sistema de auto-corrección que configuramos en VS Code eliminará estos espacios automáticamente al guardar.

## MD011 - Estilo de enlaces revertido (Reversed links)

A veces se confunde la sintaxis de los enlaces.

❌ **Incorrecto:**

```markdown
(Texto)[URL]
```

✅ **Correcto:**

```markdown
[Texto](URL)
```
