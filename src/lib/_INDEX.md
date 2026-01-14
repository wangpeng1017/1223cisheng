# src/lib 架构说明
前端工具库
⚠️ 文件夹变化时请更新此文件

## 目录结构

```
src/lib/
├── types/          # 类型定义
├── config/         # 配置文件
├── services/       # 服务层
└── utils/          # 工具函数
```

## 文件清单
| 文件名 | 地位 | 功能 |
|--------|------|------|
| types/ppt.ts | 核心 | PPT生成系统的核心类型定义 |
| config/ppt-styles.ts | 配置 | PPT样式配置（基于Apple MTD模板） |
| services/ppt-data-transformer.ts | 核心 | 数据转换服务（FAI→PPT格式） |
| services/test-ppt-gen.ts | Demo | PPT生成Demo脚本（技术验证） |
| ppt-generator.ts | 已有 | MTD PPT生成服务 |
