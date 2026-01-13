"""
Jun-Panel 后端主入口
FastAPI 应用配置和启动
"""
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from repository.database import init_db, get_db, SessionLocal
from model.user import User
from model.setting import Setting
from service.auth_service import get_password_hash
from api import cards, groups, system, docker, settings, upload, health

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def create_default_admin():
    """
    创建默认管理员账号
    仅在首次启动且无用户时创建
    """
    db = SessionLocal()
    try:
        # 检查是否已有用户
        user_count = db.query(User).count()
        if user_count == 0:
            # 创建默认管理员
            admin = User(
                username="admin",
                email="admin@jun.panel",
                password_hash=get_password_hash("123456"),
                is_admin=True,
                is_active=True
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            
            # 创建管理员默认设置
            setting = Setting(user_id=admin.id)
            db.add(setting)
            db.commit()
            
            logger.info("已创建默认管理员账号: admin@jun.panel / 123456")
    except Exception as e:
        logger.error(f"创建默认管理员失败: {e}")
        db.rollback()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    应用生命周期管理
    启动时初始化数据库，关闭时清理资源
    """
    # 启动时执行
    logger.info("Jun-Panel 正在启动...")
    init_db()
    create_default_admin()
    logger.info("Jun-Panel 启动完成！")
    
    yield
    
    # 关闭时执行
    logger.info("Jun-Panel 正在关闭...")


# 创建 FastAPI 应用
app = FastAPI(
    title="Jun-Panel API",
    description="Jun-Panel 导航面板后端 API",
    version="1.1.0",
    lifespan=lifespan
)

# CORS 配置（允许前端跨域访问）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应限制具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册 API 路由
# app.include_router(auth.router) # Removed
app.include_router(cards.router)
app.include_router(groups.router)
app.include_router(system.router)
app.include_router(docker.router)
app.include_router(settings.router)
app.include_router(upload.router)
app.include_router(health.router)

# 静态文件服务（上传的文件）
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "data/uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


# 挂载上传目录，使其可访问
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# 静态前端文件目录 (Docker 部署时使用)
WEB_DIR = os.getenv("WEB_DIR", "web")

@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {"status": "healthy"}

# 如果存在 web 目录，则提供前端服务
if os.path.exists(WEB_DIR):
    from fastapi.responses import FileResponse
    
    # 挂载 assets
    if os.path.exists(f"{WEB_DIR}/assets"):
        app.mount("/assets", StaticFiles(directory=f"{WEB_DIR}/assets"), name="assets")
        
    # 根路径
    @app.get("/")
    async def read_root():
        return FileResponse(f"{WEB_DIR}/index.html")
        
    # SPA 路由捕获 (放在最后)
    @app.get("/{path_name:path}")
    async def catch_all(path_name: str):
        # 如果是 API 路径但未匹配到路由，直接返回 404 (由 FastAPI 默认处理，这里不用管)
        # 但由于这个 catch_all 优先级低(如果在最后)，API 路由会先匹配。
        # 问题是：FastAPI 的 catch-all 会吞掉 API 的 404 吗？
        # 不会，API 路由定义在前。如果 API 路由没匹配上，才会进这里。
        # 此时如果是 api/xxx，我们应该返回 404 JSON 而不是 index.html
        if path_name.startswith("api/"):
             from fastapi.responses import JSONResponse
             return JSONResponse({"detail": "Not Found"}, status_code=404)
             
        file_path = f"{WEB_DIR}/{path_name}"
        if os.path.isfile(file_path):
            return FileResponse(file_path)
            
        return FileResponse(f"{WEB_DIR}/index.html")

else:
    # 开发模式或仅后端模式
    @app.get("/")
    async def root():
        """根路径提示"""
        return {
            "name": "Jun-Panel",
            "version": "1.1.0",
            "status": "running",
            "message": "后端 API 正常运行中。请访问 /docs 查看文档，或部署前端页面。"
        }


@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    
    # 从环境变量读取配置
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True  # 开发模式启用热重载
    )
