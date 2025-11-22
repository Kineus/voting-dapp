import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Home() {
  const [account, setAccount] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const isConnected = localStorage.getItem("walletConnected");
    if (isConnected === "true" && window.ethereum) {
      window.ethereum
        .request({ method: "eth_accounts" })
        .then((accounts) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          }
        })
        .catch((err) => console.error(err));
    }

    // Detect disconnect or wallet switch
    window.ethereum?.on("accountsChanged", (accounts) => {
      if (accounts.length === 0) {
        handleDisconnect();
      } else {
        setAccount(accounts[0]);
      }
    });
  }, []);

  async function connectWallet() {
    if (!window.ethereum) {
      alert("MetaMask not detected! Please install MetaMask to continue.");
      window.open("https://metamask.io/download/", "_blank");
      return;
    }

    try {
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      localStorage.setItem("walletConnected", "true");
      setAccount(accounts[0]);
    } catch (error) {
      console.error("Wallet connection failed:", error);
      if (error.code !== 4001) {
        alert("Failed to connect wallet. Please try again.");
      }
    }
  }

  function handleDisconnect() {
    localStorage.removeItem("walletConnected");
    setAccount(null);
  }

  function goToDashboard() {
    navigate("/dashboard");
  }

  const features = [
    {
      icon: "🔒",
      title: "Secure",
      description: "Blockchain-powered security ensures tamper-proof voting"
    },
    {
      icon: "👁️",
      title: "Transparent",
      description: "All votes are publicly verifiable on the blockchain"
    },
    {
      icon: "⚡",
      title: "Fast",
      description: "Instant vote casting and real-time results"
    },
    {
      icon: "🌐",
      title: "Decentralized",
      description: "No single point of failure or control"
    }
  ];

  const steps = [
    {
      number: "1",
      title: "Connect Wallet",
      description: "Link your MetaMask wallet to get started"
    },
    {
      number: "2",
      title: "Get Registered",
      description: "Admin registers eligible voters"
    },
    {
      number: "3",
      title: "Cast Your Vote",
      description: "Vote for your preferred candidate securely"
    },
    {
      number: "4",
      title: "View Results",
      description: "See real-time results and election outcomes"
    }
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        color: "#fff",
        fontFamily: "'Inter', 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Animated background elements */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)",
        pointerEvents: "none"
      }} />

      {/* Main Content */}
      <div style={{
        position: "relative",
        zIndex: 1,
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "2rem 1.5rem"
      }}>
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{
            textAlign: "center",
            padding: "4rem 0 3rem",
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            style={{
              fontSize: "4rem",
              marginBottom: "1rem",
              filter: "drop-shadow(0 0 20px rgba(59, 130, 246, 0.5))"
            }}
          >
            🗳️
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            style={{
              fontSize: "clamp(2.5rem, 5vw, 4rem)",
              fontWeight: "800",
              marginBottom: "1rem",
              background: "linear-gradient(135deg, #60a5fa, #a78bfa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              lineHeight: "1.2"
            }}
          >
            Decentralized Voting System
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            style={{
              fontSize: "clamp(1.1rem, 2vw, 1.4rem)",
              color: "#cbd5e1",
              marginBottom: "2.5rem",
              maxWidth: "700px",
              margin: "0 auto 2.5rem",
              lineHeight: "1.6"
            }}
          >
            Experience the future of digital democracy with blockchain-powered voting.
            Secure, transparent, and trustless elections for everyone.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
              flexWrap: "wrap",
              marginBottom: "4rem"
            }}
          >
            {!account ? (
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(59, 130, 246, 0.5)" }}
                whileTap={{ scale: 0.95 }}
                onClick={connectWallet}
                style={{
                  backgroundColor: "#3b82f6",
                  color: "#fff",
                  padding: "1rem 2.5rem",
                  border: "none",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  boxShadow: "0 10px 30px rgba(59, 130, 246, 0.3)",
                  transition: "all 0.3s ease"
                }}
              >
                🔗 Connect Wallet
              </motion.button>
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(34, 197, 94, 0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={goToDashboard}
                  style={{
                    backgroundColor: "#22c55e",
                    color: "#fff",
                    padding: "1rem 2.5rem",
                    border: "none",
                    borderRadius: "12px",
                    cursor: "pointer",
                    fontSize: "1.1rem",
                    fontWeight: "600",
                    boxShadow: "0 10px 30px rgba(34, 197, 94, 0.3)"
                  }}
                >
                  🚀 Go to Dashboard
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDisconnect}
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    color: "#fff",
                    padding: "1rem 2.5rem",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "12px",
                    cursor: "pointer",
                    fontSize: "1.1rem",
                    fontWeight: "600"
                  }}
                >
                  🔌 Disconnect
                </motion.button>
              </>
            )}
          </motion.div>

          {account && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              style={{
                padding: "1rem 2rem",
                backgroundColor: "rgba(34, 197, 94, 0.1)",
                border: "1px solid rgba(34, 197, 94, 0.3)",
                borderRadius: "12px",
                display: "inline-block",
                marginTop: "1rem"
              }}
            >
              <p style={{ margin: 0, fontSize: "0.95rem" }}>
                ✅ Connected: <strong>{account.slice(0, 6)}...{account.slice(-4)}</strong>
              </p>
            </motion.div>
          )}
        </motion.section>

        {/* Features Section */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          style={{
            marginTop: "5rem",
            marginBottom: "5rem"
          }}
        >
          <h2 style={{
            textAlign: "center",
            fontSize: "clamp(2rem, 4vw, 2.5rem)",
            marginBottom: "3rem",
            fontWeight: "700"
          }}>
            Why Choose Our Platform?
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "2rem",
            marginTop: "2rem"
          }}>
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.05, y: -5 }}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "16px",
                  padding: "2rem",
                  textAlign: "center",
                  transition: "all 0.3s ease"
                }}
              >
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>
                  {feature.icon}
                </div>
                <h3 style={{
                  fontSize: "1.5rem",
                  marginBottom: "0.75rem",
                  fontWeight: "600"
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  color: "#94a3b8",
                  lineHeight: "1.6",
                  fontSize: "0.95rem"
                }}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* How It Works Section */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          style={{
            marginTop: "5rem",
            marginBottom: "5rem",
            backgroundColor: "rgba(255, 255, 255, 0.03)",
            borderRadius: "24px",
            padding: "3rem 2rem",
            border: "1px solid rgba(255, 255, 255, 0.1)"
          }}
        >
          <h2 style={{
            textAlign: "center",
            fontSize: "clamp(2rem, 4vw, 2.5rem)",
            marginBottom: "3rem",
            fontWeight: "700"
          }}>
            How It Works
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "2rem",
            maxWidth: "1000px",
            margin: "0 auto"
          }}>
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.3 + index * 0.1, duration: 0.5 }}
                style={{
                  textAlign: "center",
                  position: "relative"
                }}
              >
                <div style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1rem",
                  fontSize: "1.5rem",
                  fontWeight: "700",
                  boxShadow: "0 10px 30px rgba(59, 130, 246, 0.3)"
                }}>
                  {step.number}
                </div>
                <h3 style={{
                  fontSize: "1.25rem",
                  marginBottom: "0.5rem",
                  fontWeight: "600"
                }}>
                  {step.title}
                </h3>
                <p style={{
                  color: "#94a3b8",
                  fontSize: "0.9rem",
                  lineHeight: "1.5"
                }}>
                  {step.description}
                </p>
                {index < steps.length - 1 && (
                  <div style={{
                    position: "absolute",
                    top: "30px",
                    right: "-1rem",
                    width: "2rem",
                    height: "2px",
                    background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                    display: "none"
                  }} 
                  className="step-connector"
                  />
                )}
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Tech Stack Section */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.6 }}
          style={{
            textAlign: "center",
            marginTop: "5rem",
            marginBottom: "3rem",
            padding: "2rem",
            backgroundColor: "rgba(255, 255, 255, 0.03)",
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.1)"
          }}
        >
          <h3 style={{
            fontSize: "1.5rem",
            marginBottom: "1.5rem",
            fontWeight: "600",
            color: "#cbd5e1"
          }}>
            Built With
          </h3>
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: "2rem",
            flexWrap: "wrap",
            alignItems: "center"
          }}>
            {["Ethereum", "Hardhat", "React", "Solidity"].map((tech, index) => (
              <motion.div
                key={tech}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.7 + index * 0.1 }}
                whileHover={{ scale: 1.1 }}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: "rgba(59, 130, 246, 0.1)",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                  fontWeight: "500"
                }}
              >
                {tech}
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Privacy Notice */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.6 }}
          style={{
            marginTop: "3rem",
            padding: "1.5rem",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            border: "1px solid rgba(59, 130, 246, 0.3)",
            borderRadius: "12px",
            maxWidth: "800px",
            margin: "3rem auto 0"
          }}
        >
          <h3 style={{
            margin: "0 0 1rem 0",
            fontSize: "1.1rem",
            color: "#60a5fa",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}>
            🔒 Privacy & Security Notice
          </h3>
          <div style={{ color: "#cbd5e1", fontSize: "0.9rem", lineHeight: "1.6" }}>
            <p style={{ margin: "0 0 0.75rem 0" }}>
              <strong>No PII Stored:</strong> This application does not store any personally identifiable information (PII). 
              Only wallet addresses are saved on-chain for voter registration and voting purposes.
            </p>
            <p style={{ margin: "0 0 0.75rem 0" }}>
              <strong>Privacy Protection:</strong> Wallet addresses are masked in the UI. 
              Do not expose personal information when using this application.
            </p>
            <p style={{ margin: 0 }}>
              <strong>Session-Only Verification:</strong> Eligibility verification is session-only and resets on page refresh 
              to protect your privacy.
            </p>
          </div>
        </motion.section>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.6 }}
          style={{
            textAlign: "center",
            padding: "2rem 0",
            color: "#64748b",
            fontSize: "0.9rem",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            marginTop: "3rem"
          }}
        >
          <p style={{ margin: 0 }}>
            © 2024 Decentralized Voting System • Powered by Blockchain Technology
          </p>
        </motion.footer>
      </div>
    </div>
  );
}
