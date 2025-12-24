"use client"

import * as React from "react"
import {
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    Calendar,
    Users,
    AlertCircle,
    CheckCircle2,
    Clock,
    FileText,
    ChevronDown,
    ChevronRight,
    Upload,
    UserCircle,
    Package,
    History
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const projects = [
    {
        id: "NPI-2025-001",
        name: "新一代磁声传感单元 (Gen3)",
        productName: "磁性传感器组件",
        productCode: "MC-S-003",
        manager: "张晓刚",
        creator: "李明",
        createdAt: "2024-12-01",
        deadline: "2025-03-20",
        status: "进行中",
        progress: 65,
        risk: "低",
        subTasks: [
            { name: "图纸评审", owner: "张晓刚", progress: 100, status: "已完成" },
            { name: "MTD 检测", owner: "赵敏", progress: 45, status: "进行中" },
            { name: "Q-Plan 制定", owner: "王文", progress: 20, status: "进行中" }
        ]
    },
    {
        id: "NPI-2025-002",
        name: "超薄型穿戴式扬声器组件",
        productName: "微型扬声器",
        productCode: "SPK-W-012",
        manager: "王利敏",
        creator: "周建",
        createdAt: "2024-11-15",
        deadline: "2024-12-20", // Overdue
        status: "延期",
        progress: 15,
        risk: "高",
        subTasks: [
            { name: "图纸评审", owner: "王利敏", progress: 30, status: "进行中" },
            { name: "MTD 检测", owner: "李华", progress: 0, status: "未开始" }
        ]
    },
    {
        id: "NPI-2025-003",
        name: "车规级高频磁路系统",
        productName: "磁路总成",
        productCode: "AUT-M-99",
        manager: "刘强",
        creator: "王博",
        createdAt: "2024-12-10",
        deadline: "2025-01-05", // Approaching/Warning
        status: "预警",
        progress: 92,
        risk: "中",
        subTasks: [
            { name: "图纸评审", owner: "刘强", progress: 100, status: "已完成" },
            { name: "MTD 检测", owner: "刘强", progress: 95, status: "进行中" }
        ]
    },
    {
        id: "NPI-2024-098",
        name: "AI 降噪模组 B 版本",
        productName: "AI 降噪模组",
        productCode: "AI-ENC-B",
        manager: "陈思思",
        creator: "陈思思",
        createdAt: "2024-10-01",
        deadline: "2024-12-01",
        status: "已完成",
        progress: 100,
        risk: "低",
        subTasks: [
            { name: "图纸评审", owner: "陈思思", progress: 100, status: "已完成" },
            { name: "MTD 检测", owner: "张三", progress: 100, status: "已完成" }
        ]
    },
]

export default function ProjectsPage() {
    const [expandedRows, setExpandedRows] = React.useState<string[]>([])

    const [searchTerm, setSearchTerm] = React.useState("")
    const [projectList, setProjectList] = React.useState(projects)
    const [statusFilter, setStatusFilter] = React.useState("all")

    const filteredProjects = projectList.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.manager.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = statusFilter === "all" ||
            (statusFilter === "active" && p.status === "进行中") ||
            (statusFilter === "warning" && p.status === "预警") ||
            (statusFilter === "overdue" && p.status === "延期") ||
            (statusFilter === "done" && p.status === "已完成")

        return matchesSearch && matchesStatus
    })

    const toggleRow = (id: string) => {
        setExpandedRows(prev => {
            const isExpanding = !prev.includes(id)
            if (isExpanding) {
                toast.info(`正在加载项目 ${id} 的子任务详情...`)
            }
            return isExpanding ? [...prev, id] : prev.filter(rowId => rowId !== id)
        })
    }

    const getStatusStyles = (status: string) => {
        switch (status) {
            case "延期": return "bg-rose-50 text-rose-600 border-rose-200"
            case "预警": return "bg-amber-50 text-amber-600 border-amber-200"
            case "已完成": return "bg-emerald-50 text-emerald-600 border-emerald-200"
            default: return "bg-blue-50 text-blue-600 border-blue-200"
        }
    }

    return (
        <div className="p-8 space-y-8 bg-slate-50/30 min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">项目管理</h1>
                    <p className="text-muted-foreground mt-1 font-medium">NPI 核心项目台账：支持多维度追踪、负责人指派与状态预警</p>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
                            <Plus className="h-4 w-4" />
                            创建新项目
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[650px] bg-white">
                        <DialogHeader>
                            <DialogTitle className="text-xl">初始化 NPI 研发项目</DialogTitle>
                            <DialogDescription>
                                请填写项目基本信息及各环节业务负责人。
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-6 py-6 border-y border-slate-100 my-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="font-bold">项目名称</Label>
                                    <Input id="name" placeholder="输入项目完整名称" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="code" className="font-bold">项目代号</Label>
                                    <Input id="code" placeholder="NPI-XXXX" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="product-name" className="font-bold">产品名称</Label>
                                    <Input id="product-name" placeholder="关联产品名" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="product-code" className="font-bold">产品代号</Label>
                                    <Input id="product-code" placeholder="P-XXXX" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Label className="font-bold text-sm text-slate-500">业务负责人指派</Label>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-4 bg-slate-50 p-4 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium">图纸评审 (DR)</span>
                                        <Input className="h-8 w-32 bg-white" placeholder="指派负责人" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium">MTD 检测</span>
                                        <Input className="h-8 w-32 bg-white" placeholder="指派负责人" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium">Q-Plan 制定</span>
                                        <Input className="h-8 w-32 bg-white" placeholder="指派负责人" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium">IQC 计划</span>
                                        <Input className="h-8 w-32 bg-white" placeholder="指派负责人" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold">附件上传 (图纸/方案)</Label>
                                <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer">
                                    <Upload className="h-8 w-8 text-slate-400" />
                                    <p className="text-xs text-slate-500">点击或通过拖拽上传项目相关技术文件</p>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => toast.info("草稿已保存")}>暂存草稿</Button>
                            <Button onClick={() => toast.success("项目创建成功", { description: "相关子任务已同步分发至各环节负责人。" })}>提交创建</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="检索项目代号、名称、负责人..."
                        className="pl-9 bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px] bg-slate-50 border-none">
                        <SelectValue placeholder="项目状态" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">全部状态</SelectItem>
                        <SelectItem value="active">进行中</SelectItem>
                        <SelectItem value="warning">预警中</SelectItem>
                        <SelectItem value="overdue">已延期</SelectItem>
                        <SelectItem value="done">已完成</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="outline" className="gap-2 border-slate-200 hover:bg-slate-50">
                    <Filter className="h-4 w-4" />
                    高级筛选
                </Button>
            </div>

            <Card className="bg-white border-slate-200 shadow-sm overflow-hidden rounded-xl">
                <Table>
                    <TableHeader className="bg-slate-50/80">
                        <TableRow className="hover:bg-transparent border-slate-100">
                            <TableHead className="w-[48px]"></TableHead>
                            <TableHead className="w-[120px] font-bold text-slate-800">项目代号</TableHead>
                            <TableHead className="font-bold text-slate-800">项目/产品信息</TableHead>
                            <TableHead className="font-bold text-slate-800 w-[100px]">负责人</TableHead>
                            <TableHead className="font-bold text-slate-800">创建信息</TableHead>
                            <TableHead className="font-bold text-slate-800">截止日期</TableHead>
                            <TableHead className="font-bold text-slate-800">执行进度</TableHead>
                            <TableHead className="text-right font-bold text-slate-800">状态</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProjects.map((project) => (
                            <React.Fragment key={project.id}>
                                <TableRow
                                    className={`border-slate-50 transition-colors group ${project.status === "延期" ? "bg-rose-50/30 hover:bg-rose-50/50" :
                                        project.status === "预警" ? "bg-amber-50/30 hover:bg-amber-50/50" : "hover:bg-slate-50"
                                        }`}
                                >
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => toggleRow(project.id)}
                                        >
                                            {expandedRows.includes(project.id) ? (
                                                <ChevronDown className="h-4 w-4" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs font-bold text-primary">{project.id}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900">{project.name}</span>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Badge variant="secondary" className="text-[10px] h-4 font-normal bg-slate-100">{project.productName}</Badge>
                                                <span className="text-[10px] text-slate-400 font-mono">{project.productCode}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <UserCircle className="h-4 w-4 text-slate-400" />
                                            <span className="text-sm font-medium">{project.manager}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-[10px]">
                                            <span className="text-slate-500">创建人: {project.creator}</span>
                                            <span className="text-slate-400">{project.createdAt}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-xs font-medium">
                                            <Calendar className={`h-3 w-3 ${project.status === '延期' ? 'text-rose-500' : 'text-slate-400'}`} />
                                            <span className={project.status === '延期' ? 'text-rose-600 font-bold' : ''}>{project.deadline}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="w-[150px]">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex justify-between text-[10px] font-bold">
                                                <span>{project.progress}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${project.status === "延期" ? "bg-rose-500" :
                                                        project.status === "预警" ? "bg-amber-500" : "bg-primary"
                                                        }`}
                                                    style={{ width: `${project.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge className={`font-bold ${getStatusStyles(project.status)}`}>
                                            {project.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                                {expandedRows.includes(project.id) && (
                                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                        <TableCell colSpan={8} className="p-4">
                                            <div className="grid grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2">
                                                {project.subTasks.map((task, i) => (
                                                    <div key={i} className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-col gap-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs font-bold text-slate-700">{task.name}</span>
                                                            <Badge variant="outline" className="text-[9px] h-4">{task.status}</Badge>
                                                        </div>
                                                        <div className="flex items-center justify-between text-[10px]">
                                                            <span className="text-slate-500">负责人: {task.owner}</span>
                                                            <span className="font-mono">{task.progress}%</span>
                                                        </div>
                                                        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-primary/60 rounded-full"
                                                                style={{ width: `${task.progress}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-auto py-2 border border-dashed border-slate-200 text-slate-400 hover:text-primary hover:border-primary flex flex-col items-center justify-center gap-1"
                                                    onClick={() => toast.promise(new Promise(r => setTimeout(r, 800)), {
                                                        loading: "加载工单模版...",
                                                        success: "正在跳转至任务执行页",
                                                        error: "无执行权限"
                                                    })}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                    <span className="text-[10px]">添加子任务</span>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </React.Fragment>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
                <div className="text-sm text-slate-500">
                    共显示 <span className="font-bold text-slate-900">4</span> 条项目记录
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 gap-2" onClick={() => toast.success("正在导出项目进度明细...")}>
                        <FileText className="h-3 w-3" />
                        导出明细
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 gap-2" onClick={() => toast.info("加载历史回溯...")}>
                        <History className="h-3 w-3" />
                        进度回溯
                    </Button>
                </div>
            </div>
        </div >
    )
}
