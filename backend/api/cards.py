"""
导航卡片 API 路由
处理卡片的增删改查和排序
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from repository.database import get_db
from model.user import User
from model.card import Card
from model.group import Group
from schema.schemas import (
    CardCreate, CardUpdate, CardResponse, CardWithGroup,
    SortRequest, MessageResponse
)
from service.auth_service import get_current_user

router = APIRouter(prefix="/api/cards", tags=["导航卡片"])


@router.get("", response_model=List[CardWithGroup])
async def get_cards(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取当前用户的所有导航卡片
    """
    cards = db.query(Card).filter(
        Card.user_id == current_user.id
    ).order_by(Card.sort_order).all()
    
    return cards


@router.get("/{card_id}", response_model=CardResponse)
async def get_card(
    card_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取单个卡片详情
    """
    card = db.query(Card).filter(
        Card.id == card_id,
        Card.user_id == current_user.id
    ).first()
    
    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="卡片不存在"
        )
    
    return card


@router.post("", response_model=CardResponse, status_code=status.HTTP_201_CREATED)
async def create_card(
    card_data: CardCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    创建新的导航卡片
    """
    # 验证分组是否属于当前用户
    if card_data.group_id:
        group = db.query(Group).filter(
            Group.id == card_data.group_id,
            Group.user_id == current_user.id
        ).first()
        if not group:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="分组不存在"
            )
    
    # 获取当前最大排序值
    max_order = db.query(Card).filter(
        Card.user_id == current_user.id
    ).count()
    
    card = Card(
        user_id=current_user.id,
        group_id=card_data.group_id,
        title=card_data.title,
        description=card_data.description,
        icon=card_data.icon,
        icon_type=card_data.icon_type,
        icon_background=card_data.icon_background,
        internal_url=card_data.internal_url,
        external_url=card_data.external_url,
        open_in_new_tab=card_data.open_in_new_tab,
        open_in_iframe=card_data.open_in_iframe,
        sort_order=max_order
    )
    
    db.add(card)
    db.commit()
    db.refresh(card)
    
    return card


@router.put("/{card_id}", response_model=CardResponse)
async def update_card(
    card_id: int,
    card_data: CardUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    更新导航卡片
    """
    card = db.query(Card).filter(
        Card.id == card_id,
        Card.user_id == current_user.id
    ).first()
    
    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="卡片不存在"
        )
    
    # 验证新分组是否属于当前用户
    if card_data.group_id is not None:
        if card_data.group_id > 0:
            group = db.query(Group).filter(
                Group.id == card_data.group_id,
                Group.user_id == current_user.id
            ).first()
            if not group:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="分组不存在"
                )
    
    # 更新字段
    update_data = card_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(card, field, value)
    
    db.commit()
    db.refresh(card)
    
    return card


@router.delete("/{card_id}", response_model=MessageResponse)
async def delete_card(
    card_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    删除导航卡片
    """
    card = db.query(Card).filter(
        Card.id == card_id,
        Card.user_id == current_user.id
    ).first()
    
    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="卡片不存在"
        )
    
    db.delete(card)
    db.commit()
    
    return MessageResponse(message="卡片已删除", success=True)


@router.put("/sort/batch", response_model=MessageResponse)
async def sort_cards(
    sort_data: SortRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    批量更新卡片排序
    """
    for item in sort_data.items:
        card = db.query(Card).filter(
            Card.id == item.id,
            Card.user_id == current_user.id
        ).first()
        
        if card:
            card.sort_order = item.sort_order
            # 如果提供了 group_id，则处理分组变更（支持跨组拖动）
            if item.group_id is not None:
                # 只有当 ID > 0 时才更新为特定分组，如果为 0 或 -1 可能代表未分组（视前端逻辑而定）
                # 这里假设前端传来的 group_id 是准确的数据库 ID
                # 如果要设为未分组，前端应该传 None 吗？Schema 里 group_id 是 int。
                # 这里的逻辑：如果 item.group_id >= 0 才更新。如果是 None 或没传就不动。
                # 但 Optional[int] 默认为 None。
                card.group_id = item.group_id if item.group_id > 0 else None
    
    db.commit()
    
    return MessageResponse(message="排序已更新", success=True)
