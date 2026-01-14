# PPT自动生成系统 技术实现方案 (TECH)

> 版本: 1.0 | 更新: 2025-01-14

---

## 一、技术栈选型

### 1.1 后端技术

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 18+ | 运行时环境 |
| Next.js | 14+ | 全栈框架（已有） |
| Python | 3.9+ | FAI数据提取（已有） |
| PptxGenJS | 3.12+ | PPTX文件生成 |

### 1.2 前端技术

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18+ | UI框架（已有） |
| TypeScript | 5+ | 类型安全（已有） |
| Ant Design | 5+ | UI组件库（已有） |
| React Dropzone | - | 文件上传 |

### 1.3 PPT生成库选择

**方案对比：**

| 库名 | 语言 | 优点 | 缺点 | 推荐 |
|------|------|------|------|------|
| **PptxGenJS** | JavaScript/Node.js | 原生JS支持，无需Python，API简洁 | 样式自定义能力有限 | ✅ 推荐 |
| python-pptx | Python | 功能强大，样式控制精细 | 需要跨语言调用 | ⚠️ 备选 |
| Officegen | Node.js | 轻量级 | 功能较简单，维护较少 | ❌ 不推荐 |

**最终选择：PptxGenJS**
- 与现有Next.js技术栈无缝集成
- 不需要额外维护Python服务
- 满足基本的PPT生成需求

---

## 二、系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────┐
│                     前端（Next.js）                      │
├─────────────────────────────────────────────────────────┤
│  页面：上传FAI → 配置参数 → 预览 → 下载PPT              │
│  组件：FileUploader / FormConfig / PPTPreview           │
└─────────────────────────────────────────────────────────┘
                          ↓ API调用
┌─────────────────────────────────────────────────────────┐
│                  API Routes（Next.js）                   │
├─────────────────────────────────────────────────────────┤
│  POST /api/parse-fai      - 解析FAI PDF                 │
│  POST /api/generate-ppt   - 生成PPT                     │
│  GET  /api/templates      - 获取模板列表                │
│  POST /api/templates      - 上传模板                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   服务层（Services）                     │
├─────────────────────────────────────────────────────────┤
│  faiExtractor.ts      - FAI数据提取                     │
│  pptGenerator.ts      - PPT生成逻辑                     │
│  templateManager.ts   - 模板管理                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   Python服务（可选）                     │
├─────────────────────────────────────────────────────────┤
│  backend/services/fai_extraction.py  - FAI解析（已有）   │
└─────────────────────────────────────────────────────────┘
```

---

## 三、核心模块设计

### 3.1 FAI数据提取（faiExtractor.ts）

**职责**：调用Python服务解析FAI PDF，返回结构化数据

```typescript
// src/lib/services/faiExtractor.ts

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface FAIExtractResult {
  productInfo: ProductInfo;
  equipments: Equipment[];
  faiItems: FAIItem[];
  fixtures: Fixture[];
}

export async function extractFAIFromPDF(pdfPath: string): Promise<FAIExtractResult> {
  // 调用Python脚本
  const { stdout } = await execAsync(
    `python3 backend/services/fai_extraction.py "${pdfPath}"`
  );

  return JSON.parse(stdout);
}
```

---

### 3.2 PPT生成器（pptGenerator.ts）

**职责**：根据提取的FAI数据，使用PptxGenJS生成PPTX文件

```typescript
// src/lib/services/pptGenerator.ts

import PptxGenJS from 'pptxgenjs';

export class PPTGenerator {
  private pptx: PptxGenJS;

  constructor(template?: string) {
    this.pptx = new PptxGenJS();
    // 加载模板（可选）
  }

  // 生成封面页
  async generateCoverPage(info: ProductInfo): Promise<void> {
    const slide = this.pptx.addSlide();

    // 标题
    slide.addText('Metrology Design', {
      x: '46%', y: '40%', fontSize: 24, bold: true
    });

    // 产品信息
    slide.addText([
      { text: `Project Name: ${info.projectName}\n` },
      { text: `Part Number & Rev：${info.partNumber}-${info.revision}\n` },
      { text: `Vendor：${info.vendor}\n` },
      { text: `Date：${info.date}` }
    ], {
      x: '55%', y: '55%', fontSize: 14, bold: true
    });
  }

