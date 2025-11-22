import React, { useState } from "react";
import { ethers } from "ethers";
import { motion } from "framer-motion";

/**
 * EligibilityVerifier Component
 * 
 * Implements a ZKP simulation for voter eligibility verification:
 * - Creates a random challenge (nonce) client-side
 * - User signs the challenge with their wallet
 * - Signature is verified client-side to recover the address
 * - Checks eligibility on-chain without revealing identity in UI
 * 
 * Privacy: No PII stored, only wallet addresses checked on-chain
 */
export default function EligibilityVerifier({ 
  account, 
  getContract, 
  onVerificationComplete 
}) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null); // 'verified' | 'failed' | null
  const [error, setError] = useState(null);

  // Mask address for privacy (only show first 4 and last 4 chars)
  const maskAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Generate a random nonce for the challenge
  const generateNonce = () => {
    return ethers.randomBytes(32);
  };

  // Verify eligibility using ZKP simulation
  const verifyEligibility = async () => {
    if (!account || !getContract) {
      setError("Wallet not connected or contracts not available");
      return;
    }

    try {
      setIsVerifying(true);
      setError(null);
      setVerificationStatus(null);

      // Step 1: Generate random challenge (nonce) client-side
      const nonce = generateNonce();
      const nonceHex = ethers.hexlify(nonce);
      
      // Create a human-readable message for signing
      const message = `Voting Eligibility Verification\n\nNonce: ${nonceHex}\n\nThis signature proves you control this wallet without revealing your private key.`;

      // Step 2: Request user to sign the challenge
      if (!window.ethereum) {
        throw new Error("MetaMask not detected");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Request signature
      const signature = await signer.signMessage(message);

      // Step 3: Verify signature client-side to recover the address
      // This is the ZKP simulation: we prove control of the wallet without revealing the private key
      const recoveredAddress = ethers.verifyMessage(message, signature);
      
      // Privacy: Only log masked address for debugging (if needed)
      const maskedRecovered = maskAddress(recoveredAddress);
      console.log(`[ZKP-Sim] Signature verified for ${maskedRecovered}`);

      // Verify that the recovered address matches the connected account
      if (recoveredAddress.toLowerCase() !== account.toLowerCase()) {
        throw new Error("Signature verification failed: recovered address does not match connected account");
      }

      // Step 4: Get contracts and check eligibility on-chain (view call, no state change)
      const contracts = await getContract();
      const isRegistered = await contracts.voterRegistry.isRegistered(recoveredAddress);
      
      if (!isRegistered) {
        setVerificationStatus("failed");
        setError("Eligibility verification failed: Voter not registered");
        if (onVerificationComplete) {
          onVerificationComplete(false);
        }
        return;
      }

      // Step 5: Check if already voted
      const hasVoted = await contracts.voterRegistry.hasVoted(recoveredAddress);
      
      if (hasVoted) {
        setVerificationStatus("failed");
        setError("Eligibility verification failed: Voter has already voted");
        if (onVerificationComplete) {
          onVerificationComplete(false);
        }
        return;
      }

      // Success: Eligibility verified
      setVerificationStatus("verified");
      setError(null);
      
      if (onVerificationComplete) {
        onVerificationComplete(true);
      }

      // Privacy: Clear nonce and signature from memory after a short delay
      setTimeout(() => {
        // Nonce and signature are already out of scope, but we ensure they're not persisted
        console.log("[ZKP-Sim] Verification complete - ephemeral data cleared");
      }, 1000);

    } catch (err) {
      console.error("[EligibilityVerifier] Error:", err);
      
      let errorMessage = "Verification failed";
      if (err.code === "ACTION_REJECTED") {
        errorMessage = "Signature request was rejected";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setVerificationStatus("failed");
      
      if (onVerificationComplete) {
        onVerificationComplete(false);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  if (!account) {
    return (
      <div style={{
        padding: "1rem",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        border: "1px solid rgba(239, 68, 68, 0.3)",
        borderRadius: "8px",
        textAlign: "center"
      }}>
        <p style={{ margin: 0, color: "#ef4444" }}>
          Please connect your wallet to verify eligibility
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "12px",
        padding: "1.5rem",
        marginBottom: "1.5rem"
      }}
    >
      <h3 style={{ 
        margin: "0 0 1rem 0", 
        color: "#8b5cf6",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem"
      }}>
        🔐 Eligibility Verification (ZKP-Sim)
      </h3>

      <p style={{ 
        margin: "0 0 1rem 0", 
        fontSize: "0.9rem", 
        color: "#94a3b8",
        lineHeight: "1.5"
      }}>
        Verify your eligibility to vote using a Zero-Knowledge Proof simulation. 
        Your identity remains private - only your wallet address is checked on-chain.
      </p>

      {/* Privacy Warning */}
      <div style={{
        padding: "0.75rem",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        border: "1px solid rgba(59, 130, 246, 0.3)",
        borderRadius: "6px",
        marginBottom: "1rem"
      }}>
        <p style={{ 
          margin: 0, 
          fontSize: "0.85rem", 
          color: "#60a5fa",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}>
          <span>🔒</span>
          <span>
            <strong>Privacy:</strong> No PII is stored. Only wallet addresses are saved on-chain. 
            Do not expose personal information.
          </span>
        </p>
      </div>

      {/* Verification Status */}
      {verificationStatus === "verified" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            padding: "1rem",
            backgroundColor: "rgba(34, 197, 94, 0.1)",
            border: "1px solid rgba(34, 197, 94, 0.3)",
            borderRadius: "8px",
            marginBottom: "1rem",
            textAlign: "center"
          }}
        >
          <p style={{ 
            margin: 0, 
            color: "#22c55e",
            fontWeight: "600",
            fontSize: "1rem"
          }}>
            ✅ Eligibility verified (ZKP-sim): Voter eligible — identity not shown.
          </p>
          <p style={{ 
            margin: "0.5rem 0 0 0", 
            fontSize: "0.85rem", 
            color: "#86efac"
          }}>
            You can now cast your vote. Verification is session-only and will reset on page refresh.
          </p>
        </motion.div>
      )}

      {verificationStatus === "failed" && error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            padding: "1rem",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "8px",
            marginBottom: "1rem"
          }}
        >
          <p style={{ margin: 0, color: "#ef4444", fontSize: "0.9rem" }}>
            ❌ {error}
          </p>
        </motion.div>
      )}

      {/* Verify Button */}
      <motion.button
        whileHover={verificationStatus !== "verified" ? { scale: 1.02 } : {}}
        whileTap={verificationStatus !== "verified" ? { scale: 0.98 } : {}}
        onClick={verifyEligibility}
        disabled={isVerifying || verificationStatus === "verified"}
        style={{
          width: "100%",
          backgroundColor: verificationStatus === "verified" 
            ? "#22c55e" 
            : isVerifying 
            ? "#6b7280" 
            : "#8b5cf6",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          padding: "12px 24px",
          cursor: (isVerifying || verificationStatus === "verified") ? "not-allowed" : "pointer",
          fontSize: "1rem",
          fontWeight: "600",
          opacity: isVerifying ? 0.7 : 1,
          transition: "all 0.3s ease"
        }}
      >
        {isVerifying 
          ? "⏳ Verifying..." 
          : verificationStatus === "verified"
          ? "✅ Eligibility Verified"
          : "🔐 Verify Eligibility"}
      </motion.button>

      {verificationStatus === "verified" && (
        <p style={{ 
          margin: "0.75rem 0 0 0", 
          fontSize: "0.8rem", 
          color: "#94a3b8",
          textAlign: "center"
        }}>
          Verification valid for this session only
        </p>
      )}
    </motion.div>
  );
}

