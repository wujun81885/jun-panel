"""
分组管理 API 路由
处理分组的增删改查
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from repository.database import get_db
from model.user import User
from model.group import Group
from schema.schemas import (
    GroupCreate, GroupUpdate, GroupResponse,
    SortRequest, MessageResponse
)
from service.auth_service import get_current_user

router = APIRouter(prefix="/api/groups", tags=["分组管理"])


@router.get("", response_model=List[GroupResponse])
async def get_groups(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取当前用户的所有分组
    """
    groups = db.query(Group).filter(
        Group.user_id == current_user.id
    ).order_by(Group.sort_order).all()
    
    return groups


@router.get("/{group_id}", response_model=GroupResponse)
async def get_group(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取单个分组详情
    """
    group = db.query(Group).filter(
        Group.id == group_id,
        Group.user_id == current_user.id
    ).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分组不存在"
        )
    
    return group


@router.post("", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
async def create_group(
    group_data: GroupCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    创建新分组
    """
    # 获取当前最大排序值
    max_order = db.query(Group).filter(
        Group.user_id == current_user.id
    ).count()
    
    group = Group(
        user_id=current_user.id,
        name=group_data.name,
        icon=group_data.icon,
        sort_order=max_order
    )
    
    db.add(group)
    db.commit()
    db.refresh(group)
    
    return group


@router.put("/{group_id}", response_model=GroupResponse)
async def update_group(
    group_id: int,
    group_data: GroupUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    更新分组
    """
    group = db.query(Group).filter(
        Group.id == group_id,
        Group.user_id == current_user.id
    ).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分组不存在"
        )
    
    # 更新字段
    update_data = group_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(group, field, value)
    
    db.commit()
    db.refresh(group)
    
    return group


@router.delete("/{group_id}", response_model=MessageResponse)
async def delete_group(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    删除分组
    
    NOTE: 会同时删除分组下的所有卡片（级联删除）
    """
    group = db.query(Group).filter(
        Group.id == group_id,
        Group.user_id == current_user.id
    ).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分组不存在"
        )
    
    db.delete(group)
    db.commit()
    
    return MessageResponse(message="分组已删除", success=True)


@router.put("/sort/batch", response_model=MessageResponse)
async def sort_groups(
    sort_data: SortRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    批量更新分组排序
    """
    for item in sort_data.items:
        group = db.query(Group).filter(
            Group.id == item.id,
            Group.user_id == current_user.id
        ).first()
        
        if group:
            group.sort_order = item.sort_order
    
    db.commit()
    
    return MessageResponse(message="排序已更新", success=True)
