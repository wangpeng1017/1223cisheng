/**
 * @file test-ppt-gen.ts
 * @desc PPT生成Demo - 验证PptxGenJS技术可行性
 * @input 依赖: pptxgenjs, src/lib/types/ppt.ts, src/lib/config/ppt-styles.ts
 * @output 导出: test-output.pptx
 * @see DEV-PLAN: docs/DEV-PLAN.md#任务-1.2
 */

import PptxGenJS from 'pptxgenjs';
import type { ProductInfo, FAIItem, Equipment } from '../types/ppt';
import { PPT_STYLES } from '../config/ppt-styles';

/**
 * PPT生成Demo类
 */
class PPTGeneratorDemo {
  private pptx: PptxGenJS;

  constructor() {
    // 初始化PPT，设置尺寸为16:9
    this.pptx = new PptxGenJS();
    this.pptx.layout = 'LAYOUT_16x9';
    console.log('✓ PPT初始化成功');
  }

  /**
   * 生成封面页
   * 参考文档: docs/PRD.md#F004
   */
  generateCoverPage(info: ProductInfo): void {
    const slide = this.pptx.addSlide();

    // 标题
    slide.addText('Metrology Design', {
      x: '46%', y: '40%',
      fontSize: PPT_STYLES.cover.titleFontSize,
      fontFace: PPT_STYLES.cover.fontFace,
      bold: PPT_STYLES.cover.bold,
      color: '000000',
    });

    // 产品信息
    const infoText = [
      { text: `Project Name: `, options: { bold: false } },
      { text: info.projectName, options: { bold: true } },
      { text: '\nPart Number & Rev：', options: { bold: false } },
      { text: `${info.partNumber}-${info.revision}`, options: { bold: true } },
      { text: '\nVendor：', options: { bold: false } },
      { text: info.vendor, options: { bold: true } },
      { text: '\nDate：', options: { bold: false } },
      { text: info.date, options: { bold: true } },
    ];

    slide.addText(infoText, {
      x: '55%', y: '55%',
      fontSize: PPT_STYLES.cover.infoFontSize,
      fontFace: PPT_STYLES.cover.fontFace,
      bold: false,
      color: '000000',
      lineSpacing: 32,
    });

    console.log('✓ 封面页生成完成');
  }

  /**
   * 生成目录页
   */
  generateTOC(): void {
    const slide = this.pptx.addSlide();

    const content = [
      'Cover sheet              Page 1',
      'Content                  Page 2',
      'history List             Page 3',
      'Measurement Equipment    Page 4-9',
      'Measurement Fixture List Page 10',
      'Bom List                 Page 11',
      'Details for Each Measurement Page 12-22',
    ].join('\n');

    slide.addText(content, {
      x: PPT_STYLES.toc.position.x,
      y: PPT_STYLES.toc.position.y,
      fontSize: PPT_STYLES.toc.fontSize,
      fontFace: PPT_STYLES.toc.fontFace,
      color: '000000',
      lineSpacing: PPT_STYLES.toc.lineSpacing,
    });

    console.log('✓ 目录页生成完成');
  }

  /**
   * 生成设备详情页（示例）
   */
  generateEquipmentPage(equipment: Equipment): void {
    const slide = this.pptx.addSlide();

    // 标题
    slide.addText(`MTD | J510 | Measurement Equipment Details`, {
      x: '10%', y: '5%',
      fontSize: 18,
      fontFace: 'Arial',
      bold: true,
      color: '000000',
    });

    // 设备信息
    const content = [
      { text: `Name: `, options: { bold: true } },
      { text: equipment.name, options: { bold: false } },
      { text: '\nManufacturer: ', options: { bold: true } },
      { text: equipment.manufacturer, options: { bold: false } },
      { text: '\nModel: ', options: { bold: true } },
      { text: equipment.model, options: { bold: false } },
    ];

    if (equipment.range) {
      content.push(
        { text: '\nRange: ', options: { bold: true } },
        { text: equipment.range, options: { bold: false } }
      );
    }

    if (equipment.accuracy) {
      content.push(
        { text: '\nAccuracy: ', options: { bold: true } },
        { text: equipment.accuracy, options: { bold: false } }
      );
    }

    slide.addText(content, {
      x: PPT_STYLES.equipment.position.x,
      y: PPT_STYLES.equipment.position.y,
      fontSize: PPT_STYLES.equipment.fontSize,
      fontFace: PPT_STYLES.equipment.fontFace,
      color: '000000',
      lineSpacing: PPT_STYLES.equipment.lineSpacing,
    });

    console.log(`✓ 设备详情页生成完成: ${equipment.name}`);
  }

