// scripts/deploy.js
const hre = require('hardhat')

async function main() {
  const [deployer] = await hre.ethers.getSigners()

  console.log('Deploying contracts with account:', deployer.address)

  // 1️⃣ Deploy VoterRegistry (pass admin)
  const VoterRegistry = await hre.ethers.getContractFactory('VoterRegistry')
  const voterRegistry = await VoterRegistry.deploy(deployer.address)
  await voterRegistry.waitForDeployment()
  console.log(`✅ VoterRegistry deployed to: ${voterRegistry.target}`)

  // 2️⃣ Deploy Ballot (pass voterRegistry + admin)
  console.log('Deploying Ballot contract...')
  const Ballot = await hre.ethers.getContractFactory('Ballot')
  
  // Add retry logic for deployment
  let ballot
  let retries = 3
  while (retries > 0) {
    try {
      ballot = await Ballot.deploy(voterRegistry.target, deployer.address)
      console.log('Waiting for deployment confirmation...')
      await ballot.waitForDeployment()
      console.log(`✅ Ballot contract deployed to: ${ballot.target}`)
      break
    } catch (error) {
      retries--
      if (retries === 0) {
        throw error
      }
      console.log(`⚠️  Deployment failed, retrying... (${retries} attempts left)`)
      await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds before retry
    }
  }

  // 3️⃣ Set ballot contract address in VoterRegistry
  await voterRegistry.setBallotContract(ballot.target)
  console.log('✅ Set ballot contract address in VoterRegistry')

  // 4️⃣ Save Ballot ABI + address
  const fs = require('fs')
  const ballotData = {
    address: ballot.target,
    abi: JSON.parse(ballot.interface.formatJson()),
  }
  fs.writeFileSync(
    './client/src/utils/ballot.json',
    JSON.stringify(ballotData, null, 2)
  )
  console.log('📁 Ballot ABI + address saved to client/src/utils/ballot.json')

  // 5️⃣ Save VoterRegistry ABI + address
  const registryData = {
    address: voterRegistry.target,
    abi: JSON.parse(voterRegistry.interface.formatJson()),
  }
  fs.writeFileSync(
    './client/src/utils/voterRegistry.json',
    JSON.stringify(registryData, null, 2)
  )
  console.log('📁 VoterRegistry ABI + address saved to client/src/utils/voterRegistry.json')

  // 6️⃣ Print deployment summary
  console.log('\n🎉 Deployment Summary:')
  console.log('================================')
  console.log(`Admin Address: ${deployer.address}`)
  console.log(`VoterRegistry: ${voterRegistry.target}`)
  console.log(`Ballot Contract: ${ballot.target}`)
  console.log('================================')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
//Deploying contracts with account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
// ✅ VoterRegistry deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
//✅ Ballot contract deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
//📁 ABI + address saved to client/src/utils/ballot.json
