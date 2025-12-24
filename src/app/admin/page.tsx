"use client"

import {
    Settings,
    ShieldCheck,
    History,
    Key,
    Database,
    Bell,
    Globe,
    Lock,
    ChevronRight,
    UserPlus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export default function AdminPage() {
    return (
        <div className="p-8 space-y-8 bg-background">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">系统管理</h1>
                    <p className="text-muted-foreground mt-1">管理系统权限、查看操作日志与全局参数配置</p>
                </div>
                <Button className="gap-2" onClick={() => toast.success("正在进入新增管理员流程...")}>
                    <UserPlus className="h-4 w-4" />
                    新增管理员
                </Button>
            </div>

            <Tabs defaultValue="roles" className="space-y-6">
                <TabsList className="bg-muted/50 p-1 border border-border">
                    <TabsTrigger value="roles" className="gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        权限与角色
                    </TabsTrigger>
                    <TabsTrigger value="logs" className="gap-2">
                        <History className="h-4 w-4" />
                        操作日志
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="gap-2">
                        <Settings className="h-4 w-4" />
                        全局设置
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="roles" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {[
                            { role: "超级管理员", count: 2, desc: "具备全模块管理权限，包括审计与删除。" },
                            { role: "研发审核员", count: 8, desc: "负责图纸评审、DFM 确认及 Q-Plan 签核。" },
                            { role: "品质检验员", count: 15, desc: "执行 MTD 现场检测，提交不合格报告。" },
                        ].map((r, i) => (
                            <Card key={i} className="group hover:border-primary transition-colors">
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-base font-bold">{r.role}</CardTitle>
                                        <Badge variant="outline">{r.count} 人</Badge>
                                    </div>
                                    <CardDescription className="text-xs pt-2">{r.desc}</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <Button variant="link" className="p-0 h-auto text-[10px] text-primary" onClick={() => toast.info(`正在查看 ${r.role} 的权限详情`)}>管理权限范围 <ChevronRight className="h-3 w-3" /></Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="logs">
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>时间</TableHead>
                                    <TableHead>用户</TableHead>
                                    <TableHead>模块</TableHead>
                                    <TableHead>操作</TableHead>
                                    <TableHead>IP 地址</TableHead>
                                    <TableHead className="text-right">状态</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {[
                                    { time: "2025-12-23 16:20", user: "张工 (Admin)", mod: "图纸评审", action: "修改 Q-Plan 标准", ip: "192.168.1.102" },
                                    { time: "2025-12-23 15:45", user: "李博 (Viewer)", mod: "项目管理", action: "查看 NPI 看板", ip: "192.168.1.88" },
                                    { time: "2025-12-23 14:10", user: "系统", mod: "基础数据", action: "自动同步 ERP 物料表", ip: "::1" },
                                ].map((l, i) => (
                                    <TableRow key={i} className="text-sm">
                                        <TableCell className="font-mono text-xs text-muted-foreground">{l.time}</TableCell>
                                        <TableCell className="font-medium">{l.user}</TableCell>
                                        <TableCell>{l.mod}</TableCell>
                                        <TableCell className="text-muted-foreground italic">{l.action}</TableCell>
                                        <TableCell className="font-mono text-xs">{l.ip}</TableCell>
                                        <TableCell className="text-right">
                                            <Badge className="bg-emerald-500/10 text-emerald-600 border-none">成功</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Bell className="h-4 w-4" />
                                通知推送配置
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-lg border">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">飞书 / 钉钉机器人</span>
                                    <span className="text-xs text-muted-foreground">图纸评审延期自动推送</span>
                                </div>
                                <Badge>已开启</Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg border">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">邮件报告汇总</span>
                                    <span className="text-xs text-muted-foreground">每日 18:00 自动发送项目简报</span>
                                </div>
                                <Badge variant="outline">未设置</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Lock className="h-4 w-4" />
                                安全加固
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-lg border">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">双重身份认证 (MFA)</span>
                                    <span className="text-xs text-muted-foreground">敏感操作前强制验证</span>
                                </div>
                                <Badge variant="outline" className="cursor-pointer" onClick={() => toast.info("请先配置 MFA 认证服务器")}>已关闭</Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg border">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">水印管理</span>
                                    <span className="text-xs text-muted-foreground">敏感图纸预览时强制显示工号水印</span>
                                </div>
                                <Badge className="cursor-pointer" onClick={() => toast.success("水印设置已更新")}>已开启</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
