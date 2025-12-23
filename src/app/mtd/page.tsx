"use client"

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
    AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"

export default function MTDPage() {
    return (
        <div className="p-8 space-y-8 bg-background">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">MTD 检测执行</h1>
                    <p className="text-muted-foreground mt-1">生产现场检测任务领取、实时数据录入与自动化报告生成</p>
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
                </div>

                {/* Center Panel: Data Entry */}
                <div className="lg:col-span-3 space-y-6">
                    <Card className="border-primary/20 bg-primary/5">
                        <CardHeader className="flex flex-row items-center justify-between bg-white/50 backdrop-blur-sm border-b border-primary/10">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">GT</div>
                                <div>
                                    <CardTitle className="text-md">磁通密度检测任务 - B20251222-01</CardTitle>
                                    <CardDescription>关联项目: 新款磁体单元 Gen3 | 样本量: 5 PCS</CardDescription>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <Badge className="bg-primary">执行中</Badge>
                                <span className="text-[10px] text-muted-foreground">操作员: 张工人</span>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-white/50 hover:bg-white/50">
                                        <TableHead className="w-16">编号</TableHead>
                                        <TableHead>测试项 (Test Item)</TableHead>
                                        <TableHead>标准值 (Nominal)</TableHead>
                                        <TableHead className="w-32">实测值 (Actual)</TableHead>
                                        <TableHead className="w-24">结果</TableHead>
                                        <TableHead className="text-right">趋势</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {[
                                        { id: "S1", item: "中心磁通 (Center Gauss)", std: "435.0 ±15.0", actual: "442.2", result: "OK" },
                                        { id: "S1", item: "边际温差 (Ref Temp)", std: "25.0 ±1.0", actual: "25.1", result: "OK" },
                                        { id: "S2", item: "中心磁通 (Center Gauss)", std: "435.0 ±15.0", actual: "431.5", result: "OK" },
                                        { id: "S2", item: "边际温差 (Ref Temp)", std: "25.0 ±1.0", actual: "24.9", result: "OK" },
                                        { id: "S3", item: "中心磁通 (Center Gauss)", std: "435.0 ±15.0", actual: "428.0", result: "OK" },
                                    ].map((row, i) => (
                                        <TableRow key={i} className="bg-white/30 border-primary/5 group">
                                            <TableCell className="font-mono text-xs">{row.id}</TableCell>
                                            <TableCell className="text-sm font-medium">{row.item}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground font-mono">{row.std}</TableCell>
                                            <TableCell>
                                                <input
                                                    type="text"
                                                    defaultValue={row.actual}
                                                    className="w-full h-8 px-2 text-sm bg-white border border-border rounded focus:ring-1 focus:ring-primary outline-none"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`text-[10px] bg-emerald-500/5 text-emerald-600 border-emerald-500/20`}>
                                                    {row.result}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Rss className="h-4 w-4 ml-auto text-primary opacity-50" />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <div className="flex justify-end gap-3 mt-6">
                                <Button variant="outline">异常挂起</Button>
                                <Button className="bg-primary hover:bg-primary/90">
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
                                <Button variant="outline" className="text-[10px] border-rose-100 text-rose-600 bg-rose-50/50">量具故障</Button>
                                <Button variant="outline" className="text-[10px] border-rose-100 text-rose-600 bg-rose-50/50">物料异常</Button>
                                <Button variant="outline" className="text-[10px] border-rose-100 text-rose-600 bg-rose-50/50">图纸存疑</Button>
                                <Button variant="outline" className="text-[10px] border-rose-100 text-rose-600 bg-rose-50/50">操作求助</Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
