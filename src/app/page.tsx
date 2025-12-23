"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts"
import {
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  MoreVertical,
  Activity,
  Layers,
  History
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const stats = [
  {
    title: "在研项目总数",
    value: "24",
    change: "+12%",
    trend: "up",
    icon: Activity,
    color: "text-blue-500",
  },
  {
    title: "本月节点达成率",
    value: "94.2%",
    change: "+2.5%",
    trend: "up",
    icon: CheckCircle2,
    color: "text-emerald-500",
  },
  {
    title: "延期任务预警",
    value: "3",
    change: "-1",
    trend: "down",
    icon: AlertCircle,
    color: "text-rose-500",
  },
  {
    title: "人均资源负荷",
    value: "82%",
    change: "+5%",
    trend: "up",
    icon: Clock,
    color: "text-amber-500",
  },
]

const chartData = [
  { name: "DROP", value: 85, target: 90 },
  { name: "Proto", value: 72, target: 80 },
  { name: "EVT", value: 65, target: 75 },
  { name: "DVT", value: 92, target: 95 },
  { name: "PVT", value: 45, target: 60 },
  { name: "RAMP", value: 30, target: 50 },
]

const pieData = [
  { name: "进行中", value: 15, color: "var(--primary)" },
  { name: "已交付", value: 8, color: "oklch(0.7 0.15 160)" },
  { name: "已延期", value: 3, color: "oklch(0.6 0.2 25)" },
]

const urgentTasks = [
  { id: 1, title: "新款磁体单元图纸评审", project: "Project-X1", status: "延期", deadline: "今日 18:00", priority: "高" },
  { id: 2, title: "DFM 工艺风险评估", project: "Mars-L2", status: "待办", deadline: "明日 12:00", priority: "中" },
  { id: 3, title: "原型机打样结果确认", project: "Alpha-S1", status: "处理中", deadline: "2天后", priority: "高" },
]

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8 p-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">管理看板</h1>
          <p className="text-muted-foreground mt-1">
            欢迎回来，张工。当前共有 <span className="text-foreground font-medium">24</span> 个在研项目，其中 <span className="text-rose-500 font-medium">3</span> 项存在风险。
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <History className="h-4 w-4" />
            查看历史
          </Button>
          <Button className="gap-2 shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" />
            新建项目
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="bg-card/40 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-1 mt-1">
                {stat.trend === "up" ? (
                  <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-rose-500" />
                )}
                <span className={`text-xs ${stat.trend === "up" ? "text-emerald-500" : "text-rose-500"}`}>
                  {stat.change}
                </span>
                <span className="text-[10px] text-muted-foreground ml-1">较上月</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Main Chart */}
        <Card className="lg:col-span-4 bg-card/40 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              NPI 阶段节点达成率统计
            </CardTitle>
            <CardDescription>各阶段里程碑节点的平均计划达成时间 vs 实际耗时</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] pl-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted) / 0.2)" }}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))"
                  }}
                  itemStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="target" fill="oklch(1 0 0 / 10%)" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Project Distribution */}
        <Card className="lg:col-span-3 bg-card/40 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">项目活跃度分布</CardTitle>
            <CardDescription>当前在研项目的生命周期阶段分布</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-[350px]">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-4 w-full mt-4">
              {pieData.map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="text-lg font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Urgent Tasks */}
        <Card className="bg-card/40 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">紧急任务提醒</CardTitle>
              <CardDescription>需要优先处理的延期或临期任务</CardDescription>
            </div>
            <Button variant="ghost" size="sm">全部任务</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {urgentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors">
                  <div className="flex gap-4">
                    <div className={`mt-1 h-2 w-2 rounded-full ${task.priority === "高" ? "bg-rose-500" : "bg-amber-500"}`} />
                    <div className="grid gap-1">
                      <span className="font-medium text-sm">{task.title}</span>
                      <span className="text-xs text-muted-foreground">{task.project}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={task.status === "延期" ? "destructive" : "secondary"} className="text-[10px]">
                        {task.status}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {task.deadline}
                      </span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed placeholder */}
        <Card className="bg-card/40 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">最近项目动态</CardTitle>
            <CardDescription>研发流转过程中的最新操作记录</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex gap-4 relative">
                  {item !== 3 && <div className="absolute left-2 top-8 bottom-[-24px] w-px bg-border/50" />}
                  <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center shrink-0 z-10 mt-1">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <div className="grid gap-1.5">
                    <p className="text-sm">
                      <span className="font-semibold">王工</span> 提交了 <span className="text-primary font-medium">Alpha-S1</span> 项目的
                      <span className="mx-1 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-xs">Q-Plan 计划书</span>
                    </p>
                    <span className="text-xs text-muted-foreground">15 分钟前</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
