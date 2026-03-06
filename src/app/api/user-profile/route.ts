import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import type { RowDataPacket } from "mysql2"

export async function GET() {
    try {
        const [users] = await pool.query<RowDataPacket[]>("SELECT * FROM system_users WHERE id = 1")
        if (users.length === 0) return NextResponse.json({ error: "No user" }, { status: 404 })

        const [activities] = await pool.query<RowDataPacket[]>(
            "SELECT * FROM user_activities WHERE user_id = 1 ORDER BY created_at DESC LIMIT 10"
        )
        const [notifications] = await pool.query<RowDataPacket[]>(
            "SELECT * FROM notifications WHERE user_id = 1 ORDER BY FIELD(status,'unread','read'), created_at DESC"
        )
        const [watched] = await pool.query<RowDataPacket[]>(
            "SELECT * FROM watched_projects WHERE user_id = 1 ORDER BY id"
        )

        return NextResponse.json({
            user: users[0],
            activities,
            notifications,
            watchedProjects: watched.map(w => w.project_name),
        })
    } catch (error) {
        console.error("UserProfile GET error:", error)
        return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        if (body.title) {
            await pool.query("UPDATE system_users SET title = ? WHERE id = 1", [body.title])
        }
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("UserProfile PUT error:", error)
        return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
}
