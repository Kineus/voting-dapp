# Quick Vercel Deployment Guide

## Fastest Way to Deploy

### Option 1: Deploy from Root (Recommended)

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push
   ```

2. **Go to Vercel Dashboard**:
   - Visit [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click **"Add New Project"**

3. **Import Repository**:
   - Select your `voting-dapp` repository
   - Vercel will detect the `vercel.json` in the root

4. **Configure Settings**:
   - **Root Directory**: Leave as root (`.`)
   - The `vercel.json` will handle the client directory automatically
   - Click **"Deploy"**

5. **Done!** Your app will be live in ~2 minutes

### Option 2: Deploy from Client Directory

1. **In Vercel Dashboard**, when importing:
   - Set **Root Directory** to `client`
   - Vercel will use `client/vercel.json`
   - Click **"Deploy"**

## Important Notes

✅ **What gets deployed**: Only the frontend (React app)  
❌ **What doesn't**: Smart contracts (they're on Sepolia blockchain)  
✅ **Users need**: MetaMask wallet to interact with your dApp  

## After Deployment

1. Visit your Vercel URL (e.g., `https://voting-dapp.vercel.app`)
2. Test connecting MetaMask
3. Make sure users switch to Sepolia network
4. Share your URL!

## Troubleshooting

**Build fails?**
- Check that `client/package.json` exists
- Verify all dependencies are listed

**404 errors on routes?**
- The `rewrites` in `vercel.json` should handle this
- If not, check Vercel settings → Rewrites

**Can't connect to contracts?**
- Verify contract addresses in `client/src/utils/ballot.json`
- Users must be on Sepolia network

