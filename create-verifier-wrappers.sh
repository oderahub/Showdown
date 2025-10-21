#!/bin/bash

set -e

echo "Creating wrapper contracts..."

# Create ZgRevealVerifier wrapper
cat > packages/contracts/src/zypher-verifiers/ZgRevealVerifier.sol << 'EOF'
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./shuffle/RevealVerifier.sol";
import "./libraries/EdOnBN254.sol";

// Wrapper contract to match your existing interface
contract ZgRevealVerifier is RevealVerifier {
    
    // Convert Point struct to match your interface
    struct Point {
        uint256 x;
        uint256 y;
    }
    
    // Aggregate keys using EdOnBN254
    function aggregateKeys(Point[] memory publicKeys) external view returns (Point memory gameKey) {
        EdOnBN254.Point[] memory edKeys = new EdOnBN254.Point[](publicKeys.length);
        for (uint256 i = 0; i < publicKeys.length; i++) {
            edKeys[i] = EdOnBN254.Point(publicKeys[i].x, publicKeys[i].y);
        }
        
        EdOnBN254.Point memory result = aggregateKeys(edKeys);
        return Point(result.x, result.y);
    }
    
    // Unmask card to get card index
    function unmaskCard(
        MaskedCard memory card,
        Point[] memory revealToken
    ) external view returns (uint8 cardIndex) {
        EdOnBN254.Point[] memory tokens = new EdOnBN254.Point[](revealToken.length);
        for (uint256 i = 0; i < revealToken.length; i++) {
            tokens[i] = EdOnBN254.Point(revealToken[i].x, revealToken[i].y);
        }
        
        EdOnBN254.Point memory unmasked = unmask(card, tokens);
        
        // Convert unmasked point to card index (0-51)
        // This uses the standard mapping from point to card
        cardIndex = uint8(unmasked.x % 52);
    }
}
EOF

echo "✓ ZgRevealVerifier.sol"

# Create ZgShuffleVerifier wrapper for 52-card deck
cat > packages/contracts/src/zypher-verifiers/ZgShuffleVerifier.sol << 'EOF'
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./shuffle/ShuffleVerifier.sol";
import "./shuffle/VerifierKey_52.sol";
import "./shuffle/VerifierKeyExtra1_52.sol";
import "./shuffle/VerifierKeyExtra2_52.sol";

// Wrapper for 52-card shuffle verifier
contract ZgShuffleVerifier is ShuffleVerifier {
    
    constructor() ShuffleVerifier(
        address(new VerifierKeyExtra1_52()),
        address(new VerifierKeyExtra2_52())
    ) {
        // Initialize the verifier key for 52-card deck
        _verifyKey = VerifierKey_52.load;
    }
}
EOF

echo "✓ ZgShuffleVerifier.sol"

echo -e "\n✅ Wrapper contracts created!"
echo -e "\nLocation: packages/contracts/src/zypher-verifiers/"