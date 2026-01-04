"""
@file mtd.py
@desc MTD API 接口
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import os
import tempfile

from database import get_db
from models.mtd_project import MTDProject
from models.equipment import Equipment
from models.fixture import Fixture
from models.fai import FAIItem
from services.ppt_generator import generate_mtd_ppt

router = APIRouter(prefix="/api/mtd", tags=["MTD"])


# Pydantic 模型
class ProjectCreate(BaseModel):
    project_name: str
    part_number: str
    vendor: Optional[str] = None
    revision: str = "01"
    equipment_ids: List[int] = []
    fixture_ids: List[int] = []
    fai_extraction_id: Optional[int] = None


class ProjectResponse(BaseModel):
    id: int
    project_name: str
    part_number: str
    vendor: Optional[str]
    revision: str
    equipment_ids: List[int]
    fixture_ids: List[int]
    created_at: datetime

    class Config:
        from_attributes = True


class EquipmentCreate(BaseModel):
    name: str
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    specs: Optional[dict] = None
    image_path: Optional[str] = None


class FixtureCreate(BaseModel):
    fixture_no: str
    size: Optional[str] = None
    material: Optional[str] = None
    image_path: Optional[str] = None
    remark: Optional[str] = None


# MTD 项目接口
@router.post("/projects", response_model=ProjectResponse)
def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    """创建 MTD 项目"""
    db_project = MTDProject(**project.model_dump())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


@router.get("/projects", response_model=List[ProjectResponse])
def list_projects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """获取项目列表"""
    return db.query(MTDProject).offset(skip).limit(limit).all()


@router.get("/projects/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db)):
    """获取项目详情"""
    project = db.query(MTDProject).filter(MTDProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.delete("/projects/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    """删除项目"""
    project = db.query(MTDProject).filter(MTDProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"message": "Project deleted"}




@router.put("/projects/{project_id}", response_model=ProjectResponse)
def update_project(project_id: int, project: ProjectCreate, db: Session = Depends(get_db)):
    """更新 MTD 项目"""
    db_project = db.query(MTDProject).filter(MTDProject.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    for key, value in project.model_dump().items():
        setattr(db_project, key, value)
    db.commit()
    db.refresh(db_project)
    return db_project
@router.post("/projects/{project_id}/generate-ppt")
def generate_ppt(project_id: int, db: Session = Depends(get_db)):
    """生成 MTD PPT"""
    project = db.query(MTDProject).filter(MTDProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # 获取关联数据
    equipment_list = db.query(Equipment).filter(Equipment.id.in_(project.equipment_ids or [])).all()
    fixture_list = db.query(Fixture).filter(Fixture.id.in_(project.fixture_ids or [])).all()
    fai_items = []
    if project.fai_extraction_id:
        fai_items = db.query(FAIItem).filter(FAIItem.extraction_id == project.fai_extraction_id).all()

    # 转换为字典
    project_dict = {
        "project_name": project.project_name,
        "part_number": project.part_number,
        "vendor": project.vendor,
        "revision": project.revision
    }
    equipment_dicts = [{"id": e.id, "name": e.name, "manufacturer": e.manufacturer, "model": e.model, "specs": e.specs} for e in equipment_list]
    fixture_dicts = [{"id": f.id, "fixture_no": f.fixture_no, "size": f.size, "material": f.material} for f in fixture_list]
    fai_dicts = [{
        "fai_num": f.fai_num, "spc": f.spc, "specification": f"{f.nom}±{f.upper_tol}" if f.nom else "",
        "description": f.description, "cpk_method": f.cpk_method or "", "cpk_fixture": f.cpk_fixture or "No",
        "inprocess_method": f.inprocess_method or "", "inprocess_fixture": f.inprocess_fixture or "No",
        "location": f.location or "", "cross_check_by": f.cross_check_by or ""
    } for f in fai_items]

    # 生成 PPT
    output_filename = f"MTD_{project.project_name}_{project.part_number}_{datetime.now().strftime('%Y%m%d')}.pptx"
    output_path = os.path.join(tempfile.gettempdir(), output_filename)

    try:
        generate_mtd_ppt(project_dict, equipment_dicts, fixture_dicts, fai_dicts, output_path)
        return FileResponse(output_path, filename=output_filename,
                          media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PPT generation failed: {str(e)}")


# 设备接口
@router.get("/equipment")
def list_equipment(db: Session = Depends(get_db)):
    """获取设备列表"""
    return db.query(Equipment).all()


@router.post("/equipment")
def create_equipment(equipment: EquipmentCreate, db: Session = Depends(get_db)):
    """添加设备"""
    db_equipment = Equipment(**equipment.model_dump())
    db.add(db_equipment)
    db.commit()
    db.refresh(db_equipment)
    return db_equipment


@router.put("/equipment/{equipment_id}")
def update_equipment(equipment_id: int, equipment: EquipmentCreate, db: Session = Depends(get_db)):
    """更新设备"""
    db_eq = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not db_eq:
        raise HTTPException(status_code=404, detail="Equipment not found")
    for key, value in equipment.model_dump().items():
        setattr(db_eq, key, value)
    db.commit()
    db.refresh(db_eq)
    return db_eq

@router.delete("/equipment/{equipment_id}")
def delete_equipment(equipment_id: int, db: Session = Depends(get_db)):
    """删除设备"""
    eq = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Equipment not found")
    db.delete(eq)
    db.commit()
    return {"message": "Equipment deleted"}

# 夹具接口
@router.get("/fixtures")
def list_fixtures(db: Session = Depends(get_db)):
    """获取夹具列表"""
    return db.query(Fixture).all()


@router.post("/fixtures")
def create_fixture(fixture: FixtureCreate, db: Session = Depends(get_db)):
    """添加夹具"""
    db_fixture = Fixture(**fixture.model_dump())
    db.add(db_fixture)
    db.commit()
    db.refresh(db_fixture)
    return db_fixture


@router.put("/fixtures/{fixture_id}")
def update_fixture(fixture_id: int, fixture: FixtureCreate, db: Session = Depends(get_db)):
    """更新夹具"""
    db_f = db.query(Fixture).filter(Fixture.id == fixture_id).first()
    if not db_f:
        raise HTTPException(status_code=404, detail="Fixture not found")
    for key, value in fixture.model_dump().items():
        setattr(db_f, key, value)
    db.commit()
    db.refresh(db_f)
    return db_f

@router.delete("/fixtures/{fixture_id}")
def delete_fixture(fixture_id: int, db: Session = Depends(get_db)):
    """删除夹具"""
    f = db.query(Fixture).filter(Fixture.id == fixture_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Fixture not found")
    db.delete(f)
    db.commit()
    return {"message": "Fixture deleted"}
