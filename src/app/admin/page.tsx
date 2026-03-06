"use client"

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
