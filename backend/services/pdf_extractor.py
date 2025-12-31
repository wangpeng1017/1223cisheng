# -*- coding: utf-8 -*-
"""
@file pdf_extractor.py
@desc PDF图纸FAI提取 - V3 增强版
@strategy 先识别数据块（几何尺寸+材料参数+表面参数），再匹配FAI
@version 3.0
"""

import pdfplumber
import re
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, asdict


@dataclass
class DataBlock:
    """测量数据块"""
    block_type: str       # 类型
    center_x: float       # 块中心X
    center_y: float       # 块中心Y
    symbol: str           # 符号
    nom: str              # 标准值
    upper_tol: str        # 上公差/上限
    lower_tol: str        # 下公差/下限
    description: str      # 描述
    unit: str = ''        # 单位


@dataclass
class FAIData:
    """FAI数据结构"""
    fai_num: int
    spc: Optional[str]
    nom: Optional[str]
    upper_tol: Optional[str]
    lower_tol: Optional[str]
    symbol: str
    measure_type: str
    description: str
    page: int
    category: str = '几何尺寸'
    alternatives: Optional[List[Dict]] = None  # 备选数据块列表

    def to_dict(self) -> dict:
        d = asdict(self)
        # alternatives 默认为 None 时转为空列表
        if d.get('alternatives') is None:
            d['alternatives'] = []
        return d


