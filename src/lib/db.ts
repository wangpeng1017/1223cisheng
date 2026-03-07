import mysql from "mysql2/promise"

function getPoolConfig() {
    if (process.env.DATABASE_URL) {
        const url = new URL(process.env.DATABASE_URL)
        return {
            host: url.hostname,
            port: parseInt(url.port || "3306"),
            user: decodeURIComponent(url.username),
            password: decodeURIComponent(url.password),
            database: url.pathname.slice(1),
        }
    }
    return {
        host: process.env.DB_HOST || "127.0.0.1",
        port: parseInt(process.env.DB_PORT || "3309"),
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "npi2026secure",
        database: process.env.DB_NAME || "npi_db",
    }
}

const globalForDb = globalThis as unknown as {
    pool: mysql.Pool | undefined
}

export const pool =
    globalForDb.pool ??
    mysql.createPool({
        ...getPoolConfig(),
        waitForConnections: true,
        connectionLimit: 5,
        charset: "utf8mb4",
        connectTimeout: 10000,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
    })

if (process.env.NODE_ENV !== "production") {
    globalForDb.pool = pool
}
