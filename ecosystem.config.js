module.exports = {
  apps: [
    {
      name: 'expenses-api',
      cwd: './apps/api',
      script: 'dist/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      // Health check settings
      exp_backoff_restart_delay: 100,
      wait_ready: true,
      listen_timeout: 50000,
      // Error handling
      min_uptime: '10s',
      max_restarts: 10,
      // Logs
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'expenses-frontend',
      cwd: './apps/frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // Health check settings
      exp_backoff_restart_delay: 100,
      // Error handling
      min_uptime: '10s',
      max_restarts: 10,
      // Logs
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
}
