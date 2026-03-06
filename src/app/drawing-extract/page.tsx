"use client"

import * as React from "react"
import {
    TableOutlined,
    UploadOutlined,
    CloudUploadOutlined,
    HistoryOutlined,
    UserOutlined,
    DownloadOutlined,
    DeleteOutlined,
    LoadingOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    FileTextOutlined,
    DownOutlined,
} from "@ant-design/icons"
import { Button, Tag, Card, Table, Modal, App, Dropdown } from "antd"
import type { TableProps, MenuProps } from "antd"
import { PPTPreviewDialog } from "@/components/ppt/PPTPreviewDialog"
import { transformAllData } from "@/lib/services/ppt-data-transformer"
import type { PPTGenerationData } from "@/lib/types/ppt"

// API 基础URL - 生产环境需要修改
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"

interface Alternative {
    nom: string | null
    upper_tol: string | null
    lower_tol: string | null
    symbol: string | null
    measure_type: string
    category: string
    distance: number
    description: string | null
}

interface FAIItem {
    fai_num: number
    spc: string | null
    nom: string | null
    upper_tol: string | null
    lower_tol: string | null
    symbol: string | null
    measure_type: string | null
    description: string | null
    page: number | null
    category: string | null
    alternatives?: Alternative[]
}

interface ExtractionHistory {
    id: number
    file_name: string
    upload_time: string
    created_by: string | null
    item_count: number
}

// 解析备选项
function parseAlternatives(description: string | null): { distance: string; alternatives: { type: string; dist: string }[] } {
    if (!description) return { distance: '', alternatives: [] }

    const distMatch = description.match(/距离:(\d+)/)
    const distance = distMatch ? distMatch[1] : ''

    const altMatch = description.match(/备选:(.+)$/)
    if (!altMatch) return { distance, alternatives: [] }

    const altStr = altMatch[1]
    const alternatives: { type: string; dist: string }[] = []
    const regex = /([^,()]+)\((\d+)\)/g
    let match
    while ((match = regex.exec(altStr)) !== null) {
        alternatives.push({ type: match[1].trim(), dist: match[2] })
    }

    return { distance, alternatives }
}

