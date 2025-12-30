# -*- coding: utf-8 -*-
"""
@file pdf_extractor_v2.py
@desc PDF图纸FAI提取 - 数据块识别版
@strategy 先识别数据块，再匹配FAI
"""

import pdfplumber
import re
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, asdict


@dataclass
class DataBlock:
    """测量数据块"""
    block_type: str       # 类型：radius/dimensional/geometric/profile
    center_x: float       # 块中心X
    center_y: float       # 块中心Y
    symbol: str           # 符号
    nom: str              # 标准值
    upper_tol: str        # 上公差
    lower_tol: str        # 下公差
    description: str      # 描述


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

    def to_dict(self) -> dict:
        return asdict(self)


class PDFExtractorV2:
    """PDF FAI提取器 - 数据块识别版"""

    def __init__(self):
        self.measure_type_map = {
            'radius': '圆角半径',
            'dimensional': '厚度/距离',
            'geometric_flatness': '平面度',
            'geometric_parallel': '平行度',
            'profile': '线轮廓度',
            'unknown': '未识别'
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

                # 第一步：识别所有数据块
                data_blocks = self._identify_data_blocks(words)

                # 第二步：找所有FAI位置
                fai_positions = self._find_all_fai(words)

                # 第三步：找所有SPC位置
                spc_positions = self._find_all_spc(words)

                # 第四步：匹配FAI到最近的数据块
                for fai_num, fai_info in fai_positions.items():
                    fai_data = self._match_fai_to_block(
                        fai_info, fai_num, data_blocks, spc_positions, page_num + 1
                    )
                    results.append(fai_data)

        return self._deduplicate_fai(results)

    def _identify_data_blocks(self, words: List[Dict]) -> List[DataBlock]:
        """识别所有测量数据块"""
        blocks = []

        # 1. 识别圆角半径块 (R + MAX/MIN 紧密聚合)
        blocks.extend(self._find_radius_blocks(words))

        # 2. 识别尺寸公差块 (标准值 + 公差配对)
        blocks.extend(self._find_dimensional_blocks(words))

        # 3. 识别几何公差块 (0.0x + 基准)
        blocks.extend(self._find_geometric_blocks(words))

        # 4. 识别线轮廓度块 (ALL AROUND)
        blocks.extend(self._find_profile_blocks(words))

        return blocks

    def _find_radius_blocks(self, words: List[Dict]) -> List[DataBlock]:
        """识别圆角半径数据块：R + MAX/MIN 紧密聚合"""
        blocks = []
        used_indices = set()

        for i, w in enumerate(words):
            if w['text'].strip() != 'R' or i in used_indices:
                continue

            r_x, r_y = w['x0'], w['top']

            # 在R附近找MAX/MIN（距离R<50）
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

            # 必须有MAX或MIN才算圆角半径块
            if not max_item and not min_item:
                continue

            # 计算块中心
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

            # 提取值
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
        """识别尺寸公差数据块：标准值 + 公差值配对"""
        blocks = []

        # 收集所有数值
        values = []
        for i, w in enumerate(words):
            text = w['text'].strip()
            if not re.match(r'^\d+\.?\d*$', text):
                continue
            # 排除可能是FAI编号的整数
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

        # 找标准值-公差配对
        used_indices = set()
        for nom in values:
            if nom['idx'] in used_indices:
                continue
            # 标准值通常 >= 0.1
            if nom['value'] < 0.1:
                continue

            # 在附近找公差值（<0.5，有2位以上小数）
            for tol in values:
                if tol['idx'] in used_indices or tol['idx'] == nom['idx']:
                    continue
                if tol['value'] >= 0.5:
                    continue
                if '.' not in tol['text'] or len(tol['text'].split('.')[-1]) < 2:
                    continue

                # 检查是否相邻（水平或垂直）
                dx = abs(nom['x'] - tol['x'])
                dy = abs(nom['y'] - tol['y'])
                if not ((dx < 100 and dy < 30) or (dx < 40 and dy < 50)):
                    continue

                # 公差应该比标准值小很多
                if tol['value'] >= nom['value']:
                    continue

                # 创建数据块
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
        """识别几何公差数据块：0.0x格式 + 基准字母"""
        blocks = []

        for i, w in enumerate(words):
            text = w['text'].strip()
            # 几何公差通常是 0.0x 格式
            if not re.match(r'^0\.0\d{1,2}$', text):
                continue

            tol_x, tol_y = w['x0'], w['top']
            tol_val = text

            # 在附近找基准字母（A/B/C）
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

            # 检查附近是否有标准值配对（如果有，说明是尺寸公差，跳过）
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

            # 根据基准位置判断类型
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
        """识别线轮廓度数据块：ALL AROUND 关键词"""
        blocks = []

        for i, w in enumerate(words):
            text = w['text'].strip().upper()
            # 直接匹配 "ALL AROUND" 或分开的 "ALL" + "AROUND"
            if text == 'ALL AROUND':
                center_x, center_y = w['x0'], w['top']

                # 找附近的公差值 (0.xx 格式)
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

    def _find_all_fai(self, words: List[Dict]) -> Dict[int, Dict]:
        """查找所有FAI标注"""
        fai_positions = {}

        for i, w in enumerate(words):
            text = w['text'].strip()

            if text == 'FAI':
                fai_x, fai_y = w['x0'], w['top']
                for j in range(i + 1, min(i + 10, len(words))):
                    nw = words[j]
                    dist = ((nw['x0'] - fai_x)**2 + (nw['top'] - fai_y)**2)**0.5
                    if dist < 80 and re.match(r'^[0-9]{1,2}$', nw['text'].strip()):
                        fai_num = int(nw['text'].strip())
                        if 1 <= fai_num <= 99:
                            fai_positions[fai_num] = {'x': fai_x, 'y': fai_y}
                        break

            match = re.match(r'^FAI\s*(\d{1,2})$', text)
            if match:
                fai_num = int(match.group(1))
                if 1 <= fai_num <= 99:
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
                    if dist < 60 and re.match(r'^[A-Z]$', nw['text'].strip()):
                        letter = nw['text'].strip()
                        spc_positions[letter] = {'x': spc_x, 'y': spc_y}
                        break

        return spc_positions

    def _match_fai_to_block(
        self,
        fai_info: Dict,
        fai_num: int,
        data_blocks: List[DataBlock],
        spc_positions: Dict,
        page: int
    ) -> FAIData:
        """将FAI匹配到最近的数据块，提供置信度排名"""
        fai_x, fai_y = fai_info['x'], fai_info['y']

        # 找最近的SPC
        spc = None
        min_spc_dist = float('inf')
        for letter, pos in spc_positions.items():
            dist = ((pos['x'] - fai_x)**2 + (pos['y'] - fai_y)**2)**0.5
            if dist < 150 and dist < min_spc_dist:
                min_spc_dist = dist
                spc = letter

        # 计算到所有数据块的距离，按距离排序
        candidates = []
        for block in data_blocks:
            dist = ((block.center_x - fai_x)**2 + (block.center_y - fai_y)**2)**0.5
            if dist < 500:  # 搜索范围
                candidates.append((block, dist))

        candidates.sort(key=lambda x: x[1])

        if not candidates:
            return FAIData(
                fai_num=fai_num,
                spc=spc,
                nom='-',
                upper_tol='-',
                lower_tol='-',
                symbol='-',
                measure_type='未识别',
                description='',
                page=page
            )

        # 最近的块作为默认
        best_block, best_dist = candidates[0]
        measure_type = self.measure_type_map.get(best_block.block_type, '未识别')

        # 构建描述，包含置信度信息
        desc_parts = [best_block.description] if best_block.description else []
        desc_parts.append(f'距离:{best_dist:.0f}')

        # 如果有其他近距离候选（距离差<100），列出供参考
        if len(candidates) > 1:
            alt_candidates = []
            for block, dist in candidates[1:4]:  # 最多显示3个备选
                if dist - best_dist < 150:  # 距离差不大时才显示
                    alt_type = self.measure_type_map.get(block.block_type, '?')
                    alt_candidates.append(f'{alt_type}({dist:.0f})')
            if alt_candidates:
                desc_parts.append(f'备选:{",".join(alt_candidates)}')

        return FAIData(
            fai_num=fai_num,
            spc=spc,
            nom=best_block.nom,
            upper_tol=best_block.upper_tol,
            lower_tol=best_block.lower_tol,
            symbol=best_block.symbol,
            measure_type=measure_type,
            description=' | '.join(desc_parts),
            page=page
        )

    def _deduplicate_fai(self, results: List[FAIData]) -> List[FAIData]:
        """去重"""
        seen = {}
        for r in results:
            if r.fai_num not in seen:
                seen[r.fai_num] = r
            else:
                # 保留有更多信息的
                if r.measure_type != '未识别' and seen[r.fai_num].measure_type == '未识别':
                    seen[r.fai_num] = r
        return sorted(seen.values(), key=lambda x: x.fai_num)


def extract_fai(pdf_path: str) -> List[dict]:
    """提取PDF中的FAI数据"""
    extractor = PDFExtractorV2()
    results = extractor.extract_fai_from_pdf(pdf_path)
    return [r.to_dict() for r in results]


if __name__ == '__main__':
    import sys
    import json
    if len(sys.argv) > 1:
        results = extract_fai(sys.argv[1])
        print(json.dumps(results, ensure_ascii=False, indent=2))
