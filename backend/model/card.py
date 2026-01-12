"""
导航卡片模型定义
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from repository.database import Base


class Card(Base):
    """
    导航卡片表
    存储每个导航入口的配置信息
    """
    __tablename__ = "cards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=True)  # 可选分组
    
    # 基本信息
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    
    # 图标配置
    icon = Column(String(500), nullable=True)  # Iconify 图标名称或自定义图标 URL
    icon_type = Column(String(20), default="iconify")  # iconify / url / upload
    icon_background = Column(String(50), nullable=True)  # 图标背景色
    
    # URL 配置（支持内外网切换）
    internal_url = Column(String(500), nullable=True)  # 内网地址
    external_url = Column(String(500), nullable=True)  # 外网地址
    
    # 行为配置
    open_in_new_tab = Column(Boolean, default=True)  # 新标签页打开
    open_in_iframe = Column(Boolean, default=False)  # 小窗口打开
    
    # 排序
    sort_order = Column(Integer, default=0)
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关联关系
    user = relationship("User", back_populates="cards")
    group = relationship("Group", back_populates="cards")
