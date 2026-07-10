import { prisma } from '@package/database'
import * as fs from 'fs'

async function main() {
  const ev = await prisma.rainEvent.findFirst({
    where: { id: { startsWith: '21743cf1' } },
  })

  const targetPath = 'C:\\Users\\Julio\\.gemini\\antigravity\\brain\\087a6557-ed4b-44aa-aac9-3a1c185d9ae4\\scratch\\event_one.json'
  fs.writeFileSync(targetPath, JSON.stringify(ev, null, 2))
  console.log('Saved details to event_one.json')
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })
