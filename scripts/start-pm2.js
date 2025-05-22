// PM2 startup script to manage the application processes
const pm2 = require('pm2');
const path = require('path');

console.log('Starting applications with PM2...');

// Configuration for PM2 ecosystem
const processes = [
  {
    name: 'expenses-api',
    cwd: path.resolve(__dirname, '../apps/api'),
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
    cwd: path.resolve(__dirname, '../apps/web'),
    script: 'npm',
    args: 'run preview',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 5173
    }
  }
];

// Connect to PM2
pm2.connect((err) => {
  if (err) {
    console.error('Error connecting to PM2:', err);
    process.exit(2);
  }

  // Start each process
  processes.forEach((process) => {
    pm2.start(process, (err, apps) => {
      if (err) {
        console.error(`Error starting ${process.name}:`, err);
        return;
      }
      console.log(`${process.name} started successfully`);
    });
  });

  // Disconnect from PM2
  pm2.disconnect();
});
