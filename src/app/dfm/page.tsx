"use client"

import {
    Settings2,
    GitBranch,
    AlertTriangle,
    Wrench,
    ClipboardCheck,
    FileCheck,
    Plus,
    ArrowRight,
    TrendingUp,
    FlaskConical,
    CheckCircle,
    Clock,
    XCircle,
    MoreHorizontal
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import * as React from "react"

export default function DFMPage() {
    const [risks, setRisks] = React.useState([
        { op: "磁路装配", mode: "磁极方向装反", effect: "产品无输出，报废", measure: "夹具增加防呆防错设计", sod: "8 / 2 / 4 (64)", status: "已改进" },
        { op: "点胶工序", mode: "溢胶、胶量不足", effect: "磁性组件松动, 异音", measure: "CCD 视觉检测仪自动判定", sod: "6 / 4 / 3 (72)", status: "追踪中" },
    ])

    const toggleRiskStatus = (index: number) => {
        const newRisks = [...risks]
        newRisks[index].status = newRisks[index].status === "已改进" ? "追踪中" : "已改进"
        setRisks(newRisks)
        toast.info(`风险条目状态已更新为：${newRisks[index].status}`)
    }

    return (
        <div className="p-8 space-y-8 bg-background">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">DFM 策划</h1>
                    <p className="text-muted-foreground mt-1">面向制造的设计同步、PFMEA 风险识别与打样验证流程</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => toast.info("报告上传功能已就绪", { description: "请选择 DFX 规则校验结果文件。" })}>上传 DFM 报告</Button>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                发起评审
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] bg-white">
                            <DialogHeader>
                                <DialogTitle>发起 DFM 专家评审</DialogTitle>
                                <DialogDescription>
                                    选择参与评审的跨部门专家，并设定评审截止时间。
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="reviewers" className="text-right font-bold">评审专家</Label>
                                    <Input id="reviewers" placeholder="例如：工艺部、模具部、质量部" className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="review-deadline" className="text-right font-bold">截止日期</Label>
                                    <Input id="review-deadline" type="date" className="col-span-3" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={() => toast.success("评审已发起", { description: "通知已发送至所选专家，评审任务已同步至工作流。" })}>确认发起</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Tabs defaultValue="workflow" className="space-y-6">
                <TabsList className="bg-muted/50 p-1 border border-border">
                    <TabsTrigger value="workflow" className="gap-2">
                        <GitBranch className="h-4 w-4" />
                        工艺路线设计
                    </TabsTrigger>
                    <TabsTrigger value="risk" className="gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        风险评估 (PFMEA)
                    </TabsTrigger>
                    <TabsTrigger value="prototype" className="gap-2">
                        <FlaskConical className="h-4 w-4" />
                        打样与验证
                    </TabsTrigger>
                    <TabsTrigger value="grr" className="gap-2">
                        <TrendingUp className="h-4 w-4" />
                        GRR/CRR 验证
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="workflow" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-4">
                        <Card className="md:col-span-3">
                            <CardHeader>
                                <CardTitle className="text-lg">工艺路线 A-2 (优化版)</CardTitle>
                                <CardDescription>当前产品: 新款磁体单元 Gen3</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                                    {[
                                        { step: "步骤 10", name: "下料与预处理", params: "尺寸: 50x50mm, 压力: 10Mpa", status: "completed" },
                                        { step: "步骤 20", name: "磁体精密注塑", params: "模温: 120℃, 循环时间: 45s", status: "in-progress" },
                                        { step: "步骤 30", name: "磁路装配 (核心工序)", params: "间隙要求: 0.08±0.01mm", status: "pending" },
                                        { step: "步骤 40", name: "性能测试 (频响/磁通)", params: "阈值: >95dB at 1kHz", status: "pending" },
                                    ].map((s, i) => (
                                        <div key={i} className="relative flex items-start gap-6 pl-2">
                                            <div className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border shadow-sm z-10 ${s.status === "completed" ? "bg-emerald-500 border-emerald-500 text-white" :
                                                s.status === "in-progress" ? "bg-primary border-primary text-white" : "bg-white border-border text-muted-foreground"
                                                }`}>
                                                {s.status === "completed" ? <FileCheck className="h-3 w-3" /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                                            </div>
                                            <div className="flex-1 rounded-xl p-4 border border-border bg-slate-50 hover:border-primary/50 transition-colors shadow-sm">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs font-mono font-semibold text-slate-500">{s.step}</span>
                                                    <Badge variant="outline" className={`text-[10px] font-bold ${s.status === "completed" ? "text-emerald-600 border-emerald-600/30 bg-emerald-50" : "bg-white"
                                                        }`}>{s.status}</Badge>
                                                </div>
                                                <h4 className="font-bold text-slate-900">{s.name}</h4>
                                                <p className="text-xs text-slate-600 mt-1">关键参数: {s.params}</p>
                                            </div>                 </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="h-fit">
                            <CardHeader>
                                <CardTitle className="text-base text-primary flex items-center gap-2">
                                    <Settings2 className="h-4 w-4" />
                                    工序配置助手
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 dark:bg-blue-900/10 dark:border-blue-800">
                                    <p className="text-xs text-blue-700 dark:text-blue-400">基于磁体单元 R&D 规范：建议步骤 30 关联 AI 尺寸自动监测量具，以降低人工操作误差。</p>
                                </div>
                                <Button variant="outline" className="w-full text-xs">从标准库同步参数</Button>
                                <Button variant="outline" className="w-full text-xs">调整工序顺序</Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="risk">
                    <Card>
                        <TableHeader>
                            <TableRow className="bg-muted/30">
                                <TableHead>工序</TableHead>
                                <TableHead>潜在失效模式</TableHead>
                                <TableHead>失效影响</TableHead>
                                <TableHead>预防/探测措施</TableHead>
                                <TableHead className="text-center">SOD (风险评分)</TableHead>
                                <TableHead>状态</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {risks.map((r, i) => (
                                <TableRow key={i} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="font-medium text-sm">{r.op}</TableCell>
                                    <TableCell className="text-sm">{r.mode}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{r.effect}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground italic">{r.measure}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className="font-mono text-amber-600 border-amber-500/20">{r.sod}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            className={`${r.status === "已改进" ? "bg-emerald-500" : "bg-amber-500"} cursor-pointer hover:opacity-80`}
                                            onClick={() => toggleRiskStatus(i)}
                                        >
                                            {r.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Card>
                </TabsContent>

                <TabsContent value="prototype" className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">夹具设计 (Fixtures)</CardTitle>
                                <CardDescription>关联新款磁体单元的 3D 模具与夹具</CardDescription>
                            </div>
                            <Button size="sm" variant="ghost">查看 3D</Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="aspect-video rounded-xl bg-muted flex items-center justify-center border-2 border-dashed border-border/50">
                                <Wrench className="h-12 w-12 text-muted-foreground opacity-20" />
                                <span className="text-xs text-muted-foreground absolute bottom-4">Jig-Magnet-301.STL 加载中...</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-lg border border-border">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">精密装配夹具 V1.2</span>
                                    <span className="text-[10px] text-muted-foreground">最后更新: 2025-12-22</span>
                                </div>
                                <Badge className="cursor-pointer" onClick={() => toast.info("Jig-Magnet-301.STL 设计锁定")}>设计完成</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">打样进度与评审</CardTitle>
                            <CardDescription>最近 3 批次打样情况</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[
                                    { batch: "B20251210", qty: "50 PCS", result: "合格 (96%)", date: "12-10" },
                                    { batch: "B20251218", qty: "100 PCS", result: "有瑕疵 (88%)", date: "12-18" },
                                    { batch: "B20251222", qty: "20 PCS", result: "待评审", date: "12-22" },
                                ].map((b, i) => (
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-border">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded bg-primary flex items-center justify-center font-bold text-white text-xs shadow-sm">P</div>
                                            <div className="grid gap-0.5">
                                                <span className="text-sm font-bold text-slate-800">{b.batch}</span>
                                                <span className="text-[10px] text-slate-500 font-medium">{b.qty} / {b.date}</span>
                                            </div>
                                        </div>
                                        <Badge variant={b.result === "待评审" ? "outline" : "secondary"} className="font-bold">{b.result}</Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="grr">
                    <Card className="flex items-center justify-center h-96 text-muted-foreground text-sm italic">
                        GRR 仪表盘加载中，正在连接量具数据采集系统...
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
