/**
 * @file inspect-template.ts
 * @desc 获取模板中的所有元素信息
 * 输出每个幻灯片的所有 shape 名称，帮助定位需要修改的元素
 */

import Automizer from 'pptx-automizer';
import path from 'path';

async function inspectTemplate() {
  console.log('=== 分析 mtd_template.pptx 模板 ===\n');

  const automizer = new Automizer({
    templateDir: path.join(process.cwd(), 'public', 'templates'),
    outputDir: path.join(process.cwd(), 'public', 'downloads'),
  });

  try {
    // 加载模板并获取信息
    const pres = automizer.load('mtd_template.pptx', 'template');
    const info = await pres.getInfo();

    console.log('📊 模板信息概览:\n');

    // 获取所有幻灯片
    const slides = info.slidesByTemplate('template');
    console.log(`总幻灯片数: ${slides.length}\n`);

    // 遍历每个幻灯片
    for (const slide of slides) {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📄 幻灯片 #${slide.number}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      // 获取该幻灯片的所有元素
      const elements = slide.elements;

      if (!elements || elements.length === 0) {
        console.log('  (无元素)\n');
        continue;
      }

      console.log(`  元素数量: ${elements.length}\n`);

      // 分类显示元素
      const textElements = elements.filter((e: any) => e.type === 'text' || e.hasText);
      const tables = elements.filter((e: any) => e.type === 'table' || e.subType === 'table');
      const charts = elements.filter((e: any) => e.type === 'chart' || e.subType === 'chart');
      const images = elements.filter((e: any) => e.type === 'image' || e.subType === 'image');
      const others = elements.filter((e: any) =>
        !textElements.includes(e) &&
        !tables.includes(e) &&
        !charts.includes(e) &&
        !images.includes(e)
      );

      // 显示文本元素
      if (textElements.length > 0) {
        console.log('  📝 文本元素:');
        textElements.forEach((element: any) => {
          const name = element.name || element.id || '(未命名)';
          const text = element.text
            ? `"${element.text.substring(0, 30)}${element.text.length > 30 ? '...' : ''}"`
            : '(空)';
          console.log(`     - ${name}: ${text}`);
        });
        console.log('');
      }

      // 显示表格
      if (tables.length > 0) {
        console.log('  📊 表格:');
        tables.forEach((element: any) => {
          const name = element.name || element.id || '(未命名)';
          console.log(`     - ${name}`);
        });
        console.log('');
      }

      // 显示图表
      if (charts.length > 0) {
        console.log('  📈 图表:');
        charts.forEach((element: any) => {
          const name = element.name || element.id || '(未命名)';
          console.log(`     - ${name}`);
        });
        console.log('');
      }

      // 显示图片
      if (images.length > 0) {
        console.log('  🖼️  图片:');
        images.forEach((element: any) => {
          const name = element.name || element.id || '(未命名)';
          console.log(`     - ${name}`);
        });
        console.log('');
      }

      // 显示其他元素
      if (others.length > 0) {
        console.log('  📦 其他元素:');
        others.forEach((element: any) => {
          const name = element.name || element.id || '(未命名)';
          const type = element.type || element.subType || '未知类型';
          console.log(`     - ${name} (${type})`);
        });
        console.log('');
      }

      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 分析完成！');
    console.log('');
    console.log('💡 使用方法:');
    console.log('  1. 在上方找到你想要修改的元素名称');
    console.log('  2. 在代码中使用该名称进行修改:');
    console.log('     ```');
    console.log('     slide.modifyElement(\'元素名称\', [');
    console.log('       modify.replaceText([');
    console.log('         { replace: \'旧文本\', by: { text: \'新文本\' } }');
    console.log('       ])');
    console.log('     ]);');
    console.log('     ```');

  } catch (error: any) {
    console.error('\n❌ 分析失败:', error.message);
    console.error('错误堆栈:', error.stack);
    throw error;
  }
}

inspectTemplate().catch((error) => {
  console.error('\n分析终止');
  process.exit(1);
});
