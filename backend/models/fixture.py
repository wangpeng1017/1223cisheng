"""
@file fixture.py
@desc 测量夹具数据模型
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
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
    created_at = Column(DateTime, default=datetime.utcnow)
