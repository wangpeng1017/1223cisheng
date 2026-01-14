# src/components/ppt 组件索引
> PPT自动生成相关组件

## 文件清单
| 文件名 | 功能 |
|--------|------|
| PPTPreviewDialog.tsx | PPT生成预览和编辑对话框 |
| TemplateSelector.tsx | 模板选择组件 |

## 组件说明

### PPTPreviewDialog
- **用途**: 在生成PPT前预览和编辑数据
- **Props**:
  - `open`: 对话框开关状态
  - `onOpenChange`: 关闭对话框回调
  - `data`: PPT生成数据（产品信息、设备、夹具、FAI项）
  - `onConfirm`: 确认生成回调
  - `isGenerating`: 是否正在生成
- **功能**:
  - 编辑产品信息（项目名、料号、版本、供应商、日期）
  - 编辑设备列表（添加/删除/编辑设备参数）
  - 编辑夹具列表（添加/删除/编辑夹具信息）
  - 预览FAI数据（只读）
  - 选择模板
  - 实时显示预估页数

### TemplateSelector
- **用途**: 选择和管理PPT模板
- **Props**:
  - `selectedTemplate`: 当前选中的模板ID
  - `onTemplateChange`: 模板变更回调
  - `disabled`: 是否禁用
- **功能**:
  - 显示模板列表（卡片式布局）
  - 上传新模板
  - 删除模板
  - 显示文件大小和日期
  - 选中状态指示
