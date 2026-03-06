import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import type { RowDataPacket, ResultSetHeader } from "mysql2"

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const planType = searchParams.get("type") || ""
        let sql = "SELECT * FROM qplan_items"
        const params: string[] = []
        if (planType) {
            sql += " WHERE plan_type = ?"
            params.push(planType)
        }
        sql += " ORDER BY id"
        const [rows] = await pool.query<RowDataPacket[]>(sql, params)
        return NextResponse.json(rows)
    } catch (error) {
        console.error("QPlan GET error:", error)
        return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const [result] = await pool.query<ResultSetHeader>(
            "INSERT INTO qplan_items (plan_type, category, item, spec_limit, tool, sample_level) VALUES (?, ?, ?, ?, ?, ?)",
            [body.plan_type || "IQC", body.category, body.item, body.spec_limit, body.tool, body.sample_level]
        )
        return NextResponse.json({ id: result.insertId }, { status: 201 })
    } catch (error) {
        console.error("QPlan POST error:", error)
        return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        await pool.query(
            "UPDATE qplan_items SET category=?, item=?, spec_limit=?, tool=?, sample_level=? WHERE id=?",
            [body.category, body.item, body.spec_limit, body.tool, body.sample_level, body.id]
        )
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("QPlan PUT error:", error)
        return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")
        if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
        await pool.query("DELETE FROM qplan_items WHERE id = ?", [id])
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("QPlan DELETE error:", error)
        return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
}
