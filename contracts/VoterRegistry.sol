// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract VoterRegistry {
    address public admin;
    address public ballotContract;
    
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint256 registrationTime;
        bytes32 ninHash; // Hash of NIN for verification (privacy-preserving)
    }
    
    mapping(address => Voter) public voters;
    mapping(bytes32 => bool) public registeredNINHashes; // Prevent duplicate NIN registrations
    
    event VoterRegistered(address indexed voter, address indexed admin);
    event VoterSelfRegistered(address indexed voter, bytes32 indexed ninHash);
    event VoterUnregistered(address indexed voter, address indexed admin);
    event VoterMarkedAsVoted(address indexed voter);
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }
    
    modifier onlyBallotContract() {
        require(msg.sender == ballotContract, "Only ballot contract can call this function");
        _;
    }
    
    constructor(address _admin) {
        admin = _admin;
    }
    
    /**
     * @dev Set the ballot contract address (only admin)
     * @param _ballotContract Address of the ballot contract
     */
    function setBallotContract(address _ballotContract) external onlyAdmin {
        ballotContract = _ballotContract;
    }
    
    /**
     * @dev Register a new voter (DEPRECATED - removed for fairness)
     * Admin registration has been removed. All voters must self-register using NIN.
     * This function is kept for backward compatibility but will always revert.
     * @param _voter Address of the voter to register
     */
    function registerVoter(address _voter) external onlyAdmin {
        revert("Admin registration disabled. All voters must self-register using NIN verification.");
    }
    
    /**
     * @dev Self-register a voter with verified NIN hash
     * @param _ninHash Keccak256 hash of the NIN (privacy-preserving)
     */
    function selfRegister(bytes32 _ninHash) external {
        require(msg.sender != address(0), "Invalid voter address");
        require(!voters[msg.sender].isRegistered, "Voter already registered");
        require(_ninHash != bytes32(0), "Invalid NIN hash");
        require(!registeredNINHashes[_ninHash], "NIN already registered by another voter");
        
        voters[msg.sender] = Voter({
            isRegistered: true,
            hasVoted: false,
            registrationTime: block.timestamp,
            ninHash: _ninHash
        });
        
        registeredNINHashes[_ninHash] = true;
        
        emit VoterSelfRegistered(msg.sender, _ninHash);
    }
    
    /**
     * @dev Unregister a voter (only admin)
     * @param _voter Address of the voter to unregister
     */
    function unregisterVoter(address _voter) external onlyAdmin {
        require(voters[_voter].isRegistered, "Voter not registered");
        
        delete voters[_voter];
        
        emit VoterUnregistered(_voter, msg.sender);
    }
    
    /**
     * @dev Check if an address is registered
     * @param _voter Address to check
     * @return bool True if registered
     */
    function isRegistered(address _voter) external view returns (bool) {
        return voters[_voter].isRegistered;
    }
    
    /**
     * @dev Mark a voter as having voted (callable by ballot contract)
     * @param _voter Address of the voter
     */
    function markVoted(address _voter) external onlyBallotContract {
        require(voters[_voter].isRegistered, "Voter not registered");
        require(!voters[_voter].hasVoted, "Voter already marked as voted");
        
        voters[_voter].hasVoted = true;
        
        emit VoterMarkedAsVoted(_voter);
    }
    
    /**
     * @dev Check if a voter has already voted
     * @param _voter Address to check
     * @return bool True if has voted
     */
    function hasVoted(address _voter) external view returns (bool) {
        return voters[_voter].hasVoted;
    }
    
    /**
     * @dev Get full voter information
     * @param _voter Address to check
     * @return _isRegistered Whether the voter is registered
     * @return _hasVoted Whether the voter has voted
     * @return _registrationTime When the voter was registered
     */
    function getVoterInfo(address _voter) external view returns (
        bool _isRegistered,
        bool _hasVoted,
        uint256 _registrationTime
    ) {
        Voter memory voter = voters[_voter];
        return (voter.isRegistered, voter.hasVoted, voter.registrationTime);
    }
    
    /**
     * @dev Transfer admin role to a new address
     * @param _newAdmin Address of the new admin
     */
    function transferAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "Invalid admin address");
        admin = _newAdmin;
    }
}