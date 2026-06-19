# Especificación: Migración de Imágenes de Plantas a Cloudflare R2

## Contexto de Negocio

El sistema "Pristinoplant" gestiona imágenes de especies e inventarios de plantas. Para evitar sobrecargar el servidor web Next.js local y Vercel en producción con archivos binarios masivos, toda la carga de imágenes se ha trasladado a Cloudflare R2.

Para cumplir con esto, se establece que **todas las imágenes deben ser consumidas exclusivamente desde R2**, tanto en desarrollo como en producción. Además, las imágenes de prueba para el seed se mantendrán localmente en el repositorio Git pero se excluirán del despliegue en Vercel mediante un archivo `.vercelignore`, optimizando el espacio y los builds de producción.

## Requerimientos Técnicos

### 1. Script de Migración
- Un script de Node.js/TypeScript de un solo uso que lea recursivamente todos los archivos de la carpeta `app/public/plants/`.
- Comprobar la existencia de cada archivo en el bucket R2 mediante metadatos (`HEAD`).
- Si el archivo no existe en R2, se lee de disco local y se sube mediante el cliente de R2 (`PUT`) con el Content-Type adecuado (`image/webp`).
- El script debe mostrar estadísticas claras de subida (exitosos, omitidos por ya existir, errores).

### 2. Exclusión de Archivos en Vercel
- Crear un archivo `.vercelignore` para evitar que la carpeta `app/public/plants/` (de aproximadamente 1GB) sea subida o procesada por Vercel durante el deploy.

### 3. Resolución Absoluta de Imágenes en el Frontend
- Crear una función helper centralizada `getImageUrl(url)` que formatee cualquier entrada de URL de imagen.
- Si la URL es absoluta (empieza con `http`), se devuelve tal cual (imagen de R2).
- Si la URL es relativa, le antepone la base URL pública de R2 (`NEXT_PUBLIC_R2_PUBLIC_URL` o fallback en producción) y el prefijo `plants/` si corresponde.
- De esta manera, el navegador **siempre** pedirá las imágenes a R2.
- Si la URL es inválida o vacía, devuelve el placeholder de imagen rota (`/imgs/placeholder.jpg`).
- Actualizar los componentes del frontend para que consuman este helper centralizado.
