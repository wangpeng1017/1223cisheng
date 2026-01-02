"""
@file mtd_project.py
@desc MTD项目数据模型
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, JSON
from database import Base


class MTDProject(Base):
    """MTD项目表"""
    __tablename__ = "mtd_projects"

    id = Column(Integer, primary_key=True, index=True)
    project_name = Column(String(100), nullable=False)  # J510
    part_number = Column(String(100), nullable=False)  # 160-06631-01
    vendor = Column(String(100), nullable=True)  # MAGSOUND
    revision = Column(String(10), default="01")
    equipment_ids = Column(JSON, default=list)  # 关联设备ID列表
    fixture_ids = Column(JSON, default=list)  # 关联夹具ID列表
    fai_extraction_id = Column(Integer, nullable=True)  # 关联FAI提取记录
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
