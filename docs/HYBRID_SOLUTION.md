# 混合方案实施文档

> 创建时间: 2026-01-14
> 方案: pptx-automizer (文本/样式) + Python python-pptx (表格)

---

## 📋 方案概述

采用**混合方案**生成 PPT：
- **前端 (Next.js + pptx-automizer)**: 负责样式保留、文本替换、幻灯片复制
- **后端 (Python + python-pptx)**: 负责表格数据填充

### 为什么采用混合方案？

1. **pptx-automizer 优势**：
   - ✅ 完美保留模板样式
   - ✅ 支持文本替换
   - ✅ 支持幻灯片复制
   - ❌ 表格填充 API 存在 bug

2. **python-pptx 优势**：
   - ✅ 成熟稳定
   - ✅ 表格填充 API 完善可靠
   - ❌ 样式保留不如 pptx-automizer

3. **混合方案结合两者优势**：
   - 前端用 pptx-automizer 保证样式完美
   - 后端用 python-pptx 填充表格数据
   - 通过 API 协同工作

---

## 🏗️ 架构设计

```
┌─────────────────┐
│   用户请求      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Next.js API 路由                        │
│  src/app/api/generate-ppt/route.ts     │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│  步骤 1: pptx-automizer 生成半成品 PPT           │
│  src/lib/services/ppt-template-generator.ts    │
│  - 加载模板                                     │
│  - 替换文本（封面、目录）                        │
│  - 复制幻灯片（设备、FAI）                       │
│  - 记录表格数据位置                             │
│  - 输出半成品 PPT（含空表格）                    │
└────────┬────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│  步骤 2: Python 后端填充表格                     │
│  backend/api/ppt_fill_api.py                    │
│  - 接收半成品 PPT                               │
│  - 使用 python-pptx 填充表格                    │
│  - 返回成品 PPT                                 │
└────────┬────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│  步骤 3: 返回成品 PPT 给用户                     │
└─────────────────────────────────────────────────┘
```

---

## 📁 文件清单

### Python 后端

| 文件 | 功能 | 状态 |
|------|------|------|
| `backend/api/ppt_fill_api.py` | 表格填充 API | ✅ 已创建 |
| `backend/main.py` | 注册新路由 | ✅ 已更新 |

### Next.js 前端

| 文件 | 功能 | 状态 |
|------|------|------|
| `src/lib/services/ppt-template-generator.ts` | 混合方案核心服务 | ✅ 已实现 |
| `src/lib/types/ppt.ts` | 类型定义 | ✅ 已更新 |
| `src/lib/services/test-hybrid-solution.ts` | 测试脚本 | ✅ 已创建 |

### 测试工具

| 文件 | 功能 |
|------|------|
| `src/lib/services/inspect-template.ts` | 分析模板元素 |

---

## 🔧 安装依赖

### Next.js 端

```bash
npm install pptx-automizer axios form-data @types/form-data
```

### Python 端

```bash
pip install python-pptx fastapi python-multipart uvicorn
```

---

## 🚀 使用方法

### 1. 启动 Python 后端

```bash
cd backend
python main.py
# 后端运行在 http://127.0.0.1:8001
```

### 2. 在 Next.js 中调用

```typescript
import { generatePPTFromTemplate } from '@/lib/services/ppt-template-generator';

const data = {
  projectInfo: {
    projectName: '测试项目',
    partNumber: 'DEMO-001',
  },
  revisionHistory: [
    { version: 'A01', date: '2026-01-14', content: '初始版本', reviser: 'AI' },
  ],
  equipments: [
    { name: '三坐标测量机', model: 'CMM-2000', precision: '±0.001mm' },
  ],
  fixtures: [
    { name: '底座夹具', code: 'FIX-001', quantity: 1 },
  ],
  bom: [
    { name: '磁铁', code: 'MAG-001', specification: 'N52', quantity: 100 },
  ],
  faiItems: [
    {
      itemName: 'FAI-001: 尺寸测试',
      dimensions: [
        { name: '长度', nominal: '100mm', actual: '100.01mm', result: 'OK' },
      ],
    },
  ],
};

await generatePPTFromTemplate(
  data,
  'public/templates/mtd_template.pptx',
  'public/downloads/output.pptx'
);
```

