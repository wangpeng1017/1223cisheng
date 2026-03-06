import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import type { RowDataPacket } from "mysql2"

export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM system_settings ORDER BY category, id")
        return NextResponse.json(rows)
    } catch (error) {
        console.error("Settings GET error:", error)
        return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        await pool.query(
            "UPDATE system_settings SET enabled = ? WHERE setting_key = ?",
            [body.enabled, body.setting_key]
        )
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Settings PUT error:", error)
        return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
}
