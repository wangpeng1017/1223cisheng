"""
@file pdf_extractor.py
@desc PDF图纸FAI尺寸数据提取服务 - 优化版
@input PDF文件路径
@output FAI数据列表
"""

import pdfplumber
import re
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, asdict


@dataclass
class FAIData:
    """FAI数据结构"""
    fai_num: int
    spc: Optional[str]
    nom: str
    upper_tol: str
    lower_tol: str
    description: str
    page: int

    def to_dict(self) -> dict:
        return asdict(self)


class PDFExtractor:
    """PDF FAI数据提取器 - 针对CAD转PDF优化"""

    def __init__(self, search_radius: int = 300):
        self.search_radius = search_radius

    def extract_fai_from_pdf(self, pdf_path: str) -> List[FAIData]:
        """从PDF提取FAI标注和对应尺寸数据"""
        results = []

        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages):
                words = page.extract_words()

                # 构建文本位置索引
                text_items = self._build_text_index(words)

                # 遍历查找FAI标注
                for i, w in enumerate(words):
                    if w['text'] == 'FAI':
                        fai_x, fai_y = w['x0'], w['top']

                        # 查找FAI编号和SPC字母
                        fai_num, spc_letter = self._find_fai_identifiers(
                            words, i, fai_x, fai_y
                        )

                        if fai_num and 1 <= fai_num <= 50:
                            # 查找尺寸标注（标准值±公差格式）
                            nom, upper_tol, lower_tol = self._find_dimension_with_tolerance(
                                text_items, fai_x, fai_y
                            )

                            results.append(FAIData(
                                fai_num=fai_num,
                                spc=spc_letter,
                                nom=nom,
                                upper_tol=upper_tol,
                                lower_tol=lower_tol,
                                description='',
                                page=page_num + 1
                            ))

        return self._deduplicate_fai(results)

    def _build_text_index(self, words: List[Dict]) -> List[Dict]:
        """构建文本位置索引，便于查找"""
        items = []
        for w in words:
            items.append({
                'text': w['text'],
                'x': w['x0'],
                'y': w['top'],
                'x1': w.get('x1', w['x0'] + 20),
                'y1': w.get('bottom', w['top'] + 10)
            })
        return items

    def _find_fai_identifiers(
        self,
        words: List[Dict],
        start_idx: int,
        fai_x: float,
        fai_y: float
    ) -> Tuple[Optional[int], Optional[str]]:
        """查找FAI编号和SPC字母"""
        fai_num = None
        spc_letter = None

        for j in range(start_idx + 1, min(start_idx + 10, len(words))):
            nw = words[j]
            dist = ((nw['x0'] - fai_x)**2 + (nw['top'] - fai_y)**2)**0.5

            if dist < 80:
                # 查找FAI编号（1-2位数字）
                if fai_num is None and re.match(r'^[0-9]{1,2}$', nw['text']):
                    fai_num = int(nw['text'])

                # 查找SPC字母
                if spc_letter is None and re.match(r'^[A-Z]$', nw['text']):
                    if nw['text'] not in ['X', 'R', 'N', 'M', 'S', 'P', 'C']:
                        spc_letter = nw['text']

        # 额外查找SPC标注
        if spc_letter is None:
            for j in range(start_idx + 1, min(start_idx + 15, len(words))):
                nw = words[j]
                if nw['text'] == 'SPC':
                    # SPC后面的字母
                    for k in range(j + 1, min(j + 5, len(words))):
                        if re.match(r'^[A-Z]$', words[k]['text']):
                            spc_letter = words[k]['text']
                            break
                    break

        return fai_num, spc_letter

    def _find_dimension_with_tolerance(
        self,
        text_items: List[Dict],
        fai_x: float,
        fai_y: float
    ) -> Tuple[str, str, str]:
        """
        查找FAI标注附近的尺寸标注
        格式: 标准值 ±公差 或 标准值 公差
        """
        # 收集附近的所有文本
        nearby_items = []
        for item in text_items:
            dx = item['x'] - fai_x
            dy = item['y'] - fai_y
            dist = (dx**2 + dy**2)**0.5

            if dist < self.search_radius:
                nearby_items.append({
                    **item,
                    'dist': dist,
                    'dx': dx,
                    'dy': dy
                })

        # 按距离排序
        nearby_items.sort(key=lambda x: x['dist'])

        # 策略1: 查找 "数值 ±数值" 或 "数值 数值" 格式的尺寸标注
        for item in nearby_items:
            text = item['text']

            # 匹配 "数值±公差" 格式 (如 "6.437±0.04")
            match = re.match(r'^(\d+\.?\d*)\s*[±]\s*(\d+\.?\d*)$', text)
            if match:
                nom = match.group(1)
                tol = match.group(2)
                return nom, f'+{tol}', f'-{tol}'

        # 策略2: 查找公差值，然后向左找标准值
        tolerance_items = []
        nominal_items = []

        for item in nearby_items:
            text = item['text']

            # 识别公差（小数值，通常 < 1）
            if re.match(r'^0\.\d+$', text):
                tolerance_items.append(item)
            # 识别标准值（大于等于1的数值）
            elif re.match(r'^\d+\.?\d*$', text):
                try:
                    val = float(text)
                    if val >= 0.1:  # 标准值通常 >= 0.1
                        nominal_items.append(item)
                except:
                    pass

        # 对每个公差值，找其左边最近的标准值
        best_pair = None
        best_score = float('inf')

        for tol_item in tolerance_items:
            tol_x, tol_y = tol_item['x'], tol_item['y']

            for nom_item in nominal_items:
                nom_x, nom_y = nom_item['x'], nom_item['y']

                # 标准值应该在公差的左边，且在同一水平线上
                dx = tol_x - nom_x
                dy = abs(tol_y - nom_y)

                # 标准值在公差左边 (dx > 0)，且垂直距离小
                if dx > 5 and dx < 150 and dy < 20:
                    # 计算与FAI的距离作为得分（越近越好）
                    fai_dist = tol_item['dist']
                    score = fai_dist + dy * 10  # 优先选择垂直对齐的

                    if score < best_score:
                        best_score = score
                        best_pair = (nom_item, tol_item)

        if best_pair:
            nom_item, tol_item = best_pair
            nom = nom_item['text']
            tol = tol_item['text']
            return nom, f'+{tol}', f'-{tol}'

        # 策略3: 如果没找到配对，取最近的数值作为标准值
        for item in nearby_items:
            text = item['text']
            if re.match(r'^\d+\.?\d*$', text):
                try:
                    val = float(text)
                    if val >= 0.1:
                        return text, '-', '-'
                except:
                    pass

        return '-', '-', '-'

    def _deduplicate_fai(self, results: List[FAIData]) -> List[FAIData]:
        """去重，保留有效数据"""
        seen = {}
        for r in results:
            if r.fai_num not in seen:
                seen[r.fai_num] = r
            elif r.nom != '-' and seen[r.fai_num].nom == '-':
                seen[r.fai_num] = r
            # 如果新的有公差而旧的没有，优先保留有公差的
            elif r.upper_tol != '-' and seen[r.fai_num].upper_tol == '-':
                seen[r.fai_num] = r

        return sorted(seen.values(), key=lambda x: x.fai_num)


def extract_fai(pdf_path: str, search_radius: int = 300) -> List[dict]:
    """
    提取PDF中的FAI数据

    Args:
        pdf_path: PDF文件路径
        search_radius: 搜索半径

    Returns:
        FAI数据字典列表
    """
    extractor = PDFExtractor(search_radius)
    results = extractor.extract_fai_from_pdf(pdf_path)
    return [r.to_dict() for r in results]
