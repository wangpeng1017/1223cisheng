# Ant Design 全面迁移实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将项目 UI 从 shadcn/ui (Radix UI) 全面迁移到 Ant Design，包括组件、图标和布局框架。

**Architecture:** 采用分层渐进迁移策略——先安装依赖和配置基础设施，再自底向上替换组件（基础→容器→布局→数据展示），最后清理旧依赖。保留 TailwindCSS 用于布局工具类。

**Tech Stack:** Next.js 16 + React 19 + antd 6 + @ant-design/icons + @ant-design/nextjs-registry + TailwindCSS v4

---

## Task 1: 安装依赖与配置 antd 基础设施

**Files:**
- Modify: `package.json`
- Modify: `src/app/layout.tsx`

**Step 1: 安装 antd 相关依赖**

```bash
cd /Users/wangpeng/Downloads/cisheng
npm install @ant-design/nextjs-registry
```

> 注意：`antd` 和 `@ant-design/icons` 已在项目中安装。

**Step 2: 配置 antd 的 Next.js SSR 注册器和主题**

修改 `src/app/layout.tsx`：

```tsx
import type { Metadata } from "next";
import "./globals.css";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider, App } from "antd";
import zhCN from "antd/locale/zh_CN";
import { AppLayout } from "@/components/app-layout";

export const metadata: Metadata = {
  title: "宁波磁声 NPI 研发协同平台",
  description: "Next-generation R&D collaboration platform for NPI process",
};

const theme = {
  token: {
    colorPrimary: "#2563eb",
    borderRadius: 8,
    colorBgContainer: "#ffffff",
    fontFamily: "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <AntdRegistry>
          <ConfigProvider locale={zhCN} theme={theme}>
            <App>
              <AppLayout>{children}</AppLayout>
            </App>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
```

**Step 3: 验证 dev server 启动无报错**

```bash
npm run dev
```

Expected: 编译成功，无报错

**Step 4: 提交**

```bash
git add -A
git commit -m "feat: 配置 antd 基础设施（ConfigProvider + AntdRegistry）"
```

---

## Task 2: 创建新的布局组件（AppLayout + AppSidebar + AppNavbar）

这是最核心的变更，替换 shadcn 的 Sidebar 系统为 antd Layout + Menu。

**Files:**
- Create: `src/components/app-layout.tsx`
- Rewrite: `src/components/app-sidebar.tsx`
- Rewrite: `src/components/app-navbar.tsx`

**Step 1: 创建 `app-layout.tsx` — 整合布局容器**

```tsx
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
```

**Step 2: 重写 `app-sidebar.tsx` — 使用 antd Layout.Sider + Menu**

```tsx
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
  DatabaseOutlined,
  ProjectOutlined,
  UnorderedListOutlined,
  TableOutlined,
} from "@ant-design/icons"

const { Sider } = Layout

type MenuItem = Required<MenuProps>["items"][number]

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
      { key: "/drawing-review-ai", icon: <DatabaseOutlined />, label: "AI 智能评审" },
      { key: "/data", icon: <BarChartOutlined />, label: "基础数据" },
    ],
  },
]

const bottomMenuItems: MenuItem[] = [
  { key: "/admin", icon: <SettingOutlined />, label: "系统管理" },
  { key: "/users", icon: <TeamOutlined />, label: "用户中心" },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = React.useState(false)

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    router.push(key)
  }

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      width={256}
      className="border-r border-gray-200"
      style={{ background: "#fff" }}
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
      <Menu
        mode="inline"
        selectedKeys={[pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ borderRight: 0, flex: 1 }}
      />

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
```

**Step 3: 重写 `app-navbar.tsx` — 使用 antd 组件**

