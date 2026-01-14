/**
 * @file ppt-template-generator.ts
 * @desc 基于模板生成 PPT - 混合方案（pptx-automizer + Python python-pptx）
 * @input 依赖: pptx-automizer, python-pptx (via API)
 * @output 导出: generatePPTFromTemplate() 函数
 */

import Automizer, { modify } from 'pptx-automizer';
import path from 'path';
import { writeFile, mkdir, readFile } from 'fs/promises';
import FormData from 'form-data';
import axios from 'axios';
import type { PPTGenerationData } from '@/lib/types/ppt';

// 导出类型定义供外部使用
export type { PPTGenerationData };

// Python 后端地址（从环境变量获取，默认本地）
const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://127.0.0.1:8001';

/**
 * 表格数据结构
 */
interface TableRow {
  values: string[];
}

interface TableData {
  slide_index: number;  // 幻灯片索引（从1开始）
  table_index: number;  // 表格索引（从0开始）
  header?: string[];    // 表头
  body: TableRow[];     // 表格数据
}

/**
 * 使用 Python 后端填充表格
 * @param inputPptPath - 半成品 PPT 路径
 * @param tables - 表格数据列表
 * @returns 成品 PPT 文件 Buffer
 */
async function fillTablesWithPython(
  inputPptPath: string,
  tables: TableData[]
): Promise<Buffer> {
  console.log(`[ppt-template-generator] 调用 Python API 填充 ${tables.length} 个表格`);

  try {
    // 创建 FormData
    const formData = new FormData();
    formData.append('file', await readFile(inputPptPath), {
      filename: path.basename(inputPptPath),
      contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    });
    formData.append('table_data', JSON.stringify({ table_data: tables }));

    // 调用 Python API
    const response = await axios.post(
      `${PYTHON_API_URL}/api/ppt/fill/tables`,
      formData,
      {
        headers: formData.getHeaders(),
        responseType: 'arraybuffer',
      }
    );

    console.log(`[ppt-template-generator] Python API 填充完成，返回 ${response.data.length} 字节`);
    return Buffer.from(response.data);

  } catch (error: any) {
    console.error('[ppt-template-generator] Python API 调用失败:', error.message);
    throw new Error(`表格填充失败: ${error.message}`);
  }
}

/**
 * 基于模板生成 PPT（混合方案）
 * @param data - PPT 生成数据
 * @param templatePath - 模板文件路径
 * @param outputPath - 输出文件路径
 */
