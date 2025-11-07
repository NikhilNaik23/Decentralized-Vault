// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title IdentityVaultContract
 * @dev Smart contract for storing and verifying decentralized identity credentials
 * @notice This contract stores credential hashes and DIDs for verification purposes
 */
contract IdentityVaultContract {
    
    // Structure to store credential information
    struct Credential {
        string credentialHash;
        string did;
        uint256 timestamp;
        address issuer;
        bool exists;
    }
    
    // Mapping from credential hash to Credential struct
    mapping(string => Credential) private credentials;
    
    // Mapping from DID to array of credential hashes
    mapping(string => string[]) private didToCredentials;
    
    // Array to store all credential hashes
    string[] private allCredentialHashes;
    
    // Events
    event CredentialStored(
        string indexed credentialHash,
        string indexed did,
        address indexed issuer,
        uint256 timestamp
    );
    
    event CredentialVerified(
        string indexed credentialHash,
        bool exists
    );
    
    /**
     * @dev Store a credential hash on the blockchain
     * @param credentialHash The hash of the credential to store
     * @param did The Decentralized Identifier associated with the credential
     */
    function storeCredential(string memory credentialHash, string memory did) public {
        require(bytes(credentialHash).length > 0, "Credential hash cannot be empty");
        require(bytes(did).length > 0, "DID cannot be empty");
        require(!credentials[credentialHash].exists, "Credential already exists");
        
        // Create and store credential
        credentials[credentialHash] = Credential({
            credentialHash: credentialHash,
            did: did,
            timestamp: block.timestamp,
            issuer: msg.sender,
            exists: true
        });
        
        // Add to DID mapping
        didToCredentials[did].push(credentialHash);
        
        // Add to all credentials array
        allCredentialHashes.push(credentialHash);
        
        // Emit event
        emit CredentialStored(credentialHash, did, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Verify if a credential exists on the blockchain
     * @param credentialHash The hash of the credential to verify
     * @return bool True if the credential exists, false otherwise
     */
    function verifyCredential(string memory credentialHash) public view returns (bool) {
        return credentials[credentialHash].exists;
    }
    
    /**
     * @dev Get all credentials for a specific DID
     * @param did The Decentralized Identifier
     * @return string[] Array of credential hashes associated with the DID
     */
    function getCredentialsByDID(string memory did) public view returns (string[] memory) {
        return didToCredentials[did];
    }
    
    /**
     * @dev Get credential details
     * @param credentialHash The hash of the credential
     * @return credentialHash The credential hash
     * @return did The associated DID
     * @return timestamp The timestamp when the credential was stored
     * @return issuer The address that stored the credential
     */
    function getCredentialDetails(string memory credentialHash) public view returns (
        string memory,
        string memory,
        uint256,
        address
    ) {
        require(credentials[credentialHash].exists, "Credential does not exist");
        
        Credential memory cred = credentials[credentialHash];
        return (
            cred.credentialHash,
            cred.did,
            cred.timestamp,
            cred.issuer
        );
    }
    
    /**
     * @dev Get total number of credentials stored
     * @return uint256 Total count of credentials
     */
    function getTotalCredentials() public view returns (uint256) {
        return allCredentialHashes.length;
    }
    
    /**
     * @dev Get all credential hashes (paginated for gas efficiency)
     * @param offset Starting index
     * @param limit Maximum number of results to return
     * @return string[] Array of credential hashes
     */
    function getAllCredentials(uint256 offset, uint256 limit) public view returns (string[] memory) {
        require(offset < allCredentialHashes.length, "Offset out of bounds");
        
        uint256 end = offset + limit;
        if (end > allCredentialHashes.length) {
            end = allCredentialHashes.length;
        }
        
        uint256 resultLength = end - offset;
        string[] memory result = new string[](resultLength);
        
        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = allCredentialHashes[offset + i];
        }
        
        return result;
    }
}
