# 🗳️ Voting DApp Setup Guide

## The Error You're Seeing

The error `"missing revert data (action="call", data=null, reason=null"` occurs because:

1. **Network Mismatch**: Your frontend is trying to connect to a different network than where your contract is deployed
2. **Contract Not Deployed**: The contract might not be deployed to the expected address
3. **Hardhat Local Network**: The contract is deployed on Hardhat's local network (localhost:8545)

## 🚀 Quick Fix Steps

### Step 1: Start Hardhat Local Network

```bash
# In your project root directory
npx hardhat node
```

Keep this terminal open - it will show your local blockchain running on `localhost:8545`

### Step 2: Deploy Contracts

```bash
# In a new terminal, in your project root directory
npx hardhat run scripts/deploy.js --network localhost
```

This will:

- Deploy the VoterRegistry contract
- Deploy the Ballot contract
- Update `client/src/utils/ballot.json` with the correct address and ABI

### Step 3: Start the Frontend

```bash
# In another new terminal, go to the client directory
cd client
npm run dev
```

### Step 4: Configure MetaMask

1. **Open MetaMask** and click on the network dropdown (usually shows "Ethereum Mainnet")
2. **Click "Add Network"** or **"Custom RPC"**
3. **Add these details:**

   - **Network Name**: `Hardhat Local`
   - **RPC URL**: `http://localhost:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: `ETH`
   - **Block Explorer**: (leave empty)

4. **Import Account** (optional):
   - In Hardhat terminal, you'll see private keys for test accounts
   - Copy one and import it in MetaMask for testing

### Step 5: Test the Connection

1. Open your frontend (usually `http://localhost:5173`)
2. Connect MetaMask
3. Make sure you're on "Hardhat Local" network
4. The dashboard should now load without errors!

## 🔧 If You Still Get Errors

### Error: "Wrong Network"

- Make sure MetaMask is connected to "Hardhat Local" network
- Chain ID should be 31337
- RPC URL should be `http://localhost:8545`

### Error: "Contract not deployed"

- Run the deploy script: `npx hardhat run scripts/deploy.js --network localhost`
- Check that `client/src/utils/ballot.json` has the correct address

### Error: "No candidates found"

- The contract is deployed but has no candidates yet
- You need to add candidates through the admin functions
- Check the smart contract for admin functions like `addCandidate()`

## 📝 Next Steps

1. **Add Candidates**: Use the admin functions to add candidates to the election
2. **Start Voting**: Use the `startVoting()` function to begin the election
3. **Test Voting**: Cast votes and see the results update in real-time

## 🆘 Still Having Issues?

Check these common problems:

1. **Hardhat node not running**: Make sure `npx hardhat node` is running
2. **Wrong port**: Frontend should be on `localhost:5173`, Hardhat on `localhost:8545`
3. **MetaMask network**: Must be on "Hardhat Local" with Chain ID 31337
4. **Contract address**: Check `client/src/utils/ballot.json` has the right address
5. **Browser cache**: Try hard refresh (Ctrl+F5) or clear browser cache

The updated Dashboard component now includes better error handling and network detection to help you troubleshoot these issues!
