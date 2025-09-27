// scripts/deploy.js
const hre = require('hardhat')
const { parseEther } = require('ethers')

async function main() {
  const Lock = await hre.ethers.getContractFactory('Lock')

  const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60
  const unlockTime = Math.floor(Date.now() / 1000) + ONE_YEAR_IN_SECS

  const lockedAmount = parseEther('1') // 1 ETH

  const lock = await Lock.deploy(unlockTime, { value: lockedAmount })

  console.log(`✅ Lock contract deployed to: ${lock.target}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
