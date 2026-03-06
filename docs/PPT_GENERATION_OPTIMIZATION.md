# PPT 生成优化方案

> 创建时间: 2026-01-14
> 目标: 提升模板还原度，解决数据填充问题

---

## 🔴 当前问题

### 1. 表格索引不准确

**问题**：所有表格都使用 `table_index: 0`，但某些幻灯片可能有多个表格

**影响**：
- 数据填到错误的表格
- 表格被覆盖或遗漏

**根本原因**：
```typescript
// ❌ 当前实现 - 硬编码 table_index
tablesToFill.push({
  slide_index: currentSlideIndex,
  table_index: 0,  // ⚠️ 假设每个幻灯片只有1个表格
  ...
});
```

**解决方案**：
```typescript
// ✅ 优化方案 - 分析模板获取准确的表格索引
async function getTableIndices(templatePath: string) {
  const automizer = new Automizer({ templateDir: path.dirname(templatePath) });
  const info = await automizer.load(path.basename(templatePath)).getInfo();

  const tableMap = new Map<number, number[]>(); // slideIndex -> tableIndices

  for (const slide of info.slides) {
    const tables = slide.elements.filter(e => e.type === 'table');
    if (tables.length > 0) {
      tableMap.set(slide.number, tables.map((_, idx) => idx));
    }
  }

  return tableMap;
}
```

---

### 2. 表格样式丢失

**问题**：Python `python-pptx` 填充表格时没有保留原始样式

**影响**：
- 字体、颜色、边框等样式丢失
- 与模板样式不一致
- 用户体验差

**根本原因**：
```python
# ❌ 当前实现 - 直接设置 text，丢失样式
cell.text = str(header_text)

# 原有样式被覆盖：
# - 字体名称、大小、颜色
# - 单元格背景色
# - 边框样式
# - 对齐方式
```

**解决方案**：
```python
# ✅ 优化方案 - 保留单元格样式
def fill_table_with_style(table, header, body):
    """填充表格并保留样式"""

    # 填充表头（保留样式）
    if header:
        for col_idx, header_text in enumerate(header):
            if col_idx < len(table.columns):
                cell = table.rows[0].cells[col_idx]

                # 保留原有文本框的样式
                text_frame = cell.text_frame
                text_frame.text = ""  # 清空但保留格式

                # 获取原有段落样式
                if text_frame.paragraphs:
                    paragraph = text_frame.paragraphs[0]
                    # 保留字体、颜色等样式
                    run = paragraph.runs[0] if paragraph.runs else paragraph.add_run()
                    run.text = str(header_text)

    # 填充数据（保留样式）
    for row_idx, row_data in enumerate(body):
        data_row = table.rows[row_idx + 1]

        for col_idx, cell_value in enumerate(row_data.values):
            if col_idx < len(data_row.cells):
                cell = data_row.cells[col_idx]
                text_frame = cell.text_frame
                text_frame.text = ""

                if text_frame.paragraphs:
                    paragraph = text_frame.paragraphs[0]
                    run = paragraph.runs[0] if paragraph.runs else paragraph.add_run()
                    run.text = str(cell_value)
```

**更优方案 - 直接修改 XML**：
```python
# ✅✅ 最佳方案 - 直接修改 XML，完全保留样式
from pptx.oxml import parse_xml

def fill_table_preserve_style(table, header, body):
    """完全保留样式地填充表格"""

    # 填充表头
    if header:
        for col_idx, header_text in enumerate(header):
            cell = table.rows[0].cells[col_idx]
            # 直接修改 XML 文本节点
            tc = cell._tc
            text_elem = tc.find('.//a:t', namespaces=tc.nsmap)
            if text_elem is not None:
                text_elem.text = str(header_text)
            else:
                # 如果没有文本节点，创建一个（保留样式）
                cell.text = str(header_text)

    # 填充数据
    for row_idx, row_data in enumerate(body):
        for col_idx, cell_value in enumerate(row_data.values):
            cell = table.rows[row_idx + 1].cells[col_idx]
            tc = cell._tc
            text_elem = tc.find('.//a:t', namespaces=tc.nsmap)
            if text_elem is not None:
                text_elem.text = str(cell_value)
```

---

### 3. 幻灯片索引计算偏差

**问题**：`currentSlideIndex` 计算不准确，导致表格填错页

**影响**：
- 修订历史表格填到其他页
- 设备详情表格错位

