"""
Docker 容器管理服务
与 Docker API 交互，实现容器的查询和控制
"""
import logging
from typing import List, Optional
import docker
from docker.errors import DockerException, NotFound, APIError

from schema.schemas import DockerContainer

logger = logging.getLogger(__name__)


class DockerService:
    """
    Docker 服务类
    封装 Docker SDK 操作，提供容器管理功能
    """
    
    def __init__(self):
        """初始化 Docker 客户端"""
        self._client: Optional[docker.DockerClient] = None
    
    @property
    def client(self) -> Optional[docker.DockerClient]:
        """
        懒加载 Docker 客户端
        避免在 Docker 不可用时影响其他功能
        """
        if self._client is None:
            try:
                self._client = docker.from_env()
                # 测试连接
                self._client.ping()
            except DockerException as e:
                logger.warning(f"Docker 连接失败: {e}")
                self._client = None
        return self._client
    
    def is_available(self) -> bool:
        """检查 Docker 是否可用"""
        return self.client is not None
    
    def list_containers(self, all_containers: bool = True) -> List[DockerContainer]:
        """
        获取所有容器列表
        
        Args:
            all_containers: 是否包含已停止的容器
        
        Returns:
            DockerContainer 对象列表
        """
        if not self.is_available():
            return []
        
        try:
            containers = self.client.containers.list(all=all_containers)
            result = []
            
            for container in containers:
                # 解析端口映射
                ports = {}
                if container.ports:
                    for port, bindings in container.ports.items():
                        if bindings:
                            ports[port] = [b["HostPort"] for b in bindings if b.get("HostPort")]
                
                result.append(DockerContainer(
                    id=container.short_id,
                    name=container.name,
                    image=container.image.tags[0] if container.image.tags else container.image.short_id,
                    status=container.status,
                    state=container.attrs.get("State", {}).get("Status", "unknown"),
                    created=container.attrs.get("Created", ""),
                    ports=ports
                ))
            
            return result
        except DockerException as e:
            logger.error(f"获取容器列表失败: {e}")
            return []
    
    def get_container(self, container_id: str) -> Optional[DockerContainer]:
        """
        获取单个容器信息
        
        Args:
            container_id: 容器 ID 或名称
        
        Returns:
            DockerContainer 对象，不存在返回 None
        """
        if not self.is_available():
            return None
        
        try:
            container = self.client.containers.get(container_id)
            ports = {}
            if container.ports:
                for port, bindings in container.ports.items():
                    if bindings:
                        ports[port] = [b["HostPort"] for b in bindings if b.get("HostPort")]
            
            return DockerContainer(
                id=container.short_id,
                name=container.name,
                image=container.image.tags[0] if container.image.tags else container.image.short_id,
                status=container.status,
                state=container.attrs.get("State", {}).get("Status", "unknown"),
                created=container.attrs.get("Created", ""),
                ports=ports
            )
        except NotFound:
            return None
        except DockerException as e:
            logger.error(f"获取容器信息失败: {e}")
            return None
    
    def start_container(self, container_id: str) -> bool:
        """启动容器"""
        if not self.is_available():
            return False
        
        try:
            container = self.client.containers.get(container_id)
            container.start()
            return True
        except (NotFound, APIError) as e:
            logger.error(f"启动容器失败: {e}")
            return False
    
    def stop_container(self, container_id: str) -> bool:
        """停止容器"""
        if not self.is_available():
            return False
        
        try:
            container = self.client.containers.get(container_id)
            container.stop(timeout=10)
            return True
        except (NotFound, APIError) as e:
            logger.error(f"停止容器失败: {e}")
            return False
    
    def restart_container(self, container_id: str) -> bool:
        """重启容器"""
        if not self.is_available():
            return False
        
        try:
            container = self.client.containers.get(container_id)
            container.restart(timeout=10)
            return True
        except (NotFound, APIError) as e:
            logger.error(f"重启容器失败: {e}")
            return False
    
    def pause_container(self, container_id: str) -> bool:
        """暂停容器"""
        if not self.is_available():
            return False
        
        try:
            container = self.client.containers.get(container_id)
            container.pause()
            return True
        except (NotFound, APIError) as e:
            logger.error(f"暂停容器失败: {e}")
            return False
    
    def unpause_container(self, container_id: str) -> bool:
        """恢复容器"""
        if not self.is_available():
            return False
        
        try:
            container = self.client.containers.get(container_id)
            container.unpause()
            return True
        except (NotFound, APIError) as e:
            logger.error(f"恢复容器失败: {e}")
            return False


# 全局单例
docker_service = DockerService()