class PDFExtractorV3:
    """PDF FAI提取器 - V3 增强版"""

    def __init__(self):
        # 测量类型映射
        self.measure_type_map = {
            # 几何尺寸
            'radius': '圆角半径',
            'dimensional': '厚度/距离',
            'geometric_flatness': '平面度',
            'geometric_parallel': '平行度',
            'profile': '线轮廓度',
            # 材料性能
            'magnetic_br': '磁通密度(Br)',
            'magnetic_hcb': '矫顽力(Hcb)',
            'magnetic_hcj': '矫顽力(Hcj)',
            'magnetic_bhmax': '最大能积(BHmax)',
            'hardness': '硬度',
            # 表面处理
            'gloss': '光泽度',
            'roughness': '粗糙度(Ra)',
            'color_l': '颜色(L)',
            'color_a': '颜色(a)',
            'color_b': '颜色(b)',
            # 镀层规格
            'plating_top': '顶层镀层(NiP)',
            'plating_base': '底层镀层(Cu)',
            'plating_thickness': '镀层厚度',
            'magnet_thickness': '磁体厚度',
            # 工艺要求
            'visual_inspection': '外观检验',
            'salt_spray': '盐雾测试',
            'plating': '电镀要求',
            'text_spec': '文本规格',
            'unknown': '未识别'
        }

        # 分类映射
        self.category_map = {
            'radius': '几何尺寸',
            'dimensional': '几何尺寸',
            'geometric_flatness': '几何尺寸',
            'geometric_parallel': '几何尺寸',
            'profile': '几何尺寸',
            'magnetic_br': '材料性能',
            'magnetic_hcb': '材料性能',
            'magnetic_hcj': '材料性能',
            'magnetic_bhmax': '材料性能',
            'hardness': '材料性能',
            'gloss': '表面处理',
            'roughness': '表面处理',
            'color_l': '表面处理',
            'color_a': '表面处理',
            'color_b': '表面处理',
            'visual_inspection': '工艺要求',
            'salt_spray': '工艺要求',
            'plating': '工艺要求',
            'text_spec': '工艺要求',
        }

    def extract_fai_from_pdf(self, pdf_path: str) -> List[FAIData]:
        """从PDF提取FAI数据"""
        results = []

        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages):
                words = page.extract_words(
                    keep_blank_chars=True,
                    x_tolerance=3,
                    y_tolerance=3
                )

                # 构建文本行索引
                text_lines = self._build_text_lines(words)

                # 第一步：识别所有数据块
                data_blocks = self._identify_data_blocks(words, text_lines)

                # 第二步：找所有FAI位置
                fai_positions = self._find_all_fai(words)

                # 第三步：找所有SPC位置
                spc_positions = self._find_all_spc(words)

                # 第四步：匹配FAI到最近的数据块或文本行
                for fai_num, fai_info in fai_positions.items():
                    fai_data = self._match_fai_to_block(
                        fai_info, fai_num, data_blocks, text_lines,
                        spc_positions, page_num + 1
                    )
                    results.append(fai_data)

        return self._deduplicate_fai(results)

    def _build_text_lines(self, words: List[Dict]) -> List[Dict]:
        """构建文本行索引，按Y坐标分组"""
        if not words:
            return []

        lines = {}
        for w in words:
            y_key = round(w['top'] / 10) * 10
            if y_key not in lines:
                lines[y_key] = []
            lines[y_key].append(w)

        result = []
        for y_key in sorted(lines.keys()):
            line_words = sorted(lines[y_key], key=lambda x: x['x0'])
            full_text = ' '.join(w['text'].strip() for w in line_words)
            result.append({
                'y': y_key,
                'x_start': line_words[0]['x0'],
                'x_end': line_words[-1]['x1'],
                'text': full_text,
                'words': line_words
            })

        return result

    def _identify_data_blocks(self, words: List[Dict], text_lines: List[Dict]) -> List[DataBlock]:
        """识别所有数据块"""
        blocks = []

        # 几何尺寸类
        blocks.extend(self._find_radius_blocks(words))
        blocks.extend(self._find_dimensional_blocks(words))
        blocks.extend(self._find_geometric_blocks(words))
        blocks.extend(self._find_profile_blocks(words))

        # 材料性能类
        blocks.extend(self._find_material_blocks(text_lines))

        # 表面处理类
        blocks.extend(self._find_surface_blocks(text_lines))

        # 镀层规格类
        blocks.extend(self._find_plating_blocks(text_lines))

        return blocks

    def _find_radius_blocks(self, words: List[Dict]) -> List[DataBlock]:
        """识别圆角半径数据块"""
        blocks = []
        used_indices = set()

        for i, w in enumerate(words):
            if w['text'].strip() != 'R' or i in used_indices:
                continue

            r_x, r_y = w['x0'], w['top']

            max_item = min_item = None
            for j, w2 in enumerate(words):
                if j in used_indices:
                    continue
                dist_to_r = ((w2['x0'] - r_x)**2 + (w2['top'] - r_y)**2)**0.5
                if dist_to_r > 50:
                    continue

                text = w2['text'].strip()
                if re.match(r'^[\d.]+\s*MAX$', text, re.I):
                    max_item = {'text': text, 'x': w2['x0'], 'y': w2['top'], 'idx': j}
                elif re.match(r'^[\d.]+\s*MIN$', text, re.I):
                    min_item = {'text': text, 'x': w2['x0'], 'y': w2['top'], 'idx': j}

            if not max_item and not min_item:
                continue

            points = [(r_x, r_y)]
            if max_item:
                points.append((max_item['x'], max_item['y']))
                used_indices.add(max_item['idx'])
            if min_item:
                points.append((min_item['x'], min_item['y']))
                used_indices.add(min_item['idx'])
            used_indices.add(i)

            center_x = sum(p[0] for p in points) / len(points)
            center_y = sum(p[1] for p in points) / len(points)

            max_val = min_val = None
            if max_item:
                m = re.match(r'^([\d.]+)\s*MAX$', max_item['text'], re.I)
                if m:
                    max_val = m.group(1)
            if min_item:
                m = re.match(r'^([\d.]+)\s*MIN$', min_item['text'], re.I)
                if m:
                    min_val = m.group(1)

            blocks.append(DataBlock(
                block_type='radius',
                center_x=center_x,
                center_y=center_y,
                symbol='R',
                nom='-',
                upper_tol=f'{max_val} MAX' if max_val else '-',
                lower_tol=f'{min_val} MIN' if min_val else '-',
                description=''
            ))

        return blocks

    def _find_dimensional_blocks(self, words: List[Dict]) -> List[DataBlock]:
        """识别尺寸公差数据块"""
        blocks = []

        values = []
        for i, w in enumerate(words):
            text = w['text'].strip()
            if not re.match(r'^\d+\.?\d*$', text):
                continue
            if '.' not in text:
                try:
                    v = int(text)
                    if 1 <= v <= 99:
                        continue
                except:
                    pass
            try:
                val = float(text)
                values.append({
                    'text': text, 'value': val,
                    'x': w['x0'], 'y': w['top'], 'idx': i
                })
            except:
                pass

        used_indices = set()
        for nom in values:
            if nom['idx'] in used_indices:
                continue
            if nom['value'] < 0.1:
                continue

            for tol in values:
                if tol['idx'] in used_indices or tol['idx'] == nom['idx']:
                    continue
                if tol['value'] >= 0.5:
                    continue
                if '.' not in tol['text'] or len(tol['text'].split('.')[-1]) < 2:
                    continue

                dx = abs(nom['x'] - tol['x'])
                dy = abs(nom['y'] - tol['y'])
                if not ((dx < 100 and dy < 30) or (dx < 40 and dy < 50)):
                    continue

                if tol['value'] >= nom['value']:
                    continue

                center_x = (nom['x'] + tol['x']) / 2
                center_y = (nom['y'] + tol['y']) / 2

                blocks.append(DataBlock(
                    block_type='dimensional',
                    center_x=center_x,
                    center_y=center_y,
                    symbol='±',
                    nom=nom['text'],
                    upper_tol=f"+{tol['text']}",
                    lower_tol=f"-{tol['text']}",
                    description=''
                ))

                used_indices.add(nom['idx'])
                used_indices.add(tol['idx'])
                break

        return blocks

    def _find_geometric_blocks(self, words: List[Dict]) -> List[DataBlock]:
        """识别几何公差数据块"""
        blocks = []

        for i, w in enumerate(words):
            text = w['text'].strip()
            if not re.match(r'^0\.0\d{1,2}$', text):
                continue

            tol_x, tol_y = w['x0'], w['top']
            tol_val = text

            datum = None
            datum_x = None
            for j, w2 in enumerate(words):
                if not re.match(r'^[A-C]$', w2['text'].strip()):
                    continue
                dist = ((w2['x0'] - tol_x)**2 + (w2['top'] - tol_y)**2)**0.5
                if dist < 150:
                    datum = w2['text'].strip()
                    datum_x = w2['x0']
                    break

            if not datum:
                continue

            has_nominal = False
            for j, w2 in enumerate(words):
                if not re.match(r'^\d+\.\d+$', w2['text'].strip()):
                    continue
                try:
                    val = float(w2['text'].strip())
                    if val >= 0.1:
                        dx = abs(w2['x0'] - tol_x)
                        dy = abs(w2['top'] - tol_y)
                        if (dx < 100 and dy < 30) or (dx < 40 and dy < 50):
                            has_nominal = True
                            break
                except:
                    pass

            if has_nominal:
                continue

            if datum_x < tol_x:
                block_type = 'geometric_flatness'
                symbol = '▱'
                desc = f'定义基准 {datum}'
            else:
                block_type = 'geometric_parallel'
                symbol = '//'
                desc = f'相对基准 {datum}'

            blocks.append(DataBlock(
                block_type=block_type,
                center_x=tol_x,
                center_y=tol_y,
                symbol=symbol,
                nom='0',
                upper_tol=tol_val,
                lower_tol='0',
                description=desc
            ))

        return blocks

    def _find_profile_blocks(self, words: List[Dict]) -> List[DataBlock]:
        """识别线轮廓度数据块"""
        blocks = []

        for i, w in enumerate(words):
            text = w['text'].strip().upper()
            if text == 'ALL AROUND':
                center_x, center_y = w['x0'], w['top']

                tol_val = None
                for w2 in words:
                    if re.match(r'^0\.\d{1,3}$', w2['text'].strip()):
                        dist = ((w2['x0'] - center_x)**2 + (w2['top'] - center_y)**2)**0.5
                        if dist < 150:
                            tol_val = w2['text'].strip()
                            break

                if tol_val:
                    blocks.append(DataBlock(
                        block_type='profile',
                        center_x=center_x,
                        center_y=center_y,
                        symbol='⌒',
                        nom='0',
                        upper_tol=tol_val,
                        lower_tol='0',
                        description='全周'
                    ))

        return blocks

    def _find_material_blocks(self, text_lines: List[Dict]) -> List[DataBlock]:
        """识别材料性能参数"""
        blocks = []

        patterns = [
            (r'(?:RESIDUAL\s+)?(?:MAGNETIC\s+)?FLUX\s*\(?Br\)?\s*[:\s]*'
             r'([\d.]+)\s*[-–]\s*([\d.]+)\s*(kGs?|T)',
             'magnetic_br', 'Br'),
            (r'B-COERCIVITY\s+(?:FORCE\s+)?\(?Hcb\)?\s*[:\s]*'
             r'([\d.]+)\s*(kOe|kA/m)\s*(MIN)?',
             'magnetic_hcb', 'Hcb'),
            (r'J-COERCIVITY\s+(?:FORCE\s+)?\(?Hcj\)?\s*[:\s]*'
             r'([\d.]+)\s*(kOe|kA/m)\s*(MIN)?',
             'magnetic_hcj', 'Hcj'),
            (r'(?:MAX(?:IMUM)?\s+)?ENERGY\s+PRODUCT\s*[:\s]*'
             r'([\d.]+)\s*[-–]\s*([\d.]+)\s*(MGOe|kJ/m)',
             'magnetic_bhmax', 'BHmax'),
            (r'HARDNESS\s*[:\s]*([\d.]+)\s*[-±]?\s*([\d.]+)?\s*(HV|HRC)',
             'hardness', 'HV'),
        ]

        for line in text_lines:
            text = line['text']
            for pattern, block_type, symbol in patterns:
                match = re.search(pattern, text, re.I)
                if match:
                    groups = match.groups()

                    if block_type == 'hardness':
                        nom = groups[0]
                        tol = groups[1] if groups[1] else '0'
                        unit = groups[2] if len(groups) > 2 else ''
                        upper = f'{nom}+{tol}' if tol != '0' else nom
                        lower = f'{nom}-{tol}' if tol != '0' else nom
                    elif 'MIN' in str(groups):
                        nom = groups[0]
                        unit = groups[1] if len(groups) > 1 else ''
                        upper = '-'
                        lower = f'{nom} {unit} MIN'
                    else:
                        nom = f'{groups[0]} - {groups[1]}'
                        unit = groups[2] if len(groups) > 2 else ''
                        upper = groups[1]
                        lower = groups[0]

                    blocks.append(DataBlock(
                        block_type=block_type,
                        center_x=line['x_start'],
                        center_y=line['y'],
                        symbol=symbol,
                        nom=nom,
                        upper_tol=upper,
                        lower_tol=lower,
                        description=text[:50],
                        unit=unit
                    ))
                    break

        return blocks

    def _find_surface_blocks(self, text_lines: List[Dict]) -> List[DataBlock]:
        """识别表面处理参数"""
        blocks = []

        patterns = [
            (r'GLOSS\s*(?:AT\s*60\s*)?[:\s]*([\d.]+)\s*[-–]?\s*([\d.]+)?\s*GU',
             'gloss', 'GU'),
            (r'(?:ROUGHNESS\s*[:\s]*)?Ra(?:-[XY])?\s*[/=]\s*(?:Ra-[XY]\s*=\s*)?([\d.]+)',
             'roughness', 'Ra'),
            (r'\*?\s*L\s*[:\s]*([\d.]+)\s*[-–]\s*([\d.]+)',
             'color_l', 'L*'),
            (r'\*?\s*a\s*[:\s]*([\d.]+)\s*[-–]\s*([\d.]+)',
             'color_a', 'a*'),
            # 颜色b: 必须以 * b: 开头，避免匹配 ASTM B117 等标准编号
            (r'\*\s*b\s*:\s*([\d.]+)\s*[-–]\s*([\d.]+)',
             'color_b', 'b*'),
        ]

        for line in text_lines:
            text = line['text']
            for pattern, block_type, symbol in patterns:
                match = re.search(pattern, text, re.I)
                if match:
                    groups = match.groups()

                    if len(groups) >= 2 and groups[1]:
                        nom = f'{groups[0]} - {groups[1]}'
                        upper = groups[1]
                        lower = groups[0]
                    else:
                        nom = groups[0]
                        upper = groups[0]
                        lower = groups[0]

                    blocks.append(DataBlock(
                        block_type=block_type,
                        center_x=line['x_start'],
                        center_y=line['y'],
                        symbol=symbol,
                        nom=nom,
                        upper_tol=upper,
                        lower_tol=lower,
                        description=text[:50]
                    ))
                    break

        for line in text_lines:
            text = line['text'].upper()

            if 'NO CRACKS' in text or 'CHIPPING' in text:
                blocks.append(DataBlock(
                    block_type='visual_inspection',
                    center_x=line['x_start'],
                    center_y=line['y'],
                    symbol='目视',
                    nom='合格',
                    upper_tol='-',
                    lower_tol='-',
                    description='无裂纹/崩边'
                ))

            if 'SALT SPRAY' in text:
                time_match = re.search(r'(\d+)\s*HR', text)
                hours = time_match.group(1) if time_match else '24'
                blocks.append(DataBlock(
                    block_type='salt_spray',
                    center_x=line['x_start'],
                    center_y=line['y'],
                    symbol='盐雾',
                    nom=f'{hours}小时',
                    upper_tol='-',
                    lower_tol='-',
                    description='无腐蚀/点蚀'
                ))

        return blocks

    def _find_plating_blocks(self, text_lines: List[Dict]) -> List[DataBlock]:
        """识别镀层规格数据块（PLATING SPECIFICATIONS）"""
        blocks = []

        # 镀层规格模式 - 按行匹配
        # (关键词用于定位, 数据正则, 类型, 符号)
        plating_patterns = [
            ('TOP LAYER', r'TOP\s*LAYER.*?([\d.]+)\s*[-–]\s*([\d.]+)', 'plating_top', 'NiP'),
            ('BASE LAYER', r'BASE\s*LAYER.*?([\d.]+)\s*[-–]\s*([\d.]+)', 'plating_base', 'Cu'),
            ('PLATING THICKNESS', r'PLATING\s*THICKNESS.*?([\d.]+)\s*[-–]\s*([\d.]+)', 'plating_thickness', '±'),
            ('BARE MAGNET', r'BARE\s*MAGNET\s*THICKNESS\s+([\d]+\.[\d]+)\s*[±]?\s*([\d.]+)', 'magnet_thickness', '±'),
        ]

        for line in text_lines:
            text = line['text']
            words = line.get('words', [])

            for keyword, pattern, block_type, symbol in plating_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if not match:
                    continue

                val1 = match.group(1)
                val2 = match.group(2)

                # 定位关键词在行中的位置
                cx = line['x_start']  # 默认使用行起点
                for w in words:
                    if keyword.split()[0].upper() in w['text'].upper():
                        cx = w['x0']
                        break
                cy = line['y']

                # 判断是范围格式还是公差格式
                if block_type == 'magnet_thickness':
                    nom = val1
                    upper_tol = f'+{val2}'
                    lower_tol = f'-{val2}'
                else:
                    min_val = float(val1)
                    max_val = float(val2)
                    nom = f'{min_val:.2f}-{max_val:.2f}'
                    upper_tol = f'{max_val:.2f} MAX'
                    lower_tol = f'{min_val:.2f} MIN'

                block = DataBlock(
                    block_type=block_type,
                    center_x=cx,
                    center_y=cy,
                    symbol=symbol,
                    nom=nom,
                    upper_tol=upper_tol,
                    lower_tol=lower_tol,
                    description=text[:50]
                )
                blocks.append(block)
                break

        return blocks

    def _find_all_fai(self, words: List[Dict]) -> Dict[int, Dict]:
        """查找所有FAI标注 - 改进版：选择最近的数字"""
        fai_positions = {}

        for i, w in enumerate(words):
            text = w['text'].strip()

            if text == 'FAI':
                fai_x, fai_y = w['x0'], w['top']

                # 收集所有候选数字，选择最近的
                candidates = []
                for j in range(i + 1, min(i + 15, len(words))):
                    nw = words[j]
                    dist = ((nw['x0'] - fai_x)**2 + (nw['top'] - fai_y)**2)**0.5
                    if dist < 80 and re.match(r'^[0-9]{1,2}$', nw['text'].strip()):
                        fai_num = int(nw['text'].strip())
                        if 1 <= fai_num <= 99:
                            candidates.append((fai_num, dist, fai_x, fai_y))

                # 选择距离最近的
                if candidates:
                    candidates.sort(key=lambda x: x[1])
                    fai_num, _, fx, fy = candidates[0]
                    # 避免重复覆盖（保留距离更近的）
                    if fai_num not in fai_positions:
                        fai_positions[fai_num] = {'x': fx, 'y': fy}

            match = re.match(r'^FAI\s*(\d{1,2})$', text)
            if match:
                fai_num = int(match.group(1))
                if 1 <= fai_num <= 99 and fai_num not in fai_positions:
                    fai_positions[fai_num] = {'x': w['x0'], 'y': w['top']}

        return fai_positions

    def _find_all_spc(self, words: List[Dict]) -> Dict[str, Dict]:
        """查找所有SPC标注"""
        spc_positions = {}

        for i, w in enumerate(words):
            if w['text'].strip() == 'SPC':
                spc_x, spc_y = w['x0'], w['top']
                for j in range(i + 1, min(i + 8, len(words))):
                    nw = words[j]
                    dist = ((nw['x0'] - spc_x)**2 + (nw['top'] - spc_y)**2)**0.5
                    # 排除 O（容易与0混淆）
                    if dist < 60 and re.match(r'^[A-NP-Z]$', nw['text'].strip()):
                        letter = nw['text'].strip()
                        spc_positions[letter] = {'x': spc_x, 'y': spc_y}
                        break

        return spc_positions

    def _match_fai_to_block(
        self,
        fai_info: Dict,
        fai_num: int,
        data_blocks: List[DataBlock],
        text_lines: List[Dict],
        spc_positions: Dict,
        page: int
    ) -> FAIData:
        """将FAI匹配到最近的数据块或文本行"""
        fai_x, fai_y = fai_info['x'], fai_info['y']

        # 找最近的SPC
        spc = None
        min_spc_dist = float('inf')
        for letter, pos in spc_positions.items():
            dist = ((pos['x'] - fai_x)**2 + (pos['y'] - fai_y)**2)**0.5
            if dist < 150 and dist < min_spc_dist:
                min_spc_dist = dist
                spc = letter

        # 方法1：匹配数据块
        candidates = []
        for block in data_blocks:
            y_diff = abs(block.center_y - fai_y)
            x_diff = abs(block.center_x - fai_x)

            # 对镀层类型使用Y坐标优先的加权距离（表格数据按行排列）
            if block.block_type.startswith('plating_') or block.block_type == 'magnet_thickness':
                # Y坐标权重更高，适合表格行匹配
                dist = x_diff + 3 * y_diff
                priority = 0 if y_diff < 20 else 1
            else:
                # 标准欧式距离
                dist = ((x_diff)**2 + (y_diff)**2)**0.5
                priority = 0 if y_diff < 50 else 1

            if dist < 600:
                candidates.append((block, dist, priority))

        candidates.sort(key=lambda x: (x[2], x[1]))

        if candidates:
            best_block, best_dist, _ = candidates[0]
            measure_type = self.measure_type_map.get(best_block.block_type, '未识别')
            category = self.category_map.get(best_block.block_type, '几何尺寸')

            desc_parts = [best_block.description] if best_block.description else []
            desc_parts.append(f'距离:{best_dist:.0f}')

            # 构建完整的备选列表
            alternatives = []
            if len(candidates) > 1:
                for block, dist, _ in candidates[1:4]:
                    if dist - best_dist < 150:
                        alt_type = self.measure_type_map.get(block.block_type, '?')
                        alt_category = self.category_map.get(block.block_type, '几何尺寸')
                        alternatives.append({
                            'nom': block.nom,
                            'upper_tol': block.upper_tol,
                            'lower_tol': block.lower_tol,
                            'symbol': block.symbol,
                            'measure_type': alt_type,
                            'category': alt_category,
                            'distance': int(dist),
                            'description': block.description
                        })
                if alternatives:
                    alt_names = [f"{a['measure_type']}({a['distance']})" for a in alternatives]
                    desc_parts.append(f'备选:{",".join(alt_names)}')

            return FAIData(
                fai_num=fai_num,
                spc=spc,
                nom=best_block.nom,
                upper_tol=best_block.upper_tol,
                lower_tol=best_block.lower_tol,
                symbol=best_block.symbol,
                measure_type=measure_type,
                description=' | '.join(desc_parts),
                page=page,
                category=category,
                alternatives=alternatives if alternatives else None
            )

        # 方法2：匹配同一行或上方的文本行
        for line in text_lines:
            if abs(line['y'] - fai_y) < 30 and line['x_end'] < fai_x:
                text = line['text'][:60]
                return FAIData(
                    fai_num=fai_num,
                    spc=spc,
                    nom='-',
                    upper_tol='-',
                    lower_tol='-',
                    symbol='文本',
                    measure_type='文本规格',
                    description=text,
                    page=page,
                    category='工艺要求'
                )

        return FAIData(
            fai_num=fai_num,
            spc=spc,
            nom='-',
            upper_tol='-',
            lower_tol='-',
            symbol='-',
            measure_type='未识别',
            description='',
            page=page,
            category='未分类'
        )

    def _deduplicate_fai(self, results: List[FAIData]) -> List[FAIData]:
        """去重"""
        seen = {}
        for r in results:
            if r.fai_num not in seen:
                seen[r.fai_num] = r
            else:
                if r.measure_type != '未识别' and seen[r.fai_num].measure_type == '未识别':
                    seen[r.fai_num] = r
                elif r.spc and not seen[r.fai_num].spc:
                    seen[r.fai_num] = r
        return sorted(seen.values(), key=lambda x: x.fai_num)


PDFExtractorV2 = PDFExtractorV3


def extract_fai(pdf_path: str) -> List[dict]:
    """提取PDF中的FAI数据"""
    extractor = PDFExtractorV3()
    results = extractor.extract_fai_from_pdf(pdf_path)
    return [r.to_dict() for r in results]


if __name__ == '__main__':
    import sys
    import json

    if sys.platform == 'win32':
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

    if len(sys.argv) > 1:
        results = extract_fai(sys.argv[1])
        print(json.dumps(results, ensure_ascii=False, indent=2))
