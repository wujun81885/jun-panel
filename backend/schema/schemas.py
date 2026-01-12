"""
Pydantic 数据验证模式定义
用于 API 请求/响应的数据校验
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


# ==================== 用户相关 Schema ====================

class UserBase(BaseModel):
    """用户基础信息"""
    username: str = Field(..., min_length=2, max_length=50)
    email: EmailStr


class UserCreate(UserBase):
    """用户注册请求"""
    password: str = Field(..., min_length=6, max_length=100)


class UserLogin(BaseModel):
    """用户登录请求"""
    email: EmailStr
    password: str


class UserResponse(UserBase):
    """用户响应数据"""
    id: int
    avatar: Optional[str] = None
    is_active: bool
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    """JWT Token 响应"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token 解析数据"""
    user_id: Optional[int] = None
    email: Optional[str] = None


# ==================== 分组相关 Schema ====================

class GroupBase(BaseModel):
    """分组基础信息"""
    name: str = Field(..., min_length=1, max_length=100)
    icon: Optional[str] = None
    sort_order: int = 0


class GroupCreate(GroupBase):
    """创建分组请求"""
    pass


class GroupUpdate(BaseModel):
    """更新分组请求"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    icon: Optional[str] = None
    sort_order: Optional[int] = None
    is_collapsed: Optional[int] = None


class GroupResponse(GroupBase):
    """分组响应数据"""
    id: int
    user_id: int
    is_collapsed: int
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== 导航卡片相关 Schema ====================

class CardBase(BaseModel):
    """卡片基础信息"""
    title: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    icon: Optional[str] = None
    icon_type: str = "iconify"
    icon_background: Optional[str] = None
    internal_url: Optional[str] = None
    external_url: Optional[str] = None
    open_in_new_tab: bool = True
    open_in_iframe: bool = False
    sort_order: int = 0


class CardCreate(CardBase):
    """创建卡片请求"""
    group_id: Optional[int] = None


class CardUpdate(BaseModel):
    """更新卡片请求"""
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    group_id: Optional[int] = None
    icon: Optional[str] = None
    icon_type: Optional[str] = None
    icon_background: Optional[str] = None
    internal_url: Optional[str] = None
    external_url: Optional[str] = None
    open_in_new_tab: Optional[bool] = None
    open_in_iframe: Optional[bool] = None
    sort_order: Optional[int] = None


class CardResponse(CardBase):
    """卡片响应数据"""
    id: int
    user_id: int
    group_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class CardWithGroup(CardResponse):
    """卡片响应（含分组信息）"""
    group: Optional[GroupResponse] = None


# ==================== 用户设置相关 Schema ====================

class SettingBase(BaseModel):
    """设置基础信息"""
    theme: str = "dark"
    wallpaper: Optional[str] = None
    wallpaper_blur: int = 0
    use_external_url: bool = False
    show_search_bar: bool = True
    search_engine: str = "google"
    card_style: str = "normal"
    custom_css: Optional[str] = None
    custom_js: Optional[str] = None


class SettingUpdate(BaseModel):
    """更新设置请求"""
    theme: Optional[str] = None
    wallpaper: Optional[str] = None
    wallpaper_blur: Optional[int] = None
    use_external_url: Optional[bool] = None
    show_search_bar: Optional[bool] = None
    search_engine: Optional[str] = None
    card_style: Optional[str] = None
    custom_css: Optional[str] = None
    custom_js: Optional[str] = None


class SettingResponse(SettingBase):
    """设置响应数据"""
    id: int
    user_id: int

    class Config:
        from_attributes = True


# ==================== 系统状态相关 Schema ====================

class SystemStatus(BaseModel):
    """系统状态信息"""
    cpu_percent: float
    memory_percent: float
    memory_used: int  # bytes
    memory_total: int  # bytes
    disk_percent: float
    disk_used: int  # bytes
    disk_total: int  # bytes


# ==================== Docker 相关 Schema ====================

class DockerContainer(BaseModel):
    """Docker 容器信息"""
    id: str
    name: str
    image: str
    status: str
    state: str  # running, exited, paused, etc.
    created: str
    ports: dict = {}


class DockerContainerAction(BaseModel):
    """Docker 容器操作"""
    action: str = Field(..., pattern="^(start|stop|restart|pause|unpause)$")


# ==================== 排序相关 Schema ====================

class SortItem(BaseModel):
    """排序项"""
    id: int
    sort_order: int
    group_id: Optional[int] = None # 用于跨组拖动


class SortRequest(BaseModel):
    """批量排序请求"""
    items: List[SortItem]


# ==================== 通用响应 Schema ====================

class MessageResponse(BaseModel):
    """通用消息响应"""
    message: str
    success: bool = True
