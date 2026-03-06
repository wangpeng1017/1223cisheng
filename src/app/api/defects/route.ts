import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import type { RowDataPacket, ResultSetHeader } from "mysql2"

export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM defects ORDER BY occurrence DESC")
        return NextResponse.json(rows)
    } catch (error) {
        console.error("Defects GET error:", error)
        return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const [result] = await pool.query<ResultSetHeader>(
            "INSERT INTO defects (code, name, category, severity, description, solution, occurrence) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [body.code, body.name, body.category, body.severity, body.description, body.solution, body.occurrence || 0]
        )
        return NextResponse.json({ id: result.insertId }, { status: 201 })
    } catch (error) {
        console.error("Defects POST error:", error)
        return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
}
