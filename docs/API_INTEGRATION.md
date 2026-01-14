# API 集成文档

> 创建时间: 2026-01-14
> 版本: 1.0
> 状态: ✅ 已集成

---

## 📋 概述

混合方案已成功集成到 Next.js API，提供两个端点：

| 端点 | 方法 | 功能 | 状态 |
|------|------|------|------|
| `/api/generate-ppt` | POST | 从零生成 PPT（旧方案） | ⚠️ 保留 |
| `/api/generate-ppt/template` | POST | 基于模板生成 PPT（新方案） | ✅ 推荐 |

---

## 🚀 快速开始

### 1. 启动服务

```bash
# 终端 1: 启动 Python 后端
cd backend
python main.py
# 运行在 http://127.0.0.1:8001

# 终端 2: 启动 Next.js 前端
npm run dev
# 运行在 http://localhost:3000 或 3002
```

### 2. 调用 API

```bash
# 测试新端点
npx tsx src/lib/services/test-api-endpoint.ts
```

---

## 📡 API 端点详解

### POST /api/generate-ppt/template

**功能**: 基于模板生成 PPT（混合方案）

**请求格式**:

```json
{
  "productInfo": {
    "projectName": "测试项目",
    "partNumber": "TEST-001",
    "revision": "A01",
    "vendor": "供应商名称",
    "date": "2026/01/14"
  },
  "revisionHistory": [
    {
      "version": "A01",
      "date": "2026-01-14",
      "content": "初始版本",
      "reviser": "AI"
    }
  ],
  "equipments": [
    {
      "name": "三坐标测量机",
      "model": "CMM-2000",
      "precision": "±0.001mm",
      "quantity": 1
    }
  ],
  "fixtures": [
    {
      "name": "底座夹具",
      "code": "FIX-001",
      "quantity": 1
    }
  ],
  "bom": [
    {
      "name": "磁铁",
      "code": "MAG-001",
      "specification": "N52",
      "quantity": 100
    }
  ],
  "faiItems": [
    {
      "itemName": "FAI-001: 尺寸测试",
      "dimensions": [
        {
          "name": "长度",
          "nominal": "100mm",
          "actual": "100.01mm",
          "result": "OK"
        }
      ]
    }
  ],
  "options": {
    "template": "mtd_template.pptx",
    "outputFilename": "custom-name.pptx"
  }
}
```

**响应格式**:

```json
{
  "downloadUrl": "/downloads/测试项目_TEST-001_2026-01-14T10-30-00.pptx",
  "filename": "测试项目_TEST-001_2026-01-14T10-30-00.pptx",
  "pageCount": 12,
  "message": "PPT生成成功（使用模板方案）",
  "method": "template"
}
```

**错误响应**:

```json
{
  "error": "无法连接到Python后端",
  "details": "请确保Python后端正在运行 (http://127.0.0.1:8001)",
  "hint": "详细日志请查看服务器控制台"
}
```

---

### GET /api/generate-ppt/template

**功能**: 获取 API 信息和使用说明

**响应示例**:

```json
{
  "method": "template",
  "description": "基于模板生成PPT（混合方案：pptx-automizer + Python python-pptx）",
  "features": [
    "✅ 完美保留模板样式",
    "✅ 支持文本替换",
    "✅ 支持表格填充",
    "✅ 支持幻灯片复制",
    "✅ 动态页面数量"
  ],
  "requirements": {
    "pythonBackend": "http://127.0.0.1:8001",
    "templateFile": "public/templates/mtd_template.pptx"
  }
}
```

---

## 🔧 前端集成示例

### React / TypeScript

```typescript
import axios from 'axios';

interface GeneratePPTRequest {
  productInfo: {
    projectName: string;
    partNumber: string;
    revision: string;
    vendor: string;
    date: string;
  };
  equipments: Array<{
    name: string;
    model?: string;
    precision?: string;
    quantity?: number;
  }>;
  fixtures: Array<{
    name: string;
    code?: string;
    quantity?: number;
  }>;
  faiItems: Array<{
    itemName: string;
    dimensions: Array<{
      name: string;
      nominal?: string | number;
      actual?: string | number;
      result?: string;
    }>;
  }>;
}

async function generatePPT(data: GeneratePPTRequest) {
  try {
    const response = await axios.post('/api/generate-ppt/template', data);

    // 下载文件
    const downloadUrl = `${axios.defaults.baseURL}${response.data.downloadUrl}`;
    window.open(downloadUrl, '_blank');

    return response.data;
  } catch (error) {
    console.error('PPT生成失败:', error);
    throw error;
  }
}

// 使用示例
generatePPT({
  productInfo: {
    projectName: 'J510',
    partNumber: '160-06631-01',
    revision: '01',
    vendor: 'MAGSOUND',
    date: '2026/01/14',
  },
  equipments: [
    { name: '三坐标测量机', model: 'CMM-2000', precision: '±0.001mm' },
  ],
  fixtures: [
    { name: '底座夹具', code: 'FIX-001', quantity: 1 },
  ],
  faiItems: [
    {
      itemName: 'FAI-001: 尺寸测试',
      dimensions: [
        { name: '长度', nominal: '100mm', actual: '100.01mm', result: 'OK' },
      ],
    },
  ],
});
```

