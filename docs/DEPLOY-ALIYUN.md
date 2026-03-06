# npi-demo 阿里云部署文档

> 最后更新: 2026-03-03 | 服务器: 8.130.182.148 | 端口: 3002

---

## 一、部署架构

```
本地 Mac                       阿里云服务器
┌──────────────┐               ┌──────────────────┐
│ npm run build│── rsync ──▶  │ /root/npi-demo    │
│ (.next/      │  standalone   │   server.js       │
│  standalone) │  + static     │   .next/static    │
└──────────────┘               │   public/         │
                               │   PM2 管理        │
                               └──────────────────┘
```

**核心策略**：本地构建 → 上传 standalone 产物 → 服务器只运行 `node server.js`

**优势**：
- 服务器无需 `npm install`，不占磁盘存 node_modules
- 服务器无需执行构建，节省 CPU 和内存
- standalone 产物约 50-80MB（vs 完整 node_modules 800MB+）

## 二、服务器信息

| 项目 | 值 |
|------|-----|
| 服务器IP | 8.130.182.148 |
| 项目路径 | /root/npi-demo |
| PM2进程名 | npi-demo |
| 端口 | 3002 |
| 内存限制 | 512MB |
| 启动方式 | `node server.js`（standalone 模式） |

## 三、认证信息

> ⚠️ 认证信息存储在 `AUTH.conf`（已加入 .gitignore）

```bash
cat AUTH.conf
```

## 四、快速部署

### 方式1: 一键部署脚本（推荐）

```bash
chmod +x scripts/deploy-aliyun.sh
./scripts/deploy-aliyun.sh
```

脚本自动执行：
1. **本地构建** `npm run build`（生成 standalone 产物）
2. **rsync 上传** standalone + static + public 到服务器
3. **PM2 重启** 服务

### 方式2: 手动部署

```bash
# 1. 本地构建
npm run build

# 2. 上传 standalone 产物
rsync -azP --delete .next/standalone/ root@8.130.182.148:/root/npi-demo/
rsync -azP --delete .next/static root@8.130.182.148:/root/npi-demo/.next/
rsync -azP --delete public/ root@8.130.182.148:/root/npi-demo/public/
rsync -azP ecosystem.config.cjs root@8.130.182.148:/root/npi-demo/

# 3. 重启服务
ssh root@8.130.182.148 "cd /root/npi-demo && pm2 reload ecosystem.config.cjs --update-env"
```

---

## 五、关键配置文件

### next.config.ts — standalone 模式

```ts
const nextConfig: NextConfig = {
  output: "standalone",  // 构建自包含产物
};
```

### ecosystem.config.cjs — PM2 配置

```js
{
  name: 'npi-demo',
  script: 'server.js',        // standalone 入口（非 next start）
  cwd: '/root/npi-demo',
  env: {
    NODE_ENV: 'production',
    PORT: 3002,
    HOSTNAME: '0.0.0.0',      // 监听所有网卡
  },
  max_memory_restart: '512M',
}
```

---

## 六、首次部署

服务器只需安装 Node.js 和 PM2，**不需要**克隆代码仓库或执行 `npm install`。

```bash
# 1. 安装 Node.js 18（如已安装跳过）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18 && nvm use 18 && nvm alias default 18

# 2. 安装 PM2（如已安装跳过）
npm install -g pm2
pm2 startup && pm2 save

# 3. 本地执行部署脚本
./scripts/deploy-aliyun.sh
```

---

## 七、常用命令

```bash
# 查看状态
ssh root@8.130.182.148 "pm2 status"

# 查看日志
ssh root@8.130.182.148 "pm2 logs npi-demo --lines 50"

# 重启服务
ssh root@8.130.182.148 "pm2 restart npi-demo"

# 监控资源
ssh root@8.130.182.148 "pm2 monit"
```

---

## 八、故障排查

### 服务无法访问

```bash
# 检查进程
ssh root@8.130.182.148 "pm2 status && netstat -tlnp | grep 3002"

# 检查防火墙
ssh root@8.130.182.148 "firewall-cmd --list-ports"
# 开放端口: firewall-cmd --add-port=3002/tcp --permanent && firewall-cmd --reload
```

### 回滚

```bash
# 本地切回旧版本后重新部署
git checkout <commit-hash>
./scripts/deploy-aliyun.sh
```

---

## 九、磁盘空间管理

服务器磁盘有限（49G），定期清理：

```bash
# 清理 npm 缓存
ssh root@8.130.182.148 "npm cache clean --force"

# 清理 PM2 日志
ssh root@8.130.182.148 "pm2 flush"

# 查看磁盘使用
ssh root@8.130.182.148 "df -h / && du -sh /root/npi-demo"
```
