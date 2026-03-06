"use client"

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
