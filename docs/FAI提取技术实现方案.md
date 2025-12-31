# FAI 数据提取技术实现方案

> 版本: V3 | 更新: 2025-12-31

## 1. 系统架构

```
PDF 文件
    ↓
pdfplumber 提取 words + text_lines
    ↓
┌─────────────────────────────────────────────────────┐
│              数据块识别层 (_identify_data_blocks)      │
├──────────────┬──────────────┬──────────────┬────────┤
│ 几何尺寸      │ 材料性能      │ 表面处理      │ 镀层规格 │
│ (words定位)  │ (text_lines) │ (text_lines) │(text)  │
└──────────────┴──────────────┴──────────────┴────────┘
    ↓
FAI 位置匹配 (_match_fai_to_block)
    ↓
FAIData 结构化输出
```

---

## 2. 数据分类与识别方法

### 2.1 几何尺寸类

| 类型 | block_type | 符号 | 识别方法 | 正则/逻辑 |
|------|------------|------|----------|-----------|
| 圆角半径 | `radius` | R | `_find_radius_blocks` | `R` + `X.XX MAX/MIN` 组合，距离<50px |
| 厚度/距离 | `dimensional` | ± | `_find_dimensional_blocks` | 标称值(≥0.1) + 公差值(<0.5)，位置相邻 |
| 平面度 | `geometric_flatness` | ▱ | `_find_geometric_blocks` | `0.0X` + 基准字母(A-C)，基准在左侧 |
| 平行度 | `geometric_parallel` | // | `_find_geometric_blocks` | `0.0X` + 基准字母(A-C)，基准在右侧 |
| 线轮廓度 | `profile` | ⌒ | `_find_profile_blocks` | `ALL AROUND` + `0.XXX`，距离<150px |

**圆角半径识别逻辑：**
```python
# 查找 R 标记
if w['text'] == 'R':
    # 在50px范围内找 MAX/MIN 值
    for w2 in words:
        if re.match(r'^[\d.]+\s*MAX$', w2['text']):  # 如 "0.35 MAX"
            max_val = extract_value(w2)
        if re.match(r'^[\d.]+\s*MIN$', w2['text']):  # 如 "0.15 MIN"
            min_val = extract_value(w2)
```

**尺寸公差识别逻辑：**
```python
# 标称值条件：≥0.1，避免FAI编号干扰
# 公差值条件：<0.5，有2位以上小数
# 位置条件：dx<100且dy<30，或dx<40且dy<50
if nom['value'] >= 0.1 and tol['value'] < 0.5:
    if (dx < 100 and dy < 30) or (dx < 40 and dy < 50):
        # 匹配成功
```

---

### 2.2 材料性能类

| 类型 | block_type | 符号 | 正则模式 |
|------|------------|------|----------|
| 磁通密度 | `magnetic_br` | Br | `FLUX\s*\(?Br\)?\s*[:\s]*([\d.]+)\s*[-–]\s*([\d.]+)\s*(kGs?\|T)` |
| 矫顽力Hcb | `magnetic_hcb` | Hcb | `B-COERCIVITY.*?\(?Hcb\)?\s*[:\s]*([\d.]+)\s*(kOe\|kA/m)` |
| 矫顽力Hcj | `magnetic_hcj` | Hcj | `J-COERCIVITY.*?\(?Hcj\)?\s*[:\s]*([\d.]+)\s*(kOe\|kA/m)` |
| 最大能积 | `magnetic_bhmax` | BHmax | `ENERGY\s+PRODUCT\s*[:\s]*([\d.]+)\s*[-–]\s*([\d.]+)\s*(MGOe)` |
| 硬度 | `hardness` | HV | `HARDNESS\s*[:\s]*([\d.]+)\s*[-±]?\s*([\d.]+)?\s*(HV\|HRC)` |

**示例匹配：**
```
RESIDUAL MAGNETIC FLUX (Br): 12.8 - 13.2 kGs
→ nom="12.8 - 13.2", upper="13.2", lower="12.8"

HARDNESS: 600 ±100 HV
→ nom="600", upper="600+100", lower="600-100"
```

---

### 2.3 表面处理类

| 类型 | block_type | 符号 | 正则模式 |
|------|------------|------|----------|
| 光泽度 | `gloss` | GU | `GLOSS\s*[:\s]*([\d.]+)\s*[-–]?\s*([\d.]+)?\s*GU` |
| 粗糙度 | `roughness` | Ra | `Ra(?:-[XY])?\s*[/=]\s*([\d.]+)` |
| 颜色L | `color_l` | L* | `\*?\s*L\s*[:\s]*([\d.]+)\s*[-–]\s*([\d.]+)` |
| 颜色a | `color_a` | a* | `\*?\s*a\s*[:\s]*([\d.]+)\s*[-–]\s*([\d.]+)` |
| 颜色b | `color_b` | b* | `\*\s*b\s*:\s*([\d.]+)\s*[-–]\s*([\d.]+)` |
| 外观检验 | `visual_inspection` | 目视 | 关键词: `NO CRACKS`, `CHIPPING` |
| 盐雾测试 | `salt_spray` | 盐雾 | `SALT SPRAY.*?(\d+)\s*HR` |

