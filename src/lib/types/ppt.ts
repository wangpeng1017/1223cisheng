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
  manufacturer: string;
  /** 型号 */
  model: string;
  /** 测量范围（可选） */
  range?: string;
  /** 精度（可选） */
  accuracy?: string;
  /** 其他技术参数（可选） */
  specifications?: Record<string, string>;
}

/**
 * 测量夹具信息
 */
export interface Fixture {
  /** 夹具编号 */
  no: string;
  /** 尺寸 */
  size: string;
  /** 材质 */
  material: string;
  /** 图片（可选） */
  pic?: string;
  /** 备注（可选） */
  remark?: string;
}

/**
 * FAI测量项信息
 */
export interface FAIItem {
  /** FAI编号 */
  faiNum: number;
  /** SPC编号（可选） */
  spcCode?: string;
  /** 分类，如：厚度、宽度、角度等 */
  category: string;
  /** 规格值，如：3*2.00±0.10 */
  specification: string;
  /** 描述，如：Thickness */
  description: string;
  /** 测量方法，如：HG、Keyence */
  method: string;
  /** 夹具编号（可选） */
  fixture?: string;
  /** 测量状态：Free 或 Constrained */
  status: string;
  /** 测量步骤（数组） */
  procedure: string[];
  /** 使用的设备（可选） */
  equipment?: Equipment;
  /** 测量示意图路径（可选） */
  images?: string[];
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
export interface PPTGenerationData extends FAIExtractResult {
  /** 产品基本信息 */
  productInfo: ProductInfo;
  /** 测量设备列表 */
  equipments: Equipment[];
  /** FAI测量项列表 */
  faiItems: FAIItem[];
  /** 夹具列表 */
  fixtures: Fixture[];
}
