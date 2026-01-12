"""
Jun-Panel 数据库配置
使用 SQLAlchemy + SQLite 实现轻量级数据持久化
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 数据库文件路径（支持环境变量配置）
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/jun-panel.db")

# 确保数据目录存在
os.makedirs("data", exist_ok=True)

# 创建数据库引擎
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # SQLite 需要此配置
)

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 声明基类
Base = declarative_base()


def get_db():
    """
    获取数据库会话的依赖注入函数
    使用 yield 确保会话正确关闭
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    初始化数据库表结构
    在应用启动时调用
    """
    # NOTE: 需要先导入所有模型才能创建表
    from model import user, card, group, setting  # noqa: F401
    Base.metadata.create_all(bind=engine)
