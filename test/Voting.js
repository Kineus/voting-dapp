const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('Voting Contract', function () {
  let Voting, voting, owner, voter1, voter2, voter3

  beforeEach(async function () {
    ;[owner, voter1, voter2, voter3] = await ethers.getSigners()

    Voting = await ethers.getContractFactory('Voting')
    voting = await Voting.deploy()
  })

  // --- Admin and Candidate Management ---
  it('Should set the right admin', async function () {
    expect(await voting.admin()).to.equal(owner.address)
  })

  it('Should allow admin to add candidates', async function () {
    await voting.addCandidate('Alice')
    await voting.addCandidate('Bob')

    const candidate1 = await voting.getCandidate(1)
    const candidate2 = await voting.getCandidate(2)

    expect(candidate1[1]).to.equal('Alice')
    expect(candidate2[1]).to.equal('Bob')
  })

  it('Should NOT allow non-admin to add candidates', async function () {
    await expect(
      voting.connect(voter1).addCandidate('Charlie')
    ).to.be.revertedWith('Only admin can call this')
  })

  // --- Voting Flow ---
  it('Should allow admin to start and end voting', async function () {
    await voting.addCandidate('Alice')

    await voting.startVoting()
    expect(await voting.votingActive()).to.equal(true)

    await voting.endVoting()
    expect(await voting.votingActive()).to.equal(false)
  })

  it('Should allow voting for a valid candidate', async function () {
    await voting.addCandidate('Alice')
    await voting.startVoting()

    await voting.connect(voter1).vote(1)

    const candidate = await voting.getCandidate(1)
    expect(candidate[2]).to.equal(1)
  })

  it('Should prevent double voting by same user', async function () {
    await voting.addCandidate('Alice')
    await voting.startVoting()

    await voting.connect(voter1).vote(1)
    await expect(voting.connect(voter1).vote(1)).to.be.revertedWith(
      'You have already voted'
    )
  })

  it('Should prevent voting when not active', async function () {
    await voting.addCandidate('Alice')
    await expect(voting.connect(voter1).vote(1)).to.be.revertedWith(
      'Voting is not active'
    )
  })

  it('Should prevent voting for invalid candidate', async function () {
    await voting.addCandidate('Alice')
    await voting.startVoting()

    await expect(voting.connect(voter1).vote(99)).to.be.revertedWith(
      'Invalid candidate'
    )
  })

  // --- Candidate Retrieval ---
  it('Should return all candidates with getAllCandidates()', async function () {
    await voting.addCandidate('Alice')
    await voting.addCandidate('Bob')

    const [ids, names, votes] = await voting.getAllCandidates()

    expect(ids.length).to.equal(2)
    expect(names[0]).to.equal('Alice')
    expect(names[1]).to.equal('Bob')
    expect(votes[0]).to.equal(0)
    expect(votes[1]).to.equal(0)
  })

  it('Should reflect updated votes in getAllCandidates()', async function () {
    await voting.addCandidate('Alice')
    await voting.addCandidate('Bob')
    await voting.startVoting()

    await voting.connect(voter1).vote(1) // Alice
    await voting.connect(voter2).vote(2) // Bob
    await voting.connect(owner).vote(1) // Alice again

    const [ids, names, votes] = await voting.getAllCandidates()

    expect(ids.length).to.equal(2)
    expect(names[0]).to.equal('Alice')
    expect(names[1]).to.equal('Bob')
    expect(votes[0]).to.equal(2) // Alice has 2
    expect(votes[1]).to.equal(1) // Bob has 1
  })

  // --- Winner Declaration ---
  it('Should declare the correct winner when one candidate has more votes', async function () {
    await voting.addCandidate('Alice')
    await voting.addCandidate('Bob')
    await voting.startVoting()

    await voting.connect(voter1).vote(1)
    await voting.connect(voter2).vote(1)
    await voting.connect(voter3).vote(2)

    await voting.endVoting()

    const [ids, names, votes] = await voting.getWinners()
    expect(ids.length).to.equal(1)
    expect(names[0]).to.equal('Alice')
    expect(votes[0]).to.equal(2)
  })

  it('Should handle tie correctly with multiple winners', async function () {
    await voting.addCandidate('Alice')
    await voting.addCandidate('Bob')
    await voting.startVoting()

    await voting.connect(voter1).vote(1) // Alice
    await voting.connect(voter2).vote(2) // Bob

    await voting.endVoting()

    const [ids, names, votes] = await voting.getWinners()

    expect(ids.length).to.equal(2)
    expect(names).to.include('Alice')
    expect(names).to.include('Bob')
    expect(votes[0]).to.equal(1)
    expect(votes[1]).to.equal(1)
  })

  it('Should require endVoting before getWinners()', async function () {
    await voting.addCandidate('Alice')
    await voting.addCandidate('Bob')
    await voting.startVoting()

    await voting.connect(voter1).vote(1)

    await expect(voting.getWinners()).to.be.revertedWith(
      'Winner not declared yet'
    )
  })
})
