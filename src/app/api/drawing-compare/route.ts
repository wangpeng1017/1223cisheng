/**
 * @file route.ts
 * @desc POST /api/drawing-compare - Upload 2D PDF + 3D STP, compare dimensions
 */

import { NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs/promises"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const pdf = formData.get("pdf") as File | null
        const stp = formData.get("stp") as File | null

        if (!pdf || !stp) {
            return NextResponse.json(
                { error: "请同时上传 2D PDF 和 3D STP 文件" },
                { status: 400 }
            )
        }

        if (!pdf.name.toLowerCase().endsWith(".pdf")) {
            return NextResponse.json({ error: "2D 文件必须是 PDF 格式" }, { status: 400 })
        }

        const stpName = stp.name.toLowerCase()
        if (!stpName.endsWith(".stp") && !stpName.endsWith(".step")) {
            return NextResponse.json({ error: "3D 文件必须是 STP/STEP 格式" }, { status: 400 })
        }

        // Save uploaded files to temp directory
        const tmpDir = path.join(process.cwd(), "tmp", `compare-${Date.now()}`)
        await fs.mkdir(tmpDir, { recursive: true })

        const pdfPath = path.join(tmpDir, pdf.name)
        const stpPath = path.join(tmpDir, stp.name)

        const pdfBuffer = Buffer.from(await pdf.arrayBuffer())
        const stpBuffer = Buffer.from(await stp.arrayBuffer())

        await fs.writeFile(pdfPath, pdfBuffer)
        await fs.writeFile(stpPath, stpBuffer)

        // Also save to public/downloads for later reference
        const dlDir = path.join(process.cwd(), "public", "downloads")
        await fs.mkdir(dlDir, { recursive: true })
        const ts = Date.now()
        const savedPdf = `drawing-2d-${ts}.pdf`
        const savedStp = `drawing-3d-${ts}.stp`
        await fs.writeFile(path.join(dlDir, savedPdf), pdfBuffer)
        await fs.writeFile(path.join(dlDir, savedStp), stpBuffer)

        // Run Python comparison script
        const scriptPath = path.join(process.cwd(), "scripts", "compare_2d_3d.py")
        const tolerance = formData.get("tolerance") || "0.1"

        try {
            const { stdout, stderr } = await execAsync(
                `python3 "${scriptPath}" --pdf "${pdfPath}" --stp "${stpPath}" --tolerance ${tolerance}`,
                { timeout: 30000, maxBuffer: 10 * 1024 * 1024 }
            )

            const result = JSON.parse(stdout)

            // Clean up temp files
            await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})

            return NextResponse.json({
                ...result,
                files: {
                    pdf: pdf.name,
                    stp: stp.name,
                    pdf_url: `/api/serve-file/${savedPdf}`,
                    stp_url: `/api/serve-file/${savedStp}`,
                },
            })
        } catch (execError: any) {
            // Clean up temp files
            await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})

            console.error("Python comparison error:", execError)
            return NextResponse.json(
                {
                    error: "对比分析失败",
                    detail: execError.stderr || execError.message,
                },
                { status: 500 }
            )
        }
    } catch (error: any) {
        console.error("Drawing compare error:", error)
        return NextResponse.json(
            { error: `处理失败: ${error.message}` },
            { status: 500 }
        )
    }
}
