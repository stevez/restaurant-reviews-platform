import { PrismaClient } from '@prisma/client'
import { headers } from 'next/headers'

// Cache clients per worker for E2E testing
const workerClients = new Map<string, PrismaClient>()

function getDefaultClient(): PrismaClient {
  if (!globalThis.prisma) {
    // In E2E mode, use DATABASE_URL_BASE with a default database (test_0)
    // This ensures all requests go to the CI database on port 5434
    const isE2EMode = process.env.E2E_MODE === 'true'
    const baseUrl = process.env.DATABASE_URL_BASE

    if (isE2EMode && baseUrl) {
      globalThis.prisma = new PrismaClient({
        datasources: {
          db: { url: `${baseUrl}/test_0` },
        },
      })
    } else {
      globalThis.prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query'] : [],
      })
    }
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

export async function getPrisma(): Promise<PrismaClient> {
  // Only check header in E2E mode
  if (process.env.E2E_MODE === 'true') {
    try {
      const headersList = await headers()
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
