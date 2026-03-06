import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import type { RowDataPacket, ResultSetHeader } from "mysql2"

export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM process_steps ORDER BY sort_order")
        return NextResponse.json(rows)
    } catch (error) {
        console.error("ProcessSteps GET error:", error)
        return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const [result] = await pool.query<ResultSetHeader>(
            "INSERT INTO process_steps (route_name, step_no, name, params, status, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
            [body.route_name || "A-2", body.step_no, body.name, body.params, body.status || "pending", body.sort_order || 0]
        )
        return NextResponse.json({ id: result.insertId }, { status: 201 })
    } catch (error) {
        console.error("ProcessSteps POST error:", error)
        return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        await pool.query(
            "UPDATE process_steps SET name=?, params=?, status=? WHERE id=?",
            [body.name, body.params, body.status, body.id]
        )
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("ProcessSteps PUT error:", error)
        return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
}