  // 生成目录页
  async generateTOC(pageCounts: TOCPageCounts): Promise<void> {
    const slide = this.pptx.addSlide();

    const content = [
      'Cover sheet              Page 1',
      'Content                  Page 2',
      'history List             Page 3',
      `Measurement Equipment    Page 4-${pageCounts.equipmentEnd}`,
      `Measurement Fixture List Page ${pageCounts.fixturePage}`,
      `Bom List                 Page ${pageCounts.bomPage}`,
      `Details for Each Measurement Page ${pageCounts.detailsStart}-${pageCounts.detailsEnd}`
    ];

    slide.addText(content, {
      x: '20%', y: '30%', fontSize: 18
    });
  }

  // 生成设备详情页
  async generateEquipmentPages(equipments: Equipment[]): Promise<void> {
    for (const eq of equipments) {
      const slide = this.pptx.addSlide();

      const content = [
        { text: `Name: ${eq.name}`, options: { bold: true } },
        `Manufacturer: ${eq.manufacturer}`,
        `Model: ${eq.model}`,
        eq.range ? `Range: ${eq.range}` : null,
        eq.accuracy ? `Accuracy: ${eq.accuracy}` : null
      ].filter(Boolean);

      slide.addText(content, {
        x: '15%', y: '25%', fontSize: 14, lineSpacing: 32
      });
    }
  }

  // 生成FAI/SPC汇总表
  async generateFAISummaryTable(faiItems: FAIItem[]): Promise<void> {
    const slide = this.pptx.addSlide();

    // 表头
    const headers = ['FAI', 'SPC', 'Specification', 'Description', 'Method', 'Fixture'];

    // 表格数据
    const tableData = faiItems.map(item => [
      item.faiNum.toString(),
      item.spcCode || '',
      item.specification,
      item.description,
      item.method,
      item.fixture || ''
    ]);

    slide.addTable([headers, ...tableData], {
      x: '10%', y: '20%',
      w: '80%', h: '60%',
      fontSize: 10,
      border: { pt: 1, color: 'CCCCCC' }
    });
  }

  // 生成测量项详情页
  async generateFAIDetailPages(faiItems: FAIItem[]): Promise<void> {
    for (const item of faiItems) {
      const slide = this.pptx.addSlide();

      // 标题
      const title = `${item.category} ${item.description}`;
      slide.addText(title, {
        x: '10%', y: '5%', fontSize: 18, bold: true
      });

      // FAI/SPC信息
      slide.addText(
        `FAI ${item.faiNum}${item.spcCode ? `/SPC ${item.spcCode}` : ''}: ${item.specification} CPK`,
        { x: '10%', y: '15%', fontSize: 14 }
      );

      // 测量信息
      const details = [
        `1. Measurement Method：${item.method}`,
        `2. Fixture：${item.fixture || '/'}`,
        `3. Measurement status：${item.status}`,
        `4. Measurement procedure：`
      ];

      slide.addText(details, {
        x: '10%', y: '25%', fontSize: 12
      });

      // 测量步骤
      const procedure = item.procedure.map((p, i) => `${i + 1}. ${p}`);
      slide.addText(procedure, {
        x: '10%', y: '45%', fontSize: 11
      });

      // 添加图片（如有）
      if (item.images && item.images.length > 0) {
        slide.addImage({
          path: item.images[0],
          x: '55%', y: '45%', w: '35%', h: '40%'
        });
      }
    }
  }

  // 生成PPTX文件
  async generate(outputPath: string): Promise<void> {
    await this.pptx.writeFile({ fileName: outputPath });
  }
}
```

---

### 3.3 API路由设计

#### POST /api/parse-fai

**请求**：
```typescript
{
  pdfFile: File
}
```

**响应**：
```typescript
{
  productInfo: ProductInfo;
  equipments: Equipment[];
  faiItems: FAIItem[];
  fixtures: Fixture[];
}
```

#### POST /api/generate-ppt

**请求**：
```typescript
{
  productInfo: ProductInfo;
  equipments: Equipment[];
  faiItems: FAIItem[];
  fixtures: Fixture[];
  options?: {
    includeHistory?: boolean;
    template?: string;
  }
}
```

**响应**：
```typescript
{
  downloadUrl: string;  // 下载链接
  filename: string;     // 文件名
}
```

---

## 四、数据流设计

### 4.1 完整数据流

```
1. 用户上传FAI PDF
   ↓
2. 前端：POST /api/parse-fai (FormData)
   ↓
3. 后端：保存文件到 /tmp
   ↓
