/**
 * @file ppt-generator.ts
 * @desc MTD PPT 生成服务 - 使用 PptxGenJS 在前端动态生成
 */
import pptxgen from 'pptxgenjs'

interface Equipment { id: number; name: string; manufacturer: string; model: string; specs?: Record<string, string> }
interface Fixture { id: number; fixture_no: string; size: string; material: string }
interface FAIItem { fai_num: string; spc: string; specification: string; description: string; cpk_method: string; cpk_fixture: string; inprocess_method: string; inprocess_fixture: string; location: string; cross_check_by: string }
interface Project { project_name: string; part_number: string; vendor: string; revision: string }

const COLORS = { primary: '1F4E79', secondary: '2E75B6', text: '333333', lightGray: 'F2F2F2', white: 'FFFFFF', headerBg: '1F4E79' }
type ProgressCallback = (progress: number, message: string) => void

export async function generateMTDPPT(
  project: Project, equipmentList: Equipment[], fixtureList: Fixture[], faiItems: FAIItem[], onProgress?: ProgressCallback
): Promise<void> {
  const pres = new pptxgen()
  pres.author = 'NPI System'
  pres.title = 'MTD - ' + project.project_name
  pres.layout = 'LAYOUT_16x9'

  const totalSteps = 4 + equipmentList.length + (fixtureList.length > 0 ? 1 : 0) + (faiItems.length > 0 ? 2 : 0)
  let currentStep = 0
  const updateProgress = (msg: string) => { currentStep++; onProgress?.(Math.round((currentStep / totalSteps) * 100), msg) }

  updateProgress('生成封面页...')
  addCoverSlide(pres, project)

  updateProgress('生成目录页...')
  addContentSlide(pres, project, equipmentList, fixtureList, faiItems)

  updateProgress('生成修订历史页...')
  addRevisionSlide(pres, project)

  for (const eq of equipmentList) {
    updateProgress('生成设备页: ' + eq.name + '...')
    addEquipmentSlide(pres, project, eq)
  }

  if (fixtureList.length > 0) {
    updateProgress('生成夹具清单页...')
    addFixtureSlide(pres, project, fixtureList)
  }

  if (faiItems.length > 0) {
    updateProgress('生成测量详情总表...')
    addFAISummarySlide(pres, project, faiItems)
    updateProgress('生成测试项详情页...')
    for (let i = 0; i < Math.min(faiItems.length, 10); i++) {
      addFAIDetailSlide(pres, project, faiItems[i])
    }
  }

  updateProgress('生成结束页...')
  addEndSlide(pres, project)

  const fileName = 'MTD_' + project.project_name + '_' + project.part_number + '_' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '.pptx'
  await pres.writeFile({ fileName })
}

function addCoverSlide(pres: pptxgen, project: Project) {
  const slide = pres.addSlide()
  slide.addText('MTD', { x: 0.5, y: 1.5, w: 9, h: 1, fontSize: 48, bold: true, color: COLORS.primary })
  slide.addText('Metrology Test Document', { x: 0.5, y: 2.3, w: 9, h: 0.5, fontSize: 24, color: COLORS.secondary })
  slide.addText('Project Name: ' + project.project_name + '\nPart Number & Rev: ' + project.part_number + ' Rev.' + project.revision + '\nVendor: ' + (project.vendor || 'N/A') + '\nDate: ' + new Date().toLocaleDateString('zh-CN'), { x: 0.5, y: 3.5, w: 9, h: 2, fontSize: 16, color: COLORS.text, lineSpacing: 28 })
}

function addContentSlide(pres: pptxgen, project: Project, equipmentList: Equipment[], fixtureList: Fixture[], faiItems: FAIItem[]) {
  const slide = pres.addSlide()
  addHeader(slide, 'MTD | ' + project.project_name + ' - Content - ' + project.part_number)
  const contents: string[] = ['1. Revision History']
  let idx = 2
  equipmentList.forEach((eq, i) => { contents.push((idx + i) + '. Equipment: ' + eq.name) })
  idx += equipmentList.length
  if (fixtureList.length > 0) { contents.push(idx + '. Fixture List'); idx++ }
  if (faiItems.length > 0) { contents.push(idx + '. Measurement Summary'); idx++; contents.push(idx + '. Measurement Details') }
  slide.addText(contents.join('\n'), { x: 0.5, y: 1.2, w: 9, h: 4, fontSize: 18, color: COLORS.text, lineSpacing: 32 })
}

function addRevisionSlide(pres: pptxgen, project: Project) {
  const slide = pres.addSlide()
  addHeader(slide, 'MTD | ' + project.project_name + ' - Revision History - ' + project.part_number)
  const rows = [
    ['Part Number', 'Revision', 'Date', 'Description'],
    [project.part_number, project.revision, new Date().toLocaleDateString('zh-CN'), 'Initial Release']
  ]
  slide.addTable(rows as any, { x: 0.5, y: 1.5, w: 9, colW: [2.5, 1.5, 2, 3], fontSize: 12, border: { pt: 0.5, color: 'CCCCCC' } })
}

