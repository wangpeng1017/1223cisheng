"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
    SettingOutlined, BranchesOutlined, WarningOutlined, ToolOutlined,
    FileDoneOutlined, PlusOutlined, RiseOutlined, ExperimentOutlined,
} from "@ant-design/icons"
import { Button, Tag, Card, Tabs, Table, Modal, Input, App, Spin } from "antd"
import type { TableProps } from "antd"

interface ProcessStep { id: number; step_no: string; name: string; params: string; status: string }
interface RiskRow { id: number; op: string; mode: string; effect: string; measure: string; sod: string; status: string }
interface Prototype { id: number; batch_no: string; qty: string; result: string; date: string }

export default function DFMPage() {
    const [steps, setSteps] = useState<ProcessStep[]>([])
    const [risks, setRisks] = useState<RiskRow[]>([])
    const [prototypes, setPrototypes] = useState<Prototype[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const { message } = App.useApp()

    useEffect(() => {
        Promise.all([
            fetch("/api/process-steps").then(r => r.json()),
            fetch("/api/pfmea-risks").then(r => r.json()),
            fetch("/api/prototypes").then(r => r.json()),
        ]).then(([s, r, p]) => {
            setSteps(s); setRisks(r); setPrototypes(p)
        }).catch(() => message.error("加载数据失败"))
        .finally(() => setLoading(false))
    }, [])

    const toggleRiskStatus = async (record: RiskRow) => {
        const newStatus = record.status === "已改进" ? "追踪中" : "已改进"
        await fetch("/api/pfmea-risks", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: record.id, status: newStatus }),
        })
        setRisks(prev => prev.map(r => r.id === record.id ? { ...r, status: newStatus } : r))
        message.info(`风险条目状态已更新为：${newStatus}`)
    }

    const riskColumns: TableProps<RiskRow>["columns"] = [
        { title: "工序", dataIndex: "op", render: (t: string) => <span className="font-medium text-sm">{t}</span> },
        { title: "潜在失效模式", dataIndex: "mode" },
        { title: "失效影响", dataIndex: "effect", render: (t: string) => <span className="text-xs text-gray-400">{t}</span> },
        { title: "预防/探测措施", dataIndex: "measure", render: (t: string) => <span className="text-xs text-gray-400 italic">{t}</span> },
        { title: "SOD (风险评分)", dataIndex: "sod", align: "center", render: (t: string) => <Tag color="warning" className="font-mono">{t}</Tag> },
        {
            title: "状态", dataIndex: "status", render: (t: string, record: RiskRow) => (
                <Tag
                    color={t === "已改进" ? "success" : "warning"}
                    className="cursor-pointer"
                    onClick={() => toggleRiskStatus(record)}
                >
                    {t}
                </Tag>
            )
        },
    ]

    const tabItems = [
        {
            key: "workflow",
            label: <span className="flex items-center gap-2"><BranchesOutlined />工艺路线设计</span>,
            children: (
                <div className="grid gap-6 md:grid-cols-4">
                    <Card className="md:col-span-3" title="工艺路线 A-2 (优化版)">
                        <p className="text-gray-400 text-xs mb-6">当前产品: 新款磁体单元 Gen3</p>
                        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                            {steps.map((s, i) => (
                                <div key={s.id} className="relative flex items-start gap-6 pl-2">
                                    <div className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border shadow-sm z-10 ${s.status === "completed" ? "bg-emerald-500 border-emerald-500 text-white" :
                                        s.status === "in-progress" ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-300 text-gray-400"
                                        }`}>
                                        {s.status === "completed" ? <FileDoneOutlined style={{ fontSize: 12 }} /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                                    </div>
                                    <div className="flex-1 rounded-xl p-4 border border-gray-200 bg-slate-50 hover:border-blue-300 transition-colors shadow-sm">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-mono font-semibold text-slate-500">{s.step_no}</span>
                                            <Tag color={s.status === "completed" ? "success" : "default"}>{s.status}</Tag>
                                        </div>
                                        <h4 className="font-bold text-slate-900">{s.name}</h4>
                                        <p className="text-xs text-slate-600 mt-1">关键参数: {s.params}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                    <Card title={<span className="flex items-center gap-2 text-blue-600"><SettingOutlined />工序配置助手</span>}>
                        <div className="space-y-4">
                            <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                                <p className="text-xs text-blue-700">基于磁体单元 R&D 规范：建议步骤 30 关联 AI 尺寸自动监测量具，以降低人工操作误差。</p>
                            </div>
                            <Button block size="small">从标准库同步参数</Button>
                            <Button block size="small">调整工序顺序</Button>
                        </div>
                    </Card>
                </div>
            )
        },
        {
            key: "risk",
            label: <span className="flex items-center gap-2"><WarningOutlined />风险评估 (PFMEA)</span>,
            children: (
                <Card>
                    <Table dataSource={risks} columns={riskColumns} rowKey="id" pagination={false} />
                </Card>
            )
        },
        {
            key: "prototype",
            label: <span className="flex items-center gap-2"><ExperimentOutlined />打样与验证</span>,
            children: (
                <div className="grid gap-6 md:grid-cols-2">
                    <Card title="夹具设计 (Fixtures)" extra={<Button type="link" size="small">查看 3D</Button>}>
                        <div className="aspect-video rounded-xl bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-200 mb-4 relative">
                            <ToolOutlined style={{ fontSize: 48 }} className="text-gray-200" />
                            <span className="text-xs text-gray-400 absolute bottom-4">Jig-Magnet-301.STL 加载中...</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-lg border">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">精密装配夹具 V1.2</span>
                                <span className="text-[10px] text-gray-400">最后更新: 2025-12-22</span>
                            </div>
                            <Tag color="success" className="cursor-pointer" onClick={() => message.info("Jig-Magnet-301.STL 设计锁定")}>设计完成</Tag>
                        </div>
                    </Card>
                    <Card title="打样进度与评审">
                        <p className="text-gray-400 text-xs mb-4">最近打样批次情况</p>
                        <div className="space-y-4">
                            {prototypes.map((b) => (
                                <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center font-bold text-white text-xs shadow-sm">P</div>
                                        <div className="grid gap-0.5">
                                            <span className="text-sm font-bold text-slate-800">{b.batch_no}</span>
                                            <span className="text-[10px] text-slate-500 font-medium">{b.qty} / {b.date}</span>
                                        </div>
                                    </div>
                                    <Tag color={b.result === "待评审" ? "default" : "processing"}>{b.result}</Tag>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )
        },
        {
            key: "grr",
            label: <span className="flex items-center gap-2"><RiseOutlined />GRR/CRR 验证</span>,
            children: (
                <Card className="flex items-center justify-center h-96 text-gray-400 text-sm italic">
                    GRR 仪表盘加载中，正在连接量具数据采集系统...
                </Card>
            )
        },
    ]

    if (loading) return <div className="flex items-center justify-center h-96"><Spin size="large" /></div>

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">DFM 策划</h1>
                    <p className="text-gray-500 mt-1">面向制造的设计同步、PFMEA 风险识别与打样验证流程</p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={() => message.info("报告上传功能已就绪")}>上传 DFM 报告</Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>发起评审</Button>
                </div>
            </div>
            <Tabs defaultActiveKey="workflow" items={tabItems} />
            <Modal title="发起 DFM 专家评审" open={isModalOpen}
                onOk={() => { message.success("评审已发起"); setIsModalOpen(false) }}
                onCancel={() => setIsModalOpen(false)} okText="确认发起">
                <p className="text-gray-400 text-sm mb-4">选择参与评审的跨部门专家，并设定评审截止时间。</p>
                <div className="grid gap-4 py-2">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="text-right text-sm font-bold">评审专家</span>
                        <Input className="col-span-3" placeholder="例如：工艺部、模具部、质量部" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="text-right text-sm font-bold">截止日期</span>
                        <Input className="col-span-3" type="date" />
                    </div>
                </div>
            </Modal>
        </div>
    )
}
