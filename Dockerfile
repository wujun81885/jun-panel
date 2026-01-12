# Build Stage for Frontend
FROM node:18-alpine as frontend-builder

WORKDIR /app/frontend

# Copy dependencies first to cache
COPY frontend/package*.json ./
RUN npm install --registry=https://registry.npmmirror.com

# Copy source
COPY frontend/ ./

# Build
RUN npm run build

# ==========================================

# Runtime Stage for Backend
FROM python:3.10-slim

WORKDIR /app

# Set Timezone
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Install dependencies
COPY backend/requirements.txt .
# Use mirror for faster install in China
RUN pip install --no-cache-dir -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

# Copy backend code
COPY backend/ .

# Copy frontend build artifacts from stage 1
# backend/main.py expects them in "web" directory
COPY --from=frontend-builder /app/frontend/dist ./web

# Create data directory for uploads and db
RUN mkdir -p data/uploads

# Environment Variables
ENV WEB_DIR=web
ENV UPLOAD_DIR=data/uploads
ENV DATABASE_URL=sqlite:///./data/jun_panel.db

# Expose port
EXPOSE 8000

# Start command
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
