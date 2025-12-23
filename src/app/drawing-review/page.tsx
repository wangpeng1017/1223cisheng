"use client"

import { useState } from "react"
import {
    Maximize2,
    ZoomIn,
    ZoomOut,
    RotateCw,
    MessageSquare,
    ScanLine,
    FileText,
    ChevronRight,
    Sparkles,
    AlertTriangle,
    CheckCircle2,
    Info
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function DrawingReviewPage() {
    const [activeTab, setActiveTab] = useState("preview")

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white">
            {/* Main Review Area */}
            <div className="flex-1 flex flex-col bg-slate-50 relative">
                <div className="flex items-center justify-between p-4 border-b border-border bg-white/80 backdrop-blur-md z-10">
                    <div className="flex items-center gap-4">
                        <div>
                            <h2 className="text-base font-semibold">新款磁体单元 - 最终装配图</h2>
                            <span className="text-xs text-muted-foreground font-mono">DRW-2025-X1-V2.0.pdf</span>
                        </div>
                        <Badge variant="outline" className="bg-primary/5 text-primary">评审中</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8"><ZoomIn className="h-4 w-4" /></Button>
                        <Button variant="outline" size="icon" className="h-8 w-8"><ZoomOut className="h-4 w-4" /></Button>
                        <Button variant="outline" size="icon" className="h-8 w-8"><RotateCw className="h-4 w-4" /></Button>
                        <div className="w-px h-4 bg-border/50 mx-1" />
                        <Button variant="outline" size="icon" className="h-8 w-8"><Maximize2 className="h-4 w-4" /></Button>
                    </div>
                </div>

                {/* CAD Preview Simulation */}
                <div className="flex-1 relative flex items-center justify-center p-8 overflow-hidden group">
                    <div className="relative w-full h-full max-w-4xl border border-primary/20 bg-slate-50 rounded-xl shadow-xl overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 bg-[url('https://plus.unsplash.com/premium_photo-1663089680385-d72b2568600d?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-10 grayscale" />

                        {/* Simulated Drawing Content */}
                        <div className="z-10 text-center space-y-4">
                            <div className="w-96 h-96 border-4 border-primary/30 rounded-full border-dashed animate-[spin_20s_linear_infinite] flex items-center justify-center">
                                <div className="w-80 h-80 border-2 border-primary/20 rounded-full flex items-center justify-center">
                                    <ScanLine className="h-32 w-32 text-primary/40" />
                                </div>
                            </div>
                            <p className="text-sm font-mono text-muted-foreground">3D 模型实时渲染引擎加载完毕 (模拟预览)</p>
                        </div>

                        {/* Simulated Annotations */}
                        <div className="absolute top-1/4 left-1/3 z-20">
                            <div className="relative">
                                <div className="h-4 w-4 rounded-full bg-rose-500 animate-ping absolute" />
                                <div className="h-4 w-4 rounded-full bg-rose-500 relative cursor-pointer group" />
                                <div className="absolute left-6 top-0 w-48 p-2 rounded-lg bg-background/90 border border-rose-500 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[10px] text-rose-500 font-bold uppercase">设计缺陷</span>
                                    <p className="text-xs mt-1">磁路间隙过窄 (0.05mm)，超出制造公差范围限制。</p>
                                </div>
                            </div>
                        </div>

                        <div className="absolute bottom-1/3 right-1/4 z-20">
                            <div className="relative">
                                <div className="h-4 w-4 rounded-full bg-primary/80 relative cursor-pointer group" />
                                <div className="absolute left-6 bottom-0 w-48 p-2 rounded-lg bg-background/90 border border-primary/50 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[10px] text-primary font-bold uppercase">公差标注</span>
                                    <p className="text-xs mt-1">关键装配面平面度要求: 0.02mm。</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AI Scanner Effect Overlay */}
                    <div className="absolute left-0 top-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-[scan_4s_ease-in-out_infinite]" />
                </div>

                {/* Toolbar Footer */}
                <div className="p-4 border-t border-border bg-white/80 backdrop-blur-md flex items-center justify-center gap-8">
                    <Button className="gap-2 bg-primary text-white shadow-sm hover:bg-primary/90">
                        <MessageSquare className="h-4 w-4" />
                        添加批注
                    </Button>
                    <Button variant="outline" className="gap-2 border-border shadow-sm">
                        <ScanLine className="h-4 w-4" />
                        尺寸自动识别
                    </Button>
                    <Button variant="outline" className="gap-2 border-border shadow-sm">
                        <FileText className="h-4 w-4" />
                        导出评审报告
                    </Button>
                </div>
            </div>

            {/* Sidebar Insights Area */}
            <div className="w-[400px] border-l border-border bg-slate-50/50 backdrop-blur-xl flex flex-col">
                <Tabs defaultValue="insights" className="flex-1 flex flex-col">
                    <div className="p-4 border-b border-border">
                        <TabsList className="w-full bg-muted/30">
                            <TabsTrigger value="insights" className="flex-1 gap-2">
                                <Sparkles className="h-4 w-4 text-amber-500" />
                                AI 洞察
                            </TabsTrigger>
                            <TabsTrigger value="comments" className="flex-1 gap-2">
                                <MessageSquare className="h-4 w-4" />
                                评审意见
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="flex-1">
                        <TabsContent value="insights" className="m-0 p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-amber-500 text-sm font-semibold">
                                    <AlertTriangle className="h-4 w-4" />
                                    DFM 风险预测 (3个)
                                </div>
                                <Card className="bg-rose-500/10 border-rose-500/30">
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start gap-2">
                                            <p className="text-sm font-medium leading-relaxed">
                                                检测到磁路间隙 <span className="text-rose-400">0.05mm</span>，不符合装配工艺建议值 (Min 0.08mm)。可能会导致磁铁碎裂风险。
                                            </p>
                                            <Badge className="bg-rose-500 text-white text-[10px]">高危</Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-amber-500/10 border-amber-500/30">
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start gap-2">
                                            <p className="text-sm font-medium leading-relaxed">
                                                物料清单 (BOM) 中的铝合金牌号与设计要求的导磁性能存在轻微偏差。
                                            </p>
                                            <Badge className="bg-amber-500 text-white text-[10px]">中风险</Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-border/50">
                                <div className="flex items-center gap-2 text-emerald-500 text-sm font-semibold">
                                    <CheckCircle2 className="h-4 w-4" />
                                    自动识别项
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
                                        <span className="text-[10px] text-muted-foreground block">关键维度总计</span>
                                        <span className="text-lg font-bold">42</span>
                                    </div>
                                    <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
                                        <span className="text-[10px] text-muted-foreground block">BOM 物料种类</span>
                                        <span className="text-lg font-bold">18</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-3">
                                <div className="flex items-center gap-2 text-primary font-bold">
                                    <Sparkles className="h-4 w-4" />
                                    AI 智能建议
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">依据历史类似磁声项目数据建议：建议在此处添加缓冲垫圈结构，并将螺纹连接改为点焊连接，以提高振弦效率。</p>
                                <Button variant="link" className="p-0 h-auto text-[10px] gap-1">
                                    自动生成 SOP 方案 <ChevronRight className="h-3 w-3" />
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent value="comments" className="m-0 p-6 space-y-6">
                            {/* Comments Feed */}
                            <div className="space-y-6">
                                {[1, 2].map((i) => (
                                    <div key={i} className="flex gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback>U{i}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-semibold">张工 (资深工程师)</span>
                                                <span className="text-[10px] text-muted-foreground">14:20</span>
                                            </div>
                                            <p className="text-sm p-3 rounded-lg bg-muted/40 border border-border/30">
                                                这里的公差要求过严，目前的供应商加工能力可能达不到，建议放宽到 +/- 0.05mm。
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                    </ScrollArea>

                    <div className="p-4 border-t border-border mt-auto bg-white/80">
                        <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8 border border-border">
                                <AvatarImage src="https://github.com/shadcn.png" />
                            </Avatar>
                            <div className="flex-1 relative">
                                <Input placeholder="输入意见..." className="pr-10 h-9 bg-white border-border" />
                                <Button size="icon" variant="ghost" className="h-7 w-7 absolute right-1 top-1 text-primary">
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </Tabs>
            </div>

            <style jsx global>{`
        @keyframes scan {
          0%, 100% { top: 0%; opacity: 0; }
          50% { top: 100%; opacity: 1; }
        }
      `}</style>
        </div>
    )
}
