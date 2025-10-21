// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./shuffle/ShuffleVerifier.sol";
import "./shuffle/VerifierKey_52.sol";

/**
 * @title ZgShuffleVerifier
 * @notice Wrapper for 52-card shuffle verifier
 * @dev Uses pre-deployed verifier keys and extreme compiler optimization
 */
contract ZgShuffleVerifier is ShuffleVerifier {
    /**
     * @param vk1 Address of pre-deployed VerifierKeyExtra1_52
     * @param vk2 Address of pre-deployed VerifierKeyExtra2_52
     */
    constructor(address vk1, address vk2) ShuffleVerifier(vk1, vk2) {
        // Initialize the verifier key for 52-card deck
        _verifyKey = VerifierKey_52.load;
    }
}