**颜色b特殊处理：**
```python
# 必须以 "* b:" 开头，避免匹配 ASTM B117 等标准编号
pattern = r'\*\s*b\s*:\s*([\d.]+)\s*[-–]\s*([\d.]+)'
```

---

### 2.4 镀层规格类

| 类型 | block_type | 符号 | 关键词 | 数据格式 |
|------|------------|------|--------|----------|
| 顶层镀层 | `plating_top` | NiP | TOP LAYER | 范围: `1.00-3.50μm` |
| 底层镀层 | `plating_base` | Cu | BASE LAYER | 范围: `2.00-5.00μm` |
| 镀层厚度 | `plating_thickness` | ± | PLATING THICKNESS | 范围: `3.00-8.50μm` |
| 磁体厚度 | `magnet_thickness` | ± | BARE MAGNET | 公差: `0.342 ± 0.015` |

**范围格式 vs 公差格式：**
```python
if block_type == 'magnet_thickness':
    # 公差格式: nom ± tol
    nom = val1                    # "0.342"
    upper_tol = f'+{val2}'        # "+0.015"
    lower_tol = f'-{val2}'        # "-0.015"
else:
    # 范围格式: min-max
    nom = f'{val1}-{val2}'        # "1.00-3.50"
    upper_tol = f'{val2} MAX'     # "3.50 MAX"
    lower_tol = f'{val1} MIN'     # "1.00 MIN"
```

**关键词定位（解决X坐标偏移）：**
```python
# 在行内查找关键词的实际X坐标
cx = line['x_start']  # 默认
for w in line['words']:
    if keyword.split()[0].upper() in w['text'].upper():
        cx = w['x0']  # 使用关键词位置
        break
```

---

## 3. FAI 匹配算法

### 3.1 距离计算策略

```python
for block in data_blocks:
    y_diff = abs(block.center_y - fai_y)
    x_diff = abs(block.center_x - fai_x)

    # 镀层类型：Y坐标优先（表格按行排列）
    if block.block_type.startswith('plating_') or block.block_type == 'magnet_thickness':
        dist = x_diff + 3 * y_diff  # Y权重3倍
        priority = 0 if y_diff < 20 else 1
    else:
        # 标准欧式距离
        dist = sqrt(x_diff² + y_diff²)
        priority = 0 if y_diff < 50 else 1
```

### 3.2 候选排序与选择

```python
candidates.sort(key=lambda x: (x.priority, x.distance))
best_block = candidates[0]

# 构建备选列表（距离差<150的其他候选）
alternatives = [c for c in candidates[1:4] if c.dist - best_dist < 150]
```

---

## 4. 数据结构

### 4.1 DataBlock（中间数据块）

```python
@dataclass
class DataBlock:
    block_type: str      # 类型标识
    center_x: float      # 中心X坐标
    center_y: float      # 中心Y坐标
    symbol: str          # 显示符号
    nom: str             # 标称值
    upper_tol: str       # 上公差
    lower_tol: str       # 下公差
    description: str     # 描述
    unit: str = ''       # 单位
```

### 4.2 FAIData（输出结构）

```python
@dataclass
class FAIData:
    fai_num: int                           # FAI编号
    spc: Optional[str]                     # SPC编号
    nom: Optional[str]                     # 标称值
    upper_tol: Optional[str]               # 上公差
    lower_tol: Optional[str]               # 下公差
    symbol: str                            # 符号
    measure_type: str                      # 测量类型
    description: str                       # 描述
    page: int                              # 页码
    category: str                          # 分类
    alternatives: Optional[List[Dict]]     # 备选候选列表
```

---

## 5. 类型映射表

```python
measure_type_map = {
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
}

category_map = {
    'radius': '几何尺寸',
    'dimensional': '几何尺寸',
    'geometric_flatness': '几何尺寸',
    'geometric_parallel': '几何尺寸',
    'profile': '几何尺寸',
    'magnetic_*': '材料性能',
    'hardness': '材料性能',
    'gloss': '表面处理',
    'roughness': '表面处理',
    'color_*': '表面处理',
    'plating_*': '表面处理',
    'magnet_thickness': '几何尺寸',
    'visual_inspection': '工艺要求',
    'salt_spray': '工艺要求',
}
```

---

## 6. 扩展指南

### 添加新识别类型

1. **在 `measure_type_map` 添加类型映射**
2. **在 `category_map` 添加分类映射**
3. **创建或扩展 `_find_xxx_blocks` 方法**
4. **在 `_identify_data_blocks` 中调用新方法**

```python
# 示例：添加新的表面处理类型
def _find_surface_blocks(self, text_lines):
    patterns.append(
        (r'NEW_PATTERN\s*[:\s]*([\d.]+)', 'new_type', 'SYMBOL')
    )
```
