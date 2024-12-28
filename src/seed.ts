import { faker } from '@faker-js/faker'
import { schema } from './db/schema'
import { db } from './lib/db'

async function seed() {
  await db.delete(schema.users).then(() => console.log('All users deleted!'))

  const promises = Array.from({ length: 1000 }).map(async () => {
    const user: typeof schema.users.$inferInsert = {
      name: faker.internet.username(),
      age: faker.number.int({ min: 15, max: 100 }),
      email: faker.internet.email(),
    }

    return db.insert(schema.users).values(user)
  })

  await Promise.all(promises).then(() => console.log('All users inserted!'))
}

seed()
