"use client"

import * as React from "react"
import {
    Maximize2,
    MessageSquare,
    ShieldCheck,
    AlertTriangle,
    CheckCircle,
    History,
    FileText,
    Plus,
    Send,
    ArrowLeft,
    Box,
    FileSearch,
    User,
    Clock,
    Upload
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
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
import { Textarea } from "@/components/ui/textarea"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"

const reviewItems = [
    {
        id: "REV-001",
        name: "磁体底座组件 (B组)",
        code: "MC-B-02",
        product: "Gen3 传感器",
        status: "待评审",
        manager: "王工",
        type: "五金件",
        createdAt: "2024-12-20",
    },
    {
        id: "REV-002",
        name: "外壳模组 (A组)",
        code: "HS-A-11",
        product: "Gen3 传感器",
        status: "进行中",
        manager: "李工",
        type: "塑胶件",
        createdAt: "2024-12-18",
    },
    {
        id: "REV-003",
        name: "PCB 逻辑控制板",
        code: "PCB-L-05",
        product: "Gen3 传感器",
        status: "已完成",
        manager: "赵工",
        type: "电子件",
        createdAt: "2024-12-15",
    }
]

export default function DrawingReviewPage() {
    const [activeTab, setActiveTab] = React.useState("ledger")
    const [selectedReview, setSelectedReview] = React.useState<any>(null)

    const handleStartReview = (item: any) => {
        setSelectedReview(item)
        setActiveTab("review")
    }

    return (
        <div className="flex flex-col h-screen bg-slate-50/50">
            {/* Toolbar */}
            <div className="h-16 border-b bg-white px-6 flex items-center justify-between shadow-sm flex-shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <FileSearch className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">图纸评审中心</h2>
                        <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">Engineering Review & AI Insights</p>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
                    <TabsList className="grid w-full grid-cols-3 bg-slate-100/50 p-1">
                        <TabsTrigger value="ledger" className="text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">评审台账</TabsTrigger>
                        <TabsTrigger value="review" className="text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">图纸校审</TabsTrigger>
                        <TabsTrigger value="report" className="text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">评审报告</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="h-8 gap-2 border-slate-200">
                        <History className="h-4 w-4" />
                        历史记录
                    </Button>
                    <div className="h-8 w-[1px] bg-slate-200 mx-2" />
                    <User className="h-8 w-8 rounded-full bg-slate-100 p-1.5 text-slate-600 border border-slate-200 shadow-sm" />
                </div>
            </div>

            <main className="flex-1 overflow-hidden p-6">
                <TabsContent value="ledger" className="h-full m-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {reviewItems.map((item) => (
                            <Card key={item.id} className="hover:shadow-lg transition-all duration-300 border-slate-200 overflow-hidden group">
                                <CardHeader className="bg-slate-50/50 pb-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant="outline" className="bg-white text-[10px] font-bold px-2 py-0.5">{item.id}</Badge>
                                        <Badge className={`font-bold ${item.status === '待评审' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                            item.status === '进行中' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                                'bg-emerald-50 text-emerald-600 border-emerald-200'
                                            }`}>
                                            {item.status}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-base font-bold">{item.name}</CardTitle>
                                    <CardDescription className="text-xs flex items-center gap-2">
                                        <Box className="h-3 w-3" />
                                        所属产品: {item.product}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-4">
                                    <div className="grid grid-cols-2 gap-y-2 text-xs">
                                        <div className="text-slate-500">物料类别: <span className="text-slate-900 font-medium ml-1">{item.type}</span></div>
                                        <div className="text-slate-500 text-right">负责人: <span className="text-slate-900 font-medium ml-1">{item.manager}</span></div>
                                        <div className="text-slate-500">创建时间: <span className="text-slate-900 font-medium ml-1">{item.createdAt}</span></div>
                                    </div>
                                    <Button
                                        className="w-full mt-2 font-bold group-hover:bg-primary/90 transition-colors"
                                        onClick={() => handleStartReview(item)}
                                        variant={item.status === '待评审' ? 'default' : 'outline'}
                                    >
                                        {item.status === '待评审' ? '开始评审' : '进入查看'}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                        <Card className="border-dashed border-2 flex flex-col items-center justify-center p-8 bg-white/40 hover:bg-white hover:border-primary/40 transition-all cursor-pointer">
                            <Plus className="h-8 w-8 text-slate-300 mb-2" />
                            <p className="text-sm font-bold text-slate-500">发起新评审任务</p>
                            <p className="text-[10px] text-slate-400 mt-1">上传 PDF 或 3D 原始文件</p>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="review" className="h-full m-0 flex gap-6">
                    {!selectedReview ? (
                        <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
                            <FileSearch className="h-16 w-16 mb-4 opacity-20" />
                            <p className="font-bold">请先从“评审台账”选择待评审项</p>
                            <Button variant="link" onClick={() => setActiveTab("ledger")}>返回台账</Button>
                        </div>
                    ) : (
                        <>
                            {/* Left: 3D/Drawing View */}
                            <div className="flex-1 bg-slate-900 rounded-2xl relative overflow-hidden shadow-2xl border-4 border-slate-800">
                                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
                                <div className="absolute top-4 left-4 flex gap-2">
                                    <Badge className="bg-black/50 backdrop-blur-md border-white/10 text-white gap-2 font-mono">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        LIVE CAD PREVIEW: {selectedReview.code}
                                    </Badge>
                                </div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/5 flex flex-col items-center">
                                    <Box className="h-64 w-64" />
                                    <span className="text-4xl font-extrabold tracking-tighter">CAD VIEWPORT</span>
                                </div>
                                {/* Annotation Dots */}
                                <div className="absolute top-[30%] left-[45%] h-6 w-6 bg-rose-500 rounded-full border-4 border-white shadow-lg animate-bounce cursor-pointer group">
                                    <div className="absolute left-8 top-0 w-48 bg-white p-3 rounded-lg shadow-xl scale-0 group-hover:scale-100 transition-transform origin-left text-xs font-bold text-slate-900">
                                        公差重叠风险: 底层间隙仅 0.05mm
                                    </div>
                                </div>

                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 shadow-2xl backdrop-blur-xl p-2 rounded-full border border-white/10">
                                    <Button size="icon" variant="ghost" className="text-white hover:bg-white/10 h-10 w-10 rounded-full"><Plus className="h-5 w-5" /></Button>
                                    <div className="h-6 w-[1px] bg-white/20" />
                                    <Button size="icon" variant="ghost" className="text-white hover:bg-white/10 h-10 w-10 rounded-full"><Maximize2 className="h-5 w-5" /></Button>
                                    <Button size="icon" variant="ghost" className="text-white hover:bg-white/10 h-10 w-10 rounded-full text-emerald-400"><ShieldCheck className="h-5 w-5" /></Button>
                                </div>
                            </div>

                            {/* Right: Review Sidebar */}
                            <div className="w-[420px] bg-white rounded-2xl border border-slate-200 shadow-xl flex flex-col">
                                <div className="p-4 border-b bg-slate-50/50 rounded-t-2xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-bold flex items-center gap-2">
                                            <MessageSquare className="h-4 w-4 text-primary" />
                                            工程评审意见
                                        </h3>
                                        <Badge variant="secondary" className="text-[10px]">专家模式</Badge>
                                    </div>
                                    <p className="text-[10px] text-slate-500">当前评审人: 王工 (高级工程专家)</p>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                    <div className="space-y-3">
                                        <Label className="text-xs font-bold text-slate-700">AI 智能审计结果 (自动化建议)</Label>
                                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 space-y-2">
                                            <div className="flex items-center gap-2 text-amber-700">
                                                <AlertTriangle className="h-3.5 w-3.5" />
                                                <span className="text-[11px] font-bold">检测到 2 个潜在制造瓶颈</span>
                                            </div>
                                            <p className="text-[10px] text-amber-600 leading-relaxed">
                                                物料 A-05 厚度公差存在干涉风险，建议调整至 ±0.02。
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label htmlFor="opinion" className="text-xs font-bold text-slate-700">填写评审意见</Label>
                                        <Textarea
                                            id="opinion"
                                            placeholder="在此输入您的专家审核意见..."
                                            className="text-xs min-h-[120px] bg-slate-50/50 border-slate-200 resize-none ring-offset-transparent focus-visible:ring-1 focus-visible:ring-primary"
                                        />
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm" className="h-8 gap-2 text-[10px] border-slate-200 w-full">
                                                <Upload className="h-3 w-3" />
                                                上传附件凭证
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-xs font-bold text-slate-700">协作会签历史</Label>
                                        <div className="space-y-2">
                                            {[
                                                { user: "李工", role: "工艺主管", time: "2小时前", text: "已确认浇口位置，满足注塑要求。" },
                                                { user: "赵敏", role: "质量部", time: "昨天", text: "外观面段差建议控制在 0.1mm 以内。" }
                                            ].map((msg, i) => (
                                                <div key={i} className="text-[10px] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-bold text-slate-900">{msg.user} <span className="text-slate-400 font-normal">({msg.role})</span></span>
                                                        <span className="text-[9px] text-slate-400">{msg.time}</span>
                                                    </div>
                                                    <p className="text-slate-600 leading-relaxed">{msg.text}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 border-t bg-slate-50/50 rounded-b-2xl flex gap-3">
                                    <Button variant="outline" className="flex-1 font-bold text-xs" onClick={() => toast.info("意见已保存草稿")}>保存草稿</Button>
                                    <Button className="flex-1 font-bold text-xs gap-2" onClick={() => {
                                        toast.success("评审提交成功", { description: "评审报告与问题清单已自动生成。" });
                                        setActiveTab("report");
                                    }}>
                                        <Send className="h-3 w-3" />
                                        提交评审
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </TabsContent>

                <TabsContent value="report" className="h-full m-0">
                    <div className="max-w-4xl mx-auto h-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex flex-col">
                        <div className="flex justify-between items-start border-b pb-6 mb-8">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">DFM 图纸评审报告</h1>
                                <p className="text-sm text-slate-500 mt-1">报告编号: NPI-REP-2024-0023 | 生成时间: 2024-12-23</p>
                            </div>
                            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-md">
                                <FileText className="h-4 w-4" />
                                导出正式 PDF
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-4 -mr-4 space-y-8">
                            <section className="space-y-4">
                                <h3 className="text-sm font-bold flex items-center gap-2 text-slate-700">
                                    <div className="w-1.5 h-4 bg-primary rounded-full" />
                                    评审结论 (Executive Summary)
                                </h3>
                                <div className="grid grid-cols-4 gap-4">
                                    {[
                                        { label: "项目状态", value: "有条件通过", color: "text-amber-600 bg-amber-50" },
                                        { label: "待改进项", value: "3 项", color: "text-rose-600 bg-rose-50 font-bold" },
                                        { label: "评审专家", value: "5 人", color: "text-slate-700 bg-slate-50" },
                                        { label: "AI 预警", value: "高风险", color: "text-rose-600 bg-rose-50" }
                                    ].map((stat, i) => (
                                        <div key={i} className={`p-4 rounded-xl border border-slate-100 ${stat.color} flex flex-col gap-1`}>
                                            <span className="text-[10px] opacity-70">{stat.label}</span>
                                            <span className="text-sm font-bold">{stat.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-sm font-bold flex items-center gap-2 text-slate-700">
                                    <div className="w-1.5 h-4 bg-primary rounded-full" />
                                    待办问题清单 (Issue Tracker)
                                </h3>
                                <div className="rounded-xl border border-slate-100 overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead className="text-xs h-9">问题描述</TableHead>
                                                <TableHead className="text-xs h-9">风险等级</TableHead>
                                                <TableHead className="text-xs h-9">提出的责任人</TableHead>
                                                <TableHead className="text-xs h-9 text-right">状态</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {[
                                                { desc: "磁座底层间隙干涉 (0.05mm)", risk: "高", user: "王工", status: "待整改" },
                                                { desc: "浇口残留应力分析缺失", risk: "中", user: "李主管", status: "进行中" },
                                                { desc: "表面段差控制不明确", risk: "低", user: "赵敏", status: "已确认" }
                                            ].map((row, i) => (
                                                <TableRow key={i} className="text-xs">
                                                    <TableCell className="font-bold">{row.desc}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={row.risk === '高' ? 'text-rose-600 border-rose-200' : ''}>{row.risk}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-slate-500 font-medium">{row.user}</TableCell>
                                                    <TableCell className="text-right">
                                                        <span className="text-slate-400 font-bold">{row.status}</span>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-sm font-bold flex items-center gap-2 text-slate-700">
                                    <div className="w-1.5 h-4 bg-primary rounded-full" />
                                    后续行动项 (Action Plan)
                                </h3>
                                <div className="space-y-3">
                                    <div className="p-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 flex items-start gap-4">
                                        <div className="h-6 w-6 bg-primary text-white text-[10px] flex items-center justify-center rounded-full font-bold flex-shrink-0 mt-0.5">1</div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-900">工程经理张工重新审核 2D 公差链</p>
                                            <p className="text-[10px] text-slate-500 mt-1">截止时间: 2024-12-25 | 优先级: 高</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 flex items-start gap-4">
                                        <div className="h-6 w-6 bg-primary text-white text-[10px] flex items-center justify-center rounded-full font-bold flex-shrink-0 mt-0.5">2</div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-900">模具供应商提供浇口流动分析报告 (MFA)</p>
                                            <p className="text-[10px] text-slate-500 mt-1">截止时间: 2024-12-28 | 优先级: 中</p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </TabsContent>
            </main>
        </div>
    )
}
