# scripts 索引
> 部署和运维脚本

## 文件清单

| 文件名 | 功能 | 用途 |
|--------|------|------|
| deploy-aliyun.sh | 阿里云自动部署脚本 | 本地执行，一键部署到阿里云 |
| start-server.sh | 服务器端启动脚本 | 服务器上执行，启动/重启项目 |

## 使用说明

### deploy-aliyun.sh - 阿里云部署脚本

**功能**：自动化部署流程，避免手动操作

**执行位置**：本地机器

**使用方法**：
```bash
chmod +x scripts/deploy-aliyun.sh
./scripts/deploy-aliyun.sh
```

**执行流程**：
1. 本地 git commit + push
2. 服务器 git pull
3. 后台构建（避免 SSH 超时）
4. PM2 重启服务

**输出**：
- 部署进度
- PM2 状态
- 访问地址

### start-server.sh - 服务器启动脚本

**功能**：在服务器上首次启动或重启项目

**执行位置**：阿里云服务器（8.130.182.148）

**使用方法**：
```bash
ssh root@8.130.182.148
cd /root/npi-demo
chmod +x scripts/start-server.sh
./scripts/start-server.sh
```

**执行流程**：
1. 检查项目目录
2. 安装依赖（如需要）
3. 构建项目（如需要）
4. 启动 PM2

**输出**：
- 启动进度
- PM2 状态
- 常用命令提示

## 注意事项

1. **deploy-aliyun.sh**：需要本地有 SSH 权限访问服务器
2. **start-server.sh**：需要在服务器上执行
3. 两个脚本都会检查项目依赖和构建状态
4. 构建过程在后台执行，避免 SSH 超时
5. PM2 配置内存限制为 512MB，避免影响其他应用

## 相关文档

- [阿里云部署文档](../docs/DEPLOY-ALIYUN.md)
- [PM2 配置](../ecosystem.config.cjs)
