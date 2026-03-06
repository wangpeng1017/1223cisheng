# UI 迁移设计：shadcn/ui → Ant Design

## 背景

「宁波磁声 NPI 研发协同平台」当前使用 shadcn/ui (Radix UI) 作为主要 UI 库，项目中已有少量 antd 混用。用户希望将全部 UI 组件统一迁移到 Ant Design，以获得更成熟的企业级组件体系和统一的视觉风格。

## 决策摘要

| 决策项 | 结论 |
|--------|------|
| 迁移程度 | **完全替换** shadcn/ui → antd |
| 迁移策略 | **分层迁移**（从底层组件到布局框架） |
| TailwindCSS | **保留**，用于布局工具类 |
| 图标库 | lucide-react → **@ant-design/icons** |
| 图表库 | recharts **保留不变** |
| Toast 通知 | sonner → **antd message/notification** |

---

## 影响范围

### shadcn/ui 组件（21个） → antd 映射

| shadcn/ui 组件 | antd 替代 | 使用文件数 |
|---------------|-----------|-----------|
| Button | `Button` | ~10 |
| Input | `Input` | ~6 |
| Select | `Select` | ~4 |
| Checkbox | `Checkbox` | ~2 |
| Label | `Form.Item` / `Typography.Text` | ~6 |
| Textarea | `Input.TextArea` | ~1 |
| Card (+ CardHeader/Content/Title/Description) | `Card` (+ `Card.Meta`) | ~6 |
| Dialog (+ DialogContent/Header/Title/Footer) | `Modal` | ~3 |
| Sheet (+ SheetContent/Header/Title/Footer) | `Drawer` | ~4 |
| Tabs (+ TabsContent/List/Trigger) | `Tabs` | ~3 |
| Table (+ TableHeader/Body/Row/Cell) | `Table` | ~2 |
| Badge | `Tag` / `Badge` | ~3 |
| Avatar | `Avatar` | ~1 |
| Progress | `Progress` | ~1 |
| Skeleton | `Skeleton` | ~1 |
| Separator | `Divider` | ~1 |
| Tooltip | `Tooltip` | ~1 |
| Dropdown Menu | `Dropdown` | ~1 |
| Scroll Area | 原生 CSS `overflow-auto` | ~2 |
| Sidebar (复合组件) | `Layout.Sider` + `Menu` | ~2 |
| Sonner (toast) | `message` / `notification` | ~2 |

### 图标映射（lucide-react → @ant-design/icons）

| lucide 图标 | antd 图标 | 使用场景 |
|------------|-----------|---------|
| `LayoutDashboard` | `DashboardOutlined` | 侧边栏 |
| `FileSearch` | `FileSearchOutlined` | 侧边栏 |
| `Settings` | `SettingOutlined` | 侧边栏 |
| `ShieldCheck` | `SafetyCertificateOutlined` | 侧边栏 |
| `Cpu` | `ExperimentOutlined` | 侧边栏/Logo |
| `BarChart3` | `BarChartOutlined` | 侧边栏 |
| `Users` | `TeamOutlined` | 侧边栏 |
| `Database` | `DatabaseOutlined` | 侧边栏 |
| `Briefcase` | `ProjectOutlined` | 侧边栏 |
| `AlertTriangle` | `WarningOutlined` | 通用 |
| `ClipboardList` | `UnorderedListOutlined` | 侧边栏 |
| `Table2` | `TableOutlined` | 侧边栏 |
| `Search` | `SearchOutlined` | 导航栏 |
| `Bell` | `BellOutlined` | 导航栏 |
| `Plus` | `PlusOutlined` | 通用 |
| `Download` | `DownloadOutlined` | 通用 |
| `ArrowUpRight` | `ArrowUpOutlined` | 数据卡片 |
| `ArrowDownRight` | `ArrowDownOutlined` | 数据卡片 |
| `Clock` | `ClockCircleOutlined` | 通用 |
| `CheckCircle2` | `CheckCircleOutlined` | 通用 |
| `AlertCircle` | `ExclamationCircleOutlined` | 通用 |
| `Activity` | `ThunderboltOutlined` | Dashboard |
| `Layers` | `AppstoreOutlined` | Dashboard |
| `MoreVertical` | `MoreOutlined` | 通用 |
| `Loader2` | `LoadingOutlined` | 通用 |
| `FileText` | `FileTextOutlined` | MTD |
| `Check` | `CheckOutlined` | 通用 |
| `Play` | `PlayCircleOutlined` | SOP |
| `RotateCcw` | `UndoOutlined` | SOP |
| `ChevronRight` | `RightOutlined` | SOP |

### 受影响文件清单

**页面文件 (10)**：
- `src/app/page.tsx` — Dashboard
- `src/app/mtd/page.tsx` — MTD 检测
- `src/app/data/page.tsx` — 基础数据
- `src/app/dfm/page.tsx` — DFM 策划
- `src/app/q-plan/page.tsx` — Q-Plan
- `src/app/projects/page.tsx` — 项目管理
- `src/app/drawing-review/page.tsx` — 图纸评审
- `src/app/drawing-extract/page.tsx` — 图纸信息提取
- `src/app/admin/page.tsx` — 系统管理
- `src/app/users/page.tsx` — 用户中心

