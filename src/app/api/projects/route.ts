import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import type { RowDataPacket, ResultSetHeader } from "mysql2"

// 获取项目列表
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const search = searchParams.get("search") || ""
        const status = searchParams.get("status") || ""

        let sql = `
      SELECT p.*, 
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT('id', t.id, 'name', t.name, 'owner', t.owner, 'progress', t.progress, 'status', t.status)
        ) FROM project_tasks t WHERE t.project_id = p.id) as tasks
      FROM projects p
      WHERE 1=1
    `
        const params: string[] = []

        if (search) {
            sql += ` AND (p.name LIKE ? OR p.project_no LIKE ? OR p.product_name LIKE ? OR p.manager LIKE ?)`
            const like = `%${search}%`
            params.push(like, like, like, like)
        }

        if (status && status !== "all") {
            sql += ` AND p.status = ?`
            params.push(status)
        }

        sql += ` ORDER BY p.created_at DESC`

        const [rows] = await pool.query<RowDataPacket[]>(sql, params)

        // 解析 tasks JSON
        const projects = rows.map((row) => ({
            ...row,
            tasks: row.tasks ? (typeof row.tasks === "string" ? JSON.parse(row.tasks) : row.tasks) : [],
        }))

        return NextResponse.json(projects)
    } catch (error) {
        console.error("获取项目列表失败:", error)
        return NextResponse.json({ error: "获取项目列表失败" }, { status: 500 })
    }
}

// 创建项目
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { projectNo, name, productName, productCode, manager, creator, deadline, status, progress, risk, tasks } = body

        // 插入项目
        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO projects (project_no, name, product_name, product_code, manager, creator, deadline, status, progress, risk)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [projectNo, name, productName, productCode, manager, creator, deadline, status || "未开始", progress || 0, risk || "低"]
        )

        const projectId = result.insertId

        // 插入子任务
        if (tasks && tasks.length > 0) {
            const taskValues = tasks.map((t: { name: string; owner: string; progress?: number; status?: string }) => [
                projectId,
                t.name,
                t.owner,
                t.progress || 0,
                t.status || "未开始",
            ])
            await pool.query(
                `INSERT INTO project_tasks (project_id, name, owner, progress, status) VALUES ?`,
                [taskValues]
            )
        }

        // 返回完整项目
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT p.*, 
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT('id', t.id, 'name', t.name, 'owner', t.owner, 'progress', t.progress, 'status', t.status)
        ) FROM project_tasks t WHERE t.project_id = p.id) as tasks
      FROM projects p WHERE p.id = ?`,
            [projectId]
        )

        const project = rows[0]
        project.tasks = project.tasks ? (typeof project.tasks === "string" ? JSON.parse(project.tasks) : project.tasks) : []

        return NextResponse.json(project, { status: 201 })
    } catch (error: unknown) {
        console.error("创建项目失败:", error)
        const mysqlError = error as { code?: string }
        if (mysqlError.code === "ER_DUP_ENTRY") {
            return NextResponse.json({ error: "项目编号已存在" }, { status: 409 })
        }
        return NextResponse.json({ error: "创建项目失败" }, { status: 500 })
    }
}
