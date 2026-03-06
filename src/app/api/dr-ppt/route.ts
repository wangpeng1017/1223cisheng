/**
 * @file route.ts
 * @desc POST /api/dr-ppt - Generate DR PPT matching Apple supplier template exactly
 */

import { NextRequest, NextResponse } from 'next/server';
import PptxGenJS from 'pptxgenjs';
import path from 'path';
import fs from 'fs/promises';

interface DRIssue {
    seqNo: number;
    pptPage: string;
    faiSpc: string;
    category: string;
    description: string;
    drawingSpec: string;
    suggestion: string;
    pdOpinion: string;
    severity: 'critical' | 'major' | 'minor';
}

interface DRProjectInfo {
    projectName: string;
    productName: string;
    partNumber: string;
    customer: string;
    reviewer: string;
    reviewDate: string;
    drawingVersion: string;
}

// EMU to inches conversion (1 inch = 914400 EMU)
const emu = (val: number) => val / 914400;

// Template exact dimensions from parsed template
const SLIDE_W = emu(16256000); // 17.78 inches
const SLIDE_H = emu(9144000);  // 10.00 inches

// Summary table position & col widths (from template)
const SUMMARY_TABLE = {
    x: emu(192353),
    y: emu(1337433),
    w: emu(15848674),
    colW: [619348, 619348, 650871, 4148454, 1604372, 4346297, 3859983].map(emu),
};

// Detail page - Info table (4 rows x 2 cols)
const INFO_TABLE = {
    x: emu(505740),
    y: emu(1079500),
    w: emu(13650123),
    colW: [2709886, 10937060].map(emu),
};

// Detail page - PD table (1 row x 2 cols)
const PD_TABLE = {
    x: emu(10817225),
    y: emu(189441),
    w: emu(4932363),
    colW: [815014, 4117348].map(emu),
};

// Detail page - Comparison table (2 rows x 3 cols)
const COMPARE_TABLE = {
    x: emu(508000),
    y: emu(3266016),
    w: emu(15240000),
    colW: [5080000, 5080000, 5080000].map(emu),
};

// Colors
const C = {
    headerBg: '1F3864',    // Dark blue header
    headerText: 'FFFFFF',
    cellText: '000000',
    tableBorder: '8FAADC',
    lightBg: 'D6E4F0',
    white: 'FFFFFF',
    black: '000000',
    accent: '4472C4',
};

// Font settings matching template
const FONT_MAIN = 'Arial Unicode MS';
const FONT_HEADER = 'Helvetica Neue';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { projectInfo, issues } = body as {
            projectInfo: DRProjectInfo;
            issues: DRIssue[];
        };

        if (!projectInfo || !issues || issues.length === 0) {
            return NextResponse.json(
                { error: 'Missing project info or issues' },
                { status: 400 }
            );
        }

        const pptx = new PptxGenJS();
        pptx.defineLayout({ name: 'APPLE_WIDE', width: SLIDE_W, height: SLIDE_H });
        pptx.layout = 'APPLE_WIDE';

        // === Slide 1: Cover ===
        buildCoverSlide(pptx, projectInfo);

        // === For each issue: Summary + Detail slide pair ===
        for (let i = 0; i < issues.length; i++) {
            buildSummarySlide(pptx, projectInfo, issues[i], i);
            buildDetailSlide(pptx, projectInfo, issues[i], i);
        }

        // Save
        const fileName = `DR_${projectInfo.partNumber.replace(/[\/\\]/g, '_')}_${projectInfo.reviewDate.replace(/\//g, '')}.pptx`;
        const outputDir = path.join(process.cwd(), 'public', 'generated');
        await fs.mkdir(outputDir, { recursive: true });
        const outputPath = path.join(outputDir, fileName);

        const buffer = await pptx.write({ outputType: 'nodebuffer' }) as Buffer;
        await fs.writeFile(outputPath, buffer);

        return NextResponse.json({
            success: true,
            downloadUrl: `/generated/${fileName}`,
            filename: fileName,
            pageCount: 1 + issues.length * 2,
        });
    } catch (error: any) {
        console.error('DR PPT generation error:', error);
        return NextResponse.json(
            { error: `Generation failed: ${error.message}` },
            { status: 500 }
        );
    }
}

