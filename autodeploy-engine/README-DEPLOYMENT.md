# Deployment Guide - my-project

## Vercel Setup (5 minutes)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### Step 2: Deploy to Vercel
1. Visit https://vercel.com
2. Click "Import Project"
3. Select your GitHub repository
4. Vercel auto-detects Next.js
5. Click "Deploy"

### Step 3: Environment Variables
In Vercel dashboard, add:
- `DATABASE_URL` (if using database)
- `NEXT_PUBLIC_API_URL` (your API endpoint)

## Automatic Deployments
✅ Every push to `main` → Production
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