export default function DrawingExtractPage() {
    const [isDragging, setIsDragging] = React.useState(false)
    const [isUploading, setIsUploading] = React.useState(false)
    const [faiData, setFaiData] = React.useState<FAIItem[]>([])
    const [currentFileName, setCurrentFileName] = React.useState<string>("")
    const [extractionId, setExtractionId] = React.useState<number | null>(null)
    const [history, setHistory] = React.useState<ExtractionHistory[]>([])
    const [showHistory, setShowHistory] = React.useState(false)
    const [isGeneratingPPT, setIsGeneratingPPT] = React.useState(false)
    const [showPPTPreview, setShowPPTPreview] = React.useState(false)
    const [pptData, setPptData] = React.useState<PPTGenerationData | null>(null)
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const { message } = App.useApp()

    // 加载历史记录
    const loadHistory = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/extractions`)
            if (res.ok) {
                const data = await res.json()
                setHistory(data)
            }
        } catch (error) {
            console.error("加载历史失败:", error)
        }
    }

    // 上传并提取PDF
    const handleUpload = async (file: File) => {
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            message.error("仅支持PDF文件")
            return
        }

        setIsUploading(true)
        setCurrentFileName(file.name)
        setFaiData([])

        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch(`${API_BASE_URL}/api/extract`, {
                method: 'POST',
                body: formData,
            })

            const data = await res.json()

            if (res.ok && data.success) {
                setFaiData(data.items)
                setExtractionId(data.extraction_id)
                message.success(`${data.message} | 文件: ${file.name}`)
            } else {
                message.error(data.detail || data.message || "提取失败")
            }
        } catch (error) {
            message.error("网络错误：无法连接到后端服务，请确认服务已启动")
            console.error("上传失败:", error)
        } finally {
            setIsUploading(false)
        }
    }

    // 拖拽处理
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) {
            handleUpload(file)
        }
    }

    // 文件选择处理
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            handleUpload(file)
        }
    }

    // 查看历史记录详情
    const loadExtractionDetail = async (id: number) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/extractions/${id}`)
            if (res.ok) {
                const data = await res.json()
                setFaiData(data.items)
                setCurrentFileName(data.file_name)
                setExtractionId(id)
                setShowHistory(false)
                message.info(`已加载: ${data.file_name}`)
            }
        } catch (error) {
            message.error("加载详情失败")
        }
    }

    // 删除历史记录
    const deleteExtraction = async (id: number) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/extractions/${id}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                message.success("删除成功")
                loadHistory()
                if (extractionId === id) {
                    setFaiData([])
                    setCurrentFileName("")
                    setExtractionId(null)
                }
            }
        } catch (error) {
            message.error("删除失败")
        }
    }

    // 导出CSV
    const exportCSV = () => {
        if (faiData.length === 0) return

        const headers = ["FAI编号", "SPC编号", "分类", "标准值(NOM)", "上公差", "下公差", "符号", "测量类型", "尺寸描述", "页码"]
        const rows = faiData.map(item => [
            item.fai_num,
            item.spc || '-',
            item.category || '-',
            item.nom || '-',
            item.upper_tol || '-',
            item.lower_tol || '-',
            item.symbol || '-',
            item.measure_type || '-',
            item.description || '-',
            item.page || '-'
        ])

        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `FAI_${currentFileName.replace('.pdf', '')}_${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
        message.success("CSV导出成功")
    }

    // 生成PPT
    const generatePPT = async () => {
        if (faiData.length === 0) {
            message.error("没有可生成的数据")
            return
        }

        const data = transformAllData(faiData, currentFileName)
        setPptData(data)
        setShowPPTPreview(true)
    }

    // 确认生成PPT
    const handleConfirmGeneratePPT = async (data: PPTGenerationData) => {
        setIsGeneratingPPT(true)

        try {
            const res = await fetch('/api/generate-ppt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })

            const result = await res.json()

            if (res.ok) {
                message.success(`PPT生成成功，共 ${result.pageCount} 页`)

                const downloadUrl = `${window.location.origin}${result.downloadUrl}`
                const a = document.createElement('a')
                a.href = downloadUrl
                a.download = result.filename
                a.style.display = 'none'
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
            } else {
                message.error(result.error || 'PPT生成失败')
            }
        } catch (error) {
            console.error("生成PPT失败:", error)
            message.error("PPT生成失败，请稍后重试")
        } finally {
            setIsGeneratingPPT(false)
        }
    }

    // 切换到备选数据块
    const switchToAlternative = (index: number, alt: Alternative) => {
        setFaiData(prev => prev.map((item, i) => {
            if (i === index) {
                return {
                    ...item,
                    nom: alt.nom,
                    upper_tol: alt.upper_tol,
                    lower_tol: alt.lower_tol,
                    symbol: alt.symbol,
                    measure_type: alt.measure_type,
                    category: alt.category
                }
            }
            return item
        }))
        message.success(`FAI ${faiData[index].fai_num} 已切换为 ${alt.measure_type}`)
    }

    // 历史记录表格列
    const historyColumns: TableProps<ExtractionHistory>["columns"] = [
        { title: "文件名", dataIndex: "file_name", render: (t: string) => <span className="font-medium">{t}</span> },
        { title: "提取时间", dataIndex: "upload_time", render: (t: string) => <span className="text-slate-500 text-xs">{new Date(t).toLocaleString('zh-CN')}</span> },
        { title: "FAI数量", dataIndex: "item_count", render: (t: number) => <Tag>{t} 条</Tag> },
        {
            title: "操作", key: "action", align: "right", render: (_, record) => (
                <div className="flex gap-1 justify-end">
                    <Button type="link" size="small" onClick={() => loadExtractionDetail(record.id)}>查看</Button>
                    <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => deleteExtraction(record.id)} />
                </div>
            )
        },
    ]

    // FAI 数据表格列
    const faiColumns: TableProps<FAIItem>["columns"] = [
        { title: "FAI编号", dataIndex: "fai_num", width: 80, render: (t: number) => <span className="font-bold text-blue-600">{t}</span> },
        {
            title: "SPC编号", dataIndex: "spc", width: 80, render: (t: string | null) => t ? (
                <Tag color="blue">{t}</Tag>
            ) : '-'
        },
        {
            title: "分类", dataIndex: "category", width: 90, render: (t: string | null) => {
                if (!t) return '-'
                const colorMap: Record<string, string> = {
                    '几何尺寸': 'blue', '材料性能': 'gold', '表面处理': 'green', '工艺要求': 'purple'
                }
                return <Tag color={colorMap[t] || 'default'}>{t}</Tag>
            }
        },
        { title: "标准值(NOM)", dataIndex: "nom", render: (t: string | null) => <span className="font-mono">{t || '-'}</span> },
        { title: "上公差", dataIndex: "upper_tol", render: (t: string | null) => <span className="font-mono text-emerald-600">{t || '-'}</span> },
        { title: "下公差", dataIndex: "lower_tol", render: (t: string | null) => <span className="font-mono text-rose-600">{t || '-'}</span> },
        { title: "符号", dataIndex: "symbol", width: 60, render: (t: string | null) => <span className="font-mono text-lg text-amber-600 font-bold">{t || '-'}</span> },
        {
            title: "测量类型", dataIndex: "measure_type", width: 100, render: (t: string | null, record: FAIItem, index: number) => {
                if (record.alternatives && record.alternatives.length > 0) {
                    const items: MenuProps['items'] = [
                        { key: 'current', label: `✓ ${t} (当前)`, disabled: true },
                        ...record.alternatives.map((alt, altIdx) => ({
                            key: `alt-${altIdx}`,
                            label: `${alt.measure_type} (距离:${alt.distance})`,
                            onClick: () => switchToAlternative(index, alt)
                        }))
                    ]
                    return (
                        <Dropdown menu={{ items }} trigger={['click']}>
                            <Button size="small" className="bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100">
                                {t} <DownOutlined style={{ fontSize: 10 }} />
                            </Button>
                        </Dropdown>
                    )
                }
                return t ? <Tag color="purple">{t}</Tag> : '-'
            }
        },
        {
            title: "尺寸描述", dataIndex: "description", render: (t: string | null) => {
                const { distance } = parseAlternatives(t)
                return <span className="text-slate-500 text-xs truncate max-w-[200px] inline-block" title={t || ''}>{distance ? `距离:${distance}` : (t || '-')}</span>
            }
        },
        { title: "页码", dataIndex: "page", width: 60, render: (t: number | null) => <span className="text-slate-400">{t || '-'}</span> },
    ]

    return (
        <div className="flex flex-col h-screen bg-slate-50/50">
            {/* 工具栏 */}
            <div className="h-16 border-b bg-white px-6 flex items-center justify-between shadow-sm flex-shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <TableOutlined className="text-blue-600" style={{ fontSize: 20 }} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">图纸信息提取</h2>
                        <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">Drawing FAI Data Extraction</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button size="small" icon={<HistoryOutlined />} onClick={() => { setShowHistory(true); loadHistory() }}>
                        历史记录
                    </Button>
                    <div className="h-8 w-[1px] bg-slate-200 mx-2" />
                    <UserOutlined className="h-8 w-8 text-lg rounded-full bg-slate-100 p-1.5 text-slate-600 border border-slate-200 shadow-sm" />
                </div>
            </div>

            {/* 主内容 */}
            <main className="flex-1 overflow-y-auto p-6">
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* 上传区域 */}
                    <Card className="border-2 border-dashed hover:border-blue-300 transition-colors">
                        <div
                            className={`flex flex-col items-center justify-center py-12 rounded-xl transition-all cursor-pointer ${isDragging ? 'bg-blue-50 border-blue-500' : 'bg-slate-50/50'}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf"
                                className="hidden"
                                onChange={handleFileSelect}
                            />

                            {isUploading ? (
                                <>
                                    <LoadingOutlined style={{ fontSize: 64 }} className="text-blue-600 mb-4" spin />
                                    <p className="text-lg font-bold text-slate-700">正在解析PDF...</p>
                                    <p className="text-sm text-slate-500 mt-1">{currentFileName}</p>
                                </>
                            ) : (
                                <>
                                    <div className="h-20 w-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                                        <CloudUploadOutlined style={{ fontSize: 40 }} className="text-blue-600" />
                                    </div>
                                    <p className="text-lg font-bold text-slate-700">拖拽PDF文件到此处，或点击上传</p>
                                    <p className="text-sm text-slate-400 mt-2">支持工程图纸PDF格式，自动提取FAI尺寸数据</p>
                                    <Button icon={<UploadOutlined />} className="mt-4">
                                        选择文件
                                    </Button>
                                </>
                            )}
                        </div>
                    </Card>

                    {/* 结果表格 */}
                    {faiData.length > 0 && (
                        <Card>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <CheckCircleOutlined className="text-emerald-500" />
                                        FAI数据提取结果
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-1">
                                        文件: {currentFileName} | 共提取 {faiData.length} 条FAI数据
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button icon={<DownloadOutlined />} onClick={exportCSV}>导出CSV</Button>
                                    <Button type="primary" icon={isGeneratingPPT ? <LoadingOutlined /> : <FileTextOutlined />} onClick={generatePPT} disabled={isGeneratingPPT}>
                                        {isGeneratingPPT ? '生成中...' : '生成PPT'}
                                    </Button>
                                </div>
                            </div>
                            <Table
                                dataSource={faiData}
                                columns={faiColumns}
                                rowKey={(_, index) => String(index)}
                                pagination={false}
                                size="small"
                                scroll={{ x: true }}
                            />
                        </Card>
                    )}

                    {/* 空状态 */}
                    {!isUploading && faiData.length === 0 && (
                        <Card>
                            <div className="flex flex-col items-center justify-center py-16">
                                <ExclamationCircleOutlined style={{ fontSize: 64 }} className="text-slate-200 mb-4" />
                                <p className="text-lg font-bold text-slate-400">暂无提取数据</p>
                                <p className="text-sm text-slate-400 mt-1">上传PDF图纸后，FAI数据将显示在此处</p>
                            </div>
                        </Card>
                    )}
                </div>

                {/* PPT预览对话框 */}
                {pptData && (
                    <PPTPreviewDialog
                        open={showPPTPreview}
                        onOpenChange={setShowPPTPreview}
                        data={pptData}
                        onConfirm={handleConfirmGeneratePPT}
                        isGenerating={isGeneratingPPT}
                    />
                )}

                {/* 历史记录弹窗 */}
                <Modal
                    title="提取历史记录"
                    open={showHistory}
                    onCancel={() => setShowHistory(false)}
                    footer={null}
                    width={700}
                >
                    {history.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                            <FileTextOutlined style={{ fontSize: 48 }} className="mb-2 opacity-50" />
                            <p>暂无历史记录</p>
                        </div>
                    ) : (
                        <Table dataSource={history} columns={historyColumns} rowKey="id" pagination={false} />
                    )}
                </Modal>
            </main>
        </div>
    )
}
