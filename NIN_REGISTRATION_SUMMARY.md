# NIN-Based Self-Registration Implementation

## Overview

The voting system has been updated to allow users to self-register using their National Identification Number (NIN), eliminating the need for admin manual registration.

## Key Changes

### 1. Smart Contract Updates

**File: `contracts/VoterRegistry.sol`**

✅ **Added `selfRegister(bytes32 _ninHash)` function**
   - Allows users to register themselves
   - Takes a hash of NIN (privacy-preserving)
   - Prevents duplicate NIN registrations
   - Emits `VoterSelfRegistered` event

✅ **Added `registeredNINHashes` mapping**
   - Tracks which NIN hashes have been registered
   - Prevents one NIN from registering multiple wallets

✅ **Updated `Voter` struct**
   - Added `ninHash` field to store hashed NIN
   - Admin-registered voters have `ninHash = bytes32(0)`

✅ **Maintained backward compatibility**
   - Admin `registerVoter()` function still works
   - Existing admin-registered voters remain valid

### 2. Frontend Components

**File: `client/src/components/NINVerifier.jsx`** (NEW)

✅ **NIN Verification Component**
   - Input field for 11-digit NIN
   - Format validation (11 digits)
   - NIN verification (simulated for MVP)
   - Hashes NIN before sending to contract
   - Self-registration via `selfRegister()` function
   - Privacy warnings about NIN hashing
   - Shows registration status

**File: `client/src/pages/Dashboard.jsx`** (UPDATED)

✅ **Registration Flow Integration**
   - NINVerifier shown before EligibilityVerifier
   - Registration required before eligibility verification
   - Vote buttons disabled until both registration and verification complete
   - Admin registration section marked as "Legacy"
   - Registration state tracked separately

### 3. User Flow

**New Registration Flow:**
1. User connects wallet
2. User enters NIN (11 digits)
3. System verifies NIN format
4. NIN is hashed (keccak256)
5. User calls `selfRegister(ninHash)` on-chain
6. Registration confirmed
7. User can now verify eligibility
8. User can vote

**Old Flow (Still Available for Admins):**
- Admin can still manually register voters
- Useful for backward compatibility
- Marked as "Legacy" in UI

## Privacy & Security

### ✅ Privacy Features

1. **NIN Hashing**
   - Actual NIN never stored on-chain
   - Only keccak256 hash is stored
   - Hash is one-way (cannot recover NIN)

2. **No PII Storage**
   - No names, emails, or personal data
   - Only wallet addresses and NIN hash
   - NIN input cleared after registration

3. **Duplicate Prevention**
   - One NIN can only register one wallet
   - Prevents multiple registrations
   - Prevents vote manipulation

### ⚠️ MVP Limitations

1. **NIN Verification (Simulated)**
   - Currently accepts any valid format NIN
   - No real API integration
   - For production, integrate with:
     - National ID verification API
     - Oracle service (Chainlink)
     - Government verification service

2. **Format Validation**
   - Currently validates 11-digit format
   - Adjust regex for your country's NIN format
   - Example: Nigerian NIN is 11 digits

## Contract Functions

### New Functions

```solidity
function selfRegister(bytes32 _ninHash) external
```
- Self-registration with NIN hash
- Requires: not already registered, valid NIN hash, NIN not used before
- Emits: `VoterSelfRegistered` event

### Updated Functions

```solidity
function registerVoter(address _voter) external onlyAdmin
```
- Still works for admin registration
- Sets `ninHash = bytes32(0)` for admin-registered voters

## Deployment Notes

### No Breaking Changes
- Existing contracts can be upgraded or new deployment
- Admin registration still works
- Existing registered voters remain valid

### Deployment Steps
1. Deploy updated VoterRegistry contract
2. Deploy Ballot contract (no changes needed)
3. Update frontend contract addresses
4. Users can now self-register

## Testing

### Test Cases

1. **Valid NIN Registration**
   - Enter 11-digit NIN
   - Verify format accepted
   - Complete registration
   - Confirm on-chain registration

2. **Invalid NIN Format**
   - Enter non-11-digit NIN
   - Verify error message
   - Registration blocked

3. **Duplicate NIN Prevention**
   - Register with NIN
   - Try to register another wallet with same NIN
   - Verify second registration fails

4. **Registration → Eligibility → Vote Flow**
   - Register with NIN
   - Verify eligibility
   - Cast vote
   - Confirm all steps work

## Future Enhancements

### Production-Ready NIN Verification

1. **API Integration**
   ```javascript
   // Example: Integrate with NIN verification API
   const verifyNIN = async (nin) => {
     const response = await fetch('https://nin-verification-api.gov/verify', {
       method: 'POST',
       body: JSON.stringify({ nin }),
       headers: { 'Authorization': 'Bearer API_KEY' }
     });
     return response.json().isValid;
   };
   ```

2. **Oracle Integration**
   - Use Chainlink Oracle for off-chain verification
   - Verify NIN on-chain via oracle
   - More decentralized approach

3. **Multi-Country Support**
   - Support different NIN formats
   - Country-specific validation
   - International voter registration

## Files Modified/Created

### Created
- `client/src/components/NINVerifier.jsx`
- `NIN_REGISTRATION_SUMMARY.md` (this file)

### Modified
- `contracts/VoterRegistry.sol` (added self-registration)
- `client/src/pages/Dashboard.jsx` (integrated NIN registration)

### Unchanged
- `contracts/Ballot.sol` (no changes needed)
- `scripts/deploy.js` (no changes needed)

## Migration Guide

### For Existing Deployments

If you have existing contracts deployed:

1. **Option 1: Upgrade Contract**
   - Deploy new VoterRegistry with self-registration
   - Migrate existing voters (optional)
   - Update frontend addresses

2. **Option 2: New Deployment**
   - Deploy fresh contracts
   - Re-register voters using NIN
   - Update frontend addresses

### For New Deployments

Simply deploy the updated contracts:
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

## Summary

✅ **Self-registration implemented**  
✅ **NIN verification (simulated)**  
✅ **Privacy-preserving (hash-based)**  
✅ **Duplicate prevention**  
✅ **Backward compatible**  
✅ **Admin registration still available**  

The system now allows users to register themselves using their NIN, removing the need for admin manual registration while maintaining privacy and security.

