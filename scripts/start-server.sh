#!/bin/bash

# 服务器端启动脚本 - npi-demo
# 在阿里云服务器上直接执行此脚本启动项目

set -e

PROJECT_DIR="/root/npi-demo"
PM2_APP_NAME="npi-demo"

echo "======================================"
echo "  npi-demo 启动脚本"
echo "  项目目录: $PROJECT_DIR"
echo "  内存限制: 512MB"
echo "  端口: 3002"
echo "======================================"
echo ""

# 检查目录是否存在
if [ ! -d "$PROJECT_DIR" ]; then
  echo "✗ 项目目录不存在: $PROJECT_DIR"
  echo "请先执行: git clone <仓库地址> $PROJECT_DIR"
  exit 1
fi

cd $PROJECT_DIR

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
  echo "安装依赖..."
  npm install
fi

# 检查是否已构建
if [ ! -d ".next" ]; then
  echo "构建项目..."
  npm run build
fi

# 启动 PM2
echo "启动 PM2 服务..."
pm2 start ecosystem.config.cjs || pm2 reload ecosystem.config.cjs --update-env
pm2 save

echo ""
echo "======================================"
echo "  启动完成！"
echo "======================================"
echo ""
pm2 status
echo ""
echo "访问地址: http://8.130.182.148:3002"
echo ""
echo "常用命令:"
echo "  pm2 logs $PM2_APP_NAME    # 查看日志"
echo "  pm2 monit                 # 监控资源使用"
echo "  pm2 restart $PM2_APP_NAME # 重启服务"
echo "  pm2 stop $PM2_APP_NAME    # 停止服务"
echo "  pm2 delete $PM2_APP_NAME  # 删除服务"
