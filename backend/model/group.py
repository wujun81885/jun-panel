"""
分组模型定义
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from repository.database import Base


class Group(Base):
    """
    分组表
    用于对导航卡片进行分组管理
    """
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    icon = Column(String(200), nullable=True)  # Iconify 图标名称或自定义图标 URL
    sort_order = Column(Integer, default=0)  # 排序顺序
    is_collapsed = Column(Integer, default=0)  # 是否折叠：0-展开，1-折叠
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关联关系
    user = relationship("User", back_populates="groups")
    cards = relationship("Card", back_populates="group", cascade="all, delete-orphan")
