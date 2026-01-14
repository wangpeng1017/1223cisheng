/**
 * @file route.ts
 * @desc POST /api/generate-ppt - 根据FAI数据生成PPT文件
 * @input 依赖: pptxgenjs, FAI数据
 * @output 导出: PPTX文件下载
 * @see PRD: docs/PRD.md#F013
 */

import { NextRequest, NextResponse } from 'next/server';
import PptxGenJS from 'pptxgenjs';
import path from 'path';
import fs from 'fs/promises';
import type { FAIExtractResult, PPTGenerateOptions } from '@/lib/types/ppt';
import { PPT_STYLES } from '@/lib/config/ppt-styles';

/**
 * 生成PPT文件
 * POST /api/generate-ppt
 *
 * @request
 * - productInfo: ProductInfo - 产品基本信息
 * - equipments: Equipment[] - 测量设备列表
 * - faiItems: FAIItem[] - FAI测量项列表
 * - fixtures: Fixture[] - 夹具列表
 * - options?: PPTGenerateOptions - 生成选项
 *
 * @response
 * - downloadUrl: string - 下载链接
 * - filename: string - 文件名
 * - pageCount: number - 页数
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 解析请求数据
    const body = await request.json();
    const { productInfo, equipments, faiItems, fixtures, options = {} }: FAIExtractResult & { options?: PPTGenerateOptions } = body;

    // 验证必填字段
    if (!productInfo || !faiItems) {
      return NextResponse.json(
        { error: '缺少必填字段：productInfo, faiItems' },
        { status: 400 }
      );
    }

    console.log(`[generate-ppt] 开始生成PPT: ${productInfo.projectName}`);

    // 2. 初始化PPT
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';

    // 3. 生成封面页
    generateCoverPage(pptx, productInfo);

    // 4. 生成目录页
    const pageCounts = calculatePageCounts(equipments?.length || 0, faiItems.length);
    generateTOC(pptx, productInfo, pageCounts);

    // 5. 生成修订历史页（可选）
    if (options.includeHistory) {
      generateHistoryPage(pptx, productInfo);
    }

    // 6. 生成设备详情页
    if (equipments && equipments.length > 0) {
      equipments.forEach(eq => generateEquipmentPage(pptx, productInfo, eq));
    }

    // 7. 生成夹具列表页
    if (fixtures && fixtures.length > 0) {
      generateFixtureListPage(pptx, productInfo, fixtures);
    }

    // 8. 生成BOM列表页（占位）
    generateBOMListPage(pptx, productInfo);

    // 9. 生成FAI/SPC汇总表
    generateFAISummaryTable(pptx, productInfo, faiItems);

    // 10. 生成各测量项详情页
    faiItems.forEach(item => generateFAIDetailPage(pptx, item));

    // 11. 保存PPT文件
    const outputDir = path.join(process.cwd(), 'public', 'downloads');
    await fs.mkdir(outputDir, { recursive: true });

    // 生成文件名
    const filename = options.outputFilename ||
      `${productInfo.projectName}_${productInfo.partNumber}_${productInfo.date.replace(/\//g, '-')}.pptx`;
    const outputPath = path.join(outputDir, filename);

    await pptx.writeFile({ fileName: outputPath });

    console.log(`[generate-ppt] PPT已生成: ${outputPath}`);

    // 12. 返回下载信息
    // PptxGenJS没有公开slides属性，我们通过计数来获取页数
    const pageCount = 1 + 1 + (options.includeHistory ? 1 : 0) + // 封面+目录+历史
                     (equipments?.length || 0) + // 设备页
                     (fixtures?.length > 0 ? 1 : 0) + // 夹具页
                     1 + // BOM页
                     1 + // FAI汇总表
                     faiItems.length; // 测量项详情页

    return NextResponse.json({
      downloadUrl: `/downloads/${filename}`,
      filename,
      pageCount,
      message: 'PPT生成成功',
    });

  } catch (error: any) {
    console.error(`[generate-ppt] 错误: ${error.message}`);
    return NextResponse.json(
      { error: 'PPT生成失败', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * 生成封面页
 */
function generateCoverPage(pptx: PptxGenJS, info: any): void {
  const slide = pptx.addSlide();

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
    color: '000000',
    lineSpacing: 32,
  });

  console.log('  ✓ 封面页生成完成');
}

/**
 * 生成目录页
 */
function generateTOC(pptx: PptxGenJS, productInfo: any, pageCounts: any): void {
  const slide = pptx.addSlide();

  const content = [
    `Cover sheet              Page 1`,
    `Content                  Page 2`,
    `history List             Page 3`,
    `Measurement Equipment    Page 4-${pageCounts.equipmentEnd}`,
    `Measurement Fixture List Page ${pageCounts.fixturePage}`,
    `Bom List                 Page ${pageCounts.bomPage}`,
    `Details for Each Measurement Page ${pageCounts.detailsStart}-${pageCounts.detailsEnd}`,
  ].join('\n');

  slide.addText(content, {
    x: PPT_STYLES.toc.position.x,
    y: PPT_STYLES.toc.position.y,
    fontSize: PPT_STYLES.toc.fontSize,
    fontFace: PPT_STYLES.toc.fontFace,
    color: '000000',
    lineSpacing: PPT_STYLES.toc.lineSpacing,
  });

  console.log('  ✓ 目录页生成完成');
}

/**
 * 生成修订历史页
 */
