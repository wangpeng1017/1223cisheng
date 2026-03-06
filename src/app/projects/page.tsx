"use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import {
    PlusOutlined,
    SearchOutlined,
    FilterOutlined,
    CalendarOutlined,
    UserOutlined,
    FileTextOutlined,
    HistoryOutlined,
    UploadOutlined,
    DeleteOutlined,
    EditOutlined,
} from "@ant-design/icons"
import { Button, Tag, Card, Table, Modal, Input, Select, App, Spin, DatePicker } from "antd"
import type { TableProps } from "antd"
import dayjs from "dayjs"

// ========== 类型 ==========

interface ProjectTask {
    id?: number
    name: string
    owner: string
    progress: number
    status: string
}

interface Project {
    id: number
    project_no: string
    name: string
    product_name: string
    product_code: string
    manager: string
    creator: string
    deadline: string
    status: string
    progress: number
    risk: string
    created_at: string
    tasks: ProjectTask[]
}

// ========== 页面 ==========

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedRows, setExpandedRows] = useState<number[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingProject, setEditingProject] = useState<Project | null>(null)
    const [saving, setSaving] = useState(false)
    const { message, modal } = App.useApp()

    // 表单状态
    const [form, setForm] = useState({
        projectNo: "",
        name: "",
        productName: "",
        productCode: "",
        manager: "",
        creator: "",
        deadline: "",
        status: "未开始",
        progress: 0,
        risk: "低",
    })

    // 加载项目列表
    const fetchProjects = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (searchTerm) params.set("search", searchTerm)
            if (statusFilter !== "all") {
                const statusMap: Record<string, string> = {
                    active: "进行中",
                    warning: "预警",
                    overdue: "延期",
                    done: "已完成",
                }
                if (statusMap[statusFilter]) params.set("status", statusMap[statusFilter])
            }
            const res = await fetch(`/api/projects?${params}`)
            if (res.ok) {
                const data = await res.json()
                setProjects(data)
            }
        } catch (e) {
            console.error("加载项目失败:", e)
            message.error("加载项目列表失败")
        } finally {
            setLoading(false)
        }
    }, [searchTerm, statusFilter, message])

    useEffect(() => {
        fetchProjects()
    }, [fetchProjects])

    // 打开新建
    const openCreate = () => {
        setEditingProject(null)
        setForm({
            projectNo: "",
            name: "",
            productName: "",
            productCode: "",
            manager: "",
            creator: "",
            deadline: "",
            status: "未开始",
            progress: 0,
            risk: "低",
        })
        setIsModalOpen(true)
    }

    // 打开编辑
    const openEdit = (project: Project) => {
        setEditingProject(project)
        setForm({
            projectNo: project.project_no,
            name: project.name,
            productName: project.product_name,
            productCode: project.product_code,
            manager: project.manager,
            creator: project.creator,
            deadline: project.deadline,
            status: project.status,
            progress: project.progress,
            risk: project.risk,
        })
        setIsModalOpen(true)
    }

    // 保存（新建或编辑）
    const handleSave = async () => {
        if (!form.name || !form.projectNo) {
            message.warning("请填写项目名称和项目代号")
            return
        }
        setSaving(true)
        try {
            const url = editingProject ? `/api/projects/${editingProject.id}` : "/api/projects"
            const method = editingProject ? "PUT" : "POST"
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            })
            if (res.ok) {
                message.success(editingProject ? "更新成功" : "创建成功")
                setIsModalOpen(false)
                fetchProjects()
            } else {
                const err = await res.json()
                message.error(err.error || "操作失败")
            }
        } catch (e) {
            console.error("保存失败:", e)
            message.error("保存失败")
        } finally {
            setSaving(false)
        }
    }

    // 删除
    const handleDelete = (project: Project) => {
        modal.confirm({
            title: "确认删除",
            content: `确定删除项目「${project.name}」？此操作不可恢复。`,
            okText: "删除",
            okButtonProps: { danger: true },
            onOk: async () => {
                try {
                    const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" })
                    if (res.ok) {
                        message.success("删除成功")
                        fetchProjects()
                    }
                } catch (e) {
                    console.error("删除失败:", e)
                    message.error("删除失败")
                }
            },
        })
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "延期": return "error"
            case "预警": return "warning"
            case "已完成": return "success"
            case "未开始": return "default"
            default: return "processing"
        }
    }

    const columns: TableProps<Project>["columns"] = [
        {
            title: "项目代号",
            dataIndex: "project_no",
            width: 140,
            render: (text: string) => <span className="font-mono text-xs font-bold text-blue-600">{text}</span>
        },
        {
            title: "项目/产品信息",
            dataIndex: "name",
            render: (_: unknown, record: Project) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-900">{record.name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                        <Tag>{record.product_name}</Tag>
                        <span className="text-[10px] text-slate-400 font-mono">{record.product_code}</span>
                    </div>
                </div>
            )
        },
        {
            title: "负责人",
            dataIndex: "manager",
            width: 100,
            render: (text: string) => (
                <div className="flex items-center gap-2">
                    <UserOutlined className="text-slate-400" />
                    <span className="text-sm font-medium">{text}</span>
                </div>
            )
        },
        {
            title: "创建信息",
            dataIndex: "creator",
            render: (_: unknown, record: Project) => (
                <div className="flex flex-col text-[10px]">
                    <span className="text-slate-500">创建人: {record.creator}</span>
                    <span className="text-slate-400">{record.created_at?.slice(0, 10)}</span>
                </div>
            )
        },
        {
            title: "截止日期",
            dataIndex: "deadline",
            render: (text: string, record: Project) => (
                <div className="flex items-center gap-1.5 text-xs font-medium">
                    <CalendarOutlined className={record.status === '延期' ? 'text-rose-500' : 'text-slate-400'} />
                    <span className={record.status === '延期' ? 'text-rose-600 font-bold' : ''}>{text?.slice(0, 10)}</span>
                </div>
            )
        },
        {
            title: "执行进度",
            dataIndex: "progress",
            width: 150,
            render: (progress: number, record: Project) => (
                <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[10px] font-bold">
                        <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${record.status === "延期" ? "bg-rose-500" :
                                record.status === "预警" ? "bg-amber-500" : "bg-blue-600"
                                }`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )
        },
        {
            title: "状态",
            dataIndex: "status",
            width: 80,
            render: (text: string) => <Tag color={getStatusColor(text)}>{text}</Tag>
        },
        {
            title: "操作",
            key: "action",
            width: 90,
            render: (_: unknown, record: Project) => (
                <div className="flex gap-1">
                    <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} />
                </div>
            )
        },
    ]

    return (
        <div className="p-8 space-y-8 bg-slate-50/30 min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">项目管理</h1>
                    <p className="text-gray-500 mt-1 font-medium">NPI 核心项目台账：支持多维度追踪、负责人指派与状态预警</p>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                    创建新项目
                </Button>
            </div>

            <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <Input
                    placeholder="检索项目代号、名称、负责人..."
                    prefix={<SearchOutlined className="text-gray-400" />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                    variant="filled"
                    allowClear
                />
                <Select
                    value={statusFilter}
                    onChange={setStatusFilter}
                    style={{ width: 140 }}
                    options={[
                        { value: "all", label: "全部状态" },
                        { value: "active", label: "进行中" },
                        { value: "warning", label: "预警中" },
                        { value: "overdue", label: "已延期" },
                        { value: "done", label: "已完成" },
                    ]}
                />
                <Button icon={<FilterOutlined />}>高级筛选</Button>
            </div>

            <Card>
                <Spin spinning={loading}>
                    <Table
                        dataSource={projects}
                        columns={columns}
                        rowKey="id"
                        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
                        expandable={{
                            expandedRowKeys: expandedRows,
                            onExpand: (expanded, record) => {
                                if (expanded) {
                                    setExpandedRows(prev => [...prev, record.id])
                                } else {
                                    setExpandedRows(prev => prev.filter(id => id !== record.id))
                                }
                            },
                            expandedRowRender: (record) => (
                                <div className="grid grid-cols-3 gap-6 p-2">
                                    {(record.tasks || []).map((task, i) => (
                                        <div key={i} className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-col gap-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-slate-700">{task.name}</span>
                                                <Tag>{task.status}</Tag>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px]">
                                                <span className="text-slate-500">负责人: {task.owner}</span>
                                                <span className="font-mono">{task.progress}%</span>
                                            </div>
                                            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-400 rounded-full" style={{ width: `${task.progress}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                    {(record.tasks || []).length === 0 && (
                                        <div className="text-sm text-gray-400 col-span-3 text-center py-4">暂无子任务</div>
                                    )}
                                </div>
                            )
                        }}
                    />
                </Spin>
            </Card>

            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
                <div className="text-sm text-slate-500">
                    共显示 <span className="font-bold text-slate-900">{projects.length}</span> 条项目记录
                </div>
                <div className="flex gap-2">
                    <Button size="small" icon={<FileTextOutlined />} onClick={() => message.success("正在导出项目进度明细...")}>
                        导出明细
                    </Button>
                    <Button size="small" icon={<HistoryOutlined />} onClick={() => message.info("加载历史回溯...")}>
                        进度回溯
                    </Button>
                </div>
            </div>

            {/* 创建/编辑弹窗 */}
            <Modal
                title={editingProject ? "编辑项目" : "初始化 NPI 研发项目"}
                open={isModalOpen}
                onOk={handleSave}
                onCancel={() => setIsModalOpen(false)}
                okText={editingProject ? "保存" : "提交创建"}
                cancelText="取消"
                confirmLoading={saving}
                width={650}
            >
                <p className="text-gray-400 text-sm mb-4">请填写项目基本信息及各环节业务负责人。</p>
                <div className="grid gap-6 py-4 border-y border-slate-100 my-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="text-sm font-bold">项目名称 <span className="text-red-500">*</span></div>
                            <Input
                                placeholder="输入项目完整名称"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="text-sm font-bold">项目代号 <span className="text-red-500">*</span></div>
                            <Input
                                placeholder="NPI-2025-XXX"
                                value={form.projectNo}
                                onChange={(e) => setForm({ ...form, projectNo: e.target.value })}
                                disabled={!!editingProject}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="text-sm font-bold">产品名称</div>
                            <Input
                                placeholder="关联产品名"
                                value={form.productName}
                                onChange={(e) => setForm({ ...form, productName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="text-sm font-bold">产品代号</div>
                            <Input
                                placeholder="MC-S-003"
                                value={form.productCode}
                                onChange={(e) => setForm({ ...form, productCode: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <div className="text-sm font-bold">负责人</div>
                            <Input
                                placeholder="项目负责人"
                                value={form.manager}
                                onChange={(e) => setForm({ ...form, manager: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="text-sm font-bold">创建人</div>
                            <Input
                                placeholder="创建人姓名"
                                value={form.creator}
                                onChange={(e) => setForm({ ...form, creator: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="text-sm font-bold">截止日期</div>
                            <DatePicker
                                style={{ width: "100%" }}
                                value={form.deadline ? dayjs(form.deadline) : null}
                                onChange={(date) => setForm({ ...form, deadline: date ? date.format("YYYY-MM-DD") : "" })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <div className="text-sm font-bold">状态</div>
                            <Select
                                style={{ width: "100%" }}
                                value={form.status}
                                onChange={(v) => setForm({ ...form, status: v })}
                                options={[
                                    { value: "未开始", label: "未开始" },
                                    { value: "进行中", label: "进行中" },
                                    { value: "预警", label: "预警" },
                                    { value: "延期", label: "延期" },
                                    { value: "已完成", label: "已完成" },
                                ]}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="text-sm font-bold">进度（%）</div>
                            <Input
                                type="number"
                                min={0}
                                max={100}
                                value={form.progress}
                                onChange={(e) => setForm({ ...form, progress: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="text-sm font-bold">风险等级</div>
                            <Select
                                style={{ width: "100%" }}
                                value={form.risk}
                                onChange={(v) => setForm({ ...form, risk: v })}
                                options={[
                                    { value: "低", label: "低" },
                                    { value: "中", label: "中" },
                                    { value: "高", label: "高" },
                                ]}
                            />
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
