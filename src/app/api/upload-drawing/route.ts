/**
 * @file route.ts
 * @desc POST /api/upload-drawing - 上传图纸 PDF 文件
 */

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: '未选择文件' }, { status: 400 });
        }

        // 验证文件类型
        if (!file.name.endsWith('.pdf')) {
            return NextResponse.json({ error: '仅支持 PDF 格式' }, { status: 400 });
        }

        // 保存到 public/downloads 目录
        const outputDir = path.join(process.cwd(), 'public', 'downloads');
        await fs.mkdir(outputDir, { recursive: true });

        const fileName = `drawing-${Date.now()}.pdf`;
        const outputPath = path.join(outputDir, fileName);

        const buffer = Buffer.from(await file.arrayBuffer());
        await fs.writeFile(outputPath, buffer);

        return NextResponse.json({
            success: true,
            url: `/api/serve-file/${fileName}`,
            originalName: file.name,
            size: file.size,
        });
    } catch (error: any) {
        console.error('上传图纸错误:', error);
        return NextResponse.json(
            { error: `上传失败: ${error.message}` },
            { status: 500 }
        );
    }
}
