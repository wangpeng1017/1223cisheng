# PPT自动生成系统 产品需求文档 (PRD)

> 最后更新: 2025-01-14 | 版本: 1.0

---

## 一、项目概述

### 1.1 项目愿景
构建一个自动化PPT生成系统，根据产品基础数据（FAI测试报告）自动生成符合Apple规范的Metrology Test Document (MTD)文档，减少供应商手动制作PPT的时间和错误率。

### 1.2 目标用户

| 角色 | 描述 | 核心诉求 |
|------|------|----------|
| 供应商工程师 | 负责制作MTD PPT提交给Apple | 快速、准确地生成符合Apple模板要求的PPT |
| 项目经理 | 审核和管理多个产品的MTD文档 | 统一格式、版本可控、可追溯 |

### 1.3 业务流程

```
产品FAI测试数据
    ↓
上传到Web系统
    ↓
解析PDF/Excel数据
    ↓
选择PPT模板（Apple提供的标准模板）
    ↓
自动填充数据到各页面
    ↓
生成可编辑的PPTX文件
    ↓
下载、人工审核、微调
    ↓
提交给Apple
```

---

## 二、功能清单

### 状态说明
- 🔴 待开发 | 🟡 开发中 | 🟢 已完成 | ⚫ 已废弃

### 功能总览

| ID | 模块 | 功能 | 状态 | 优先级 | 负责人 | 对应代码 |
|----|------|------|------|--------|--------|----------|
| F001 | 数据解析 | FAI数据提取（PDF） | 🔴 | P0 | - | - |
| F002 | 数据解析 | 产品信息字段映射 | 🔴 | P0 | - | - |
| F003 | 模板管理 | PPT模板上传和版本管理 | 🔴 | P1 | - | - |
| F004 | 内容生成 | 封面页生成 | 🔴 | P0 | - | - |
| F005 | 内容生成 | 目录页生成 | 🔴 | P0 | - | - |
| F006 | 内容生成 | 修订历史页生成 | 🔴 | P1 | - | - |
| F007 | 内容生成 | 测量设备详情页生成 | 🔴 | P0 | - | - |
| F008 | 内容生成 | 测量夹具列表页生成 | 🔴 | P0 | - | - |
| F009 | 内容生成 | FAI/SPC汇总表生成 | 🔴 | P0 | - | - |
| F010 | 内容生成 | 各测量项详情页生成 | 🔴 | P0 | - | - |
| F011 | 图片处理 | 测量示意图插入 | 🔴 | P1 | - | - |
| F012 | 图片处理 | 表格/图表插入 | 🔴 | P1 | - | - |
| F013 | 导出功能 | 生成PPTX文件 | 🔴 | P0 | - | - |
| F014 | 导出功能 | 批量生成多个产品PPT | 🔴 | P2 | - | - |

---

## 三、功能详情

### F001: FAI数据提取（PDF）

**用户故事**: 作为供应商工程师，我希望上传FAI测试PDF，系统自动提取所有测量项数据

**验收标准**:
- [ ] 支持上传PDF格式的FAI报告
- [ ] 自动识别并提取以下数据：
  - 产品基本信息（项目名、料号、供应商、日期）
  - FAI编号及对应规格
  - SPC编号及对应规格
  - 测量方法（Measurement Method）
  - 所需夹具（Fixture）
  - 测量状态（Measurement Status）
  - 测量步骤（Measurement Procedure）
  - 设备信息（Name/Manufacturer/Model）
- [ ] 数据准确率达到95%以上
- [ ] 支持人工修正提取错误的数据

**技术备注**:
- 复用现有的 `backend/services/fai_extraction.py`
- 参考文档: `docs/FAI提取技术实现方案.md`

---

### F002: 产品信息字段映射

**用户故事**: 作为系统，我需要将提取的FAI数据映射到PPT模板的对应字段

**验收标准**:
- [ ] 建立字段映射配置表
- [ ] 支持不同产品型号的自定义映射
- [ ] 映射字段包括：
  - Project Name → J510
  - Part Number & Rev → 160-06631-01
  - Vendor → 供应商名称
  - Date → 自动生成当前日期（YYYY/MM/DD格式）

---

### F004: 封面页生成

**用户故事**: 作为系统，我需要自动生成MTD封面页，包含项目基本信息

**页面结构**（参考Slide 1）:
```
Metrology Design（标题）

Project Name:  [项目名称]
Part Number & Rev: [料号-版本]
Vendor: [供应商名称]
Date: [生成日期]
```

**验收标准**:
- [ ] 使用Apple标准模板的封面布局
- [ ] 字体：Arial，标题加粗
- [ ] 自动填充产品基本信息
- [ ] 保持与模板一致的排版和样式

---

### F005: 目录页生成

**用户故事**: 作为系统，我需要自动生成MTD目录页，列出所有章节

**页面结构**（参考Slide 2）:
```
Cover sheet              Page 1
Content                  Page 2
history List             Page 3
Measurement Equipment    Page 4-9
Measurement Fixture List Page 10
Bom List                 Page 11
Details for Each Measurement Page 12-22
```

**验收标准**:
- [ ] 根据实际生成内容动态计算页码
- [ ] 根据测量项数量自动调整页码范围
- [ ] 保持与模板一致的格式

---

### F007: 测量设备详情页生成

**用户故事**: 作为系统，我需要为每个测量设备生成独立的详情页

