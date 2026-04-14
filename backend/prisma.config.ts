// prisma.config.ts
// Prisma 7 — schema and migration paths only.
// The PrismaPg adapter is passed directly to new PrismaClient() in the app.
import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
})
