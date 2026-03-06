#!/bin/bash

# 阿里云部署脚本 - npi-demo 项目
# 策略：本地构建 + rsync 上传 standalone 产物 + PM2 重启
# 优势：节省服务器磁盘和内存，构建速度更快

set -e

PROJECT_DIR="/root/npi-demo"
PM2_APP_NAME="npi-demo"
SERVER="root@8.130.182.148"
LOCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "======================================"
echo "  npi-demo 部署（本地构建模式）"
echo "  端口: 3002"
echo "======================================"
echo ""

# 1. 本地构建
echo "步骤 1/4: 本地构建..."
cd "$LOCAL_DIR"
npm run build
echo "✓ 本地构建完成"
echo ""

# 2. 在服务器上创建目录结构
echo "步骤 2/4: 准备服务器目录..."
ssh $SERVER "mkdir -p $PROJECT_DIR"
echo "✓ 服务器目录就绪"
echo ""

# 3. 上传 standalone 产物
echo "步骤 3/4: 上传构建产物..."

# 上传 standalone 目录（核心运行文件）
rsync -azP --delete \
  "$LOCAL_DIR/.next/standalone/" \
  "$SERVER:$PROJECT_DIR/"

# 上传静态资源（standalone 不包含 static 和 public）
rsync -azP --delete \
  "$LOCAL_DIR/.next/static" \
  "$SERVER:$PROJECT_DIR/.next/"

# 上传 public 目录（如果存在）
if [ -d "$LOCAL_DIR/public" ]; then
  rsync -azP --delete \
    "$LOCAL_DIR/public/" \
    "$SERVER:$PROJECT_DIR/public/"
fi

# 上传 PM2 配置
rsync -azP \
  "$LOCAL_DIR/ecosystem.config.cjs" \
  "$SERVER:$PROJECT_DIR/"

# 上传 scripts 目录（Python 对比脚本等）
rsync -azP \
  "$LOCAL_DIR/scripts/compare_2d_3d.py" \
  "$SERVER:$PROJECT_DIR/scripts/"

echo "✓ 构建产物上传完成"
echo ""

# 4. 启动/重启 PM2
echo "步骤 4/4: 启动/重启服务..."
ssh $SERVER "cd $PROJECT_DIR && pm2 reload ecosystem.config.cjs --update-env 2>/dev/null || pm2 start ecosystem.config.cjs"
ssh $SERVER "pm2 save"
echo "✓ 服务已启动"
echo ""

# 5. 显示结果
echo "======================================"
echo "  部署完成！"
echo "======================================"
echo ""
ssh $SERVER "pm2 status"
echo ""
echo "访问地址: http://8.130.182.148:3002"
echo ""
echo "查看日志:  ssh $SERVER 'pm2 logs $PM2_APP_NAME --lines 50'"
echo "查看内存:  ssh $SERVER 'pm2 monit'"
