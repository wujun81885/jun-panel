"""
服务健康检查 API
检测配置的服务 URL 是否在线
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import aiohttp
import asyncio
import time

router = APIRouter(prefix="/api/health", tags=["健康检查"])


class ServiceCheckRequest(BaseModel):
    """服务检查请求"""
    urls: List[str]
    timeout: int = 5


class ServiceStatus(BaseModel):
    """单个服务状态"""
    url: str
    is_online: bool
    status_code: Optional[int] = None
    response_time: Optional[float] = None  # ms
    error: Optional[str] = None


class HealthCheckResponse(BaseModel):
    """健康检查响应"""
    results: List[ServiceStatus]
    checked_at: str


async def check_service(url: str, timeout: int) -> ServiceStatus:
    """检查单个服务状态"""
    start = time.time()
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=timeout), ssl=False) as response:
                elapsed = (time.time() - start) * 1000
                return ServiceStatus(
                    url=url,
                    is_online=True,
                    status_code=response.status,
                    response_time=round(elapsed, 2)
                )
    except asyncio.TimeoutError:
        return ServiceStatus(url=url, is_online=False, error="Timeout")
    except aiohttp.ClientError as e:
        return ServiceStatus(url=url, is_online=False, error=str(e))
    except Exception as e:
        return ServiceStatus(url=url, is_online=False, error=str(e))


@router.post("/check", response_model=HealthCheckResponse)
async def check_services(request: ServiceCheckRequest):
    """
    批量检查服务健康状态
    
    接收 URL 列表，返回各服务的在线状态和响应时间
    """
    from datetime import datetime
    
    tasks = [check_service(url, request.timeout) for url in request.urls]
    results = await asyncio.gather(*tasks)
    
    return HealthCheckResponse(
        results=results,
        checked_at=datetime.utcnow().isoformat()
    )
