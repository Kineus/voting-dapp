# Deployment Guide: Ethereum Sepolia Testnet

This guide will walk you through deploying your voting dApp smart contracts to the Ethereum Sepolia testnet.

## Prerequisites

1. **MetaMask Wallet**: Install [MetaMask](https://metamask.io/) browser extension
2. **Testnet ETH**: You'll need Sepolia testnet ETH to pay for gas fees
3. **RPC Provider**: An account with Infura, Alchemy, or QuickNode for RPC access

## Step 1: Get Sepolia Testnet ETH

You need testnet ETH to pay for transaction fees. Get it from one of these faucets:

- **Sepolia Faucet**: https://sepoliafaucet.com
- **QuickNode Faucet**: https://faucet.quicknode.com/ethereum/sepolia
- **Alchemy Faucet**: https://sepoliafaucet.com
- **PoW Faucet**: https://sepolia-faucet.pk910.de/

**Note**: You'll need at least 0.1 Sepolia ETH to deploy contracts.

## Step 2: Get an RPC URL

Choose one of these providers and get your RPC URL:

### Option A: Infura (Free)
1. Go to https://infura.io
2. Sign up for a free account
3. Create a new project
4. Select "Sepolia" network
5. Copy your project's RPC URL (format: `https://sepolia.infura.io/v3/YOUR_PROJECT_ID`)

### Option B: Alchemy (Free)
1. Go to https://alchemy.com
2. Sign up for a free account
3. Create a new app
4. Select "Ethereum" and "Sepolia" network
5. Copy your API key URL (format: `https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY`)

### Option C: QuickNode (Free)
1. Go to https://www.quicknode.com
2. Sign up for a free account
3. Create an endpoint for Sepolia
4. Copy your endpoint URL

## Step 3: Get Your Private Key

⚠️ **SECURITY WARNING**: Never share your private key or commit it to git!

1. Open MetaMask
2. Click the three dots menu (⋮) next to your account
3. Select "Account details"
4. Click "Show private key"
5. Enter your password
6. Copy the private key

## Step 4: Create .env File

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your values:
   ```env
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
   PRIVATE_KEY=your_private_key_here_without_0x_prefix
   ETHERSCAN_API_KEY=your_etherscan_api_key_here  # Optional
   ```

   **Important Notes**:
   - Remove the `0x` prefix from your private key if it has one
   - Never commit the `.env` file to git (it's already in `.gitignore`)

## Step 5: Deploy to Sepolia

Run the deployment script:

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Expected Output

You should see something like:

```
Deploying contracts with account: 0xYourAddress...
✅ VoterRegistry deployed to: 0x...
✅ Ballot contract deployed to: 0x...
✅ Set ballot contract address in VoterRegistry
📁 Ballot ABI + address saved to client/src/utils/ballot.json
📁 VoterRegistry ABI + address saved to client/src/utils/voterRegistry.json

🎉 Deployment Summary:
================================
Admin Address: 0xYourAddress
VoterRegistry: 0x...
Ballot Contract: 0x...
================================
```

## Step 6: Verify Contracts on Etherscan (Optional)

If you want to verify your contracts on Etherscan:

1. Get an API key from https://etherscan.io/apis
2. Add it to your `.env` file as `ETHERSCAN_API_KEY`
3. Run verification:

```bash
npx hardhat verify --network sepolia CONTRACT_ADDRESS [constructor args]
```

For example:
```bash
npx hardhat verify --network sepolia 0xYourVoterRegistryAddress 0xYourAdminAddress
npx hardhat verify --network sepolia 0xYourBallotAddress 0xYourVoterRegistryAddress 0xYourAdminAddress
```

## Step 7: Update Frontend

The deployment script automatically updates the contract addresses in:
- `client/src/utils/ballot.json`
- `client/src/utils/voterRegistry.json`

Your frontend is already configured to work with Sepolia testnet!

## Step 8: Test Your Deployment

1. Start your frontend:
   ```bash
   cd client
   npm run dev
   ```

2. Connect MetaMask to Sepolia testnet
3. Make sure you're on the Sepolia network (Chain ID: 11155111)
4. Test the dApp functionality

## Troubleshooting

### Error: "insufficient funds"
- You need more Sepolia ETH. Get it from a faucet (see Step 1)

### Error: "nonce too high"
- Wait a few minutes and try again, or reset your MetaMask account nonce

### Error: "network error" or "connection refused"
- Check your RPC URL in `.env`
- Make sure your RPC provider account is active

### Contracts not showing in frontend
- Make sure MetaMask is connected to Sepolia (Chain ID: 11155111)
- Check that the contract addresses in `ballot.json` and `voterRegistry.json` are correct
- Verify contracts were deployed successfully on Etherscan

### "Please switch network" error
- Click the "Switch to Sepolia" button in the error message
- Or manually switch to Sepolia in MetaMask

## Network Information

- **Network Name**: Sepolia
- **Chain ID**: 11155111
- **Currency**: SepoliaETH (testnet ETH)
- **Block Explorer**: https://sepolia.etherscan.io
- **RPC URLs**: 
  - Infura: `https://sepolia.infura.io/v3/YOUR_PROJECT_ID`
  - Alchemy: `https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY`

## Next Steps

After deployment:
1. Register voters using the admin account
2. Add candidates to the ballot
3. Start the voting period
4. Test the voting functionality
5. End voting and declare winners

## Security Reminders

- ⚠️ Never commit your `.env` file
- ⚠️ Never share your private key
- ⚠️ Use a separate wallet for testing (not your main wallet)
- ⚠️ This is testnet - don't use real funds

