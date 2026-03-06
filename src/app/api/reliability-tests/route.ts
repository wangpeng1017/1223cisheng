import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import type { RowDataPacket, ResultSetHeader } from "mysql2"

export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM reliability_tests ORDER BY id")
        return NextResponse.json(rows)
    } catch (error) {
        console.error("ReliabilityTests GET error:", error)
        return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const [result] = await pool.query<ResultSetHeader>(
            "INSERT INTO reliability_tests (title, description, status, planned_date) VALUES (?, ?, ?, ?)",
            [body.title, body.description, body.status || "计划中", body.planned_date]
        )
        return NextResponse.json({ id: result.insertId }, { status: 201 })
    } catch (error) {
        console.error("ReliabilityTests POST error:", error)
        return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        await pool.query(
            "UPDATE reliability_tests SET title=?, description=?, status=?, planned_date=? WHERE id=?",
            [body.title, body.description, body.status, body.planned_date, body.id]
        )
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("ReliabilityTests PUT error:", error)
        return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
}
