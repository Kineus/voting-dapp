# Test Instructions for Eligibility Verification & Voting

This document provides step-by-step instructions for manually testing the eligibility verification and voting functionality.

## Prerequisites

1. **MetaMask Installed**: Browser extension with Sepolia testnet configured
2. **Test Accounts**: At least 2 wallet addresses
   - One registered voter
   - One unregistered voter
3. **Sepolia ETH**: Testnet ETH for gas fees
4. **Contracts Deployed**: VoterRegistry and Ballot contracts deployed to Sepolia
5. **Admin Access**: One account should be the admin to register voters

## Test Setup

### 1. Deploy Contracts (if not already done)

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

Note the deployed contract addresses.

### 2. Register Test Voters

As admin, register at least one test voter:
- Connect MetaMask with admin account
- Go to Dashboard
- In "Voter Registration" section, enter a test voter address
- Click "Register" to register the voter

## Test Case 1: Registered Voter - Successful Flow

### Steps:

1. **Connect Wallet**
   - Open the dApp
   - Connect MetaMask with a **registered voter** account
   - Ensure you're on Sepolia network

2. **Verify Eligibility**
   - Navigate to Dashboard
   - Find the "Eligibility Verification (ZKP-Sim)" section
   - Click "🔐 Verify Eligibility" button
   - MetaMask will prompt you to sign a message
   - **Expected**: MetaMask shows a message to sign with nonce
   - Approve the signature

3. **Check Verification Status**
   - **Expected**: Green success message appears:
     - "✅ Eligibility verified (ZKP-sim): Voter eligible — identity not shown."
   - Button changes to "✅ Eligibility Verified" (disabled)
   - Note: No full address is displayed, only verification status

4. **Verify Vote Button Enabled**
   - Scroll to candidates section
   - **Expected**: Vote buttons should now be enabled (blue)
   - Previously they would show "🔐 Verify Eligibility First" (orange/disabled)

5. **Cast Vote**
   - Click "🗳️ Vote" on any candidate
   - Approve transaction in MetaMask
   - Wait for confirmation
   - **Expected**: 
     - Success alert: "✅ Vote cast successfully!"
     - Vote count increases
     - Button changes to "✅ Already Voted" (disabled)

6. **Verify Double-Voting Prevention**
   - Try to vote again
   - **Expected**: Alert "You have already voted!"
   - Vote button remains disabled

7. **Test Session Reset**
   - Refresh the page (F5)
   - **Expected**: 
     - Eligibility verification resets (button shows "🔐 Verify Eligibility" again)
     - Must re-verify to vote (if election still active)
     - This confirms session-only verification

## Test Case 2: Unregistered Voter - Failed Verification

### Steps:

1. **Connect Unregistered Wallet**
   - Disconnect current wallet
   - Connect MetaMask with an **unregistered** account
   - Ensure on Sepolia network

2. **Attempt Eligibility Verification**
   - Navigate to Dashboard
   - Click "🔐 Verify Eligibility"
   - Sign the message in MetaMask

3. **Check Error Message**
   - **Expected**: Red error message appears:
     - "❌ Eligibility verification failed: Voter not registered"
   - Button remains clickable (can retry)

4. **Verify Vote Button Disabled**
   - Scroll to candidates
   - **Expected**: 
     - Vote buttons show "❌ Not Registered" (red, disabled)
     - Cannot click to vote

5. **Verify No Vote Transaction Possible**
   - Even if you somehow trigger vote function
   - **Expected**: Alert "You are not registered to vote!"

## Test Case 3: Privacy & Security Checks

### Steps:

1. **Check Address Masking**
   - Open browser console (F12)
   - Complete eligibility verification
   - **Expected**: 
     - Console logs show masked addresses only (e.g., `0x1234...abcd`)
     - No full addresses in logs

2. **Check No PII Storage**
   - Open browser DevTools → Application → Local Storage
   - **Expected**: 
     - No voter personal information stored
     - Only wallet connection status (if any)
     - Eligibility verification NOT persisted

3. **Check Session-Only Verification**
   - Verify eligibility
   - Close browser tab
   - Reopen and navigate to Dashboard
   - **Expected**: Must re-verify eligibility

4. **Check Network Privacy**
   - Open DevTools → Network tab
   - Complete verification
   - **Expected**: 
     - Only on-chain contract calls visible
     - No external API calls with addresses
     - Signature data stays client-side

## Test Case 4: Admin Bypass

### Steps:

1. **Connect as Admin**
   - Connect MetaMask with admin account
   - Navigate to Dashboard

2. **Check Admin View**
   - **Expected**: 
     - Eligibility verification section NOT shown
     - Admin panel visible with candidate/election management
     - Can register voters, add candidates, start/end elections

3. **Admin Voting**
   - If admin is also registered as voter
   - **Expected**: Must still verify eligibility to vote (no bypass)

## Expected Behaviors Summary

### ✅ Success Indicators:
- Eligibility verification shows success message
- Vote buttons enabled after verification
- Votes are cast successfully
- Double-voting prevented
- No full addresses displayed in UI
- Session-only verification (resets on refresh)

### ❌ Failure Indicators:
- Unregistered voters cannot verify
- Unregistered voters cannot vote
- Already-voted users cannot vote again
- Verification required before voting
- No PII stored anywhere

## Troubleshooting

### Issue: "Signature verification failed"
- **Solution**: Ensure you're signing with the same account that's connected
- Check MetaMask is unlocked

### Issue: "Voter not registered"
- **Solution**: Admin must register the voter first
- Check contract address is correct

### Issue: "Already voted" but haven't voted
- **Solution**: Check `hasVoted` status in VoterRegistry contract
- May need to reset if testing

### Issue: Vote button still disabled after verification
- **Solution**: 
  - Check eligibilityVerified state is true
  - Refresh page and re-verify
  - Check browser console for errors

## Notes

- All verification is **session-only** - refreshes reset verification
- No PII is stored - only wallet addresses on-chain
- Addresses are masked in UI/logs for privacy
- True ZKP would provide stronger privacy (see `zkp_simulation_README.md`)

