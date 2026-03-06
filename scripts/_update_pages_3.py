# -*- coding: utf-8 -*-
import os
base = "/Users/wangpeng/Downloads/cisheng/src/app"

# ==================== dfm/page.tsx ====================
dfm = r'''"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
    SettingOutlined, BranchesOutlined, WarningOutlined, ToolOutlined,
    FileDoneOutlined, PlusOutlined, RiseOutlined, ExperimentOutlined,
} from "@ant-design/icons"
import { Button, Tag, Card, Tabs, Table, Modal, Input, App, Spin } from "antd"
import type { TableProps } from "antd"

interface ProcessStep { id: number; step_no: string; name: string; params: string; status: string }
interface RiskRow { id: number; op: string; mode: string; effect: string; measure: string; sod: string; status: string }
interface Prototype { id: number; batch_no: string; qty: string; result: string; date: string }

export default function DFMPage() {
    const [steps, setSteps] = useState<ProcessStep[]>([])
    const [risks, setRisks] = useState<RiskRow[]>([])
    const [prototypes, setPrototypes] = useState<Prototype[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const { message } = App.useApp()

    useEffect(() => {
        Promise.all([
            fetch("/api/process-steps").then(r => r.json()),
            fetch("/api/pfmea-risks").then(r => r.json()),
            fetch("/api/prototypes").then(r => r.json()),
        ]).then(([s, r, p]) => {
            setSteps(s); setRisks(r); setPrototypes(p)
        }).catch(() => message.error("加载数据失败"))
        .finally(() => setLoading(false))
    }, [])

    const toggleRiskStatus = async (record: RiskRow) => {
        const newStatus = record.status === "已改进" ? "追踪中" : "已改进"
        await fetch("/api/pfmea-risks", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: record.id, status: newStatus }),
        })
        setRisks(prev => prev.map(r => r.id === record.id ? { ...r, status: newStatus } : r))
        message.info(`风险条目状态已更新为：${newStatus}`)
    }

    const riskColumns: TableProps<RiskRow>["columns"] = [
        { title: "工序", dataIndex: "op", render: (t: string) => <span className="font-medium text-sm">{t}</span> },
        { title: "潜在失效模式", dataIndex: "mode" },
        { title: "失效影响", dataIndex: "effect", render: (t: string) => <span className="text-xs text-gray-400">{t}</span> },
        { title: "预防/探测措施", dataIndex: "measure", render: (t: string) => <span className="text-xs text-gray-400 italic">{t}</span> },
        { title: "SOD (风险评分)", dataIndex: "sod", align: "center", render: (t: string) => <Tag color="warning" className="font-mono">{t}</Tag> },
        {
            title: "状态", dataIndex: "status", render: (t: string, record: RiskRow) => (
                <Tag
                    color={t === "已改进" ? "success" : "warning"}
                    className="cursor-pointer"
                    onClick={() => toggleRiskStatus(record)}
                >
                    {t}
                </Tag>
            )
        },
    ]

    const tabItems = [
        {
            key: "workflow",
            label: <span className="flex items-center gap-2"><BranchesOutlined />工艺路线设计</span>,
            children: (
                <div className="grid gap-6 md:grid-cols-4">
                    <Card className="md:col-span-3" title="工艺路线 A-2 (优化版)">
                        <p className="text-gray-400 text-xs mb-6">当前产品: 新款磁体单元 Gen3</p>
                        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                            {steps.map((s, i) => (
                                <div key={s.id} className="relative flex items-start gap-6 pl-2">
                                    <div className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border shadow-sm z-10 ${s.status === "completed" ? "bg-emerald-500 border-emerald-500 text-white" :
                                        s.status === "in-progress" ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-300 text-gray-400"
                                        }`}>
                                        {s.status === "completed" ? <FileDoneOutlined style={{ fontSize: 12 }} /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                                    </div>
                                    <div className="flex-1 rounded-xl p-4 border border-gray-200 bg-slate-50 hover:border-blue-300 transition-colors shadow-sm">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-mono font-semibold text-slate-500">{s.step_no}</span>
                                            <Tag color={s.status === "completed" ? "success" : "default"}>{s.status}</Tag>
                                        </div>
                                        <h4 className="font-bold text-slate-900">{s.name}</h4>
                                        <p className="text-xs text-slate-600 mt-1">关键参数: {s.params}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                    <Card title={<span className="flex items-center gap-2 text-blue-600"><SettingOutlined />工序配置助手</span>}>
                        <div className="space-y-4">
                            <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                                <p className="text-xs text-blue-700">基于磁体单元 R&D 规范：建议步骤 30 关联 AI 尺寸自动监测量具，以降低人工操作误差。</p>
                            </div>
                            <Button block size="small">从标准库同步参数</Button>
                            <Button block size="small">调整工序顺序</Button>
                        </div>
                    </Card>
                </div>
            )
        },
        {
            key: "risk",
            label: <span className="flex items-center gap-2"><WarningOutlined />风险评估 (PFMEA)</span>,
            children: (
                <Card>
                    <Table dataSource={risks} columns={riskColumns} rowKey="id" pagination={false} />
                </Card>
            )
        },
        {
            key: "prototype",
            label: <span className="flex items-center gap-2"><ExperimentOutlined />打样与验证</span>,
            children: (
                <div className="grid gap-6 md:grid-cols-2">
                    <Card title="夹具设计 (Fixtures)" extra={<Button type="link" size="small">查看 3D</Button>}>
                        <div className="aspect-video rounded-xl bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-200 mb-4 relative">
                            <ToolOutlined style={{ fontSize: 48 }} className="text-gray-200" />
                            <span className="text-xs text-gray-400 absolute bottom-4">Jig-Magnet-301.STL 加载中...</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-lg border">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">精密装配夹具 V1.2</span>
                                <span className="text-[10px] text-gray-400">最后更新: 2025-12-22</span>
                            </div>
                            <Tag color="success" className="cursor-pointer" onClick={() => message.info("Jig-Magnet-301.STL 设计锁定")}>设计完成</Tag>
                        </div>
                    </Card>
                    <Card title="打样进度与评审">
                        <p className="text-gray-400 text-xs mb-4">最近打样批次情况</p>
                        <div className="space-y-4">
                            {prototypes.map((b) => (
                                <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center font-bold text-white text-xs shadow-sm">P</div>
                                        <div className="grid gap-0.5">
                                            <span className="text-sm font-bold text-slate-800">{b.batch_no}</span>
                                            <span className="text-[10px] text-slate-500 font-medium">{b.qty} / {b.date}</span>
                                        </div>
                                    </div>
                                    <Tag color={b.result === "待评审" ? "default" : "processing"}>{b.result}</Tag>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )
        },
        {
            key: "grr",
            label: <span className="flex items-center gap-2"><RiseOutlined />GRR/CRR 验证</span>,
            children: (
                <Card className="flex items-center justify-center h-96 text-gray-400 text-sm italic">
                    GRR 仪表盘加载中，正在连接量具数据采集系统...
                </Card>
            )
        },
    ]

    if (loading) return <div className="flex items-center justify-center h-96"><Spin size="large" /></div>

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">DFM 策划</h1>
                    <p className="text-gray-500 mt-1">面向制造的设计同步、PFMEA 风险识别与打样验证流程</p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={() => message.info("报告上传功能已就绪")}>上传 DFM 报告</Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>发起评审</Button>
                </div>
            </div>
            <Tabs defaultActiveKey="workflow" items={tabItems} />
            <Modal title="发起 DFM 专家评审" open={isModalOpen}
                onOk={() => { message.success("评审已发起"); setIsModalOpen(false) }}
                onCancel={() => setIsModalOpen(false)} okText="确认发起">
                <p className="text-gray-400 text-sm mb-4">选择参与评审的跨部门专家，并设定评审截止时间。</p>
                <div className="grid gap-4 py-2">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="text-right text-sm font-bold">评审专家</span>
                        <Input className="col-span-3" placeholder="例如：工艺部、模具部、质量部" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="text-right text-sm font-bold">截止日期</span>
                        <Input className="col-span-3" type="date" />
                    </div>
                </div>
            </Modal>
        </div>
    )
}
'''

