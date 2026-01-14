/**
 * @file route.ts
 * @desc 模板管理API - 上传、列表、删除PPT模板
 * @input 依赖: multer, fs, path
 * @output 导出: JSON格式的模板列表
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readdir, unlink, stat } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

// 模板存储目录
const TEMPLATES_DIR = path.join(process.cwd(), 'public', 'templates');

// 确保模板目录存在
async function ensureTemplatesDir() {
  if (!existsSync(TEMPLATES_DIR)) {
    await mkdir(TEMPLATES_DIR, { recursive: true });
  }
}

/**
 * GET /api/ppt/templates - 获取模板列表
 */
export async function GET() {
  try {
    await ensureTemplatesDir();

    const files = await readdir(TEMPLATES_DIR);
    const templates = [];

    for (const file of files) {
      if (file.endsWith('.pptx')) {
        const filePath = path.join(TEMPLATES_DIR, file);
        const stats = await stat(filePath);

        templates.push({
          id: file.replace('.pptx', ''),
          name: file.replace('.pptx', ''),
          filename: file,
          size: stats.size,
          createdAt: stats.birthtime,
          url: `/templates/${file}`,
          thumbnailUrl: `/templates/thumbnails/${file.replace('.pptx', '.png')}`,
        });
      }
    }

    // 按创建时间倒序排列
    templates.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json(templates);
  } catch (error: any) {
    console.error('[templates] 获取模板列表失败:', error);
    return NextResponse.json(
      { error: '获取模板列表失败', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ppt/templates - 上传新模板
 */
export async function POST(request: NextRequest) {
  try {
    await ensureTemplatesDir();

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: '未找到文件' },
        { status: 400 }
      );
    }

    // 验证文件类型
    if (!file.name.endsWith('.pptx')) {
      return NextResponse.json(
        { error: '只支持PPTX格式文件' },
        { status: 400 }
      );
    }

    // 保存文件
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name;
    const filepath = path.join(TEMPLATES_DIR, filename);

    await writeFile(filepath, buffer);

    // TODO: 生成缩略图（需要额外的库支持）

    return NextResponse.json({
      message: '模板上传成功',
      template: {
        id: filename.replace('.pptx', ''),
        name: filename.replace('.pptx', ''),
        filename,
        url: `/templates/${filename}`,
      },
    });
  } catch (error: any) {
    console.error('[templates] 上传模板失败:', error);
    return NextResponse.json(
      { error: '上传模板失败', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ppt/templates - 删除模板
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: '缺少模板ID' },
        { status: 400 }
      );
    }

    const filepath = path.join(TEMPLATES_DIR, `${id}.pptx`);

    if (!existsSync(filepath)) {
      return NextResponse.json(
        { error: '模板不存在' },
        { status: 404 }
      );
    }

    await unlink(filepath);

    // 同时删除缩略图（如果存在）
    const thumbnailPath = path.join(TEMPLATES_DIR, 'thumbnails', `${id}.png`);
    if (existsSync(thumbnailPath)) {
      await unlink(thumbnailPath);
    }

    return NextResponse.json({ message: '模板删除成功' });
  } catch (error: any) {
    console.error('[templates] 删除模板失败:', error);
    return NextResponse.json(
      { error: '删除模板失败', details: error.message },
      { status: 500 }
    );
  }
}