```tsx
"use client"

import { Input, Badge, Avatar, Button } from "antd"
import { SearchOutlined, BellOutlined } from "@ant-design/icons"

export function AppNavbar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center gap-4 border-b border-gray-200 bg-white px-6">
      <div className="flex flex-1 items-center gap-4 md:gap-8">
        <Input
          placeholder="搜索项目、图纸、任务..."
          prefix={<SearchOutlined className="text-gray-400" />}
          className="ml-auto sm:w-[300px] md:w-[400px] lg:w-[500px]"
          variant="filled"
          allowClear
        />
        <div className="flex items-center gap-3">
          <Badge dot>
            <Button type="text" icon={<BellOutlined style={{ fontSize: 18 }} />} />
          </Badge>
          <div className="h-4 w-px bg-gray-200 mx-1" />
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
```

**Step 4: 验证布局正常渲染**

```bash
npm run dev
```

在浏览器中访问 `http://localhost:3000`，检查：
- 侧边栏菜单正常显示
- 点击菜单项能正确导航
- 顶部导航栏正常显示
- 侧边栏折叠/展开正常

**Step 5: 提交**

```bash
git add -A
git commit -m "feat: 迁移布局框架到 antd Layout + Menu"
```

---

## Task 3: 迁移 Dashboard 页面 (`src/app/page.tsx`)

**Files:**
- Rewrite: `src/app/page.tsx`

**Step 1: 替换所有导入**

将 shadcn/ui 和 lucide-react 导入替换为 antd 和 @ant-design/icons：

```tsx
// 删除
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, AlertCircle, Plus, MoreVertical, Activity, Layers, History, Download } from "lucide-react"

// 替换为
import { Card, Button, Tag, Tabs } from "antd"
import { App } from "antd"
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  MoreOutlined,
  ThunderboltOutlined,
  AppstoreOutlined,
  DownloadOutlined,
} from "@ant-design/icons"
```

**Step 2: 替换组件模板**

核心替换模式：

- `<Card>` + `<CardHeader>` + `<CardTitle>` → `<Card title="...">`
- `<Button variant="outline">` → `<Button>`
- `<Button variant="ghost">` → `<Button type="text">`
- `<Badge variant="destructive">` → `<Tag color="error">`
- `<Badge variant="secondary">` → `<Tag>`
- `<Tabs>` + `<TabsList>` + `<TabsTrigger>` + `<TabsContent>` → `<Tabs items={[...]}/>`
- `toast.info(...)` → `const { message } = App.useApp(); message.info(...)`
- lucide 图标组件 → antd 图标组件（参照设计文档映射表）

`stats` 数组中的 icon 字段从 lucide 组件改为 antd 图标组件。

**Step 3: 验证 Dashboard 页面渲染正常**

```bash
npm run dev
```

浏览器访问 `http://localhost:3000`，检查：
- 统计卡片正常显示
- 图表正常渲染（recharts 不变）
- 任务列表正常
- 按钮/标签/标签页正常

**Step 4: 提交**

```bash
git add -A
git commit -m "feat: 迁移 Dashboard 页面到 antd"
```

---

## Task 4: 迁移 MTD 检测页面及相关组件

MTD 页面已部分使用 antd，需统一图标并清除残留的 shadcn 组件引用。

**Files:**
- Modify: `src/app/mtd/page.tsx`
- Rewrite: `src/components/mtd/ProjectSheet.tsx`
- Rewrite: `src/components/mtd/EquipmentSheet.tsx`
- Rewrite: `src/components/mtd/FixtureSheet.tsx`
- Modify: `src/components/mtd/TemplateManageSheet.tsx`
- Rewrite: `src/components/mtd/magnetic-input-card.tsx`
- Rewrite: `src/components/mtd/sop-wizard.tsx`

**Step 1: 迁移 MTD Sheet 组件（ProjectSheet / EquipmentSheet / FixtureSheet）**

