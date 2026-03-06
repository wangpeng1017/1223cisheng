import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import type { RowDataPacket, ResultSetHeader } from "mysql2"

export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM products ORDER BY id DESC")
        return NextResponse.json(rows)
    } catch (error) {
        console.error("Products GET error:", error)
        return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const [result] = await pool.query<ResultSetHeader>(
            "INSERT INTO products (product_id, name, category, spec, status) VALUES (?, ?, ?, ?, ?)",
            [body.product_id, body.name, body.category, body.spec, body.status || "激活"]
        )
        return NextResponse.json({ id: result.insertId }, { status: 201 })
    } catch (error) {
        console.error("Products POST error:", error)
        return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")
        if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
        await pool.query("DELETE FROM products WHERE id = ?", [id])
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Products DELETE error:", error)
        return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
}
