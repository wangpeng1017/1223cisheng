import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import type { RowDataPacket, ResultSetHeader } from "mysql2"

export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM knowledge_articles ORDER BY views DESC")
        const articles = rows.map(r => ({
            ...r,
            tags: typeof r.tags === "string" ? JSON.parse(r.tags) : (r.tags || []),
        }))
        return NextResponse.json(articles)
    } catch (error) {
        console.error("Knowledge GET error:", error)
        return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const [result] = await pool.query<ResultSetHeader>(
            "INSERT INTO knowledge_articles (title, tags, views, content) VALUES (?, ?, 0, ?)",
            [body.title, JSON.stringify(body.tags || []), body.content || ""]
        )
        return NextResponse.json({ id: result.insertId }, { status: 201 })
    } catch (error) {
        console.error("Knowledge POST error:", error)
        return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
}
