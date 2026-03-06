import { NextResponse } from "next/server"
import { pool } from "@/lib/db"
import type { RowDataPacket } from "mysql2"

export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM roles ORDER BY id")
        return NextResponse.json(rows)
    } catch (error) {
        console.error("Roles GET error:", error)
        return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
}
