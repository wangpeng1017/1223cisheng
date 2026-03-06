import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import type { RowDataPacket } from "mysql2"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
    try {
        const { taskId } = await params
        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT * FROM ai_review_tasks WHERE task_id = ?", [taskId]
        )
        if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })

        const task = rows[0]
        const [issues] = await pool.query<RowDataPacket[]>(
            "SELECT * FROM ai_review_issues WHERE task_id = ? ORDER BY id", [taskId]
        )

        return NextResponse.json({
            task_id: task.task_id,
            drawing_name: task.drawing_name,
            file_type: task.file_type,
            status: task.status,
            created_at: task.created_at,
            duration_seconds: task.duration_seconds,
            summary: { total_issues: task.total_issues, critical: task.critical_count, warning: task.warning_count, info: task.info_count, conclusion: task.conclusion },
            issues: issues.map(i => ({ id: i.id, severity: i.severity, category: i.category, title: i.title, description: i.description, suggestion: i.suggestion })),
        })
    } catch (error) {
        console.error("AI Review GET error:", error)
        return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
    try {
        const { taskId } = await params
        await pool.query("DELETE FROM ai_review_issues WHERE task_id = ?", [taskId])
        await pool.query("DELETE FROM ai_review_tasks WHERE task_id = ?", [taskId])
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("AI Review DELETE error:", error)
        return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
}
