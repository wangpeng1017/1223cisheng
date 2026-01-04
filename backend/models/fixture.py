"""
@file fixture.py
@desc 测量夹具数据模型
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from database import Base


class Fixture(Base):
    """测量夹具表"""
    __tablename__ = "fixtures"

    id = Column(Integer, primary_key=True, index=True)
    fixture_no = Column(String(50), nullable=False)  # J-J510-1#
    size = Column(String(50), nullable=True)  # 189*36*12
    material = Column(String(100), nullable=True)  # Electric board
    image_path = Column(String(500), nullable=True)
    remark = Column(String(500), nullable=True)
    ppt_template_id = Column(Integer, ForeignKey("ppt_templates.id"), nullable=True)  # 关联的 PPT 模板 ID
    ppt_slide_index = Column(Integer, default=1)  # 使用第几页（默认第1页）
    created_at = Column(DateTime, default=datetime.utcnow)
