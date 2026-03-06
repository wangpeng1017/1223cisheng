"use client"

import { Input, Badge, Avatar, Button } from "antd"
import { SearchOutlined, BellOutlined } from "@ant-design/icons"

export function AppNavbar() {
    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center gap-4 border-b border-gray-200 bg-white px-6">
            <div className="flex flex-1 items-center gap-4 md:gap-8">
                {/* 搜索框 */}
                <Input
                    placeholder="搜索项目、图纸、任务..."
                    prefix={<SearchOutlined className="text-gray-400" />}
                    className="ml-auto sm:w-[300px] md:w-[400px] lg:w-[500px]"
                    variant="filled"
                    allowClear
                />

                <div className="flex items-center gap-3">
                    {/* 通知按钮 */}
                    <Badge dot>
                        <Button type="text" icon={<BellOutlined style={{ fontSize: 18 }} />} />
                    </Badge>

                    <div className="h-4 w-px bg-gray-200 mx-1" />

                    {/* 用户信息 */}
                    <div className="flex items-center gap-3 pl-2">
                        <div className="flex flex-col items-end gap-0">
                            <span className="text-sm font-semibold">张工 (Admin)</span>
                            <span className="text-[10px] text-gray-400">研发部 · 核心评审员</span>
                        </div>
                        <Avatar
                            src="https://github.com/shadcn.png"
                            size={36}
                            style={{ border: "2px solid rgba(37, 99, 235, 0.2)" }}
                        >
                            NPI
                        </Avatar>
                    </div>
                </div>
            </div>
        </header>
    )
}
