import { PrismaClient } from "@prisma/client"

// 防止开发模式下热重载创建多个 Prisma Client 实例
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma
}
