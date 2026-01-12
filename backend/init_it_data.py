import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from repository.database import SessionLocal, engine, Base
from model.card import Card
from model.group import Group
from sqlalchemy import text

# IT 宅男专属预设数据
PRESET_GROUPS = [
    {"name": "💻 开发控制台", "order": 1},
    {"name": "🏠 HomeLab 实验室", "order": 2},
    {"name": "🌐 极客社区", "order": 3},
    {"name": "🎮 数字生活", "order": 4},
    {"name": "📦 剁手清单", "order": 5},
]

PRESET_CARDS = [
    # 开发控制台 (6个)
    {"title": "GitHub", "url": "https://github.com", "icon": "mdi:github", "group": "💻 开发控制台", "desc": "代码托管", "color": "#24292e"},
    {"title": "ChatGPT", "url": "https://chat.openai.com", "icon": "mdi:robot", "group": "💻 开发控制台", "desc": "AI 助手", "color": "#10a37f"},
    {"title": "Stack Overflow", "url": "https://stackoverflow.com", "icon": "mdi:stack-overflow", "group": "💻 开发控制台", "desc": "疑难杂症", "color": "#f48024"},
    {"title": "Vercel", "url": "https://vercel.com", "icon": "mdi:triangle", "group": "💻 开发控制台", "desc": "前端部署", "color": "#000000"},
    {"title": "Docker Hub", "url": "https://hub.docker.com", "icon": "mdi:docker", "group": "💻 开发控制台", "desc": "容器镜像", "color": "#0db7ed"},
    {"title": "GitLab", "url": "https://gitlab.com", "icon": "mdi:gitlab", "group": "💻 开发控制台", "desc": "DevOps", "color": "#fc6d26"},

    # HomeLab 实验室 (6个)
    {"title": "OpenWrt", "url": "http://192.168.1.1", "icon": "mdi:router-wireless", "group": "🏠 HomeLab 实验室", "desc": "主路由", "color": "#00a1d6"},
    {"title": "NAS", "url": "http://192.168.1.10", "icon": "mdi:nas", "group": "🏠 HomeLab 实验室", "desc": "数据中心", "color": "#0057b8"},
    {"title": "Home Assistant", "url": "http://homeassistant.local:8123", "icon": "mdi:home-automation", "group": "🏠 HomeLab 实验室", "desc": "智能家居", "color": "#03a9f4"},
    {"title": "Jellyfin", "url": "http://192.168.1.10:8096", "icon": "mdi:movie-roll", "group": "🏠 HomeLab 实验室", "desc": "媒体中心", "color": "#7266ba"},
    {"title": "QBittorrent", "url": "http://192.168.1.10:8080", "icon": "mdi:download-network", "group": "🏠 HomeLab 实验室", "desc": "以及下载", "color": "#2f67ba"},
    {"title": "Proxmox", "url": "https://192.168.1.2:8006", "icon": "mdi:server-network", "group": "🏠 HomeLab 实验室", "desc": "虚拟机", "color": "#e57000"},

    # 极客社区 (6个)
    {"title": "V2EX", "url": "https://www.v2ex.com", "icon": "mdi:alpha-v-box", "group": "🌐 极客社区", "desc": "创意工作者", "color": "#333333"},
    {"title": "Hacker News", "url": "https://news.ycombinator.com", "icon": "mdi:y-combinator", "group": "🌐 极客社区", "desc": "黑客新闻", "color": "#ff6600"},
    {"title": "Reddit", "url": "https://www.reddit.com", "icon": "mdi:reddit", "group": "🌐 极客社区", "desc": "互联网首页", "color": "#ff4500"},
    {"title": "Product Hunt", "url": "https://www.producthunt.com", "icon": "mdi:alpha-p-circle", "group": "🌐 极客社区", "desc": "新产品发现", "color": "#da552f"},
    {"title": "少数派", "url": "https://sspai.com", "icon": "mdi:water-percent", "group": "🌐 极客社区", "desc": "高效工作", "color": "#d71a1b"},
    {"title": "知乎", "url": "https://www.zhihu.com", "icon": "mdi:alpha-z-box", "group": "🌐 极客社区", "desc": "有问题", "color": "#0084ff"},

    # 数字生活 (6个)
    {"title": "YouTube", "url": "https://www.youtube.com", "icon": "mdi:youtube", "group": "🎮 数字生活", "desc": "视频流", "color": "#ff0000"},
    {"title": "Bilibili", "url": "https://www.bilibili.com", "icon": "mdi:television-classic", "group": "🎮 数字生活", "desc": "干杯", "color": "#00a1d6"},
    {"title": "Steam", "url": "https://store.steampowered.com", "icon": "mdi:steam", "group": "🎮 数字生活", "desc": "Gamer", "color": "#171a21"},
    {"title": "Netflix", "url": "https://www.netflix.com", "icon": "mdi:netflix", "group": "🎮 数字生活", "desc": "剧集", "color": "#e50914"},
    {"title": "Spotify", "url": "https://open.spotify.com", "icon": "mdi:spotify", "group": "🎮 数字生活", "desc": "音乐", "color": "#1db954"},
    {"title": "Twitch", "url": "https://www.twitch.tv", "icon": "mdi:twitch", "group": "🎮 数字生活", "desc": "直播", "color": "#9146ff"},

    # 剁手清单 (6个)
    {"title": "淘宝", "url": "https://www.taobao.com", "icon": "mdi:shopping", "group": "📦 剁手清单", "desc": "万能的淘宝", "color": "#ff5000"},
    {"title": "京东", "url": "https://www.jd.com", "icon": "mdi:shopping-outline", "group": "📦 剁手清单", "desc": "多快好省", "color": "#e1251b"},
    {"title": "什么值得买", "url": "https://www.smzdm.com", "icon": "mdi:sale", "group": "📦 剁手清单", "desc": "值才重要", "color": "#e22e26"},
    {"title": "闲鱼", "url": "https://2.taobao.com", "icon": "mdi:fish", "group": "📦 剁手清单", "desc": "捡垃圾", "color": "#ffda44"},
    {"title": "拼多多", "url": "https://www.pinduoduo.com", "icon": "mdi:heart", "group": "📦 剁手清单", "desc": "真香", "color": "#e02e24"},
    {"title": "1688", "url": "https://www.1688.com", "icon": "mdi:factory", "group": "📦 剁手清单", "desc": "批发进货", "color": "#ff7300"},
]

from model.user import User

def reset_data():
    print("🚀 开始重置数据...")
    session = SessionLocal()
    try:
        # 0. 获取或创建默认管理员用户
        admin_user = session.query(User).filter_by(username="admin").first()
        if not admin_user:
            print("👤 创建默认管理员用户...")
            from passlib.context import CryptContext
            pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
            admin_user = User(
                username="admin",
                password_hash=pwd_context.hash("admin"),
                is_admin=True
            )
            session.add(admin_user)
            session.flush()
        
        user_id = admin_user.id

        # 1. 清空数据
        print("🧹 清空现有卡片和分组...")
        session.query(Card).delete()
        session.query(Group).delete()
        session.commit()

        # 2. 创建分组
        print("🔨 创建 IT 宅男专属分组...")
        group_map = {}
        for g_data in PRESET_GROUPS:
            group = Group(
                name=g_data["name"],
                user_id=user_id  # 添加 user_id
            )
            session.add(group)
            session.flush() # 获取 ID
            group_map[g_data["name"]] = group.id
        
        # 3. 创建卡片
        print("🃏 发牌中 (添加 20 张常用卡片)...")
        for c_data in PRESET_CARDS:
            group_id = group_map.get(c_data["group"])
            card = Card(
                title=c_data["title"],
                internal_url=c_data["url"],
                external_url=c_data["url"],
                icon=c_data["icon"],
                icon_type="iconify",
                description=c_data["desc"],
                group_id=group_id,
                user_id=user_id, # 添加 user_id
                icon_background=c_data["color"],
                open_in_new_tab=True,
                open_in_iframe=False
            )
            session.add(card)
        
        session.commit()
        print("✨ 数据重置完成！请刷新前端页面。")
    except Exception as e:
        print(f"❌ 发生错误: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    reset_data()