### cURL 示例

```bash
curl -X POST http://localhost:3002/api/generate-ppt/template \
  -H "Content-Type: application/json" \
  -d '{
    "productInfo": {
      "projectName": "测试项目",
      "partNumber": "TEST-001"
    },
    "equipments": [
      {
        "name": "三坐标测量机",
        "model": "CMM-2000"
      }
    ],
    "faiItems": []
  }'
```

---

## 📊 数据字段说明

### productInfo (必填)

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| projectName | string | 项目名称 | "J510" |
| partNumber | string | 零件编号 | "160-06631-01" |
| revision | string | 版本号 | "01" |
| vendor | string | 供应商 | "MAGSOUND" |
| date | string | 日期 | "2026/01/14" |

### equipments (可选)

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| name | string | 设备名称 | "三坐标测量机" |
| model | string | 型号 | "CMM-2000" |
| precision | string | 精度 | "±0.001mm" |
| quantity | number | 数量 | 1 |

### fixtures (可选)

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| name | string | 夹具名称 | "底座夹具" |
| code | string | 夹具编号 | "FIX-001" |
| quantity | number | 数量 | 1 |

### faiItems (可选)

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| itemName | string | FAI项名称 | "FAI-001: 尺寸测试" |
| dimensions | array | 尺寸数据 | 见下表 |

#### dimensions (FAI尺寸数据)

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| name | string | 尺寸名称 | "长度" |
| nominal | string\|number | 规格值 | "100mm" |
| actual | string\|number | 实测值 | "100.01mm" |
| result | string | 判定结果 | "OK" |

### revisionHistory (可选)

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| version | string | 版本号 | "A01" |
| date | string | 日期 | "2026-01-14" |
| content | string | 修订内容 | "初始版本" |
| reviser | string | 修订人 | "AI" |

### bom (可选)

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| name | string | 物料名称 | "磁铁" |
| code | string | 物料编号 | "MAG-001" |
| specification | string | 规格 | "N52" |
| quantity | number | 数量 | 100 |

---

## ⚙️ 配置选项

### options.template

指定模板文件名（可选，默认：`mtd_template.pptx`）

```json
{
  "options": {
    "template": "custom_template.pptx"
  }
}
```

模板文件必须位于 `public/templates/` 目录。

### options.outputFilename

指定输出文件名（可选，默认自动生成）

```json
{
  "options": {
    "outputFilename": "custom-name.pptx"
  }
}
```

---

## 🐛 故障排查

### 1. 错误: 无法连接到Python后端

**症状**: 返回 500 错误，提示 `ECONNREFUSED`

**解决方案**:
```bash
# 检查 Python 后端是否运行
curl http://127.0.0.1:8001/health

# 启动 Python 后端
cd backend
python main.py
```

### 2. 错误: 模板文件不存在

**症状**: 返回 404 错误

**解决方案**:
```bash
# 检查模板文件
ls -la public/templates/mtd_template.pptx

# 复制参考模板
cp docs/J510-P2_MTD*.pptx public/templates/mtd_template.pptx
```

### 3. 错误: 表格数据填充失败

**症状**: 返回 500 错误，提示表格填充问题

**解决方案**:
- 检查表格数据格式是否正确
- 确保所有数组字段不为 undefined
- 查看服务器控制台详细日志

---

## 📈 性能指标

| 指标 | 数值 | 说明 |
|------|------|------|
| 平均生成时间 | 2-5 秒 | 包含 10 个幻灯片 |
| 文件大小 | 15-25 MB | 取决于内容 |
| 并发支持 | 10+ 请求 | 取决于服务器配置 |

---

## 🔄 从旧方案迁移

### 步骤 1: 更新 API 调用

```typescript
// 旧方案
await axios.post('/api/generate-ppt', data);

// 新方案
await axios.post('/api/generate-ppt/template', data);
```

### 步骤 2: 更新数据格式

```typescript
// 旧方案数据格式
{
  productInfo: {...},
  equipments: [...],  // manufacturer 必填
  faiItems: [...],    // 必须包含完整字段
  fixtures: [...],    // no, size, material 必填
}

// 新方案数据格式（更灵活）
{
  productInfo: {...},
  equipments: [...],  // 只有 name 必填
  faiItems: [...],    // itemName + dimensions 即可
  fixtures: [...],    // name + code + quantity 即可
  revisionHistory: [...],  // 新增
  bom: [...]          // 新增
}
```

### 步骤 3: 测试验证

1. 使用测试脚本验证功能
2. 对比新旧方案生成的 PPT
3. 确认样式和数据正确

---

## 📝 更新日志

- **2026-01-14**: v1.0 - 初始版本
  - 创建 `/api/generate-ppt/template` 端点
  - 集成混合方案（pptx-automizer + Python）
  - 添加 API 信息端点（GET）
  - 创建测试脚本和文档

---

## 📚 相关文档

- [混合方案详细说明](./HYBRID_SOLUTION.md)
- [API 类型定义](../src/lib/types/ppt.ts)
- [测试脚本](../src/lib/services/test-api-endpoint.ts)
