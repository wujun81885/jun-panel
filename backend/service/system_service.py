"""
系统监控服务
获取 CPU、内存、磁盘等系统状态信息
"""
import psutil
from schema.schemas import SystemStatus


def get_system_status() -> SystemStatus:
    """
    获取当前系统状态信息
    
    Returns:
        SystemStatus 对象，包含 CPU、内存、磁盘使用率
    """
    # CPU 使用率（采样间隔 0.5 秒以获取更准确的值）
    cpu_percent = psutil.cpu_percent(interval=0.5)
    
    # 内存信息
    memory = psutil.virtual_memory()
    memory_percent = memory.percent
    memory_used = memory.used
    memory_total = memory.total
    
    # 磁盘信息（默认获取根分区）
    try:
        disk = psutil.disk_usage("/")
    except Exception:
        # Windows 系统使用 C 盘
        disk = psutil.disk_usage("C:\\")
    
    disk_percent = disk.percent
    disk_used = disk.used
    disk_total = disk.total
    
    return SystemStatus(
        cpu_percent=cpu_percent,
        memory_percent=memory_percent,
        memory_used=memory_used,
        memory_total=memory_total,
        disk_percent=disk_percent,
        disk_used=disk_used,
        disk_total=disk_total
    )


def format_bytes(bytes_value: int) -> str:
    """
    将字节数格式化为人类可读的字符串
    
    Args:
        bytes_value: 字节数
    
    Returns:
        格式化后的字符串，如 "1.5 GB"
    """
    for unit in ["B", "KB", "MB", "GB", "TB"]:
        if bytes_value < 1024:
            return f"{bytes_value:.1f} {unit}"
        bytes_value /= 1024
    return f"{bytes_value:.1f} PB"
