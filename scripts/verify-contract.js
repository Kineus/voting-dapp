// scripts/verify-contract.js
// This script checks if the deployed contract has the resetCandidatesForNewElection function
const hre = require('hardhat');
const fs = require('fs');

async function main() {
  const ballotJson = JSON.parse(fs.readFileSync('./client/src/utils/ballot.json', 'utf8'));
  const contractAddress = ballotJson.address;
  
  console.log('Checking contract at address:', contractAddress);
  
  // Get the contract factory
  const Ballot = await hre.ethers.getContractFactory('Ballot');
  
  // Try to attach to the deployed contract
  try {
    const ballot = Ballot.attach(contractAddress);
    
    // Check if the function exists by trying to get its interface
    const hasResetFunction = ballot.interface.hasFunction('resetCandidatesForNewElection');
    const hasAutoEndFunction = ballot.interface.hasFunction('autoEndElection');
    
    console.log('\n📋 Contract Function Check:');
    console.log('================================');
    console.log(`resetCandidatesForNewElection: ${hasResetFunction ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`autoEndElection: ${hasAutoEndFunction ? '✅ EXISTS' : '❌ MISSING'}`);
    
    if (!hasResetFunction || !hasAutoEndFunction) {
      console.log('\n⚠️  WARNING: The deployed contract is missing required functions!');
      console.log('You need to redeploy the contract with the latest code.');
      console.log('\nTo redeploy, run:');
      console.log('  npx hardhat run scripts/deploy.js --network <network>');
      console.log('\nFor local Hardhat:');
      console.log('  npx hardhat run scripts/deploy.js');
      console.log('\nFor Sepolia:');
      console.log('  npx hardhat run scripts/deploy.js --network sepolia');
    } else {
      console.log('\n✅ All functions are present on the deployed contract!');
    }
    
    // Also check admin
    try {
      const admin = await ballot.admin();
      console.log(`\nAdmin address: ${admin}`);
    } catch (e) {
      console.log('\n⚠️  Could not read admin address');
    }
    
  } catch (error) {
    console.error('Error checking contract:', error.message);
    console.log('\nThis might mean:');
    console.log('1. The contract address is incorrect');
    console.log('2. The contract was deployed with different code');
    console.log('3. You need to redeploy the contract');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

