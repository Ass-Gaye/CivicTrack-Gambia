import { PrismaClient } from '@prisma/client'

/**
 * Singleton Prisma client to avoid multiple connections during hot reloads
 * in development (tsx watch restarts the module frequently).
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
