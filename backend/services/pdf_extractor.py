"""
@file pdf_extractor.py
@desc PDF图纸FAI尺寸数据提取服务 - 增强版
@input PDF文件路径
@output FAI数据列表
支持格式:
  - 尺寸公差: 10.50 ±0.05
  - 几何公差: 0.03 A (平面度/平行度等)
  - 范围公差: 0.10 MAX / 0.05 MIN
"""

import pdfplumber
import re
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, asdict, field


@dataclass
class FAIData:
    """FAI数据结构"""
    fai_num: int
    spc: Optional[str]
    nom: Optional[str]
    upper_tol: Optional[str]
    lower_tol: Optional[str]
    description: str
    page: int
    tol_type: str = "dimensional"  # dimensional, geometric, range

    def to_dict(self) -> dict:
        d = asdict(self)
        # 移除内部字段
        d.pop('tol_type', None)
        return d


class PDFExtractor:
    """PDF FAI数据提取器 - 增强版，针对CAD转PDF优化"""

    # 几何公差符号映射
    GDT_SYMBOLS = {
        '//': '平行度 (Parallelism)',
        '⊥': '垂直度 (Perpendicularity)',
        '—': '平面度 (Flatness)',
        '○': '圆度 (Circularity)',
        '◎': '同心度 (Concentricity)',
        '↗': '位置度 (Position)',
        '⌀': '直径 (Diameter)',
        'R': '半径 (Radius)',
    }

    def __init__(self, search_radius: int = 350):
        self.search_radius = search_radius

    def extract_fai_from_pdf(self, pdf_path: str) -> List[FAIData]:
        """从PDF提取FAI标注和对应尺寸数据"""
        results = []

        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages):
                # 提取所有文字及其位置
                words = page.extract_words(
                    keep_blank_chars=True,
                    x_tolerance=3,
                    y_tolerance=3
                )

                # 查找所有FAI标注
                fai_positions = self._find_all_fai(words)

                for fai_num, fai_info in fai_positions.items():
                    # 提取该FAI的完整数据
                    fai_data = self._extract_fai_data(
                        words, fai_info, fai_num, page_num + 1
                    )
                    if fai_data:
                        results.append(fai_data)

        return self._deduplicate_fai(results)

    def _find_all_fai(self, words: List[Dict]) -> Dict[int, Dict]:
        """查找所有FAI标注及其位置"""
        fai_positions = {}

        for i, w in enumerate(words):
            if w['text'] == 'FAI':
                fai_x, fai_y = w['x0'], w['top']

                # 在附近查找FAI编号
                for j in range(i + 1, min(i + 8, len(words))):
                    nw = words[j]
                    dist = ((nw['x0'] - fai_x)**2 + (nw['top'] - fai_y)**2)**0.5

                    if dist < 60 and re.match(r'^[0-9]{1,2}$', nw['text']):
                        fai_num = int(nw['text'])
                        if 1 <= fai_num <= 50:
                            fai_positions[fai_num] = {
                                'x': fai_x,
                                'y': fai_y,
                                'index': i
                            }
                        break

        return fai_positions

    def _extract_fai_data(
        self,
        words: List[Dict],
        fai_info: Dict,
        fai_num: int,
        page: int
    ) -> Optional[FAIData]:
        """提取单个FAI的完整数据"""
        fai_x, fai_y = fai_info['x'], fai_info['y']

        # 收集FAI附近的所有文本
        nearby_texts = self._collect_nearby_texts(words, fai_x, fai_y)

        # 查找SPC编号
        spc = self._find_spc(words, fai_info['index'], fai_x, fai_y)

        # 尝试不同的解析策略
        result = None

        # 策略1: 查找尺寸公差 (如 10.50 ±0.05 或 10.50 0.05)
        result = self._parse_dimensional_tolerance(nearby_texts, fai_x, fai_y)

        # 策略2: 查找范围公差 (如 0.10 MAX / 0.05 MIN)
        if not result or result[0] == '-':
            range_result = self._parse_range_tolerance(nearby_texts)
            if range_result and range_result[0] != '-':
                result = range_result

        # 策略3: 查找几何公差 (如 0.03 A)
        if not result or result[0] == '-':
            geo_result = self._parse_geometric_tolerance(nearby_texts)
            if geo_result and geo_result[0] != '-':
                result = geo_result

        if result:
            nom, upper_tol, lower_tol, description = result
            return FAIData(
                fai_num=fai_num,
                spc=spc,
                nom=nom,
                upper_tol=upper_tol,
                lower_tol=lower_tol,
                description=description,
                page=page
            )

        return FAIData(
            fai_num=fai_num,
            spc=spc,
            nom='-',
            upper_tol='-',
            lower_tol='-',
            description='',
            page=page
        )

    def _collect_nearby_texts(
        self,
        words: List[Dict],
        fai_x: float,
        fai_y: float
    ) -> List[Dict]:
        """收集FAI附近的所有文本"""
        nearby = []

        for w in words:
            dx = w['x0'] - fai_x
            dy = w['top'] - fai_y
            dist = (dx**2 + dy**2)**0.5

            if dist < self.search_radius:
                nearby.append({
                    'text': w['text'],
                    'x': w['x0'],
                    'y': w['top'],
                    'x1': w.get('x1', w['x0'] + 20),
                    'dist': dist,
                    'dx': dx,
                    'dy': dy
                })

        nearby.sort(key=lambda x: x['dist'])
        return nearby

    def _find_spc(
        self,
        words: List[Dict],
        fai_index: int,
        fai_x: float,
        fai_y: float
    ) -> Optional[str]:
        """查找SPC编号"""
        # 方法1: 在FAI附近直接查找单个字母
        for j in range(fai_index + 1, min(fai_index + 15, len(words))):
            nw = words[j]
            dist = ((nw['x0'] - fai_x)**2 + (nw['top'] - fai_y)**2)**0.5

            if dist < 100:
                # 查找SPC标记后的字母
                if nw['text'] == 'SPC':
                    for k in range(j + 1, min(j + 5, len(words))):
                        if re.match(r'^[A-Z]$', words[k]['text']):
                            return words[k]['text']

        # 方法2: 直接在附近查找独立的字母（排除常见非SPC字母）
        for j in range(fai_index + 1, min(fai_index + 12, len(words))):
            nw = words[j]
            dist = ((nw['x0'] - fai_x)**2 + (nw['top'] - fai_y)**2)**0.5

            if dist < 80 and re.match(r'^[A-Z]$', nw['text']):
                if nw['text'] not in ['X', 'R', 'N', 'M', 'S', 'P', 'C', 'H', 'V']:
                    return nw['text']

        return None

    def _parse_dimensional_tolerance(
        self,
        nearby_texts: List[Dict],
        fai_x: float,
        fai_y: float
    ) -> Optional[Tuple[str, str, str, str]]:
        """
        解析尺寸公差
        格式: 标准值 ±公差 或 标准值 公差
        例如: 10.50 ±0.05, 6.437 0.04, 0.352 0.025
        """
        # 分类文本
        tolerances = []  # 公差值 (小数, 通常 < 1)
        nominals = []    # 标准值 (通常 >= 0.1)

        for item in nearby_texts:
            text = item['text'].strip()

            # 跳过FAI/SPC等标记
            if text in ['FAI', 'SPC', '100%', 'MAX', 'MIN']:
                continue

            # 检查是否是数值
            # 匹配: 0.05, 0.025, 10.50, 6.437 等
            if re.match(r'^[0-9]+\.?[0-9]*$', text):
                try:
                    val = float(text)
                    if val < 0.5 and '.' in text:
                        # 小数值可能是公差
                        tolerances.append(item)
                    elif val >= 0.01:
                        # 可能是标准值
                        nominals.append(item)
                except:
                    pass

        # 查找最佳的 标准值-公差 配对
        best_pair = None
        best_score = float('inf')

        for tol in tolerances:
            tol_x, tol_y = tol['x'], tol['y']

            for nom in nominals:
                nom_x, nom_y = nom['x'], nom['y']

                # 标准值应该在公差的左边，同一水平线
                dx = tol_x - nom_x  # 公差在标准值右边，dx > 0
                dy = abs(tol_y - nom_y)

                # 条件: 标准值在公差左边，垂直距离小，水平距离合理
                if dx > 5 and dx < 200 and dy < 25:
                    # 计算得分: 优先选择离FAI近且垂直对齐的
                    score = tol['dist'] + dy * 5

                    # 额外判断: 标准值应该比公差大
                    try:
                        nom_val = float(nom['text'])
                        tol_val = float(tol['text'])
                        if nom_val > tol_val:
                            score -= 50  # 奖励
                    except:
                        pass

                    if score < best_score:
                        best_score = score
                        best_pair = (nom, tol)

        if best_pair:
            nom_item, tol_item = best_pair
            nom_val = nom_item['text']
            tol_val = tol_item['text']
            return (nom_val, f'+{tol_val}', f'-{tol_val}', '')

        # 备选: 只找到标准值
        for item in nearby_texts:
            text = item['text']
            if re.match(r'^\d+\.?\d*$', text):
                try:
                    val = float(text)
                    if val >= 0.5:
                        return (text, '-', '-', '')
                except:
                    pass

        return None

    def _parse_range_tolerance(
        self,
        nearby_texts: List[Dict]
    ) -> Optional[Tuple[str, str, str, str]]:
        """
        解析范围公差
        格式: 0.10 MAX / 0.05 MIN 或 R 0.10 MAX
        """
        max_val = None
        min_val = None

        texts = [t['text'] for t in nearby_texts[:30]]
        full_text = ' '.join(texts)

        # 查找 MAX 值
        for i, item in enumerate(nearby_texts[:25]):
            if item['text'].upper() == 'MAX':
                # 向前查找数值
                for j in range(i - 1, max(0, i - 5), -1):
                    if re.match(r'^[0-9]+\.?[0-9]*$', nearby_texts[j]['text']):
                        max_val = nearby_texts[j]['text']
                        break

        # 查找 MIN 值
        for i, item in enumerate(nearby_texts[:25]):
            if item['text'].upper() == 'MIN':
                # 向前查找数值
                for j in range(i - 1, max(0, i - 5), -1):
                    if re.match(r'^[0-9]+\.?[0-9]*$', nearby_texts[j]['text']):
                        min_val = nearby_texts[j]['text']
                        break

        if max_val or min_val:
            description = ''
            # 检查是否是半径
            if 'R' in full_text.upper()[:20]:
                description = '圆角半径 (Radius)'

            return (
                '-',  # 范围公差不定义标准值
                f'{max_val} MAX' if max_val else '-',
                f'{min_val} MIN' if min_val else '-',
                description
            )

        return None

    def _parse_geometric_tolerance(
        self,
        nearby_texts: List[Dict]
    ) -> Optional[Tuple[str, str, str, str]]:
        """
        解析几何公差
        格式: 0.03 A 或 // 0.03 A
        几何公差的标准值为0，公差带为整个值
        """
        texts = [t['text'] for t in nearby_texts[:20]]

        # 查找几何公差值（通常是很小的数，如0.03, 0.08）
        for i, item in enumerate(nearby_texts[:15]):
            text = item['text']

            # 匹配几何公差值 (0.0x 格式)
            if re.match(r'^0\.0[0-9]+$', text):
                tol_val = text

                # 查找关联的基准 (单个大写字母)
                datum = None
                for j in range(i + 1, min(i + 5, len(nearby_texts))):
                    next_text = nearby_texts[j]['text']
                    if re.match(r'^[A-C]$', next_text):  # 基准通常是 A, B, C
                        datum = next_text
                        break

                # 判断几何公差类型
                description = '几何公差'
                if datum:
                    description = f'几何公差 @ 基准 {datum}'

                # 检查是否有几何符号
                for t in texts[:10]:
                    if '//' in t or t == '//':
                        description = f'平行度 (Parallelism) to {datum}' if datum else '平行度'
                        break
                    elif '⊥' in t:
                        description = f'垂直度 (Perpendicularity) to {datum}' if datum else '垂直度'
                        break

                return ('0', tol_val, '0', description)

        return None

    def _deduplicate_fai(self, results: List[FAIData]) -> List[FAIData]:
        """去重，保留最完整的数据"""
        seen = {}

        for r in results:
            key = r.fai_num

            if key not in seen:
                seen[key] = r
            else:
                existing = seen[key]
                # 优先保留有完整数据的
                new_score = self._data_completeness_score(r)
                old_score = self._data_completeness_score(existing)

                if new_score > old_score:
                    seen[key] = r

        return sorted(seen.values(), key=lambda x: x.fai_num)

    def _data_completeness_score(self, data: FAIData) -> int:
        """计算数据完整性得分"""
        score = 0
        if data.nom and data.nom != '-':
            score += 3
        if data.upper_tol and data.upper_tol != '-':
            score += 2
        if data.lower_tol and data.lower_tol != '-':
            score += 2
        if data.spc:
            score += 1
        if data.description:
            score += 1
        return score


def extract_fai(pdf_path: str, search_radius: int = 350) -> List[dict]:
    """
    提取PDF中的FAI数据

    Args:
        pdf_path: PDF文件路径
        search_radius: 搜索半径 (默认350像素)

    Returns:
        FAI数据字典列表
    """
    extractor = PDFExtractor(search_radius)
    results = extractor.extract_fai_from_pdf(pdf_path)
    return [r.to_dict() for r in results]


# ============ 调试用 ============
if __name__ == '__main__':
    import sys
    import json

    if len(sys.argv) > 1:
        pdf_path = sys.argv[1]
        results = extract_fai(pdf_path)
        print(json.dumps(results, ensure_ascii=False, indent=2))
    else:
        print("Usage: python pdf_extractor.py <pdf_path>")
