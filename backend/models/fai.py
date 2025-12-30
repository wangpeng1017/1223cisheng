"""
@file fai.py
@desc FAI数据SQLAlchemy模型定义
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class FAIExtraction(Base):
    """FAI提取记录表"""
    __tablename__ = "fai_extractions"

    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String(255), nullable=False)
    upload_time = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(100), nullable=True)

    # 关联FAI条目
    items = relationship("FAIItem", back_populates="extraction", cascade="all, delete-orphan")


class FAIItem(Base):
    """FAI条目表"""
    __tablename__ = "fai_items"

    id = Column(Integer, primary_key=True, index=True)
    extraction_id = Column(Integer, ForeignKey("fai_extractions.id"), nullable=False)
    fai_num = Column(Integer, nullable=False)
    spc = Column(String(10), nullable=True)
    nom = Column(String(50), nullable=True)
    upper_tol = Column(String(50), nullable=True)
    lower_tol = Column(String(50), nullable=True)
    symbol = Column(String(20), nullable=True)  # GD&T符号: ⌒ ▱ // R ± 等
    measure_type = Column(String(50), nullable=True)  # 测量类型：尺寸公差/平面度/平行度/圆角半径等
    description = Column(Text, nullable=True)
    page = Column(Integer, nullable=True)

    # 关联提取记录
    extraction = relationship("FAIExtraction", back_populates="items")
