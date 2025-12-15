export const netlify = (config) => ({
  'netlify.toml': `[build]
  command = "npm run build"
  publish = "${config.framework === 'React (Vite)' ? 'dist' : 'build'}"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"`,

    '.env.example': `# Netlify Environment Variables
NODE_ENV=production
REACT_APP_API_URL=your_api_url`,

    'README-DEPLOYMENT.md': `# Deployment Guide - ${config.projectName}

## Netlify Setup (5 minutes)

### Step 1: Push to GitHub
\`\`\`bash
git add .
git commit -m "Add Netlify config"
git push origin main
\`\`\`

### Step 2: Deploy to Netlify
1. Visit https://app.netlify.com
2. Click "New site from Git"
3. Select your repository
4. Netlify auto-detects build settings
5. Click "Deploy site"

### Step 3: Environment Variables
In Netlify dashboard, go to Site settings → Environment variables:
- Add your API URLs
- Add any secrets

## Automatic Deployments
✅ Push to \`main\` → Production
✅ PRs → Deploy previews

## Custom Domain
Site settings → Domain management → Add custom domain

## Troubleshooting
- Build command: \`npm run build\`
- Publish directory: \`${config.framework === 'React (Vite)' ? 'dist' : 'build'}\`
- Node version: 18+
`
});