**根本原因**：
```typescript
// ❌ 当前实现 - 手动维护索引
let currentSlideIndex = 0;

await pres.addSlide('template', 1, (slide) => {
  currentSlideIndex++;  // ⚠️ 依赖手动递增
});

await pres.addSlide('template', 2);  // ⚠️ 没有递增
currentSlideIndex++;
```

**解决方案**：
```typescript
// ✅ 优化方案 - 使用 pptx-automizer 的回调获取实际索引
const slideIndices: number[] = [];

await pres.addSlide('template', 1, (slide) => {
  // 在回调中获取实际幻灯片索引
  const actualIndex = slide.getIndex(); // 如果 API 提供
  slideIndices.push(actualIndex);
});

// 或者使用管道追踪
pres.on('slide:added', (slide) => {
  slideIndices.push(slide.number);
});
```

**临时方案**：
```typescript
// ✅ 临时方案 - 每次添加幻灯片后递增
let currentSlideIndex = 0;

// 封面页
await pres.addSlide('template', 1, (slide) => {
  currentSlideIndex = 1;
  // ...
});

// 目录页
await pres.addSlide('template', 2);
currentSlideIndex = 2;

// 修订历史页
await pres.addSlide('template', 3);
currentSlideIndex = 3;
```

---

### 4. 缺少图片复制

**问题**：模板中的图片没有被复制到生成的 PPT

**影响**：
- Logo、装饰图片丢失
- 页面不完整

**解决方案**：
```typescript
// ✅ 使用 pptx-automizer 的 addImage
await pres.addSlide('template', 4, (slide) => {
  slide.addImage({
    src: 'public/logo.png',
    x: 1, y: 1, width: 2, height: 2
  });
});

// 或者从模板复制图片
slide.modifyElement('image24.jpeg', [
  modify.setSrc('new-image.png')
]);
```

---

### 5. 硬编码元素名称

**问题**：使用硬编码的元素名称（如 `'Project Name:X1335…'`）

**影响**：
- 模板修改后代码失效
- 难以维护

**解决方案**：
```typescript
// ✅ 使用元素分析工具
async function findTextElement(slideNumber: number, searchText: string) {
  const info = await pres.getInfo();
  const slide = info.slides[slideNumber - 1];

  for (const element of slide.elements) {
    if (element.text && element.text.includes(searchText)) {
      return element.name;
    }
  }

  return null;
}

// 使用时
const projectNameElement = await findTextElement(1, 'Project Name');
if (projectNameElement) {
  slide.modifyElement(projectNameElement, [
    modify.setText(data.projectName)
  ]);
}
```

---

### 6. 缺少单元格格式处理

**问题**：数据没有按照模板格式化（如小数位数、单位）

**影响**：
- 数据展示不统一
- 缺少单位

**解决方案**：
```typescript
// ✅ 在数据准备阶段格式化
function formatDimensionValue(value: number, unit?: string): string {
  let formatted = value.toFixed(2); // 保留2位小数
  if (unit) {
    formatted += ` ${unit}`;
  }
  return formatted;
}

// 使用
body: fai.dimensions.map(dim => ({
  values: [
    dim.name,
    formatDimensionValue(dim.nominal, dim.unit),
    formatDimensionValue(dim.actual, dim.unit),
    dim.result
  ]
}))
```

---

## 🎯 优化优先级

| 优先级 | 问题 | 工作量 | 影响 |
|--------|------|--------|------|
| P0 | 表格样式丢失 | 中 | 🔴 严重影响还原度 |
| P0 | 幻灯片索引偏差 | 小 | 🔴 导致数据错位 |
| P0 | 表格索引不准确 | 中 | 🔴 数据填错位置 |
| P1 | 缺少图片复制 | 中 | 🟡 页面不完整 |
| P1 | 硬编码元素名 | 小 | 🟡 维护性差 |
| P2 | 单元格格式处理 | 小 | 🟢 体验优化 |

---

## 📋 实施计划

### 阶段 1: 修复核心问题（P0）

1. **修复幻灯片索引计算**
   - 使用明确的索引赋值
   - 验证每个幻灯片的索引

2. **优化表格样式保留**
   - 改进 Python 填充逻辑
   - 使用 XML 操作保留样式

3. **添加表格索引映射**
   - 分析模板获取准确索引
   - 建立幻灯片到表格的映射

### 阶段 2: 完善功能（P1）

4. **添加图片复制**
   - 识别模板中的图片
   - 使用 pptx-automizer 复制

5. **改进元素定位**
   - 使用文本内容查找元素
   - 避免硬编码名称

