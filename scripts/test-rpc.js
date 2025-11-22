// scripts/test-rpc.js
// Test RPC connection before deploying
const hre = require('hardhat');

async function main() {
  console.log('Testing Sepolia RPC connection...\n');
  
  const rpcUrl = process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org";
  console.log(`RPC URL: ${rpcUrl}`);
  
  try {
    const provider = new hre.ethers.JsonRpcProvider(rpcUrl);
    
    console.log('Attempting to connect...');
    const blockNumber = await Promise.race([
      provider.getBlockNumber(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
      )
    ]);
    
    console.log(`✅ Connection successful!`);
    console.log(`Current block number: ${blockNumber}`);
    
    const network = await provider.getNetwork();
    console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
    
    // Suggest alternative RPCs if the current one is slow
    console.log('\n📋 Alternative Sepolia RPC endpoints you can use:');
    console.log('1. Alchemy: https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY');
    console.log('2. Infura: https://sepolia.infura.io/v3/YOUR_PROJECT_ID');
    console.log('3. Public: https://rpc.sepolia.org (current)');
    console.log('4. Ankr: https://rpc.ankr.com/eth_sepolia');
    console.log('\nAdd to your .env file:');
    console.log('SEPOLIA_RPC_URL=https://your-chosen-endpoint');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\n💡 Suggestions:');
    console.log('1. Check your internet connection');
    console.log('2. Try a different RPC endpoint (see alternatives above)');
    console.log('3. Use a free RPC service like Alchemy or Infura');
    console.log('4. Deploy to local network first: npx hardhat run scripts/deploy.js');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

