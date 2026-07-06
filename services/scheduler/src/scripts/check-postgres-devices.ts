import { prisma } from '@package/database'

async function main() {
  console.log('📡 Buscando dispositivos registrados en Postgres...')
  const devices = await prisma.device.findMany()

  console.log('Dispositivos:', JSON.stringify(devices, null, 2))

  console.log('\n📡 Buscando últimas telemetrías registradas en Postgres (por dispositivo)...')
  const telemetries = await prisma.telemetry.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
  })

  for (const t of telemetries) {
    console.log(
      `- ID: ${t.id} | DeviceId: ${t.deviceId} | Temp: ${t.temperature}°C | Hum: ${t.humidity}% | Lux: ${t.illuminance} lx | CreatedAt: ${t.createdAt.toISOString()}`,
    )
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