**页面模板**（参考Slides 4-9）:
```
MTD | [项目名] | Measurement Equipment Details

Name: [设备名称]
Manufacturer: [制造商]
Model: [型号]
Range: [测量范围]
Accuracy: [精度]
其他技术参数...
```

**验收标准**:
- [ ] 每个设备一页
- [ ] 根据FAI数据中的设备信息自动生成
- [ ] 设备类型包括：
  - KEYENCE影像测量仪
  - Height Gage高度规
  - 3D Fluxmeter三维磁通计
  - Magnetic permanent tester永磁测试仪
  - Metallographic Microscope金相显微镜
  - SST Tester盐雾测试仪
- [ ] 支持自定义设备信息字段

---

### F009: FAI/SPC汇总表生成

**用户故事**: 作为系统，我需要生成包含所有FAI/SPC测量项的汇总表

**页面结构**（参考Slide 11）:
```
MTD | [项目名] | Metrology Details

| FAI | SPC | Specification | Description | Method | Fixture | In-Process | Cross check |
|-----|-----|---------------|-------------|--------|---------|------------|-------------|
| 1   | A   | 3*2.00±0.10  | Thickness   | HG     | -       | No         | Guo Teng    |
| 2   | B   | 3*2.85±0.10  | Width       | Keyence | -      | No         | Guo Teng    |
...
```

**验收标准**:
- [ ] 表格包含所有FAI/SPC测量项
- [ ] 自动填充规格、描述、方法、夹具等信息
- [ ] 支持表格分页（超过一页时自动拆分）

---

### F010: 各测量项详情页生成

**用户故事**: 作为系统，我需要为每个FAI/SPC测量项生成详细的测量说明页

**页面模板**（参考Slides 12-22）:
```
[Mono Magnet] [测量项名称]

FAI [编号]/SPC [编号]: [规格] CPK/In-process

1. Measurement Method: [测量方法]
2. Fixture: [夹具编号]
3. Measurement status: [Free/Constrained]
4. Measurement procedure:
   [测量步骤说明...]

[测量示意图]
```

**验收标准**:
- [ ] 每个FAI/SPC项生成一页详情
- [ ] 包含测量方法、夹具、状态、步骤说明
- [ ] 插入对应的测量示意图（如需要）
- [ ] 支持中英文双语

---

### F013: 生成PPTX文件

**用户故事**: 作为供应商工程师，我希望下载生成的PPT文件，并进行人工微调

**验收标准**:
- [ ] 生成标准PPTX格式文件
- [ ] 保持所有文本可编辑
- [ ] 保持所有图片可替换
- [ ] 文件命名格式：`[项目名]_[料号]_[日期].pptx`
- [ ] 支持在线预览（可选）

---

## 四、数据模型

### 4.1 产品信息（ProductInfo）

```typescript
interface ProductInfo {
  projectName: string;      // 项目名称：J510
  partNumber: string;       // 料号：160-06631-01
  revision: string;         // 版本：01
  vendor: string;           // 供应商：MAGSOUND
  date: string;             // 日期：2025/12/02
}
```

### 4.2 测量设备（Equipment）

```typescript
interface Equipment {
  name: string;             // 设备名称
  manufacturer: string;     // 制造商
  model: string;           // 型号
  range?: string;          // 测量范围
  accuracy?: string;       // 精度
  specifications?: Record<string, string>; // 其他技术参数
}
```

### 4.3 FAI测量项（FAIItem）

```typescript
interface FAIItem {
  faiNum: number;          // FAI编号
  spcCode?: string;        // SPC编号
  category: string;        // 分类：厚度/宽度/角度等
  specification: string;   // 规格值：3*2.00±0.10
  description: string;     // 描述：Thickness
  method: string;          // 测量方法：HG/Keyence
  fixture?: string;        // 夹具：J-J510-1#
  status: string;          // 状态：Free/Constrained
  procedure: string[];     // 测量步骤
  equipment?: Equipment;   // 使用的设备
  images?: string[];       // 测量示意图
}
```

---

## 五、PPT页面结构映射

| 页码 | 页面类型 | 数据来源 | 模板参考 |
|------|----------|----------|----------|
| 1 | 封面页 | ProductInfo | Slide 1 |
| 2 | 目录页 | 动态生成 | Slide 2 |
| 3 | 修订历史 | 可选，手动维护 | Slide 3 |
| 4-9 | 设备详情页 | Equipment[] | Slides 4-9 |
| 10 | 夹具列表 | Fixture[] | Slide 10 |
| 11 | FAI/SPC汇总表 | FAIItem[] | Slide 11 |
| 12-22 | 测量项详情页 | FAIItem[] | Slides 12-22 |

---

## 六、非功能性需求

| 类型 | 需求 | 优先级 |
|------|------|--------|
| 性能 | 单个PPT生成时间 < 30秒 | P0 |
| 性能 | 支持同时处理10个产品PPT | P1 |
| 可用性 | 支持常见浏览器（Chrome/Safari/Edge） | P0 |
| 可维护性 | 代码有完整注释和文档 | P0 |
| 扩展性 | 支持添加新的PPT模板 | P1 |

---

## 七、变更历史

| 日期 | 版本 | 变更内容 | 操作人 |
|------|------|----------|--------|
| 2025-01-14 | 1.0 | 初始版本，基于参考PPT J510分析 | AI |
