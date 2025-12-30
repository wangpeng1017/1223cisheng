"""
@file extract.py
@desc FAI提取API端点
"""

import os
import tempfile
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models.fai import FAIExtraction, FAIItem
from services.pdf_extractor import extract_fai

router = APIRouter(prefix="/api", tags=["FAI提取"])


# ============ Pydantic模型 ============

class FAIItemResponse(BaseModel):
    id: int
    fai_num: int
    spc: Optional[str]
    nom: Optional[str]
    upper_tol: Optional[str]
    lower_tol: Optional[str]
    measure_type: Optional[str]
    description: Optional[str]
    page: Optional[int]

    class Config:
        from_attributes = True


class FAIExtractionResponse(BaseModel):
    id: int
    file_name: str
    upload_time: str
    created_by: Optional[str]
    items: List[FAIItemResponse]

    class Config:
        from_attributes = True


class ExtractResponse(BaseModel):
    success: bool
    message: str
    extraction_id: Optional[int]
    items: List[dict]


class ExtractionListResponse(BaseModel):
    id: int
    file_name: str
    upload_time: str
    created_by: Optional[str]
    item_count: int

    class Config:
        from_attributes = True


# ============ API端点 ============

@router.post("/extract", response_model=ExtractResponse)
async def extract_pdf(
    file: UploadFile = File(...),
    created_by: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    上传PDF并提取FAI数据

    - **file**: PDF文件
    - **created_by**: 创建人（可选）
    """
    # 验证文件类型
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="仅支持PDF文件")

    # 保存临时文件
    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        # 提取FAI数据
        fai_items = extract_fai(tmp_path)

        if not fai_items:
            return ExtractResponse(
                success=True,
                message="PDF解析完成，但未找到FAI标注",
                extraction_id=None,
                items=[]
            )

        # 保存到数据库
        extraction = FAIExtraction(
            file_name=file.filename,
            created_by=created_by
        )
        db.add(extraction)
        db.flush()  # 获取ID

        # 保存FAI条目
        for item in fai_items:
            db_item = FAIItem(
                extraction_id=extraction.id,
                fai_num=item['fai_num'],
                spc=item.get('spc'),
                nom=item.get('nom'),
                upper_tol=item.get('upper_tol'),
                lower_tol=item.get('lower_tol'),
                measure_type=item.get('measure_type'),
                description=item.get('description', ''),
                page=item.get('page')
            )
            db.add(db_item)

        db.commit()

        return ExtractResponse(
            success=True,
            message=f"成功提取 {len(fai_items)} 条FAI数据",
            extraction_id=extraction.id,
            items=fai_items
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"PDF解析失败: {str(e)}")

    finally:
        # 清理临时文件
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


@router.get("/extractions", response_model=List[ExtractionListResponse])
def list_extractions(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """获取提取历史列表"""
    extractions = db.query(FAIExtraction).order_by(
        FAIExtraction.upload_time.desc()
    ).offset(skip).limit(limit).all()

    result = []
    for e in extractions:
        result.append(ExtractionListResponse(
            id=e.id,
            file_name=e.file_name,
            upload_time=e.upload_time.isoformat() if e.upload_time else '',
            created_by=e.created_by,
            item_count=len(e.items)
        ))

    return result


@router.get("/extractions/{extraction_id}", response_model=FAIExtractionResponse)
def get_extraction(extraction_id: int, db: Session = Depends(get_db)):
    """获取单次提取详情"""
    extraction = db.query(FAIExtraction).filter(
        FAIExtraction.id == extraction_id
    ).first()

    if not extraction:
        raise HTTPException(status_code=404, detail="提取记录不存在")

    return FAIExtractionResponse(
        id=extraction.id,
        file_name=extraction.file_name,
        upload_time=extraction.upload_time.isoformat() if extraction.upload_time else '',
        created_by=extraction.created_by,
        items=[FAIItemResponse.model_validate(item) for item in extraction.items]
    )


@router.delete("/extractions/{extraction_id}")
def delete_extraction(extraction_id: int, db: Session = Depends(get_db)):
    """删除提取记录"""
    extraction = db.query(FAIExtraction).filter(
        FAIExtraction.id == extraction_id
    ).first()

    if not extraction:
        raise HTTPException(status_code=404, detail="提取记录不存在")

    db.delete(extraction)
    db.commit()

    return {"success": True, "message": "删除成功"}
