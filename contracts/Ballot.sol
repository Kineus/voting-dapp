// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./VoterRegistry.sol";

contract Ballot {
    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    address public admin;
    bool public votingActive;
    uint public candidatesCount;

    mapping(uint => Candidate) public candidates;
    mapping(address => bool) public hasVoted;

    VoterRegistry public registry;

    uint public startTime;
    uint public endTime;
    uint[] public winningCandidateIds;
    bool public winnerDeclared;

    event CandidateAdded(uint id, string name);
    event VoteCast(address voter, uint candidateId);
    event WinnerDeclared(uint[] winners, uint maxVotes);

    constructor(address _registry, address _admin) {
        admin = _admin;
        registry = VoterRegistry(_registry);
        votingActive = false;
        winnerDeclared = false;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this");
        _;
    }

    modifier onlyDuringVoting() {
        require(votingActive, "Voting not active");
        require(block.timestamp >= startTime, "Voting has not started yet");
        require(block.timestamp <= endTime, "Voting period has ended");
        _;
    }

    // --- Candidate Management ---
    /**
     * @dev Add a candidate (only when no election is active)
     * Candidates can only be added before starting a new election
     * Cannot add to a concluded election - must reset first
     */
    function addCandidate(string memory _name) external onlyAdmin {
        require(!votingActive, "Cannot add candidates while voting is active");
        require(bytes(_name).length > 0, "Candidate name cannot be empty");
        
        // If there was a previous election (winner declared), prevent adding new candidates
        // Admin must reset candidates first to prepare for a new election
        if (winnerDeclared && candidatesCount > 0) {
            revert("Cannot add candidates to a concluded election. Use resetCandidatesForNewElection() first to prepare for a new election.");
        }
        
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
        emit CandidateAdded(candidatesCount, _name);
    }
    
    /**
     * @dev Reset candidates for a new election (only admin, when no election is active)
     * This clears all candidates and vote counts to prepare for a new election
     */
    function resetCandidatesForNewElection() external onlyAdmin {
        require(!votingActive, "Cannot reset candidates while voting is active");
        
        // Clear all candidates
        for (uint i = 1; i <= candidatesCount; i++) {
            delete candidates[i];
        }
        
        candidatesCount = 0;
        winnerDeclared = false;
        delete winningCandidateIds;
        
        // Clear hasVoted mapping (optional - you may want to keep this for history)
        // Note: This doesn't clear the VoterRegistry hasVoted status
    }

    // --- Voting Lifecycle ---
    function startVoting(uint _startTime, uint _endTime) external onlyAdmin {
        require(!votingActive, "Voting already active");
        require(_startTime < _endTime, "Invalid time range");
        require(candidatesCount > 0, "Cannot start voting without candidates. Add candidates first.");
        require(candidatesCount <= 50, "Too many candidates. Maximum 50 candidates allowed.");
        
        startTime = _startTime;
        endTime = _endTime;
        votingActive = true;
        winnerDeclared = false;
        delete winningCandidateIds;
        
        // Reset vote counts for all candidates (in case this is a restart)
        for (uint i = 1; i <= candidatesCount; i++) {
            candidates[i].voteCount = 0;
        }
    }

    function endVoting() external onlyAdmin {
        require(votingActive, "Voting not active");
        require(block.timestamp > endTime, "Voting period not ended yet");
        votingActive = false;
        declareWinner();
    }

    /**
     * @dev Automatically end voting when end time is reached (callable by anyone)
     * This ensures elections end on time even if admin is unavailable
     */
    function autoEndElection() external {
        require(votingActive, "Voting not active");
        require(block.timestamp > endTime, "Voting period has not ended yet");
        votingActive = false;
        declareWinner();
    }

    function declareWinner() internal {
        uint maxVotes = 0;
        uint[] memory tempWinners = new uint[](candidatesCount);
        uint winnerCount = 0;

        for (uint i = 1; i <= candidatesCount; i++) {
            if (candidates[i].voteCount > maxVotes) {
                maxVotes = candidates[i].voteCount;
                winnerCount = 0;
                tempWinners[winnerCount] = i;
                winnerCount++;
            } else if (candidates[i].voteCount == maxVotes) {
                tempWinners[winnerCount] = i;
                winnerCount++;
            }
        }

        delete winningCandidateIds;
        for (uint j = 0; j < winnerCount; j++) {
            winningCandidateIds.push(tempWinners[j]);
        }

        winnerDeclared = true;
        emit WinnerDeclared(winningCandidateIds, maxVotes);
    }

    // --- Voting ---
    function vote(uint _candidateId) external onlyDuringVoting {
        require(registry.isRegistered(msg.sender), "Not registered");
        require(!registry.hasVoted(msg.sender), "Already voted");
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate");

        // Mark voter as voted in the registry
        registry.markVoted(msg.sender);
        // Also maintain local mapping for backward compatibility
        hasVoted[msg.sender] = true;
        
        candidates[_candidateId].voteCount++;
        emit VoteCast(msg.sender, _candidateId);
    }

    // --- Getters ---
    function getCandidate(uint _candidateId)
        external
        view
        returns (uint, string memory, uint)
    {
        Candidate memory c = candidates[_candidateId];
        return (c.id, c.name, c.voteCount);
    }

    function getAllCandidates()
        external
        view
        returns (uint[] memory, string[] memory, uint[] memory)
    {
        uint[] memory ids = new uint[](candidatesCount);
        string[] memory names = new string[](candidatesCount);
        uint[] memory voteCounts = new uint[](candidatesCount);

        for (uint i = 0; i < candidatesCount; i++) {
            Candidate memory c = candidates[i + 1];
            ids[i] = c.id;
            names[i] = c.name;
            voteCounts[i] = c.voteCount;
        }

        return (ids, names, voteCounts);
    }

    function getWinners()
        external
        view
        returns (uint[] memory, string[] memory, uint[] memory)
    {
        require(winnerDeclared, "Winner not declared yet");

        uint len = winningCandidateIds.length;
        string[] memory names = new string[](len);
        uint[] memory voteCounts = new uint[](len);

        for (uint i = 0; i < len; i++) {
            Candidate memory c = candidates[winningCandidateIds[i]];
            names[i] = c.name;
            voteCounts[i] = c.voteCount;
        }

        return (winningCandidateIds, names, voteCounts);
    }
}
