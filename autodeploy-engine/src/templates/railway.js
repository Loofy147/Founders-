export const railway = (config) => ({
  'railway.json': JSON.stringify({
    "$schema": "https://railway.app/railway.schema.json",
    build: {
      builder: "NIXPACKS",
      buildCommand: "npm install && npm run build"
    },
    deploy: {
      startCommand: "npm start",
      healthcheckPath: "/health",
      healthcheckTimeout: 100,
      restartPolicyType: "ON_FAILURE",
      restartPolicyMaxRetries: 10
    }
  }, null, 2),

  'Dockerfile': `FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

EXPOSE 3000

CMD ["npm", "start"]`,

  '.env.example': `# Railway Environment Variables
NODE_ENV=production
PORT=3000
DATABASE_URL=\${DATABASE_URL}
JWT_SECRET=your_jwt_secret`,

  'README-DEPLOYMENT.md': `# Railway Deployment Guide - ${config.projectName}

## Railway Setup (10 minutes)

### Step 1: Create Railway Account
Visit https://railway.app and sign up with GitHub

### Step 2: Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your repository
4. Railway auto-detects settings

### Step 3: Add Database (if needed)
1. Click "New" → "Database"
2. Choose PostgreSQL/MySQL/MongoDB
3. Railway auto-connects via \`DATABASE_URL\`

### Step 4: Environment Variables
In Railway dashboard, add:
- \`NODE_ENV\` = production
- \`JWT_SECRET\` = (generate secure secret)
- Any API keys

### Step 5: Deploy
Railway deploys automatically on push to main.

## Custom Domain
1. Project → Settings → Domains
2. Add custom domain
3. Update DNS records

## Automatic Deployments
✅ Push to \`main\` → Auto deploy
✅ PRs → Preview deployments (optional)

## Database Access
Railway provides:
- Public URL
- Private URL (faster, for your app)
- Connection pooling

## Monitoring
- Logs: Real-time in dashboard
- Metrics: CPU, Memory, Network
- Alerts: Configure in settings

## Cost
- Free tier: $5/month credit
- Pro: $20/month (includes credits)
- Usage based pricing

## Troubleshooting
- Build fails: Check Node version
- App crashes: Check logs in dashboard
- Database issues: Verify connection string
`
});
