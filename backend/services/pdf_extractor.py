"""
@file pdf_extractor.py
@desc PDF图纸FAI尺寸数据提取服务
@input PDF文件路径
@output FAI数据列表
"""

import pdfplumber
import re
from typing import List, Dict, Optional
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
    """PDF FAI数据提取器"""

    def __init__(self, search_radius: int = 200):
        self.search_radius = search_radius

    def extract_fai_from_pdf(self, pdf_path: str) -> List[FAIData]:
        """
        从PDF提取FAI标注和对应尺寸数据

        Args:
            pdf_path: PDF文件路径

        Returns:
            FAI数据列表
        """
        results = []

        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages):
                words = page.extract_words()

                # 遍历查找FAI标注
                for i, w in enumerate(words):
                    if w['text'] == 'FAI':
                        fai_x, fai_y = w['x0'], w['top']

                        # 查找FAI编号和SPC字母
                        fai_num, spc_letter = self._find_fai_identifiers(
                            words, i, fai_x, fai_y
                        )

                        if fai_num and 1 <= fai_num <= 50:
                            # 查找附近的尺寸值
                            nearby_dims = self._find_nearby_dimensions(
                                words, fai_x, fai_y, self.search_radius
                            )

                            # 解析标准值和公差
                            nom, upper_tol, lower_tol = self._parse_dimension_tolerance(
                                nearby_dims
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

        # 去重（按FAI编号）
        return self._deduplicate_fai(results)

    def _find_fai_identifiers(
        self,
        words: List[Dict],
        start_idx: int,
        fai_x: float,
        fai_y: float
    ) -> tuple:
        """查找FAI编号和SPC字母"""
        fai_num = None
        spc_letter = None

        for j in range(start_idx + 1, min(start_idx + 8, len(words))):
            nw = words[j]
            dist = ((nw['x0'] - fai_x)**2 + (nw['top'] - fai_y)**2)**0.5

            if dist < 60:
                # 查找FAI编号（1-2位数字）
                if fai_num is None and re.match(r'^[0-9]{1,2}$', nw['text']):
                    fai_num = int(nw['text'])

                # 查找SPC字母（单个大写字母，排除常见非SPC字母）
                if spc_letter is None and re.match(r'^[A-Z]$', nw['text']):
                    if nw['text'] not in ['X', 'R', 'N', 'M']:
                        spc_letter = nw['text']

        return fai_num, spc_letter

    def _find_nearby_dimensions(
        self,
        words: List[Dict],
        fai_x: float,
        fai_y: float,
        radius: int
    ) -> List[Dict]:
        """查找FAI标注附近的尺寸值"""
        nearby = []

        for tw in words:
            # 匹配数值格式（整数或小数）
            if re.match(r'^[0-9]+\.?[0-9]*$', tw['text']):
                dx = tw['x0'] - fai_x
                dy = tw['top'] - fai_y
                dist = (dx**2 + dy**2)**0.5

                # 尺寸通常在FAI标注的左边或上方
                if dist < radius and dx < 100:
                    try:
                        nearby.append({
                            'value': tw['text'],
                            'dist': dist,
                            'x': tw['x0'],
                            'y': tw['top']
                        })
                    except ValueError:
                        pass

        # 按距离排序
        nearby.sort(key=lambda x: x['dist'])
        return nearby[:5]

    def _parse_dimension_tolerance(self, nearby_dims: List[Dict]) -> tuple:
        """解析标准值和公差"""
        if not nearby_dims:
            return '-', '-', '-'

        nom = nearby_dims[0]['value']

        # 如果有第二个数值且距离较近，可能是公差
        if len(nearby_dims) > 1 and nearby_dims[1]['dist'] < 100:
            tol_val = nearby_dims[1]['value']
            try:
                tol = float(tol_val)
                if tol < 1:  # 公差通常是小数值
                    return nom, f'+{tol_val}', f'-{tol_val}'
            except ValueError:
                pass

        return nom, '-', '-'

    def _deduplicate_fai(self, results: List[FAIData]) -> List[FAIData]:
        """去重，保留有效数据"""
        seen = {}
        for r in results:
            if r.fai_num not in seen:
                seen[r.fai_num] = r
            elif r.nom != '-' and seen[r.fai_num].nom == '-':
                seen[r.fai_num] = r

        return sorted(seen.values(), key=lambda x: x.fai_num)


# 便捷函数
def extract_fai(pdf_path: str, search_radius: int = 200) -> List[dict]:
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
