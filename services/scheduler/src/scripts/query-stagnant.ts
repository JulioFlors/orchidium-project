import { prisma } from '@package/database'

async function main() {
  const ev = await prisma.rainEvent.findFirst({
    where: { id: { startsWith: '2977a81a' } },
  })

  console.log('EVENT DETAILS:')
  console.log(JSON.stringify(ev, null, 2))
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })
