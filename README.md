# Jun-Panel

一个服务器、NAS 导航面板，支持 Docker 管理和系统监控。

## ✨ 功能特性

- 🎨 **简洁美观**：现代化深色主题，毛玻璃效果
- 🏠 **导航管理**：自定义导航卡片，支持分组和排序
- 🌐 **内外网切换**：一键切换内网/外网访问地址
- 📊 **系统监控**：实时显示 CPU、内存、磁盘使用率
- 🐳 **Docker 管理**：查看容器状态，启停容器
- 🔍 **搜索功能**：多搜索引擎支持
- 👥 **多账户**：支持多用户隔离
- 🎭 **自定义**：壁纸、主题、图标自由搭配

## 🚀 快速部署

### 使用 Docker Compose（推荐）

```bash
# 克隆项目
git clone https://github.com/yourname/jun-panel.git
cd jun-panel

# 启动服务
docker-compose up -d

# 访问
# http://your-nas-ip:3000
```

### 默认账号

- 邮箱：`admin@jun.panel`
- 密码：`123456`

> ⚠️ 首次登录后请立即修改密码！

## 🔄 如何更新

如果你使用 Docker Compose 部署，请执行以下命令更新到最新版本：

```bash
# 1. 进入项目目录
cd jun-panel

# 2. 拉取最新代码
git pull

# 3. 重新构建并启动容器
docker-compose up -d --build

# 4. 清理旧镜像（可选）
docker image prune -f
```

## 📦 手动构建

```bash
# 构建镜像
docker build -t jun-panel:latest .

# 运行容器
docker run -d \
  --name jun-panel \
  -p 3000:8000 \
  -v $(pwd)/data:/app/data \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  jun-panel:latest
```

## ⚙️ 环境变量

| 变量                          | 说明           | 默认值                        |
| ----------------------------- | -------------- | ----------------------------- |
| `JWT_SECRET_KEY`              | JWT 密钥       | 随机生成                      |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token 过期时间 | 1440 (24 小时)                |
| `DATABASE_URL`                | 数据库路径     | sqlite:///./data/jun-panel.db |
| `UPLOAD_DIR`                  | 文件上传目录   | /app/data/uploads             |

## 📁 数据目录

```
data/
├── jun-panel.db    # SQLite 数据库
└── uploads/        # 上传的图标和壁纸
    └── user_*/
```

## 🛠️ 开发

### 后端开发

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### 前端开发

```bash
cd frontend
npm install
npm run dev
```

## 📝 技术栈

- **前端**：React + TypeScript + Vite
- **后端**：Python + FastAPI
- **数据库**：SQLite
- **容器化**：Docker

## 📄 许可证

MIT License

## 🙏 致谢

灵感来源于 [Sun-Panel](https://github.com/hslr-s/sun-panel)
