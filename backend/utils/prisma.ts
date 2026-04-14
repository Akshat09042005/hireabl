import { PrismaClient } from '../prisma/generated-client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

/**
 * prisma.ts
 * ----------
 * Centralized Prisma Client singleton.
 * Using Prisma 7 with PostgreSQL pg adapter.
 */

// Connection string from environment
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in environment variables')
}

// 1. Create pg Pool
const pool = new Pool({ connectionString })

// 2. Wrap it in PrismaPg adapter
const adapter = new PrismaPg(pool)

// 3. Instantiate the PrismaClient once
export const prisma = new PrismaClient({ adapter })

export default prisma