with open(os.path.join(base, "dfm", "page.tsx"), "w", encoding="utf-8") as f:
    f.write(dfm)
print("OK: dfm/page.tsx")

# ==================== drawing-review-ai/page.tsx ====================
ai_review = r'''"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
    Card, Button, Upload, Table, Tag, Collapse, Statistic, Spin, Modal, Tabs, App, Empty, Tooltip,
} from "antd"
import type { UploadFile } from "antd"
import {
    CloudUploadOutlined, FileSearchOutlined, CheckCircleOutlined, WarningOutlined,
    CloseCircleOutlined, InfoCircleOutlined, HistoryOutlined, DeleteOutlined,
    EyeOutlined, FilePdfOutlined, FileImageOutlined, RobotOutlined, ReloadOutlined,
} from "@ant-design/icons"

interface ReviewIssue { id: number; severity: "critical" | "warning" | "info"; category: string; title: string; description: string; suggestion: string }
interface ReviewSummary { total_issues: number; critical: number; warning: number; info: number; conclusion: string }
interface ReviewTask { task_id: string; drawing_name: string; file_url: string; file_type: "pdf" | "image"; status: "completed" | "processing" | "failed"; created_at: string; duration_seconds: number; summary: ReviewSummary; issues: ReviewIssue[] }

const severityConfig = {
    critical: { color: "#ff4d4f", tag: "red", label: "严重", icon: <CloseCircleOutlined /> },
    warning: { color: "#faad14", tag: "orange", label: "警告", icon: <WarningOutlined /> },
    info: { color: "#52c41a", tag: "green", label: "建议", icon: <InfoCircleOutlined /> },
}

function formatTime(iso: string) {
    return new Date(iso).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
}

type PageState = "idle" | "analyzing" | "result" | "history"

export default function DrawingReviewAIPage() {
    const { message, modal } = App.useApp()
    const [pageState, setPageState] = useState<PageState>("idle")
    const [currentTask, setCurrentTask] = useState<ReviewTask | null>(null)
    const [tasks, setTasks] = useState<ReviewTask[]>([])
    const [activeTab, setActiveTab] = useState("review")
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch("/api/ai-reviews").then(r => r.json())
            .then((data) => {
                const mapped = data.map((t: any) => ({
                    task_id: String(t.id),
                    drawing_name: t.drawing_name,
                    file_url: t.file_url || "",
                    file_type: t.file_type || "pdf",
                    status: t.status,
                    created_at: t.created_at,
                    duration_seconds: t.duration_seconds || 0,
                    summary: {
                        total_issues: t.total_issues || 0,
                        critical: t.critical_count || 0,
                        warning: t.warning_count || 0,
                        info: t.info_count || 0,
                        conclusion: t.conclusion || "",
                    },
                    issues: (t.issues || []).map((i: any) => ({
                        id: i.id,
                        severity: i.severity,
                        category: i.category,
                        title: i.title,
                        description: i.description,
                        suggestion: i.suggestion,
                    })),
                }))
                setTasks(mapped)
            })
            .catch(() => message.error("加载历史记录失败"))
            .finally(() => setLoading(false))
    }, [])

    const handleUpload = async (file: UploadFile) => {
        const fileName = file.name || "未命名图纸"
        const isImage = /\.(png|jpg|jpeg|bmp|tiff)$/i.test(fileName)
        message.loading({ content: "正在上传图纸...", key: "upload", duration: 1 })
        setPageState("analyzing")
        setActiveTab("review")

        try {
            const res = await fetch("/api/ai-reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ drawing_name: fileName.replace(/\.[^.]+$/, ""), file_type: isImage ? "image" : "pdf" }),
            })
            const data = await res.json()
            // Fetch full task with issues
            const taskRes = await fetch(`/api/ai-reviews/${data.task_id}`)
            const fullTask = await taskRes.json()
            const mapped: ReviewTask = {
                task_id: String(fullTask.id),
                drawing_name: fullTask.drawing_name,
                file_url: fullTask.file_url || "",
                file_type: fullTask.file_type || "pdf",
                status: fullTask.status,
                created_at: fullTask.created_at,
                duration_seconds: fullTask.duration_seconds || 0,
                summary: {
                    total_issues: fullTask.total_issues || 0,
                    critical: fullTask.critical_count || 0,
                    warning: fullTask.warning_count || 0,
                    info: fullTask.info_count || 0,
                    conclusion: fullTask.conclusion || "",
                },
                issues: (fullTask.issues || []).map((i: any) => ({
                    id: i.id, severity: i.severity, category: i.category, title: i.title,
                    description: i.description, suggestion: i.suggestion,
                })),
            }
            setCurrentTask(mapped)
            setTasks(prev => [mapped, ...prev])
            setPageState("result")
            message.success({ content: "AI 审查完成！", key: "upload" })
        } catch {
            setPageState("idle")
            message.error({ content: "分析失败，请重试", key: "upload" })
        }
        return false
    }

    const handleViewTask = (task: ReviewTask) => { setCurrentTask(task); setPageState("result"); setActiveTab("review") }

    const handleDelete = (taskId: string) => {
        modal.confirm({
            title: "确认删除", content: "删除后不可恢复，确定继续？",
            onOk: async () => {
                await fetch(`/api/ai-reviews/${taskId}`, { method: "DELETE" })
                setTasks(prev => prev.filter(t => t.task_id !== taskId))
                if (currentTask?.task_id === taskId) { setCurrentTask(null); setPageState("idle") }
                message.success("已删除")
            },
        })
    }

    const handleNewReview = () => { setCurrentTask(null); setPageState("idle"); setActiveTab("review") }

    const renderUploadArea = () => (
        <div className="flex items-center justify-center" style={{ minHeight: 500 }}>
            <div style={{ maxWidth: 520, width: "100%" }}>
                <div className="text-center mb-8">
                    <RobotOutlined style={{ fontSize: 56, color: "#2563eb", opacity: 0.8 }} />
                    <h2 className="text-xl font-semibold mt-4 mb-2">AI 智能图纸审查</h2>
                    <p className="text-gray-400 text-sm">上传工程图纸，AI 自动检测尺寸标注、公差、基准等问题</p>
                </div>
                <Upload.Dragger accept=".pdf,.png,.jpg,.jpeg,.bmp,.tiff" showUploadList={false}
                    beforeUpload={(file) => handleUpload(file as unknown as UploadFile)}
                    style={{ padding: "40px 20px", borderRadius: 12, borderColor: "#d9d9d9" }}>
                    <p className="mb-3"><CloudUploadOutlined style={{ fontSize: 40, color: "#2563eb" }} /></p>
                    <p className="text-base font-medium">拖拽图纸到此处，或点击上传</p>
                    <p className="text-gray-400 text-sm mt-2">支持 PDF / PNG / JPG / BMP / TIFF</p>
                </Upload.Dragger>
                {tasks.length > 0 && (
                    <div className="mt-6 text-center">
                        <Button type="link" icon={<HistoryOutlined />} onClick={() => setActiveTab("history")}>
                            查看 {tasks.length} 条历史审查记录
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )

    const renderAnalyzing = () => (
        <div className="flex flex-col items-center justify-center" style={{ minHeight: 500 }}>
            <Spin size="large" />
            <div className="mt-6 text-center">
                <h3 className="text-lg font-medium mb-2">AI 正在分析图纸...</h3>
                <p className="text-gray-400 text-sm">正在识别尺寸标注、检查公差标准、验证基准规范</p>
            </div>
        </div>
    )

    const renderResult = () => {
        if (!currentTask) return null
        const { summary, issues } = currentTask
        const grouped = {
            critical: issues.filter(i => i.severity === "critical"),
            warning: issues.filter(i => i.severity === "warning"),
            info: issues.filter(i => i.severity === "info"),
        }
        return (
            <div className="flex gap-6" style={{ minHeight: 500 }}>
                <div className="flex-[3]">
                    <Card size="small" title={
                        <span className="flex items-center gap-2">
                            {currentTask.file_type === "pdf" ? <FilePdfOutlined style={{ color: "#ff4d4f" }} /> : <FileImageOutlined style={{ color: "#1890ff" }} />}
                            {currentTask.drawing_name}
                        </span>
                    } style={{ height: "100%" }}>
                        <div className="flex items-center justify-center rounded-lg" style={{ minHeight: 420, background: "linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)" }}>
                            <div className="text-center text-gray-400">
                                <FileSearchOutlined style={{ fontSize: 48, opacity: 0.3 }} />
                                <p className="mt-3 text-sm">图纸预览区</p>
                            </div>
                        </div>
                    </Card>
                </div>
                <div className="flex-[2] flex flex-col gap-4">
                    <div className="grid grid-cols-4 gap-3">
                        <Card size="small" style={{ textAlign: "center" }}><Statistic title={<span className="text-xs">总问题</span>} value={summary.total_issues} valueStyle={{ fontSize: 24, fontWeight: 700 }} /></Card>
                        <Card size="small" style={{ textAlign: "center" }}><Statistic title={<span className="text-xs">严重</span>} value={summary.critical} valueStyle={{ fontSize: 24, fontWeight: 700, color: "#ff4d4f" }} /></Card>
                        <Card size="small" style={{ textAlign: "center" }}><Statistic title={<span className="text-xs">警告</span>} value={summary.warning} valueStyle={{ fontSize: 24, fontWeight: 700, color: "#faad14" }} /></Card>
                        <Card size="small" style={{ textAlign: "center" }}><Statistic title={<span className="text-xs">建议</span>} value={summary.info} valueStyle={{ fontSize: 24, fontWeight: 700, color: "#52c41a" }} /></Card>
                    </div>
                    <Card size="small">
                        <div className="flex items-start gap-2">
                            <RobotOutlined style={{ color: "#2563eb", marginTop: 3 }} />
                            <div>
                                <div className="text-xs text-gray-400 mb-1">AI 审查结论</div>
                                <div className="text-sm font-medium">{summary.conclusion}</div>
                            </div>
                        </div>
                    </Card>
                    <Card size="small" title="问题详情" style={{ flex: 1, overflow: "auto" }} styles={{ body: { padding: "8px 12px", maxHeight: 300, overflowY: "auto" } }}>
                        {issues.length === 0 ? (
                            <Empty description="未发现问题，图纸质量优秀！" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        ) : (
                            <Collapse size="small" accordion defaultActiveKey={issues[0]?.id}
                                items={(["critical", "warning", "info"] as const)
                                    .filter(sev => grouped[sev].length > 0)
                                    .flatMap(sev => grouped[sev].map(issue => ({
                                        key: issue.id,
                                        label: (
                                            <div className="flex items-center gap-2">
                                                <Tag color={severityConfig[issue.severity].tag} style={{ margin: 0, fontSize: 11 }}>{severityConfig[issue.severity].label}</Tag>
                                                <span className="text-xs text-gray-400">{issue.category}</span>
                                                <span className="text-sm">{issue.title}</span>
                                            </div>
                                        ),
                                        children: (
                                            <div className="space-y-2 text-sm">
                                                <div><span className="font-medium text-gray-500">问题：</span>{issue.description}</div>
                                                <div className="bg-blue-50 rounded-lg p-2 text-blue-700"><span className="font-medium">建议：</span>{issue.suggestion}</div>
                                            </div>
                                        ),
                                    })))
                                }
                            />
                        )}
                    </Card>
                </div>
            </div>
        )
    }

    const renderHistory = () => (
        <Table dataSource={tasks} rowKey="task_id" size="small" pagination={{ pageSize: 10 }}
            columns={[
                { title: "图纸名称", dataIndex: "drawing_name", key: "name", render: (name: string, record: ReviewTask) => (
                    <span className="flex items-center gap-2">
                        {record.file_type === "pdf" ? <FilePdfOutlined style={{ color: "#ff4d4f" }} /> : <FileImageOutlined style={{ color: "#1890ff" }} />}
                        {name}
                    </span>
                )},
                { title: "时间", dataIndex: "created_at", key: "time", width: 120, render: (t: string) => formatTime(t) },
                { title: "耗时", dataIndex: "duration_seconds", key: "duration", width: 70, render: (s: number) => `${s}s` },
                { title: "问题", key: "issues", width: 180, render: (_: unknown, record: ReviewTask) => {
                    const { critical, warning, info } = record.summary
                    return (<span className="flex gap-1">
                        {critical > 0 && <Tag color="red">{critical} 严重</Tag>}
                        {warning > 0 && <Tag color="orange">{warning} 警告</Tag>}
                        {info > 0 && <Tag color="green">{info} 建议</Tag>}
                    </span>)
                }},
                { title: "结论", dataIndex: ["summary", "conclusion"], key: "conclusion", ellipsis: true },
                { title: "操作", key: "action", width: 100, render: (_: unknown, record: ReviewTask) => (
                    <span className="flex gap-1">
                        <Tooltip title="查看报告"><Button type="text" size="small" icon={<EyeOutlined />} onClick={() => handleViewTask(record)} /></Tooltip>
                        <Tooltip title="删除"><Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.task_id)} /></Tooltip>
                    </span>
                )},
            ]}
        />
    )

    if (loading) return <div className="flex items-center justify-center h-96"><Spin size="large" /></div>

    return (
        <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2"><RobotOutlined style={{ color: "#2563eb" }} />AI 智能评审</h1>
                    <p className="text-gray-400 text-sm mt-1">上传工程图纸，AI 自动审查尺寸标注、公差、基准等问题</p>
                </div>
                <div className="flex gap-2">
                    {pageState === "result" && <Button icon={<ReloadOutlined />} onClick={handleNewReview}>新建审查</Button>}
                </div>
            </div>
            <Tabs activeKey={activeTab} onChange={(k) => { setActiveTab(k); if (k === "review" && !currentTask) setPageState("idle") }}
                items={[
                    { key: "review", label: <span className="flex items-center gap-1"><FileSearchOutlined />智能审查</span>,
                      children: (<div>{pageState === "idle" && renderUploadArea()}{pageState === "analyzing" && renderAnalyzing()}{pageState === "result" && renderResult()}</div>) },
                    { key: "history", label: <span className="flex items-center gap-1"><HistoryOutlined />历史记录{tasks.length > 0 && <Tag style={{ marginLeft: 4, fontSize: 11 }}>{tasks.length}</Tag>}</span>,
                      children: renderHistory() },
                ]}
            />
        </div>
    )
}
'''

