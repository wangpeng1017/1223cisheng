"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import {
    ProjectOutlined, FileSearchOutlined, RobotOutlined, FilePdfOutlined,
    CheckCircleOutlined, PlusOutlined, WarningOutlined, CloseCircleOutlined,
    InfoCircleOutlined, UploadOutlined, InboxOutlined, TeamOutlined,
    DeleteOutlined, SearchOutlined, ThunderboltOutlined, DownloadOutlined,
    SendOutlined, LoadingOutlined, SafetyCertificateOutlined, EditOutlined,
    EyeOutlined, HistoryOutlined, ExperimentOutlined, BulbOutlined,
    LinkOutlined, SaveOutlined, SwapOutlined, FileAddOutlined,
} from "@ant-design/icons"
import {
    Button, Tag, Card, Tabs, Table, Input, App, Steps, Form,
    Select, Upload, Divider, Statistic, Progress, Modal, Tooltip, Checkbox,
    Badge, Space, Descriptions, Timeline, Row, Col, Alert, Popconfirm, DatePicker,
} from "antd"
import type { TableProps } from "antd"

const { TextArea } = Input

// ========== 类型定义 ==========
interface DRIssue {
    seqNo: number; pptPage: string; faiSpc: string; category: string
    description: string; drawingSpec: string; suggestion: string; pdOpinion: string
    severity: "critical" | "major" | "minor"
}
interface ProjectInfo {
    projectName: string; productName: string; partNumber: string; customer: string
    reviewer: string; reviewDate: string; drawingVersion: string
}
interface ComparisonMismatch {
    dim_3d: string; value_3d: number; value_2d: number; difference: number
    severity: string; description: string; suggestion: string; is_fai: boolean
}
interface ComparisonResult {
    summary: { total_3d_measurements: number; total_2d_dimensions: number; matched: number; mismatched: number; conclusion: string; status: string }
    matches: { dim_3d: string; value_3d: number; value_2d: number; difference: number }[]
    mismatches: ComparisonMismatch[]
    bounding_box: { x_size: number; y_size: number; z_size: number }
    files: { pdf: string; stp: string }
}

// ========== Mock 数据 ==========
const MOCK_PROJECT: ProjectInfo = {
    projectName: "J510", productName: "Mono Magnet Assembly",
    partNumber: "160-06025-91 Rev.B", customer: "Apple",
    reviewer: "王工 / 李工", reviewDate: "2026/03/04", drawingVersion: "Rev.B",
}

const INITIAL_ISSUES: DRIssue[] = [
    { seqNo: 1, pptPage: "P3", faiSpc: "FAI-01 / SPC-A", category: "尺寸公差",
      description: "磁体底座厚度公差 2.00±0.05mm 超出制造能力，实际 CPK < 1.33，建议放宽至 ±0.08mm",
      drawingSpec: "2.00±0.05mm", suggestion: "建议将公差调整为 2.00±0.08mm，参考历史项目 J480 同类磁体的公差范围，可保证 CPK > 1.67",
      pdOpinion: "待确认", severity: "critical" },
    { seqNo: 2, pptPage: "P5", faiSpc: "FAI-03", category: "基准选择",
      description: "Datum A 选择了非功能面（顶面），可能导致测量基准与装配基准不一致",
      drawingSpec: "Datum A: 顶面", suggestion: "建议将 Datum A 改为底面（主安装面），与装配基准一致，减少装配偏差累积",
      pdOpinion: "待确认", severity: "critical" },
    { seqNo: 3, pptPage: "P4", faiSpc: "FAI-02 / SPC-B", category: "尺寸标注",
      description: "外壳宽度标注 8.50±0.10mm，与装配间隙要求冲突，可能导致装配干涉",
      drawingSpec: "8.50±0.10mm", suggestion: "建议调整为 8.50±0.05mm 或与配合件协调公差分配，确保最大实体条件下间隙 ≥ 0.02mm",
      pdOpinion: "", severity: "major" },
    { seqNo: 4, pptPage: "P6", faiSpc: "FAI-05", category: "表面粗糙度",
      description: "关键配合面粗糙度要求 Ra0.8 未标注，可能影响磁路气隙一致性",
      drawingSpec: "未标注", suggestion: "建议在磁体接触面标注 Ra0.8，在非功能面标注 Ra3.2",
      pdOpinion: "", severity: "major" },
    { seqNo: 5, pptPage: "P3", faiSpc: "SPC-C", category: "标注规范",
      description: "多处尺寸标注线交叉重叠，影响图纸可读性",
      drawingSpec: "-", suggestion: "重新排列标注线，避免交叉，按 Apple 标注规范调整布局",
      pdOpinion: "", severity: "minor" },
]

const HISTORY_ISSUES = [
    { id: "H-001", project: "J480", category: "尺寸公差", description: "磁体厚度公差过严导致良率下降", resolution: "放宽至 ±0.08mm 后 CPK 提升至 1.85", date: "2025-08" },
    { id: "H-002", project: "J490", category: "基准选择", description: "Datum 选择非功能面导致装配偏差", resolution: "改为主安装面后装配合格率从 92% 提升至 99%", date: "2025-10" },
    { id: "H-003", project: "J480", category: "表面粗糙度", description: "磁体接触面粗糙度未定义", resolution: "增加 Ra0.8 要求，磁路性能一致性提升 15%", date: "2025-07" },
    { id: "H-004", project: "J460", category: "尺寸公差", description: "注塑件壁厚公差设计不合理", resolution: "参考模流分析结果调整公差分配", date: "2025-03" },
    { id: "H-005", project: "B747", category: "尺寸标注", description: "磁体外形尺寸过约束标注", resolution: "删除冗余尺寸，保留功能尺寸链", date: "2025-11" },
]

const AI_SUGGESTIONS = [
    { type: "critical" as const, title: "厚度公差超出制造能力", detail: "OCR 识别图纸标注 2.00±0.05mm，对比标准库数据，该类磁体推荐公差范围为 ±0.08~±0.10mm。", ocrValue: "2.00±0.05", stdValue: "2.00±0.08~0.10", confidence: 95, historyRef: "J480 曾有相同问题" },
    { type: "critical" as const, title: "基准面选择不当", detail: "检测到 Datum A 设置在非主要装配面上，与零部件标准库中 85% 的同类产品不一致。", ocrValue: "Datum A: 顶面", stdValue: "Datum A: 底面(主安装面)", confidence: 88, historyRef: "J490 已验证修复" },
    { type: "major" as const, title: "装配间隙风险", detail: "对比配合件图纸，在最大实体条件下间隙仅 0.01mm，存在干涉风险。", ocrValue: "8.50±0.10", stdValue: "8.50±0.05", confidence: 82, historyRef: "" },
    { type: "minor" as const, title: "表面粗糙度缺失", detail: "关键功能面未标注粗糙度要求，标准库建议 Ra0.8（磁体接触面）和 Ra3.2（非功能面）。", ocrValue: "未标注", stdValue: "Ra0.8 / Ra3.2", confidence: 90, historyRef: "J480 最佳实践" },
]

const severityConfig = {
    critical: { color: "#dc2626", tag: "red" as const, label: "严重", icon: <CloseCircleOutlined /> },
    major: { color: "#f59e0b", tag: "orange" as const, label: "重要", icon: <WarningOutlined /> },
    minor: { color: "#16a34a", tag: "green" as const, label: "一般", icon: <InfoCircleOutlined /> },
}

const TAB_STEP_MAP: Record<string, number> = { upload: 0, overview: 1, review: 2, ai: 3, report: 4, approval: 5 }

