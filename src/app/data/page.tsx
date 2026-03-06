"use client"

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
