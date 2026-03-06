import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import type { RowDataPacket, ResultSetHeader } from "mysql2"

export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50"
        )
        return NextResponse.json(rows)
    } catch (error) {
        console.error("AuditLogs GET error:", error)
        return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const [result] = await pool.query<ResultSetHeader>(
            "INSERT INTO audit_logs (user_name, module, action, ip, status) VALUES (?, ?, ?, ?, ?)",
            [body.user_name, body.module, body.action, body.ip || "127.0.0.1", body.status || "成功"]
        )
        return NextResponse.json({ id: result.insertId }, { status: 201 })
    } catch (error) {
        console.error("AuditLogs POST error:", error)
        return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
}
