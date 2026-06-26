import { Pool, type PoolConfig } from 'pg'
import { PrismaClient } from './generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// ---- Configuración de Colores para Logs ----
const Colors = {
  RESET: '\x1b[0m',
  RED: '\x1b[91m',
  GREEN: '\x1b[92m',
  BLUE: '\x1b[94m',
}
// ---- Detectamos el entorno ----
const isVercel = process.env.VERCEL === '1'

// ---- Instanciación Singleton de Prisma ----
// Mueve la creación del pool dentro de la función constructora. Solo se crea el pool la primera vez. En las siguientes recargas (HMR), como prismaGlobal.prisma ya existe, se salta todo el bloque de conexión y reutiliza la existente.
const prismaClientSingleton = () => {
  // ---- Selección Inteligente de URL ----
  // - Si estamos en Vercel, usamos la URL del Pooler (DATABASE_URL)
  // - Si estamos en Local, usamos la Directa (DATABASE_URL_UNPOOLED) para evitar timeouts,
  //   pero si no existe, usamos la del Pooler como fallback.
  let connectionString = process.env.DATABASE_URL

  if (!isVercel && process.env.DATABASE_URL_UNPOOLED) {
    connectionString = process.env.DATABASE_URL_UNPOOLED
  }

  if (!connectionString) {
    throw new Error(`❌ ${Colors.RED}No se encontró ninguna URL de base de datos definida.${Colors.RESET}`)
  }

  // ---- Inyección Dinámica de Parámetros de Timeout en la URL ----
  try {
    const parsedUrl = new URL(connectionString)
    if (isVercel) {
      // En Vercel forzamos timeouts de 5s para fallar rápido antes del límite de 10s
      parsedUrl.searchParams.set('connect_timeout', '5')
      parsedUrl.searchParams.set('pool_timeout', '5')
    } else {
      // En local permitimos hasta 30s en caso de latencia o arranques fríos del VPS
      parsedUrl.searchParams.set('connect_timeout', '30')
      parsedUrl.searchParams.set('pool_timeout', '30')
    }
    connectionString = parsedUrl.toString()
  } catch (error) {
    console.error('⚠️ [Prisma] No se pudo parsear el DATABASE_URL para inyectar timeouts dinámicos:', error)
  }

  // Log de depuración (ocultando contraseña)
  const maskedUrl = connectionString.replace(/:([^:@]+)@/, ':****@')
  console.log(`${Colors.BLUE}🔍 [Prisma] Conectando a: ${maskedUrl}${Colors.RESET}`)

  // Identificamos visualmente qué conexión estamos usando
  const isPooler = connectionString.includes('-pooler')
  const connectionType = isPooler ? 'Pooler (Optimized for Cloud)' : 'Unpooled (Optimized for Local)'

  // Configuración del Pool
  // SSL se habilita solo cuando es necesario:
  //   - Vercel: Neon requiere SSL obligatoriamente.
  //   - sslmode=require en URL: Conexiones externas al VPS (ej: desde la app).
  // Para conexiones internas Docker (container↔container) NO se usa SSL,
  // porque el hostname Docker ("postgres") no coincide con el certificado
  // emitido para el dominio público ("vps.tudominio.com").
  const requiresSsl = isVercel || connectionString.includes('sslmode=require')

  const poolConfig: PoolConfig = {
    connectionString,
    ssl: requiresSsl ? { rejectUnauthorized: false } : false,
    // Ajuste de tiempos del pool según el entorno
    connectionTimeoutMillis: isVercel ? 5000 : 30000, // 5s en Vercel vs 30s en local
    idleTimeoutMillis: isVercel ? 10000 : 30000,      // 10s en Vercel vs 30s en local
    max: isVercel ? 4 : 10 // Reducimos el pool en Vercel para no saturar las conexiones del VPS
  }

  // ---- Creamos el Pool SOLO cuando entramos a esta función ----
  const pool = new Pool(poolConfig)

  // ---- Configurar el Adapter ----
  // Usamos el driver estándar 'pg' para AMBOS (Local y Vercel/Producción).
  // Vercel soporta conexiones TCP perfectamente en sus Serverless Functions.
  const adapter = new PrismaPg(pool)

  if (isVercel) {
    console.log(`${Colors.BLUE}📡 [Prisma] Entorno VERCEL: ${connectionType} && Adapter PG (Standard TCP)${Colors.RESET}`)
  } else {
    console.log(`${Colors.GREEN}💻 [Prisma] Entorno LOCAL: ${connectionType} && Adapter PG (Standard TCP)${Colors.RESET}`)
  }

  return new PrismaClient({ adapter })
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const prismaGlobal = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

// Si 'prismaGlobal.prisma' ya existe, NO entra a 'prismaClientSingleton',
// por lo tanto, NO se ejecuta 'new Pool()', y no gastas conexiones.
const prisma = prismaGlobal.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') prismaGlobal.prisma = prisma

export default prisma