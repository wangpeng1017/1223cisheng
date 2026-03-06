# -*- coding: utf-8 -*-
# Update page.tsx (Dashboard) and data/page.tsx to use API

import os

base = "/Users/wangpeng/Downloads/cisheng/src/app"

# ==================== Dashboard page.tsx ====================
dashboard = r'''"use client"

import * as React from "react"
import { useState, useEffect } from "react"

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts"
import { Card, Button, Tag, App, Spin } from "antd"
import {
  ArrowUpOutlined, ArrowDownOutlined, ClockCircleOutlined, CheckCircleOutlined,
  ExclamationCircleOutlined, DownloadOutlined, ThunderboltOutlined,
  AppstoreOutlined, MoreOutlined,
} from "@ant-design/icons"

interface DashboardData {
  stats: { totalProjects: number; completionRate: number; delayedCount: number; avgLoad: number }
  chartData: { name: string; value: number; target: number }[]
  pieData: { name: string; value: number; color: string }[]
  urgentTasks: { id: number; title: string; project: string; status: string; deadline: string; priority: string }[]
  activities: { content: string; created_at: string }[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [urgentSearch, setUrgentSearch] = useState("")
  const { message } = App.useApp()

  useEffect(() => {
    fetch("/api/dashboard")
      .then(res => res.json())
      .then(setData)
      .catch(() => message.error("加载看板数据失败"))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-96"><Spin size="large" /></div>
  if (!data) return <div className="p-8 text-center text-gray-400">暂无数据</div>

  const stats = [
    { title: "在研项目总数", value: String(data.stats.totalProjects), change: "+12%", trend: "up", icon: <ThunderboltOutlined style={{ fontSize: 20 }} />, color: "#3b82f6" },
    { title: "本月节点达成率", value: `${data.stats.completionRate}%`, change: "+2.5%", trend: "up", icon: <CheckCircleOutlined style={{ fontSize: 20 }} />, color: "#10b981" },
    { title: "延期任务预警", value: String(data.stats.delayedCount), change: "-1", trend: "down", icon: <ExclamationCircleOutlined style={{ fontSize: 20 }} />, color: "#f43f5e" },
    { title: "人均资源负荷", value: `${data.stats.avgLoad}%`, change: "+5%", trend: "up", icon: <ClockCircleOutlined style={{ fontSize: 20 }} />, color: "#f59e0b" },
  ]

  const filteredTasks = data.urgentTasks.filter(t =>
    t.title.toLowerCase().includes(urgentSearch.toLowerCase()) ||
    t.project.toLowerCase().includes(urgentSearch.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">管理看板</h1>
          <p className="text-gray-500 mt-1">NPI 项目集关键指标、阶段达成率与异常风险全景视图</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => { setLoading(true); fetch("/api/dashboard").then(r => r.json()).then(setData).finally(() => setLoading(false)) }}>同步数据</Button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={() => message.success("数据看板已导出")}>导出报告</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} hoverable className="bg-white/40 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">{stat.title}</span>
              <span style={{ color: stat.color }}>{stat.icon}</span>
            </div>
            <div className="text-3xl font-bold">{stat.value}</div>
            <div className="flex items-center gap-1 mt-1">
              {stat.trend === "up" ? <ArrowUpOutlined className="text-emerald-500 text-xs" /> : <ArrowDownOutlined className="text-rose-500 text-xs" />}
              <span className={`text-xs ${stat.trend === "up" ? "text-emerald-500" : "text-rose-500"}`}>{stat.change}</span>
              <span className="text-[10px] text-gray-400 ml-1">较上月</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4" title={<span className="flex items-center gap-2"><AppstoreOutlined className="text-blue-600" />NPI 阶段节点达成率统计</span>}>
          <p className="text-gray-400 text-sm mb-4">各阶段里程碑节点的平均计划达成时间 vs 实际耗时</p>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" stroke="#999" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#999" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip cursor={{ fill: "rgba(37, 99, 235, 0.05)" }} contentStyle={{ backgroundColor: "white", border: "1px solid #f0f0f0", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)", padding: "12px" }} />
                <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="target" fill="#e5e7eb" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-3" title="项目活跃度分布">
          <p className="text-gray-400 text-sm mb-4">当前在研项目的生命周期阶段分布</p>
          <div className="flex flex-col items-center justify-center">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.pieData.filter(d => d.value > 0)} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value">
                    {data.pieData.filter(d => d.value > 0).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-4 gap-4 w-full mt-4">
              {data.pieData.map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-gray-500">{item.name}</span>
                  </div>
                  <span className="text-lg font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-9 w-64 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1 shadow-sm">
              <ThunderboltOutlined className="text-gray-400" />
              <input placeholder="搜索任务或项目..." className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400" value={urgentSearch} onChange={(e) => setUrgentSearch(e.target.value)} />
            </div>
            <Button type="text" size="small">全部任务</Button>
          </div>
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-all group cursor-pointer" onClick={() => message.info(`查看任务: ${task.title}`)}>
                <div className="flex gap-4">
                  <div className={`mt-1 h-2 w-2 rounded-full ${task.priority === "高" ? "bg-rose-500" : "bg-amber-500"}`} />
                  <div className="grid gap-1">
                    <span className="font-medium text-sm group-hover:text-blue-600 transition-colors">{task.title}</span>
                    <span className="text-xs text-gray-500">{task.project}</span>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-end gap-1">
                    <Tag color={task.status === "延期" ? "error" : task.status === "预警" ? "warning" : "default"}>{task.status}</Tag>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1"><ClockCircleOutlined />{task.deadline ? new Date(task.deadline).toLocaleDateString("zh-CN") : "-"}</span>
                  </div>
                  <Button type="text" icon={<MoreOutlined />} size="small" className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
            {filteredTasks.length === 0 && <div className="text-center text-gray-400 py-8">暂无紧急任务</div>}
          </div>
        </Card>

        <Card title="最近项目动态">
          <p className="text-gray-400 text-sm mb-4">研发流转过程中的最新操作记录</p>
          <div className="space-y-6">
            {(data.activities || []).map((item, i) => (
              <div key={i} className="flex gap-4 relative">
                {i !== data.activities.length - 1 && <div className="absolute left-2 top-8 bottom-[-24px] w-px bg-gray-200" />}
                <div className="h-4 w-4 rounded-full bg-blue-100 flex items-center justify-center shrink-0 z-10 mt-1">
                  <div className="h-2 w-2 rounded-full bg-blue-600" />
                </div>
                <div className="grid gap-1.5">
                  <p className="text-sm">{item.content}</p>
                  <span className="text-xs text-gray-400">{new Date(item.created_at).toLocaleString("zh-CN")}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
'''

