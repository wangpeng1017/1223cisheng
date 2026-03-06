/**
 * PM2 配置文件 - npi-demo 项目
 * 使用 standalone 模式启动（node server.js）
 * 端口: 3002，内存限制: 512MB
 */

module.exports = {
  apps: [
    {
      name: 'npi-demo',
      script: 'server.js',
      cwd: '/root/npi-demo',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
        HOSTNAME: '0.0.0.0',
      },
      error_file: '/root/.pm2/logs/npi-demo-error.log',
      out_file: '/root/.pm2/logs/npi-demo-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      // 进程管理
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
    },
  ],
};
