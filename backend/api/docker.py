"""
Docker 容器管理 API 路由
提供 Docker 容器的查询和控制功能
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status

from model.user import User
from schema.schemas import DockerContainer, DockerContainerAction, MessageResponse
from service.auth_service import get_current_user
from service.docker_service import docker_service

router = APIRouter(prefix="/api/docker", tags=["Docker 管理"])


@router.get("/status")
async def get_docker_status(current_user: User = Depends(get_current_user)):
    """
    获取 Docker 服务状态
    """
    return {
        "available": docker_service.is_available(),
        "message": "Docker 服务正常" if docker_service.is_available() else "Docker 服务不可用"
    }


@router.get("/containers", response_model=List[DockerContainer])
async def get_containers(
    all_containers: bool = True,
    current_user: User = Depends(get_current_user)
):
    """
    获取所有 Docker 容器列表
    
    Args:
        all_containers: 是否包含已停止的容器
    """
    if not docker_service.is_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Docker 服务不可用"
        )
    
    return docker_service.list_containers(all_containers=all_containers)


@router.get("/containers/{container_id}", response_model=DockerContainer)
async def get_container(
    container_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    获取单个容器详情
    """
    if not docker_service.is_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Docker 服务不可用"
        )
    
    container = docker_service.get_container(container_id)
    if not container:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="容器不存在"
        )
    
    return container


@router.post("/containers/{container_id}/action", response_model=MessageResponse)
async def container_action(
    container_id: str,
    action: DockerContainerAction,
    current_user: User = Depends(get_current_user)
):
    """
    对容器执行操作（启动/停止/重启/暂停/恢复）
    """
    if not docker_service.is_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Docker 服务不可用"
        )
    
    # 执行对应操作
    action_map = {
        "start": docker_service.start_container,
        "stop": docker_service.stop_container,
        "restart": docker_service.restart_container,
        "pause": docker_service.pause_container,
        "unpause": docker_service.unpause_container
    }
    
    action_func = action_map.get(action.action)
    if not action_func:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不支持的操作"
        )
    
    success = action_func(container_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"操作 {action.action} 失败"
        )
    
    action_names = {
        "start": "启动",
        "stop": "停止",
        "restart": "重启",
        "pause": "暂停",
        "unpause": "恢复"
    }
    
    return MessageResponse(
        message=f"容器{action_names.get(action.action, action.action)}成功",
        success=True
    )