// ========== 页面组件 ==========
export default function DrawingReviewPage() {
    const [activeTab, setActiveTab] = useState("upload")
    const [uploadedPdfUrl, setUploadedPdfUrl] = useState("/api/serve-file/cad-drawing.pdf")
    const [uploadedFileName, setUploadedFileName] = useState("")
    const [uploadedStpName, setUploadedStpName] = useState("")
    const [uploading, setUploading] = useState(false)
    const [issues, setIssues] = useState<DRIssue[]>(INITIAL_ISSUES)
    const [projectInfo] = useState<ProjectInfo>(MOCK_PROJECT)
    const [generating, setGenerating] = useState(false)
    const [generated, setGenerated] = useState(false)
    const [downloadUrl, setDownloadUrl] = useState("")
    const [approvalStatus, setApprovalStatus] = useState<"pending" | "approved" | "rejected">("pending")
    const [aiAnalyzing, setAiAnalyzing] = useState(false)
    const [aiProgress, setAiProgress] = useState(0)
    const [aiDone, setAiDone] = useState(false)
    const [showHistoryModal, setShowHistoryModal] = useState(false)
    const [showAddIssueModal, setShowAddIssueModal] = useState(false)
    const [editingIssue, setEditingIssue] = useState<DRIssue | null>(null)
    const [showPdfViewer, setShowPdfViewer] = useState(false)
    const [historySearch, setHistorySearch] = useState("")
    const [selectedSuggestions, setSelectedSuggestions] = useState<number[]>([])
    const [adoptedSuggestions, setAdoptedSuggestions] = useState<number[]>([])
    const [taskAssignments, setTaskAssignments] = useState<Record<string, { assignee: string; deadline: string; status: string }>>({
        dr: { assignee: "", deadline: "", status: "未分配" },
        mtd: { assignee: "", deadline: "", status: "未分配" },
        dfm: { assignee: "", deadline: "", status: "未分配" },
    })
    const [previewSlide, setPreviewSlide] = useState<{ visible: boolean; index: number; pages: { title: string; img: string }[] }>({ visible: false, index: 0, pages: [] })
    const [newIssue, setNewIssue] = useState({
        pptPage: "", faiSpc: "", category: "尺寸公差", description: "", drawingSpec: "", suggestion: "",
        severity: "major" as "critical" | "major" | "minor",
    })
    // 2D/3D comparison states
    const [pdfFile, setPdfFile] = useState<File | null>(null)
    const [stpFile, setStpFile] = useState<File | null>(null)
    const [comparing, setComparing] = useState(false)
    const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null)
    const [selectedMismatches, setSelectedMismatches] = useState<number[]>([])
    const [reportIssueKeys, setReportIssueKeys] = useState<number[]>([])

    const { message } = App.useApp()
    const currentStep = TAB_STEP_MAP[activeTab] ?? 0

    const stats = useMemo(() => ({
        critical: issues.filter(i => i.severity === "critical").length,
        major: issues.filter(i => i.severity === "major").length,
        minor: issues.filter(i => i.severity === "minor").length,
        total: issues.length,
    }), [issues])

    const filteredHistory = useMemo(() => {
        if (!historySearch) return HISTORY_ISSUES
        const s = historySearch.toLowerCase()
        return HISTORY_ISSUES.filter(h => h.category.toLowerCase().includes(s) || h.description.toLowerCase().includes(s) || h.project.toLowerCase().includes(s))
    }, [historySearch])

    // ===== Handlers =====
    const selectedReportIssues = useMemo(() => {
        if (reportIssueKeys.length === 0) return issues
        return issues.filter((_, i) => reportIssueKeys.includes(i))
    }, [issues, reportIssueKeys])

    const handleGeneratePPT = async () => {
        const issuesToExport = selectedReportIssues.map((item, idx) => ({ ...item, seqNo: idx + 1 }))
        if (issuesToExport.length === 0) { message.warning("请至少选择一个问题"); return }
        setGenerating(true)
        try {
            const res = await fetch("/api/dr-ppt", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectInfo, issues: issuesToExport }),
            })
            const data = await res.json()
            if (data.success) { setDownloadUrl(data.downloadUrl); setGenerated(true); message.success(`DR 报告生成成功！共 ${data.pageCount} 页`) }
            else { message.error(data.error || "生成失败") }
        } catch { message.error("网络错误，请重试") }
        setGenerating(false)
    }

    const handleAIAnalysis = () => {
        setAiAnalyzing(true); setAiDone(false); setAiProgress(0)
        const steps = [10, 25, 40, 55, 70, 85, 95, 100]
        let i = 0
        const timer = setInterval(() => {
            if (i < steps.length) { setAiProgress(steps[i]); i++ }
            else { clearInterval(timer); setAiAnalyzing(false); setAiDone(true); message.success("AI 图纸分析完成，发现 4 个潜在问题") }
        }, 400)
    }

    const handleDeleteIssue = (seqNo: number) => {
        setIssues(prev => prev.filter(i => i.seqNo !== seqNo).map((item, idx) => ({ ...item, seqNo: idx + 1 })))
        message.success("问题已删除")
    }

    const handleAddIssue = () => {
        if (!newIssue.description) { message.warning("请填写问题描述"); return }
        const issue: DRIssue = {
            seqNo: issues.length + 1, pptPage: newIssue.pptPage || `P${issues.length + 3}`,
            faiSpc: newIssue.faiSpc || `FAI-${String(issues.length + 1).padStart(2, "0")}`,
            category: newIssue.category, description: newIssue.description, drawingSpec: newIssue.drawingSpec,
            suggestion: newIssue.suggestion, pdOpinion: "", severity: newIssue.severity,
        }
        setIssues(prev => [...prev, issue])
        setShowAddIssueModal(false)
        setNewIssue({ pptPage: "", faiSpc: "", category: "尺寸公差", description: "", drawingSpec: "", suggestion: "", severity: "major" })
        message.success("问题已添加到清单")
    }

    const handleSaveEdit = () => {
        if (!editingIssue) return
        setIssues(prev => prev.map(i => i.seqNo === editingIssue.seqNo ? editingIssue : i))
        setEditingIssue(null)
        message.success("修改已保存")
    }

    const handleDrawingUpload = async (file: File) => {
        setUploading(true)
        try {
            const formData = new FormData()
            formData.append("file", file)
            const res = await fetch("/api/upload-drawing", { method: "POST", body: formData })
            const data = await res.json()
            if (data.success) { setUploadedPdfUrl(data.url); setUploadedFileName(data.originalName); message.success(`图纸 ${data.originalName} 上传成功！`) }
            else { message.error(data.error || "上传失败") }
        } catch { message.error("上传失败，请重试") }
        setUploading(false)
    }

    const handleAssignTask = (taskKey: string, field: string, value: string) => {
        setTaskAssignments(prev => ({ ...prev, [taskKey]: { ...prev[taskKey], [field]: value, status: "已分配" } }))
    }

    // ===== 2D/3D Comparison Handler =====
    const handleCompare = async () => {
        if (!pdfFile || !stpFile) { message.warning("请同时上传 2D PDF 和 3D STP 文件"); return }
        setComparing(true)
        try {
            const formData = new FormData()
            formData.append("pdf", pdfFile)
            formData.append("stp", stpFile)
            formData.append("tolerance", "0.1")
            const res = await fetch("/api/drawing-compare", { method: "POST", body: formData })
            const data = await res.json()
            if (data.error) { message.error(data.error); return }
            setComparisonResult(data)
            if (data.summary?.mismatched > 0) {
                message.warning(`发现 ${data.summary.mismatched} 处 2D/3D 尺寸不匹配！`)
            } else {
                message.success("2D 与 3D 图纸尺寸一致")
            }
        } catch { message.error("对比分析失败，请重试") }
        finally { setComparing(false) }
    }

    const adoptMismatches = () => {
        if (!comparisonResult) return
        const selected = selectedMismatches.map(i => comparisonResult.mismatches[i]).filter(Boolean)
        const newIssues: DRIssue[] = selected.map((m, i) => ({
            seqNo: issues.length + i + 1,
            pptPage: "",
            faiSpc: m.is_fai ? "FAI" : "2D/3D",
            category: "2D/3D 尺寸不匹配",
            description: m.description,
            drawingSpec: `2D: ${m.value_2d}mm / 3D: ${m.value_3d}mm`,
            suggestion: m.suggestion,
            pdOpinion: "",
            severity: m.severity === "critical" ? "critical" : "major",
        }))
        setIssues(prev => [...prev, ...newIssues])
        setSelectedMismatches([])
        message.success(`已将 ${newIssues.length} 个 2D/3D 不匹配项添加到问题清单`)
    }

    // ===== 顶部 Steps =====
    const stepsBar = (
        <div className="bg-white border-b px-6 py-2">
            <Steps size="small" current={currentStep}
                onChange={(step) => { const tabKeys = ["upload", "overview", "review", "ai", "report", "approval"]; setActiveTab(tabKeys[step]) }}
                items={[
                    { title: "接收图纸", icon: <UploadOutlined />, status: uploadedFileName ? "finish" : undefined },
                    { title: "任务分配", icon: <TeamOutlined />, status: taskAssignments.dr.assignee ? "finish" : undefined },
                    { title: "图纸评审", icon: <FileSearchOutlined /> },
                    { title: "AI 辅助", icon: <RobotOutlined /> },
                    { title: "报告生成", icon: <FilePdfOutlined /> },
                    { title: "PM 审批", icon: <CheckCircleOutlined />, status: approvalStatus === "approved" ? "finish" : approvalStatus === "rejected" ? "error" : undefined },
                ]}
            />
        </div>
    )

    // ===== Tab 0: 接收图纸 (含 2D/3D 对比) =====
    const uploadTab = (
        <div className="space-y-6">
            <Row gutter={16}>
                {/* 2D PDF 上传 */}
                <Col span={12}>
                    <Card title={<span className="flex items-center gap-2"><FilePdfOutlined className="text-red-500" />2D 图纸 (PDF)</span>} size="small">
                        <Upload.Dragger
                            accept=".pdf"
                            showUploadList={false}
                            customRequest={({ file }) => {
                                const f = file as File
                                setPdfFile(f)
                                handleDrawingUpload(f)
                            }}
                            disabled={uploading}
                            style={{ padding: "20px 16px" }}
                        >
                            {uploadedFileName ? (
                                <div className="flex items-center gap-3 justify-center">
                                    <CheckCircleOutlined className="text-green-500 text-xl" />
                                    <div className="text-left">
                                        <div className="font-bold text-sm text-green-700">{uploadedFileName}</div>
                                        <div className="text-xs text-gray-400">2D PDF 已上传</div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <InboxOutlined style={{ fontSize: 36 }} className="text-gray-300" />
                                    <p className="text-sm font-bold mt-2">上传 2D 图纸 PDF</p>
                                    <p className="text-xs text-gray-400">来自 Apple 客户的工程图纸</p>
                                </>
                            )}
                        </Upload.Dragger>
                    </Card>
                </Col>

                {/* 3D STP 上传 */}
                <Col span={12}>
                    <Card title={<span className="flex items-center gap-2"><FileAddOutlined className="text-blue-500" />3D 模型 (STP/STEP)</span>} size="small">
                        <Upload.Dragger
                            accept=".stp,.step"
                            showUploadList={false}
                            beforeUpload={(file) => {
                                setStpFile(file as unknown as File)
                                setUploadedStpName(file.name)
                                message.success(`3D 模型 ${file.name} 已选择`)
                                return false
                            }}
                            style={{ padding: "20px 16px" }}
                        >
                            {uploadedStpName ? (
                                <div className="flex items-center gap-3 justify-center">
                                    <CheckCircleOutlined className="text-green-500 text-xl" />
                                    <div className="text-left">
                                        <div className="font-bold text-sm text-green-700">{uploadedStpName}</div>
                                        <div className="text-xs text-gray-400">3D STP 已选择</div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <InboxOutlined style={{ fontSize: 36 }} className="text-gray-300" />
                                    <p className="text-sm font-bold mt-2">上传 3D 模型 STP</p>
                                    <p className="text-xs text-gray-400">与 2D 图纸对应的三维模型</p>
                                </>
                            )}
                        </Upload.Dragger>
                    </Card>
                </Col>
            </Row>

            {/* 2D/3D 对比按钮 */}
            {(uploadedFileName || pdfFile) && (uploadedStpName || stpFile) && (
                <Card size="small" className="border-blue-200 bg-blue-50/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <SwapOutlined className="text-blue-600 text-xl" />
                            <div>
                                <div className="font-bold text-sm">2D / 3D 尺寸对比分析</div>
                                <div className="text-xs text-gray-500">自动对比 2D 图纸标注尺寸与 3D 模型几何尺寸，发现不匹配项</div>
                            </div>
                        </div>
                        <Button type="primary" icon={comparing ? <LoadingOutlined /> : <SwapOutlined />} onClick={handleCompare} loading={comparing} size="large">
                            {comparing ? "分析中..." : comparisonResult ? "重新对比" : "开始 2D/3D 对比"}
                        </Button>
                    </div>
                </Card>
            )}

            {/* 2D/3D 对比结果 */}
            {comparisonResult && (
                <Card title={<span className="flex items-center gap-2"><SwapOutlined className="text-blue-600" />2D/3D 对比结果</span>}
                    extra={<Tag color={comparisonResult.summary.status === "pass" ? "success" : "error"}>{comparisonResult.summary.status === "pass" ? "通过" : "存在差异"}</Tag>}>

                    {/* 统计摘要 */}
                    <Row gutter={16} className="mb-4">
                        <Col span={4}><Card size="small" className="text-center"><Statistic title={<span className="text-xs">3D 测量</span>} value={comparisonResult.summary.total_3d_measurements} /></Card></Col>
                        <Col span={4}><Card size="small" className="text-center"><Statistic title={<span className="text-xs">2D 标注</span>} value={comparisonResult.summary.total_2d_dimensions} /></Card></Col>
                        <Col span={4}><Card size="small" className="text-center bg-green-50"><Statistic title={<span className="text-xs">匹配</span>} value={comparisonResult.summary.matched} valueStyle={{ color: "#16a34a" }} /></Card></Col>
                        <Col span={4}><Card size="small" className="text-center bg-red-50"><Statistic title={<span className="text-xs">不匹配</span>} value={comparisonResult.summary.mismatched} valueStyle={{ color: "#dc2626" }} /></Card></Col>
                        <Col span={8}><Card size="small" className="text-center">
                            <div className="text-xs text-gray-400 mb-1">3D 包围盒</div>
                            <span className="font-mono text-sm">{comparisonResult.bounding_box.x_size} × {comparisonResult.bounding_box.y_size} × {comparisonResult.bounding_box.z_size} mm</span>
                        </Card></Col>
                    </Row>

                    <Alert message={comparisonResult.summary.conclusion} type={comparisonResult.summary.status === "pass" ? "success" : "warning"} showIcon className="mb-4" />

                    {/* 不匹配列表 */}
                    {comparisonResult.mismatches.length > 0 && (
                        <>
                            <div className="flex items-center justify-between mb-2">
                                <Checkbox
                                    checked={selectedMismatches.length === comparisonResult.mismatches.length}
                                    indeterminate={selectedMismatches.length > 0 && selectedMismatches.length < comparisonResult.mismatches.length}
                                    onChange={(e) => setSelectedMismatches(e.target.checked ? comparisonResult.mismatches.map((_, i) => i) : [])}
                                >
                                    <span className="text-sm font-medium">全选不匹配项 ({selectedMismatches.length}/{comparisonResult.mismatches.length})</span>
                                </Checkbox>
                                <Button type="primary" size="small" disabled={selectedMismatches.length === 0} onClick={adoptMismatches}>
                                    添加到问题清单 ({selectedMismatches.length})
                                </Button>
                            </div>
                            <Table
                                dataSource={comparisonResult.mismatches}
                                rowKey={(_, i) => String(i)}
                                size="small"
                                pagination={false}
                                scroll={{ y: 300 }}
                                rowSelection={{
                                    selectedRowKeys: selectedMismatches.map(String),
                                    onChange: (keys) => setSelectedMismatches(keys.map(Number)),
                                }}
                                columns={[
                                    { title: "3D 测量项", dataIndex: "dim_3d", ellipsis: true, width: 200, render: (t: string) => <Tooltip title={t}><span className="text-xs font-mono">{t}</span></Tooltip> },
                                    { title: "3D 值", dataIndex: "value_3d", width: 80, align: "center", render: (v: number) => <span className="font-mono text-sm font-bold">{v}</span> },
                                    { title: "2D 值", dataIndex: "value_2d", width: 80, align: "center", render: (v: number) => <span className="font-mono text-sm font-bold">{v}</span> },
                                    { title: "差值", dataIndex: "difference", width: 80, align: "center", render: (v: number) => <span className={`font-mono text-sm font-bold ${v > 0.5 ? "text-red-600" : "text-orange-500"}`}>{v}mm</span> },
                                    { title: "级别", dataIndex: "severity", width: 80, align: "center", render: (v: string) => <Tag color={v === "critical" ? "red" : "orange"}>{v === "critical" ? "严重" : "警告"}</Tag> },
                                    { title: "FAI", dataIndex: "is_fai", width: 60, align: "center", render: (v: boolean) => v ? <Tag color="blue">FAI</Tag> : null },
                                ]}
                            />
                        </>
                    )}

                    {/* 匹配列表（可折叠） */}
                    {comparisonResult.matches.length > 0 && (
                        <details className="mt-4">
                            <summary className="cursor-pointer text-sm text-gray-500 hover:text-blue-600">查看 {comparisonResult.matches.length} 个匹配项</summary>
                            <Table
                                dataSource={comparisonResult.matches}
                                rowKey={(_, i) => String(i)}
                                size="small"
                                pagination={false}
                                className="mt-2"
                                columns={[
                                    { title: "3D 测量项", dataIndex: "dim_3d", ellipsis: true },
                                    { title: "3D 值", dataIndex: "value_3d", width: 80, render: (v: number) => <span className="font-mono">{v}</span> },
                                    { title: "2D 值", dataIndex: "value_2d", width: 80, render: (v: number) => <span className="font-mono">{v}</span> },
                                    { title: "差值", dataIndex: "difference", width: 80, render: (v: number) => <span className="font-mono text-green-600">{v}mm</span> },
                                    { title: "状态", width: 80, render: () => <Tag color="success">匹配</Tag> },
                                ]}
                            />
                        </details>
                    )}
                </Card>
            )}

            {/* 图纸预览 */}
            {uploadedPdfUrl && (
                <Card title="2D 图纸预览" size="small" extra={<Button size="small" icon={<EyeOutlined />} onClick={() => setShowPdfViewer(true)}>全屏查看</Button>}>
                    <div className="bg-slate-100 rounded-lg overflow-hidden" style={{ height: 350 }}>
                        <iframe src={`${uploadedPdfUrl}#toolbar=0&navpanes=0`} className="w-full h-full border-0" title="图纸预览" />
                    </div>
                </Card>
            )}

            {/* 操作按钮 */}
            <div className="flex justify-between items-center">
                {!uploadedFileName && (
                    <Alert message="演示提示" description="您可以上传实际的 2D PDF 和 3D STP 文件，也可以跳过此步骤进入演示流程。" type="info" showIcon
                        action={<Button size="small" onClick={() => { setUploadedFileName("160-05834-02.pdf (默认)"); setActiveTab("overview") }}>跳过，使用示例</Button>} />
                )}
                {uploadedFileName && (
                    <Button type="primary" size="large" onClick={() => setActiveTab("overview")}>下一步 → 项目总览</Button>
                )}
            </div>
        </div>
    )

    // ===== Tab 1: 任务分配 =====
    const TEAM_MEMBERS = [
        { value: "王工", label: "王工 (DR 工程师)" }, { value: "李工", label: "李工 (MTD 工程师)" },
        { value: "张工", label: "张工 (DFM 工程师)" }, { value: "赵工", label: "赵工 (品质工程师)" },
        { value: "陈工", label: "陈工 (高级工程师)" },
    ]

    const overviewTab = (
        <div className="space-y-6">
            <Card title={<span className="flex items-center gap-2"><ProjectOutlined className="text-blue-600" />项目信息</span>}>
                <Descriptions column={3} bordered size="small">
                    <Descriptions.Item label="项目名称">{projectInfo.projectName}</Descriptions.Item>
                    <Descriptions.Item label="产品名称">{projectInfo.productName}</Descriptions.Item>
                    <Descriptions.Item label="零件号">{projectInfo.partNumber}</Descriptions.Item>
                    <Descriptions.Item label="客户">{projectInfo.customer}</Descriptions.Item>
                    <Descriptions.Item label="评审人">{projectInfo.reviewer}</Descriptions.Item>
                    <Descriptions.Item label="评审日期">{projectInfo.reviewDate}</Descriptions.Item>
                    <Descriptions.Item label="图纸版本">{projectInfo.drawingVersion}</Descriptions.Item>
                    <Descriptions.Item label="项目状态"><Tag color="processing">评审中</Tag></Descriptions.Item>
                    <Descriptions.Item label="关联图纸">{uploadedFileName || "默认示例图纸"}{uploadedStpName ? ` + ${uploadedStpName}` : ""}</Descriptions.Item>
                </Descriptions>
            </Card>
            <Card title={<span className="flex items-center gap-2"><TeamOutlined className="text-blue-600" />任务分配</span>}>
                <div className="space-y-4">
                    {[
                        { key: "dr", icon: <FileSearchOutlined style={{ fontSize: 18 }} />, bg: "bg-blue-600", title: "Drawing Review (DR)", desc: "图纸评审 · 检测尺寸、公差、标注", color: "blue" },
                        { key: "mtd", icon: <SafetyCertificateOutlined style={{ fontSize: 18 }} />, bg: "bg-purple-600", title: "MTD 检测文档", desc: "Metrology · 制定检测方案", color: "purple" },
                        { key: "dfm", icon: <ExperimentOutlined style={{ fontSize: 18 }} />, bg: "bg-green-600", title: "DFM 策划", desc: "制造可行性评估", color: "green" },
                    ].map(task => (
                        <div key={task.key} className={`border rounded-lg p-4 transition-all ${taskAssignments[task.key].assignee ? `border-${task.color}-300 bg-${task.color}-50/30` : "border-gray-200"}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg ${task.bg} flex items-center justify-center text-white`}>{task.icon}</div>
                                    <div>
                                        <div className="font-bold text-sm">{task.title}</div>
                                        <div className="text-xs text-gray-500">{task.desc}</div>
                                    </div>
                                </div>
                                {taskAssignments[task.key].assignee ? <Tag color={task.color} icon={<CheckCircleOutlined />}>已分配</Tag> : <Tag>未分配</Tag>}
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div><div className="text-xs text-gray-500 mb-1">负责人</div><Select placeholder="选择负责人" size="small" className="w-full" value={taskAssignments[task.key].assignee || undefined} onChange={v => handleAssignTask(task.key, "assignee", v)} options={TEAM_MEMBERS} /></div>
                                <div><div className="text-xs text-gray-500 mb-1">截止日期</div><DatePicker size="small" className="w-full" onChange={(_, ds) => handleAssignTask(task.key, "deadline", ds as string)} /></div>
                                <div><div className="text-xs text-gray-500 mb-1">优先级</div><Select size="small" className="w-full" defaultValue="中" options={[{ value: "高", label: "高优先级" }, { value: "中", label: "中优先级" }, { value: "低", label: "低优先级" }]} /></div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
            <div className="flex justify-end">
                <Button type="primary" size="large" icon={<SendOutlined />} disabled={!taskAssignments.dr.assignee} onClick={() => { message.success("任务已分配"); setActiveTab("review") }}>确认分配并开始 DR 评审</Button>
            </div>
        </div>
    )

    // ===== Tab 2: 图纸评审 =====
    const issueColumns: TableProps<DRIssue>["columns"] = [
        { title: "No.", dataIndex: "seqNo", width: 50, align: "center", render: (v: number) => <span className="font-mono font-bold text-blue-600">{v}</span> },
        { title: "页码", dataIndex: "pptPage", width: 60, align: "center" },
        { title: "FAI/SPC", dataIndex: "faiSpc", width: 110, render: (v: string) => <span className="text-xs font-mono">{v}</span> },
        { title: "类别", dataIndex: "category", width: 110, render: (v: string) => <Tag>{v}</Tag> },
        { title: "问题描述", dataIndex: "description", ellipsis: true, render: (v: string) => <Tooltip title={v}><span className="text-xs">{v}</span></Tooltip> },
        { title: "图纸规格", dataIndex: "drawingSpec", width: 130, render: (v: string) => <span className="font-mono text-xs">{v}</span> },
        { title: "建议方案", dataIndex: "suggestion", ellipsis: true, render: (v: string) => <Tooltip title={v}><span className="text-xs text-green-700">{v}</span></Tooltip> },
        { title: "严重性", dataIndex: "severity", width: 80, align: "center", render: (v: "critical" | "major" | "minor") => <Tag color={severityConfig[v].tag} icon={severityConfig[v].icon}>{severityConfig[v].label}</Tag> },
        { title: "操作", width: 90, align: "center", render: (_: unknown, record: DRIssue) => (
            <Space size="small">
                <Tooltip title="编辑"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => setEditingIssue({ ...record })} /></Tooltip>
                <Popconfirm title="确认删除此问题？" onConfirm={() => handleDeleteIssue(record.seqNo)} okText="删除" cancelText="取消">
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
            </Space>
        )},
    ]

    const reviewTab = (
        <div className="space-y-4">
            <Card size="small" title={<span className="flex items-center gap-2"><EyeOutlined />原始图纸 · {projectInfo.partNumber}</span>}
                extra={<Space><Button size="small" icon={<EyeOutlined />} onClick={() => setShowPdfViewer(true)}>全屏查看</Button><Button size="small" icon={<DownloadOutlined />} href={uploadedPdfUrl} target="_blank">下载 PDF</Button></Space>}>
                <div className="bg-slate-100 rounded-lg overflow-hidden" style={{ height: 280 }}>
                    <iframe src={`${uploadedPdfUrl}#toolbar=0&navpanes=0`} className="w-full h-full border-0" title="CAD 图纸预览" />
                </div>
            </Card>
            <Card title={<span className="flex items-center gap-2"><EditOutlined />问题清单 ({issues.length})</span>}
                extra={<Space><Button icon={<HistoryOutlined />} onClick={() => setShowHistoryModal(true)}>历史问题库</Button><Button type="primary" icon={<PlusOutlined />} onClick={() => setShowAddIssueModal(true)}>添加问题</Button></Space>}>
                <Table dataSource={issues} columns={issueColumns} rowKey="seqNo" size="small" pagination={false} scroll={{ x: 1200 }}
                    summary={() => (
                        <Table.Summary.Row>
                            <Table.Summary.Cell index={0} colSpan={5} className="font-bold">汇总: 共 {stats.total} 个问题</Table.Summary.Cell>
                            <Table.Summary.Cell index={5} colSpan={4}><Space size="large"><span className="text-red-600 font-bold">严重: {stats.critical}</span><span className="text-orange-500 font-bold">重要: {stats.major}</span><span className="text-green-600 font-bold">一般: {stats.minor}</span></Space></Table.Summary.Cell>
                        </Table.Summary.Row>
                    )}
                />
            </Card>
            <div className="flex justify-end gap-3">
                <Button size="large" icon={<SaveOutlined />} onClick={() => message.info("已保存草稿")}>保存草稿</Button>
                <Button size="large" type="primary" icon={<SendOutlined />} onClick={() => { message.success("评审已提交"); setActiveTab("ai") }}>提交并进入 AI 分析</Button>
            </div>
        </div>
    )

    // ===== Tab 3: AI 辅助 =====
    const aiTab = (
        <div className="space-y-6">
            <Row gutter={16}>
                <Col span={8}><Card className="text-center" hoverable><div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-2"><EyeOutlined className="text-blue-600" style={{ fontSize: 24 }} /></div><div className="font-bold text-sm">OCR 图纸识别</div><div className="text-xs text-gray-400 mt-1">慧新全景 / Hexagon</div></Card></Col>
                <Col span={8}><Card className="text-center" hoverable><div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-2"><SafetyCertificateOutlined className="text-green-600" style={{ fontSize: 24 }} /></div><div className="font-bold text-sm">零部件标准库对比</div><div className="text-xs text-gray-400 mt-1">设计标准数据</div></Card></Col>
                <Col span={8}><Card className="text-center" hoverable><div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-2"><BulbOutlined className="text-amber-600" style={{ fontSize: 24 }} /></div><div className="font-bold text-sm">AI 建议 + 历史库</div><div className="text-xs text-gray-400 mt-1">智能评审建议</div></Card></Col>
            </Row>
            <Card title={<span className="flex items-center gap-2"><RobotOutlined className="text-blue-600" />AI 分析引擎</span>}
                extra={<Button type="primary" icon={aiAnalyzing ? <LoadingOutlined /> : <ThunderboltOutlined />} onClick={handleAIAnalysis} loading={aiAnalyzing} size="large">{aiAnalyzing ? "分析中..." : aiDone ? "重新分析" : "开始 AI 分析"}</Button>}>
                {aiAnalyzing && (
                    <div className="py-8 text-center">
                        <Progress type="dashboard" percent={aiProgress} size={120} strokeColor={{ "0%": "#1677ff", "100%": "#52c41a" }} />
                        <div className="mt-4 max-w-md mx-auto space-y-2 text-left">
                            <div className={`flex items-center gap-2 text-sm ${aiProgress > 20 ? "text-green-600" : "text-gray-400"}`}>{aiProgress > 20 ? <CheckCircleOutlined /> : <LoadingOutlined />} 步骤 1: OCR 识别图纸尺寸标注</div>
                            <div className={`flex items-center gap-2 text-sm ${aiProgress > 50 ? "text-green-600" : aiProgress > 20 ? "text-blue-600" : "text-gray-400"}`}>{aiProgress > 50 ? <CheckCircleOutlined /> : aiProgress > 20 ? <LoadingOutlined /> : <InfoCircleOutlined />} 步骤 2: 对比零部件设计标准库</div>
                            <div className={`flex items-center gap-2 text-sm ${aiProgress > 80 ? "text-green-600" : aiProgress > 50 ? "text-blue-600" : "text-gray-400"}`}>{aiProgress > 80 ? <CheckCircleOutlined /> : aiProgress > 50 ? <LoadingOutlined /> : <InfoCircleOutlined />} 步骤 3: 历史图纸问题库匹配</div>
                            <div className={`flex items-center gap-2 text-sm ${aiProgress >= 100 ? "text-green-600" : aiProgress > 80 ? "text-blue-600" : "text-gray-400"}`}>{aiProgress >= 100 ? <CheckCircleOutlined /> : aiProgress > 80 ? <LoadingOutlined /> : <InfoCircleOutlined />} 步骤 4: 生成评审建议</div>
                        </div>
                    </div>
                )}
                {aiDone && (
                    <div className="space-y-4">
                        <Alert message={<span>工程师已录入 <span className="font-bold">{issues.length}</span> 个问题，AI 额外发现 <span className="font-bold text-red-600">{AI_SUGGESTIONS.filter((_, i) => !adoptedSuggestions.includes(i)).length}</span> 个潜在问题</span>} type="info" showIcon className="mb-4" />
                        <div className="grid grid-cols-4 gap-4 mb-4">
                            <Card size="small" className="text-center bg-blue-50"><Statistic title="OCR 识别尺寸" value={23} suffix="个" /></Card>
                            <Card size="small" className="text-center bg-green-50"><Statistic title="标准库匹配" value={23} suffix="/ 23" valueStyle={{ color: "#16a34a" }} /></Card>
                            <Card size="small" className="text-center bg-red-50"><Statistic title="发现问题" value={4} valueStyle={{ color: "#dc2626" }} suffix="个" /></Card>
                            <Card size="small" className="text-center bg-amber-50"><Statistic title="历史参考" value={3} suffix="条" /></Card>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                            <Checkbox checked={selectedSuggestions.length === AI_SUGGESTIONS.length} indeterminate={selectedSuggestions.length > 0 && selectedSuggestions.length < AI_SUGGESTIONS.length}
                                onChange={(e) => setSelectedSuggestions(e.target.checked ? AI_SUGGESTIONS.map((_, i) => i) : [])}>
                                <span className="text-sm font-medium">全选 ({selectedSuggestions.length}/{AI_SUGGESTIONS.length})</span>
                            </Checkbox>
                        </div>
                        {AI_SUGGESTIONS.map((sug, i) => {
                            const cfg = severityConfig[sug.type]
                            const isSelected = selectedSuggestions.includes(i)
                            return (
                                <Card key={i} size="small" className={`border-l-4 cursor-pointer transition-all ${isSelected ? "ring-2 ring-blue-200 bg-blue-50/30" : "hover:shadow-sm"}`} style={{ borderLeftColor: cfg.color }}
                                    onClick={() => setSelectedSuggestions(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}>
                                    <div className="flex items-start gap-3">
                                        {adoptedSuggestions.includes(i) ? <Tag color="green" className="mt-0.5">已采纳</Tag> : <Checkbox checked={isSelected} className="mt-0.5" onClick={e => e.stopPropagation()} onChange={() => setSelectedSuggestions(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])} />}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Tag color={cfg.tag} icon={cfg.icon}>{cfg.label}</Tag>
                                                <span className="font-bold text-sm">{sug.title}</span>
                                                {sug.historyRef && <Tag color="blue" icon={<HistoryOutlined />} className="text-xs">{sug.historyRef}</Tag>}
                                            </div>
                                            <p className="text-xs text-gray-600 leading-relaxed">{sug.detail}</p>
                                            <div className="flex items-center gap-4 mt-2">
                                                <span className="text-xs"><span className="text-gray-400">图纸值:</span> <span className="font-mono text-red-600">{sug.ocrValue}</span></span>
                                                <span className="text-xs">→</span>
                                                <span className="text-xs"><span className="text-gray-400">标准值:</span> <span className="font-mono text-green-600">{sug.stdValue}</span></span>
                                            </div>
                                        </div>
                                        <Progress type="circle" percent={sug.confidence} size={40} strokeColor={cfg.color} />
                                    </div>
                                </Card>
                            )
                        })}
                        <div className="flex items-center justify-between mt-4">
                            <span className="text-sm text-gray-500">已选择 <span className="font-bold text-blue-600">{selectedSuggestions.length}</span> 条建议</span>
                            <Space>
                                <Button type="primary" size="large" disabled={selectedSuggestions.length === 0}
                                    onClick={() => {
                                        const newIssues: DRIssue[] = selectedSuggestions.filter(idx => !adoptedSuggestions.includes(idx)).map((idx, i) => {
                                            const sug = AI_SUGGESTIONS[idx]
                                            const catMap: Record<string, string> = { "厚度公差超出制造能力": "尺寸公差", "基准面选择不当": "基准选择", "装配间隙风险": "尺寸标注", "表面粗糙度缺失": "表面粗糙度" }
                                            return { seqNo: issues.length + i + 1, pptPage: "", faiSpc: `AI-${String(idx + 1).padStart(2, "0")}`, category: catMap[sug.title] || sug.title,
                                                description: sug.detail, drawingSpec: sug.ocrValue, suggestion: `建议标准值: ${sug.stdValue}${sug.historyRef ? ` (参考: ${sug.historyRef})` : ""}`, pdOpinion: "",
                                                severity: sug.type === "critical" ? "critical" as const : sug.type === "major" ? "major" as const : "minor" as const }
                                        })
                                        setIssues(prev => [...prev, ...newIssues]); setAdoptedSuggestions(prev => [...prev, ...selectedSuggestions]); setSelectedSuggestions([])
                                        message.success(`已采纳 ${newIssues.length} 条 AI 建议`)
                                    }}>采纳选中 ({selectedSuggestions.length})</Button>
                                <Button size="large" type="primary" ghost onClick={() => setActiveTab("report")} icon={<SendOutlined />}>生成报告 ({issues.length} 个问题)</Button>
                            </Space>
                        </div>
                    </div>
                )}
                {!aiAnalyzing && !aiDone && (
                    <div className="py-16 text-center text-gray-400">
                        <RobotOutlined style={{ fontSize: 64 }} className="mb-4 opacity-20" />
                        <p className="font-bold">点击「开始 AI 分析」启动智能评审</p>
                        <p className="text-xs mt-1">将使用 OCR 识别图纸尺寸，并与标准库和历史数据对比</p>
                    </div>
                )}
            </Card>
        </div>
    )

    // ===== Tab 4: 报告生成 =====
    const reportTab = (
        <div className="space-y-6">
            {/* Step 1: Issue Selection */}
            {!generated && (
                <Card title={<span className="flex items-center gap-2"><FileSearchOutlined className="text-blue-600" />选择报告问题</span>}
                    extra={<Space>
                        <Button size="small" onClick={() => setReportIssueKeys(issues.map((_, i) => i))}>全选</Button>
                        <Button size="small" onClick={() => setReportIssueKeys([])}>清空</Button>
                    </Space>}>
                    <Alert message="请勾选需要放入 DR 报告的问题，未勾选的问题将不会出现在最终 PPT 中" type="info" showIcon className="mb-4" />
                    <Table
                        size="small"
                        dataSource={issues.map((item, idx) => ({ ...item, key: idx }))}
                        rowSelection={{
                            selectedRowKeys: reportIssueKeys,
                            onChange: (keys) => setReportIssueKeys(keys as number[]),
                        }}
                        pagination={false}
                        columns={[
                            { title: "No.", dataIndex: "seqNo", width: 50, align: "center" as const },
                            { title: "Page", dataIndex: "pptPage", width: 60, align: "center" as const },
                            { title: "FAI/SPC", dataIndex: "faiSpc", width: 90 },
                            { title: "类别", dataIndex: "category", width: 100,
                                render: (v: string) => <Tag>{v}</Tag> },
                            { title: "问题描述", dataIndex: "description", ellipsis: true },
                            { title: "图纸规格", dataIndex: "drawingSpec", width: 140, ellipsis: true },
                            { title: "建议方案", dataIndex: "suggestion", width: 200, ellipsis: true },
                            { title: "严重性", dataIndex: "severity", width: 70, align: "center" as const,
                                render: (v: string) => <Tag color={v === "critical" ? "red" : v === "major" ? "orange" : "green"}>{severityConfig[v as keyof typeof severityConfig]?.label || v}</Tag> },
                        ]}
                    />
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <span className="text-sm text-gray-500">
                            已选择 <span className="font-bold text-blue-600">{reportIssueKeys.length}</span> / {issues.length} 个问题
                        </span>
                        <Button type="primary" size="large" icon={<ThunderboltOutlined />}
                            loading={generating} disabled={reportIssueKeys.length === 0}
                            onClick={handleGeneratePPT}>
                            生成 DR 报告 ({reportIssueKeys.length} 个问题)
                        </Button>
                    </div>
                </Card>
            )}

            {/* Step 2: Generated Result */}
            {generated && (
                <Card title={<span className="flex items-center gap-2"><FilePdfOutlined className="text-blue-600" />DR 报告已生成</span>}
                    extra={<Button size="small" onClick={() => setGenerated(false)} icon={<EditOutlined />}>重新选择问题</Button>}>
                    <Alert message={`DR 报告已生成 · 封面 + ${selectedReportIssues.length} 组问题页（汇总+详情）· 共 ${1 + selectedReportIssues.length * 2} 页`} type="success" showIcon className="mb-4" />
                    <div className="grid grid-cols-5 gap-3 mb-4">
                        {(() => {
                            const allPages = [
                                { title: "封面页", desc: "Cover" },
                                ...selectedReportIssues.flatMap((item, i) => [
                                    { title: `#${i+1} 汇总`, desc: item.category },
                                    { title: `#${i+1} 详情`, desc: item.description.substring(0, 20) + "..." },
                                ]),
                            ]
                            return allPages.map((page, i) => (
                                <div key={i} className="border rounded-lg p-3 bg-slate-50 hover:border-blue-400 transition-all">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">P{i + 1}</div>
                                        <span className="text-xs font-bold">{page.title}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 truncate">{page.desc}</p>
                                </div>
                            ))
                        })()}
                    </div>
                    <Divider />
                    <Space>
                        <Button type="primary" size="large" icon={<DownloadOutlined />} href={downloadUrl} target="_blank">下载 DR 报告 (.pptx)</Button>
                        <Button size="large" onClick={() => { message.success("已提交审批"); setActiveTab("approval") }} icon={<SendOutlined />}>提交 PM 审批</Button>
                    </Space>
                </Card>
            )}

            {/* Sidebar */}
            <Row gutter={16}>
                <Col span={12}>
                    <Card title="报告概要" size="small">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm"><span className="text-gray-500">项目</span><span className="font-bold">{projectInfo.projectName}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-gray-500">零件号</span><span className="font-mono text-xs">{projectInfo.partNumber}</span></div>
                            <Divider className="my-2" />
                            <div className="flex justify-between text-sm"><span className="text-gray-500">问题总数</span><span className="font-bold text-lg">{issues.length}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-gray-500">已选入报告</span><span className="font-bold text-lg text-blue-600">{reportIssueKeys.length}</span></div>
                            <Divider className="my-2" />
                            <div className="flex justify-between text-sm"><span className="text-red-600">严重</span><Badge count={selectedReportIssues.filter(i => i.severity === "critical").length} style={{ backgroundColor: "#dc2626" }} /></div>
                            <div className="flex justify-between text-sm"><span className="text-orange-500">重要</span><Badge count={selectedReportIssues.filter(i => i.severity === "major").length} style={{ backgroundColor: "#f59e0b" }} /></div>
                            <div className="flex justify-between text-sm"><span className="text-green-600">一般</span><Badge count={selectedReportIssues.filter(i => i.severity === "minor").length} style={{ backgroundColor: "#16a34a" }} /></div>
                        </div>
                    </Card>
                </Col>
                <Col span={12}>
                    <Card title="PPT 结构（模板）" size="small">
                        <Timeline items={[
                            { color: "blue", children: <span className="text-xs">封面页 (Cover)</span> },
                            ...selectedReportIssues.flatMap((item, i) => [
                                { color: "orange" as const, children: <span className="text-xs">#{i+1} 汇总 (Summary) - {item.category}</span> },
                                { color: "red" as const, children: <span className="text-xs">#{i+1} 详情 (Detail) - Callout/Definition</span> },
                            ]),
                        ]} />
                        <div className="text-xs text-gray-400 mt-2">每个问题生成一对页面（汇总表 + 详情页），与 Apple DR 模板一致</div>
                    </Card>
                </Col>
            </Row>
        </div>
    )

        // ===== Tab 5: 审批 =====
    const approvalTab = (
        <div className="space-y-6">
            <Card>
                <Descriptions title="评审报告信息" bordered column={2} size="small">
                    <Descriptions.Item label="项目">{projectInfo.projectName}</Descriptions.Item>
                    <Descriptions.Item label="零件号">{projectInfo.partNumber}</Descriptions.Item>
                    <Descriptions.Item label="评审人">{projectInfo.reviewer}</Descriptions.Item>
                    <Descriptions.Item label="评审日期">{projectInfo.reviewDate}</Descriptions.Item>
                    <Descriptions.Item label="问题总数"><span className="font-bold text-lg">{stats.total}</span></Descriptions.Item>
                    <Descriptions.Item label="严重问题"><span className="text-red-600 font-bold text-lg">{stats.critical}</span></Descriptions.Item>
                    <Descriptions.Item label="评审结论" span={2}>
                        {stats.critical > 0 ? <Tag color="warning" className="text-sm px-3 py-1">有条件通过 — 存在严重问题需整改</Tag> : <Tag color="success" className="text-sm px-3 py-1">通过</Tag>}
                    </Descriptions.Item>
                </Descriptions>
            </Card>
            {downloadUrl && (
                <Card size="small">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3"><FilePdfOutlined className="text-blue-600 text-xl" /><div><div className="font-bold text-sm">DR 评审报告</div><div className="text-xs text-gray-500">DR_{projectInfo.partNumber}.pptx</div></div></div>
                        <Button icon={<DownloadOutlined />} href={downloadUrl} target="_blank">下载查看</Button>
                    </div>
                </Card>
            )}
            <Card title="审批操作">
                {approvalStatus === "pending" ? (
                    <div className="space-y-4">
                        <TextArea placeholder="请输入审批意见..." rows={3} />
                        <div className="flex gap-3 justify-end">
                            <Button danger size="large" onClick={() => { setApprovalStatus("rejected"); message.warning("已驳回") }}>驳回退回</Button>
                            <Button type="primary" size="large" icon={<CheckCircleOutlined />} onClick={() => { setApprovalStatus("approved"); message.success("审批通过！") }}>批准通过</Button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        {approvalStatus === "approved" ? (
                            <><CheckCircleOutlined style={{ fontSize: 64 }} className="text-green-500 mb-3" /><p className="text-lg font-bold text-green-700">审批已通过</p><p className="text-sm text-gray-500 mt-1">DR 子任务已关闭，报告可提交给客户</p><Button className="mt-4" onClick={() => setApprovalStatus("pending")}>重置状态</Button></>
                        ) : (
                            <><CloseCircleOutlined style={{ fontSize: 64 }} className="text-red-500 mb-3" /><p className="text-lg font-bold text-red-700">已驳回</p><p className="text-sm text-gray-500 mt-1">已退回工程师修改</p><Button className="mt-4" onClick={() => { setApprovalStatus("pending"); setActiveTab("review") }}>返回修改</Button></>
                        )}
                    </div>
                )}
            </Card>
        </div>
    )

    const tabItems = [
        { key: "upload", label: <span className="flex items-center gap-1.5"><UploadOutlined />接收图纸</span>, children: uploadTab },
        { key: "overview", label: <span className="flex items-center gap-1.5"><TeamOutlined />任务分配</span>, children: overviewTab },
        { key: "review", label: <span className="flex items-center gap-1.5"><FileSearchOutlined />图纸评审</span>, children: reviewTab },
        { key: "ai", label: <span className="flex items-center gap-1.5"><RobotOutlined />AI 辅助</span>, children: aiTab },
        { key: "report", label: <span className="flex items-center gap-1.5"><FilePdfOutlined />报告生成</span>, children: reportTab },
        { key: "approval", label: <span className="flex items-center gap-1.5"><CheckCircleOutlined />审批</span>, children: approvalTab },
    ]

    return (
        <div className="flex flex-col h-screen bg-slate-50/50">
            <div className="h-14 border-b bg-white px-6 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-blue-50 rounded-lg"><FileSearchOutlined className="text-blue-600" style={{ fontSize: 18 }} /></div>
                    <div>
                        <h2 className="text-base font-bold text-slate-900 leading-tight">Drawing Review (DR)</h2>
                        <p className="text-[10px] text-slate-500">{projectInfo.projectName} · {projectInfo.partNumber}</p>
                    </div>
                </div>
                <Tag color={approvalStatus === "approved" ? "success" : approvalStatus === "rejected" ? "error" : "processing"}>
                    {approvalStatus === "approved" ? "已批准" : approvalStatus === "rejected" ? "已驳回" : "评审中"}
                </Tag>
            </div>
            {stepsBar}
            <main className="flex-1 overflow-y-auto p-6">
                <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
            </main>

            {/* ===== 弹窗 ===== */}
            <Modal title={<div className="flex items-center justify-between pr-8"><span>幻灯片预览 — {previewSlide.pages[previewSlide.index]?.title}</span><span className="text-sm text-gray-400 font-normal">第 {previewSlide.index + 1} / {previewSlide.pages.length} 页</span></div>}
                open={previewSlide.visible} onCancel={() => setPreviewSlide(prev => ({ ...prev, visible: false }))} width="90%"
                footer={<div className="flex items-center justify-between"><Button disabled={previewSlide.index === 0} onClick={() => setPreviewSlide(prev => ({ ...prev, index: prev.index - 1 }))}>上一页</Button><span className="text-sm text-gray-500">点击左右按钮翻页</span><Button disabled={previewSlide.index >= previewSlide.pages.length - 1} onClick={() => setPreviewSlide(prev => ({ ...prev, index: prev.index + 1 }))}>下一页</Button></div>}
                style={{ top: 20 }}>
                <div className="bg-slate-100 rounded-lg p-4 flex items-center justify-center" style={{ minHeight: "70vh" }}>
                    {previewSlide.pages[previewSlide.index] && <img src={previewSlide.pages[previewSlide.index].img} alt={previewSlide.pages[previewSlide.index].title} className="max-w-full max-h-[70vh] object-contain rounded shadow-lg" />}
                </div>
            </Modal>

            <Modal title="图纸全屏预览" open={showPdfViewer} onCancel={() => setShowPdfViewer(false)} width="90%" footer={null} style={{ top: 20 }}>
                <iframe src={uploadedPdfUrl} className="w-full border-0 rounded" style={{ height: "80vh" }} title="CAD 图纸" />
            </Modal>

            <Modal title={<span className="flex items-center gap-2"><HistoryOutlined />历史图纸问题库</span>} open={showHistoryModal} onCancel={() => setShowHistoryModal(false)} width={850} footer={null}>
                <Input.Search placeholder="搜索历史问题..." className="mb-4" value={historySearch} onChange={e => setHistorySearch(e.target.value)} allowClear />
                <Table dataSource={filteredHistory} rowKey="id" pagination={false} size="small"
                    columns={[
                        { title: "编号", dataIndex: "id", width: 70 },
                        { title: "项目", dataIndex: "project", width: 60, render: (v: string) => <Tag>{v}</Tag> },
                        { title: "类别", dataIndex: "category", width: 90 },
                        { title: "问题描述", dataIndex: "description" },
                        { title: "解决方案", dataIndex: "resolution", render: (v: string) => <span className="text-green-700 text-xs">{v}</span> },
                        { title: "日期", dataIndex: "date", width: 80 },
                        { title: "", width: 80, render: (_: unknown, record: typeof HISTORY_ISSUES[0]) => (
                            <Button size="small" type="primary" ghost icon={<LinkOutlined />} onClick={() => { message.success(`已关联历史问题 ${record.id}`); setShowHistoryModal(false) }}>关联</Button>
                        )},
                    ]}
                />
            </Modal>

            <Modal title="添加评审问题" open={showAddIssueModal} onCancel={() => setShowAddIssueModal(false)} okText="添加" onOk={handleAddIssue} width={650}>
                <Form layout="vertical" className="mt-4">
                    <Row gutter={16}>
                        <Col span={8}><Form.Item label="图纸页码"><Input placeholder="例: P7" value={newIssue.pptPage} onChange={e => setNewIssue(p => ({ ...p, pptPage: e.target.value }))} /></Form.Item></Col>
                        <Col span={8}><Form.Item label="FAI/SPC"><Input placeholder="例: FAI-06" value={newIssue.faiSpc} onChange={e => setNewIssue(p => ({ ...p, faiSpc: e.target.value }))} /></Form.Item></Col>
                        <Col span={8}><Form.Item label="严重性"><Select value={newIssue.severity} onChange={v => setNewIssue(p => ({ ...p, severity: v }))} options={[{ label: "严重", value: "critical" }, { label: "重要", value: "major" }, { label: "一般", value: "minor" }]} /></Form.Item></Col>
                    </Row>
                    <Form.Item label="问题类别"><Select value={newIssue.category} onChange={v => setNewIssue(p => ({ ...p, category: v }))} options={["尺寸公差", "基准选择", "尺寸标注", "表面粗糙度", "标注规范", "材料标注", "GD&T", "装配间隙", "2D/3D 尺寸不匹配"].map(v => ({ label: v, value: v }))} /></Form.Item>
                    <Form.Item label="问题描述" required><TextArea rows={2} value={newIssue.description} onChange={e => setNewIssue(p => ({ ...p, description: e.target.value }))} placeholder="描述图纸中发现的问题..." /></Form.Item>
                    <Form.Item label="图纸规格"><Input value={newIssue.drawingSpec} onChange={e => setNewIssue(p => ({ ...p, drawingSpec: e.target.value }))} placeholder="例: 2.00±0.05mm" /></Form.Item>
                    <Form.Item label="建议方案"><TextArea rows={2} value={newIssue.suggestion} onChange={e => setNewIssue(p => ({ ...p, suggestion: e.target.value }))} placeholder="您的建议修改方案..." /></Form.Item>
                </Form>
            </Modal>

            <Modal title={`编辑问题 #${editingIssue?.seqNo}`} open={!!editingIssue} onCancel={() => setEditingIssue(null)} okText="保存" onOk={handleSaveEdit} width={650}>
                {editingIssue && (
                    <Form layout="vertical" className="mt-4">
                        <Row gutter={16}>
                            <Col span={8}><Form.Item label="图纸页码"><Input value={editingIssue.pptPage} onChange={e => setEditingIssue(p => p ? { ...p, pptPage: e.target.value } : null)} /></Form.Item></Col>
                            <Col span={8}><Form.Item label="FAI/SPC"><Input value={editingIssue.faiSpc} onChange={e => setEditingIssue(p => p ? { ...p, faiSpc: e.target.value } : null)} /></Form.Item></Col>
                            <Col span={8}><Form.Item label="严重性"><Select value={editingIssue.severity} onChange={v => setEditingIssue(p => p ? { ...p, severity: v } : null)} options={[{ label: "严重", value: "critical" }, { label: "重要", value: "major" }, { label: "一般", value: "minor" }]} /></Form.Item></Col>
                        </Row>
                        <Form.Item label="问题类别"><Select value={editingIssue.category} onChange={v => setEditingIssue(p => p ? { ...p, category: v } : null)} options={["尺寸公差", "基准选择", "尺寸标注", "表面粗糙度", "标注规范", "材料标注", "GD&T", "装配间隙", "2D/3D 尺寸不匹配"].map(v => ({ label: v, value: v }))} /></Form.Item>
                        <Form.Item label="问题描述"><TextArea rows={2} value={editingIssue.description} onChange={e => setEditingIssue(p => p ? { ...p, description: e.target.value } : null)} /></Form.Item>
                        <Form.Item label="图纸规格"><Input value={editingIssue.drawingSpec} onChange={e => setEditingIssue(p => p ? { ...p, drawingSpec: e.target.value } : null)} /></Form.Item>
                        <Form.Item label="建议方案"><TextArea rows={2} value={editingIssue.suggestion} onChange={e => setEditingIssue(p => p ? { ...p, suggestion: e.target.value } : null)} /></Form.Item>
                        <Form.Item label="PD 意见"><TextArea rows={1} value={editingIssue.pdOpinion} onChange={e => setEditingIssue(p => p ? { ...p, pdOpinion: e.target.value } : null)} placeholder="PD 版门处理意见..." /></Form.Item>
                    </Form>
                )}
            </Modal>
        </div>
    )
}
