import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import type { RowDataPacket, ResultSetHeader } from "mysql2"

export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM pfmea_risks ORDER BY id")
        return NextResponse.json(rows)
    } catch (error) {
        console.error("PFMEA GET error:", error)
        return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const [result] = await pool.query<ResultSetHeader>(
            "INSERT INTO pfmea_risks (operation, failure_mode, effect, measure, sod, status) VALUES (?, ?, ?, ?, ?, ?)",
            [body.operation, body.failure_mode, body.effect, body.measure, body.sod, body.status || "追踪中"]
        )
        return NextResponse.json({ id: result.insertId }, { status: 201 })
    } catch (error) {
        console.error("PFMEA POST error:", error)
        return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        await pool.query("UPDATE pfmea_risks SET status=? WHERE id=?", [body.status, body.id])
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("PFMEA PUT error:", error)
        return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
}