// ============================================================
// Slide 1: Cover (Title & Subtitle layout)
// ============================================================
function buildCoverSlide(pptx: PptxGenJS, info: DRProjectInfo) {
    const slide = pptx.addSlide();
    slide.background = { color: C.white };

    // Main title - positioned like template placeholder
    slide.addText(`${info.projectName} Drawing Review_${info.productName}`, {
        x: emu(711200),
        y: emu(1244600),
        w: emu(14833600),
        h: emu(2971800),
        fontSize: 36,
        fontFace: FONT_HEADER,
        color: C.headerBg,
        bold: true,
        valign: 'middle',
    });

    // Subtitle: Company | Date
    slide.addText(`Magsound | ${info.reviewDate}`, {
        x: emu(754307),
        y: emu(7305197),
        w: emu(12167180),
        h: emu(1242572),
        fontSize: 18,
        fontFace: FONT_HEADER,
        color: '666666',
        valign: 'middle',
    });

    // Part numbers text box
    slide.addText(info.partNumber, {
        x: emu(768384),
        y: emu(4611448),
        w: emu(3846503),
        h: emu(2313418),
        fontSize: 14,
        fontFace: FONT_MAIN,
        color: C.black,
        valign: 'top',
    });
}

// ============================================================
// Summary Slide (Title & Bullets layout)
// - Header: "{Project} | DWG Review | {Part}_{PartNumber}"
// - 7-column table with issue data
// ============================================================
function buildSummarySlide(pptx: PptxGenJS, info: DRProjectInfo, issue: DRIssue, idx: number) {
    const slide = pptx.addSlide();
    slide.background = { color: C.white };

    // Header text (like template placeholder)
    slide.addText(
        `${info.projectName} | DWG Review | ${info.productName}_${info.partNumber}`,
        {
            x: emu(344705),
            y: emu(203200),
            w: emu(9574308),
            h: emu(558800),
            fontSize: 16,
            fontFace: FONT_HEADER,
            color: C.headerBg,
            bold: true,
            valign: 'middle',
        }
    );

    // 7-column summary table
    const headerOpts = {
        fontSize: 10,
        fontFace: FONT_MAIN,
        color: C.headerText,
        bold: true,
        fill: { color: C.headerBg },
        align: 'center' as const,
        valign: 'middle' as const,
        border: { type: 'solid' as const, pt: 0.5, color: C.tableBorder },
    };

    const cellOpts = {
        fontSize: 10,
        fontFace: FONT_MAIN,
        color: C.cellText,
        valign: 'top' as const,
        border: { type: 'solid' as const, pt: 0.5, color: C.tableBorder },
    };

    const headerRow = [
        { text: 'No.', options: headerOpts },
        { text: 'Page', options: headerOpts },
        { text: 'FAI/SPC', options: headerOpts },
        { text: 'Description', options: headerOpts },
        { text: 'DWG Spec', options: headerOpts },
        { text: 'Proposal', options: headerOpts },
        { text: 'PD Disposition', options: headerOpts },
    ];

    const dataRow = [
        { text: String(issue.seqNo), options: { ...cellOpts, align: 'center' as const } },
        { text: issue.pptPage || String(idx + 1), options: { ...cellOpts, align: 'center' as const } },
        { text: issue.faiSpc || '/', options: { ...cellOpts, align: 'center' as const } },
        { text: issue.description, options: cellOpts },
        { text: issue.drawingSpec, options: cellOpts },
        { text: issue.suggestion, options: cellOpts },
        { text: issue.pdOpinion || '', options: cellOpts },
    ];

    slide.addTable([headerRow, dataRow], {
        x: SUMMARY_TABLE.x,
        y: SUMMARY_TABLE.y,
        w: SUMMARY_TABLE.w,
        colW: SUMMARY_TABLE.colW,
        rowH: [0.4, 2.5],
        border: { type: 'solid', pt: 0.5, color: C.tableBorder },
    });
}

