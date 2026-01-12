"""
认证服务
处理用户认证、密码加密、JWT Token 管理
"""
import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from repository.database import get_db
from model.user import User
from model.setting import Setting
from schema.schemas import TokenData

# JWT 配置（从环境变量读取，确保安全性）
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jun-panel-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 默认 24 小时

# 密码加密上下文
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 认证方案
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码是否匹配"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """生成密码哈希"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    创建 JWT 访问令牌
    
    Args:
        data: 需要编码的数据（通常包含 user_id）
        expires_delta: 过期时间增量
    
    Returns:
        JWT Token 字符串
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[TokenData]:
    """
    解码并验证 JWT Token
    
    Args:
        token: JWT Token 字符串
    
    Returns:
        TokenData 对象，验证失败返回 None
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        email: str = payload.get("email")
        if user_id is None:
            return None
        return TokenData(user_id=user_id, email=email)
    except JWTError:
        return None


async def get_current_user(
    db: Session = Depends(get_db)
) -> User:
    """
    修改后的获取当前用户逻辑：
    始终返回默认管理员账号，实现免登录访问。
    """
    # 获取数据库中的第一个用户（通常是管理员）
    user = db.query(User).first()
    
    if not user:
        # 理论上不会发生，因为 main.py 启动时会创建
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="系统初始化错误：数据库无用户"
        )
    
    return user


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """
    验证用户邮箱和密码
    
    Args:
        db: 数据库会话
        email: 用户邮箱
        password: 明文密码
    
    Returns:
        验证成功返回 User 对象，失败返回 None
    """
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def create_user(db: Session, username: str, email: str, password: str, is_admin: bool = False) -> User:
    """
    创建新用户
    
    Args:
        db: 数据库会话
        username: 用户名
        email: 邮箱
        password: 明文密码
        is_admin: 是否为管理员
    
    Returns:
        创建的 User 对象
    """
    hashed_password = get_password_hash(password)
    user = User(
        username=username,
        email=email,
        password_hash=hashed_password,
        is_admin=is_admin
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # 为新用户创建默认设置
    setting = Setting(user_id=user.id)
    db.add(setting)
    db.commit()
    
    return user