with open(os.path.join(base, "page.tsx"), "w", encoding="utf-8") as f:
    f.write(dashboard)
print("OK: page.tsx (Dashboard)")

# ==================== data/page.tsx ====================
data_page = r'''"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
    DatabaseOutlined, AppstoreOutlined, BulbOutlined, FileExclamationOutlined,
    SearchOutlined, PlusOutlined, MoreOutlined, DownloadOutlined, ReadOutlined,
} from "@ant-design/icons"
import { Button, Tag, Card, Tabs, Input, Table, Modal, App, Spin } from "antd"
import type { TableProps } from "antd"

interface Product { id: number; product_id: string; name: string; category: string; spec: string; status: string }
interface KnowledgeArticle { id: number; title: string; tags: string[]; views: number; content: string }
interface Defect { id: number; code: string; name: string; category: string; severity: string; description: string; solution: string; occurrence: number }

export default function BaseDataPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [products, setProducts] = useState<Product[]>([])
    const [knowledge, setKnowledge] = useState<KnowledgeArticle[]>([])
    const [defects, setDefects] = useState<Defect[]>([])
    const [loading, setLoading] = useState(true)
    const { message } = App.useApp()

    useEffect(() => {
        Promise.all([
            fetch("/api/products").then(r => r.json()),
            fetch("/api/knowledge").then(r => r.json()),
            fetch("/api/defects").then(r => r.json()),
        ]).then(([p, k, d]) => {
            setProducts(p); setKnowledge(k); setDefects(d)
        }).catch(() => message.error("加载数据失败"))
        .finally(() => setLoading(false))
    }, [])

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.product_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.category || "").toLowerCase().includes(searchTerm.toLowerCase())
    )

    const productColumns: TableProps<Product>["columns"] = [
        { title: "产品编号", dataIndex: "product_id", render: (t: string) => <span className="font-mono text-xs">{t}</span> },
        { title: "产品名称", dataIndex: "name", render: (t: string) => <span className="font-medium text-sm">{t}</span> },
        { title: "类别", dataIndex: "category", render: (t: string) => <Tag>{t}</Tag> },
        { title: "规格描述", dataIndex: "spec", render: (t: string) => <span className="text-xs text-gray-400">{t}</span> },
        { title: "状态", dataIndex: "status", render: (t: string) => (
            <div className="flex items-center gap-1.5">
                <div className={`h-1.5 w-1.5 rounded-full ${t === "激活" ? "bg-emerald-500" : t === "开发中" ? "bg-blue-500" : "bg-gray-300"}`} />
                <span className="text-xs">{t}</span>
            </div>
        )},
        { title: "操作", key: "action", align: "right", render: (_, record) => (
            <Button type="text" icon={<MoreOutlined />} size="small" onClick={() => message.info(`正在查看 ${record.name} 的详细履历`)} />
        )},
    ]

    const defectColumns: TableProps<Defect>["columns"] = [
        { title: "编码", dataIndex: "code", render: (t: string) => <span className="font-mono text-xs font-bold text-red-500">{t}</span> },
        { title: "名称", dataIndex: "name", render: (t: string) => <span className="font-medium">{t}</span> },
        { title: "类别", dataIndex: "category", render: (t: string) => <Tag>{t}</Tag> },
        { title: "严重度", dataIndex: "severity", render: (t: string) => <Tag color={t === "严重" ? "red" : t === "一般" ? "orange" : "default"}>{t}</Tag> },
        { title: "发生次数", dataIndex: "occurrence", render: (t: number) => <span className="font-bold">{t}</span> },
        { title: "原因", dataIndex: "description", ellipsis: true, render: (t: string) => <span className="text-xs text-gray-400">{t}</span> },
        { title: "解决方案", dataIndex: "solution", ellipsis: true, render: (t: string) => <span className="text-xs text-blue-500">{t}</span> },
    ]

    const tabItems = [
        {
            key: "products",
            label: <span className="flex items-center gap-2"><DatabaseOutlined />产品主数据</span>,
            children: <Card><Table dataSource={filteredProducts} columns={productColumns} rowKey="id" pagination={false} /></Card>,
        },
        {
            key: "stages",
            label: <span className="flex items-center gap-2"><AppstoreOutlined />NPI 阶段模板</span>,
            children: (
                <Card className="p-8 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="flex items-center gap-1 opacity-20">
                        {[1,2,3,4,5].map(i => (
                            <div key={i} className="flex items-center">
                                <div className="h-12 w-12 rounded-full border-2 border-gray-800" />
                                {i < 5 && <div className="w-12 h-0.5 bg-gray-800" />}
                            </div>
                        ))}
                    </div>
                    <p className="text-sm text-gray-500">NPI 阶段模板配置（DROP → Proto → EVT → DVT → PVT → MP）</p>
                    <Button size="small">编辑全局模板</Button>
                </Card>
            ),
        },
        {
            key: "knowledge",
            label: <span className="flex items-center gap-2"><ReadOutlined />评审知识库 (AI)</span>,
            children: (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {knowledge.map((k) => (
                        <Card key={k.id} hoverable onClick={() => message.success(`已打开：${k.title}`)}>
                            <h3 className="text-sm font-bold truncate">{k.title}</h3>
                            <div className="flex gap-2 pt-1 mb-3">
                                {(k.tags || []).map(tag => <Tag key={tag}>{tag}</Tag>)}
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-gray-400">
                                <span className="flex items-center gap-1"><ReadOutlined /> 点击查阅详情</span>
                                <span>引用 {k.views} 次</span>
                            </div>
                        </Card>
                    ))}
                    <Card className="border-dashed flex flex-col items-center justify-center p-6 min-h-[160px] cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => message.loading("AI 正在分析历史数据...")}>
                        <BulbOutlined style={{ fontSize: 32 }} className="text-blue-300 mb-2" />
                        <p className="text-xs text-gray-400">AI 智能提取新知识</p>
                        <Button type="link" size="small" className="mt-2">从历史评审中提取</Button>
                    </Card>
                </div>
            ),
        },
        {
            key: "defects",
            label: <span className="flex items-center gap-2"><FileExclamationOutlined />不良现象库</span>,
            children: defects.length > 0
                ? <Card><Table dataSource={defects} columns={defectColumns} rowKey="id" pagination={false} /></Card>
                : <Card className="p-8 text-center text-gray-400">不良现象库模块建设中…</Card>,
        },
    ]

    if (loading) return <div className="flex items-center justify-center h-96"><Spin size="large" /></div>

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">基础数据模块</h1>
                    <p className="text-gray-500 mt-1">管理系统核心主数据、NPI 标准阶段与 AI 知识库</p>
                </div>
                <div className="flex gap-3">
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>新增产品</Button>
                    <Button icon={<DownloadOutlined />} onClick={() => message.info("正在导出全量数据...")}>导出</Button>
                </div>
            </div>

            <Input placeholder="搜索产品、知识条目或错误代码..." prefix={<SearchOutlined className="text-gray-400" />}
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} allowClear />

            <Tabs defaultActiveKey="products" items={tabItems} />

            <Modal title="录入产品主数据" open={isModalOpen}
                onOk={() => { message.success("产品录入成功"); setIsModalOpen(false) }}
                onCancel={() => setIsModalOpen(false)} okText="提交保存" cancelText="取消">
                <p className="text-gray-400 text-sm mb-4">请完整填写产品的基础技术参数。</p>
                <div className="grid gap-4 py-2">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="text-right text-sm">名称</span>
                        <Input className="col-span-3" placeholder="例如：新款磁体单元" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="text-right text-sm">类别</span>
                        <Input className="col-span-3" placeholder="磁性核心 / 声学 / 传感器" />
                    </div>
                </div>
            </Modal>
        </div>
    )
}
'''

with open(os.path.join(base, "data", "page.tsx"), "w", encoding="utf-8") as f:
    f.write(data_page)
print("OK: data/page.tsx")
