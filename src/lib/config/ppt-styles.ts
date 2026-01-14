/**
 * @file ppt-styles.ts
 * @desc PPT生成样式配置（基于Apple MTD模板）
 * @input 依赖: 无
 * @output 导出: PPT_STYLES
 * @see TECH: docs/TECH.md#六、关键实现细节
 */

/**
 * PPT全局样式配置
 * 基于参考PPT J510的样式提取
 */
export const PPT_STYLES = {
  /**
   * 封面页样式
   */
  cover: {
    /** 标题字体大小 */
    titleFontSize: 24,
    /** 信息字体大小 */
    infoFontSize: 14,
    /** 字体名称 */
    fontFace: 'Arial',
    /** 是否加粗 */
    bold: true,
    /** 标题位置（百分比） */
    titlePosition: { x: '46%', y: '40%' },
    /** 信息位置（百分比） */
    infoPosition: { x: '55%', y: '55%' },
  },

  /**
   * 目录页样式
   */
  toc: {
    /** 字体大小 */
    fontSize: 18,
    /** 字体名称 */
    fontFace: 'Arial',
    /** 行间距 */
    lineSpacing: 36,
    /** 位置（百分比） */
    position: { x: '20%', y: '30%' },
  },

  /**
   * 表格样式
   */
  table: {
    /** 表头字体大小 */
    headerFontSize: 12,
    /** 表体字体大小 */
    bodyFontSize: 10,
    /** 字体名称 */
    fontFace: 'Arial',
    /** 边框颜色 */
    borderColor: 'CCCCCC',
    /** 表头背景色 */
    headerColor: '4472C4',
    /** 表头文字颜色 */
    headerFontColor: 'FFFFFF',
    /** 边框宽度（pt） */
    borderPt: 1,
  },

  /**
   * 内容页样式
   */
  content: {
    /** 标题字体大小 */
    titleFontSize: 18,
    /** 副标题字体大小 */
    subTitleFontSize: 14,
    /** 正文字体大小 */
    bodyFontSize: 12,
    /** 步骤说明字体大小 */
    procedureFontSize: 11,
    /** 字体名称 */
    fontFace: 'Arial',
    /** 标题位置 */
    titlePosition: { x: '10%', y: '5%' },
  },

  /**
   * 设备详情页样式
   */
  equipment: {
    /** 字体大小 */
    fontSize: 14,
    /** 行间距 */
    lineSpacing: 32,
    /** 位置 */
    position: { x: '15%', y: '25%' },
    /** 字体名称 */
    fontFace: 'Arial',
  },

  /**
   * 页面尺寸（标准16:9）
   */
  slideSize: {
    /** 宽度（英寸） */
    width: 10,
    /** 高度（英寸） */
    height: 5.625,
  },
} as const;

/**
 * PPT颜色主题（Apple风格）
 */
export const PPT_COLORS = {
  /** 主色调（蓝色） */
  primary: '4472C4',
  /** 辅助色（深灰） */
  secondary: '595959',
  /** 文字颜色（黑色） */
  text: '000000',
  /** 边框颜色（浅灰） */
  border: 'CCCCCC',
  /** 表头背景色 */
  headerBg: '4472C4',
  /** 表头文字色 */
  headerText: 'FFFFFF',
} as const;

/**
 * PPT布局常量（单位：英寸）
 * 基于10x5.625英寸的幻灯片尺寸
 */
export const PPT_LAYOUT = {
  /** 页边距 */
  margin: {
    left: 0.5,
    right: 0.5,
    top: 0.5,
    bottom: 0.5,
  },
  /** 内容区域宽度 */
  contentWidth: 9,
  /** 内容区域高度 */
  contentHeight: 4.625,
} as const;
