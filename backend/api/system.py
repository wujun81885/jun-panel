"""
系统监控 API 路由
提供系统状态信息
"""
from fastapi import APIRouter, Depends

from model.user import User
from schema.schemas import SystemStatus
from service.auth_service import get_current_user
from service.system_service import get_system_status

router = APIRouter(prefix="/api/system", tags=["系统监控"])


@router.get("/status", response_model=SystemStatus)
async def get_status(current_user: User = Depends(get_current_user)):
    """
    获取系统状态信息
    
    返回 CPU、内存、磁盘使用率
    """
    return get_system_status()


@router.get("/status/public", response_model=SystemStatus)
async def get_status_public():
    """
    获取系统状态信息（无需认证）
    
    用于仪表盘公开展示（可选功能）
    """
    return get_system_status()
