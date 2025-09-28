// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Voting {
    // Admin (contract deployer)
    address public admin;

    // Candidate struct
    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    // Mappings
    mapping(uint => Candidate) public candidates;
    mapping(address => bool) public hasVoted;

    // Candidate counter
    uint public candidatesCount;

    // Voting active flag
    bool public votingActive;

    // Winner info
    uint[] public winningCandidateIds;
    bool public winnerDeclared;

    // Events
    event CandidateAdded(uint id, string name);
    event VoteCast(address voter, uint candidateId);
    event WinnerDeclared(uint[] candidateIds, uint maxVotes);

    constructor() {
        admin = msg.sender;
        votingActive = false;
        winnerDeclared = false;
    }

    // Modifier: only admin
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this");
        _;
    }

    // Add candidate (admin only)
    function addCandidate(string memory _name) public onlyAdmin {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
        emit CandidateAdded(candidatesCount, _name);
    }

    // Start voting (admin only)
    function startVoting() public onlyAdmin {
        require(candidatesCount > 0, "No candidates added");
        votingActive = true;
        winnerDeclared = false;
        delete winningCandidateIds;
    }

    // End voting and declare winner(s)
    function endVoting() public onlyAdmin {
        require(votingActive, "Voting is not active");
        votingActive = false;

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

        // Save final winners
        delete winningCandidateIds;
        for (uint j = 0; j < winnerCount; j++) {
            winningCandidateIds.push(tempWinners[j]);
        }

        winnerDeclared = true;

        emit WinnerDeclared(winningCandidateIds, maxVotes);
    }

    // Cast vote
    function vote(uint _candidateId) public {
        require(votingActive, "Voting is not active");
        require(!hasVoted[msg.sender], "You have already voted");
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate");

        hasVoted[msg.sender] = true;
        candidates[_candidateId].voteCount++;

        emit VoteCast(msg.sender, _candidateId);
    }

    // Get single candidate details
    function getCandidate(uint _candidateId) public view returns (uint, string memory, uint) {
        Candidate memory c = candidates[_candidateId];
        return (c.id, c.name, c.voteCount);
    }

    // Get ALL candidates
    function getAllCandidates() public view returns (uint[] memory, string[] memory, uint[] memory) {
        uint[] memory ids = new uint[](candidatesCount);
        string[] memory names = new string[](candidatesCount);
        uint[] memory voteCounts = new uint[](candidatesCount);

        for (uint i = 0; i < candidatesCount; i++) {
            Candidate memory c = candidates[i + 1]; // IDs start at 1
            ids[i] = c.id;
            names[i] = c.name;
            voteCounts[i] = c.voteCount;
        }

        return (ids, names, voteCounts);
    }

    // Get all winners (supports ties)
    function getWinners() public view returns (uint[] memory, string[] memory, uint[] memory) {
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
