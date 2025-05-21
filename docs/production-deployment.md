# Production Environment Deployment Guide

This document provides instructions for deploying the Household Expenses application in production environments using PM2 for process management.

## Preparation Checklist

Before deployment, ensure you have:

- [ ] MongoDB instance set up and configured
- [ ] Secure JWT secret key generated
- [ ] Domain names configured (if applicable)
- [ ] Required environment variables ready
- [ ] PM2 installed globally (`npm install -g pm2`)

## Environment Variables

Set these environment variables in your production environment:

```
MONGODB_URI=mongodb://username:password@hostname:port/household-expenses
JWT_SECRET=your-secure-production-secret
API_URL=https://your-api-domain.com  (For frontend config)
```

## Deployment with PM2

PM2 is a production process manager for Node.js applications with a built-in load balancer. It allows you to keep applications alive forever, to reload them without downtime and to facilitate common system admin tasks.

### Automatic Deployment

The simplest option is to use the provided deployment scripts:

```bash
# For Linux/Mac
./deploy.sh

# For Windows PowerShell
./deploy.ps1
```

These scripts will check for required environment variables, install dependencies, build the application for production, and start or restart the application using PM2.

### Manual PM2 Deployment

For traditional VM or bare metal servers:

1. Install Node.js 18+ and npm
2. Clone the repository
3. Set environment variables
4. Install PM2 globally:
   ```bash
   npm install -g pm2
   ```
5. Install project dependencies:
   ```bash
   npm install
   ```
6. Build the application:
   ```bash
   npm run build:prod
   ```
7. Start the applications with PM2:
   ```bash
   npm run pm2:start
   ```

### PM2 Commands

```bash
# Start all applications
npm run pm2:start

# View logs
npm run pm2:logs

# Monitor applications
npm run pm2:monit

# Stop all applications
npm run pm2:stop

# Restart all applications
npm run pm2:restart
```

### PM2 Advanced Features

PM2 provides many useful features for production environments:

1. **Auto restart on crash**: PM2 will automatically restart your applications if they crash.
2. **Load balancing**: PM2 can load balance your application across multiple cores.
3. **Process monitoring**: Easy monitoring of CPU/memory usage.
4. **Log management**: Centralized log management.
5. **Startup scripts**: PM2 can generate startup scripts to keep your processes alive after server restarts.
   ```bash
   # Generate startup script
   pm2 startup
   
   # Save current process list
   pm2 save
   ```

### Cloud Deployment Options

#### Vercel Deployment (Frontend Only)

You can deploy the Next.js frontend to Vercel:

1. Connect your GitHub repository to Vercel
2. Set the root directory to `apps/frontend`
3. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `.next`
4. Add environment variables:
   - `NEXT_PUBLIC_API_URL`: URL of your deployed API

#### Cloud Providers (Full-Stack)

For AWS, Google Cloud, Azure, or DigitalOcean:

1. Provision a VM/instance
2. Install Node.js and PM2
3. Set up environment variables
4. Deploy using the steps in Manual PM2 Deployment section above

## Database Backup Strategy

1. Schedule regular MongoDB backups
2. For MongoDB Atlas, enable automated backups
3. For self-hosted MongoDB:
   ```bash
   mongodump --uri "mongodb://username:password@hostname:port/household-expenses" --out /backup/folder
   ```

## Monitoring and Maintenance with PM2

1. **Health Checks**:
   - Set up health check endpoints in your NestJS API
   - Monitor with PM2's HTTP probe functionality:
     ```js
     // In ecosystem.config.js
     module.exports = {
       apps: [{
         // ...other settings
         name: "expenses-api",
         // Add health check endpoint
         exp_backoff_restart_delay: 100,
         max_memory_restart: '1G',
         // Health check endpoint
         exec_interpreter: "node",
         exec_mode: "fork",
         instances: "max",
         wait_ready: true,
         listen_timeout: 50000
       }]
     }
     ```

2. **Advanced Monitoring**:
   - Use PM2's built-in monitoring: `npm run pm2:monit`
   - Install PM2 web dashboard: `pm2 install pm2-server-monit`
   - For more advanced monitoring, consider:
     - PM2 Plus (paid service)
     - New Relic
     - Datadog

3. **Log Management**:
   - View logs: `npm run pm2:logs`
   - Rotate logs: `pm2 install pm2-logrotate`
   - Configure log rotation settings:
     ```bash
     pm2 set pm2-logrotate:max_size 10M
     pm2 set pm2-logrotate:retain 7
     pm2 set pm2-logrotate:compress true
     ```

4. **Schedule Regular Maintenance**:
   - Security updates for dependencies: Set up a regular schedule to update dependencies
   - Database maintenance: Regular backup and index optimization
   - Log cleanup: Configure log rotation to avoid disk space issues

## Troubleshooting

### Connection Issues
- Check MongoDB connection string
- Verify network connectivity and firewall rules
- Ensure JWT secrets match between API and database configs

### Performance Issues
- Enable MongoDB indexing on frequently queried fields
- Configure proper caching headers for Next.js
- Consider scaling horizontally if needed
