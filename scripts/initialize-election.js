// scripts/initialize-election.js
const hre = require('hardhat')

async function main() {
  const [deployer] = await hre.ethers.getSigners()
  console.log('Initializing election with account:', deployer.address)

  // Get the deployed contracts
  const ballotAddress = '0xFD471836031dc5108809D173A067e8486B9047A3' // Update this with your deployed address
  const voterRegistryAddress = '0xc351628EB244ec633d5f21fBD6621e1a683B1181' // Update this with your deployed address
  
  const Ballot = await hre.ethers.getContractFactory('Ballot')
  const ballot = Ballot.attach(ballotAddress)
  
  const VoterRegistry = await hre.ethers.getContractFactory('VoterRegistry')
  const voterRegistry = VoterRegistry.attach(voterRegistryAddress)

  console.log('👥 Registering voters...')
  
  // Register some test voters (using the test accounts from Hardhat)
  const testVoters = [
    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Account #1
    '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', // Account #2
    '0x90F79bf6EB2c4f870365E785982E1f101E93b906', // Account #3
    '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', // Account #4
    '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc', // Account #5
  ]

  for (const voterAddress of testVoters) {
    try {
      const tx = await voterRegistry.registerVoter(voterAddress)
      await tx.wait()
      console.log(`✅ Registered voter: ${voterAddress}`)
    } catch (error) {
      console.error(`❌ Failed to register voter ${voterAddress}:`, error.message)
    }
  }

  console.log('📋 Adding candidates...')

  // Add some test candidates
  const candidates = [
    'Alice Johnson',
    'Bob Smith',
    'Carol Williams',
    'David Brown',
  ]

  for (const candidateName of candidates) {
    try {
      const tx = await ballot.addCandidate(candidateName)
      await tx.wait()
      console.log(`✅ Added candidate: ${candidateName}`)
    } catch (error) {
      console.error(
        `❌ Failed to add candidate ${candidateName}:`,
        error.message
      )
    }
  }

  console.log('⏰ Starting voting period...')

  // Set voting period (24 hours from now)
  const startTime = Math.floor(Date.now() / 1000) // Now
  const endTime = startTime + 24 * 60 * 60 // 24 hours from now

  try {
    const tx = await ballot.startVoting(startTime, endTime)
    await tx.wait()
    console.log(
      `✅ Voting started from ${new Date(
        startTime * 1000
      ).toLocaleString()} to ${new Date(endTime * 1000).toLocaleString()}`
    )
  } catch (error) {
    console.error('❌ Failed to start voting:', error.message)
  }

  console.log('🎉 Election initialized successfully!')
  console.log('You can now test voting in the frontend.')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
