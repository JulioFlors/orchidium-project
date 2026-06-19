# Plan Técnico: Migración de Imágenes de Plantas a Cloudflare R2

## Arquitectura y Flujo de Datos

### 1. Script de Migración
El script se ubicará en `services/seed/src/scripts/migrate-images-to-r2.ts`. 

Flujo de ejecución del script:
1. Instanciar el cliente `S3Client` configurado con R2 (`forcePathStyle: true`).
2. Resolver el directorio de entrada `app/public/plants/` de forma recursiva.
3. Para cada archivo encontrado:
   - Calcular la clave R2 relativa (`plants/subfolder/file.extension`).
   - Hacer un `HeadObjectCommand`. Si tiene éxito, se asume que ya existe en R2 y se omite.
   - Si lanza un error con status `404` (NotFound), se lee el archivo a un buffer y se sube mediante `PutObjectCommand` especificando el `ContentType` correcto según la extensión.
4. Mostrar resumen en consola:
   - Total procesados
   - Subidos exitosamente
   - Omitidos (ya existentes)
   - Errores

### 2. Exclusión de Despliegue
Se crea un archivo `.vercelignore` en la raíz del proyecto para ignorar el directorio físico local `app/public/plants/`.
De esta forma, las imágenes del seed de 1GB solo residen en el repositorio Git y no se despliegan ni consumen almacenamiento serverless en Vercel.

### 3. Helper de Imágenes Centralizado con Resolución Absoluta de R2
El helper se colocará en `app/src/lib/image-utils.ts` y se exportará en `app/src/lib/index.ts`.

Fórmula de resolución:
```typescript
export function getImageUrl(url?: string): string {
  if (!url) return '/imgs/placeholder.jpg'
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  
  const cleanUrl = url.startsWith('/') ? url.slice(1) : url
  const prefix = cleanUrl.startsWith('plants/') ? '' : 'plants/'
  
  const r2BaseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || 'https://storage.sisparrow.com'
  return `${r2BaseUrl}/${prefix}${cleanUrl}`
}
```

### 4. Componentes a Modificar
- `app/src/components/product/product-image/ProductImage.tsx`
- `app/src/app/(shop)/cart/ui/CartView.tsx`
- `app/src/components/product/product-grid/ProductGridItem.tsx`
- `app/src/components/product/slideshow/MobileSlideshow.tsx`
- `app/src/components/product/slideshow/Slideshow.tsx`
- `app/src/app/(orchidarium)/(inventory)/species/ui/SpeciesInventoryCard.tsx`
- `app/src/app/(orchidarium)/(inventory)/species/ui/SpeciesDetailView.tsx`

## Ejecución y Scripts de Configuración
Se agregarán las tareas en los archivos `package.json` de la raíz y del servicio de seed para automatizar la ejecución mediante pnpm.
- Raíz: `pnpm db:migrate-images`
- Seed: `pnpm migrate-images`
