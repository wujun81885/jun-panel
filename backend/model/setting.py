"""
用户设置模型定义
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from repository.database import Base


class Setting(Base):
    """
    用户设置表
    存储每个用户的个性化配置
    """
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    # 主题配置
    theme = Column(String(20), default="dark")  # dark / light
    wallpaper = Column(String(500), nullable=True)  # 壁纸 URL
    wallpaper_blur = Column(Integer, default=0)  # 壁纸模糊度 0-20
    
    # 网络模式
    use_external_url = Column(Boolean, default=False)  # 使用外网地址
    
    # 显示配置
    show_search_bar = Column(Boolean, default=True)  # 显示搜索框
    search_engine = Column(String(50), default="google")  # 默认搜索引擎
    card_style = Column(String(20), default="normal")  # normal / compact / large
    
    # 自定义样式
    custom_css = Column(Text, nullable=True)
    custom_js = Column(Text, nullable=True)
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关联关系
    user = relationship("User", back_populates="setting")
