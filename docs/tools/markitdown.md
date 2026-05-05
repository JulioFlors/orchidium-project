# Herramientas de Desarrollo: MarkItDown

**MarkItDown** es la herramienta oficial seleccionada para la conversión de documentos externos (PDFs de proveedores, guías de cultivo en Office, etc.) al formato Markdown compatible con nuestro motor de inferencia y documentación técnica.

## Estado de Instalación

- **Entorno**: Global (System Python).
- **Versión**: Instalado con soporte completo (`[all]`).

## Casos de Uso en PristinoPlant

1. **Ingesta de manuales**: Convertir PDFs de orquídeas a Markdown para ser procesados por el `Inference Engine`.
2. **Documentación**: Transformar especificaciones de hardware recibidas en formatos Office.

## Referencia Rápida

### Terminal

```powershell
markitdown <archivo_entrada> -o <archivo_salida.md>
```

### Integración en Código

Para usar en servicios de Node.js, se recomienda invocar vía `child_process` o usar un puente de Python si es necesario un procesamiento más complejo.

---
*Documento generado automáticamente como parte de la memoria persistente del sistema.*
