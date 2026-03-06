-- NPI System Full Migration + Seed Data
-- Run: docker exec -i mysql-npi mysql -u root -pnpi2026secure npi_db < migrate.sql

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(50),
  spec VARCHAR(500),
  status VARCHAR(20) DEFAULT '激活',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS knowledge_articles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  tags JSON,
  views INT DEFAULT 0,
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS defects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(50),
  severity VARCHAR(20),
  description TEXT,
  solution TEXT,
  occurrence INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS qplan_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plan_type VARCHAR(20) DEFAULT 'IQC',
  category VARCHAR(50) NOT NULL,
  item VARCHAR(200) NOT NULL,
  spec_limit VARCHAR(200),
  tool VARCHAR(200),
  sample_level VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reliability_tests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description VARCHAR(500),
  status VARCHAR(20) DEFAULT '计划中',
  planned_date VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS process_steps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  route_name VARCHAR(100) DEFAULT 'A-2',
  step_no INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  params VARCHAR(500),
  status VARCHAR(20) DEFAULT 'pending',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pfmea_risks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  operation VARCHAR(100) NOT NULL,
  failure_mode VARCHAR(200) NOT NULL,
  effect VARCHAR(500),
  measure VARCHAR(500),
  sod VARCHAR(50),
  status VARCHAR(20) DEFAULT '追踪中',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS prototype_batches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  batch_no VARCHAR(50) NOT NULL,
  quantity VARCHAR(50),
  result VARCHAR(100),
  batch_date VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS npi_stage_stats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  stage VARCHAR(20) NOT NULL,
  actual_rate INT DEFAULT 0,
  target_rate INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ai_review_tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id VARCHAR(50) UNIQUE NOT NULL,
  drawing_name VARCHAR(200) NOT NULL,
  file_url VARCHAR(500),
  file_type VARCHAR(20) DEFAULT 'pdf',
  status VARCHAR(20) DEFAULT 'completed',
  duration_seconds INT DEFAULT 0,
  total_issues INT DEFAULT 0,
  critical_count INT DEFAULT 0,
  warning_count INT DEFAULT 0,
  info_count INT DEFAULT 0,
  conclusion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ai_review_issues (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  category VARCHAR(50),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  suggestion TEXT,
  INDEX idx_task_id (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS system_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(100),
  role VARCHAR(50),
  title VARCHAR(100),
  avatar VARCHAR(500),
  join_date VARCHAR(20),
  last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_reviews INT DEFAULT 0,
  active_projects INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT 1,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT 1,
  type VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'unread',
  color VARCHAR(50) DEFAULT 'text-blue-500 bg-blue-50',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  member_count INT DEFAULT 0,
  description VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_name VARCHAR(50) NOT NULL,
  module VARCHAR(50) NOT NULL,
  action VARCHAR(200) NOT NULL,
  ip VARCHAR(50),
  status VARCHAR(20) DEFAULT '成功',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS system_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(50) UNIQUE NOT NULL,
  setting_name VARCHAR(100) NOT NULL,
  description VARCHAR(200),
  enabled BOOLEAN DEFAULT FALSE,
  category VARCHAR(50) DEFAULT 'general',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS watched_projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT 1,
  project_name VARCHAR(200) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS dr_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_name VARCHAR(200) NOT NULL,
  product_name VARCHAR(200),
  part_number VARCHAR(100),
  customer VARCHAR(100),
  reviewer VARCHAR(50),
  review_date VARCHAR(20),
  drawing_version VARCHAR(20),
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS dr_issues (
  id INT AUTO_INCREMENT PRIMARY KEY,
  review_id INT NOT NULL,
  seq_no INT NOT NULL,
  ppt_page VARCHAR(20),
  fai_spc VARCHAR(50),
  category VARCHAR(50),
  description TEXT,
  drawing_spec VARCHAR(500),
  suggestion TEXT,
  pd_opinion TEXT,
  severity VARCHAR(20) DEFAULT 'minor',
  INDEX idx_review_id (review_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==================== SEED DATA ====================

INSERT IGNORE INTO products (product_id, name, category, spec, status) VALUES
  ('PROD-X1', '新款磁体单元 Gen3', '磁性核心', 'NdFeB, 50x50, N52', '激活'),
  ('PROD-L2', 'L系列低频驱动器', '声学模组', 'Titanium Diaphragm, 8ohm', '草稿'),
  ('PROD-S1', '微型数字麦克风', '传感器', 'MEMS, -42dB', '激活'),
  ('PROD-M3', '车载磁路模组 V2', '磁性核心', 'SmCo, 30x30, 高温型', '激活'),
  ('PROD-A2', 'ANC 降噪模组', '声学模组', 'Hybrid ANC, SNR>35dB', '开发中'),
  ('PROD-H1', '骨传导振子 Mini', '声学模组', 'Piezo, 8x5mm, 32ohm', '激活');

INSERT IGNORE INTO knowledge_articles (id, title, tags, views, content) VALUES
  (1, '磁路间隙设计准则', '["DFM","Assembly"]', 128, '磁路间隙是影响声学性能的关键参数，间隙公差需控制在±0.02mm以内...'),
  (2, 'NdFeB 磁铁高温退磁防护', '["Material","Reliability"]', 256, '钕铁硼磁铁在80°C以上环境中会出现不可逆退磁，需选择UH/EH牌号...'),
  (3, '声学腔体密封点胶规范', '["Process","Quality"]', 89, '声学腔体密封需采用UV固化胶，胶量控制在0.05±0.01g，固化时间3s...'),
  (4, '螺钉扭力衰减预防方案', '["Fastening","Design"]', 142, '振动环境下螺钉扭力衰减是常见失效模式，建议采用预涂螺纹胶+扭力验证...'),
  (5, 'MEMS 麦克风静电防护设计', '["ESD","Sensor"]', 95, 'MEMS麦克风对ESD极其敏感，PCB布局需保证接地环完整，间距>0.3mm...'),
  (6, '磁体充磁方向检测方法', '["Testing","Quality"]', 210, '使用高斯计在距磁体表面1mm处测量，N/S极性判定需与图纸标注一致...');

INSERT IGNORE INTO defects (id, code, name, category, severity, description, solution, occurrence) VALUES
  (1, 'DEF-001', '磁体裂纹', '磁性组件', '严重', '烧结过程中温度梯度过大导致磁体内部产生微裂纹', '优化烧结温度曲线，降低升温速率至2°C/min', 23),
  (2, 'DEF-002', '点胶溢胶', '装配工艺', '一般', '点胶量超出标准值导致胶水溢出到非涂胶区域', '校准点胶机参数，增加CCD视觉检测', 45),
  (3, 'DEF-003', '焊点虚焊', 'SMT工艺', '严重', 'PCB焊盘氧化或回流温度不足导致焊点不良', '增加助焊剂活性，调整回流炉温度曲线', 12),
  (4, 'DEF-004', '外壳划伤', '包装运输', '轻微', '产品在包装运输过程中外壳表面产生划痕', '增加EPE缓冲材料，改用吸塑托盘包装', 67),
  (5, 'DEF-005', '频响偏移', '声学性能', '严重', '成品频响曲线偏离设计目标>3dB', '检查振膜张力一致性，校准声学测试系统', 8);

INSERT IGNORE INTO qplan_items (id, plan_type, category, item, spec_limit, tool, sample_level) VALUES
  (1, 'IQC', '磁性组件', '表面磁通量', '420 - 450 mT', '特斯拉计', 'Level II (S-3)'),
  (2, 'IQC', '五金件', '关键孔径尺寸', 'Φ5.02 ±0.01mm', '二次元投影仪', 'Level II'),
  (3, 'IQC', 'PCB 板', '阻抗匹配', '4.0 ±0.2 Ω', '数字电桥', '100% 自动测试'),
  (4, 'IQC', '包装件', '防静电等级', '10^6 - 10^9 Ω', '表面电阻测试仪', 'Skip Lot'),
  (5, 'IQC', '磁性组件', '磁体尺寸', '50.00 ±0.05mm', '三坐标测量仪', 'Level II (S-2)'),
  (6, 'IQC', '结构件', '表面粗糙度', 'Ra ≤ 0.8μm', '粗糙度仪', 'Level I'),
  (7, 'OQC', '成品', '频响曲线', '100Hz-10kHz ±3dB', '声学分析仪', '100% 全检'),
  (8, 'OQC', '成品', '外观检查', '无划伤/异色/变形', '目视+放大镜', 'Level II');

INSERT IGNORE INTO reliability_tests (id, title, description, status, planned_date) VALUES
  (1, '恒温恒湿循环', '85℃ / 85% RH, 持续 240H', '计划中', '2026-03-25'),
  (2, '盐雾腐蚀测试', '5% NaCl 浓度, 连续 48H', '进行中', '2026-03-10'),
  (3, '跌落强度测试', '1.2m 高度, 水泥地面, 六面各 3 次', '已完成', '2026-02-28'),
  (4, '高温老化测试', '105℃ 持续 500H，每100H测一次', '计划中', '2026-04-01'),
  (5, '振动疲劳测试', '10-2000Hz, 1.5G, XYZ 各 4H', '进行中', '2026-03-15');

INSERT IGNORE INTO process_steps (id, route_name, step_no, name, params, status, sort_order) VALUES
  (1, 'A-2', 10, '下料与预处理', '尺寸: 50x50mm, 压力: 10Mpa', 'completed', 1),
  (2, 'A-2', 20, '磁体精密注塑', '模温: 120℃, 循环时间: 45s', 'in-progress', 2),
  (3, 'A-2', 30, '磁路装配 (核心工序)', '间隙要求: 0.08±0.01mm', 'pending', 3),
  (4, 'A-2', 40, '性能测试 (频响/磁通)', '阈值: >95dB at 1kHz', 'pending', 4),
  (5, 'A-2', 50, '成品包装与出货检验', 'OQC全检 + 包装规范 V2.1', 'pending', 5);

INSERT IGNORE INTO pfmea_risks (id, operation, failure_mode, effect, measure, sod, status) VALUES
  (1, '磁路装配', '磁极方向装反', '产品无输出，报废', '夹具增加防呆防错设计', '8 / 2 / 4 (64)', '已改进'),
  (2, '点胶工序', '溢胶、胶量不足', '磁性组件松动, 异音', 'CCD 视觉检测仪自动判定', '6 / 4 / 3 (72)', '追踪中'),
  (3, '焊接工序', '虚焊/冷焊', 'PCB功能失效', '回流炉温度曲线优化+AOI检测', '7 / 3 / 3 (63)', '追踪中'),
  (4, '充磁工序', '充磁不饱和', '磁通量低于下限', '100%高斯计在线检测', '5 / 2 / 2 (20)', '已改进'),
  (5, '包装运输', '产品碰撞划伤', '外观不良客诉', '优化缓冲包材+跌落测试验证', '4 / 5 / 3 (60)', '追踪中');

INSERT IGNORE INTO prototype_batches (id, batch_no, quantity, result, batch_date) VALUES
  (1, 'B20251210', '50 PCS', '合格 (96%)', '12-10'),
  (2, 'B20251218', '100 PCS', '有瑕疵 (88%)', '12-18'),
  (3, 'B20251222', '20 PCS', '待评审', '12-22'),
  (4, 'B20260115', '200 PCS', '合格 (98%)', '01-15'),
  (5, 'B20260201', '500 PCS', '合格 (99.2%)', '02-01');

INSERT IGNORE INTO npi_stage_stats (id, stage, actual_rate, target_rate) VALUES
  (1, 'DROP', 85, 90),
  (2, 'Proto', 72, 80),
  (3, 'EVT', 65, 75),
  (4, 'DVT', 92, 95),
  (5, 'PVT', 45, 60),
  (6, 'RAMP', 30, 50);

INSERT IGNORE INTO ai_review_tasks (task_id, drawing_name, file_type, status, duration_seconds, total_issues, critical_count, warning_count, info_count, conclusion, created_at) VALUES
  ('mock-001', 'J510 磁铁组件工程图', 'pdf', 'completed', 8, 7, 2, 3, 2, '发现 2 个严重问题需立即修正，3 个建议修改项', '2026-03-03 10:30:00'),
  ('mock-002', 'Gen3 传感器外壳', 'image', 'completed', 5, 3, 0, 2, 1, '未发现严重问题，2 项建议修改', '2026-03-02 15:20:00'),
  ('mock-003', 'PCB 固定支架', 'pdf', 'completed', 12, 1, 0, 0, 1, '图纸质量优秀，仅 1 条优化建议', '2026-03-01 09:10:00'),
  ('mock-004', 'ANC 模组外壳 Rev.C', 'pdf', 'completed', 6, 4, 1, 2, 1, '发现 1 个严重公差问题，需修正后重新提交', '2026-02-28 14:00:00'),
  ('mock-005', '车载磁路支架 V2', 'image', 'completed', 9, 5, 1, 3, 1, '1 处关键尺寸缺失，3 处标注需优化', '2026-02-25 09:45:00');

INSERT IGNORE INTO ai_review_issues (id, task_id, severity, category, title, description, suggestion) VALUES
  (1, 'mock-001', 'critical', '公差', '公差超出标准范围', 'FAI#3 尺寸 3×2.00±0.50 的公差 ±0.50 超过标准允许的 ±0.10，可能导致装配干涉', '将公差收紧至 ±0.10，或提交偏差申请并附理由说明'),
  (2, 'mock-001', 'critical', '尺寸标注', '关键尺寸缺失', '磁铁安装孔中心距未标注，该尺寸为装配关键尺寸', '补充中心距尺寸标注，建议值 12.50±0.05'),
  (3, 'mock-001', 'warning', '基准', '基准选择不合理', 'Datum A 选择了非功能面，可能导致测量基准与装配基准不一致', '建议将 Datum A 改为底面（主安装面），与装配基准一致'),
  (4, 'mock-001', 'warning', '标注规范', '表面粗糙度标注不完整', '3 处加工面未标注表面粗糙度要求', '补充 Ra 0.8 或 Ra 1.6 表面粗糙度标注'),
  (5, 'mock-001', 'warning', '公差', '形位公差缺失', '安装面平面度未标注，可能影响产品装配后的平行度', '建议添加平面度公差 0.02mm'),
  (6, 'mock-001', 'info', '标注规范', '尺寸标注位置优化', '多个尺寸标注线交叉重叠，影响图纸可读性', '重新排列标注线，避免交叉，提升可读性'),
  (7, 'mock-001', 'info', '其他', '材料标注建议补充', '图纸标题栏材料为 NdFeB N48，建议补充镀层要求', '在材料栏或技术要求中注明镀层（如 NiCuNi 镀层厚度要求）'),
  (8, 'mock-002', 'warning', '尺寸标注', '过约束标注', '底面长度被标注了 2 次，产生过约束', '删除其中一个冗余标注，保留从基准出发的链式标注'),
  (9, 'mock-002', 'warning', '公差', '装配间隙偏紧', '卡扣配合间隙 0.02mm，在批量生产中可能导致装配困难', '建议放宽至 0.05mm 或改用过渡配合'),
  (10, 'mock-002', 'info', '标注规范', '视图投影方向不统一', '主视图使用第一角投影，侧视图使用第三角投影', '统一使用第三角投影'),
  (11, 'mock-003', 'info', '其他', '版本号建议更新', '图纸版本号仍为 Rev.A，但标题栏日期已更新', '建议同步更新版本号至 Rev.B'),
  (12, 'mock-004', 'critical', '公差', '孔径公差不合理', '安装孔 Φ3.00+0.10/-0.00 单边公差导致装配偏心风险', '改为双边公差 Φ3.00±0.05'),
  (13, 'mock-004', 'warning', '基准', '基准体系不完整', '仅定义了 Datum A，缺少 B/C 基准', '补充 Datum B（侧面）和 Datum C（端面）'),
  (14, 'mock-004', 'warning', '尺寸标注', '参考尺寸未标识', '2 处理论尺寸未加括号标识为参考', '按 GB/T 标准在参考尺寸外加括号'),
  (15, 'mock-004', 'info', '其他', '图纸幅面建议调整', '当前 A4 幅面尺寸过于密集', '建议使用 A3 幅面提升可读性'),
  (16, 'mock-005', 'critical', '尺寸标注', '关键装配尺寸缺失', '支架与车身连接孔位间距未标注', '补充 4-M5 孔位间距尺寸及位置度公差'),
  (17, 'mock-005', 'warning', '公差', '壁厚公差过松', '侧壁厚度 2.00±0.30 公差带过宽', '收紧至 2.00±0.10 确保结构强度'),
  (18, 'mock-005', 'warning', '标注规范', '焊接符号不规范', '角焊缝标注缺少焊脚尺寸', '补充焊脚尺寸 a3 或 z4'),
  (19, 'mock-005', 'warning', '基准', '测量基准不明确', '3D模型基准与图纸基准不一致', '统一基准定义，确保图纸与3D模型一致'),
  (20, 'mock-005', 'info', '其他', '表面处理标注优化', '电泳涂装要求仅在技术要求中提及', '建议在对应视图上用引线标注涂装区域');

INSERT IGNORE INTO system_users (id, name, email, role, title, avatar, join_date, total_reviews, active_projects) VALUES
  (1, '张工', 'zhang.g@cisheng-tech.com', 'admin', '高级研发工程师 / NPI 组长', '', '2022-05-18', 142, 12);

INSERT IGNORE INTO user_activities (id, user_id, content, created_at) VALUES
  (1, 1, '通过了 [新款磁体单元 Gen3] 的图纸评审，并提出了 2 条优化意见。', NOW()),
  (2, 1, '领取了 MTD 现场检测任务 [B20251210-01]，开始执行检测流程。', DATE_SUB(NOW(), INTERVAL 1 DAY)),
  (3, 1, '在 [DFM 策划] 模块中新增了工艺路线 A-2（优化版）。', DATE_SUB(NOW(), INTERVAL 3 DAY)),
  (4, 1, '完成了 [车载磁路模组 V2] 的 Q-Plan 签核审批。', DATE_SUB(NOW(), INTERVAL 5 DAY)),
  (5, 1, '上传了 [ANC 降噪模组] 项目的 DFM 报告。', DATE_SUB(NOW(), INTERVAL 7 DAY));

INSERT IGNORE INTO notifications (id, user_id, type, content, status, color) VALUES
  (1, 1, '审批', '项目 NPI-2025-001 已通过 MTD 检测，请签核 Q-Plan。', 'unread', 'text-blue-500 bg-blue-50'),
  (2, 1, '预警', '您的「AI 降噪模组」项目进度出现延迟预警，当前进度 35%。', 'unread', 'text-rose-500 bg-rose-50'),
  (3, 1, '任务', '有一场关于「Gen3 磁路」的技术评审会议邀约，时间: 明天 14:00。', 'read', 'text-amber-500 bg-amber-50'),
  (4, 1, '系统', '系统已完成 2 月份数据备份，备份大小 2.3GB。', 'read', 'text-green-500 bg-green-50'),
  (5, 1, '审批', '李博 提交的图纸变更申请（DCN-2026-018）待您审批。', 'unread', 'text-blue-500 bg-blue-50');

INSERT IGNORE INTO roles (id, name, member_count, description) VALUES
  (1, '超级管理员', 2, '具备全模块管理权限，包括审计与删除。'),
  (2, '研发审核员', 8, '负责图纸评审、DFM 确认及 Q-Plan 签核。'),
  (3, '品质检验员', 15, '执行 MTD 现场检测，提交不合格报告。'),
  (4, '项目经理', 5, '管理项目进度、资源分配与风险预警。'),
  (5, '访客', 10, '仅查看权限，无编辑与删除操作。');

INSERT IGNORE INTO audit_logs (id, user_name, module, action, ip, status, created_at) VALUES
  (1, '张工 (Admin)', '图纸评审', '修改 Q-Plan 标准 V1.4', '192.168.1.102', '成功', '2026-03-06 16:20:00'),
  (2, '李博 (Viewer)', '项目管理', '查看 NPI 看板', '192.168.1.88', '成功', '2026-03-06 15:45:00'),
  (3, '系统', '基础数据', '自动同步 ERP 物料表 (32条)', '::1', '成功', '2026-03-06 14:10:00'),
  (4, '王工 (Editor)', 'DFM策划', '新增 PFMEA 风险条目 #5', '192.168.1.55', '成功', '2026-03-06 11:30:00'),
  (5, '张工 (Admin)', 'MTD检测', '生成项目 X1 测试文档 PPT', '192.168.1.102', '成功', '2026-03-05 17:00:00'),
  (6, '系统', '安全审计', '检测到异常登录尝试（已拦截）', '45.33.22.11', '失败', '2026-03-05 03:22:00'),
  (7, '赵工 (Editor)', '图纸信息提取', '上传 PDF 图纸并提取 FAI 数据', '192.168.1.77', '成功', '2026-03-04 10:15:00');

INSERT IGNORE INTO system_settings (id, setting_key, setting_name, description, enabled, category) VALUES
  (1, 'feishu_bot', '飞书 / 钉钉机器人', '图纸评审延期自动推送', TRUE, 'notification'),
  (2, 'email_report', '邮件报告汇总', '每日 18:00 自动发送项目简报', FALSE, 'notification'),
  (3, 'mfa', '双重身份认证 (MFA)', '敏感操作前强制验证', FALSE, 'security'),
  (4, 'watermark', '水印管理', '敏感图纸预览时强制显示工号水印', TRUE, 'security');

INSERT IGNORE INTO watched_projects (id, user_id, project_name) VALUES
  (1, 1, '新款磁体单元 Gen3'),
  (2, 1, 'Alpha-S1 振膜模组'),
  (3, 1, '车规级磁路平台');

INSERT IGNORE INTO dr_reviews (id, project_name, product_name, part_number, customer, reviewer, review_date, drawing_version, status) VALUES
  (1, 'NPI-2026-X1', '新款磁体单元 Gen3', 'MC-MAG-0312', '某知名消费电子品牌', '张工', '2026-03-05', 'Rev.C', 'completed'),
  (2, 'NPI-2026-S1', 'Alpha-S1 振膜模组', 'MC-DIA-0228', '某汽车电子客户', '王工', '2026-03-03', 'Rev.B', 'in-progress');

INSERT IGNORE INTO dr_issues (id, review_id, seq_no, ppt_page, fai_spc, category, description, drawing_spec, suggestion, pd_opinion, severity) VALUES
  (1, 1, 1, 'P3', 'FAI#3 / SPC#1', '尺寸公差', '磁铁安装槽宽度公差过松，±0.15mm 可能导致磁体晃动', '槽宽 8.00±0.15mm', '建议收紧至 ±0.05mm，增加过渡配合设计', '同意修改，下版图纸更新', 'critical'),
  (2, 1, 2, 'P5', 'FAI#7', '形位公差', '底面平面度未标注，影响装配平行度', '无标注', '添加平面度 0.02mm', '已补充标注', 'major'),
  (3, 1, 3, 'P5', 'FAI#9', '表面处理', '镀层要求描述模糊，仅写"防锈处理"', '防锈处理', '明确为 NiCuNi 镀层，厚度 8-12μm', '需与供应商确认', 'minor'),
  (4, 1, 4, 'P8', 'FAI#12 / SPC#3', '尺寸标注', '两处尺寸标注交叉重叠难以辨认', '-', '重新排列标注线', '下版优化', 'minor'),
  (5, 2, 1, 'P2', 'FAI#1', '关键尺寸', '振膜安装孔中心距未标注', '无标注', '补充中心距 15.00±0.03mm', '', 'critical'),
  (6, 2, 2, 'P4', 'FAI#5', '材料规格', '振膜材料型号与BOM不一致', 'PET 25μm', '统一为 PI 12.5μm（与BOM一致）', '', 'major'),
  (7, 2, 3, 'P6', 'FAI#8', '标注规范', '技术要求栏缺少环境测试标准引用', '-', '补充引用 IEC 60068 标准', '', 'minor');

-- Seed projects if empty
INSERT IGNORE INTO projects (project_no, name, product_name, product_code, manager, creator, deadline, status, progress, risk) VALUES
  ('NPI-2026-X1', '新款磁体单元 Gen3', '磁体单元', 'MC-MAG-0312', '张工', '李博', '2026-06-30', '进行中', 65, '中'),
  ('NPI-2026-L2', 'L系列低频驱动器', '低频驱动器', 'MC-DRV-0415', '王工', '张工', '2026-08-15', '进行中', 42, '低'),
  ('NPI-2026-S1', 'Alpha-S1 振膜模组', '振膜模组', 'MC-DIA-0228', '赵工', '王工', '2026-05-20', '预警', 78, '高'),
  ('NPI-2026-M3', '车载磁路模组 V2', '磁路模组', 'MC-CAR-0501', '张工', '赵工', '2026-09-01', '进行中', 25, '低'),
  ('NPI-2025-H1', '骨传导振子 Mini', '骨传导振子', 'MC-BCT-1122', '李博', '张工', '2026-03-31', '延期', 88, '高'),
  ('NPI-2025-A2', 'ANC 降噪模组', '降噪模组', 'MC-ANC-0910', '王工', '李博', '2026-04-15', '进行中', 35, '中');
