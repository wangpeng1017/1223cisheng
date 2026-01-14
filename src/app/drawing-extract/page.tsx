"use client"

import * as React from "react"
import {
    Table2,
    Upload,
    FileUp,
    History,
    User,
    Download,
    Trash2,
    Loader2,
    CheckCircle,
    AlertCircle,
    FileText,
    ChevronDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
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
    alternatives?: Alternative[]  // 备选数据块列表
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

// 测量类型对应的符号
// 测量类型对应的符号和颜色
const typeSymbolMap: Record<string, string> = {
    // 几何尺寸
    '线轮廓度': '⌒',
    '平面度': '▱',
    '平行度': '//',
    '圆角半径': 'R',
    '厚度/距离': '±',
    // 材料性能
    '磁通密度(Br)': 'Br',
    '矫顽力(Hcb)': 'Hcb',
    '矫顽力(Hcj)': 'Hcj',
    '最大能积(BHmax)': 'BH',
    '硬度': 'HV',
    // 表面处理
    '光泽度': 'GU',
    '粗糙度(Ra)': 'Ra',
    '颜色(L)': 'L*',
    '颜色(a)': 'a*',
    '颜色(b)': 'b*',
    // 工艺要求
    '外观检验': '👁',
    '盐雾测试': '🧪',
    '文本规格': '📝',
    '未识别': '-'
}

// 分类对应的颜色
const categoryColorMap: Record<string, { bg: string; text: string; border: string }> = {
    '几何尺寸': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    '材料性能': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
    '表面处理': { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
    '工艺要求': { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
    '未分类': { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200' },
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
            toast.error("仅支持PDF文件")
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
                toast.success(data.message, {
                    description: `文件: ${file.name}`
                })
            } else {
                toast.error("提取失败", {
                    description: data.detail || data.message
                })
            }
        } catch (error) {
            toast.error("网络错误", {
                description: "无法连接到后端服务，请确认服务已启动"
            })
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
                toast.info(`已加载: ${data.file_name}`)
            }
        } catch (error) {
            toast.error("加载详情失败")
        }
    }

    // 删除历史记录
    const deleteExtraction = async (id: number) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/extractions/${id}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                toast.success("删除成功")
                loadHistory()
                if (extractionId === id) {
                    setFaiData([])
                    setCurrentFileName("")
                    setExtractionId(null)
                }
            }
        } catch (error) {
            toast.error("删除失败")
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
        toast.success("CSV导出成功")
    }



    // 生成PPT
    const generatePPT = async () => {
        if (faiData.length === 0) {
            toast.error("没有可生成的数据")
            return
        }

        // 转换数据并打开预览对话框
        const data = transformAllData(faiData, currentFileName)
        setPptData(data)
        setShowPPTPreview(true)
    }

    // 确认生成PPT
    const handleConfirmGeneratePPT = async (data: PPTGenerationData) => {
        setIsGeneratingPPT(true)

        try {
            // 调用PPT生成API
            const res = await fetch('/api/generate-ppt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })

            const result = await res.json()

            if (res.ok) {
                toast.success("PPT生成成功", {
                    description: `共 ${result.pageCount} 页`
                })

                // 自动下载 - 使用完整URL
                const downloadUrl = `${window.location.origin}${result.downloadUrl}`
                const a = document.createElement('a')
                a.href = downloadUrl
                a.download = result.filename
                a.style.display = 'none'
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
            } else {
                toast.error("PPT生成失败", {
                    description: result.error || '未知错误'
                })
            }
        } catch (error) {
            console.error("生成PPT失败:", error)
            toast.error("PPT生成失败", {
                description: "请稍后重试"
            })
        } finally {
            setIsGeneratingPPT(false)
        }
    }


    // 切换到备选数据块（完整替换所有字段）
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
        toast.success(`FAI ${faiData[index].fai_num} 已切换为 ${alt.measure_type}`)
    }

    return (
        <div className="flex flex-col h-screen bg-slate-50/50">
            {/* Toolbar */}
            <div className="h-16 border-b bg-white px-6 flex items-center justify-between shadow-sm flex-shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Table2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">图纸信息提取</h2>
                        <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">Drawing FAI Data Extraction</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Dialog open={showHistory} onOpenChange={(open) => { setShowHistory(open); if (open) loadHistory(); }}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 gap-2 border-slate-200">
                                <History className="h-4 w-4" />
                                历史记录
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>提取历史记录</DialogTitle>
                                <DialogDescription>查看和管理之前提取的PDF文件</DialogDescription>
                            </DialogHeader>
                            <div className="max-h-[400px] overflow-y-auto">
                                {history.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400">
                                        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                        <p>暂无历史记录</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>文件名</TableHead>
                                                <TableHead>提取时间</TableHead>
                                                <TableHead>FAI数量</TableHead>
                                                <TableHead className="text-right">操作</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {history.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-medium">{item.file_name}</TableCell>
                                                    <TableCell className="text-slate-500 text-xs">
                                                        {new Date(item.upload_time).toLocaleString('zh-CN')}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary">{item.item_count} 条</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => loadExtractionDetail(item.id)}
                                                        >
                                                            查看
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-500 hover:text-red-600"
                                                            onClick={() => deleteExtraction(item.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                    <div className="h-8 w-[1px] bg-slate-200 mx-2" />
                    <User className="h-8 w-8 rounded-full bg-slate-100 p-1.5 text-slate-600 border border-slate-200 shadow-sm" />
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-6">
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Upload Area */}
                    <Card className="border-2 border-dashed hover:border-primary/50 transition-colors">
                        <CardContent className="p-8">
                            <div
                                className={`flex flex-col items-center justify-center py-12 rounded-xl transition-all cursor-pointer ${isDragging ? 'bg-primary/5 border-primary' : 'bg-slate-50/50'
                                    }`}
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
                                        <Loader2 className="h-16 w-16 text-primary mb-4 animate-spin" />
                                        <p className="text-lg font-bold text-slate-700">正在解析PDF...</p>
                                        <p className="text-sm text-slate-500 mt-1">{currentFileName}</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                            <FileUp className="h-10 w-10 text-primary" />
                                        </div>
                                        <p className="text-lg font-bold text-slate-700">拖拽PDF文件到此处，或点击上传</p>
                                        <p className="text-sm text-slate-400 mt-2">支持工程图纸PDF格式，自动提取FAI尺寸数据</p>
                                        <Button variant="outline" className="mt-4 gap-2">
                                            <Upload className="h-4 w-4" />
                                            选择文件
                                        </Button>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Results Table */}
                    {faiData.length > 0 && (
                        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <CardHeader className="flex flex-row items-center justify-between pb-4">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                                        FAI数据提取结果
                                    </CardTitle>
                                    <CardDescription className="mt-1">
                                        文件: {currentFileName} | 共提取 {faiData.length} 条FAI数据
                                    </CardDescription>
                                </div>
                                <Button variant="outline" size="sm" className="gap-2" onClick={exportCSV}>
                                    <Download className="h-4 w-4" />
                                    导出CSV
                                </Button>
                                <Button variant="default" size="sm" className="gap-2" onClick={generatePPT} disabled={isGeneratingPPT}>
                                    {isGeneratingPPT ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <FileText className="h-4 w-4" />
                                    )}
                                    {isGeneratingPPT ? '生成中...' : '生成PPT'}
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-lg border overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead className="w-[80px] font-bold">FAI编号</TableHead>
                                                <TableHead className="w-[80px] font-bold">SPC编号</TableHead>
                                                <TableHead className="w-[90px] font-bold">分类</TableHead>
                                                <TableHead className="font-bold">标准值(NOM)</TableHead>
                                                <TableHead className="font-bold">上公差</TableHead>
                                                <TableHead className="font-bold">下公差</TableHead>
                                                <TableHead className="w-[60px] font-bold">符号</TableHead>
                                                <TableHead className="w-[100px] font-bold">测量类型</TableHead>
                                                <TableHead className="font-bold">尺寸描述</TableHead>
                                                <TableHead className="w-[60px] font-bold">页码</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {faiData.map((item, index) => {
                                                const { distance } = parseAlternatives(item.description)

                                                return (
                                                    <TableRow key={index} className="hover:bg-slate-50/50">
                                                        <TableCell className="font-bold text-primary">{item.fai_num}</TableCell>
                                                        <TableCell>
                                                            {item.spc ? (
                                                                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                                                                    {item.spc}
                                                                </Badge>
                                                            ) : '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {item.category ? (
                                                                <Badge
                                                                    variant="outline"
                                                                    className={
                                                                        item.category === '几何尺寸' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                                                        item.category === '材料性能' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                                        item.category === '表面处理' ? 'bg-green-50 text-green-600 border-green-200' :
                                                                        item.category === '工艺要求' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                                                                        'bg-slate-50 text-slate-500 border-slate-200'
                                                                    }
                                                                >
                                                                    {item.category}
                                                                </Badge>
                                                            ) : '-'}
                                                        </TableCell>
                                                        <TableCell className="font-mono">{item.nom || '-'}</TableCell>
                                                        <TableCell className="font-mono text-emerald-600">{item.upper_tol || '-'}</TableCell>
                                                        <TableCell className="font-mono text-rose-600">{item.lower_tol || '-'}</TableCell>
                                                        <TableCell className="font-mono text-lg text-amber-600 font-bold">{item.symbol || '-'}</TableCell>
                                                        <TableCell>
                                                            {item.alternatives && item.alternatives.length > 0 ? (
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="h-7 gap-1 bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100"
                                                                        >
                                                                            {item.measure_type}
                                                                            <ChevronDown className="h-3 w-3" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="start">
                                                                        <DropdownMenuItem className="text-purple-600 font-medium cursor-default">
                                                                            ✓ {item.measure_type} (当前)
                                                                        </DropdownMenuItem>
                                                                        {item.alternatives.map((alt, altIdx) => (
                                                                            <DropdownMenuItem
                                                                                key={altIdx}
                                                                                onClick={() => switchToAlternative(index, alt)}
                                                                                className="text-slate-600"
                                                                            >
                                                                                {alt.measure_type} (距离:{alt.distance})
                                                                            </DropdownMenuItem>
                                                                        ))}
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            ) : item.measure_type ? (
                                                                <Badge variant="secondary" className="bg-purple-50 text-purple-600 border-purple-200">
                                                                    {item.measure_type}
                                                                </Badge>
                                                            ) : '-'}
                                                        </TableCell>
                                                        <TableCell className="text-slate-500 text-xs max-w-[200px] truncate" title={item.description || ''}>
                                                            {distance ? `距离:${distance}` : (item.description || '-')}
                                                        </TableCell>
                                                        <TableCell className="text-slate-400">{item.page || '-'}</TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Empty State */}
                    {!isUploading && faiData.length === 0 && (
                        <Card className="border-slate-200">
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <AlertCircle className="h-16 w-16 text-slate-200 mb-4" />
                                <p className="text-lg font-bold text-slate-400">暂无提取数据</p>
                                <p className="text-sm text-slate-400 mt-1">上传PDF图纸后，FAI数据将显示在此处</p>
                            </CardContent>
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


            </main>
        </div>
    )
}
