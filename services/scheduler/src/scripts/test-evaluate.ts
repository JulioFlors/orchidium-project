import { prisma } from '@package/database'

import { InferenceEngine } from '../lib/inference-engine'

async function main() {
  console.log('--- TESTING INFERENCE ENGINE EVALUATE ---')
  try {
    const schedules = await prisma.automationSchedule.findMany()

    for (const schedule of schedules) {
      console.log(
        `\nEvaluating schedule: "${schedule.name}" (ID: ${schedule.id}, Purpose: ${schedule.purpose})`,
      )
      const result = await InferenceEngine.evaluate(schedule)

      console.log('Result:', JSON.stringify(result, null, 2))
    }
  } catch (err) {
    console.error('Error during test:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
