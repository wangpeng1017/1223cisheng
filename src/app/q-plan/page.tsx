"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
    CarOutlined, CheckSquareOutlined, ExperimentOutlined, AimOutlined,
    PlusOutlined, SearchOutlined, FilterOutlined, ClockCircleOutlined,
} from "@ant-design/icons"
import { Button, Tag, Card, Tabs, Table, Input, Modal, App, Spin } from "antd"
import type { TableProps } from "antd"

interface PlanRow { id: number; plan_type: string; category: string; item: string; spec_limit: string; tool: string; sample_level: string }
interface ReliabilityTest { id: number; title: string; description: string; status: string; planned_date: string }

export default function QPlanPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [plans, setPlans] = useState<PlanRow[]>([])
    const [reliabilityTests, setReliabilityTests] = useState<ReliabilityTest[]>([])
    const [loading, setLoading] = useState(true)
    const { message } = App.useApp()

    useEffect(() => {
        Promise.all([
            fetch("/api/qplan").then(r => r.json()),
            fetch("/api/reliability-tests").then(r => r.json()),
        ]).then(([q, rt]) => {
            setPlans(q); setReliabilityTests(rt)
        }).catch(() => message.error("加载数据失败"))
        .finally(() => setLoading(false))
    }, [])

    const iqcPlans = plans.filter(p => p.plan_type === "IQC")
    const oqcPlans = plans.filter(p => p.plan_type === "OQC")

    const filteredIqc = iqcPlans.filter(p =>
        p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.tool.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const planColumns: TableProps<PlanRow>["columns"] = [
        { title: "物料类别", dataIndex: "category", render: (t: string) => <span className="font-bold text-sm">{t}</span> },
        { title: "检验项目", dataIndex: "item", render: (t: string) => <span className="text-sm font-medium">{t}</span> },
        { title: "判定指标 (U/L Limit)", dataIndex: "spec_limit", render: (t: string) => <span className="font-mono text-xs text-slate-500">{t}</span> },
        { title: "检验工具/设备", dataIndex: "tool", render: (t: string) => <span className="text-sm font-medium">{t}</span> },
        { title: "抽样水平", dataIndex: "sample_level", render: (t: string) => <Tag className="font-bold">{t}</Tag> },
        { title: "操作", key: "action", align: "right", render: (_: any, record: PlanRow) => (
            <Button type="link" size="small" onClick={() => message.info(`编辑条目：${record.item}`)}>编辑</Button>
        )},
    ]

    const tabItems = [
        {
            key: "iqc",
            label: <span className="flex items-center gap-2"><CarOutlined />IQC 来料计划</span>,
            children: (
                <Card>
                    <div className="flex items-center justify-between border-b pb-4 mb-4">
                        <div>
                            <h3 className="text-lg font-bold">磁声 Gen3 模型 - IQC 检验清单</h3>
                            <p className="text-xs text-gray-400">关联标准: GB/T 2828.1 抽样标准, AQL: 0.65</p>
                        </div>
                        <Tag color="processing">当前生效 V1.4</Tag>
                    </div>
                    <Table dataSource={filteredIqc} columns={planColumns} rowKey="id" pagination={false} />
                </Card>
            )
        },
        {
            key: "oqc",
            label: <span className="flex items-center gap-2"><CheckSquareOutlined />OQC 出货计划</span>,
            children: oqcPlans.length > 0
                ? <Card><Table dataSource={oqcPlans} columns={planColumns} rowKey="id" pagination={false} /></Card>
                : <Card className="p-8 text-center text-gray-400">OQC 出货计划模块建设中…</Card>
        },
        {
            key: "reliability",
            label: <span className="flex items-center gap-2"><ExperimentOutlined />可靠性测试 (ORT)</span>,
            children: (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {reliabilityTests.map((test) => (
                        <Card key={test.id} hoverable>
                            <h3 className="text-sm font-bold mb-1">{test.title}</h3>
                            <p className="text-xs text-gray-400 mb-3">{test.description}</p>
                            <div className="flex justify-between items-center">
                                <Tag color={test.status === "已完成" ? "success" : test.status === "进行中" ? "processing" : "warning"}>{test.status}</Tag>
                                <span className="text-[10px] text-gray-400 flex items-center gap-1"><ClockCircleOutlined /> 计划: {test.planned_date}</span>
                            </div>
                        </Card>
                    ))}
                </div>
            )
        },
        {
            key: "metrology",
            label: <span className="flex items-center gap-2"><AimOutlined />测量方案设计</span>,
            children: (
                <Card className="flex flex-col items-center justify-center h-80 border-dashed">
                    <AimOutlined style={{ fontSize: 48 }} className="text-gray-200 mb-4" />
                    <p className="text-sm text-gray-400">测量方案策划面板：请先从 [产品主数据] 导入 3D 测量点位分布图</p>
                    <Button type="link" size="small" className="mt-2" onClick={() => message.info("正在调齐 3D 图纸库...")}>浏览图纸库</Button>
                </Card>
            )
        },
    ]

    if (loading) return <div className="flex items-center justify-center h-96"><Spin size="large" /></div>

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Q-Plan 管理</h1>
                    <p className="text-gray-500 mt-1">质量检验计划、抽样标准与可靠性测试方案定义</p>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>制定质量计划</Button>
            </div>
            <div className="flex gap-4">
                <Input placeholder="检索检验标准或测试项..." prefix={<SearchOutlined className="text-gray-400" />}
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1" allowClear />
                <Button icon={<FilterOutlined />} onClick={() => message.info("高级筛选功能正在开发中...")}>筛选标准库</Button>
            </div>
            <Tabs defaultActiveKey="iqc" items={tabItems} />
            <Modal title="制定 NPI 质量保证计划" open={isModalOpen}
                onOk={() => { message.success("质量计划已创建"); setIsModalOpen(false) }}
                onCancel={() => setIsModalOpen(false)} okText="立即保存">
                <p className="text-gray-400 text-sm mb-4">导入 Control Plan (CP) 模板或手动定义关键检验项。</p>
                <div className="grid gap-4 py-2">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="text-right text-sm font-bold">计划类型</span>
                        <Input className="col-span-3" placeholder="例如：IQC 阶段、Process 阶段" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="text-right text-sm font-bold">对接机型</span>
                        <Input className="col-span-3" placeholder="选择关联的产品型号" />
                    </div>
                </div>
            </Modal>
        </div>
    )
}
