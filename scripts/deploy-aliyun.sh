#!/bin/bash

# 阿里云部署脚本 - npi-demo 项目
# 内存限制: 512MB，端口: 3002

set -e

PROJECT_DIR="/root/npi-demo"
PM2_APP_NAME="npi-demo"
SERVER="root@8.130.182.148"

echo "======================================"
echo "  npi-demo 阿里云部署脚本"
echo "  内存限制: 512MB"
echo "  端口: 3002"
echo "======================================"
echo ""

# 1. 本地提交并推送
echo "步骤 1/4: 本地提交并推送代码..."
read -p "请输入提交信息: " COMMIT_MSG
git add -A
git commit -m "$COMMIT_MSG"
git push
echo "✓ 代码推送成功"
echo ""

# 2. 服务器拉取代码
echo "步骤 2/4: 服务器拉取最新代码..."
ssh $SERVER "cd $PROJECT_DIR && git pull"
echo "✓ 代码拉取成功"
echo ""

# 3. 安装依赖并构建（后台执行避免SSH超时）
echo "步骤 3/4: 构建项目（后台执行）..."
ssh $SERVER "cd $PROJECT_DIR && nohup sh -c 'npm install && npm run build' > /tmp/build.log 2>&1 &"
echo "✓ 构建已启动，等待完成..."
sleep 5

# 等待构建完成（最多5分钟）
for i in {1..30}; do
  if ssh $SERVER "test -f $PROJECT_DIR/.next/BUILD_ID && echo 'ready' || echo 'building'" | grep -q 'ready'; then
    echo "✓ 构建完成"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "✗ 构建超时，请手动检查: ssh $SERVER 'cat /tmp/build.log'"
    exit 1
  fi
  echo "  构建中... ($i/30)"
  sleep 10
done
echo ""

# 4. 启动/重启 PM2
echo "步骤 4/4: 启动/重启 PM2 服务..."
ssh $SERVER "cd $PROJECT_DIR && pm2 reload ecosystem.config.cjs --update-env || pm2 start ecosystem.config.cjs"
ssh $SERVER "pm2 save"
echo "✓ PM2 服务已启动"
echo ""

# 5. 显示服务状态
echo "======================================"
echo "  部署完成！"
echo "======================================"
echo ""
ssh $SERVER "pm2 status"
echo ""
echo "访问地址: http://8.130.182.148:3002"
echo ""
echo "查看日志:"
echo "  ssh $SERVER 'pm2 logs $PM2_APP_NAME --lines 50'"
echo ""
echo "查看内存使用:"
echo "  ssh $SERVER 'pm2 monit'"