**组件文件 (10)**：
- `src/components/app-sidebar.tsx` — 侧边栏
- `src/components/app-navbar.tsx` — 导航栏
- `src/components/ppt-template-upload.tsx` — PPT 模板上传
- `src/components/mtd/ProjectSheet.tsx` — 项目抽屉
- `src/components/mtd/EquipmentSheet.tsx` — 设备抽屉
- `src/components/mtd/FixtureSheet.tsx` — 夹具抽屉
- `src/components/mtd/TemplateManageSheet.tsx` — 模板管理
- `src/components/mtd/magnetic-input-card.tsx` — 磁性输入卡片
- `src/components/mtd/sop-wizard.tsx` — SOP 向导
- `src/components/ppt/TemplateSelector.tsx` — 模板选择器
- `src/components/ppt/PPTPreviewDialog.tsx` — PPT 预览弹窗

**布局/配置文件**：
- `src/app/layout.tsx` — 根布局
- `src/app/globals.css` — 全局样式

---

## 迁移阶段设计

### Phase 1：基础 UI 组件替换

替换最基础、被引用最多的原子组件。

**目标组件**: Button, Input, Select, Checkbox, Label, Textarea, Badge

**核心变化**:
- `<Button variant="outline">` → `<Button type="default">`
- `<Button variant="ghost">` → `<Button type="text">`
- `<Button variant="destructive">` → `<Button danger>`
- `<Input>` → `<Input>` （API 基本一致）
- `<Select>` + `<SelectItem>` → `<Select options={[...]}>`
- `<Label>` → 删除或改为 `<Typography.Text>` / `<Form.Item label="...">`
- `<Badge variant="destructive">` → `<Tag color="error">`

**影响**: ~15 个文件

### Phase 2：容器与交互组件替换

替换 Card、Dialog、Sheet、Tabs 等容器类组件。

**核心变化**:
- `<Card>` + `<CardHeader>` + `<CardTitle>` + `<CardContent>` → `<Card title="...">内容</Card>`
- `<Dialog>` → `<Modal>`
- `<Sheet>` → `<Drawer>`
- `<Tabs>` + `<TabsList>` + `<TabsTrigger>` + `<TabsContent>` → `<Tabs items={[...]}/>`

**影响**: ~12 个文件

### Phase 3：布局框架替换

这是最核心的变化，替换全局布局骨架。

**核心变化**:
- 删除 `src/components/ui/sidebar.tsx`（21KB 的 shadcn sidebar 组件）
- `<SidebarProvider>` + `<AppSidebar>` + `<SidebarInset>` → `<Layout>` + `<Layout.Sider>` + `<Layout.Content>`
- Sidebar 菜单数据结构 → antd `Menu` 的 `items` 格式
- `<AppNavbar>` → `<Layout.Header>` + antd 组件

**影响**: `layout.tsx`, `app-sidebar.tsx`, `app-navbar.tsx`

### Phase 4：数据展示组件替换

替换 Table、Progress、Avatar、Skeleton 等。

**核心变化**:
- shadcn `<Table>` → antd `<Table columns={...} dataSource={...}>`
- 其他组件 API 基本一致

**影响**: ~8 个文件

### Phase 5：清理与统一

- 删除 `src/components/ui/` 目录（21 个 shadcn 组件文件）
- 删除 `components.json`（shadcn 配置文件）
- 移除 npm 依赖: `@radix-ui/*`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `sonner`
- 移除 `src/lib/utils.ts`（shadcn 的 `cn()` 辅助函数）
- 清理 `globals.css` 中 shadcn 相关的 CSS Variables（保留 Tailwind 相关）
- 配置 antd 主题 token，匹配当前色系

---

## antd 主题配置

使用 antd 的 ConfigProvider 统一主题，对标当前 oklch 色系：

```tsx
// src/app/layout.tsx
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';

<ConfigProvider
  locale={zhCN}
  theme={{
    token: {
      colorPrimary: '#1677ff',  // 可调整为接近当前 oklch(0.55 0.16 230) 的蓝色
      borderRadius: 8,
      colorBgContainer: '#ffffff',
    },
  }}
>
  {children}
</ConfigProvider>
```

---

## 风险与注意事项

1. **antd 6 与 React 19 兼容性**: antd 6.x 已官方支持 React 19，无兼容性问题
2. **antd 与 Next.js App Router**: 需要 `"use client"` 指令，antd 组件都是客户端组件
3. **CSS 冲突**: antd 使用 CSS-in-JS (antd v5+)，与 TailwindCSS 并存时偶有样式优先级问题，可通过 `important` 或 antd 的 `cssVar` 模式解决
4. **SSR 闪烁**: 使用 `@ant-design/nextjs-registry` 确保 SSR 下样式正确注入
