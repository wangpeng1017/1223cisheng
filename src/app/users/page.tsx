"use client"

import {
    User,
    Calendar,
    Clock,
    Mail,
    Bell,
    ChevronRight,
    Award,
    Activity,
    LogOut,
    Edit3,
    Bookmark
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function UserCenterPage() {
    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 bg-background">
            {/* User Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-8 rounded-2xl bg-primary/5 border border-primary/10 relative overflow-hidden">
                <div className="flex items-center gap-6 z-10">
                    <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                        <AvatarImage src="https://github.com/shadcn.png" />
                        <AvatarFallback>張</AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">张工</h1>
                            <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">高级研发工程师</Badge>
                        </div>
                        <p className="text-muted-foreground flex items-center gap-2">
                            <Mail className="h-4 w-4" /> zhang.g@cisheng-tech.com
                        </p>
                        <div className="flex items-center gap-4 pt-1">
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                                <Calendar className="h-3 w-3" /> 入职: 2022-05-18
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                                <Clock className="h-3 w-3" /> 最近登录: 10 分钟前
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 z-10">
                    <Button variant="outline" className="gap-2 border-border/50">
                        <Edit3 className="h-4 w-4" /> 编辑资料
                    </Button>
                    <Button variant="ghost" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent">
                        <LogOut className="h-4 w-4" /> 退出登录
                    </Button>
                </div>
                {/* Abstract Background Shape */}
                <div className="absolute -right-16 -top-16 h-64 w-64 bg-primary/5 rounded-full blur-3xl" />
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Left Side: Stats & Info */}
                <div className="space-y-8">
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base font-bold flex items-center gap-2 text-primary">
                                <Award className="h-4 w-4" />
                                评审成就
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-muted/30 border border-border/50 text-center">
                                <span className="text-2xl font-bold text-foreground">142</span>
                                <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">累计审核</p>
                            </div>
                            <div className="p-4 rounded-xl bg-muted/30 border border-border/50 text-center">
                                <span className="text-2xl font-bold text-foreground">12</span>
                                <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">进行中项目</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <Bookmark className="h-4 w-4" />
                                我的关注
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {["新款磁体单元 Gen3", "Alpha-S1 振膜模组", "车规级磁路平台"].map((p, i) => (
                                <div key={i} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer group">
                                    <span className="text-sm font-medium">{p}</span>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Side: Tabs for Activity/Messages */}
                <div className="lg:col-span-2">
                    <Tabs defaultValue="activity" className="space-y-6">
                        <TabsList className="bg-muted/50 p-1 border border-border w-full flex">
                            <TabsTrigger value="activity" className="flex-1 gap-2">
                                <Activity className="h-4 w-4" /> 动态轨迹
                            </TabsTrigger>
                            <TabsTrigger value="notifications" className="flex-1 gap-2">
                                <Bell className="h-4 w-4" /> 消息中心
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="activity" className="space-y-6">
                            <div className="space-y-8 pl-4 border-l border-border mt-4">
                                {[
                                    { time: "今天 14:20", content: "您通过了 [新款磁体单元 Gen3] 的图纸评审，并提出了 2 条优化意见。" },
                                    { time: "昨天 10:15", content: "您领取了 MTD 现场检测任务 [B20251210-01]。" },
                                    { time: "12月20日", content: "您在 [DFM 策划] 模块中新增了工艺路线 A-2。" },
                                ].map((a, i) => (
                                    <div key={i} className="relative pb-2">
                                        <div className="absolute -left-[21px] top-1.5 h-3 w-3 rounded-full bg-primary border-2 border-white shadow-sm" />
                                        <span className="text-[10px] text-muted-foreground font-mono">{a.time}</span>
                                        <p className="text-sm text-foreground mt-1.5 font-medium leading-relaxed">{a.content}</p>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="notifications">
                            <div className="space-y-4">
                                {[
                                    { type: "系统通知", content: "您的密码已在 2 小时前登录另一台受信任设备。", date: "16:20", urgent: false },
                                    { type: "任务提醒", content: "郭经理将您添加为 [车规级磁路平台] 的项目成员。", date: "14:10", urgent: true },
                                    { type: "评审推送", content: "图纸 DRW-2025-X1 有新的用户批注，请确认。", date: "09:30", urgent: true },
                                ].map((n, i) => (
                                    <div key={i} className={`p-4 rounded-xl border flex gap-4 ${n.urgent ? "bg-amber-500/5 border-amber-500/20" : "bg-card"}`}>
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${n.urgent ? "bg-amber-100 text-amber-600" : "bg-muted text-muted-foreground"}`}>
                                            <Bell className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{n.type}</span>
                                                <span className="text-[10px] text-muted-foreground">{n.date}</span>
                                            </div>
                                            <p className="text-sm font-medium">{n.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