function addEquipmentSlide(pres: pptxgen, project: Project, equipment: Equipment) {
  const slide = pres.addSlide()
  addHeader(slide, 'MTD | ' + project.project_name + ' - Equipment - ' + project.part_number)
  const specs = equipment.specs || {}
  const rows = [
    ['Item', 'Details'],
    ['Equipment Name', equipment.name],
    ['Manufacturer', equipment.manufacturer || 'N/A'],
    ['Model', equipment.model || 'N/A'],
    ['Range', specs.range || 'N/A'],
    ['Resolution', specs.resolution || 'N/A'],
    ['Accuracy', specs.accuracy || 'N/A']
  ]
  slide.addTable(rows as any, { x: 0.5, y: 1.5, w: 5, colW: [2, 3], fontSize: 12, border: { pt: 0.5, color: 'CCCCCC' } })
  slide.addShape(pres.ShapeType.rect, { x: 6, y: 1.5, w: 3.5, h: 3, fill: { color: COLORS.lightGray } })
  slide.addText('Equipment Image', { x: 6, y: 2.8, w: 3.5, h: 0.5, fontSize: 12, color: '999999', align: 'center' })
}

function addFixtureSlide(pres: pptxgen, project: Project, fixtureList: Fixture[]) {
  const slide = pres.addSlide()
  addHeader(slide, 'MTD | ' + project.project_name + ' - Fixture List - ' + project.part_number)
  const rows = [['Fixture No.', 'Size', 'Material', 'Remark']]
  fixtureList.forEach(f => { rows.push([f.fixture_no, f.size || 'N/A', f.material || 'N/A', '/']) })
  slide.addTable(rows as any, { x: 0.5, y: 1.5, w: 9, colW: [2.5, 2.5, 2.5, 1.5], fontSize: 11, border: { pt: 0.5, color: 'CCCCCC' } })
}

function addFAISummarySlide(pres: pptxgen, project: Project, faiItems: FAIItem[]) {
  const slide = pres.addSlide()
  addHeader(slide, 'MTD | ' + project.project_name + ' - Measurement Summary - ' + project.part_number)
  const rows = [['FAI#', 'SPC', 'Spec', 'Description', 'CPK Method', 'CPK Fixture', 'In-process', 'Fixture']]
  faiItems.slice(0, 12).forEach(item => {
    rows.push([item.fai_num, item.spc, item.specification, item.description, item.cpk_method, item.cpk_fixture, item.inprocess_method, item.inprocess_fixture])
  })
  slide.addTable(rows as any, { x: 0.3, y: 1.3, w: 9.4, colW: [0.8, 0.8, 1.4, 1.8, 1.4, 1, 1.4, 0.8], fontSize: 9, border: { pt: 0.5, color: 'CCCCCC' } })
}

function addFAIDetailSlide(pres: pptxgen, project: Project, item: FAIItem) {
  const slide = pres.addSlide()
  addHeader(slide, 'MTD | ' + project.project_name + ' - Metrology Details - ' + project.part_number)
  slide.addText(item.description + ' FAI ' + item.fai_num + ' / SPC ' + item.spc + ': ' + item.specification, { x: 0.5, y: 1.2, w: 9, h: 0.4, fontSize: 14, bold: true, color: COLORS.primary })
  slide.addText('CPK Measurement\n\n1. Method: ' + item.cpk_method + '\n2. Fixture: ' + (item.cpk_fixture || '/') + '\n3. Steps: See image', { x: 0.5, y: 1.8, w: 4.5, h: 2.5, fontSize: 11, color: COLORS.text, valign: 'top' })
  slide.addText('In-process Measurement\n\n1. Method: ' + item.inprocess_method + '\n2. Fixture: ' + (item.inprocess_fixture || '/') + '\n3. Steps: See image', { x: 5.2, y: 1.8, w: 4.5, h: 2.5, fontSize: 11, color: COLORS.text, valign: 'top' })
  slide.addShape(pres.ShapeType.rect, { x: 0.5, y: 4.5, w: 4, h: 2, fill: { color: COLORS.lightGray } })
  slide.addShape(pres.ShapeType.rect, { x: 5.2, y: 4.5, w: 4, h: 2, fill: { color: COLORS.lightGray } })
}

function addEndSlide(pres: pptxgen, project: Project) {
  const slide = pres.addSlide()
  slide.background = { color: COLORS.primary }
  slide.addText('Thank You', { x: 0, y: 2.5, w: '100%', h: 1, fontSize: 48, bold: true, color: COLORS.white, align: 'center' })
  slide.addText(project.project_name + ' - ' + project.part_number, { x: 0, y: 3.8, w: '100%', h: 0.5, fontSize: 18, color: COLORS.white, align: 'center' })
}

function addHeader(slide: pptxgen.Slide, title: string) {
  slide.addShape('rect' as any, { x: 0, y: 0, w: '100%', h: 0.8, fill: { color: COLORS.headerBg } })
  slide.addText(title, { x: 0.3, y: 0.2, w: 9.4, h: 0.4, fontSize: 14, bold: true, color: COLORS.white })
}

export type { Equipment, Fixture, FAIItem, Project }
