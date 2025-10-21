// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./shuffle/RevealVerifier.sol";
import "./libraries/EdOnBN254.sol";

/**
 * @title ZgRevealVerifier
 * @notice Wrapper contract to match your existing Zypher interface
 * @dev Uses composition instead of inheritance to avoid function overload issues
 */
contract ZgRevealVerifier {
    RevealVerifier private immutable revealVerifier;
    
    // Point struct matching your existing interface (from Verifiers.sol)
    struct Point {
        uint256 x;
        uint256 y;
    }
    
    // Re-export MaskedCard from RevealVerifier for interface compatibility
    // MaskedCard is already defined in RevealVerifier.sol
    
    constructor() {
        revealVerifier = new RevealVerifier();
    }
    
    /**
     * @notice Aggregate multiple public keys into one joint key
     * @param publicKeys Array of player public keys
     * @return gameKey The aggregated game key
     */
    function aggregateKeys(Point[] memory publicKeys) external view returns (Point memory gameKey) {
        EdOnBN254.Point[] memory edKeys = new EdOnBN254.Point[](publicKeys.length);
        for (uint256 i = 0; i < publicKeys.length; i++) {
            edKeys[i] = EdOnBN254.Point(publicKeys[i].x, publicKeys[i].y);
        }
        
        // Call RevealVerifier's aggregateKeys
        EdOnBN254.Point memory result = revealVerifier.aggregateKeys(edKeys);
        return Point(result.x, result.y);
    }
    
    /**
     * @notice Unmask a card using reveal tokens from all players
     * @param card The masked card to unmask
     * @param revealToken Array of reveal tokens from all players
     * @return cardIndex The unmasked card index (0-51)
     */
    function unmaskCard(
        MaskedCard memory card,
        Point[] memory revealToken
    ) external view returns (uint8 cardIndex) {
        EdOnBN254.Point[] memory tokens = new EdOnBN254.Point[](revealToken.length);
        for (uint256 i = 0; i < revealToken.length; i++) {
            tokens[i] = EdOnBN254.Point(revealToken[i].x, revealToken[i].y);
        }
        
        // Call RevealVerifier's unmask function
        EdOnBN254.Point memory unmasked = revealVerifier.unmask(card, tokens);
        
        // Convert unmasked elliptic curve point to card index (0-51)
        cardIndex = uint8(unmasked.x % 52);
    }
    
    /**
     * @notice Verify a reveal proof (passthrough to RevealVerifier)
     */
    function verifyReveal(
        EdOnBN254.Point memory pk,
        MaskedCard memory masked,
        EdOnBN254.Point memory reveal,
        bytes calldata proofBytes
    ) external view returns (bool) {
        return revealVerifier.verifyReveal(pk, masked, reveal, proofBytes);
    }
    
    /**
     * @notice Verify a reveal with SNARK proof (passthrough to RevealVerifier)
     */
    function verifyRevealWithSnark(
        uint256[6] calldata pi,
        uint256[8] calldata zkproof
    ) external view returns (bool) {
        return revealVerifier.verifyRevealWithSnark(pi, zkproof);
    }
}