### 阶段 3: 优化体验（P2）

6. **添加数据格式化**
   - 数值格式化
   - 单位处理

---

## 🔧 技术细节

### Python 表格样式保留完整代码

```python
def fill_table_preserve_complete_style(table, header, body):
    """
    完全保留样式地填充表格

    Args:
        table: python-pptx Table 对象
        header: 表头列表
        body: 数据列表
    """
    from pptx.oxml.ns import nsmap
    from lxml import etree

    # 命名空间
    a_ns = nsmap['a']

    # 填充表头
    if header:
        row = table.rows[0]
        for col_idx, header_text in enumerate(header):
            if col_idx < len(row.cells):
                cell = row.cells[col_idx]
                tc = cell._tc

                # 查找所有 <a:t> 文本节点
                text_elements = tc.findall('.//a:t', namespaces=tc.nsmap)

                if text_elements:
                    # 保留第一个文本节点的样式
                    text_elements[0].text = str(header_text)

                    # 删除其他文本节点
                    for text_elem in text_elements[1:]:
                        parent = text_elem.getparent()
                        if parent is not None:
                            parent.remove(text_elem)
                else:
                    # 如果没有文本节点，创建一个
                    cell.text = str(header_text)

    # 填充数据
    for row_idx, row_data in enumerate(body):
        if row_idx + 1 >= len(table.rows):
            # 需要添加新行
            table.rows._tbl.add_tr()

        row = table.rows[row_idx + 1]
        for col_idx, cell_value in enumerate(row_data.values):
            if col_idx < len(row.cells):
                cell = row.cells[col_idx]
                tc = cell._tc

                # 查找所有 <a:t> 文本节点
                text_elements = tc.findall('.//a:t', namespaces=tc.nsmap)

                if text_elements:
                    text_elements[0].text = str(cell_value)

                    # 删除其他文本节点
                    for text_elem in text_elements[1:]:
                        parent = text_elem.getparent()
                        if parent is not None:
                            parent.remove(text_elem)
                else:
                    cell.text = str(cell_value)
```

### TypeScript 幻灯片索引修复

```typescript
// ✅ 明确的幻灯片索引管理
class SlideIndexTracker {
  private currentIndex = 0;

  addSlide(): number {
    this.currentIndex++;
    return this.currentIndex;
  }

  getCurrent(): number {
    return this.currentIndex;
  }

  reset(): void {
    this.currentIndex = 0;
  }
}

// 使用
const tracker = new SlideIndexTracker();

// 封面页
await pres.addSlide('template', 1, (slide) => {
  const idx = tracker.addSlide(); // idx = 1
  tablesToFill.push({
    slide_index: idx,
    ...
  });
});

// 目录页
await pres.addSlide('template', 2);
const idx = tracker.addSlide(); // idx = 2
```

---

## ✅ 验收标准

- [ ] 所有表格数据填到正确位置
- [ ] 表格样式与模板完全一致（字体、颜色、边框）
- [ ] 幻灯片索引准确，数据不错位
- [ ] 图片正确显示
- [ ] 元素定位可靠，不依赖硬编码
- [ ] 数值格式化正确（小数位数、单位）

---

## 📝 测试用例

### 测试数据

```typescript
const testData: PPTGenerationData = {
  productInfo: {
    projectName: '测试项目 - 验证优化',
    partNumber: 'OPT-001'
  },
  revisionHistory: [
    { version: 'A01', date: '2026-01-14', content: '优化前', reviser: 'Dev' },
    { version: 'A02', date: '2026-01-14', content: '优化后', reviser: 'AI' }
  ],
  equipments: [
    { name: '设备1', model: 'M1', precision: '±0.001', quantity: 1 },
    { name: '设备2', model: 'M2', precision: '±0.002', quantity: 2 }
  ],
  faiItems: [
    {
      itemName: 'FAI 测试项',
      dimensions: [
        { name: '长度', nominal: 100.123, actual: 100.125, result: 'OK' },
        { name: '宽度', nominal: 50.456, actual: 50.458, result: 'OK' }
      ]
    }
  ]
};
```

### 验收步骤

1. 生成测试 PPT
2. 打开 PPT 检查每一页
3. 对比模板验证：
   - 表格位置
   - 表格样式
   - 数据内容
   - 图片显示

---

## 🎯 下一步

1. ✅ 创建优化方案文档
2. ⏳ 实施 P0 优化
3. ⏳ 测试验证
4. ⏳ 实施 P1 优化
5. ⏳ 用户验收测试
