import { PrismaClient } from '@prisma/client'
import { headers } from 'next/headers'

// Cache clients per worker for E2E testing
const workerClients = new Map<string, PrismaClient>()

function getDefaultClient(): PrismaClient {
  if (!globalThis.prisma) {
    globalThis.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query'] : [],
    })
  }
  return globalThis.prisma
}

function getWorkerClient(workerId: string): PrismaClient {
  if (!workerClients.has(workerId)) {
    const baseUrl = process.env.DATABASE_URL_BASE
    if (!baseUrl) {
      throw new Error('DATABASE_URL_BASE is not set for E2E mode')
    }
    workerClients.set(
      workerId,
      new PrismaClient({
        datasources: {
          db: { url: `${baseUrl}/test_${workerId}` },
        },
      })
    )
  }
  return workerClients.get(workerId)!
}

export function getPrisma(): PrismaClient {
  // Only check header in E2E mode
  if (process.env.E2E_MODE === 'true') {
    try {
      const headersList = headers()
      const workerId = headersList.get('x-worker-id')
      if (workerId) {
        return getWorkerClient(workerId)
      }
    } catch {
      // headers() throws outside of request context
    }
  }
  return getDefaultClient()
}

// For backward compatibility - existing code can still use prisma directly
export const prisma = getDefaultClient()
