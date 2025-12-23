"use client"

import {
    ShieldCheck,
    Settings,
    Truck,
    PackageCheck,
    ThermometerSnowflake,
    Microscope,
    Plus,
    Search,
    Filter,
    CheckCircle,
    Clock
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

export default function QPlanPage() {
    return (
        <div className="p-8 space-y-8 bg-background">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Q-Plan 管理</h1>
                    <p className="text-muted-foreground mt-1">质量检验计划、抽样标准与可靠性测试方案定义</p>
                </div>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    制定质量计划
                </Button>
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="检索检验标准或测试项..." className="pl-9 bg-muted/20 border-border" />
                </div>
                <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    筛选标准库
                </Button>
            </div>

            <Tabs defaultValue="iqc" className="space-y-6">
                <TabsList className="bg-muted/50 p-1 border border-border">
                    <TabsTrigger value="iqc" className="gap-2">
                        <Truck className="h-4 w-4" />
                        IQC 来料计划
                    </TabsTrigger>
                    <TabsTrigger value="oqc" className="gap-2">
                        <PackageCheck className="h-4 w-4" />
                        OQC 出货计划
                    </TabsTrigger>
                    <TabsTrigger value="reliability" className="gap-2">
                        <ThermometerSnowflake className="h-4 w-4" />
                        可靠性测试 (ORT)
                    </TabsTrigger>
                    <TabsTrigger value="metrology" className="gap-2">
                        <Microscope className="h-4 w-4" />
                        测量方案设计
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="iqc" className="space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
                            <div>
                                <CardTitle className="text-lg">磁声 Gen3 模型 - IQC 检验清单</CardTitle>
                                <CardDescription>关联标准: GB/T 2828.1 抽样标准, AQL: 0.65</CardDescription>
                            </div>
                            <Badge variant="secondary" className="bg-primary/5 text-primary">当前生效 V1.4</Badge>
                        </CardHeader>
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead>物料类别</TableHead>
                                    <TableHead>检验项目</TableHead>
                                    <TableHead>判定指标 (U/L Limit)</TableHead>
                                    <TableHead>检验工具/设备</TableHead>
                                    <TableHead>抽样水平</TableHead>
                                    <TableHead className="text-right">操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {[
                                    { cat: "磁性组件", item: "表面磁通量", limit: "420 - 450 mT", tool: "特斯拉计", sample: "Level II (S-3)" },
                                    { cat: "五金件", item: "关键孔径尺寸", limit: "Φ5.02 ±0.01mm", tool: "二次元投影仪", sample: "Level II" },
                                    { cat: "PCB 板", item: "阻抗匹配", limit: "4.0 ±0.2 Ω", tool: "数字电桥", sample: "100% 自动测试" },
                                    { cat: "包装件", item: "防静电等级", limit: "10^6 - 10^9 Ω", tool: "表面电阻测试仪", sample: "Skip Lot" },
                                ].map((row, i) => (
                                    <TableRow key={i} className="group border-border/30">
                                        <TableCell className="font-medium text-sm">{row.cat}</TableCell>
                                        <TableCell className="text-sm">{row.item}</TableCell>
                                        <TableCell className="font-mono text-xs text-muted-foreground">{row.limit}</TableCell>
                                        <TableCell className="text-sm">{row.tool}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[10px] font-normal">{row.sample}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 opacity-0 group-hover:opacity-100 transition-opacity">编辑</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                <TabsContent value="reliability" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[
                        { title: "恒温恒湿循环", desc: "85℃ / 85% RH, 持续 240H", status: "计划中", icon: ThermometerSnowflake, color: "text-blue-500" },
                        { title: "盐雾腐蚀测试", desc: "5% NaCl 浓度, 连续 48H", status: "进行中", icon: ShieldCheck, color: "text-emerald-500" },
                        { title: "跌落强度测试", desc: "1.2m 高度, 水泥地面, 六面各 3 次", status: "已完成", icon: PackageCheck, color: "text-amber-500" },
                    ].map((test, i) => (
                        <Card key={i} className="bg-card shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                                <div className={`p-2 rounded-lg bg-muted ${test.color} bg-opacity-10`}>
                                    <test.icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-sm font-bold">{test.title}</CardTitle>
                                    <CardDescription className="text-xs pt-0.5">{test.desc}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="flex justify-between items-center pt-2">
                                <Badge variant={test.status === "已完成" ? "secondary" : "outline"}>
                                    {test.status}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    计划: 12-25
                                </span>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>

                <TabsContent value="metrology">
                    <Card className="flex flex-col items-center justify-center h-80 bg-muted/10 border-dashed">
                        <Microscope className="h-12 w-12 text-muted-foreground opacity-30 mb-4" />
                        <p className="text-sm text-muted-foreground">测量方案策划面板：请先从 [产品主数据] 导入 3D 测量点位分布图</p>
                        <Button variant="link" className="text-xs mt-2">浏览图纸库</Button>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
