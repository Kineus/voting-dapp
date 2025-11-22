const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('Decentralized Voting System', function () {
  let admin, voter1, voter2, voter3
  let ElectionManager, Ballot, VoterRegistry
  let electionManager, ballotAddress, ballot, registry

  beforeEach(async function () {
    ;[admin, voter1, voter2, voter3] = await ethers.getSigners()
    ElectionManager = await ethers.getContractFactory('ElectionManager')
    electionManager = await ElectionManager.connect(admin).deploy()

    const now = Math.floor(Date.now() / 1000)
    await electionManager.createElection(
      'Presidential Election 2025',
      'Vote for the next president',
      now + 60, // start 1 minute from now
      now + 600 // end 10 minutes from now
    )

    const election = await electionManager.elections(1)
    ballotAddress = election.ballotAddress

    Ballot = await ethers.getContractFactory('Ballot')
    ballot = Ballot.attach(ballotAddress)

    const registryAddress = await electionManager.registry()
    VoterRegistry = await ethers.getContractFactory('VoterRegistry')
    registry = VoterRegistry.attach(registryAddress)
  })

  it('Should store election metadata correctly', async function () {
    const details = await electionManager.getElectionDetails(1)
    expect(details[0]).to.equal('Presidential Election 2025')
    expect(details[1]).to.equal('Vote for the next president')
  })

  it('Should allow only admin to whitelist voters', async function () {
    await registry.connect(admin).addVoter(voter1.address)
    expect(await registry.isRegistered(voter1.address)).to.equal(true)
    await expect(
      registry.connect(voter1).addVoter(voter2.address)
    ).to.be.revertedWith('Only admin can call this')
  })

  it('Should allow admin to add candidates', async function () {
    await ballot.connect(admin).addCandidate('Alice')
    await ballot.connect(admin).addCandidate('Bob')
    const candidate = await ballot.getCandidate(1)
    expect(candidate[1]).to.equal('Alice')
  })

  it('Should not allow voting before start time', async function () {
    await registry.connect(admin).addVoter(voter1.address)
    await ballot.connect(admin).addCandidate('Alice')
    await expect(ballot.connect(voter1).vote(1)).to.be.revertedWith(
      'Voting not active or out of timeframe'
    )
  })

  it('Should allow voting within time and record correctly', async function () {
    await registry.connect(admin).addVoter(voter1.address)
    await ballot.connect(admin).addCandidate('Alice')
    await ballot
      .connect(admin)
      .startVoting(
        Math.floor(Date.now() / 1000) - 10,
        Math.floor(Date.now() / 1000) + 100
      )
    await ballot.connect(voter1).vote(1)
    const [, , votes] = await ballot.getCandidate(1)
    expect(votes).to.equal(1)
  })

  it('Should handle tie between candidates', async function () {
    await registry.connect(admin).addVoter(voter1.address)
    await registry.connect(admin).addVoter(voter2.address)
    await ballot.connect(admin).addCandidate('Alice')
    await ballot.connect(admin).addCandidate('Bob')

    const start = Math.floor(Date.now() / 1000) - 10
    const end = Math.floor(Date.now() / 1000) + 100
    await ballot.connect(admin).startVoting(start, end)

    await ballot.connect(voter1).vote(1)
    await ballot.connect(voter2).vote(2)

    await ethers.provider.send('evm_increaseTime', [200])
    await ethers.provider.send('evm_mine')

    await ballot.connect(admin).endVoting()
    const [ids, names, votes] = await ballot.getWinners()

    expect(names).to.include.members(['Alice', 'Bob'])
    expect(votes[0]).to.equal(1)
  })
})
