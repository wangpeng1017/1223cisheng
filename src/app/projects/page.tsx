"use client"

import { Plus, Search, Filter, MoreHorizontal, Calendar, Users, AlertCircle, CheckCircle2, Clock, ArrowUpRight, TrendingUp, MoreVertical } from "lucide-react"
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

const projects = [
    {
        id: "NPI-2025-001",
        name: "新一代磁声传感单元 (Gen3)",
        phase: "Proto",
        manager: "张晓刚",
        deadline: "2025-03-20",
        progress: 65,
        status: "正常",
        risk: "低",
    },
    {
        id: "NPI-2025-002",
        name: "超薄型穿戴式扬声器组件",
        phase: "DROP",
        manager: "王利敏",
        deadline: "2025-06-15",
        progress: 15,
        status: "预警",
        risk: "高",
    },
    {
        id: "NPI-2025-003",
        name: "车规级高频磁路系统",
        phase: "RAMP",
        manager: "刘强",
        deadline: "2025-01-10",
        progress: 92,
        status: "正常",
        risk: "中",
    },
    {
        id: "NPI-2025-004",
        name: "AI 降噪模组 B 版本",
        phase: "DVT",
        manager: "陈思思",
        deadline: "2025-04-05",
        progress: 45,
        status: "延期",
        risk: "高",
    },
]

export default function ProjectsPage() {
    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">项目台账</h1>
                    <p className="text-muted-foreground mt-1">NPI 研发项目全生命周期状态追踪与 WBS 进度管理</p>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            创建新项目
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[525px] bg-white">
                        <DialogHeader>
                            <DialogTitle>创建 NPI 研发项目</DialogTitle>
                            <DialogDescription>
                                输入项目基本信息以初始化 NPI 协同流程。
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right font-bold">项目名称</Label>
                                <Input id="name" placeholder="例如：新款磁体单元 Gen4" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="code" className="text-right font-bold">项目编号</Label>
                                <Input id="code" placeholder="NPI-2026-XXX" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="owner" className="text-right font-bold">负责人</Label>
                                <Input id="owner" placeholder="主负责人姓名" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="deadline" className="text-right font-bold">截止日期</Label>
                                <Input id="deadline" type="date" className="col-span-3" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="submit"
                                onClick={() => {
                                    toast.success("项目创建成功", {
                                        description: "新一代磁声传感单元 (Gen4) 已加入系统台账。",
                                    });
                                }}
                            >
                                立即创建
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="检索项目代号、名称 or 负责人..." className="pl-9 bg-muted/30 border-border/50" />
                </div>
                <Button variant="outline" className="gap-2 border-border/50">
                    <Filter className="h-4 w-4" />
                    筛选
                </Button>
            </div>

            <Card className="bg-card/40 border-border/50 overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-transparent border-border/50">
                            <TableHead className="w-[150px]">项目编号</TableHead>
                            <TableHead>项目名称</TableHead>
                            <TableHead>当前阶段</TableHead>
                            <TableHead>负责人</TableHead>
                            <TableHead>计划截止日期</TableHead>
                            <TableHead>进度</TableHead>
                            <TableHead>风险等级</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {projects.map((project) => (
                            <TableRow key={project.id} className="border-border/30 hover:bg-muted/20 transition-colors">
                                <TableCell className="font-mono text-xs font-semibold">{project.id}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{project.name}</span>
                                        <span className="text-[10px] text-muted-foreground">最后更新: 2小时前</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                        {project.phase}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Users className="h-3 w-3 text-muted-foreground" />
                                        <span>{project.manager}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="h-3 w-3 text-muted-foreground" />
                                        {project.deadline}
                                    </div>
                                </TableCell>
                                <TableCell className="w-[180px]">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex justify-between text-[10px]">
                                            <span>已完成 {project.progress}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${project.status === "延期" ? "bg-rose-500" :
                                                    project.status === "预警" ? "bg-amber-500" : "bg-primary"
                                                    }`}
                                                style={{ width: `${project.progress}%` }}
                                            />
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5">
                                        {project.risk === "高" ? (
                                            <AlertCircle className="h-4 w-4 text-rose-500" />
                                        ) : project.risk === "中" ? (
                                            <Clock className="h-4 w-4 text-amber-500" />
                                        ) : (
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        )}
                                        <span className={`text-xs ${project.risk === "高" ? "text-rose-500" :
                                            project.risk === "中" ? "text-amber-500" : "text-emerald-500"
                                            }`}>
                                            {project.risk}风险
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="bg-card/40 border-border/50">
                    <CardHeader>
                        <CardTitle className="text-base">里程碑概览</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                { label: "DROP 完成", date: "Jan 15", status: "completed" },
                                { label: "Proto 打样", date: "Feb 10", status: "in-progress" },
                                { label: "EVT 评估", date: "Mar 05", status: "pending" },
                                { label: "DVT 测试", date: "Apr 20", status: "pending" },
                            ].map((m, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className={`h-2 w-2 rounded-full ${m.status === "completed" ? "bg-emerald-500" : m.status === "in-progress" ? "bg-primary animate-pulse" : "bg-muted"}`} />
                                    <span className="text-sm flex-1">{m.label}</span>
                                    <span className="text-xs text-muted-foreground font-mono">{m.date}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2 bg-card/40 border-border/50">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center justify-between">
                            资源占用分析
                            <Badge variant="outline" className="text-[10px]">研发部 · 全体</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground italic text-sm">
                        加载资源分配图谱...
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
