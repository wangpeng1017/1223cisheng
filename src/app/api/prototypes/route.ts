import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import type { RowDataPacket, ResultSetHeader } from "mysql2"

export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM prototype_batches ORDER BY id DESC")
        return NextResponse.json(rows)
    } catch (error) {
        console.error("Prototypes GET error:", error)
        return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const [result] = await pool.query<ResultSetHeader>(
            "INSERT INTO prototype_batches (batch_no, quantity, result, batch_date) VALUES (?, ?, ?, ?)",
            [body.batch_no, body.quantity, body.result, body.batch_date]
        )
        return NextResponse.json({ id: result.insertId }, { status: 201 })
    } catch (error) {
        console.error("Prototypes POST error:", error)
        return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
}
