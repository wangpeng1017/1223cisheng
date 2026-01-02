"""
@file ppt_generator.py
@desc MTD PPT 自动生成服务 - 完整版
@see PRD: docs/mtd/PRD.md
"""
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RgbColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE_TYPE
import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from copy import deepcopy

TEMPLATE_PATH = os.path.join(os.path.dirname(__file__), '..', 'templates', 'mtd_template.pptx')


class MTDPPTGenerator:
    """MTD PPT 生成器 - 基于模板填充数据"""

    def __init__(self, template_path: str = None):
        self.template_path = template_path or TEMPLATE_PATH
        self.prs = None

    def generate(self, project: Dict, equipment_list: List[Dict],
                 fixture_list: List[Dict], fai_items: List[Dict],
                 output_path: str) -> str:
        """
        生成 MTD PPT

        PPT 结构（22页）：
        - 第1页: 封面
        - 第2页: 目录
        - 第3页: 修订历史
        - 第4-9页: 设备详情（6种设备）
        - 第10页: 夹具清单
        - 第11页: 测量详情总表
        - 第12-22页: 各测试项详情
        """
        self.prs = Presentation(self.template_path)

        # 1. 更新封面页
        self._update_cover_slide(project)

        # 2. 更新目录页
        self._update_content_slide(project)

        # 3. 更新修订历史
        self._update_revision_slide(project)

        # 4. 更新设备详情页（第4-9页）
        self._update_equipment_slides(equipment_list)

        # 5. 更新夹具清单页（第10页）
        self._update_fixture_slide(fixture_list)

        # 6. 更新测量详情总表（第11页）
        self._update_summary_table(fai_items)

        # 7. 更新测试项详情页（第12页起）
        self._update_detail_slides(fai_items, project)

        self.prs.save(output_path)
        return output_path

    def _update_cover_slide(self, project: Dict):
        """更新封面页（第1页）"""
        slide = self.prs.slides[0]
        for shape in slide.shapes:
            if shape.has_text_frame:
                text = shape.text_frame.text
                if "Project Name" in text or "J510" in text or "Part Number" in text:
                    new_text = f"Project Name:{project.get('project_name', '')}\n"
                    new_text += f"Part Number & Rev：{project.get('part_number', '')}\n"
                    new_text += f"Vendor：{project.get('vendor', '')}\n"
                    new_text += f"Date：{datetime.now().strftime('%Y/%m/%d')}"
                    self._set_text_keep_format(shape, new_text)

    def _update_content_slide(self, project: Dict):
        """更新目录页（第2页）"""
        slide = self.prs.slides[1]
        for shape in slide.shapes:
            if shape.has_text_frame:
                text = shape.text_frame.text
                if "MTD" in text and "Content" in text:
                    new_text = f"MTD | {project.get('project_name', '')}-Content-{project.get('part_number', '')}"
                    self._set_text_keep_format(shape, new_text)

    def _update_revision_slide(self, project: Dict):
        """更新修订历史页（第3页）"""
        slide = self.prs.slides[2]

        # 更新标题
        for shape in slide.shapes:
            if shape.has_text_frame:
                text = shape.text_frame.text
                if "MTD" in text and "revision" in text.lower():
                    new_text = f"MTD | {project.get('project_name', '')}- revision history List  {project.get('part_number', '')}"
                    self._set_text_keep_format(shape, new_text)

            # 更新表格
            if shape.has_table:
                table = shape.table
                if len(table.rows) > 1:
                    row = table.rows[1]
                    part_num = project.get('part_number', '')
                    row.cells[0].text = part_num.split('-')[0] if '-' in part_num else part_num
                    row.cells[1].text = project.get('revision', '01')
                    row.cells[2].text = datetime.now().strftime('%Y/%m/%d')
                    row.cells[3].text = "Initial Release"

    def _update_equipment_slides(self, equipment_list: List[Dict]):
        """更新设备详情页（第4-9页）"""
        # 设备页从索引3开始（第4页），共6页
        equipment_slide_indices = [3, 4, 5, 6, 7, 8]

        for idx, slide_idx in enumerate(equipment_slide_indices):
            if slide_idx >= len(self.prs.slides):
                break

            slide = self.prs.slides[slide_idx]

            # 如果有对应的设备数据，更新表格
            if idx < len(equipment_list):
                equipment = equipment_list[idx]
                for shape in slide.shapes:
                    if shape.has_table:
                        table = shape.table
                        # 更新设备信息表格
                        self._update_equipment_table(table, equipment)

    def _update_equipment_table(self, table, equipment: Dict):
        """更新单个设备表格"""
        specs = equipment.get('specs', {}) or {}

        for row in table.rows:
            if len(row.cells) >= 2:
                label = row.cells[0].text.strip().lower()
                if 'name' in label:
                    row.cells[1].text = equipment.get('name', '')
                elif 'manufacturer' in label:
                    row.cells[1].text = equipment.get('manufacturer', '')
                elif 'model' in label:
                    row.cells[1].text = equipment.get('model', '')
                elif 'range' in label:
                    row.cells[1].text = specs.get('range', '')
                elif 'resolution' in label:
                    row.cells[1].text = specs.get('resolution', '')
                elif 'accuracy' in label:
                    row.cells[1].text = specs.get('accuracy', '')

    def _update_fixture_slide(self, fixture_list: List[Dict]):
        """更新夹具清单页（第10页）"""
        if len(self.prs.slides) < 10:
            return

        slide = self.prs.slides[9]  # 第10页，索引9

        for shape in slide.shapes:
            if shape.has_table:
                table = shape.table
                # 从第2行开始填充数据（第1行是表头）
                for idx, fixture in enumerate(fixture_list[:min(len(fixture_list), len(table.rows)-1)]):
                    row_idx = idx + 1
                    if row_idx < len(table.rows):
                        row = table.rows[row_idx]
                        if len(row.cells) >= 5:
                            row.cells[0].text = fixture.get('fixture_no', '')
                            row.cells[1].text = fixture.get('size', '')
                            row.cells[2].text = fixture.get('material', '')
                            # cells[3] 是图片列，跳过
                            row.cells[4].text = fixture.get('remark', '/')

    def _update_summary_table(self, fai_items: List[Dict]):
        """更新测量详情总表（第11页）"""
        if len(self.prs.slides) < 11:
            return

        slide = self.prs.slides[10]  # 第11页，索引10

        for shape in slide.shapes:
            if shape.has_table:
                table = shape.table
                # 检查是否是主表格（10列）
                if len(table.columns) >= 10:
                    # 从第2行开始填充数据
                    for idx, item in enumerate(fai_items[:min(len(fai_items), len(table.rows)-1)]):
                        row_idx = idx + 1
                        if row_idx < len(table.rows):
                            row = table.rows[row_idx]
                            row.cells[0].text = str(item.get('fai_num', ''))
                            row.cells[1].text = item.get('spc', '')
                            row.cells[2].text = item.get('specification', '')
                            row.cells[3].text = item.get('description', '')
                            row.cells[4].text = item.get('cpk_method', '')
                            row.cells[5].text = item.get('cpk_fixture', 'No')
                            row.cells[6].text = item.get('inprocess_method', '')
                            row.cells[7].text = item.get('inprocess_fixture', 'No')
                            row.cells[8].text = item.get('location', '')
                            row.cells[9].text = item.get('cross_check_by', '')

    def _update_detail_slides(self, fai_items: List[Dict], project: Dict):
        """更新测试项详情页（第12页起）"""
        # 详情页从索引11开始（第12页）
        detail_start_idx = 11

        for idx, item in enumerate(fai_items):
            slide_idx = detail_start_idx + idx
            if slide_idx >= len(self.prs.slides):
                break

            slide = self.prs.slides[slide_idx]

            # 更新页面标题
            for shape in slide.shapes:
                if shape.has_text_frame:
                    text = shape.text_frame.text
                    if "MTD" in text and "Metrology Details" in text:
                        new_title = f"MTD | {project.get('project_name', '')} Metrology Details-{project.get('part_number', '')}"
                        self._set_text_keep_format(shape, new_title)

                # 更新详情表格
                if shape.has_table:
                    table = shape.table
                    self._update_detail_table(table, item)

    def _update_detail_table(self, table, item: Dict):
        """更新单个测试项详情表格"""
        # 详情表格结构：3行2列
        # 第1行：标题（测试项名称和规格）
        # 第2行：CPK | In-process
        # 第3行：测量方法详情

        if len(table.rows) >= 1:
            # 更新标题行
            header_text = f"{item.get('description', '')}  FAI {item.get('fai_num', '')} /SPC {item.get('spc', '')} :{item.get('specification', '')}"
            if len(table.rows[0].cells) >= 1:
                table.rows[0].cells[0].text = header_text

        if len(table.rows) >= 3:
            # 更新测量方法详情
            cpk_text = f"1.  Measurement Method ：{item.get('cpk_method', '')}\n"
            cpk_text += f"2.  Fixture ：{item.get('cpk_fixture', '/')}\n"
            cpk_text += f"3.  Measurement steps: {item.get('measurement_steps', 'See image')}"

            inprocess_text = f"1.  Measurement Method ：{item.get('inprocess_method', '')}\n"
            inprocess_text += f"2.  Fixture ：{item.get('inprocess_fixture', '/')}\n"
            inprocess_text += f"3.  Measurement steps: {item.get('measurement_steps', 'See image')}"

            if len(table.rows[2].cells) >= 2:
                table.rows[2].cells[0].text = cpk_text
                table.rows[2].cells[1].text = inprocess_text

    def _set_text_keep_format(self, shape, new_text: str):
        """设置文本，尽量保持原有格式"""
        if shape.has_text_frame:
            # 保存第一个段落的格式
            if shape.text_frame.paragraphs:
                para = shape.text_frame.paragraphs[0]
                if para.runs:
                    font = para.runs[0].font
                    font_name = font.name
                    font_size = font.size
                    font_bold = font.bold

                    # 清除并设置新文本
                    shape.text_frame.clear()
                    p = shape.text_frame.paragraphs[0]
                    run = p.add_run()
                    run.text = new_text

                    # 恢复格式
                    if font_name:
                        run.font.name = font_name
                    if font_size:
                        run.font.size = font_size
                    if font_bold is not None:
                        run.font.bold = font_bold
                else:
                    shape.text_frame.text = new_text
            else:
                shape.text_frame.text = new_text


def generate_mtd_ppt(project: Dict, equipment_list: List[Dict],
                     fixture_list: List[Dict], fai_items: List[Dict],
                     output_path: str) -> str:
    """便捷函数：生成 MTD PPT"""
    generator = MTDPPTGenerator()
    return generator.generate(project, equipment_list, fixture_list, fai_items, output_path)


def extract_images_from_ppt(ppt_path: str, output_dir: str) -> List[str]:
    """从 PPT 中提取所有图片"""
    prs = Presentation(ppt_path)
    os.makedirs(output_dir, exist_ok=True)

    image_paths = []
    img_count = 0

    for slide_idx, slide in enumerate(prs.slides):
        for shape in slide.shapes:
            if shape.shape_type == MSO_SHAPE_TYPE.PICTURE:
                img_count += 1
                image = shape.image
                image_bytes = image.blob
                image_ext = image.ext

                filename = f"slide{slide_idx+1}_img{img_count}.{image_ext}"
                filepath = os.path.join(output_dir, filename)

                with open(filepath, 'wb') as f:
                    f.write(image_bytes)

                image_paths.append(filepath)

    return image_paths
