# Deploying to Vercel

This guide will walk you through deploying your voting dApp frontend to Vercel.

## Prerequisites

1. **GitHub Account**: You'll need a GitHub account to connect your repository
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com) (free tier available)
3. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, or Bitbucket)

## Method 1: Deploy via Vercel Dashboard (Recommended)

### Step 1: Push Your Code to GitHub

1. Initialize git (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. Create a new repository on GitHub

3. Push your code:
   ```bash
   git remote add origin https://github.com/yourusername/voting-dapp.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Import Project to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Import your Git repository (GitHub, GitLab, or Bitbucket)
4. Select your `voting-dapp` repository

### Step 3: Configure Project Settings

Vercel should auto-detect Vite, but verify these settings:

- **Framework Preset**: Vite
- **Root Directory**: `client` (IMPORTANT!)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 4: Environment Variables (Optional)

If you need any environment variables for your frontend:

1. Go to **Settings** → **Environment Variables**
2. Add any variables your app needs
3. Note: Never commit `.env` files with private keys!

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (usually 1-2 minutes)
3. Your app will be live at `https://your-project-name.vercel.app`

## Method 2: Deploy via Vercel CLI

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Navigate to Client Directory

```bash
cd client
```

### Step 4: Deploy

```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? (Select your account)
- Link to existing project? **No** (for first deployment)
- Project name? (Press Enter for default)
- Directory? **./** (current directory)
- Override settings? **No**

### Step 5: Production Deployment

For production deployment:

```bash
vercel --prod
```

## Configuration Details

The `vercel.json` file in the root directory is configured to:
- Build from the `client` directory
- Use Vite as the framework
- Handle client-side routing with rewrites
- Output to `client/dist`

## Important Notes

### 1. Smart Contracts
- **Smart contracts are NOT deployed to Vercel**
- Contracts must be deployed separately to Sepolia (or another network)
- The frontend connects to contracts already deployed on the blockchain
- Contract addresses are stored in `client/src/utils/ballot.json` and `client/src/utils/voterRegistry.json`

### 2. Environment Variables
- Vercel doesn't need your private keys or RPC URLs
- The frontend uses MetaMask to connect to the blockchain
- Users connect their own wallets

### 3. Build Process
- Vercel will run `npm install` and `npm run build` in the `client` directory
- The build output goes to `client/dist`
- Vercel serves the static files

### 4. Custom Domain (Optional)
1. Go to your project settings on Vercel
2. Click **"Domains"**
3. Add your custom domain
4. Follow DNS configuration instructions

## Troubleshooting

### Build Fails
- Check that `client/package.json` has the correct build script
- Ensure all dependencies are listed in `package.json`
- Check build logs in Vercel dashboard

### Routing Issues
- The `vercel.json` rewrite rule handles client-side routing
- All routes should redirect to `index.html`

### Contract Connection Issues
- Verify contract addresses in `client/src/utils/ballot.json`
- Ensure users are on the correct network (Sepolia)
- Check that contracts are deployed to the same network

### White Screen
- Check browser console for errors
- Verify all asset paths are correct
- Ensure build completed successfully

## Updating Your Deployment

### Automatic Updates
- Every push to your main branch automatically triggers a new deployment
- Vercel creates preview deployments for pull requests

### Manual Update
```bash
cd client
vercel --prod
```

## Vercel Features

- **Automatic HTTPS**: All deployments get SSL certificates
- **Global CDN**: Fast loading worldwide
- **Preview Deployments**: Test changes before production
- **Analytics**: Track your app's performance (Pro plan)
- **Custom Domains**: Use your own domain name

## Next Steps After Deployment

1. **Test the deployment**: Visit your Vercel URL and test all features
2. **Update contract addresses** if needed
3. **Share the URL**: Users can now access your dApp!
4. **Monitor**: Check Vercel dashboard for any issues

## Support

- Vercel Documentation: https://vercel.com/docs
- Vercel Community: https://github.com/vercel/vercel/discussions

