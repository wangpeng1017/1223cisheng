/**
 * @file ppt-data-transformer.ts
 * @desc 将现有FAI数据格式转换为PPT生成所需的格式
 * @input 依赖: drawing-extract模块的FAIItem
 * @output 导出: PPTGenerator所需的数据格式
 */

import type { ProductInfo, FAIItem, Equipment, Fixture } from '@/lib/types/ppt';

// 从drawing-extract页面复制的FAIItem接口（避免循环导入）
export interface DrawingFAIItem {
    fai_num: number
    spc: string | null
    nom: string | null
    upper_tol: string | null
    lower_tol: string | null
    symbol: string | null
    measure_type: string | null
    description: string | null
    page: number | null
    category: string | null
    alternatives?: any[]
}

/**
 * 从PDF文件名提取产品信息
 */
export function extractProductInfoFromFileName(fileName: string): ProductInfo {
  // 示例文件名: J510-160-06631-01.pdf 或类似格式
  const baseName = fileName.replace('.pdf', '');

  // 尝试解析文件名
  const parts = baseName.split('-');
  const projectName = parts[0] || 'Unknown';
  const partNumber = parts[1] || 'Unknown';
  const revision = parts[2] || '01';
  const vendor = 'MAGSOUND'; // 默认值，可后续让用户修改

  // 生成当前日期
  const now = new Date();
  const date = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;

  return {
    projectName,
    partNumber,
    revision,
    vendor,
    date,
  };
}

/**
 * 将drawing-extract的FAIItem转换为PPT生成所需的FAIItem
 */
export function transformFAIItem(item: DrawingFAIItem): FAIItem {
  // 组合规格值
  let specification = '';
  if (item.nom && item.upper_tol && item.lower_tol) {
    specification = `${item.nom} ${item.lower_tol} ~ ${item.upper_tol}`;
  } else if (item.nom) {
    specification = item.nom;
  }

  // 确定测量方法（根据测量类型推断）
  const methodMap: Record<string, string> = {
    '厚度/距离': 'HG',
    '圆角半径': 'Keyence',
    '线轮廓度': 'Keyence',
    '平面度': 'Keyence',
    '平行度': 'Keyence',
    '磁通密度(Br)': 'Magnetic Tester',
    '矫顽力(Hcb)': 'Magnetic Tester',
    '矫顽力(Hcj)': 'Magnetic Tester',
    '最大能积(BHmax)': 'Magnetic Tester',
    '硬度': 'Hardness Tester',
    '光泽度': 'Gloss Meter',
    '粗糙度(Ra)': 'Roughness Tester',
    '外观检验': 'Visual',
    '盐雾测试': 'SST Tester',
  };

  const method = methodMap[item.measure_type || ''] || 'TBD';

  // 确定测量状态
  const status = 'Free'; // 默认值，可后续配置

  // 生成测量步骤（简化版）
  const procedure = generateProcedureSteps(item);

  return {
    faiNum: item.fai_num,
    spcCode: item.spc || undefined,
    category: item.measure_type || '未分类',
    specification,
    description: item.description || item.measure_type || '',
    method,
    fixture: '', // 暂时为空，可后续配置
    status,
    procedure,
  };
}

/**
 * 根据测量类型生成测量步骤
 */
function generateProcedureSteps(item: DrawingFAIItem): string[] {
  const steps: string[] = [];

  switch (item.measure_type) {
    case '厚度/距离':
    case '圆角半径':
      steps.push(
        `将产品如下图平放大理石平台上`,
        `使用${item.measure_type === '厚度/距离' ? '高度规' : '影像仪'}测量`,
        `记录测量数值`
      );
      break;

    case '线轮廓度':
    case '平面度':
    case '平行度':
      steps.push(
        `将产品摆放在测试平台上`,
        `选择"线"功能，自动选取直线`,
        `记录测量数值`
      );
      break;

    case '磁通密度(Br)':
    case '矫顽力(Hcb)':
    case '矫顽力(Hcj)':
    case '最大能积(BHmax)':
      steps.push(
        `将无磁产品按磁化方向进行饱和充磁`,
        `使用永磁测试仪测量`,
        `记录测量数值`
      );
      break;

    case '硬度':
      steps.push(
        `准备测试样品`,
        `使用硬度计测量`,
        `记录测量数值`
      );
      break;

    case '盐雾测试':
      steps.push(
        `设备点检和溶液制备`,
        `将样品放入盐雾试验箱`,
        `设定测试时间并开始测试`,
        `测试结束后检查样品`
      );
      break;

    default:
      steps.push(
        `按照测试标准进行测量`,
        `记录测量数值`,
        `判断是否符合规格`
      );
  }

  return steps;
}

