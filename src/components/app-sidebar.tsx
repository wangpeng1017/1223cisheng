"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { Layout, Menu } from "antd"
import type { MenuProps } from "antd"
import {
  DashboardOutlined,
  FileSearchOutlined,
  SettingOutlined,
  SafetyCertificateOutlined,
  ExperimentOutlined,
  BarChartOutlined,
  TeamOutlined,
  RobotOutlined,
  ProjectOutlined,
  UnorderedListOutlined,
  TableOutlined,
} from "@ant-design/icons"

const { Sider } = Layout

type MenuItem = Required<MenuProps>["items"][number]

// 主菜单配置
const menuItems: MenuItem[] = [
  {
    key: "core",
    label: "核心业务",
    type: "group",
    children: [
      { key: "/", icon: <DashboardOutlined />, label: "管理看板" },
      { key: "/projects", icon: <ProjectOutlined />, label: "项目管理" },
      { key: "/drawing-review", icon: <FileSearchOutlined />, label: "图纸评审" },
      { key: "/drawing-extract", icon: <TableOutlined />, label: "图纸信息提取" },
    ],
  },
  {
    key: "manufacture",
    label: "制造与质量",
    type: "group",
    children: [
      { key: "/dfm", icon: <ExperimentOutlined />, label: "DFM 策划" },
      { key: "/q-plan", icon: <UnorderedListOutlined />, label: "Q-Plan 管理" },
      { key: "/mtd", icon: <SafetyCertificateOutlined />, label: "MTD 检测" },
    ],
  },
  {
    key: "platform",
    label: "平台能力",
    type: "group",
    children: [
      { key: "/drawing-review-ai", icon: <RobotOutlined />, label: "AI 智能评审" },
      { key: "/data", icon: <BarChartOutlined />, label: "基础数据" },
    ],
  },
]

// 底部菜单配置
const bottomMenuItems: MenuItem[] = [
  { key: "/admin", icon: <SettingOutlined />, label: "系统管理" },
  { key: "/users", icon: <TeamOutlined />, label: "用户中心" },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = React.useState(false)

  // 菜单点击导航
  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    router.push(key)
  }

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      width={256}
      style={{ background: "#fff", borderRight: "1px solid #f0f0f0" }}
      theme="light"
    >
      {/* Logo 区域 */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <ExperimentOutlined style={{ fontSize: 18 }} />
          </div>
          {!collapsed && (
            <div className="flex flex-col gap-0.5 leading-none">
              <span className="font-semibold text-lg tracking-tight">宁波磁声 NPI</span>
              <span className="text-[10px] text-gray-400 uppercase tracking-widest">R&D Platform</span>
            </div>
          )}
        </div>
      </div>

      {/* 主菜单 */}
      <div className="flex-1 overflow-y-auto">
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </div>

      {/* 底部菜单 */}
      <div className="border-t border-gray-200">
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          items={bottomMenuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </div>
    </Sider>
  )
}
