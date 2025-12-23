"use client"

import {
    Database,
    Layers,
    Lightbulb,
    FileWarning,
    Search,
    Plus,
    MoreHorizontal,
    Tags,
    Download,
    BookOpen
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
    TableRow,
} from "@/components/ui/table"

export default function BaseDataPage() {
    return (
        <div className="p-8 space-y-8 bg-background">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">基础数据模块</h1>
                    <p className="text-muted-foreground mt-1">管理系统核心主数据、NPI 标准阶段与 AI 知识库</p>
                </div>
                <Button className="gap-2">
                    <Download className="h-4 w-4" />
                    导出全量数据
                </Button>
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="搜索产品、知识条目或错误代码..." className="pl-9 bg-muted/20 border-border" />
                </div>
            </div>

            <Tabs defaultValue="products" className="space-y-6">
                <TabsList className="bg-muted/50 p-1 border border-border">
                    <TabsTrigger value="products" className="gap-2">
                        <Database className="h-4 w-4" />
                        产品主数据
                    </TabsTrigger>
                    <TabsTrigger value="stages" className="gap-2">
                        <Layers className="h-4 w-4" />
                        NPI 阶段模板
                    </TabsTrigger>
                    <TabsTrigger value="knowledge" className="gap-2">
                        <BookOpen className="h-4 w-4" />
                        评审知识库 (AI)
                    </TabsTrigger>
                    <TabsTrigger value="defects" className="gap-2">
                        <FileWarning className="h-4 w-4" />
                        不良现象库
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="products" className="space-y-4">
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>产品编号</TableHead>
                                    <TableHead>产品名称</TableHead>
                                    <TableHead>类别</TableHead>
                                    <TableHead>规格描述</TableHead>
                                    <TableHead>状态</TableHead>
                                    <TableHead className="text-right">操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {[
                                    { id: "PROD-X1", name: "新款磁体单元 Gen3", cat: "磁性核心", spec: "NdFeB, 50x50, N52", status: "激活" },
                                    { id: "PROD-L2", name: "L系列低频驱动器", cat: "声学模组", spec: "Titanium Diaphragm, 8ohm", status: "草稿" },
                                    { id: "PROD-S1", name: "微型数字麦克风", cat: "传感器", spec: "MEMS, -42dB", status: "激活" },
                                ].map((p, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="font-mono text-xs">{p.id}</TableCell>
                                        <TableCell className="font-medium text-sm">{p.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[10px]">{p.cat}</Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{p.spec}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5">
                                                <div className={`h-1.5 w-1.5 rounded-full ${p.status === "激活" ? "bg-emerald-500" : "bg-muted"}`} />
                                                <span className="text-xs">{p.status}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                <TabsContent value="knowledge" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {[
                            { title: "磁路间隙设计准则", tags: ["DFM", "Assembly"], views: 128 },
                            { title: "NdFeB 磁铁高温退磁防护", tags: ["Material", "Reliability"], views: 256 },
                            { title: "声学腔体密封点胶规范", tags: ["Process", "Quality"], views: 89 },
                            { title: "螺钉扭力衰减预防方案", tags: ["Fastening", "Design"], views: 142 },
                        ].map((k, i) => (
                            <Card key={i} className="group hover:border-primary transition-colors cursor-pointer">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-bold truncate group-hover:text-primary transition-colors">{k.title}</CardTitle>
                                    <div className="flex gap-2 pt-1">
                                        {k.tags.map(tag => (
                                            <Badge key={tag} variant="secondary" className="text-[9px] scale-90 origin-left">{tag}</Badge>
                                        ))}
                                    </div>
                                </CardHeader>
                                <CardContent className="flex justify-between items-center text-[10px] text-muted-foreground">
                                    <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> 点击查阅详情</span>
                                    <span>引用 {k.views} 次</span>
                                </CardContent>
                            </Card>
                        ))}
                        <Card className="border-dashed flex flex-col items-center justify-center p-6 bg-muted/5 min-h-[160px]">
                            <Lightbulb className="h-8 w-8 text-primary opacity-50 mb-2" />
                            <p className="text-xs text-muted-foreground">AI 智能提取新知识</p>
                            <Button variant="link" className="text-[10px] h-auto p-0 mt-2">从历史评审中提取</Button>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="stages">
                    <Card className="p-8 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="flex items-center gap-1 opacity-20">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="flex items-center">
                                    <div className="h-12 w-12 rounded-full border-2 border-foreground" />
                                    {i < 5 && <div className="w-12 h-0.5 bg-foreground" />}
                                </div>
                            ))}
                        </div>
                        <p className="text-sm text-muted-foreground">NPI 阶段模板配置（DROP {'->'} Proto {'->'} EVT {'->'} DVT {'->'} PVT {'->'} MP）</p>
                        <Button variant="outline" size="sm">编辑全局模板</Button>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
