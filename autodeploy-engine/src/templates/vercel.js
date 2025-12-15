export const vercel = (config) => ({
  'vercel.json': JSON.stringify({
    version: 2,
    builds: [{ src: 'package.json', use: '@vercel/next' }],
    env: { NODE_ENV: 'production' },
    regions: ['iad1'],
    headers: [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }
        ]
      }
    ]
  }, null, 2),

  '.env.example': `# Vercel Environment Variables
NODE_ENV=production
DATABASE_URL=your_database_url
NEXT_PUBLIC_API_URL=your_api_url`,

  'README-DEPLOYMENT.md': `# Deployment Guide - ${config.projectName}

## Vercel Setup (5 minutes)

### Step 1: Push to GitHub
\`\`\`bash
git add .
git commit -m "Initial commit"
git push origin main
\`\`\`

### Step 2: Deploy to Vercel
1. Visit https://vercel.com
2. Click "Import Project"
3. Select your GitHub repository
4. Vercel auto-detects Next.js
5. Click "Deploy"

### Step 3: Environment Variables
In Vercel dashboard, add:
- \`DATABASE_URL\` (if using database)
- \`NEXT_PUBLIC_API_URL\` (your API endpoint)

## Automatic Deployments
✅ Every push to \`main\` → Production
✅ Every PR → Preview URL

## Custom Domain
1. Go to Project Settings → Domains
2. Add your domain
3. Update DNS records as shown

## Troubleshooting
- Build fails: Check Node version (18+)
- Environment variables: Ensure all secrets are set
- 404 errors: Check rewrites in vercel.json

## Support
- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
`
});
