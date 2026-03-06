"use client"

import { Layout } from "antd"
import { AppSidebar } from "@/components/app-sidebar"
import { AppNavbar } from "@/components/app-navbar"

const { Content } = Layout

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <AppSidebar />
      <Layout>
        <AppNavbar />
        <Content className="flex-1 overflow-y-auto p-0">
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}
