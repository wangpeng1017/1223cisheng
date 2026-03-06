# -*- coding: utf-8 -*-
import os
base = "/Users/wangpeng/Downloads/cisheng/src/app"

# ==================== q-plan/page.tsx ====================
qplan = r'''"use client"

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
'''

with open(os.path.join(base, "q-plan", "page.tsx"), "w", encoding="utf-8") as f:
    f.write(qplan)
print("OK: q-plan/page.tsx")

# ==================== admin/page.tsx ====================
admin = r'''"use client"

import { useState, useEffect } from "react"
import {
    SettingOutlined, SafetyCertificateOutlined, HistoryOutlined, BellOutlined,
    LockOutlined, RightOutlined, UserAddOutlined,
} from "@ant-design/icons"
import { Button, Tag, Card, Tabs, Table, App, Spin } from "antd"
import type { TableProps } from "antd"

interface LogEntry { id: number; user_name: string; module: string; action: string; ip: string; status: string; created_at: string }
interface Role { id: number; name: string; member_count: number; description: string }
interface Setting { id: number; setting_key: string; setting_name: string; description: string; enabled: boolean; category: string }

export default function AdminPage() {
    const { message } = App.useApp()
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [roles, setRoles] = useState<Role[]>([])
    const [settings, setSettings] = useState<Setting[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            fetch("/api/audit-logs").then(r => r.json()),
            fetch("/api/roles").then(r => r.json()),
            fetch("/api/settings").then(r => r.json()),
        ]).then(([l, r, s]) => {
            setLogs(l); setRoles(r); setSettings(s)
        }).catch(() => message.error("加载数据失败"))
        .finally(() => setLoading(false))
    }, [])

    const toggleSetting = async (key: string, currentEnabled: boolean) => {
        await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ setting_key: key, enabled: !currentEnabled }) })
        setSettings(prev => prev.map(s => s.setting_key === key ? { ...s, enabled: !currentEnabled } : s))
        message.success("设置已更新")
    }

    const logColumns: TableProps<LogEntry>["columns"] = [
        { title: "时间", dataIndex: "created_at", render: (t: string) => <span className="font-mono text-xs text-gray-400">{new Date(t).toLocaleString("zh-CN")}</span> },
        { title: "用户", dataIndex: "user_name", render: (t: string) => <span className="font-medium">{t}</span> },
        { title: "模块", dataIndex: "module" },
        { title: "操作", dataIndex: "action", render: (t: string) => <span className="text-gray-400 italic">{t}</span> },
        { title: "IP 地址", dataIndex: "ip", render: (t: string) => <span className="font-mono text-xs">{t}</span> },
        { title: "状态", dataIndex: "status", align: "right", render: (t: string) => <Tag color={t === "成功" ? "success" : "error"}>{t}</Tag> },
    ]

    const notifSettings = settings.filter(s => s.category === "notification")
    const securitySettings = settings.filter(s => s.category === "security")

    const tabItems = [
        {
            key: "roles",
            label: <span className="flex items-center gap-2"><SafetyCertificateOutlined />权限与角色</span>,
            children: (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {roles.map((r) => (
                        <Card key={r.id} hoverable>
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-base font-bold">{r.name}</h3>
                                <Tag>{r.member_count} 人</Tag>
                            </div>
                            <p className="text-xs text-gray-400 mb-3">{r.description}</p>
                            <Button type="link" size="small" className="p-0" onClick={() => message.info(`正在查看 ${r.name} 的权限详情`)}>
                                管理权限范围 <RightOutlined />
                            </Button>
                        </Card>
                    ))}
                </div>
            )
        },
        {
            key: "logs",
            label: <span className="flex items-center gap-2"><HistoryOutlined />操作日志</span>,
            children: <Card><Table dataSource={logs} columns={logColumns} rowKey="id" pagination={{ pageSize: 10 }} /></Card>
        },
        {
            key: "settings",
            label: <span className="flex items-center gap-2"><SettingOutlined />全局设置</span>,
            children: (
                <div className="grid gap-6 md:grid-cols-2">
                    <Card title={<span className="flex items-center gap-2"><BellOutlined />通知推送配置</span>}>
                        <div className="space-y-4">
                            {notifSettings.map(s => (
                                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{s.setting_name}</span>
                                        <span className="text-xs text-gray-400">{s.description}</span>
                                    </div>
                                    <Tag color={s.enabled ? "success" : "default"} className="cursor-pointer" onClick={() => toggleSetting(s.setting_key, s.enabled)}>
                                        {s.enabled ? "已开启" : "未设置"}
                                    </Tag>
                                </div>
                            ))}
                        </div>
                    </Card>
                    <Card title={<span className="flex items-center gap-2"><LockOutlined />安全加固</span>}>
                        <div className="space-y-4">
                            {securitySettings.map(s => (
                                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{s.setting_name}</span>
                                        <span className="text-xs text-gray-400">{s.description}</span>
                                    </div>
                                    <Tag color={s.enabled ? "success" : "default"} className="cursor-pointer" onClick={() => toggleSetting(s.setting_key, s.enabled)}>
                                        {s.enabled ? "已开启" : "已关闭"}
                                    </Tag>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )
        },
    ]

    if (loading) return <div className="flex items-center justify-center h-96"><Spin size="large" /></div>

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">系统管理</h1>
                    <p className="text-gray-500 mt-1">管理系统权限、查看操作日志与全局参数配置</p>
                </div>
                <Button type="primary" icon={<UserAddOutlined />} onClick={() => message.success("正在进入新增管理员流程...")}>新增管理员</Button>
            </div>
            <Tabs defaultActiveKey="roles" items={tabItems} />
        </div>
    )
}
'''

with open(os.path.join(base, "admin", "page.tsx"), "w", encoding="utf-8") as f:
    f.write(admin)
print("OK: admin/page.tsx")
