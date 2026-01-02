"""
@file equipment.py
@desc 测量设备数据模型
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from database import Base


class Equipment(Base):
    """测量设备表"""
    __tablename__ = "equipment"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # KEYENCE, Height Gage
    manufacturer = Column(String(100), nullable=True)  # 制造商
    model = Column(String(100), nullable=True)  # 型号 IM7010
    specs = Column(JSON, nullable=True)  # 设备规格参数 JSON
    image_path = Column(String(500), nullable=True)  # 设备图片路径
    created_at = Column(DateTime, default=datetime.utcnow)