4. 后端：调用Python脚本解析
   ↓
5. Python：提取数据，返回JSON
   ↓
6. 后端：返回结构化数据给前端
   ↓
7. 前端：展示数据预览表单
   ↓
8. 用户：确认/修改数据
   ↓
9. 前端：POST /api/generate-ppt
   ↓
10. 后端：使用PptxGenJS生成PPTX
   ↓
11. 后端：保存到 /public/downloads
   ↓
12. 前端：下载文件
```

---

## 五、核心数据结构

```typescript
// src/lib/types/ppt.ts

export interface ProductInfo {
  projectName: string;
  partNumber: string;
  revision: string;
  vendor: string;
  date: string;
}

export interface Equipment {
  name: string;
  manufacturer: string;
  model: string;
  range?: string;
  accuracy?: string;
  specifications?: Record<string, string>;
}

export interface Fixture {
  no: string;
  size: string;
  material: string;
  pic?: string;
  remark?: string;
}

export interface FAIItem {
  faiNum: number;
  spcCode?: string;
  category: string;
  specification: string;
  description: string;
  method: string;
  fixture?: string;
  status: string;
  procedure: string[];
  equipment?: Equipment;
  images?: string[];
}

export interface TOCPageCounts {
  equipmentEnd: number;
  fixturePage: number;
  bomPage: number;
  detailsStart: number;
  detailsEnd: number;
}
```

---

## 六、关键实现细节

### 6.1 PPT模板样式配置

```typescript
// src/lib/config/ppt-styles.ts

export const PPT_STYLES = {
  cover: {
    titleFontSize: 24,
    infoFontSize: 14,
    fontFace: 'Arial',
    bold: true
  },
  toc: {
    fontSize: 18,
    fontFace: 'Arial',
    lineSpacing: 36
  },
  table: {
    headerFontSize: 12,
    bodyFontSize: 10,
    fontFace: 'Arial',
    borderColor: 'CCCCCC',
    headerColor: '4472C4'
  },
  content: {
    titleFontSize: 18,
    bodyFontSize: 12,
    procedureFontSize: 11
  }
};
```

### 6.2 页码计算逻辑

```typescript
function calculatePageCounts(
  equipmentCount: number,
  faiItemCount: number
): TOCPageCounts {
  return {
    equipmentEnd: 3 + equipmentCount,  // 页3开始，设备数页后结束
    fixturePage: 3 + equipmentCount + 1,
    bomPage: 3 + equipmentCount + 2,
    detailsStart: 3 + equipmentCount + 3,
    detailsEnd: 3 + equipmentCount + 2 + faiItemCount
  };
}
```

---

## 七、部署说明

### 7.1 环境依赖

```bash
# Node.js依赖
npm install pptxgenjs

# Python依赖（已有）
pip install pdfplumber
```

### 7.2 环境变量

```env
# .env.local
UPLOAD_DIR=/tmp/uploads
DOWNLOAD_DIR=/public/downloads
PYTHON_PATH=python3
```

---

## 八、扩展性设计

### 8.1 模板系统

```typescript
// 支持加载自定义PPT模板
class PPTGenerator {
  async loadTemplate(templatePath: string): Promise<void> {
    // 解析模板PPTX，提取布局和样式
    // 应用到新生成的PPT
  }
}
```

### 8.2 多语言支持

```typescript
const I18N = {
  zh: {
    coverTitle: '计量设计',
    measurementMethod: '测量方法',
    fixture: '夹具'
  },
  en: {
    coverTitle: 'Metrology Design',
    measurementMethod: 'Measurement Method',
    fixture: 'Fixture'
  }
};
```

---

## 九、已知限制和风险

| 问题 | 影响 | 缓解措施 |
|------|------|----------|
| PptxGenJS样式能力有限 | 复杂布局可能不够精确 | 预先生成模板页，修改内容 |
| PDF解析准确率 | 可能提取错误 | 提供人工审核修正界面 |
| 中文字体问题 | 可能缺少中文字体 | 内嵌字体或使用系统字体 |

---

## 十、后续优化方向

1. **AI辅助优化**：使用LLM自动生成测量步骤描述
2. **模板市场**：支持用户上传和共享自定义模板
3. **版本管理**：PPT生成历史记录和版本对比
4. **批量生成**：一次性生成多个产品的PPT
5. **在线协作**：多人同时编辑同一个PPT