with open(os.path.join(base, "drawing-review-ai", "page.tsx"), "w", encoding="utf-8") as f:
    f.write(ai_review)
print("OK: drawing-review-ai/page.tsx")

# ==================== users/page.tsx ====================
users = r'''"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
    UserOutlined, CalendarOutlined, ClockCircleOutlined, MailOutlined,
    BellOutlined, RightOutlined, TrophyOutlined, ThunderboltOutlined,
    LogoutOutlined, EditOutlined, BookOutlined, SearchOutlined,
} from "@ant-design/icons"
import { Button, Tag, Card, Tabs, Avatar, Modal, Input, App, Spin } from "antd"

interface UserProfile {
    id: number; user_name: string; display_name: string; email: string; role: string;
    avatar_url: string; joined_at: string; last_login: string;
    total_reviews: number; active_projects: number;
}
interface Activity { id: number; time_label: string; content: string }
interface Notification { id: number; type: string; content: string; time_label: string; status: string; color: string }
interface WatchedProject { id: number; project_name: string }

export default function UserCenterPage() {
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [activities, setActivities] = useState<Activity[]>([])
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [watchedProjects, setWatchedProjects] = useState<WatchedProject[]>([])
    const [notifSearch, setNotifSearch] = useState("")
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const { message } = App.useApp()

    useEffect(() => {
        fetch("/api/user-profile").then(r => r.json())
            .then((data) => {
                setProfile(data.profile)
                setActivities(data.activities || [])
                setNotifications(data.notifications || [])
                setWatchedProjects(data.watched_projects || [])
            })
            .catch(() => message.error("加载用户数据失败"))
            .finally(() => setLoading(false))
    }, [])

    const filteredNotifs = notifications.filter(n =>
        n.content.toLowerCase().includes(notifSearch.toLowerCase()) ||
        n.type.toLowerCase().includes(notifSearch.toLowerCase())
    )

    const clearAllRead = async () => {
        await fetch("/api/notifications", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "clearRead" }) })
        setNotifications(prev => prev.filter(n => n.status === "unread"))
        message.success("已清理所有已读通知")
    }

    const markAsRead = async (id: number) => {
        await fetch("/api/notifications", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "markRead", id }) })
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: "read" } : n))
    }

    const colorMap: Record<string, string> = {
        "审批": "text-blue-500 bg-blue-50",
        "预警": "text-rose-500 bg-rose-50",
        "任务": "text-amber-500 bg-amber-50",
        "系统": "text-gray-500 bg-gray-50",
    }

    const tabItems = [
        {
            key: "activity",
            label: <span className="flex items-center gap-2"><ThunderboltOutlined />动态轨迹</span>,
            children: (
                <div className="space-y-8 pl-4 border-l border-gray-200 mt-4">
                    {activities.map((a) => (
                        <div key={a.id} className="relative pb-2">
                            <div className="absolute -left-[21px] top-1.5 h-3 w-3 rounded-full bg-blue-600 border-2 border-white shadow-sm" />
                            <span className="text-[10px] text-gray-400 font-mono">{a.time_label}</span>
                            <p className="text-sm mt-1.5 font-medium leading-relaxed">{a.content}</p>
                        </div>
                    ))}
                </div>
            )
        },
        {
            key: "notifications",
            label: <span className="flex items-center gap-2"><BellOutlined />消息中心</span>,
            children: (
                <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-6 bg-slate-50 p-2 rounded-lg">
                        <SearchOutlined className="text-gray-400 ml-2" />
                        <Input placeholder="搜索通知内容..." variant="borderless" value={notifSearch} onChange={(e) => setNotifSearch(e.target.value)} />
                        <Button type="text" size="small" onClick={clearAllRead}>一键标为已读</Button>
                    </div>
                    {filteredNotifs.map((n) => (
                        <div key={n.id} className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors group relative cursor-pointer"
                            onClick={() => markAsRead(n.id)}>
                            <div className={`mt-1 p-2 rounded-lg ${colorMap[n.type] || "text-gray-500 bg-gray-50"}`}>
                                <BellOutlined />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <Tag>{n.type}</Tag>
                                    <span className="text-[10px] text-gray-400">{n.time_label}</span>
                                </div>
                                <p className={`text-sm ${n.status === "unread" ? "font-bold text-slate-900" : "text-slate-600"}`}>{n.content}</p>
                            </div>
                            {n.status === "unread" && <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-blue-500 ring-4 ring-white" />}
                        </div>
                    ))}
                </div>
            )
        }
    ]

    if (loading || !profile) return <div className="flex items-center justify-center h-96"><Spin size="large" /></div>

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-8 rounded-2xl bg-blue-50/50 border border-blue-100 relative overflow-hidden">
                <div className="flex items-center gap-6 z-10">
                    <Avatar size={96} src={profile.avatar_url || undefined} className="border-4 border-white shadow-xl">{profile.display_name?.[0]}</Avatar>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">{profile.display_name}</h1>
                            <Tag color="processing">{profile.role}</Tag>
                        </div>
                        <p className="text-gray-500 flex items-center gap-2"><MailOutlined /> {profile.email}</p>
                        <div className="flex items-center gap-4 pt-1">
                            <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium"><CalendarOutlined /> 入职: {profile.joined_at}</div>
                            <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium"><ClockCircleOutlined /> 最近登录: {profile.last_login}</div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 z-10">
                    <Button icon={<EditOutlined />} onClick={() => setIsEditModalOpen(true)}>编辑资料</Button>
                    <Button danger type="text" icon={<LogoutOutlined />} onClick={() => message.warning("确定要登出系统吗？")}>退出登录</Button>
                </div>
                <div className="absolute -right-16 -top-16 h-64 w-64 bg-blue-100/50 rounded-full blur-3xl" />
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                <div className="space-y-8">
                    <Card title={<span className="flex items-center gap-2 text-blue-600"><TrophyOutlined />评审成就</span>}>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-gray-50 border text-center">
                                <span className="text-2xl font-bold">{profile.total_reviews}</span>
                                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">累计审核</p>
                            </div>
                            <div className="p-4 rounded-xl bg-gray-50 border text-center">
                                <span className="text-2xl font-bold">{profile.active_projects}</span>
                                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">进行中项目</p>
                            </div>
                        </div>
                    </Card>
                    <Card title={<span className="flex items-center gap-2"><BookOutlined />我的关注</span>}>
                        <div className="space-y-3">
                            {watchedProjects.map((p) => (
                                <div key={p.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer group">
                                    <span className="text-sm font-medium">{p.project_name}</span>
                                    <RightOutlined className="text-gray-400 opacity-0 group-hover:opacity-100 transition-all" />
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Tabs defaultActiveKey="activity" items={tabItems} />
                </div>
            </div>

            <Modal title="编辑个人资料" open={isEditModalOpen}
                onOk={() => { message.success("个人资料已更新"); setIsEditModalOpen(false) }}
                onCancel={() => setIsEditModalOpen(false)} okText="保存更改">
                <p className="text-gray-400 text-sm mb-4">修改您的头像、职位信息或联系方式。</p>
                <div className="grid gap-4 py-2">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="text-right text-sm">职位</span>
                        <Input className="col-span-3" defaultValue={profile.role} />
                    </div>
                </div>
            </Modal>
        </div>
    )
}
'''

with open(os.path.join(base, "users", "page.tsx"), "w", encoding="utf-8") as f:
    f.write(users)
print("OK: users/page.tsx")
