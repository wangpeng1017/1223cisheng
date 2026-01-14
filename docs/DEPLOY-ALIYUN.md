# npi-demo 阿里云部署文档

> 最后更新: 2025-01-14 | 服务器: 8.130.182.148 | 端口: 3002

---

## 一、服务器信息

| 项目 | 值 |
|------|-----|
| 服务器IP | 8.130.182.148 |
| 项目路径 | /root/npi-demo |
| PM2进程名 | npi-demo |
| 端口 | 3002 |
| 内存限制 | 512MB（避免影响其他应用） |
| Node.js版本 | 18.x |

**内存管理策略**：
- 限制单个应用最大内存 512MB
- 自动重启机制：内存超限后 PM2 自动重启
- 监控：定期运行 `pm2 monit` 检查资源使用

---

## 二、快速部署

### 方式1: 使用部署脚本（推荐）

```bash
# 本地执行
chmod +x scripts/deploy-aliyun.sh
./scripts/deploy-aliyun.sh
```

脚本会自动执行：
1. 本地提交并推送代码
2. 服务器拉取最新代码
3. 后台构建项目（避免SSH超时）
4. 启动/重启 PM2 服务

### 方式2: 手动部署

```bash
# 1. 本地提交并推送
git add -A
git commit -m "部署说明"
git push

# 2. SSH 登录服务器
ssh root@8.130.182.148

# 3. 拉取代码
cd /root/npi-demo
git pull

# 4. 安装依赖（首次或依赖变更）
npm install

# 5. 构建项目
npm run build

# 6. 启动/重启 PM2
pm2 reload ecosystem.config.cjs --update-env
pm2 save
```

---

## 三、首次部署（服务器初始化）

### 1. 安装 Node.js 18.x

```bash
# 登录服务器
ssh root@8.130.182.148

# 安装 nvm（如果未安装）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# 安装 Node.js 18
nvm install 18
nvm use 18
nvm alias default 18
```

### 2. 安装 PM2

```bash
npm install -g pm2

# 设置开机自启
pm2 startup
# 按提示执行输出的命令
pm2 save
```

### 3. 克隆项目

```bash
# 如果是从 GitHub 克隆
cd /root
git clone <仓库地址> npi-demo
cd npi-demo

# 如果是本地上传
# 在本地执行: scp -r /Users/wangpeng/Downloads/cisheng root@8.130.182.148:/root/npi-demo
```

### 4. 首次启动

```bash
cd /root/npi-demo
npm install
npm run build
chmod +x scripts/start-server.sh
./scripts/start-server.sh
```

---

## 四、PM2 配置说明

配置文件：`ecosystem.config.cjs`

```javascript
{
  name: 'npi-demo',              // PM2 进程名
  script: 'node_modules/next/dist/bin/next',
  args: 'start -p 3002',         // 端口 3002
  max_memory_restart: '512M',    // 内存限制
  instances: 1,                  // 单实例
  exec_mode: 'fork',
}
```

### 为什么限制内存为 512MB？

1. **避免影响其他应用**：阿里云服务器上还运行着其他应用（word-app 等）
2. **Next.js 内存特点**：
   - 开发模式：~500-800MB
   - 生产模式：~200-400MB
   - 512MB 对生产环境足够
3. **自动重启机制**：内存超限后自动重启，防止内存泄漏导致服务器崩溃

---

## 五、常用命令

### PM2 管理

```bash
# 查看状态
pm2 status

# 查看日志（实时）
pm2 logs npi-demo

# 查看最近 50 行日志
pm2 logs npi-demo --lines 50

# 监控资源使用
pm2 monit

# 重启服务
pm2 restart npi-demo

# 停止服务
pm2 stop npi-demo

# 删除服务
pm2 delete npi-demo

# 重新加载配置（零停机）
pm2 reload ecosystem.config.cjs --update-env
```

### 内存监控

```bash
# 实时监控
pm2 monit

# 查看详细信息
pm2 show npi-demo

# 查看内存使用趋势
pm2 ls
```

### 日志管理

```bash
# 清空日志
pm2 flush

# 日志文件位置
ls -lh /root/.pm2/logs/
```

---

## 六、故障排查

### 1. 构建失败

**症状**：`npm run build` 报错