核心替换模式：
- `<Sheet>` + `<SheetContent>` + `<SheetHeader>` → `<Drawer open={...} onClose={...} title="...">`
- `<SheetFooter>` → Drawer 的 `footer` 属性或 `extra` 属性
- `<Input>` (shadcn) → `<Input>` (antd)
- `<Label>` → `<div>` 或 antd `<Form.Item>`
- `<Select>` + `<SelectContent>` + `<SelectItem>` → `<Select options={[...]}>`
- `<Checkbox>` → `<Checkbox>` (antd)
- `<ScrollArea>` → `<div style={{ overflow: "auto" }}>`
- `<Button>` (shadcn) → `<Button>` (antd)
- `FileText` (lucide) → `FileTextOutlined` (antd)

**Step 2: 迁移 magnetic-input-card.tsx**

- `<Card>` 系列 → antd `<Card title="...">`
- `<Badge>` → `<Tag>`
- `<Input>` / `<Label>` → antd 对应组件
- lucide 图标 → antd 图标

**Step 3: 迁移 sop-wizard.tsx**

- `<Card>` → antd Card
- `<Button>` → antd Button
- lucide 图标 → antd: `ChevronRight→RightOutlined`, `Check→CheckOutlined`, `AlertTriangle→WarningOutlined`, `Play→PlayCircleOutlined`, `RotateCcw→UndoOutlined`

**Step 4: 更新 mtd/page.tsx 的图标导入**

```tsx
// 删除
import { Plus, Settings, Wrench, Package, Loader2 } from "lucide-react"

// 替换为
import { PlusOutlined, SettingOutlined, ToolOutlined, InboxOutlined, LoadingOutlined } from "@ant-design/icons"
```

**Step 5: 验证**

```bash
npm run dev
```

浏览器访问 `http://localhost:3000/mtd`，检查：
- Tab 切换正常
- 表格数据正常
- 新建/编辑抽屉正常打开和关闭
- 表单输入正常

**Step 6: 提交**

```bash
git add -A
git commit -m "feat: 迁移 MTD 模块全部组件到 antd"
```

---

## Task 5: 迁移基础数据页面 (`src/app/data/page.tsx`)

**Files:**
- Rewrite: `src/app/data/page.tsx`

**Step 1: 替换导入和组件**

- lucide 图标 → antd 图标
- `<Button>` / `<Badge>` / `<Card>` / `<Tabs>` / `<Input>` → antd 对应组件
- `<Table>` + `<TableHeader>` + `<TableBody>` + `<TableRow>` + `<TableCell>` → `<Table columns={...} dataSource={...} />`
- `<Dialog>` 系列 → `<Modal>`
- `<Label>` → antd `Form.Item` 或 `Typography.Text`
- `toast` (sonner) → antd `message` / `notification`

**Step 2: 验证**

浏览器访问 `http://localhost:3000/data`，功能检查。

**Step 3: 提交**

```bash
git add -A
git commit -m "feat: 迁移基础数据页面到 antd"
```

---

## Task 6: 迁移项目管理页面 (`src/app/projects/page.tsx`)

**Files:**
- Rewrite: `src/app/projects/page.tsx`

**Step 1: 替换导入和组件**

同 Task 5 模式，额外注意：
- `<Select>` 的 value/onChange 要适配 antd Select 的 API
- `<Dialog>` 的 open/onOpenChange → `<Modal>` 的 open/onCancel
- 确保表格展开行功能使用 antd Table 的 `expandable` 属性

**Step 2: 验证**

浏览器访问 `http://localhost:3000/projects`，功能检查。

**Step 3: 提交**

```bash
git add -A
git commit -m "feat: 迁移项目管理页面到 antd"
```

---

## Task 7: 迁移其余页面（DFM / Q-Plan / Drawing Review / Drawing Extract / Admin / Users）

**Files:**
- Rewrite: `src/app/dfm/page.tsx`
- Rewrite: `src/app/q-plan/page.tsx`
- Rewrite: `src/app/drawing-review/page.tsx`
- Rewrite: `src/app/drawing-extract/page.tsx`
- Rewrite: `src/app/admin/page.tsx`
- Rewrite: `src/app/users/page.tsx`

**Step 1: 逐个页面按相同模式替换**

