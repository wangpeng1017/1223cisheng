# AI 智能评审功能设计

## 背景

NPI 平台已有人工图纸评审模块（`/drawing-review`），现需新增 AI 智能评审页面（`/drawing-review-ai`），实现图纸自动审查。用户上传图纸后，后端 AI 自动分析并返回问题列表，前端展示审查报告。

**后端 AI 能力正在开发中**，本次设计包含 API 接口契约和完整前端 UI，使用 Mock 数据开发，后端 ready 后直接对接。

---

## 用户流程

```
上传图纸(PDF/图片) → 等待AI分析 → 查看审查报告 → 导出/归档
```

## 页面布局

```
┌──────────────────────────────────────────────────┐
│  标题栏：AI 智能评审    [上传图纸] [历史记录]      │
├────────────────────┬─────────────────────────────┤
│                    │  审查概要                     │
│                    │  ┌──┐ ┌──┐ ┌──┐ ┌──┐        │
│                    │  │总│ │严│ │中│ │低│         │
│                    │  └──┘ └──┘ └──┘ └──┘        │
│   图纸预览区       ├─────────────────────────────┤
│   (PDF/图片)       │  问题列表                    │
│                    │  🔴 尺寸标注 - 公差超标       │
│                    │  🟡 标注 - 缺失关键尺寸       │
│                    │  🟢 建议 - 基准标注优化       │
│                    │  ...                         │
├────────────────────┴─────────────────────────────┤
│  AI 审查结论 / 操作按钮                           │
└──────────────────────────────────────────────────┘
```

- **左侧 60%**：图纸预览（支持 PDF 渲染和图片展示）
- **右侧 40%**：审查概要统计卡片 + 问题列表（按严重程度分组）

---

## API 接口契约

### 1. 上传图纸并启动审查

```
POST /api/drawing-review-ai/analyze
Content-Type: multipart/form-data

Body:
  file: <PDF/图片文件>
  drawing_name: string (可选，图纸名称)

Response 200:
{
  "task_id": "uuid",
  "status": "processing",
  "message": "审查已启动"
}
```

### 2. 查询审查状态/结果

```
GET /api/drawing-review-ai/tasks/{task_id}

Response 200:
{
  "task_id": "uuid",
  "status": "completed" | "processing" | "failed",
  "drawing_name": "零件A图纸",
  "file_url": "/uploads/xxx.pdf",
  "created_at": "2026-03-03T12:00:00Z",
  "duration_seconds": 12,
  "summary": {
    "total_issues": 8,
    "critical": 2,
    "warning": 4,
    "info": 2,
    "conclusion": "发现2个严重问题需修正"
  },
  "issues": [
    {
      "id": 1,
      "severity": "critical" | "warning" | "info",
      "category": "尺寸标注" | "公差" | "基准" | "标注规范" | "其他",
      "title": "公差超出标准范围",
      "description": "FAI#3 尺寸 3*2.00±0.50 的公差 ±0.50 超过 Apple 标准允许的 ±0.10",
      "suggestion": "建议将公差收紧至 ±0.10 或与客户确认放宽理由"
    }
  ]
}
```

### 3. 历史记录列表

```
GET /api/drawing-review-ai/tasks?page=1&size=20

Response 200:
{
  "total": 35,
  "items": [
    {
      "task_id": "uuid",
      "drawing_name": "零件A图纸",
      "status": "completed",
      "created_at": "...",
      "summary": { "total_issues": 8, "critical": 2, ... }
    }
  ]
}
```

### 4. 删除记录

```
DELETE /api/drawing-review-ai/tasks/{task_id}
Response 200: { "success": true }
```

---

## 前端技术要点

| 项目 | 方案 |
|------|------|
| 组件库 | Ant Design（与已迁移的全站一致） |
| PDF 预览 | `react-pdf` 或 `<iframe>` 渲染 |
| 图片预览 | Ant Design `Image` 组件 |
| 轮询机制 | `setInterval` 轮询 task 状态，完成后停止 |
| Mock 数据 | 前端内置 mock 数据，环境变量切换 |

## 问题严重程度定义

| 等级 | 颜色 | 含义 |
|------|------|------|
| `critical` | 🔴 红色 | 必须修正：尺寸错误、公差超标等 |
| `warning` | 🟡 橙色 | 建议修正：缺失标注、规范不一致等 |
| `info` | 🟢 绿色 | 优化建议：标注位置、可读性等 |

---

## 开发范围

### 本期交付（前端 UI + Mock）
- [x] 页面路由 `/drawing-review-ai`
- [x] 文件上传区（拖拽 + 点击）
- [x] 分析中状态（进度动画）
- [x] 审查报告展示（概要统计 + 问题列表）
- [x] 图纸预览区（PDF/图片）
- [x] 历史记录列表
- [x] Mock 数据（3 条示例审查记录）

### 后续对接（后端 Ready 后）
- [ ] 替换 Mock 为真实 API 调用
- [ ] 文件上传到后端存储
- [ ] 实时轮询审查进度
