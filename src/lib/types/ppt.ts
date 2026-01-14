/**
 * @file ppt.ts
 * @desc PPT自动生成系统的核心类型定义
 * @input 依赖: 无
 * @output 导出: ProductInfo, Equipment, Fixture, FAIItem, FAIExtractResult, TOCPageCounts
 * @see PRD: docs/PRD.md#四、数据模型
 */

/**
 * 产品基本信息
 */
export interface ProductInfo {
  /** 项目名称，如 J510 */
  projectName: string;
  /** 料号，如 160-06631-01 */
  partNumber: string;
  /** 版本号，如 01 */
  revision: string;
  /** 供应商名称，如 MAGSOUND */
  vendor: string;
  /** 日期，格式：YYYY/MM/DD */
  date: string;
}

/**
 * 测量设备信息
 */
export interface Equipment {
  /** 设备名称 */
  name: string;
  /** 制造商 */
  manufacturer?: string;
  /** 型号 */
  model?: string;
  /** 测量范围（可选） */
  range?: string;
  /** 精度（可选） */
  precision?: string;
  accuracy?: string;  // 别名，兼容旧代码
  /** 数量（可选） */
  quantity?: number;
  /** 其他技术参数（可选） */
  specifications?: Record<string, string>;
}

/**
 * 测量夹具信息
 */
export interface Fixture {
  /** 夹具名称（混合方案使用） */
  name?: string;
  /** 夹具编号（混合方案使用） */
  code?: string;
  /** 数量（混合方案使用） */
  quantity?: number;
  /** 夹具编号（原方案） */
  no?: string;
  /** 尺寸（原方案） */
  size?: string;
  /** 材质（原方案） */
  material?: string;
  /** 图片（可选） */
  pic?: string;
  /** 备注（可选） */
  remark?: string;
}

/**
 * 修订历史信息
 */
export interface RevisionHistory {
  /** 版本号 */
  version: string;
  /** 日期 */
  date: string;
  /** 修订内容 */
  content: string;
  /** 修订人（可选） */
  reviser?: string;
}

/**
 * BOM物料信息
 */
export interface BOMItem {
  /** 物料名称 */
  name: string;
  /** 物料编号 */
  code?: string;
  /** 规格 */
  specification?: string;
  /** 数量 */
  quantity?: number;
}

/**
 * FAI尺寸数据（混合方案使用）
 */
export interface FAIDimension {
  /** 尺寸名称 */
  name: string;
  /** 规格值 */
  nominal?: string | number;
  /** 实测值 */
  actual?: string | number;
  /** 判定结果 */
  result?: string;
}

/**
 * FAI测量项信息（原方案 + 混合方案）
 */
export interface FAIItem {
  /** FAI编号 */
  faiNum?: number;
  /** SPC编号（可选） */
  spcCode?: string;
  /** 分类，如：厚度、宽度、角度等 */
  category?: string;
  /** 规格值，如：3*2.00±0.10 */
  specification?: string;
  /** 描述，如：Thickness */
  description?: string;
  /** 测量方法，如：HG、Keyence */
  method?: string;
  /** 夹具编号（可选） */
  fixture?: string;
  /** 测量状态：Free 或 Constrained */
  status?: string;
  /** 测量步骤（数组） */
  procedure?: string[];
  /** 使用的设备（可选） */
  equipment?: Equipment;
  /** 测量示意图路径（可选） */
  images?: string[];
  /** FAI项名称（混合方案使用） */
  itemName?: string;
  /** 尺寸数据（混合方案使用） */
  dimensions?: FAIDimension[];
}

/**
 * FAI数据提取结果
 */
export interface FAIExtractResult {
  /** 产品基本信息 */
  productInfo: ProductInfo;
  /** 测量设备列表 */
  equipments: Equipment[];
  /** FAI测量项列表 */
  faiItems: FAIItem[];
  /** 夹具列表 */
  fixtures: Fixture[];
}

/**
 * 目录页页码统计
 */
export interface TOCPageCounts {
  /** 设备详情页结束页码 */
  equipmentEnd: number;
  /** 夹具列表页页码 */
  fixturePage: number;
  /** BOM列表页页码 */
  bomPage: number;
  /** 测量详情页起始页码 */
  detailsStart: number;
  /** 测量详情页结束页码 */
  detailsEnd: number;
}

/**
 * PPT生成选项
 */
export interface PPTGenerateOptions {
  /** 是否包含修订历史页 */
  includeHistory?: boolean;
  /** 模板路径（可选） */
  template?: string;
  /** 输出文件名（可选，默认自动生成） */
  outputFilename?: string;
}

/**
 * PPT生成数据（包含产品和FAI数据）
 */
export interface PPTGenerationData {
  /** 产品基本信息 */
  productInfo: Partial<ProductInfo>;  // 改为 Partial，支持部分字段
  /** 测量设备列表 */
  equipments: Equipment[];
  /** FAI测量项列表 */
  faiItems: FAIItem[];
  /** 夹具列表 */
  fixtures: Fixture[];
  /** 修订历史（混合方案使用） */
  revisionHistory?: RevisionHistory[];
  /** BOM列表（混合方案使用） */
  bom?: BOMItem[];
}
