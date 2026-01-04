# MTD 组件目录

> MTD 项目管理模块的 UI 组件，包含表格页面和抽屉式表单

## 文件清单

| 文件 | 地位 | 功能 |
|------|------|------|
| index.ts | 导出 | 统一导出所有 MTD 组件 |
| ProjectSheet.tsx | 核心组件 | 项目新建/编辑抽屉 |
| EquipmentSheet.tsx | 核心组件 | 设备新建/编辑抽屉 |
| FixtureSheet.tsx | 核心组件 | 夹具新建/编辑抽屉 |
| TemplateManageSheet.tsx | 功能组件 | PPT 模板管理抽屉 |

## 组件依赖关系
- page.tsx (MTD页面)
  - ProjectSheet
  - EquipmentSheet
  - FixtureSheet
  - TemplateManageSheet
    - PPTTemplateUpload (共享组件)