  /**
   * 生成FAI/SPC汇总表
   */
  generateFAISummaryTable(faiItems: FAIItem[]): void {
    const slide = this.pptx.addSlide();

    // 标题
    slide.addText('MTD | J510 | Metrology Details', {
      x: '5%', y: '3%',
      fontSize: 18,
      fontFace: 'Arial',
      bold: true,
      color: '000000',
    });

    // 表头
    const headers = [
      { text: 'FAI', options: { fontSize: 11, bold: true } },
      { text: 'SPC', options: { fontSize: 11, bold: true } },
      { text: 'Specification', options: { fontSize: 11, bold: true } },
      { text: 'Description', options: { fontSize: 11, bold: true } },
      { text: 'Method', options: { fontSize: 11, bold: true } },
      { text: 'Fixture', options: { fontSize: 11, bold: true } },
      { text: 'In-Process', options: { fontSize: 11, bold: true } },
      { text: 'Cross check', options: { fontSize: 11, bold: true } },
    ];

    // 表格数据
    const tableData = faiItems.map(item => [
      { text: item.faiNum.toString(), options: { fontSize: 10 } },
      { text: item.spcCode || '', options: { fontSize: 10 } },
      { text: item.specification, options: { fontSize: 10 } },
      { text: item.description, options: { fontSize: 10 } },
      { text: item.method, options: { fontSize: 10 } },
      { text: item.fixture || '', options: { fontSize: 10 } },
      { text: 'No', options: { fontSize: 10 } },
      { text: 'Guo Teng', options: { fontSize: 10 } },
    ]);

    // 添加表格
    slide.addTable([headers, ...tableData], {
      x: '5%', y: '12%',
      w: '90%',
      h: '75%',
      fontSize: PPT_STYLES.table.bodyFontSize,
      fontFace: PPT_STYLES.table.fontFace,
      border: { pt: PPT_STYLES.table.borderPt, color: PPT_STYLES.table.borderColor },
      colW: [0.8, 0.8, 1.5, 1.5, 1.2, 1.0, 1.0, 1.2],
    });

    console.log('✓ FAI/SPC汇总表生成完成');
  }

  /**
   * 生成测量项详情页（示例）
   */
  generateFAIDetailPage(item: FAIItem): void {
    const slide = this.pptx.addSlide();

    // 标题
    slide.addText(`${item.category} ${item.description}`, {
      x: '10%', y: '5%',
      fontSize: PPT_STYLES.content.titleFontSize,
      fontFace: PPT_STYLES.content.fontFace,
      bold: true,
      color: '000000',
    });

    // FAI/SPC信息
    const faiInfo = `FAI ${item.faiNum}${item.spcCode ? `/SPC ${item.spcCode}` : ''}: ${item.specification} CPK`;
    slide.addText(faiInfo, {
      x: '10%', y: '15%',
      fontSize: PPT_STYLES.content.subTitleFontSize,
      fontFace: PPT_STYLES.content.fontFace,
      color: '000000',
    });

    // 测量信息
    const details = [
      `1. Measurement Method：${item.method}`,
      `2. Fixture：${item.fixture || '/'}`,
      `3. Measurement status：${item.status}`,
      `4. Measurement procedure：`,
    ].join('\n');

    slide.addText(details, {
      x: '10%', y: '25%',
      fontSize: PPT_STYLES.content.bodyFontSize,
      fontFace: PPT_STYLES.content.fontFace,
      color: '000000',
      lineSpacing: 28,
    });

    // 测量步骤
    const procedure = item.procedure.map((p, i) => `${i + 1}. ${p}`).join('\n');
    slide.addText(procedure, {
      x: '10%', y: '45%',
      fontSize: PPT_STYLES.content.procedureFontSize,
      fontFace: PPT_STYLES.content.fontFace,
      color: '000000',
      lineSpacing: 24,
    });

    // 占位图片区域（灰色矩形）
    slide.addShape(this.pptx.ShapeType.rect, {
      x: '55%', y: '45%', w: '35%', h: '40%',
      fill: { color: 'EEEEEE' },
    });

    slide.addText('[测量示意图]', {
      x: '55%', y: '62%', w: '35%', h: '6%',
      fontSize: 14,
      fontFace: 'Arial',
      align: 'center',
      color: '666666',
    });

    console.log(`✓ 测量项详情页生成完成: ${item.description}`);
  }