/**
 * 根据FAI数据推断所需的测量设备
 */
export function inferEquipments(faiItems: DrawingFAIItem[]): Equipment[] {
  const equipmentSet = new Map<string, Equipment>();

  // 根据测量类型到设备的映射
  const typeToEquipmentMap = new Map<string, Equipment>();

  // 厚度/距离 -> Height Gage
  if (faiItems.some(item => item.measure_type === '厚度/距离')) {
    typeToEquipmentMap.set('Height Gage', {
      name: 'Height Gage',
      manufacturer: 'Mitutoyo',
      model: '543-563DC',
      range: '0-50mm',
      accuracy: '0.001mm',
    });
  }

  // 圆角半径、线轮廓度、平面度、平行度 -> KEYENCE
  if (faiItems.some(item =>
    ['圆角半径', '线轮廓度', '平面度', '平行度'].includes(item.measure_type || '')
  )) {
    typeToEquipmentMap.set('KEYENCE', {
      name: 'KEYENCE',
      manufacturer: 'KEYENCE',
      model: 'IM-7101',
      range: 'Φ100x200mm (Wide), Φ25x125mm (High)',
      accuracy: '±0.001mm',
    });
  }

  // 磁性能测试 -> Magnetic permanent tester
  if (faiItems.some(item =>
    ['磁通密度(Br)', '矫顽力(Hcb)', '矫顽力(Hcj)', '最大能积(BHmax)'].includes(item.measure_type || '')
  )) {
    typeToEquipmentMap.set('Magnetic Tester', {
      name: 'Magnetic permanent tester',
      manufacturer: 'Sheep',
      model: 'AMT-4A',
      range: 'Min:10*10*10mm',
      accuracy: 'NA',
    });
  }

  // 硬度 -> Hardness Tester
  if (faiItems.some(item => item.measure_type === '硬度')) {
    typeToEquipmentMap.set('Hardness Tester', {
      name: 'Hardness Tester',
      manufacturer: 'Mitutoyo',
      model: 'HM-200',
      range: 'HV 0-1000',
      accuracy: '±1%',
    });
  }

  // 盐雾测试 -> SST Tester
  if (faiItems.some(item => item.measure_type === '盐雾测试')) {
    typeToEquipmentMap.set('SST Tester', {
      name: 'SST Tester',
      manufacturer: 'Ningbo Yuanming',
      model: 'YM-90',
      range: '900*600*500mm',
      accuracy: 'N/A',
    });
  }

  return Array.from(typeToEquipmentMap.values());
}

/**
 * 生成示例夹具列表
 */
export function generateFixtures(faiItems: DrawingFAIItem[]): Fixture[] {
  // 检查是否需要磁化方向测试
  const hasMagneticTest = faiItems.some(item =>
    item.measure_type?.includes('磁') ||
    item.measure_type?.includes('Flux')
  );

  const fixtures: Fixture[] = [];

  if (hasMagneticTest) {
    fixtures.push({
      no: 'J-J510-1#',
      size: '189 * 36 * 12',
      material: 'Electric board',
    });
  }

  return fixtures;
}

/**
 * 转换完整的FAI数据
 */
export function transformAllData(faiItems: DrawingFAIItem[], fileName: string) {
  const productInfo = extractProductInfoFromFileName(fileName);
  const equipments = inferEquipments(faiItems);
  const fixtures = generateFixtures(faiItems);
  const transformedFAIItems = faiItems.map(transformFAIItem);

  return {
    productInfo,
    equipments,
    fixtures,
    faiItems: transformedFAIItems,
  };
}