function generateHistoryPage(pptx: PptxGenJS, productInfo: any): void {
  const slide = pptx.addSlide();

  slide.addText('MTD | Revision History List', {
    x: '10%', y: '5%',
    fontSize: 18,
    fontFace: 'Arial',
    bold: true,
    color: '000000',
  });

  // 表格
  const headers = ['APNs', 'Rev', 'Update', 'Description of Revision'];
  const tableData = [
    [productInfo.partNumber, productInfo.revision, new Date().toISOString().split('T')[0], 'Initial release']
  ];

  slide.addTable([headers, ...tableData], {
    x: '15%', y: '20%',
    w: '70%',
    fontSize: 12,
    fontFace: 'Arial',
    border: { pt: 1, color: 'CCCCCC' },
  });

  console.log('  ✓ 修订历史页生成完成');
}

/**
 * 生成设备详情页
 */
function generateEquipmentPage(pptx: PptxGenJS, productInfo: any, equipment: any): void {
  const slide = pptx.addSlide();

  // 标题
  slide.addText(`MTD | ${productInfo.projectName} | Measurement Equipment Details`, {
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

  console.log(`  ✓ 设备详情页生成完成: ${equipment.name}`);
}

/**
 * 生成夹具列表页
 */
function generateFixtureListPage(pptx: PptxGenJS, productInfo: any, fixtures: any[]): void {
  const slide = pptx.addSlide();

  slide.addText(`MTD | ${productInfo.projectName} | Measurement Fixture List`, {
    x: '5%', y: '3%',
    fontSize: 18,
    fontFace: 'Arial',
    bold: true,
    color: '000000',
  });

  const headers = [
    { text: 'Fixture No', options: { fontSize: 11, bold: true } },
    { text: 'Size', options: { fontSize: 11, bold: true } },
    { text: 'Material', options: { fontSize: 11, bold: true } },
    { text: 'Pic', options: { fontSize: 11, bold: true } },
    { text: 'Remark', options: { fontSize: 11, bold: true } },
  ];

  const tableData = fixtures.map(f => [
    f.no || '',
    f.size || '',
    f.material || '',
    f.pic || '',
    f.remark || '',
  ]);

  slide.addTable([headers, ...tableData], {
    x: '5%', y: '12%',
    w: '90%',
    fontSize: 10,
    fontFace: 'Arial',
    border: { pt: 1, color: 'CCCCCC' },
    colW: [1.2, 1.5, 1.5, 1.0, 1.5],
  });

  console.log('  ✓ 夹具列表页生成完成');
}

/**
 * 生成BOM列表页
 */
function generateBOMListPage(pptx: PptxGenJS, productInfo: any): void {
  const slide = pptx.addSlide();

  slide.addText(`MTD | ${productInfo.projectName} | BOM List`, {
    x: '10%', y: '5%',
    fontSize: 18,
    fontFace: 'Arial',
    bold: true,
    color: '000000',
  });

  slide.addText('BOM list information...', {
    x: '15%', y: '25%',
    fontSize: 12,
    fontFace: 'Arial',
    color: '666666',
  });

  console.log('  ✓ BOM列表页生成完成');
}

/**
 * 生成FAI/SPC汇总表
 */
function generateFAISummaryTable(pptx: PptxGenJS, productInfo: any, faiItems: any[]): void {
  const slide = pptx.addSlide();

  // 标题
  slide.addText(`MTD | ${productInfo.projectName} | Metrology Details`, {
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
    item.faiNum?.toString() || '',
    item.spcCode || '',
    item.specification || '',
    item.description || '',
    item.method || '',
    item.fixture || '',
    'No',
    'Guo Teng',
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

  console.log('  ✓ FAI/SPC汇总表生成完成');
}

/**
 * 生成测量项详情页
 */
function generateFAIDetailPage(pptx: PptxGenJS, item: any): void {
  const slide = pptx.addSlide();

  // 标题
  slide.addText(`${item.category || ''} ${item.description || ''}`, {
    x: '10%', y: '5%',
    fontSize: PPT_STYLES.content.titleFontSize,
    fontFace: PPT_STYLES.content.fontFace,
    bold: true,
    color: '000000',
  });

  // FAI/SPC信息
  const faiInfo = `FAI ${item.faiNum}${item.spcCode ? `/SPC ${item.spcCode}` : ''}: ${item.specification || ''} CPK`;
  slide.addText(faiInfo, {
    x: '10%', y: '15%',
    fontSize: PPT_STYLES.content.subTitleFontSize,
    fontFace: PPT_STYLES.content.fontFace,
    color: '000000',
  });

  // 测量信息
  const details = [
    `1. Measurement Method：${item.method || '/'}`,
    `2. Fixture：${item.fixture || '/'}`,
    `3. Measurement status：${item.status || 'Free'}`,
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
  if (item.procedure && item.procedure.length > 0) {
    const procedure = item.procedure.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n');
    slide.addText(procedure, {
      x: '10%', y: '45%',
      fontSize: PPT_STYLES.content.procedureFontSize,
      fontFace: PPT_STYLES.content.fontFace,
      color: '000000',
      lineSpacing: 24,
    });
  }

  // 占位图片区域
  slide.addShape(pptx.ShapeType.rect, {
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

  console.log(`  ✓ 测量项详情页生成完成: ${item.description}`);
}

/**
 * 计算页码
 */
function calculatePageCounts(equipmentCount: number, faiItemCount: number): any {
  return {
    equipmentEnd: 3 + equipmentCount,
    fixturePage: 3 + equipmentCount + 1,
    bomPage: 3 + equipmentCount + 2,
    detailsStart: 3 + equipmentCount + 4,
    detailsEnd: 3 + equipmentCount + 3 + faiItemCount,
  };
}