// ============================================================
// Detail Slide (Default layout)
// - Title: "DWG Review | {Product} Callout/Definition"
// - Info table 4x2 (Dimension, Page, Issue Description, Proposal)
// - PD table 1x2 (top-right)
// - Comparison table 2x3 (2D Drawing, Legacy Best Practice, Proposal)
// ============================================================
function buildDetailSlide(pptx: PptxGenJS, info: DRProjectInfo, issue: DRIssue, idx: number) {
    const slide = pptx.addSlide();
    slide.background = { color: C.white };

    // Title placeholder
    slide.addText(`DWG Review | ${info.productName} Callout/Definition`, {
        x: emu(505089),
        y: emu(282044),
        w: emu(9770535),
        h: emu(558803),
        fontSize: 16,
        fontFace: FONT_HEADER,
        color: C.headerBg,
        bold: true,
        valign: 'middle',
    });

    // PD table (top-right corner)
    const pdHeaderOpts = {
        fontSize: 10,
        fontFace: FONT_HEADER,
        color: C.headerText,
        bold: true,
        fill: { color: C.headerBg },
        align: 'center' as const,
        valign: 'middle' as const,
        border: { type: 'solid' as const, pt: 0.5, color: C.tableBorder },
    };

    const pdCellOpts = {
        fontSize: 10,
        fontFace: FONT_MAIN,
        color: C.cellText,
        valign: 'middle' as const,
        border: { type: 'solid' as const, pt: 0.5, color: C.tableBorder },
    };

    slide.addTable([
        [
            { text: 'PD', options: pdHeaderOpts },
            { text: issue.pdOpinion || '', options: pdCellOpts },
        ],
    ], {
        x: PD_TABLE.x,
        y: PD_TABLE.y,
        w: PD_TABLE.w,
        colW: PD_TABLE.colW,
        rowH: [0.71],
        border: { type: 'solid', pt: 0.5, color: C.tableBorder },
    });

    // Info table (4 rows x 2 cols)
    const infoLabelOpts = {
        fontSize: 10,
        fontFace: FONT_HEADER,
        color: C.headerText,
        bold: true,
        fill: { color: C.accent },
        valign: 'middle' as const,
        border: { type: 'solid' as const, pt: 0.5, color: C.tableBorder },
    };

    const infoValOpts = {
        fontSize: 10,
        fontFace: FONT_MAIN,
        color: C.cellText,
        valign: 'top' as const,
        border: { type: 'solid' as const, pt: 0.5, color: C.tableBorder },
    };

    slide.addTable([
        [
            { text: 'Dimension', options: infoLabelOpts },
            { text: issue.faiSpc || '/', options: infoValOpts },
        ],
        [
            { text: 'Page', options: infoLabelOpts },
            { text: issue.pptPage || String(idx + 1), options: infoValOpts },
        ],
        [
            { text: 'Issue Description', options: infoLabelOpts },
            { text: issue.description, options: infoValOpts },
        ],
        [
            { text: 'Proposal', options: infoLabelOpts },
            { text: issue.suggestion, options: infoValOpts },
        ],
    ], {
        x: INFO_TABLE.x,
        y: INFO_TABLE.y,
        w: INFO_TABLE.w,
        colW: INFO_TABLE.colW,
        rowH: [0.47, 0.47, 0.47, 0.47],
        border: { type: 'solid', pt: 0.5, color: C.tableBorder },
    });

    // Comparison table (2 rows x 3 cols)
    const compHeaderOpts = {
        fontSize: 11,
        fontFace: FONT_HEADER,
        color: C.headerText,
        bold: true,
        fill: { color: C.headerBg },
        align: 'center' as const,
        valign: 'middle' as const,
        border: { type: 'solid' as const, pt: 0.5, color: C.tableBorder },
    };

    const compCellOpts = {
        fontSize: 10,
        fontFace: FONT_MAIN,
        color: C.cellText,
        valign: 'top' as const,
        border: { type: 'solid' as const, pt: 0.5, color: C.tableBorder },
    };

    // Build description for 2D Drawing column
    const drawingInfo = issue.drawingSpec
        ? `DWG Spec: ${issue.drawingSpec}\n\n${issue.description}`
        : issue.description;

    // Build proposal column
    const proposalInfo = issue.suggestion || '';

    slide.addTable([
        [
            { text: '2D Drawing', options: compHeaderOpts },
            { text: 'Legacy Best Practice', options: compHeaderOpts },
            { text: 'Proposal', options: compHeaderOpts },
        ],
        [
            { text: drawingInfo, options: compCellOpts },
            { text: '/', options: { ...compCellOpts, align: 'center' as const } },
            { text: proposalInfo, options: compCellOpts },
        ],
    ], {
        x: COMPARE_TABLE.x,
        y: COMPARE_TABLE.y,
        w: COMPARE_TABLE.w,
        colW: COMPARE_TABLE.colW,
        rowH: [0.45, 5.6],
        border: { type: 'solid', pt: 0.5, color: C.tableBorder },
    });
}
