const path = require('path');

module.exports = {
  apps: [
    {
      name: 'expenses-api',
      cwd: path.resolve(__dirname, 'apps/api'),
      script: './dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      }
    },
    {
      name: 'expenses-web',
      cwd: path.resolve(__dirname, 'apps/web'),
      script: 'npm',
      args: 'run serve:dist',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 5173
      }
    }
  ]
};