### 3. 运行测试

```bash
# 确保 Python 后端已启动
npx tsx src/lib/services/test-hybrid-solution.ts
```

---

## 📊 数据流程

### 1. 封面页（幻灯片 1）

| 元素 | 操作 |
|------|------|
| `Project Name:X1335…` | pptx-automizer 替换文本 |
| `Metrology Design` | pptx-automizer 替换文本 |

### 2. 目录页（幻灯片 2）

| 元素 | 操作 |
|------|------|
| 整页 | pptx-automizer 添加（无修改） |

### 3. 修订历史页（幻灯片 3）

| 元素 | 操作 |
|------|------|
| `表格 2` | 记录位置 → Python 填充数据 |

### 4. 设备详情页（幻灯片 4-9）

| 元素 | 操作 |
|------|------|
| 页面复制 | pptx-automizer 复制 N 次 |
| `表格` | 记录位置 → Python 填充数据 |

### 5. 夹具列表页（幻灯片 10）

| 元素 | 操作 |
|------|------|
| `表格` | 记录位置 → Python 填充数据 |

### 6. BOM 列表页（幻灯片 11）

| 元素 | 操作 |
|------|------|
| `表格` | 记录位置 → Python 填充数据 |

### 7. FAI 汇总页（幻灯片 12）

| 元素 | 操作 |
|------|------|
| 整页 | pptx-automizer 添加（无修改） |

### 8. FAI 详情页（幻灯片 13-22）

| 元素 | 操作 |
|------|------|
| 页面复制 | pptx-automizer 复制 N 次 |
| `文本框 84` | pptx-automizer 替换标题 |
| `表格` | 记录位置 → Python 填充数据 |

---

## 🔌 API 端点

### Python 后端

#### `POST /api/ppt/fill/tables`

填充 PPT 表格

**请求**:
- `file`: 半成品 PPT 文件（multipart/form-data）
- `table_data`: 表格数据（JSON 字符串）

**响应**:
- 成品 PPT 文件（application/vnd.openxmlformats-officedocument.presentationml.presentation）

**示例**:
```typescript
const formData = new FormData();
formData.append('file', semiFinishedPptBuffer);
formData.append('table_data', JSON.stringify({
  table_data: [
    {
      slide_index: 3,
      table_index: 0,
      header: ['版本', '日期', '修订内容', '修订人'],
      body: [
        { values: ['A01', '2026-01-14', '初始版本', 'AI'] }
      ]
    }
  ]
}));

const response = await axios.post(
  'http://127.0.0.1:8001/api/ppt/fill/tables',
  formData,
  { responseType: 'arraybuffer' }
);
```

---

## ⚙️ 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PYTHON_API_URL` | Python 后端地址 | `http://127.0.0.1:8001` |

---

## 📈 性能优化

1. **临时文件清理**：自动删除半成品 PPT
2. **并行处理**：表格填充在 Python 端批量处理
3. **缓存**：模板文件已加载到内存

---

## 🐛 故障排查

### Python 后端无法连接

**错误**: `ECONNREFUSED 127.0.0.1:8001`

**解决**:
1. 检查 Python 后端是否运行
2. 检查端口 8001 是否被占用
3. 设置环境变量 `PYTHON_API_URL`

### 表格数据未填充

**错误**: 生成的 PPT 表格为空

**解决**:
1. 检查 `tablesToFill` 数组是否正确
2. 检查 `slide_index` 和 `table_index` 是否正确
3. 使用 `inspect-template.ts` 分析模板结构

### 样式丢失

**错误**: 生成的 PPT 样式与模板不一致

**解决**:
1. 检查模板文件是否完整
2. 检查 pptx-automizer 版本（应为 0.8.1）
3. 检查 Python 后端是否修改了样式

---

## 📝 开发日志

- **2026-01-14**: 创建混合方案
  - 实现 Python 表格填充 API
  - 实现 Next.js 模板生成服务
  - 更新类型定义
  - 创建测试脚本

---

## 🎯 下一步

1. ✅ 完成 PoC 验证
2. ✅ 实现混合方案
3. ⏳ 集成到现有 API 路由
4. ⏳ 部署到生产环境
5. ⏳ 用户验收测试