export async function generatePPTFromTemplate(
  data: PPTGenerationData,
  templatePath: string,
  outputPath: string
): Promise<void> {
  console.log('[ppt-template-generator] 开始生成PPT（混合方案）');

  const outputDir = path.dirname(outputPath);
  await mkdir(outputDir, { recursive: true }).catch(() => {}); // 忽略已存在的错误

  // 临时半成品文件路径
  const semiFinishedPath = path.join(outputDir, `semi_${Date.now()}.pptx`);

  try {
    // ===== 步骤 1: 使用 pptx-automizer 生成半成品（含空表格） =====
    console.log('[ppt-template-generator] 步骤 1: pptx-automizer 生成半成品');

    const automizer = new Automizer({
      templateDir: path.dirname(templatePath),
      outputDir: outputDir,
      removeExistingSlides: true,
    });

    const pres = automizer
      .loadRoot(path.basename(templatePath))
      .load(path.basename(templatePath), 'template');

    // 存储需要填充的表格数据
    const tablesToFill: TableData[] = [];

    // 幻灯片计数器
    let currentSlideIndex = 0;

    // 1. 添加封面页（幻灯片 1）
    console.log('  - 添加封面页');
    await pres.addSlide('template', 1, (slide) => {
      currentSlideIndex++;
      // 修改项目名称
      if (data.productInfo?.projectName) {
        slide.modifyElement('Project Name:X1335…', [
          modify.setText(data.productInfo.projectName),
        ]);
      }
      if (data.productInfo?.partNumber) {
        slide.modifyElement('Metrology Design', [
          modify.setText(`${data.productInfo.partNumber}`),
        ]);
      }
    });

    // 2. 添加目录页（幻灯片 2）
    console.log('  - 添加目录页');
    currentSlideIndex++;
    await pres.addSlide('template', 2);

    // 3. 添加修订历史页（幻灯片 3）- 记录表格数据
    console.log('  - 添加修订历史页');
    currentSlideIndex++;
    if (data.revisionHistory && data.revisionHistory.length > 0) {
      tablesToFill.push({
        slide_index: 3,
        table_index: 0,
        header: ['版本', '日期', '修订内容', '修订人'],
        body: data.revisionHistory.map(rev => ({
          values: [rev.version, rev.date, rev.content, rev.reviser || '']
        })),
      });
    }
    await pres.addSlide('template', 3);

    // 4. 添加设备详情页（幻灯片 4-9）
    console.log('  - 添加设备详情页');
    if (data.equipments && data.equipments.length > 0) {
      let equipmentSlideIndex = 4;

      for (let i = 0; i < data.equipments.length; i++) {
        const eq = data.equipments[i];
        const isLast = i === data.equipments.length - 1;

        await pres.addSlide('template', equipmentSlideIndex, (slide) => {
          currentSlideIndex++;
          // 记录表格数据
          tablesToFill.push({
            slide_index: currentSlideIndex,  // 当前幻灯片索引
            table_index: 0,
            header: ['项目', '规格'],
            body: [
              { values: ['设备名称', eq.name || ''] },
              { values: ['型号', eq.model || ''] },
              { values: ['精度', eq.precision || ''] },
              { values: ['数量', eq.quantity?.toString() || '1'] },
            ],
          });
        });

        // 如果不是最后一个，继续使用下一个模板页
        if (!isLast && equipmentSlideIndex < 9) {
          equipmentSlideIndex++;
        }
      }
    }

    // 5. 添加夹具列表页（幻灯片 10）
    console.log('  - 添加夹具列表页');
    currentSlideIndex++;
    if (data.fixtures && data.fixtures.length > 0) {
      tablesToFill.push({
        slide_index: currentSlideIndex,
        table_index: 0,
        header: ['序号', '夹具名称', '夹具编号', '数量'],
        body: data.fixtures.map((fix, idx) => ({
          values: [
            (idx + 1).toString(),
            fix.name || '',
            fix.code || '',
            fix.quantity?.toString() || '1'
          ]
        })),
      });
    }
    await pres.addSlide('template', 10);

    // 6. 添加 BOM 列表页（幻灯片 11）
    console.log('  - 添加 BOM 列表页');
    currentSlideIndex++;
    if (data.bom && data.bom.length > 0) {
      tablesToFill.push({
        slide_index: currentSlideIndex,
        table_index: 0,
        header: ['序号', '物料名称', '物料编号', '规格', '数量'],
        body: data.bom.map((item, idx) => ({
          values: [
            (idx + 1).toString(),
            item.name || '',
            item.code || '',
            item.specification || '',
            item.quantity?.toString() || '1'
          ]
        })),
      });
    }
    await pres.addSlide('template', 11);

    // 7. 添加 FAI 汇总页（幻灯片 12）
    console.log('  - 添加 FAI 汇总页');
    currentSlideIndex++;
    await pres.addSlide('template', 12);

    // 8. 添加 FAI 详情页（幻灯片 13-22）
    console.log('  - 添加 FAI 详情页');
    if (data.faiItems && data.faiItems.length > 0) {
      let faiSlideIndex = 13;

      for (let i = 0; i < data.faiItems.length; i++) {
        const fai = data.faiItems[i];
        const isLast = i === data.faiItems.length - 1;

        await pres.addSlide('template', faiSlideIndex, (slide) => {
          currentSlideIndex++;
          // 修改 FAI 标题
          if (fai.itemName) {
            try {
              slide.modifyElement('文本框 84', [
                modify.setText(fai.itemName),
              ]);
            } catch (e) {
              console.log('  - FAI 标题修改失败（可能不存在该元素）');
            }
          }

          // 记录表格数据
          if (fai.dimensions && fai.dimensions.length > 0) {
            tablesToFill.push({
              slide_index: currentSlideIndex,
              table_index: 0,
              header: ['序号', '尺寸', '规格', '实测值', '判定'],
              body: fai.dimensions.map((dim, idx) => ({
                values: [
                  (idx + 1).toString(),
                  dim.name || '',
                  dim.nominal?.toString() || '',
                  dim.actual?.toString() || '',
                  dim.result || 'OK'
                ]
              })),
            });
          }
        });

        if (!isLast && faiSlideIndex < 22) {
          faiSlideIndex++;
        }
      }
    }

    // 输出半成品 PPT
    console.log('[ppt-template-generator] 生成半成品 PPT');
    await pres.write(path.basename(semiFinishedPath));
    console.log(`[ppt-template-generator] 半成品已生成: ${semiFinishedPath}`);

    // ===== 步骤 2: 使用 Python 后端填充表格 =====
    console.log('[ppt-template-generator] 步骤 2: Python 后端填充表格');
    console.log(`[ppt-template-generator] 待填充表格数: ${tablesToFill.length}`);

    if (tablesToFill.length > 0) {
      const finalPptBuffer = await fillTablesWithPython(semiFinishedPath, tablesToFill);

      // 保存成品 PPT
      await writeFile(outputPath, finalPptBuffer);
      console.log(`[ppt-template-generator] 成品 PPT 已保存: ${outputPath}`);
    } else {
      // 没有表格需要填充，直接使用半成品
      await writeFile(outputPath, await readFile(semiFinishedPath));
      console.log(`[ppt-template-generator] 无表格需填充，直接输出: ${outputPath}`);
    }

    console.log('[ppt-template-generator] ✅ PPT 生成完成！');

  } catch (error: any) {
    console.error('[ppt-template-generator] ❌ 生成失败:', error.message);
    throw error;
  } finally {
    // 清理临时文件
    try {
      const fs = await import('fs/promises');
      await fs.unlink(semiFinishedPath);
    } catch (e) {
      // 忽略清理错误
    }
  }
}
