import { NextResponse } from "next/server"
import { pool } from "@/lib/db"
import type { RowDataPacket } from "mysql2"

export async function GET() {
    try {
        // Project counts by status
        const [statusRows] = await pool.query<RowDataPacket[]>(
            "SELECT status, COUNT(*) as count FROM projects GROUP BY status"
        )
        const statusMap: Record<string, number> = {}
        let totalProjects = 0
        for (const r of statusRows) {
            statusMap[r.status] = r.count
            totalProjects += r.count
        }

        // Delayed tasks count
        const delayedCount = statusMap["延期"] || 0

        // Completion rate - completed tasks / total tasks
        const [taskStats] = await pool.query<RowDataPacket[]>(
            "SELECT COUNT(*) as total, SUM(CASE WHEN status='已完成' THEN 1 ELSE 0 END) as completed FROM project_tasks"
        )
        const completionRate = taskStats[0].total > 0
            ? Math.round((taskStats[0].completed / taskStats[0].total) * 1000) / 10
            : 0

        // Urgent tasks (projects with upcoming deadlines or delayed)
        const [urgentTasks] = await pool.query<RowDataPacket[]>(
            `SELECT id, name, project_no, status, deadline, progress
             FROM projects
             WHERE status IN ('延期','预警','进行中')
             ORDER BY CASE WHEN status='延期' THEN 0 WHEN status='预警' THEN 1 ELSE 2 END, deadline ASC
             LIMIT 5`
        )

        // NPI stage stats
        const [stageStats] = await pool.query<RowDataPacket[]>(
            "SELECT stage as name, actual_rate as value, target_rate as target FROM npi_stage_stats ORDER BY id"
        )

        // Pie data
        const pieData = [
            { name: "进行中", value: statusMap["进行中"] || 0, color: "#2563eb" },
            { name: "已完成", value: statusMap["已完成"] || 0, color: "#10b981" },
            { name: "已延期", value: statusMap["延期"] || 0, color: "#f43f5e" },
            { name: "预警", value: statusMap["预警"] || 0, color: "#f59e0b" },
        ]

        // Recent activities for timeline
        const [activities] = await pool.query<RowDataPacket[]>(
            "SELECT content, created_at FROM user_activities ORDER BY created_at DESC LIMIT 3"
        )

        return NextResponse.json({
            stats: {
                totalProjects,
                completionRate,
                delayedCount,
                avgLoad: Math.min(95, 60 + totalProjects * 3),
            },
            chartData: stageStats,
            pieData,
            urgentTasks: urgentTasks.map((t) => ({
                id: t.id,
                title: t.name,
                project: t.project_no,
                status: t.status,
                deadline: t.deadline,
                priority: t.status === "延期" ? "高" : t.status === "预警" ? "高" : "中",
            })),
            activities,
        })
    } catch (error) {
        console.error("Dashboard error:", error)
        return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 })
    }
}
