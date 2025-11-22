import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import ballotAbi from "../utils/ballot.json";
import voterRegistryAbi from "../utils/voterRegistry.json";
import EligibilityVerifier from "../components/EligibilityVerifier";
import NINVerifier from "../components/NINVerifier";

// Color palette for charts
const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [electionStatus, setElectionStatus] = useState("Loading...");
  const [loading, setLoading] = useState(false);
  const [votingLoading, setVotingLoading] = useState(false);
  const [winner, setWinner] = useState(null);
  const [winners, setWinners] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [votingActive, setVotingActive] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [winnerDeclared, setWinnerDeclared] = useState(false);
  const [error, setError] = useState(null);
  const [showChart, setShowChart] = useState(false);
  const [voterRegistrationStatus, setVoterRegistrationStatus] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Eligibility verification state (session-only, no persistence)
  const [eligibilityVerified, setEligibilityVerified] = useState(false);
  // Registration state
  const [isRegistered, setIsRegistered] = useState(false);
  
  // Admin election management states
  const [newCandidateName, setNewCandidateName] = useState("");
  const [addCandidateLoading, setAddCandidateLoading] = useState(false);
  const [resetCandidatesLoading, setResetCandidatesLoading] = useState(false);
  const [startElectionLoading, setStartElectionLoading] = useState(false);
  const [endElectionLoading, setEndElectionLoading] = useState(false);
  const [electionStartDate, setElectionStartDate] = useState("");
  const [electionStartTime, setElectionStartTime] = useState("");
  const [electionEndDate, setElectionEndDate] = useState("");
  const [electionEndTime, setElectionEndTime] = useState("");

  // 🔧 Contract addresses
  const contractAddress = ballotAbi.address || "0xFD471836031dc5108809D173A067e8486B9047A3";
  const voterRegistryAddress = voterRegistryAbi.address || "0xc351628EB244ec633d5f21fBD6621e1a683B1181";

  // Connect provider and contracts
  const getContract = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error("MetaMask not detected");
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    // Check if we're on the correct network (Hardhat local or Sepolia)
    const network = await provider.getNetwork();
    console.log("Connected to network:", network);
    
    // Supported networks: Hardhat local (31337) or Sepolia (11155111)
    const supportedChainIds = [31337n, 11155111n];
    if (!supportedChainIds.includes(network.chainId)) {
      throw new Error(`Please switch to Hardhat local network (Chain ID: 31337) or Sepolia testnet (Chain ID: 11155111). Current network: ${network.chainId}`);
    }
    
    // Check if contracts exist at the addresses (with error handling for RPC failures)
    let ballotCode, registryCode;
    try {
      ballotCode = await Promise.race([
        provider.getCode(contractAddress),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('RPC timeout')), 10000)
        )
      ]);
    } catch (error) {
      console.warn("Could not verify Ballot contract code (RPC issue, continuing anyway):", error.message);
      // Continue anyway - the contract might exist, it's just an RPC issue
      ballotCode = "0x1"; // Set to non-zero to continue
    }
    
    if (ballotCode === "0x") {
      throw new Error(`No Ballot contract found at address: ${contractAddress}. Please deploy the contract first.`);
    }
    
    try {
      registryCode = await Promise.race([
        provider.getCode(voterRegistryAddress),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('RPC timeout')), 10000)
        )
      ]);
    } catch (error) {
      console.warn("Could not verify VoterRegistry contract code (RPC issue, continuing anyway):", error.message);
      // Continue anyway - the contract might exist, it's just an RPC issue
      registryCode = "0x1"; // Set to non-zero to continue
    }
    
    if (registryCode === "0x") {
      throw new Error(`No VoterRegistry contract found at address: ${voterRegistryAddress}. Please deploy the contract first.`);
    }
    
    return {
      ballot: new ethers.Contract(contractAddress, ballotAbi.abi, signer),
      voterRegistry: new ethers.Contract(voterRegistryAddress, voterRegistryAbi.abi, signer),
      provider,
      signer
    };
  }, [contractAddress, voterRegistryAddress]);

  // Format timestamp to readable date
  const formatTimestamp = (timestamp) => {
    if (!timestamp || timestamp.toString() === "0") return "Not set";
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString();
  };

  // Get election status and auto-end if needed
  const getElectionStatus = async (contract) => {
    try {
      const [active, start, end] = await Promise.all([
        contract.votingActive(),
        contract.startTime(),
        contract.endTime()
      ]);
      
      setVotingActive(active);
      setStartTime(start);
      setEndTime(end);

      // Auto-end election if end time has passed
      if (active && Number(end) > 0 && Date.now() / 1000 > Number(end)) {
        try {
          // Call autoEndElection to end the election automatically
          const tx = await contract.autoEndElection();
          await tx.wait();
          console.log("✅ Election automatically ended");
          // Refresh status after ending
          const [newActive] = await Promise.all([
            contract.votingActive()
          ]);
          setVotingActive(newActive);
          return "🔴 Ended";
        } catch (autoEndError) {
          console.error("Error auto-ending election:", autoEndError);
          // If auto-end fails, still show ended status
          return "🔴 Ended (Auto-end pending)";
        }
      }

      if (active) {
        return "🟢 Active";
      } else if (Number(start) === 0) {
        return "⏳ Not Started";
      } else if (Number(end) > 0 && Date.now() / 1000 > Number(end)) {
        return "🔴 Ended";
      } else {
        return "⏸️ Paused";
      }
    } catch (err) {
      console.error("Error getting election status:", err);
      return "❌ Error";
    }
  };

  // Switch to Sepolia testnet
  const switchToSepoliaNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // 11155111 in hex
      });
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xaa36a7', // 11155111 in hex
              chainName: 'Sepolia',
              nativeCurrency: {
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18
              },
              rpcUrls: ['https://sepolia.infura.io/v3/'],
              blockExplorerUrls: ['https://sepolia.etherscan.io']
            }]
          });
        } catch (addError) {
          console.error('Error adding Sepolia network:', addError);
          throw new Error('Failed to add Sepolia network. Please add it manually in MetaMask.');
        }
      } else {
        console.error('Error switching network:', switchError);
        throw new Error('Failed to switch to Sepolia network.');
      }
    }
  };

  // Switch to Hardhat local network
  const switchToHardhatNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x7A69', // 31337 in hex
          chainName: 'Hardhat Local',
          nativeCurrency: {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18
          },
          rpcUrls: ['http://localhost:8545'],
          blockExplorerUrls: null
        }]
      });
    } catch (error) {
      console.error('Error switching network:', error);
      throw new Error('Failed to switch to Hardhat network. Please add it manually in MetaMask.');
    }
  };

  // Check voter registration status
  const checkVoterRegistration = useCallback(async (contracts) => {
    if (!account) return;
    
    try {
      const [isRegistered, hasVoted, registryAdmin, ballotAdmin] = await Promise.all([
        contracts.voterRegistry.isRegistered(account),
        contracts.voterRegistry.hasVoted(account),
        contracts.voterRegistry.admin(),
        contracts.ballot.admin()
      ]);
      
      setVoterRegistrationStatus({
        isRegistered,
        hasVoted,
        adminAddress: ballotAdmin // Use ballot admin for election management
      });
      
      // Check if current user is admin (check both contracts, but prioritize ballot admin for election features)
      const isBallotAdmin = account.toLowerCase() === ballotAdmin.toLowerCase();
      const isRegistryAdmin = account.toLowerCase() === registryAdmin.toLowerCase();
      setIsAdmin(isBallotAdmin || isRegistryAdmin);
      
    } catch (err) {
      console.error("Error checking voter registration:", err);
      setVoterRegistrationStatus(null);
    }
  }, [account]);


  // Add candidate (admin only)
  const addCandidate = async () => {
    if (!newCandidateName.trim()) {
      alert("Please enter a candidate name");
      return;
    }
    
    if (!isAdmin) {
      alert("Only admin can add candidates");
      return;
    }
    
    try {
      setAddCandidateLoading(true);
      const contracts = await getContract();
      
      // Check if voting is active
      const isActive = await contracts.ballot.votingActive();
      if (isActive) {
        throw new Error("Cannot add candidates while voting is active. Wait for the election to end.");
      }
      
      // Check if election has ended (winner declared)
      const winnerDeclared = await contracts.ballot.winnerDeclared();
      const candidatesCount = await contracts.ballot.candidatesCount();
      if (winnerDeclared && Number(candidatesCount) > 0) {
        throw new Error("Cannot add candidates to a concluded election. Please reset candidates first to prepare for a new election.");
      }
      
      const tx = await contracts.ballot.addCandidate(newCandidateName.trim());
      await tx.wait();
      
      alert(`✅ Candidate "${newCandidateName}" added successfully!`);
      setNewCandidateName("");
      
      // Reload election data to show new candidate
      await loadElectionData();
      
    } catch (error) {
      console.error("Add candidate error:", error);
      let errorMessage = "Failed to add candidate";
      
      if (error.code === "ACTION_REJECTED") {
        errorMessage = "Transaction was rejected";
      } else if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`⚠️ ${errorMessage}`);
    } finally {
      setAddCandidateLoading(false);
    }
  };

  // Reset candidates for new election (admin only)
  const resetCandidates = async () => {
    if (!isAdmin) {
      alert("Only admin can reset candidates");
      return;
    }
    
    if (!confirm("Are you sure you want to reset all candidates? This will clear all candidates and prepare for a new election. This action cannot be undone.")) {
      return;
    }
    
    let contracts = null;
    try {
      setResetCandidatesLoading(true);
      contracts = await getContract();
      
      // Verify the function exists on the contract
      if (!contracts.ballot.resetCandidatesForNewElection) {
        throw new Error("resetCandidatesForNewElection function not found on contract. The contract may need to be redeployed with the latest code.");
      }
      
      // Check if voting is active
      const isActive = await contracts.ballot.votingActive();
      if (isActive) {
        throw new Error("Cannot reset candidates while voting is active. End the election first.");
      }
      
      // Double-check admin status on-chain
      const contractAdmin = await contracts.ballot.admin();
      const currentAccount = await contracts.signer.getAddress();
      if (contractAdmin.toLowerCase() !== currentAccount.toLowerCase()) {
        throw new Error(`Only admin can reset candidates. Current admin: ${contractAdmin}, Your address: ${currentAccount}`);
      }
      
      // Send transaction with a reasonable gas limit (skip gas estimation to avoid errors)
      // If the function doesn't exist, this will fail with a clear error
      const tx = await contracts.ballot.resetCandidatesForNewElection({
        gasLimit: 500000n // Set a reasonable gas limit
      });
      await tx.wait();
      
      alert(`✅ Candidates reset successfully! You can now add candidates for a new election.`);
      
      // Reload election data
      await loadElectionData();
      
    } catch (error) {
      console.error("Reset candidates error:", error);
      console.error("Full error object:", error);
      
      let errorMessage = "Failed to reset candidates";
      
      if (error.code === "ACTION_REJECTED") {
        errorMessage = "Transaction was rejected";
      } else if (error.reason) {
        errorMessage = error.reason;
      } else if (error.data) {
        // Try to parse the revert reason from error data
        try {
          // Check if it's a contract revert with data
          if (error.data.data && contracts?.ballot) {
            try {
              const decoded = contracts.ballot.interface.parseError(error.data.data);
              errorMessage = decoded?.name || "Contract reverted";
            } catch (e) {
              errorMessage = error.data.message || error.data.reason || "Contract reverted";
            }
          } else {
            errorMessage = error.data.message || error.data.reason || JSON.stringify(error.data);
          }
        } catch (e) {
          errorMessage = error.data.toString();
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Check for "missing revert data" - this means the function doesn't exist on the deployed contract
      if (errorMessage.includes("missing revert data") || error.code === "CALL_EXCEPTION" && error.data === null) {
        errorMessage = "❌ The resetCandidatesForNewElection function does not exist on the deployed contract.\n\n" +
          "The contract needs to be redeployed with the latest code.\n\n" +
          "To fix this, redeploy the contract:\n" +
          "• Local network: npx hardhat run scripts/deploy.js\n" +
          "• Sepolia: npx hardhat run scripts/deploy.js --network sepolia\n\n" +
          "After redeployment, the new contract address will be saved automatically.";
      }
      // Check if it's a contract call error with require(false)
      else if (errorMessage.includes("require(false)") || errorMessage === "require(false)") {
        // Try to get more details if we have contracts
        if (contracts) {
          try {
            const contractAdmin = await contracts.ballot.admin();
            const isActive = await contracts.ballot.votingActive();
            const currentAccount = await contracts.signer.getAddress();
            const isUserAdmin = contractAdmin.toLowerCase() === currentAccount.toLowerCase();
            
            errorMessage = `Contract reverted with require(false).\n\nDetails:\n- Admin: ${contractAdmin}\n- Your address: ${currentAccount}\n- Is admin: ${isUserAdmin}\n- Voting active: ${isActive}\n\nPossible reasons:\n1. You are not the admin (check above)\n2. Voting is currently active (check above)\n3. Contract state issue`;
          } catch (e) {
            errorMessage = `Contract reverted with require(false). Possible reasons:\n1. You are not the admin\n2. Voting is currently active\n3. Contract state issue`;
          }
        } else {
          errorMessage = `Contract reverted with require(false). Possible reasons:\n1. You are not the admin\n2. Voting is currently active\n3. Contract state issue`;
        }
      }
      
      alert(`⚠️ ${errorMessage}`);
    } finally {
      setResetCandidatesLoading(false);
    }
  };

  // Start election (admin only)
  const startElection = async () => {
    if (!electionStartDate || !electionStartTime || !electionEndDate || !electionEndTime) {
      alert("Please fill in all date and time fields");
      return;
    }
    
    if (!isAdmin) {
      alert("Only admin can start elections");
      return;
    }
    
    try {
      setStartElectionLoading(true);
      const contracts = await getContract();
      
      // Combine date and time, then convert to Unix timestamp
      const startDateTime = new Date(`${electionStartDate}T${electionStartTime}`);
      const endDateTime = new Date(`${electionEndDate}T${electionEndTime}`);
      
      // Validate dates
      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        throw new Error("Invalid date/time format");
      }
      
      if (startDateTime >= endDateTime) {
        throw new Error("End time must be after start time");
      }
      
      if (startDateTime < new Date()) {
        throw new Error("Start time cannot be in the past");
      }
      
      // Convert to Unix timestamp (seconds)
      const startTimestamp = Math.floor(startDateTime.getTime() / 1000);
      const endTimestamp = Math.floor(endDateTime.getTime() / 1000);
      
      const tx = await contracts.ballot.startVoting(startTimestamp, endTimestamp);
      await tx.wait();
      
      alert(`✅ Election started successfully!`);
      
      // Clear form
      setElectionStartDate("");
      setElectionStartTime("");
      setElectionEndDate("");
      setElectionEndTime("");
      
      // Reload election data
      await loadElectionData();
      
    } catch (error) {
      console.error("Start election error:", error);
      let errorMessage = "Failed to start election";
      
      if (error.code === "ACTION_REJECTED") {
        errorMessage = "Transaction was rejected";
      } else if (error.message?.includes("HTTP request failed") || error.message?.includes("Failed to fetch") || error.message?.includes("drpc.org")) {
        errorMessage = "Network RPC error. MetaMask's RPC endpoint is having issues.\n\n" +
          "Try:\n" +
          "1. Refresh the page and try again\n" +
          "2. Switch to a different network and back to Sepolia\n" +
          "3. Wait a few minutes and retry\n" +
          "4. Check your internet connection";
      } else if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`⚠️ ${errorMessage}`);
    } finally {
      setStartElectionLoading(false);
    }
  };

  // End election (admin only)
  const endElection = async () => {
    if (!isAdmin) {
      alert("Only admin can end elections");
      return;
    }
    
    if (!votingActive) {
      alert("No active election to end");
      return;
    }
    
    if (!confirm("Are you sure you want to end the election? This will declare the winner(s).")) {
      return;
    }
    
    try {
      setEndElectionLoading(true);
      const contracts = await getContract();
      
      const tx = await contracts.ballot.endVoting();
      await tx.wait();
      
      alert(`✅ Election ended successfully! Winner(s) declared.`);
      
      // Reload election data to show winners
      await loadElectionData();
      
    } catch (error) {
      console.error("End election error:", error);
      let errorMessage = "Failed to end election";
      
      if (error.code === "ACTION_REJECTED") {
        errorMessage = "Transaction was rejected";
      } else if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`⚠️ ${errorMessage}`);
    } finally {
      setEndElectionLoading(false);
    }
  };

  // Load candidates and election data
  const loadElectionData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const contracts = await getContract();
      
      // Check voter registration status
      await checkVoterRegistration(contracts);
      
      // Check if user has voted and update registration state
      if (account) {
        const registered = await contracts.voterRegistry.isRegistered(account);
        setIsRegistered(registered);
        const voted = await contracts.voterRegistry.hasVoted(account);
        setHasVoted(voted);
      }

      // Get election status
      const status = await getElectionStatus(contracts.ballot);
      setElectionStatus(status);

      // Get candidates
      const [candidateIds, candidateNames, candidateVotes] = await contracts.ballot.getAllCandidates();
      
      const formattedCandidates = candidateIds.map((id, index) => ({
        id: Number(id),
        name: candidateNames[index],
        voteCount: Number(candidateVotes[index])
      }));
      
      setCandidates(formattedCandidates);

      // Get winners if election ended
      if (!votingActive && Number(endTime) > 0 && Date.now() / 1000 > Number(endTime)) {
        try {
          const [winnerIds, winnerNames, winnerVotes] = await contracts.ballot.getWinners();
          if (winnerIds.length > 0) {
            const formattedWinners = winnerIds.map((id, index) => ({
              id: Number(id),
              name: winnerNames[index],
              voteCount: Number(winnerVotes[index])
            }));
            setWinners(formattedWinners);
            setWinner(formattedWinners.map(w => w.name).join(", "));
          }
        } catch (err) {
          console.log("Winner not declared yet:", err);
        }
      }

    } catch (err) {
      console.error("Error loading election data:", err);
      
      let errorMessage = err.message;
      
      // Handle specific error cases
      if (err.message.includes("Please switch to")) {
        const isSepolia = err.message.includes("11155111");
        errorMessage = (
          <div>
            <p>❌ Wrong Network</p>
            <p>Please switch to Hardhat local network (Chain ID: 31337) or Sepolia testnet (Chain ID: 11155111)</p>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
              <button 
                onClick={switchToSepoliaNetwork}
                style={{
                  backgroundColor: "#3b82f6",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  cursor: "pointer"
                }}
              >
                🔄 Switch to Sepolia
              </button>
              <button 
                onClick={switchToHardhatNetwork}
                style={{
                  backgroundColor: "#6b7280",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  cursor: "pointer"
                }}
              >
                🔄 Switch to Hardhat
              </button>
            </div>
          </div>
        );
      } else if (err.message.includes("No contract found")) {
        errorMessage = "❌ Contract not deployed. Please run 'npx hardhat run scripts/deploy.js --network sepolia' to deploy to Sepolia.";
      } else if (err.message.includes("missing revert data")) {
        errorMessage = "❌ Contract call failed. The contract might not be properly initialized or you're on the wrong network.";
      } else if (err.message?.includes("HTTP request failed") || err.message?.includes("Failed to fetch") || err.message?.includes("drpc.org") || err.message?.includes("could not coalesce error")) {
        errorMessage = "⚠️ Network RPC Error\n\nMetaMask's RPC endpoint is having connectivity issues.\n\nTry:\n1. Refresh the page\n2. Switch networks in MetaMask and switch back\n3. Wait a few minutes and retry\n4. Check your internet connection";
      } else if (err.message.includes("Failed to fetch") || err.message.includes("127.0.0.1:8545") || err.message.includes("localhost:8545")) {
        errorMessage = (
          <div>
            <p>❌ Connection Error</p>
            <p>MetaMask is trying to connect to localhost (Hardhat). Since you deployed to Sepolia, please switch to Sepolia network.</p>
            <button 
              onClick={switchToSepoliaNetwork}
              style={{
                backgroundColor: "#3b82f6",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "8px 16px",
                cursor: "pointer",
                marginTop: "0.5rem"
              }}
            >
              🔄 Switch to Sepolia Network
            </button>
          </div>
        );
      }
      
      setError(errorMessage);
      setElectionStatus("❌ Error loading data");
    } finally {
      setLoading(false);
    }
  }, [account, contractAddress, getContract, votingActive, endTime]);

  // Vote function
  const castVote = async (candidateId) => {
    if (!account) {
      alert("Please connect your wallet first");
      return;
    }

    // Require registration first
    if (!isRegistered) {
      alert("⚠️ Please register first using your NIN. Click 'Verify NIN & Register' above.");
      return;
    }

    // Require eligibility verification before voting
    if (!eligibilityVerified) {
      alert("⚠️ Please verify your eligibility first before voting. Click 'Verify Eligibility' above.");
      return;
    }

    if (hasVoted) {
      alert("You have already voted!");
      return;
    }

    if (!votingActive) {
      alert("Voting is not currently active");
      return;
    }

    try {
      setVotingLoading(true);
      const contracts = await getContract();
      
      // Estimate gas first
      const gasEstimate = await contracts.ballot.vote.estimateGas(candidateId);
      
      // Send transaction with proper gas limit
      const tx = await contracts.ballot.vote(candidateId, {
        gasLimit: gasEstimate * 120n / 100n // Add 20% buffer
      });
      
      // Show transaction hash
      alert(`Transaction submitted! Hash: ${tx.hash}`);
      
      // Wait for confirmation
      await tx.wait();
      
      alert("✅ Vote cast successfully!");
      
      // Reload data
      await loadElectionData();
      
    } catch (error) {
      console.error("Voting error:", error);
      let errorMessage = "Voting failed";
      
      if (error.code === "ACTION_REJECTED") {
        errorMessage = "Transaction was rejected";
      } else if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`⚠️ ${errorMessage}`);
    } finally {
      setVotingLoading(false);
    }
  };

  // Load dashboard data
  useEffect(() => {
    const loadDashboard = async () => {
      if (!window.ethereum) {
        alert("Please install MetaMask to continue");
        navigate("/");
        return;
      }

      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length === 0) {
          navigate("/");
          return;
        }

        setAccount(accounts[0]);
        // Reset eligibility verification on page load (session-only)
        setEligibilityVerified(false);
        setIsRegistered(false);
        await loadElectionData();
      } catch (err) {
        console.error("Dashboard load error:", err);
        setError("Failed to connect to wallet");
      }
    };

    loadDashboard();
  }, [navigate, loadElectionData]);

  // Reset eligibility verification and registration state when account changes
  useEffect(() => {
    setEligibilityVerified(false);
    setIsRegistered(false);
  }, [account]);

  // Listen for account changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        handleDisconnect();
      } else {
        setAccount(accounts[0]);
        loadElectionData();
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    
    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, [loadElectionData]);

  // Disconnect function
  const handleDisconnect = () => {
    localStorage.removeItem("walletConnected");
    setAccount(null);
    navigate("/");
  };

  // Refresh data
  const refreshData = () => {
    loadElectionData();
  };

  // Get total votes
  const totalVotes = candidates.reduce((sum, candidate) => sum + candidate.voteCount, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1e293b, #0f172a)",
        color: "#fff",
        fontFamily: "Poppins, sans-serif",
        padding: "2rem",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* HEADER */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
            flexWrap: "wrap",
            gap: "1rem"
          }}
        >
          <div>
            <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)", margin: 0 }}>
              🗳️ Election Dashboard
            </h1>
            <p style={{ color: "#94a3b8", margin: "0.5rem 0 0 0" }}>
              Connected: {account && `${account.slice(0, 6)}...${account.slice(-4)}`}
            </p>
          </div>
          
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={refreshData}
              disabled={loading}
              style={{
                backgroundColor: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "10px 16px",
                cursor: "pointer",
                opacity: loading ? 0.6 : 1,
                fontSize: "0.9rem"
              }}
            >
              🔄 Refresh
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDisconnect}
              style={{
                backgroundColor: "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "10px 16px",
                cursor: "pointer",
                fontSize: "0.9rem"
              }}
            >
              🔌 Disconnect
            </motion.button>
          </div>
        </motion.header>

        {/* ERROR MESSAGE */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              backgroundColor: "#ef4444",
              color: "#fff",
              padding: "1rem",
              borderRadius: "8px",
              marginBottom: "1rem",
              textAlign: "center"
            }}
          >
            {error}
          </motion.div>
        )}

        {/* ELECTION INFO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            borderRadius: "12px",
            padding: "1.5rem",
            marginBottom: "2rem",
            border: "1px solid rgba(255, 255, 255, 0.1)"
          }}
        >
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
            gap: "1rem",
            textAlign: "center"
          }}>
            <div>
              <h3 style={{ margin: "0 0 0.5rem 0", color: "#3b82f6" }}>Status</h3>
              <p style={{ margin: 0, fontSize: "1.1rem" }}>{electionStatus}</p>
            </div>
            <div>
              <h3 style={{ margin: "0 0 0.5rem 0", color: "#22c55e" }}>Total Votes</h3>
              <p style={{ margin: 0, fontSize: "1.1rem" }}>{totalVotes}</p>
            </div>
            <div>
              <h3 style={{ margin: "0 0 0.5rem 0", color: "#f59e0b" }}>Start Time</h3>
              <p style={{ margin: 0, fontSize: "0.9rem" }}>{formatTimestamp(startTime)}</p>
            </div>
            <div>
              <h3 style={{ margin: "0 0 0.5rem 0", color: "#ef4444" }}>End Time</h3>
              <p style={{ margin: 0, fontSize: "0.9rem" }}>{formatTimestamp(endTime)}</p>
            </div>
            {hasVoted && (
              <div>
                <h3 style={{ margin: "0 0 0.5rem 0", color: "#8b5cf6" }}>Your Status</h3>
                <p style={{ margin: 0, fontSize: "1.1rem" }}>✅ Voted</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* NIN REGISTRATION SECTION */}
        {account && !isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <NINVerifier
              account={account}
              getContract={getContract}
              onRegistrationComplete={(registered) => {
                setIsRegistered(registered);
                if (registered) {
                  // Refresh voter registration status after registration
                  loadElectionData();
                }
              }}
            />
          </motion.div>
        )}

        {/* ELIGIBILITY VERIFICATION SECTION */}
        {account && !isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
          >
            <EligibilityVerifier
              account={account}
              getContract={getContract}
              onVerificationComplete={(verified) => {
                setEligibilityVerified(verified);
                if (verified) {
                  // Refresh voter registration status after verification
                  loadElectionData();
                }
              }}
            />
          </motion.div>
        )}

        {/* VOTER REGISTRATION SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            borderRadius: "12px",
            padding: "1.5rem",
            marginBottom: "2rem",
            border: "1px solid rgba(255, 255, 255, 0.1)"
          }}
        >
          <h3 style={{ margin: "0 0 1rem 0", color: "#8b5cf6" }}>👥 Voter Registration Status</h3>
          
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
            gap: "1.5rem"
          }}>
            {/* Registration Status */}
            <div style={{
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderRadius: "8px",
              padding: "1rem"
            }}>
              <h4 style={{ margin: "0 0 0.5rem 0", color: "#3b82f6" }}>Your Status</h4>
              {voterRegistrationStatus ? (
                <div>
                  <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                    Registered: <span style={{ 
                      color: voterRegistrationStatus.isRegistered ? "#22c55e" : "#ef4444",
                      fontWeight: "bold"
                    }}>
                      {voterRegistrationStatus.isRegistered ? "✅ Yes" : "❌ No"}
                    </span>
                  </p>
                  <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                    Has Voted: <span style={{ 
                      color: voterRegistrationStatus.hasVoted ? "#f59e0b" : "#22c55e",
                      fontWeight: "bold"
                    }}>
                      {voterRegistrationStatus.hasVoted ? "🗳️ Yes" : "⏳ No"}
                    </span>
                  </p>
                  {isAdmin && (
                    <p style={{ margin: "0.25rem 0", fontSize: "0.9rem", color: "#8b5cf6" }}>
                      Role: <span style={{ fontWeight: "bold" }}>👑 Admin</span>
                    </p>
                  )}
                </div>
              ) : (
                <p style={{ color: "#94a3b8" }}>Loading registration status...</p>
              )}
            </div>

            {/* Fair Registration Notice */}
            {isAdmin && (
              <div style={{
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                borderRadius: "8px",
                padding: "1rem"
              }}>
                <h4 style={{ margin: "0 0 0.5rem 0", color: "#60a5fa" }}>ℹ️ Fair Registration System</h4>
                <p style={{ 
                  margin: 0, 
                  fontSize: "0.85rem", 
                  color: "#94a3b8",
                  lineHeight: "1.5"
                }}>
                  Admin registration has been disabled to ensure fairness. All voters must self-register using their NIN (National Identification Number) above. This ensures a transparent and fair registration process.
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* ADMIN PANEL */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              backgroundColor: "rgba(139, 92, 246, 0.1)",
              borderRadius: "12px",
              padding: "1.5rem",
              marginBottom: "2rem",
              border: "2px solid rgba(139, 92, 246, 0.3)"
            }}
          >
            <h2 style={{ margin: "0 0 1.5rem 0", color: "#8b5cf6", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              👑 Admin Panel
            </h2>
            
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
              gap: "1.5rem" 
            }}>
              {/* Add Candidate Section */}
              <div style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: "8px",
                padding: "1rem"
              }}>
                <h3 style={{ margin: "0 0 1rem 0", color: "#3b82f6" }}>➕ Add Candidate</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {!votingActive && candidates.length > 0 && Number(endTime) > 0 && Date.now() / 1000 > Number(endTime) && (
                    <div style={{
                      padding: "0.75rem",
                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      borderRadius: "6px",
                      marginBottom: "0.5rem"
                    }}>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "#ef4444" }}>
                        ⚠️ <strong>Election has ended.</strong> Reset candidates below to add candidates for a new election.
                      </p>
                    </div>
                  )}
                  <input
                    type="text"
                    placeholder="Enter candidate name"
                    value={newCandidateName}
                    onChange={(e) => setNewCandidateName(e.target.value)}
                    disabled={addCandidateLoading || votingActive || (winnerDeclared && candidates.length > 0)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "6px",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      color: "#fff",
                      fontSize: "0.9rem"
                    }}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={addCandidate}
                    disabled={addCandidateLoading || !newCandidateName.trim() || votingActive || (winnerDeclared && candidates.length > 0)}
                    style={{
                      backgroundColor: (addCandidateLoading || votingActive || (winnerDeclared && candidates.length > 0)) ? "#6b7280" : "#3b82f6",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      padding: "10px 16px",
                      cursor: (addCandidateLoading || votingActive || (winnerDeclared && candidates.length > 0)) ? "not-allowed" : "pointer",
                      fontSize: "0.9rem",
                      opacity: addCandidateLoading ? 0.6 : 1
                    }}
                  >
                    {addCandidateLoading ? "⏳ Adding..." : 
                     votingActive ? "⏸️ Cannot add during voting" : 
                     (winnerDeclared && candidates.length > 0) ? "⏸️ Reset candidates first" :
                     "✅ Add Candidate"}
                  </motion.button>
                  {votingActive && (
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#f59e0b" }}>
                      ⚠️ Cannot add candidates while voting is active
                    </p>
                  )}
                  {!votingActive && !winnerDeclared && candidates.length > 0 && (
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8" }}>
                      ℹ️ These candidates are for the next election. Start the election when ready.
                    </p>
                  )}
                </div>
                
                {/* Reset Candidates Button */}
                {!votingActive && candidates.length > 0 && (
                  <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
                    <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.85rem", color: "#94a3b8" }}>
                      {winnerDeclared 
                        ? "Election has ended. Reset candidates to prepare for a new election:"
                        : "Reset all candidates to start fresh for a new election:"}
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={resetCandidates}
                      disabled={resetCandidatesLoading || votingActive}
                      style={{
                        width: "100%",
                        backgroundColor: resetCandidatesLoading || votingActive ? "#6b7280" : "#ef4444",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        padding: "10px 16px",
                        cursor: resetCandidatesLoading || votingActive ? "not-allowed" : "pointer",
                        fontSize: "0.9rem",
                        opacity: resetCandidatesLoading ? 0.6 : 1
                      }}
                    >
                      {resetCandidatesLoading ? "⏳ Resetting..." : "🔄 Reset Candidates for New Election"}
                    </motion.button>
                  </div>
                )}
              </div>

              {/* Start Election Section */}
              <div style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: "8px",
                padding: "1rem"
              }}>
                <h3 style={{ margin: "0 0 1rem 0", color: "#22c55e" }}>🚀 Start Election</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.85rem", color: "#94a3b8" }}>
                      Start Date & Time
                    </label>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <input
                        type="date"
                        value={electionStartDate}
                        onChange={(e) => setElectionStartDate(e.target.value)}
                        disabled={startElectionLoading || votingActive}
                        style={{
                          flex: 1,
                          padding: "8px",
                          borderRadius: "6px",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          backgroundColor: "rgba(255, 255, 255, 0.1)",
                          color: "#fff",
                          fontSize: "0.85rem"
                        }}
                      />
                      <input
                        type="time"
                        value={electionStartTime}
                        onChange={(e) => setElectionStartTime(e.target.value)}
                        disabled={startElectionLoading || votingActive}
                        style={{
                          flex: 1,
                          padding: "8px",
                          borderRadius: "6px",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          backgroundColor: "rgba(255, 255, 255, 0.1)",
                          color: "#fff",
                          fontSize: "0.85rem"
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.85rem", color: "#94a3b8" }}>
                      End Date & Time
                    </label>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <input
                        type="date"
                        value={electionEndDate}
                        onChange={(e) => setElectionEndDate(e.target.value)}
                        disabled={startElectionLoading || votingActive}
                        style={{
                          flex: 1,
                          padding: "8px",
                          borderRadius: "6px",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          backgroundColor: "rgba(255, 255, 255, 0.1)",
                          color: "#fff",
                          fontSize: "0.85rem"
                        }}
                      />
                      <input
                        type="time"
                        value={electionEndTime}
                        onChange={(e) => setElectionEndTime(e.target.value)}
                        disabled={startElectionLoading || votingActive}
                        style={{
                          flex: 1,
                          padding: "8px",
                          borderRadius: "6px",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          backgroundColor: "rgba(255, 255, 255, 0.1)",
                          color: "#fff",
                          fontSize: "0.85rem"
                        }}
                      />
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startElection}
                    disabled={startElectionLoading || votingActive || !electionStartDate || !electionStartTime || !electionEndDate || !electionEndTime}
                    style={{
                      backgroundColor: startElectionLoading || votingActive ? "#6b7280" : "#22c55e",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      padding: "10px 16px",
                      cursor: startElectionLoading || votingActive ? "not-allowed" : "pointer",
                      fontSize: "0.9rem",
                      opacity: startElectionLoading ? 0.6 : 1
                    }}
                  >
                    {startElectionLoading ? "⏳ Starting..." : votingActive ? "⏸️ Election Already Active" : "🚀 Start Election"}
                  </motion.button>
                  {votingActive && (
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#22c55e" }}>
                      ✅ Election is currently active
                    </p>
                  )}
                </div>
              </div>

              {/* End Election Section */}
              <div style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: "8px",
                padding: "1rem"
              }}>
                <h3 style={{ margin: "0 0 1rem 0", color: "#ef4444" }}>🛑 End Election (Manual)</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#94a3b8" }}>
                    Manually end the election and declare winner(s). Note: Elections automatically end when the end time is reached to prevent late voting.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={endElection}
                    disabled={endElectionLoading || !votingActive}
                    style={{
                      backgroundColor: endElectionLoading || !votingActive ? "#6b7280" : "#ef4444",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      padding: "10px 16px",
                      cursor: endElectionLoading || !votingActive ? "not-allowed" : "pointer",
                      fontSize: "0.9rem",
                      opacity: endElectionLoading ? 0.6 : 1
                    }}
                  >
                    {endElectionLoading ? "⏳ Ending..." : !votingActive ? "⏸️ No Active Election" : "🛑 End Election Manually"}
                  </motion.button>
                  {!votingActive && (
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8" }}>
                      {Number(endTime) > 0 && Date.now() / 1000 > Number(endTime) 
                        ? "✅ Election has ended automatically"
                        : "⏸️ No active election to end"}
                    </p>
                  )}
                  {votingActive && Number(endTime) > 0 && Date.now() / 1000 > Number(endTime) && (
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#f59e0b" }}>
                      ⚠️ End time has passed. Election should auto-end on next page refresh.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* WINNERS SECTION */}
        {winners.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              backgroundColor: "rgba(34, 197, 94, 0.1)",
              borderRadius: "12px",
              padding: "1.5rem",
              marginBottom: "2rem",
              border: "2px solid #22c55e",
              textAlign: "center"
            }}
          >
            <h2 style={{ margin: "0 0 1rem 0", color: "#22c55e" }}>🏆 Winner(s)</h2>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1rem" }}>
              {winners.map((winner, index) => (
                <div key={winner.id} style={{
                  backgroundColor: "rgba(34, 197, 94, 0.2)",
                  padding: "1rem",
                  borderRadius: "8px",
                  minWidth: "150px"
                }}>
                  <h3 style={{ margin: "0 0 0.5rem 0" }}>{winner.name}</h3>
                  <p style={{ margin: 0, color: "#94a3b8" }}>{winner.voteCount} votes</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* CHART TOGGLE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ textAlign: "center", marginBottom: "2rem" }}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowChart(!showChart)}
            style={{
              backgroundColor: "#8b5cf6",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "12px 24px",
              cursor: "pointer",
              fontSize: "1rem",
              marginBottom: "1rem"
            }}
          >
            {showChart ? "📊 Hide Chart" : "📊 Show Results Chart"}
          </motion.button>
        </motion.div>

        {/* RESULTS CHART */}
        {showChart && candidates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ delay: 0.4 }}
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderRadius: "12px",
              padding: "1.5rem",
              marginBottom: "2rem",
              border: "1px solid rgba(255, 255, 255, 0.1)"
            }}
          >
            <h3 style={{ textAlign: "center", marginBottom: "1.5rem" }}>Voting Results</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={candidates} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#fff"
                  }}
                />
                <Bar dataKey="voteCount" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* CANDIDATES LIST */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.5rem",
            marginBottom: "2rem"
          }}
        >
          {loading ? (
            <div style={{ 
              gridColumn: "1 / -1", 
              textAlign: "center", 
              padding: "2rem",
              color: "#94a3b8"
            }}>
              Loading candidates...
            </div>
          ) : candidates.length > 0 ? (
            candidates.map((candidate, index) => (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  borderRadius: "12px",
                  padding: "1.5rem",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  position: "relative",
                  overflow: "hidden"
                }}
              >
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "4px",
                  background: `linear-gradient(90deg, ${COLORS[index % COLORS.length]}, ${COLORS[(index + 1) % COLORS.length]})`
                }} />
                
                <h3 style={{ 
                  margin: "0 0 1rem 0", 
                  fontSize: "1.2rem",
                  color: "#fff"
                }}>
                  {candidate.name}
                </h3>
                
                <div style={{ marginBottom: "1rem" }}>
                  <p style={{ 
                    margin: "0 0 0.5rem 0", 
                    color: "#94a3b8",
                    fontSize: "0.9rem"
                  }}>
                    Votes: <span style={{ color: "#fff", fontWeight: "bold" }}>
                      {candidate.voteCount}
                    </span>
                  </p>
                  
                  {totalVotes > 0 && (
                    <div style={{ 
                      width: "100%", 
                      height: "6px", 
                      backgroundColor: "rgba(255,255,255,0.1)", 
                      borderRadius: "3px",
                      overflow: "hidden"
                    }}>
                      <div style={{
                        width: `${(candidate.voteCount / totalVotes) * 100}%`,
                        height: "100%",
                        backgroundColor: COLORS[index % COLORS.length],
                        transition: "width 0.3s ease"
                      }} />
                    </div>
                  )}
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={votingLoading || hasVoted || !votingActive || !isRegistered || !eligibilityVerified}
                  onClick={() => castVote(candidate.id)}
                  style={{
                    width: "100%",
                    backgroundColor: hasVoted ? "#6b7280" : 
                                   !votingActive ? "#6b7280" : 
                                   !isRegistered ? "#ef4444" : 
                                   !eligibilityVerified ? "#f59e0b" : "#2563eb",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "12px",
                    cursor: (hasVoted || !votingActive || !isRegistered || !eligibilityVerified) ? "not-allowed" : "pointer",
                    fontSize: "1rem",
                    fontWeight: "500",
                    opacity: votingLoading ? 0.6 : 1,
                    transition: "all 0.3s ease"
                  }}
                >
                  {votingLoading ? "⏳ Processing..." : 
                   hasVoted ? "✅ Already Voted" : 
                   !isRegistered ? "🆔 Register with NIN First" :
                   !eligibilityVerified ? "🔐 Verify Eligibility First" :
                   !votingActive ? "⏸️ Voting Closed" : 
                   "🗳️ Vote"}
                </motion.button>
              </motion.div>
            ))
          ) : (
            <div style={{ 
              gridColumn: "1 / -1", 
              textAlign: "center", 
              padding: "2rem",
              color: "#94a3b8"
            }}>
              No candidates found.
            </div>
          )}
        </motion.div>

        {/* FOOTER */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{
            textAlign: "center",
            padding: "2rem 0",
            color: "#94a3b8",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)"
          }}
        >
          <p style={{ margin: 0, fontSize: "0.9rem" }}>
            Built with <strong>Ethereum + Hardhat + React</strong> • 
            Contract: <code style={{ 
              backgroundColor: "rgba(255,255,255,0.1)", 
              padding: "2px 6px", 
              borderRadius: "4px",
              fontSize: "0.8rem"
            }}>
              {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
            </code>
          </p>
        </motion.footer>
      </div>
    </motion.div>
  );
}
