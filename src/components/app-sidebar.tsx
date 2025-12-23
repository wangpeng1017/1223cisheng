"use client"

import * as React from "react"
import {
  LayoutDashboard,
  FileSearch,
  Settings,
  ShieldCheck,
  Cpu,
  BarChart3,
  Users,
  Database,
  Briefcase,
  AlertTriangle,
  ClipboardList
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "核心业务",
      items: [
        {
          title: "管理看板",
          url: "/",
          icon: LayoutDashboard,
        },
        {
          title: "项目管理",
          url: "/projects",
          icon: Briefcase,
        },
        {
          title: "图纸评审",
          url: "/drawing-review",
          icon: FileSearch,
        },
      ],
    },
    {
      title: "制造与质量",
      items: [
        {
          title: "DFM 策划",
          url: "/dfm",
          icon: Cpu,
        },
        {
          title: "Q-Plan 管理",
          url: "/q-plan",
          icon: ClipboardList,
        },
        {
          title: "MTD 检测",
          url: "/mtd",
          icon: ShieldCheck,
        },
      ],
    },
    {
      title: "平台能力",
      items: [
        {
          title: "AI 智能体",
          url: "/ai-agent",
          icon: Database,
        },
        {
          title: "数据中心",
          url: "/data-center",
          icon: BarChart3,
        },
      ],
    },
  ],
  secondary: [
    {
      title: "系统管理",
      url: "/admin",
      icon: Settings,
    },
    {
      title: "用户中心",
      url: "/users",
      icon: Users,
    },
  ],
}

export function AppSidebar() {
  return (
    <Sidebar variant="inset" className="border-r border-border/50 bg-sidebar/50 backdrop-blur-xl">
      <SidebarHeader className="h-16 flex items-center px-6 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Cpu className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-semibold text-lg tracking-tight">宁波磁声 NPI</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">R&D Collaborative Platform</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {data.navMain.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel className="px-6 text-xs font-medium text-muted-foreground/70 uppercase pt-4 pb-2">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title} className="px-6 py-5 hover:bg-accent/50 transition-all duration-200">
                      <a href={item.url} className="flex items-center gap-3">
                        <item.icon className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-border/50">
         <SidebarMenu>
            {data.secondary.map((item) => (
                <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title} className="px-6 py-4 hover:bg-accent/50">
                    <a href={item.url} className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{item.title}</span>
                    </a>
                </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
         </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