**排查步骤**：
```bash
# 查看完整错误日志
cat /tmp/build.log

# 常见原因及解决方案
# a) 内存不足
   解决: 增加 swap 空间
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile

# b) 依赖冲突
   解决: 删除 node_modules 重新安装
   rm -rf node_modules package-lock.json
   npm install

# c) 磁盘空间不足
   检查: df -h
   清理: npm cache clean --force
```

### 2. 服务无法访问

**症状**：浏览器打开 8.130.182.148:3002 无响应

**排查步骤**：
```bash
# 1. 检查 PM2 进程状态
pm2 status

# 2. 检查端口是否监听
netstat -tlnp | grep 3002

# 3. 检查防火墙
sudo firewall-cmd --list-ports
# 如果未开放端口:
sudo firewall-cmd --add-port=3002/tcp --permanent
sudo firewall-cmd --reload

# 4. 检查日志
pm2 logs npi-demo --lines 50
```

### 3. 内存占用过高

**症状**：`pm2 monit` 显示内存接近 512MB

**解决方案**：
```bash
# 1. 重启服务释放内存
pm2 restart npi-demo

# 2. 检查是否有内存泄漏
pm2 show npi-demo
# 查看重启次数，如果频繁重启说明有内存泄漏

# 3. 临时提高内存限制（修改 ecosystem.config.cjs）
max_memory_restart: '768M'
pm2 reload ecosystem.config.cjs
```

### 4. 自动重启频繁

**症状**：PM2 频繁重启服务

**排查步骤**：
```bash
# 查看重启次数
pm2 status

# 查看错误日志
pm2 logs npi-demo --err --lines 50

# 常见原因
# a) 未捕获的异常 -> 修复代码
# b) 内存超限 -> 优化内存使用或提高限制
# c) 端口冲突 -> 检查端口占用
```

---

## 七、备份与回滚

### 备份当前版本

```bash
# 在服务器上执行
cd /root
cp -r npi-demo npi-demo-backup-$(date +%Y%m%d-%H%M%S)
```

### 回滚到上一版本

```bash
# 方式1: 使用 Git 回退
cd /root/npi-demo
git log --oneline -10  # 查看提交历史
git reset --hard <commit-hash>
npm run build
pm2 restart npi-demo

# 方式2: 使用备份恢复
cd /root
rm -rf npi-demo
cp -r npi-demo-backup-YYYYMMDD-HHMMSS npi-demo
cd npi-demo
pm2 restart npi-demo
```

---

## 八、性能优化建议

### 1. 减少内存占用

- ✅ 使用生产模式构建（`npm run build`）
- ✅ 禁用开发模式工具（source map 等）
- ✅ 启用 gzip 压缩（Next.js 默认启用）
- ✅ 优化图片加载（使用 next/image）

### 2. 提升响应速度

- ✅ 使用 CDN 加载静态资源
- ✅ 启用 HTTP/2
- ✅ 配置反向代理（Nginx）

### 3. Nginx 反向代理配置

```nginx
server {
    listen 80;
    server_name 8.130.182.148;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## 九、安全建议

1. **启用 HTTPS**（生产环境必须）
2. **配置防火墙**：只开放必要端口
3. **定期更新依赖**：`npm audit fix`
4. **设置环境变量**：敏感信息使用 `.env` 文件
5. **定期备份**：数据库和代码定期备份

---

## 十、联系支持

| 问题类型 | 联系方式 |
|----------|----------|
| 部署问题 | 查看本文档"故障排查"章节 |
| 服务器问题 | 联系阿里云技术支持 |
| 代码问题 | 提交 Issue 到代码仓库 |

---

**部署检查清单**：

- [ ] Node.js 18.x 已安装
- [ ] PM2 已安装并配置开机自启
- [ ] 项目代码已克隆到 /root/npi-demo
- [ ] 依赖已安装（npm install）
- [ ] 项目已构建（npm run build）
- [ ] PM2 配置文件已创建（ecosystem.config.cjs）
- [ ] 内存限制已设置（max_memory_restart: '512M'）
- [ ] 防火墙端口已开放（3002）
- [ ] 服务已启动（pm2 status 显示 online）
- [ ] 浏览器可访问 http://8.130.182.148:3002