所有页面应用相同的替换模式：
1. lucide-react 图标 → @ant-design/icons
2. shadcn/ui 组件 → antd 组件
3. sonner toast → antd App.useApp().message
4. 保持 TailwindCSS 布局类不变

**Step 2: 逐页面验证**

每完成一个页面后在浏览器中确认渲染和功能正常。

**Step 3: 提交**

```bash
git add -A
git commit -m "feat: 迁移其余 6 个页面到 antd"
```

---

## Task 8: 迁移 PPT 相关组件

**Files:**
- Modify: `src/components/ppt-template-upload.tsx`（已使用 antd，仅需替换图标引用）
- Rewrite: `src/components/ppt/TemplateSelector.tsx`
- Rewrite: `src/components/ppt/PPTPreviewDialog.tsx`

**Step 1: 替换 TemplateSelector 和 PPTPreviewDialog**

- `<Button>` / `<Label>` / `<Card>` (shadcn) → antd 对应组件
- `<Dialog>` → `<Modal>`
- lucide 图标 → antd 图标

**Step 2: 验证**

在 MTD 页面测试 PPT 模板选择和预览功能。

**Step 3: 提交**

```bash
git add -A
git commit -m "feat: 迁移 PPT 组件到 antd"
```

---

## Task 9: 清理——删除 shadcn/ui 和旧依赖

**Files:**
- Delete: `src/components/ui/` 目录（21 个文件）
- Delete: `components.json`
- Modify: `src/lib/utils.ts`（删除 `cn()` 函数或保留简化版本）
- Modify: `package.json`（移除旧依赖）
- Modify: `src/app/globals.css`（清理 shadcn CSS Variables）

**Step 1: 删除 shadcn/ui 组件目录**

```bash
rm -rf /Users/wangpeng/Downloads/cisheng/src/components/ui
rm /Users/wangpeng/Downloads/cisheng/components.json
```

**Step 2: 简化 `src/lib/utils.ts`**

由于保留 TailwindCSS，`cn()` 仍可能有用。保留但去掉对 clsx 的依赖（TailwindCSS v4 使用原生 class merge）：

```ts
import { twMerge } from "tailwind-merge"

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(inputs.filter(Boolean).join(" "))
}
```

**Step 3: 移除废弃 npm 依赖**

```bash
npm uninstall @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-progress @radix-ui/react-scroll-area @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-slot @radix-ui/react-tabs @radix-ui/react-tooltip class-variance-authority clsx lucide-react sonner next-themes
```

**Step 4: 清理 `globals.css`**

简化 CSS Variables，保留 Tailwind 相关配置，移除 shadcn 特有的 sidebar/chart/popover 等 token。antd 使用自己的主题系统，不依赖这些 CSS Variables。

**Step 5: 验证全面构建**

```bash
npm run build
```

Expected: 构建无报错、无未解析的导入。

**Step 6: 最终验证**

```bash
npm run dev
```

逐页面检查所有功能正常：
- `/` Dashboard
- `/projects` 项目管理
- `/mtd` MTD 检测
- `/data` 基础数据
- `/dfm` DFM 策划
- `/q-plan` Q-Plan
- `/drawing-review` 图纸评审
- `/drawing-extract` 图纸信息提取
- `/admin` 系统管理
- `/users` 用户中心

**Step 7: 提交**

```bash
git add -A
git commit -m "chore: 清理 shadcn/ui 和旧依赖，完成 antd 迁移"
```

---

## 验证计划

### 自动化验证

```bash
# 构建检查 — 确认无编译错误
npm run build

# Lint 检查 — 确认代码规范
npm run lint
```

### 手动验证（浏览器逐页面检查）

每个 Task 完成后，在浏览器中打开对应页面，检查：

1. **页面布局** — 侧边栏、导航栏、内容区正常渲染
2. **组件交互** — 按钮点击、表单输入、弹窗/抽屉打开关闭
3. **数据展示** — 表格、图表、卡片数据正确显示
4. **导航** — 菜单点击跳转、路由正确
5. **响应式** — 浏览器缩放后布局不错乱
