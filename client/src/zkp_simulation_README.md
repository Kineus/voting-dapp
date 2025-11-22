# Zero-Knowledge Proof (ZKP) Simulation

## Overview

This implementation provides a **ZKP simulation** for voter eligibility verification in the voting dApp. It demonstrates the concept of proving eligibility without revealing identity, though it is not a true cryptographic zero-knowledge proof (zk-SNARK).

## What is a ZKP Simulation?

A true Zero-Knowledge Proof (ZKP) allows one party (the prover) to prove to another party (the verifier) that they know a value or meet certain criteria without revealing the value itself. In our simulation, we achieve a similar privacy-preserving effect using cryptographic signatures.

## How Our ZKP Simulation Works

### Workflow

1. **Challenge Generation (Client-Side)**
   - A random nonce (32 bytes) is generated in the browser
   - This nonce serves as a one-time challenge

2. **Signature Request**
   - User is asked to sign the challenge with their wallet (MetaMask)
   - The signature proves control of the wallet without revealing the private key

3. **Signature Verification (Client-Side)**
   - The signature is verified using `ethers.verifyMessage()`
   - The wallet address is recovered from the signature
   - This demonstrates: "I control this wallet" without sending the address to any third party initially

4. **On-Chain Eligibility Check**
   - The recovered address is used to call `VoterRegistry.isRegistered(address)` (view function)
   - The contract returns eligibility status without storing or logging the full address in UI
   - Only masked addresses (e.g., `0x1234...abcd`) are shown if needed

5. **Privacy Preservation**
   - No PII (Personally Identifiable Information) is stored
   - Only wallet addresses are checked on-chain
   - Signed nonces are ephemeral and client-side only
   - Verification status is session-only (cleared on page refresh)

## Key Privacy Features

✅ **No PII Storage**: No names, emails, or personal data stored anywhere  
✅ **Address Masking**: Full addresses are masked in UI/logs (only first 6 and last 4 chars shown)  
✅ **Ephemeral Nonces**: Challenge nonces are generated fresh each time and not persisted  
✅ **Session-Only Verification**: Eligibility verification resets on page refresh  
✅ **Client-Side Verification**: Signature verification happens locally before on-chain check  

## Differences from True ZKP

### Our Simulation:
- Uses cryptographic signatures to prove wallet control
- Verifies eligibility by checking on-chain registration
- Privacy achieved through address masking and no PII storage
- Simpler implementation suitable for MVP

### True ZKP (zk-SNARK) Would:
- Use complex cryptographic proofs (Groth16, PLONK, etc.)
- Prove eligibility without revealing the address at all
- Require circuit compilation and trusted setup
- Provide stronger privacy guarantees
- Be more computationally intensive

## Security Considerations

⚠️ **This is a simulation, not a true ZKP**

- The wallet address is still recovered and checked on-chain
- A true ZKP would prove eligibility without revealing the address
- For production, consider implementing true zk-SNARKs using libraries like:
  - [Circom](https://docs.circom.io/) for circuit design
  - [snarkjs](https://github.com/iden3/snarkjs) for proof generation
  - [Semaphore](https://semaphore.appliedzkp.org/) for anonymous voting

## Use Cases

This simulation is suitable for:
- MVP/prototype demonstrations
- Educational purposes
- Systems where address privacy is acceptable
- Testing ZKP concepts before full implementation

## Future Enhancements

To implement true ZKP:
1. Design a circuit proving voter eligibility without revealing address
2. Generate proofs client-side using zk-SNARK libraries
3. Verify proofs on-chain using a verifier contract
4. Eliminate the need to reveal addresses during verification

## References

- [Zero-Knowledge Proofs Explained](https://ethereum.org/en/zero-knowledge-proofs/)
- [Semaphore: Anonymous Voting](https://semaphore.appliedzkp.org/)
- [Circom Documentation](https://docs.circom.io/)

