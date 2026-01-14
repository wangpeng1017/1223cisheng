# 变更日志

## 2025-01-14

### 部署配置 - 阿里云自动化部署
- **新增**: ecosystem.config.cjs - PM2 配置文件
  - 内存限制: 512MB（避免影响其他应用）
  - 端口: 3002
  - 自动重启机制
  - 日志管理配置
- **新增**: scripts/deploy-aliyun.sh - 自动部署脚本
  - 一键部署到阿里云服务器
  - 自动构建（后台执行避免SSH超时）
  - 自动重启 PM2 服务
- **新增**: scripts/start-server.sh - 服务器启动脚本
  - 首次部署使用
  - 自动安装依赖和构建
  - 启动 PM2 服务
- **新增**: docs/DEPLOY-ALIYUN.md - 阿里云部署文档
  - 完整部署流程说明
  - 故障排查指南
  - 性能优化建议
- **新增**: scripts/_INDEX.md - 脚本索引文档
- **修复**: 修复构建时 SSR 错误
  - PPTPreviewDialog 组件添加 null 检查
  - 使用 useEffect 同步数据
  - 避免在构建时访问 null 对象属性

### 本地构建结果
- ✅ 构建成功（Next.js 16.1.1）
- ✅ 构建产物大小: 22MB
- ✅ 静态资源: 2.6MB
- ✅ 最大 chunk: 736KB

### PPT自动生成系统 - 模板选择功能（Phase 4）
- **新增**: src/app/api/ppt/templates/route.ts - 模板管理API
  - GET /api/ppt/templates - 获取模板列表
  - POST /api/ppt/templates - 上传新模板
  - DELETE /api/ppt/templates?id=xxx - 删除模板
- **新增**: src/components/ppt/TemplateSelector.tsx - 模板选择组件
  - 模板列表展示（卡片式布局）
  - 上传模板功能（拖拽或点击上传）
  - 删除模板功能（带确认提示）
  - 选中状态显示（绿色边框+对勾图标）
  - 文件大小和日期显示
- **更新**: src/components/ppt/PPTPreviewDialog.tsx - 集成模板选择
  - 添加"模板"Tab页（第5个Tab）
  - 默认选中"default"模板
  - 模板选择状态管理
- **更新**: src/components/ppt/_INDEX.md - 更新组件索引

### 模板管理功能
- ✅ 支持上传自定义PPTX模板
- ✅ 模板列表展示（卡片式）
- ✅ 模板选择和切换
- ✅ 模板删除功能
- ✅ 文件大小和日期显示
- ⏳ 模板缩略图生成（待实现，需要额外的库支持）

### PPT自动生成系统 - 人工修正功能（Phase 3）
- **新增**: src/components/ppt/PPTPreviewDialog.tsx - PPT预览编辑对话框
  - 产品信息编辑：项目名称、料号、版本、供应商、日期
  - 设备列表编辑：添加/删除设备，编辑设备参数
  - 夹具列表编辑：添加/删除夹具，编辑夹具信息
  - FAI数据预览：显示所有FAI测量项
  - 实时页数预估：根据内容动态计算PPT页数
- **更新**: src/lib/types/ppt.ts - 添加PPTGenerationData类型
- **更新**: src/app/drawing-extract/page.tsx - 集成预览对话框
  - 点击"生成PPT"按钮后先打开预览对话框
  - 用户确认后才生成PPT文件
  - 支持编辑所有关键信息
- **修复**: 修复重复导入问题，通过TypeScript类型检查

### 用户体验优化
- ✅ 生成前预览和编辑，避免数据错误
- ✅ 实时显示预估页数
- ✅ 表格式编辑，操作简单直观
- ✅ 支持添加/删除设备和夹具
- ✅ 四个Tab分类：产品信息、设备、夹具、FAI数据

### PPT自动生成系统 - 完整实现（Phase 2）
- **新增**: src/app/api/generate-ppt/route.ts - PPT生成API
  - POST /api/generate-ppt - 根据FAI数据生成完整PPT
  - 支持所有页面类型：封面、目录、历史、设备、夹具、BOM、汇总表、详情页
  - 自动计算页码和生成文件名
- **新增**: src/lib/services/ppt-data-transformer.ts - 数据转换服务
  - transformAllData(): 将drawing-extract的FAI数据转换为PPT格式
  - extractProductInfoFromFileName(): 从文件名提取产品信息
  - inferEquipments(): 根据测量类型自动推断所需设备
  - generateFixtures(): 生成夹具列表
  - transformFAIItem(): 转换单个FAI项
