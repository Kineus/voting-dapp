🗳️ Decentralized Voting System (Ethereum + Hardhat)

A blockchain-based decentralized voting system built with Solidity, Hardhat, and React.js.
The project demonstrates how elections can be conducted securely, transparently, and tamper-proof using smart contracts on Ethereum.

🚀 Features

✅ Candidate Registration – Admin can register election candidates.

✅ Secure Voting – Each wallet address can only vote once.

✅ Vote Counting – Votes are tallied automatically on-chain.

✅ Transparency – All transactions are recorded on Ethereum.

✅ Frontend Integration – React + Ethers.js connects users to MetaMask for interaction.

🛠️ Tech Stack

Smart Contracts: Solidity (deployed using Hardhat)

Blockchain: Ethereum (Hardhat local, Sepolia testnet)

Frontend: React.js + Ethers.js

Wallet: MetaMask

Testing: Hardhat + Chai

📂 Project Structure
voting-dapp/
├── contracts/          # Solidity smart contracts
│   └── Voting.sol
├── scripts/            # Deployment scripts
│   └── deploy.js
├── test/               # Automated tests
├── client/             # React frontend
│   ├── src/
│   │   ├── App.js
│   │   └── ConnectWallet.js
├── hardhat.config.js   # Hardhat configuration
└── README.md           # Project documentation
