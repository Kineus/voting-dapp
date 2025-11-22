import React, { useState } from "react";
import { ethers } from "ethers";
import { motion } from "framer-motion";

/**
 * NINVerifier Component
 * 
 * Allows users to self-register by providing their NIN (National Identification Number).
 * The NIN is hashed before being sent to the contract to preserve privacy.
 * 
 * Privacy: Only the hash of NIN is stored on-chain, never the actual NIN.
 */
export default function NINVerifier({ 
  account, 
  getContract,
  onRegistrationComplete 
}) {
  const [nin, setNIN] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null); // 'verified' | 'failed' | null
  const [error, setError] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);

  // Check if user is already registered
  const checkRegistrationStatus = async () => {
    if (!account || !getContract) return;
    
    try {
      const contracts = await getContract();
      const registered = await contracts.voterRegistry.isRegistered(account);
      setIsRegistered(registered);
      return registered;
    } catch (err) {
      console.error("Error checking registration:", err);
      return false;
    }
  };

  // Verify NIN format and validity (simulated for MVP)
  const verifyNIN = async (ninValue) => {
    // Simulate NIN verification
    // In production, this would call an external API or oracle
    
    // Basic format validation (adjust based on your country's NIN format)
    // Example: Nigerian NIN is 11 digits
    const ninRegex = /^\d{11}$/;
    
    if (!ninRegex.test(ninValue)) {
      throw new Error("Invalid NIN format. NIN must be 11 digits.");
    }
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate verification (in production, this would be a real API call)
    // For MVP, we'll accept any valid format NIN
    // In production: const isValid = await callNINVerificationAPI(ninValue);
    const isValid = true; // Simulated - always true for valid format
    
    if (!isValid) {
      throw new Error("NIN verification failed. Please check your NIN and try again.");
    }
    
    return true;
  };

  // Handle NIN verification and registration
  const handleVerifyAndRegister = async () => {
    if (!nin.trim()) {
      setError("Please enter your NIN");
      return;
    }

    if (!account || !getContract) {
      setError("Wallet not connected or contracts not available");
      return;
    }

    try {
      setIsVerifying(true);
      setError(null);
      setVerificationStatus(null);

      // Check if already registered
      const alreadyRegistered = await checkRegistrationStatus();
      if (alreadyRegistered) {
        setIsRegistered(true);
        setVerificationStatus("verified");
        if (onRegistrationComplete) {
          onRegistrationComplete(true);
        }
        return;
      }

      // Step 1: Verify NIN format and validity
      await verifyNIN(nin.trim());

      // Step 2: Hash the NIN (privacy-preserving)
      // We use keccak256 to hash the NIN before storing
      const ninHash = ethers.keccak256(ethers.toUtf8Bytes(nin.trim()));
      
      // Privacy: Log only that verification happened, not the NIN
      console.log("[NINVerifier] NIN verified and hashed (hash not logged for privacy)");

      // Step 3: Register on-chain with NIN hash
      setIsVerifying(false);
      setIsRegistering(true);

      const contracts = await getContract();
      
      // Call self-register function with NIN hash
      const tx = await contracts.voterRegistry.selfRegister(ninHash);
      await tx.wait();

      // Success
      setVerificationStatus("verified");
      setIsRegistered(true);
      setError(null);
      setNIN(""); // Clear NIN input for privacy
      
      if (onRegistrationComplete) {
        onRegistrationComplete(true);
      }

    } catch (err) {
      console.error("[NINVerifier] Error:", err);
      
      let errorMessage = "Registration failed";
      if (err.code === "ACTION_REJECTED") {
        errorMessage = "Transaction was rejected";
      } else if (err.reason) {
        errorMessage = err.reason;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setVerificationStatus("failed");
      
      if (onRegistrationComplete) {
        onRegistrationComplete(false);
      }
    } finally {
      setIsVerifying(false);
      setIsRegistering(false);
    }
  };

  // Check registration status on mount
  React.useEffect(() => {
    if (account && getContract) {
      checkRegistrationStatus();
    }
  }, [account, getContract]);

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
          Please connect your wallet to register
        </p>
      </div>
    );
  }

  if (isRegistered) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          backgroundColor: "rgba(34, 197, 94, 0.1)",
          border: "1px solid rgba(34, 197, 94, 0.3)",
          borderRadius: "12px",
          padding: "1.5rem",
          marginBottom: "1.5rem",
          textAlign: "center"
        }}
      >
        <h3 style={{ 
          margin: "0 0 0.5rem 0", 
          color: "#22c55e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem"
        }}>
          ✅ Already Registered
        </h3>
        <p style={{ 
          margin: 0, 
          color: "#86efac",
          fontSize: "0.9rem"
        }}>
          You are already registered as a voter. You can proceed to verify eligibility and vote.
        </p>
      </motion.div>
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
        color: "#3b82f6",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem"
      }}>
        🆔 Voter Registration (NIN Verification)
      </h3>

      <p style={{ 
        margin: "0 0 1rem 0", 
        fontSize: "0.9rem", 
        color: "#94a3b8",
        lineHeight: "1.5"
      }}>
        Register yourself as a voter by providing your National Identification Number (NIN). 
        Your NIN will be verified and only a hash will be stored on-chain for privacy.
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
            <strong>Privacy:</strong> Your NIN is never stored. Only a cryptographic hash is saved on-chain. 
            Your actual NIN remains private and is not visible to anyone.
          </span>
        </p>
      </div>

      {/* Registration Status */}
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
            ✅ Registration Successful!
          </p>
          <p style={{ 
            margin: "0.5rem 0 0 0", 
            fontSize: "0.85rem", 
            color: "#86efac"
          }}>
            Your NIN has been verified and you are now registered. You can proceed to verify eligibility and vote.
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

      {/* NIN Input */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{
          display: "block",
          marginBottom: "0.5rem",
          fontSize: "0.9rem",
          color: "#cbd5e1",
          fontWeight: "500"
        }}>
          National Identification Number (NIN)
        </label>
        <input
          type="text"
          placeholder="Enter your 11-digit NIN"
          value={nin}
          onChange={(e) => {
            // Only allow digits, max 11 characters
            const value = e.target.value.replace(/\D/g, '').slice(0, 11);
            setNIN(value);
            setError(null);
            setVerificationStatus(null);
          }}
          disabled={isVerifying || isRegistering || verificationStatus === "verified"}
          maxLength={11}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            color: "#fff",
            fontSize: "1rem",
            fontFamily: "monospace",
            letterSpacing: "0.1em"
          }}
        />
        <p style={{
          margin: "0.5rem 0 0 0",
          fontSize: "0.8rem",
          color: "#94a3b8"
        }}>
          Format: 11 digits (e.g., 12345678901)
        </p>
      </div>

      {/* Register Button */}
      <motion.button
        whileHover={verificationStatus !== "verified" && !isVerifying && !isRegistering && nin.trim() && nin.length === 11 ? { scale: 1.02 } : {}}
        whileTap={verificationStatus !== "verified" && !isVerifying && !isRegistering && nin.trim() && nin.length === 11 ? { scale: 0.98 } : {}}
        onClick={handleVerifyAndRegister}
        disabled={isVerifying || isRegistering || !nin.trim() || nin.length !== 11 || verificationStatus === "verified"}
        style={{
          width: "100%",
          backgroundColor: verificationStatus === "verified" 
            ? "#22c55e" 
            : (isVerifying || isRegistering) 
            ? "#6b7280" 
            : (!nin.trim() || nin.length !== 11)
            ? "#475569"
            : "#3b82f6",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          padding: "12px 24px",
          cursor: (isVerifying || isRegistering || !nin.trim() || nin.length !== 11 || verificationStatus === "verified") ? "not-allowed" : "pointer",
          fontSize: "1rem",
          fontWeight: "600",
          opacity: (isVerifying || isRegistering || (!nin.trim() || nin.length !== 11)) ? 0.7 : 1,
          transition: "all 0.3s ease",
          pointerEvents: (isVerifying || isRegistering || verificationStatus === "verified") ? "none" : "auto"
        }}
      >
        {isVerifying 
          ? "⏳ Verifying NIN..." 
          : isRegistering
          ? "📝 Registering..."
          : verificationStatus === "verified"
          ? "✅ Registered"
          : !nin.trim()
          ? "🆔 Enter your NIN to register"
          : nin.length !== 11
          ? `🆔 Enter ${11 - nin.length} more digit${11 - nin.length === 1 ? '' : 's'}`
          : "🆔 Verify NIN & Register"}
      </motion.button>
      
      {/* Helper text */}
      {nin.trim() && nin.length !== 11 && (
        <p style={{
          margin: "0.5rem 0 0 0",
          fontSize: "0.85rem",
          color: "#f59e0b",
          textAlign: "center"
        }}>
          ⚠️ Please enter exactly 11 digits to enable registration
        </p>
      )}
    </motion.div>
  );
}

