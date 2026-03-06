import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import type { RowDataPacket, ResultSetHeader } from "mysql2"

// 获取单个项目详情
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT p.*, 
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT('id', t.id, 'name', t.name, 'owner', t.owner, 'progress', t.progress, 'status', t.status)
        ) FROM project_tasks t WHERE t.project_id = p.id) as tasks
      FROM projects p WHERE p.id = ?`,
            [id]
        )

        if (rows.length === 0) {
            return NextResponse.json({ error: "项目不存在" }, { status: 404 })
        }

        const project = rows[0]
        project.tasks = project.tasks ? (typeof project.tasks === "string" ? JSON.parse(project.tasks) : project.tasks) : []

        return NextResponse.json(project)
    } catch (error) {
        console.error("获取项目详情失败:", error)
        return NextResponse.json({ error: "获取项目详情失败" }, { status: 500 })
    }
}

// 更新项目
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const body = await request.json()
        const { name, productName, productCode, manager, deadline, status, progress, risk, tasks } = body

        // 更新项目基本信息
        await pool.query<ResultSetHeader>(
            `UPDATE projects SET name=?, product_name=?, product_code=?, manager=?, deadline=?, status=?, progress=?, risk=?
       WHERE id=?`,
            [name, productName, productCode, manager, deadline, status, progress, risk, id]
        )

        // 更新子任务（先删后插）
        if (tasks !== undefined) {
            await pool.query(`DELETE FROM project_tasks WHERE project_id = ?`, [id])
            if (tasks.length > 0) {
                const taskValues = tasks.map((t: { name: string; owner: string; progress?: number; status?: string }) => [
                    id,
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
        }

        // 返回更新后的项目
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT p.*, 
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT('id', t.id, 'name', t.name, 'owner', t.owner, 'progress', t.progress, 'status', t.status)
        ) FROM project_tasks t WHERE t.project_id = p.id) as tasks
      FROM projects p WHERE p.id = ?`,
            [id]
        )

        const project = rows[0]
        project.tasks = project.tasks ? (typeof project.tasks === "string" ? JSON.parse(project.tasks) : project.tasks) : []

        return NextResponse.json(project)
    } catch (error) {
        console.error("更新项目失败:", error)
        return NextResponse.json({ error: "更新项目失败" }, { status: 500 })
    }
}

// 删除项目
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const [result] = await pool.query<ResultSetHeader>(
            `DELETE FROM projects WHERE id = ?`,
            [id]
        )

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: "项目不存在" }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("删除项目失败:", error)
        return NextResponse.json({ error: "删除项目失败" }, { status: 500 })
    }
}
