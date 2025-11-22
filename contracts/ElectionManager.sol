// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Ballot.sol";
import "./VoterRegistry.sol";

contract ElectionManager {
    address public admin;
    VoterRegistry public registry;

    struct Election {
        uint256 id;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        address ballotAddress;
        bool isActive;
    }

    uint256 public electionCount;
    mapping(uint256 => Election) public elections;

    event ElectionCreated(
        uint256 indexed electionId,
        string title,
        string description,
        uint256 startTime,
        uint256 endTime,
        address ballotAddress
    );

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this");
        _;
    }

    constructor() {
        admin = msg.sender;
        registry = new VoterRegistry(admin);
    }

    /// Creates a new election with metadata and deploys a new Ballot contract
    function createElection(
        string memory _title,
        string memory _description,
        uint256 _startTime,
        uint256 _endTime
    ) external onlyAdmin returns (address) {
        require(_startTime < _endTime, "Invalid election period");
        require(
            _startTime >= block.timestamp,
            "Start time must be in the future"
        );

        Ballot newBallot = new Ballot(address(registry), admin);
        electionCount++;

        elections[electionCount] = Election({
            id: electionCount,
            title: _title,
            description: _description,
            startTime: _startTime,
            endTime: _endTime,
            ballotAddress: address(newBallot),
            isActive: true
        });

        emit ElectionCreated(
            electionCount,
            _title,
            _description,
            _startTime,
            _endTime,
            address(newBallot)
        );

        return address(newBallot);
    }

    ///  Ends an election manually
    function endElection(uint256 _electionId) external onlyAdmin {
        Election storage election = elections[_electionId];
        require(election.isActive, "Election already ended");
        election.isActive = false;
    }

    /// Returns all election metadata
    function getElectionDetails(uint256 _electionId)
        external
        view
        returns (
            string memory,
            string memory,
            uint256,
            uint256,
            address,
            bool
        )
    {
        Election memory e = elections[_electionId];
        return (
            e.title,
            e.description,
            e.startTime,
            e.endTime,
            e.ballotAddress,
            e.isActive
        );
    }

    /// Returns all election addresses (for frontend)
    function getAllElections() external view returns (Election[] memory) {
        Election[] memory all = new Election[](electionCount);
        for (uint256 i = 1; i <= electionCount; i++) {
            all[i - 1] = elections[i];
        }
        return all;
    }
}
