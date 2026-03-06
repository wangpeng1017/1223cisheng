"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
    UserOutlined, CalendarOutlined, ClockCircleOutlined, MailOutlined,
    BellOutlined, RightOutlined, TrophyOutlined, ThunderboltOutlined,
    LogoutOutlined, EditOutlined, BookOutlined, SearchOutlined,
} from "@ant-design/icons"
import { Button, Tag, Card, Tabs, Avatar, Modal, Input, App, Spin } from "antd"

interface UserProfile {
    id: number; user_name: string; display_name: string; email: string; role: string;
    avatar_url: string; joined_at: string; last_login: string;
    total_reviews: number; active_projects: number;
}
interface Activity { id: number; time_label: string; content: string }
interface Notification { id: number; type: string; content: string; time_label: string; status: string; color: string }
interface WatchedProject { id: number; project_name: string }

export default function UserCenterPage() {
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [activities, setActivities] = useState<Activity[]>([])
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [watchedProjects, setWatchedProjects] = useState<WatchedProject[]>([])
    const [notifSearch, setNotifSearch] = useState("")
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const { message } = App.useApp()

    useEffect(() => {
        fetch("/api/user-profile").then(r => r.json())
            .then((data) => {
                setProfile(data.profile)
                setActivities(data.activities || [])
                setNotifications(data.notifications || [])
                setWatchedProjects(data.watched_projects || [])
            })
            .catch(() => message.error("加载用户数据失败"))
            .finally(() => setLoading(false))
    }, [])

    const filteredNotifs = notifications.filter(n =>
        n.content.toLowerCase().includes(notifSearch.toLowerCase()) ||
        n.type.toLowerCase().includes(notifSearch.toLowerCase())
    )

    const clearAllRead = async () => {
        await fetch("/api/notifications", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "clearRead" }) })
        setNotifications(prev => prev.filter(n => n.status === "unread"))
        message.success("已清理所有已读通知")
    }

    const markAsRead = async (id: number) => {
        await fetch("/api/notifications", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "markRead", id }) })
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: "read" } : n))
    }

    const colorMap: Record<string, string> = {
        "审批": "text-blue-500 bg-blue-50",
        "预警": "text-rose-500 bg-rose-50",
        "任务": "text-amber-500 bg-amber-50",
        "系统": "text-gray-500 bg-gray-50",
    }

    const tabItems = [
        {
            key: "activity",
            label: <span className="flex items-center gap-2"><ThunderboltOutlined />动态轨迹</span>,
            children: (
                <div className="space-y-8 pl-4 border-l border-gray-200 mt-4">
                    {activities.map((a) => (
                        <div key={a.id} className="relative pb-2">
                            <div className="absolute -left-[21px] top-1.5 h-3 w-3 rounded-full bg-blue-600 border-2 border-white shadow-sm" />
                            <span className="text-[10px] text-gray-400 font-mono">{a.time_label}</span>
                            <p className="text-sm mt-1.5 font-medium leading-relaxed">{a.content}</p>
                        </div>
                    ))}
                </div>
            )
        },
        {
            key: "notifications",
            label: <span className="flex items-center gap-2"><BellOutlined />消息中心</span>,
            children: (
                <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-6 bg-slate-50 p-2 rounded-lg">
                        <SearchOutlined className="text-gray-400 ml-2" />
                        <Input placeholder="搜索通知内容..." variant="borderless" value={notifSearch} onChange={(e) => setNotifSearch(e.target.value)} />
                        <Button type="text" size="small" onClick={clearAllRead}>一键标为已读</Button>
                    </div>
                    {filteredNotifs.map((n) => (
                        <div key={n.id} className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors group relative cursor-pointer"
                            onClick={() => markAsRead(n.id)}>
                            <div className={`mt-1 p-2 rounded-lg ${colorMap[n.type] || "text-gray-500 bg-gray-50"}`}>
                                <BellOutlined />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <Tag>{n.type}</Tag>
                                    <span className="text-[10px] text-gray-400">{n.time_label}</span>
                                </div>
                                <p className={`text-sm ${n.status === "unread" ? "font-bold text-slate-900" : "text-slate-600"}`}>{n.content}</p>
                            </div>
                            {n.status === "unread" && <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-blue-500 ring-4 ring-white" />}
                        </div>
                    ))}
                </div>
            )
        }
    ]

    if (loading || !profile) return <div className="flex items-center justify-center h-96"><Spin size="large" /></div>

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-8 rounded-2xl bg-blue-50/50 border border-blue-100 relative overflow-hidden">
                <div className="flex items-center gap-6 z-10">
                    <Avatar size={96} src={profile.avatar_url || undefined} className="border-4 border-white shadow-xl">{profile.display_name?.[0]}</Avatar>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">{profile.display_name}</h1>
                            <Tag color="processing">{profile.role}</Tag>
                        </div>
                        <p className="text-gray-500 flex items-center gap-2"><MailOutlined /> {profile.email}</p>
                        <div className="flex items-center gap-4 pt-1">
                            <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium"><CalendarOutlined /> 入职: {profile.joined_at}</div>
                            <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium"><ClockCircleOutlined /> 最近登录: {profile.last_login}</div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 z-10">
                    <Button icon={<EditOutlined />} onClick={() => setIsEditModalOpen(true)}>编辑资料</Button>
                    <Button danger type="text" icon={<LogoutOutlined />} onClick={() => message.warning("确定要登出系统吗？")}>退出登录</Button>
                </div>
                <div className="absolute -right-16 -top-16 h-64 w-64 bg-blue-100/50 rounded-full blur-3xl" />
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                <div className="space-y-8">
                    <Card title={<span className="flex items-center gap-2 text-blue-600"><TrophyOutlined />评审成就</span>}>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-gray-50 border text-center">
                                <span className="text-2xl font-bold">{profile.total_reviews}</span>
                                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">累计审核</p>
                            </div>
                            <div className="p-4 rounded-xl bg-gray-50 border text-center">
                                <span className="text-2xl font-bold">{profile.active_projects}</span>
                                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">进行中项目</p>
                            </div>
                        </div>
                    </Card>
                    <Card title={<span className="flex items-center gap-2"><BookOutlined />我的关注</span>}>
                        <div className="space-y-3">
                            {watchedProjects.map((p) => (
                                <div key={p.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer group">
                                    <span className="text-sm font-medium">{p.project_name}</span>
                                    <RightOutlined className="text-gray-400 opacity-0 group-hover:opacity-100 transition-all" />
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Tabs defaultActiveKey="activity" items={tabItems} />
                </div>
            </div>

            <Modal title="编辑个人资料" open={isEditModalOpen}
                onOk={() => { message.success("个人资料已更新"); setIsEditModalOpen(false) }}
                onCancel={() => setIsEditModalOpen(false)} okText="保存更改">
                <p className="text-gray-400 text-sm mb-4">修改您的头像、职位信息或联系方式。</p>
                <div className="grid gap-4 py-2">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="text-right text-sm">职位</span>
                        <Input className="col-span-3" defaultValue={profile.role} />
                    </div>
                </div>
            </Modal>
        </div>
    )
}
