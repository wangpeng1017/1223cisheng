"""
@file main.py
@desc FastAPI 主入口
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from api.extract import router as extract_router
from api.mtd import router as mtd_router
from api.ppt_template_api import router as ppt_template_router
from api.ppt_fill_api import router as ppt_fill_router

# 创建应用
app = FastAPI(
    title="NPI FAI 提取服务",
    description="PDF图纸FAI尺寸数据提取API",
    version="1.0.0"
)

# CORS配置 - 允许前端访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://8.130.182.148:3002",
        "http://8.130.182.148:3000",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(extract_router)
app.include_router(mtd_router)
app.include_router(ppt_template_router)
app.include_router(ppt_fill_router)


@app.on_event("startup")
def startup_event():
    """应用启动时初始化数据库"""
    init_db()


@app.get("/")
def root():
    """健康检查"""
    return {
        "status": "ok",
        "service": "NPI FAI Extract API",
        "version": "1.0.0"
    }


@app.get("/health")
def health_check():
    """健康检查端点"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
