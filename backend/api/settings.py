"""
用户设置 API 路由
处理用户个性化配置
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from repository.database import get_db
from model.user import User
from model.setting import Setting
from schema.schemas import SettingResponse, SettingUpdate, MessageResponse
from service.auth_service import get_current_user

router = APIRouter(prefix="/api/settings", tags=["用户设置"])


@router.get("", response_model=SettingResponse)
async def get_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取当前用户的设置
    """
    setting = db.query(Setting).filter(
        Setting.user_id == current_user.id
    ).first()
    
    # 如果没有设置记录，创建默认设置
    if not setting:
        setting = Setting(user_id=current_user.id)
        db.add(setting)
        db.commit()
        db.refresh(setting)
    
    return setting


@router.put("", response_model=SettingResponse)
async def update_settings(
    setting_data: SettingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    更新用户设置
    """
    setting = db.query(Setting).filter(
        Setting.user_id == current_user.id
    ).first()
    
    # 如果没有设置记录，创建新的
    if not setting:
        setting = Setting(user_id=current_user.id)
        db.add(setting)
    
    # 更新字段
    update_data = setting_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(setting, field, value)
    
    db.commit()
    db.refresh(setting)
    
    return setting


@router.post("/toggle-network", response_model=SettingResponse)
async def toggle_network_mode(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    切换内外网模式
    
    一键切换当前网络模式（内网 <-> 外网）
    """
    setting = db.query(Setting).filter(
        Setting.user_id == current_user.id
    ).first()
    
    if not setting:
        setting = Setting(user_id=current_user.id)
        db.add(setting)
    
    # 切换网络模式
    setting.use_external_url = not setting.use_external_url
    
    db.commit()
    db.refresh(setting)
    
    return setting


@router.post("/reset", response_model=MessageResponse)
async def reset_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    重置用户设置为默认值
    """
    setting = db.query(Setting).filter(
        Setting.user_id == current_user.id
    ).first()
    
    if setting:
        # 重置为默认值
        setting.theme = "dark"
        setting.wallpaper = None
        setting.wallpaper_blur = 0
        setting.use_external_url = False
        setting.show_search_bar = True
        setting.search_engine = "google"
        setting.card_style = "normal"
        setting.custom_css = None
        setting.custom_js = None
        
        db.commit()
    
    return MessageResponse(message="设置已重置", success=True)