  /**
   * 保存PPT文件
   */
  async save(filename: string): Promise<void> {
    await this.pptx.writeFile({ fileName: filename });
    console.log(`✓ PPT已保存: ${filename}`);
  }
}

/**
 * 主函数 - 运行Demo
 */
async function main() {
  console.log('========================================');
  console.log('PPT生成Demo - 技术验证');
  console.log('========================================\n');

  const generator = new PPTGeneratorDemo();

  // 1. 生成封面页
  const productInfo: ProductInfo = {
    projectName: 'J510',
    partNumber: '160-06631-01',
    revision: '01',
    vendor: 'MAGSOUND',
    date: '2025/01/14',
  };
  generator.generateCoverPage(productInfo);

  // 2. 生成目录页
  generator.generateTOC();

  // 3. 生成设备详情页（示例：KEYENCE设备）
  const equipment1: Equipment = {
    name: 'KEYENCE',
    manufacturer: 'KEYENCE',
    model: 'IM-7101',
    range: 'Φ100x200mm (Wide), Φ25x125mm (High)',
    accuracy: '±0.001mm',
  };
  generator.generateEquipmentPage(equipment1);

  // 4. 生成FAI/SPC汇总表（示例数据）
  const faiItems: FAIItem[] = [
    {
      faiNum: 1,
      spcCode: 'A',
      category: 'Mono Magnet',
      specification: '3*2.00±0.10',
      description: 'Thickness',
      method: 'HG',
      fixture: '',
      status: 'Free',
      procedure: [
        '将产品如下图平放大理石平台上',
        '将高度规测针在大理石平台上A1点归零',
        '测量产品厚度并记录数值',
      ],
    },
    {
      faiNum: 2,
      spcCode: 'B',
      category: 'Mono Magnet',
      specification: '3*2.85±0.10',
      description: 'Width',
      method: 'Keyence',
      fixture: '',
      status: 'Free',
      procedure: [
        '将磁钢大平面朝下摆放在测试平台上',
        '选择"线"功能，自动选取直线',
        '记录测量数值',
      ],
    },
    {
      faiNum: 3,
      spcCode: 'C',
      category: 'Mono Magnet',
      specification: '14.20±0.10',
      description: 'Length',
      method: 'Keyence',
      fixture: '',
      status: 'Free',
      procedure: [
        '将磁钢大平面朝下摆放在测试平台上',
        '选择"线"功能，自动选取直线',
        '记录测量数值',
      ],
    },
    {
      faiNum: 4,
      spcCode: 'D',
      category: 'Mono Magnet',
      specification: '2*30.96°±3.00°',
      description: 'Angle',
      method: 'Keyence',
      fixture: '',
      status: 'Free',
      procedure: [
        '将磁钢立面摆放在测试平台上',
        '选择"线"功能，自动选取直线L5/L6',
        '记录测量角度数值',
      ],
    },
  ];
  generator.generateFAISummaryTable(faiItems);

  // 5. 生成测量项详情页（第一个FAI项）
  generator.generateFAIDetailPage(faiItems[0]);

  // 保存PPT
  await generator.save('test-output.pptx');

  console.log('\n========================================');
  console.log('✓ Demo完成！请查看 test-output.pptx');
  console.log('========================================');
}

// 运行Demo
main().catch(console.error);
