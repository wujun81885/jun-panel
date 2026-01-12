"""
文件上传 API 路由
处理图标、壁纸等文件上传
"""
import os
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse

from model.user import User
from schema.schemas import MessageResponse
from service.auth_service import get_current_user

router = APIRouter(prefix="/api/upload", tags=["文件上传"])

# 上传文件存储目录
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "data/uploads")
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp", "svg", "ico"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

# 确保上传目录存在
os.makedirs(UPLOAD_DIR, exist_ok=True)


def get_file_extension(filename: str) -> str:
    """获取文件扩展名"""
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


def is_allowed_file(filename: str) -> bool:
    """检查文件类型是否允许"""
    return get_file_extension(filename) in ALLOWED_EXTENSIONS


@router.post("/icon")
async def upload_icon(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    上传图标文件
    
    返回上传后的文件 URL
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="文件名不能为空"
        )
    
    if not is_allowed_file(file.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"不支持的文件类型，仅支持: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # 检查文件大小
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"文件大小超过限制（最大 {MAX_FILE_SIZE // 1024 // 1024}MB）"
        )
    
    # 生成唯一文件名
    ext = get_file_extension(file.filename)
    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    
    # 按用户分目录存储
    user_dir = os.path.join(UPLOAD_DIR, f"user_{current_user.id}", "icons")
    os.makedirs(user_dir, exist_ok=True)
    
    file_path = os.path.join(user_dir, unique_filename)
    
    # 保存文件
    with open(file_path, "wb") as f:
        f.write(content)
    
    # 返回相对 URL
    file_url = f"/api/upload/files/user_{current_user.id}/icons/{unique_filename}"
    
    return {
        "success": True,
        "url": file_url,
        "filename": unique_filename
    }


@router.post("/wallpaper")
async def upload_wallpaper(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    上传壁纸文件
    
    返回上传后的文件 URL
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="文件名不能为空"
        )
    
    if not is_allowed_file(file.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"不支持的文件类型，仅支持: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # 壁纸允许更大的文件
    wallpaper_max_size = 10 * 1024 * 1024  # 10MB
    content = await file.read()
    if len(content) > wallpaper_max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"文件大小超过限制（最大 {wallpaper_max_size // 1024 // 1024}MB）"
        )
    
    # 生成唯一文件名
    ext = get_file_extension(file.filename)
    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    
    # 按用户分目录存储
    user_dir = os.path.join(UPLOAD_DIR, f"user_{current_user.id}", "wallpapers")
    os.makedirs(user_dir, exist_ok=True)
    
    file_path = os.path.join(user_dir, unique_filename)
    
    # 保存文件
    with open(file_path, "wb") as f:
        f.write(content)
    
    # 返回相对 URL
    file_url = f"/api/upload/files/user_{current_user.id}/wallpapers/{unique_filename}"
    
    return {
        "success": True,
        "url": file_url,
        "filename": unique_filename
    }


@router.get("/files/{file_path:path}")
async def get_file(file_path: str):
    """
    获取上传的文件
    
    静态文件服务
    """
    full_path = os.path.join(UPLOAD_DIR, file_path)
    
    if not os.path.exists(full_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文件不存在"
        )
    
    return FileResponse(full_path)


@router.delete("/files/{file_path:path}", response_model=MessageResponse)
async def delete_file(
    file_path: str,
    current_user: User = Depends(get_current_user)
):
    """
    删除上传的文件
    
    只能删除自己上传的文件
    """
    # 安全检查：只能删除自己的文件
    if not file_path.startswith(f"user_{current_user.id}/"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权删除该文件"
        )
    
    full_path = os.path.join(UPLOAD_DIR, file_path)
    
    if not os.path.exists(full_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文件不存在"
        )
    
    os.remove(full_path)
    
    return MessageResponse(message="文件已删除", success=True)
