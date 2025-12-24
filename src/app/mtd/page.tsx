"use client"

import * as React from "react"

import {
    ShieldCheck,
    Rss,
    FileText,
    History,
    PenTool,
    Scan,
    Maximize2,
    Printer,
    ChevronRight,
    Download,
    AlertCircle,
    LayoutDashboard,
    Magnet
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { toast } from "sonner"
import { SopWizard } from "@/components/mtd/sop-wizard"
import { MagneticInputCard } from "@/components/mtd/magnetic-input-card"

export default function MTDPage() {
    // J510 Mock Data Support
    const [activeProject, setActiveProject] = React.useState("J510")
    const [measurements, setMeasurements] = React.useState([
        { id: "S1", item: "中心磁通 (Center Gauss)", std: "435.0 ±15.0", actual: "442.2", result: "OK", type: "standard" },
        { id: "S1", item: "边际温差 (Ref Temp)", std: "25.0 ±1.0", actual: "25.1", result: "OK", type: "standard" },
    ])

    // Magnetic Special Characteristics State
    const [magnetData, setMagnetData] = React.useState<{ values: Record<string, number>, status: "OK" | "NG" }>({
        values: {},
        status: "OK"
    })

    const j510SopSteps = [
        {
            id: 1,
            title: "Reset Operation",
            description: "将夹具平放在线圈测试平台上后，按 'Reset' 键。",
            actionLabel: "完成归零"
        },
        {
            id: 2,
            title: "Zero Calibration",
            description: "等待 2 秒再按 'Zero' 键清零，准备测试。",
            warning: "确保周围 2.5 米内无移动金属物体。",
            actionLabel: "校准确认"
        },
        {
            id: 3,
            title: "Test Execution",
            description: "稳定地把治具从亥姆霍兹线圈中抽出，确保逃逸距离 > 600mm，再按 'Test' 键获取数据。",
            warning: "抽出速度需保持匀速。",
            actionLabel: "完成测试"
        }
    ]

    const j510MagneticSpecs = [
        { label: "Magnetic Angle (θz)", target: 30.96, tolerance: 3.00, unit: "deg" },
        { label: "Magnetic Moment", target: 9.72, tolerance: 0.68, unit: "uWb*cm" }
    ]

    const handleActualChange = (index: number, value: string) => {
        const newMeasurements = [...measurements]
        newMeasurements[index].actual = value

        // Basic mock logic for result
        const std = newMeasurements[index].std
        if (std.includes("±")) {
            const [nominallStr, rangeStr] = std.split("±")
            const nominal = parseFloat(nominallStr)
            const range = parseFloat(rangeStr)
            const actual = parseFloat(value)
            if (!isNaN(actual)) {
                if (actual >= (nominal - range) && actual <= (nominal + range)) {
                    newMeasurements[index].result = "OK"
                } else {
                    newMeasurements[index].result = "NG"
                }
            }
        }
        setMeasurements(newMeasurements)
    }

    const handleSubmit = () => {
        toast.promise(new Promise((r) => setTimeout(r, 1500)), {
            loading: '正在提交检测数据并生成 CPK 报告...',
            success: '数据已同步至 Q-Plan，任务状态更新为“已完成”',
            error: '提交失败，请检查量具连接状态',
        })
    }

    return (
        <div className="p-8 space-y-8 bg-background">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">MTD 检测执行</h1>
                    <p className="text-muted-foreground mt-1">精密测量任务分派、现场检测数据采集与 AI 辅助判定</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2">
                        <History className="h-4 w-4" />
                        历史报告
                    </Button>
                    <Button className="gap-2">
                        <Scan className="h-4 w-4" />
                        扫码领取任务
                    </Button>
                    <Button className="gap-2" onClick={() => toast.promise(new Promise((r) => setTimeout(r, 1500)), {
                        loading: '正在生成报告...',
                        success: '检测报告已导出至下载目录',
                        error: '导出失败',
                    })}>
                        <FileText className="h-4 w-4" />
                        导出检测报告
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-4">
                {/* Left Panel: Metrology & SOP */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="bg-card">
                        <CardHeader className="pb-3 px-4">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <PenTool className="h-4 w-4 text-primary" />
                                精密量具核查
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4 space-y-3">
                            {[
                                { name: "特斯拉计 #TS01", status: "已校准", expiry: "2026-01-10" },
                                { name: "数显千分尺 #MC08", status: "待点检", expiry: "2025-12-25" },
                            ].map((m, i) => (
                                <div key={i} className="p-3 rounded-lg bg-muted/40 border border-border flex flex-col gap-1">
                                    <span className="text-xs font-medium">{m.name}</span>
                                    <div className="flex justify-between items-center mt-1">
                                        <Badge variant="outline" className={`text-[9px] ${m.status === "已校准" ? "text-emerald-500 border-emerald-500/30" : "text-amber-500 border-amber-500/30"}`}>
                                            {m.status}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground">有效期: {m.expiry}</span>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {activeProject === "J510" && (
                        <SopWizard
                            steps={j510SopSteps}
                            onComplete={() => toast.success("SOP 执行完毕，已解锁磁学输入面板")}
                        />
                    )}

                    {activeProject !== "J510" && (
                        <Card className="bg-card">
                            <CardHeader className="pb-3 px-4 flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-primary" />
                                    检测 SOP
                                </CardTitle>
                                <Maximize2 className="h-3 w-3 text-muted-foreground cursor-pointer" />
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <div className="aspect-square rounded-lg bg-muted flex flex-col items-center justify-center text-center p-4 border border-dashed border-border">
                                    <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40 rounded mb-2" />
                                    <span className="text-[11px] text-muted-foreground leading-tight">请按照示意图进行测量：探头垂直于磁体中心表面 0.5mm 处停止。</span>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Center Panel: Data Entry */}
                <div className="lg:col-span-3 space-y-6">
                    <Card className="border-primary/30 bg-white shadow-sm ring-1 ring-primary/5">
                        <CardHeader className="flex flex-row items-center justify-between bg-slate-50 border-b border-border">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold shadow-sm">GT</div>
                                <div>
                                    <CardTitle className="text-md text-foreground">磁通密度检测任务 - B20251222-01</CardTitle>
                                    <CardDescription className="text-muted-foreground">关联项目: 新款磁体单元 Gen3 | 样本量: 5 PCS</CardDescription>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <Badge className="bg-primary text-white">执行中</Badge>
                                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">操作员: 张工人</span>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            {/* Special Characteristic for J510 */}
                            {activeProject === "J510" && (
                                <MagneticInputCard
                                    specs={j510MagneticSpecs}
                                    onChange={(vals, stat) => setMagnetData({ values: vals, status: stat })}
                                />
                            )}

                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                        <TableHead className="w-16 font-bold text-slate-700">编号</TableHead>
                                        <TableHead className="font-bold text-slate-700">测试项 (Test Item)</TableHead>
                                        <TableHead className="font-bold text-slate-700">标准值 (Nominal)</TableHead>
                                        <TableHead className="w-32 font-bold text-slate-700">实测值 (Actual)</TableHead>
                                        <TableHead className="w-24 font-bold text-slate-700">结果</TableHead>
                                        <TableHead className="text-right font-bold text-slate-700">趋势</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {measurements.map((row, i) => (
                                        <TableRow key={i} className="hover:bg-slate-50/50 border-border group transition-colors">
                                            <TableCell className="font-mono text-xs text-slate-500 font-medium">{row.id}</TableCell>
                                            <TableCell className="text-sm font-semibold text-slate-700">{row.item}</TableCell>
                                            <TableCell className="text-xs text-slate-500 font-mono italic">{row.std}</TableCell>
                                            <TableCell>
                                                <input
                                                    type="text"
                                                    value={row.actual}
                                                    onChange={(e) => handleActualChange(i, e.target.value)}
                                                    className={`w-full h-8 px-2 text-sm bg-white border rounded focus:ring-1 focus:ring-primary focus:border-primary outline-none shadow-sm ${row.result === 'NG' ? 'border-rose-500 text-rose-600' : 'border-border'
                                                        }`}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={`text-[10px] ${row.result === 'OK' ? 'bg-emerald-500' : 'bg-rose-500'} text-white`}>
                                                    {row.result}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-bold">
                                                <Rss className="h-4 w-4 ml-auto text-primary" />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <div className="flex justify-end gap-3 mt-6">
                                <Button variant="outline" onClick={() => toast.warning("任务已挂起", { description: "请填写异常原因并通知领班。" })}>异常挂起</Button>
                                <Button className="bg-primary hover:bg-primary/90" onClick={handleSubmit}>
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                    提交数据并生成报告
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">本任务实时 CPK 分布</CardTitle>
                            </CardHeader>
                            <CardContent className="h-40 flex items-center justify-center text-muted-foreground italic text-xs">
                                正态分布波动图加载中...
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm">异常一键触发 (Andon)</CardTitle>
                                <AlertCircle className="h-4 w-4 text-rose-500" />
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-2">
                                <Button variant="outline" className="text-[10px] border-rose-100 text-rose-600 bg-rose-50/50" onClick={() => toast.error("Andon 触发：量具故障", { description: "正在通知设备维修组..." })}>量具故障</Button>
                                <Button variant="outline" className="text-[10px] border-rose-100 text-rose-600 bg-rose-50/50" onClick={() => toast.error("Andon 触发：物料异常", { description: "正在通知品质部 (IQC)..." })}>物料异常</Button>
                                <Button variant="outline" className="text-[10px] border-rose-100 text-rose-600 bg-rose-50/50" onClick={() => toast.error("Andon 触发：图纸存疑", { description: "正在通知研发工程师项目组..." })}>图纸存疑</Button>
                                <Button variant="outline" className="text-[10px] border-rose-100 text-rose-600 bg-rose-50/50" onClick={() => toast.error("Andon 触发：操作求助", { description: "正在呼叫线长/组长..." })}>操作求助</Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
