/**
 * @file route.ts
 * @desc GET /api/serve-file/[...path] - 提供上传文件的访问服务
 * 解决 Next.js standalone 模式下 public 目录新增文件无法访问的问题
 */

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path: segments } = await params;
        const filePath = segments.join('/');

        // 安全限制：只允许访问 public/downloads 目录下的文件
        const safePath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
        const fullPath = path.join(process.cwd(), 'public', 'downloads', safePath);

        // 确保路径仍在 downloads 目录内（防止路径穿越）
        const downloadsDir = path.join(process.cwd(), 'public', 'downloads');
        if (!fullPath.startsWith(downloadsDir)) {
            return NextResponse.json({ error: '禁止访问' }, { status: 403 });
        }

        // 检查文件是否存在
        try {
            await fs.access(fullPath);
        } catch {
            return NextResponse.json({ error: '文件不存在' }, { status: 404 });
        }

        // 读取并返回文件
        const fileBuffer = await fs.readFile(fullPath);
        const ext = path.extname(fullPath).toLowerCase();

        const mimeTypes: Record<string, string> = {
            '.pdf': 'application/pdf',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        };

        const contentType = mimeTypes[ext] || 'application/octet-stream';

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Content-Length': fileBuffer.length.toString(),
                'Cache-Control': 'public, max-age=3600',
            },
        });
    } catch (error: any) {
        console.error('文件服务错误:', error);
        return NextResponse.json({ error: '服务器错误' }, { status: 500 });
    }
}
