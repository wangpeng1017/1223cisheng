import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import type { RowDataPacket, ResultSetHeader } from "mysql2"

export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT * FROM ai_review_tasks ORDER BY created_at DESC"
        )
        // For each task, load issues
        const tasks = []
        for (const row of rows) {
            const [issues] = await pool.query<RowDataPacket[]>(
                "SELECT * FROM ai_review_issues WHERE task_id = ? ORDER BY id",
                [row.task_id]
            )
            tasks.push({
                task_id: row.task_id,
                drawing_name: row.drawing_name,
                file_url: row.file_url || "",
                file_type: row.file_type,
                status: row.status,
                created_at: row.created_at,
                duration_seconds: row.duration_seconds,
                summary: {
                    total_issues: row.total_issues,
                    critical: row.critical_count,
                    warning: row.warning_count,
                    info: row.info_count,
                    conclusion: row.conclusion,
                },
                issues: issues.map(i => ({
                    id: i.id,
                    severity: i.severity,
                    category: i.category,
                    title: i.title,
                    description: i.description,
                    suggestion: i.suggestion,
                })),
            })
        }
        return NextResponse.json(tasks)
    } catch (error) {
        console.error("AI Reviews GET error:", error)
        return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const taskId = `task-${Date.now()}`
        const drawingName = body.drawing_name || "未命名图纸"

        // Simulate AI analysis with realistic mock results
        const mockIssues = [
            { severity: "critical", category: "公差", title: "关键尺寸公差超标", description: `图纸 ${drawingName} 中检测到关键配合尺寸公差超出允许范围`, suggestion: "收紧公差至标准要求范围内" },
            { severity: "warning", category: "基准", title: "基准定义不完整", description: "基准体系缺少辅助基准定义", suggestion: "补充 Datum B 和 Datum C" },
            { severity: "warning", category: "标注规范", title: "表面粗糙度标注缺失", description: "2 处加工面缺少粗糙度标注", suggestion: "补充 Ra 值标注" },
            { severity: "info", category: "其他", title: "图框信息待更新", description: "版本号与最新ECN不一致", suggestion: "更新版本号及日期" },
        ]

        const critical = mockIssues.filter(i => i.severity === "critical").length
        const warning = mockIssues.filter(i => i.severity === "warning").length
        const info = mockIssues.filter(i => i.severity === "info").length
        const conclusion = critical > 0
            ? `发现 ${critical} 个严重问题需立即修正，${warning} 个建议修改项`
            : `未发现严重问题，${warning} 项建议修改`

        await pool.query<ResultSetHeader>(
            `INSERT INTO ai_review_tasks (task_id, drawing_name, file_type, status, duration_seconds, total_issues, critical_count, warning_count, info_count, conclusion)
             VALUES (?, ?, ?, 'completed', ?, ?, ?, ?, ?, ?)`,
            [taskId, drawingName, body.file_type || "pdf", Math.floor(Math.random() * 10) + 3, mockIssues.length, critical, warning, info, conclusion]
        )

        for (const issue of mockIssues) {
            await pool.query<ResultSetHeader>(
                "INSERT INTO ai_review_issues (task_id, severity, category, title, description, suggestion) VALUES (?, ?, ?, ?, ?, ?)",
                [taskId, issue.severity, issue.category, issue.title, issue.description, issue.suggestion]
            )
        }

        // Return the created task
        const [issues] = await pool.query<RowDataPacket[]>(
            "SELECT * FROM ai_review_issues WHERE task_id = ?", [taskId]
        )

        return NextResponse.json({
            task_id: taskId,
            drawing_name: drawingName,
            file_type: body.file_type || "pdf",
            status: "completed",
            created_at: new Date().toISOString(),
            duration_seconds: Math.floor(Math.random() * 10) + 3,
            summary: { total_issues: mockIssues.length, critical, warning, info, conclusion },
            issues: issues.map(i => ({ id: i.id, severity: i.severity, category: i.category, title: i.title, description: i.description, suggestion: i.suggestion })),
        }, { status: 201 })
    } catch (error) {
        console.error("AI Reviews POST error:", error)
        return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
}