- **更新**: src/app/drawing-extract/page.tsx - 添加"生成PPT"功能
  - 添加"生成PPT"按钮（蓝色主按钮）
  - 集成generatePPT()函数
  - 支持自动下载生成的PPT文件
- **修复**: 修复所有TypeScript类型错误，通过tsc --noEmit检查
- **删除**: 删除parse-fai API（使用现有的drawing-extract模块）

### 集成方案
- ✅ 直接使用现有的drawing-extract模块的FAI提取功能
- ✅ 通过数据转换层连接FAI数据和PPT生成
- ✅ 在图纸提取页面添加一键生成PPT按钮
- ✅ 完整的用户体验：上传PDF → 查看FAI数据 → 生成PPT → 自动下载

### 技术验证（Phase 1 - 任务1.2）
- **依赖**: 安装 pptxgenjs（PPT生成库）和 tsx（TypeScript执行器）
- **新增**: src/lib/types/ppt.ts - 核心类型定义
  - ProductInfo: 产品基本信息
  - Equipment: 测量设备信息
  - Fixture: 测量夹具信息
  - FAIItem: FAI测量项信息
  - FAIExtractResult: FAI数据提取结果
- **新增**: src/lib/config/ppt-styles.ts - PPT样式配置
  - 基于Apple MTD模板的样式定义
  - 封面页、目录页、表格、内容页样式
  - 颜色主题和布局常量
- **新增**: src/lib/services/test-ppt-gen.ts - PPT生成Demo
  - 验证PptxGenJS技术可行性
  - 实现封面页、目录页、设备详情页、FAI汇总表、测量项详情页生成
  - 成功生成 test-output.pptx（143KB，共5页）
- **更新**: src/lib/_INDEX.md - 添加新文件索引

### 验收结果
- ✅ PptxGenJS可以成功生成PPTX文件
- ✅ 中文显示正常
- ✅ 布局位置准确（与参考PPT对比）
- ✅ 表格功能正常
- ✅ 样式配置可用

### PPT自动生成系统 - 需求梳理
- **新增**: docs/PRD.md - PPT自动生成系统产品需求文档
  - 基于参考PPT J510分析，梳理完整业务流程
  - 定义14个核心功能模块（F001-F014）
  - 明确数据模型和页面结构映射
- **新增**: docs/TECH.md - PPT自动生成系统技术实现方案
  - 技术栈选型：PptxGenJS + Next.js
  - 系统架构设计：前端/API/服务层分层
  - 核心模块代码框架和数据流设计
- **新增**: docs/DEV-PLAN.md - PPT自动生成系统开发计划
  - 4个开发阶段（Phase 1-4）
  - 15个详细任务，含工作量估算
  - 任务状态跟踪看板
  - 风险应对措施
- **更新**: docs/_INDEX.md - 添加新文档索引

### 参考PPT结构分析
分析参考PPT `J510-P2_MTD-Mono+Magnet-160-06631-01-Magsound_20251202.pptx`，共22页：
- 第1页：封面页（项目基本信息）
- 第2页：目录页
- 第3页：修订历史
- 第4-9页：测量设备详情页（6个设备）
- 第10页：测量夹具列表
- 第11页：FAI/SPC汇总表
- 第12-22页：各测量项详情页（11个测量项）

## 2026-01-04

### MTD 页面重构
- **重大变更**: 将 MTD 项目管理页面从卡片布局重构为表格布局
- **新增**: 抽屉式表单组件 (ProjectSheet, EquipmentSheet, FixtureSheet, TemplateManageSheet)
- **新增**: 模板管理抽屉，支持预览和下载编辑
- **修复**: Select 下拉框在 Dialog 中的 z-index 冲突问题

### API 更新
- **新增**: PUT /api/mtd/projects/{id} - 更新项目
- **新增**: PUT /api/mtd/equipment/{id} - 更新设备  
- **新增**: PUT /api/mtd/fixtures/{id} - 更新夹具
- **新增**: GET /api/ppt/templates/{id}/thumbnail - 获取缩略图
- **新增**: GET /api/ppt/templates/{id}/download - 下载模板

### 技术栈
- 前端: Next.js 16.1.1, TypeScript, shadcn/ui
- 后端: FastAPI, Python 3.8, SQLAlchemy
