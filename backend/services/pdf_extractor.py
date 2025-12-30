"""
@file pdf_extractor.py
@desc PDF图纸FAI尺寸数据提取服务 - 全面增强版
@input PDF文件路径
@output FAI数据列表
支持格式:
  - 尺寸公差: 0.352 ±0.025 → 厚度/距离
  - 几何公差框:
    - ⌒ 线轮廓度 (Profile of a Line)
    - ▱ 平面度 (Flatness)
    - // 平行度 (Parallelism)
    - ⊥ 垂直度 (Perpendicularity)
  - 范围公差: R 0.10 MAX / 0.05 MIN → 圆角半径
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
    nom: Optional[str]
    upper_tol: Optional[str]
    lower_tol: Optional[str]
    measure_type: str  # 测量类型：厚度/距离、平面度、平行度、线轮廓度、圆角半径等
    description: str
    page: int

    def to_dict(self) -> dict:
        return asdict(self)


class PDFExtractor:
    """PDF FAI数据提取器 - 全面增强版"""

    # 几何公差符号映射 - 完整GD&T符号表
    GDT_SYMBOLS = {
        # 形状公差 (Form)
        '⌒': '线轮廓度',      # Profile of a Line
        '⏜': '线轮廓度',      # 替代符号
        '▱': '平面度',        # Flatness
        '⏥': '平面度',        # 替代符号
        '○': '圆度',          # Circularity
        '⌭': '圆柱度',        # Cylindricity
        '—': '直线度',        # Straightness

        # 方向公差 (Orientation)
        '//': '平行度',       # Parallelism
        '⊥': '垂直度',        # Perpendicularity
        '∠': '倾斜度',        # Angularity

        # 位置公差 (Location)
        '⌖': '位置度',        # Position
        '◎': '同心度',        # Concentricity
        '⊚': '对称度',        # Symmetry

        # 跳动公差 (Runout)
        '↗': '圆跳动',        # Circular Runout
        '↗↗': '全跳动',       # Total Runout

        # 轮廓公差 (Profile)
        '⌓': '面轮廓度',      # Profile of a Surface
    }

    def __init__(self, search_radius: int = 500):
        """
        初始化提取器
        Args:
            search_radius: 搜索半径，增大以匹配更远的标注
        """
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

                # 查找所有SPC标注
                spc_positions = self._find_all_spc(words)

                for fai_num, fai_info in fai_positions.items():
                    # 提取该FAI的完整数据
                    fai_data = self._extract_fai_data(
                        words, fai_info, fai_num, page_num + 1, spc_positions
                    )
                    if fai_data:
                        results.append(fai_data)

        return self._deduplicate_fai(results)

    def _find_all_fai(self, words: List[Dict]) -> Dict[int, Dict]:
        """查找所有FAI标注及其位置"""
        fai_positions = {}

        for i, w in enumerate(words):
            text = w['text'].strip()

            # 匹配 "FAI" 文字
            if text == 'FAI':
                fai_x, fai_y = w['x0'], w['top']

                # 在附近查找FAI编号
                for j in range(i + 1, min(i + 10, len(words))):
                    nw = words[j]
                    dist = ((nw['x0'] - fai_x)**2 + (nw['top'] - fai_y)**2)**0.5

                    if dist < 80 and re.match(r'^[0-9]{1,2}$', nw['text'].strip()):
                        fai_num = int(nw['text'].strip())
                        if 1 <= fai_num <= 99:
                            fai_positions[fai_num] = {
                                'x': fai_x,
                                'y': fai_y,
                                'index': i
                            }
                        break

            # 也匹配合并的 "FAI4" "FAI12" 等格式
            match = re.match(r'^FAI\s*(\d{1,2})$', text)
            if match:
                fai_num = int(match.group(1))
                if 1 <= fai_num <= 99:
                    fai_positions[fai_num] = {
                        'x': w['x0'],
                        'y': w['top'],
                        'index': i
                    }

        return fai_positions

    def _find_all_spc(self, words: List[Dict]) -> Dict[str, Dict]:
        """查找所有SPC标注及其位置"""
        spc_positions = {}

        for i, w in enumerate(words):
            text = w['text'].strip()

            # 匹配 "SPC" 文字
            if text == 'SPC':
                spc_x, spc_y = w['x0'], w['top']

                # 在附近查找SPC字母
                for j in range(i + 1, min(i + 8, len(words))):
                    nw = words[j]
                    dist = ((nw['x0'] - spc_x)**2 + (nw['top'] - spc_y)**2)**0.5

                    if dist < 60 and re.match(r'^[A-Z]$', nw['text'].strip()):
                        spc_letter = nw['text'].strip()
                        spc_positions[spc_letter] = {
                            'x': spc_x,
                            'y': spc_y,
                            'letter': spc_letter
                        }
                        break

        return spc_positions

    def _extract_fai_data(
        self,
        words: List[Dict],
        fai_info: Dict,
        fai_num: int,
        page: int,
        spc_positions: Dict[str, Dict]
    ) -> Optional[FAIData]:
        """提取单个FAI的完整数据"""
        fai_x, fai_y = fai_info['x'], fai_info['y']

        # 收集FAI附近的所有文本（扩大范围）
        nearby_texts = self._collect_nearby_texts(words, fai_x, fai_y)

        # 查找最近的SPC编号
        spc = self._find_nearest_spc(fai_x, fai_y, spc_positions)

        # 收集附近的描述文字
        description_texts = self._collect_description_texts(nearby_texts)

        # 尝试不同的解析策略（按优先级）
        result = None

        # 策略1: 查找几何公差框 (GD&T符号)
        result = self._parse_gdt_frame(nearby_texts)

        # 策略2: 查找范围公差 (如 R 0.10 MAX / 0.05 MIN) - 圆角半径
        if not result:
            result = self._parse_range_tolerance(nearby_texts)

        # 策略3: 查找尺寸公差 (如 0.352 ±0.025) - 厚度/距离
        if not result:
            result = self._parse_dimensional_tolerance(nearby_texts, fai_x, fai_y)

        # 策略4: 查找独立几何公差值 (如单独的 0.03)
        if not result:
            result = self._parse_geometric_tolerance(nearby_texts)

        if result:
            nom, upper_tol, lower_tol, measure_type, tol_description = result
            # 合并描述
            full_description = tol_description
            if description_texts:
                if full_description:
                    full_description = f"{full_description} | {description_texts}"
                else:
                    full_description = description_texts

            return FAIData(
                fai_num=fai_num,
                spc=spc,
                nom=nom,
                upper_tol=upper_tol,
                lower_tol=lower_tol,
                measure_type=measure_type,
                description=full_description,
                page=page
            )

        return FAIData(
            fai_num=fai_num,
            spc=spc,
            nom='-',
            upper_tol='-',
            lower_tol='-',
            measure_type='未识别',
            description=description_texts or '',
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
                    'text': w['text'].strip(),
                    'x': w['x0'],
                    'y': w['top'],
                    'x1': w.get('x1', w['x0'] + 20),
                    'dist': dist,
                    'dx': dx,
                    'dy': dy
                })

        nearby.sort(key=lambda x: x['dist'])
        return nearby

    def _find_nearest_spc(
        self,
        fai_x: float,
        fai_y: float,
        spc_positions: Dict[str, Dict]
    ) -> Optional[str]:
        """查找距离FAI最近的SPC标注"""
        min_dist = float('inf')
        nearest_spc = None

        for letter, pos in spc_positions.items():
            dist = ((pos['x'] - fai_x)**2 + (pos['y'] - fai_y)**2)**0.5
            if dist < 150 and dist < min_dist:
                min_dist = dist
                nearest_spc = letter

        return nearest_spc

    def _collect_description_texts(self, nearby_texts: List[Dict]) -> str:
        """收集附近的描述性文字"""
        descriptions = []

        # 常见的描述性关键词
        keywords = [
            'AFTER', 'BEFORE', 'PLATING', 'TUMBLING', 'NATURAL', 'RADII',
            'TYP', 'REF', 'BASIC', 'BSC', 'FULL', 'PERIPHERY'
        ]

        for item in nearby_texts[:40]:
            text = item['text'].upper()
            # 检查是否包含描述性关键词
            for kw in keywords:
                if kw in text and len(item['text']) > 2:
                    # 排除纯数字和FAI/SPC/MAX/MIN标记
                    if not re.match(r'^[\d.±]+$', item['text']):
                        if item['text'].upper() not in ['FAI', 'SPC', 'MAX', 'MIN']:
                            descriptions.append(item['text'])
                            break

        # 去重并合并
        seen = set()
        unique_desc = []
        for d in descriptions:
            if d.upper() not in seen:
                seen.add(d.upper())
                unique_desc.append(d)

        return ' '.join(unique_desc[:5])

    def _parse_gdt_frame(
        self,
        nearby_texts: List[Dict]
    ) -> Optional[Tuple[str, str, str, str, str]]:
        """
        解析几何公差框 (GD&T)
        返回: (nom, upper_tol, lower_tol, measure_type, description)

        支持的符号:
        - ⌒ 线轮廓度 (Profile of a Line)
        - ▱ 平面度 (Flatness)
        - // 平行度 (Parallelism)
        - ⊥ 垂直度 (Perpendicularity)
        - ○ 圆度 (Circularity)
        """
        texts = [t['text'] for t in nearby_texts[:35]]
        texts_str = ' '.join(texts)

        # 查找几何公差符号
        measure_type = None

        # 检测各种GD&T符号
        for i, text in enumerate(texts):
            # 线轮廓度 ⌒
            if text in ['⌒', '⏜'] or '⌒' in text or '⏜' in text:
                measure_type = '线轮廓度'
                break

            # 平面度 ▱
            if text in ['▱', '⏥', '◇', '◊'] or '▱' in text:
                measure_type = '平面度'
                break

            # 平行度 //
            if text == '//' or (len(text) >= 2 and '//' in text):
                measure_type = '平行度'
                break

            # 垂直度 ⊥
            if text == '⊥' or '⊥' in text:
                measure_type = '垂直度'
                break

            # 圆度 ○
            if text == '○' or '○' in text:
                measure_type = '圆度'
                break

            # 同心度 ◎
            if text == '◎' or '◎' in text:
                measure_type = '同心度'
                break

            # 位置度 ⌖
            if text == '⌖' or '⌖' in text:
                measure_type = '位置度'
                break

        if not measure_type:
            return None

        # 在符号附近查找公差值和基准
        tol_value = None
        datum = None

        for item in nearby_texts[:30]:
            text = item['text']

            # 查找公差值 (0.0x 或 0.xx 格式)
            if re.match(r'^0\.\d{2,3}$', text):
                if not tol_value:
                    tol_value = text

            # 查找基准字母 (A, B, C)
            if re.match(r'^[A-C]$', text) and item['dist'] < 200:
                if not datum:
                    datum = text

        if tol_value:
            description = ''
            if datum:
                description = f'基准 {datum}'

            return ('0', tol_value, '0', measure_type, description)

        return None

    def _parse_dimensional_tolerance(
        self,
        nearby_texts: List[Dict],
        fai_x: float,
        fai_y: float
    ) -> Optional[Tuple[str, str, str, str, str]]:
        """
        解析尺寸公差 - 厚度/距离
        格式: 标准值 ±公差 或 标准值 公差
        例如: 0.352 ±0.025, 10.50 ±0.05
        返回: (nom, upper_tol, lower_tol, measure_type, description)
        """
        # 首先检查是否有 ± 符号连接的格式
        for item in nearby_texts[:30]:
            text = item['text']
            # 匹配 "0.352±0.025" 或 "0.352 ±0.025" 合并格式
            match = re.match(r'^(\d+\.?\d*)\s*[±]\s*(\d+\.?\d*)$', text)
            if match:
                nom = match.group(1)
                tol = match.group(2)
                return (nom, f'+{tol}', f'-{tol}', '厚度/距离', '')

        # 分类文本
        tolerances = []  # 公差值 (小数, 通常 < 0.5)
        nominals = []    # 标准值

        for item in nearby_texts[:40]:
            text = item['text']

            # 跳过标记
            if text.upper() in ['FAI', 'SPC', '100%', 'MAX', 'MIN', 'R', 'A', 'B', 'C', '//', 'TYP']:
                continue

            # 匹配带±的公差
            if '±' in text:
                match = re.match(r'[±]?\s*(\d+\.?\d*)$', text.replace('±', ''))
                if match:
                    tolerances.append({**item, 'value': float(match.group(1))})
                continue

            # 匹配纯数值
            if re.match(r'^\d+\.?\d*$', text):
                try:
                    val = float(text)
                    # 根据数值大小和小数位数判断类型
                    if val < 0.5 and '.' in text and len(text.split('.')[-1]) >= 2:
                        # 小数值，可能是公差
                        tolerances.append({**item, 'value': val})
                    else:
                        # 可能是标准值
                        nominals.append({**item, 'value': val})
                except:
                    pass

        # 查找最佳的 标准值-公差 配对
        best_pair = None
        best_score = float('inf')

        for tol in tolerances:
            tol_x, tol_y = tol['x'], tol['y']

            for nom in nominals:
                nom_x, nom_y = nom['x'], nom['y']

                # 计算相对位置
                dx = tol_x - nom_x
                dy = abs(tol_y - nom_y)

                # 条件: 同一水平线或垂直相邻
                horizontal_match = (abs(dx) < 250 and dy < 30)
                vertical_match = (abs(dx) < 50 and 0 < dy < 40)

                if horizontal_match or vertical_match:
                    score = tol['dist'] + nom['dist'] + dy * 3

                    # 标准值应该比公差大
                    if nom['value'] > tol['value']:
                        score -= 30

                    if score < best_score:
                        best_score = score
                        best_pair = (nom, tol)

        if best_pair:
            nom_item, tol_item = best_pair
            nom_val = nom_item['text']
            tol_val = tol_item['text'].replace('±', '')
            return (nom_val, f'+{tol_val}', f'-{tol_val}', '厚度/距离', '')

        # 备选: 只找到标准值
        if nominals:
            best_nom = min(nominals, key=lambda x: x['dist'])
            if best_nom['dist'] < 200:
                return (best_nom['text'], '-', '-', '厚度/距离', '')

        return None

    def _parse_range_tolerance(
        self,
        nearby_texts: List[Dict]
    ) -> Optional[Tuple[str, str, str, str, str]]:
        """
        解析范围公差 - 圆角半径
        格式: R 0.10 MAX / 0.05 MIN 或 0.10 MAX
        返回: (nom, upper_tol, lower_tol, measure_type, description)
        """
        max_val = None
        min_val = None
        has_radius = False

        texts_str = ' '.join([t['text'] for t in nearby_texts[:35]])

        # 检查是否是半径 (R 或 RADII)
        if re.search(r'\bR\b', texts_str) or 'RADII' in texts_str.upper():
            has_radius = True

        # 查找 MAX 值
        for i, item in enumerate(nearby_texts[:30]):
            text = item['text'].upper()
            if text == 'MAX':
                # 向前查找数值
                for j in range(i - 1, max(0, i - 6), -1):
                    prev_text = nearby_texts[j]['text']
                    if re.match(r'^[\d.]+$', prev_text):
                        max_val = prev_text
                        break

        # 查找 MIN 值
        for i, item in enumerate(nearby_texts[:30]):
            text = item['text'].upper()
            if text == 'MIN':
                # 向前查找数值
                for j in range(i - 1, max(0, i - 6), -1):
                    prev_text = nearby_texts[j]['text']
                    if re.match(r'^[\d.]+$', prev_text):
                        min_val = prev_text
                        break

        if max_val or min_val:
            # 如果有 R 或 RADII，则是圆角半径
            measure_type = '圆角半径' if has_radius else '范围公差'
            description = ''

            return (
                '-',
                f'{max_val} MAX' if max_val else '-',
                f'{min_val} MIN' if min_val else '-',
                measure_type,
                description
            )

        return None

    def _parse_geometric_tolerance(
        self,
        nearby_texts: List[Dict]
    ) -> Optional[Tuple[str, str, str, str, str]]:
        """
        解析独立几何公差值（没有明确符号时的备用）
        格式: 单独的 0.03 等小数值
        返回: (nom, upper_tol, lower_tol, measure_type, description)
        """
        # 查找几何公差值 (0.0x 格式)
        for item in nearby_texts[:20]:
            text = item['text']

            # 匹配几何公差值 (0.0x 或 0.00x 格式)
            if re.match(r'^0\.0\d{1,2}$', text):
                tol_val = text

                # 查找关联的基准 (单个大写字母)
                datum = None
                for j_item in nearby_texts[:25]:
                    if j_item['dist'] < 200:
                        if re.match(r'^[A-C]$', j_item['text']):
                            datum = j_item['text']
                            break

                measure_type = '几何公差'
                description = ''
                if datum:
                    description = f'基准 {datum}'

                return ('0', tol_val, '0', measure_type, description)

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
        if data.measure_type and data.measure_type != '未识别':
            score += 2
        if data.description:
            score += 1
        return score


def extract_fai(pdf_path: str, search_radius: int = 500) -> List[dict]:
    """
    提取PDF中的FAI数据

    Args:
        pdf_path: PDF文件路径
        search_radius: 搜索半径 (默认500像素)

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
