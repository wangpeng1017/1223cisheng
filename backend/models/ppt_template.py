"""
@file ppt_template.py
@desc PPT 模板数据模型 - 设备/夹具的 PPT 页面模板
"""
from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class PPTTemplate(Base):
    """PPT 模板表"""
    __tablename__ = "ppt_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # 模板名称
    entity_type = Column(String(20), nullable=False)  # 'equipment' or 'fixture'
    file_path = Column(String(500))  # 原始 PPT 文件路径
    slide_count = Column(Integer)  # 总页数
    thumbnail_path = Column(String(500))  # 缩略图路径（存储第一页缩略图）
    placeholders = Column(JSON, default=list)  # 占位符配置
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关系
    placeholders_rel = relationship("PPTPlaceholder", back_populates="template", cascade="all, delete-orphan")


class PPTPlaceholder(Base):
    """占位符映射表"""
    __tablename__ = "ppt_placeholders"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("ppt_templates.id"), nullable=False)
    placeholder = Column(String(50), nullable=False)  # 占位符，如 [设备名称]
    field_key = Column(String(50), nullable=False)  # 对应字段，如 name
    field_type = Column(String(20))  # text/image/number
    default_value = Column(String(200))  # 默认值

    # 关系
    template = relationship("PPTTemplate", back_populates="placeholders_rel")
