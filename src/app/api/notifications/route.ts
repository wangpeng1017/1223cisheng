import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import type { RowDataPacket } from "mysql2"

export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT * FROM notifications WHERE user_id = 1 ORDER BY FIELD(status,'unread','read'), created_at DESC"
        )
        return NextResponse.json(rows)
    } catch (error) {
        console.error("Notifications GET error:", error)
        return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        if (body.action === "markRead" && body.id) {
            await pool.query("UPDATE notifications SET status = 'read' WHERE id = ?", [body.id])
        } else if (body.action === "markAllRead") {
            await pool.query("UPDATE notifications SET status = 'read' WHERE user_id = 1")
        } else if (body.action === "clearRead") {
            await pool.query("DELETE FROM notifications WHERE user_id = 1 AND status = 'read'")
        }
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Notifications PUT error:", error)
        return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
}
