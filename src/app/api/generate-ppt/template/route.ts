/**
 * @file route.ts
 * @desc POST /api/generate-ppt/template - 基于模板生成PPT（混合方案）
 * @input 依赖: pptx-automizer, Python后端API
 * @output 导出: PPTX文件下载
 * @see PRD: docs/PRD.md#F013
 * @see docs/HYBRID_SOLUTION.md
 */

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { generatePPTFromTemplate } from '@/lib/services/ppt-template-generator';
import type { PPTGenerationData } from '@/lib/types/ppt';

/**
 * 基于模板生成PPT文件（混合方案）
 * POST /api/generate-ppt/template
 *
 * 请求体:
 * - productInfo: ProductInfo - 产品基本信息
 * - equipments: Equipment[] - 测量设备列表
 * - faiItems: FAIItem[] - FAI测量项列表
 * - fixtures: Fixture[] - 夹具列表
 * - revisionHistory?: RevisionHistory[] - 修订历史（可选）
 * - bom?: BOMItem[] - BOM列表（可选）
 * - options?: PPTGenerateOptions - 生成选项（可选）
 *
 * 响应:
 * - downloadUrl: string - 下载链接
 * - filename: string - 文件名
 * - pageCount: number - 页数
 * - message: string - 提示信息
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 解析请求数据
    const body = await request.json();
    const {
      productInfo,
      equipments = [],
      faiItems = [],
      fixtures = [],
      revisionHistory,
      bom,
      options = {}
    }: PPTGenerationData & { options?: { template?: string; outputFilename?: string } } = body;

    // 验证必填字段
    if (!productInfo || !productInfo.projectName) {
      return NextResponse.json(
        { error: '缺少必填字段：productInfo.projectName' },
        { status: 400 }
      );
    }

    console.log(`[generate-ppt/template] 开始生成PPT（混合方案）: ${productInfo.projectName}`);

    // 2. 构建生成数据
    const data: PPTGenerationData = {
      productInfo,
      equipments,
      faiItems,
      fixtures,
      revisionHistory,
      bom,
    };

    // 3. 确定模板路径（可自定义，否则使用默认）
    const templateName = options.template || 'mtd_template.pptx';
    const templatePath = path.join(process.cwd(), 'public', 'templates', templateName);

    // 检查模板文件是否存在
    const fs = await import('fs/promises');
    try {
      await fs.access(templatePath);
    } catch {
      return NextResponse.json(
        { error: '模板文件不存在', template: templateName },
        { status: 404 }
      );
    }

    // 4. 生成输出文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = options.outputFilename ||
      `${productInfo.projectName}_${productInfo.partNumber || 'N/A'}_${timestamp}.pptx`;
    const outputPath = path.join(process.cwd(), 'public', 'downloads', filename);

    // 5. 调用混合方案生成PPT
    console.log(`[generate-ppt/template] 模板: ${templateName}`);
    console.log(`[generate-ppt/template] 输出: ${filename}`);

    await generatePPTFromTemplate(data, templatePath, outputPath);

    // 6. 计算页数（简化计算）
    let pageCount = 2; // 封面 + 目录
    if (revisionHistory && revisionHistory.length > 0) pageCount += 1; // 修订历史
    pageCount += equipments.length; // 设备页
    if (fixtures.length > 0) pageCount += 1; // 夹具列表
    if (bom && bom.length > 0) pageCount += 1; // BOM列表
    pageCount += 1; // FAI汇总表
    pageCount += faiItems.length; // FAI详情页

    console.log(`[generate-ppt/template] ✅ PPT生成成功，共 ${pageCount} 页`);

    // 7. 返回下载信息
    return NextResponse.json({
      downloadUrl: `/downloads/${filename}`,
      filename,
      pageCount,
      message: 'PPT生成成功（使用模板方案）',
      method: 'template', // 标识使用的方案
    });

  } catch (error: any) {
    console.error(`[generate-ppt/template] ❌ 错误: ${error.message}`);
    console.error(error.stack);

    // 提供详细的错误信息
    let errorMessage = 'PPT生成失败';
    let errorDetails = error.message;

    // 特殊错误处理
    if (error.message?.includes('ECONNREFUSED')) {
      errorMessage = '无法连接到Python后端';
      errorDetails = '请确保Python后端正在运行 (http://127.0.0.1:8001)';
    } else if (error.message?.includes('Template not found')) {
      errorMessage = '模板文件未找到';
      errorDetails = '请检查模板文件是否存在';
    } else if (error.message?.includes('表格填充失败')) {
      errorMessage = '表格数据填充失败';
      errorDetails = '请检查表格数据格式是否正确';
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
        hint: '详细日志请查看服务器控制台'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/generate-ppt/template - 获取方案信息
 */
export async function GET() {
  return NextResponse.json({
    method: 'template',
    description: '基于模板生成PPT（混合方案：pptx-automizer + Python python-pptx）',
    features: [
      '✅ 完美保留模板样式',
      '✅ 支持文本替换',
      '✅ 支持表格填充',
      '✅ 支持幻灯片复制',
      '✅ 动态页面数量',
    ],
    requirements: {
      pythonBackend: 'http://127.0.0.1:8001',
      templateFile: 'public/templates/mtd_template.pptx',
    },
    usage: {
      endpoint: '/api/generate-ppt/template',
      method: 'POST',
      body: {
        productInfo: 'ProjectInfo',
        equipments: 'Equipment[]',
        fixtures: 'Fixture[]',
        faiItems: 'FAIItem[]',
        revisionHistory: 'RevisionHistory[] (optional)',
        bom: 'BOMItem[] (optional)',
        options: 'PPTGenerateOptions (optional)',
      },
    },
    documentation: '/docs/HYBRID_SOLUTION.md',
  });
}
