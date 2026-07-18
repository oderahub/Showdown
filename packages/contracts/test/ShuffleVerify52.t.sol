// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2 as console} from "forge-std/Test.sol";

import {ZgShuffleVerifier} from "src/zypher-verifiers/ZgShuffleVerifier.sol";
import {VerifierKeyExtra1_52} from "src/zypher-verifiers/shuffle/VerifierKeyExtra1_52.sol";
import {VerifierKeyExtra2_52} from "src/zypher-verifiers/shuffle/VerifierKeyExtra2_52.sol";

/// @notice Proves that on-chain shuffle verification is deployable and correct.
///
/// Two claims are under test:
///
///   1. `ZgShuffleVerifier` fits inside the EIP-170 24,576-byte limit, so it can be
///      deployed to Avalanche C-Chain (or any EVM chain). As shipped by upstream it
///      does not -- see the LOCAL MODIFICATION note in PlonkVerifier.sol.
///
///   2. The size-reduced verifier still accepts a real 52-card shuffle proof. The
///      vector in test/fixtures/shuffle_52.json is lifted verbatim from upstream's
///      own test suite (zypher-game/uzkge, contracts/solidity/test/plonk_52.js), so
///      this is Zypher's proof, not one we generated to match our implementation.
///
/// Public input layout follows upstream's ShuffleService.verify: the pre-shuffle deck
/// concatenated with the post-shuffle deck, 208 field elements each.
contract ShuffleVerify52Test is Test {
    uint256 constant DECK_LEN = 208; // 52 cards x 4 field elements
    uint256 constant PKC_LEN = 24;
    uint256 constant EIP170_LIMIT = 24576;

    ZgShuffleVerifier verifier;

    bytes proof;
    uint256[] publicInput; // deck1 ++ deck2
    uint256[] pkc;

    function setUp() public {
        VerifierKeyExtra1_52 vk1 = new VerifierKeyExtra1_52();
        VerifierKeyExtra2_52 vk2 = new VerifierKeyExtra2_52();
        verifier = new ZgShuffleVerifier(address(vk1), address(vk2));

        string memory json = vm.readFile("test/fixtures/shuffle_52.json");

        proof = vm.parseJsonBytes(json, ".proof");

        uint256[] memory deck1 = vm.parseJsonUintArray(json, ".deck1");
        uint256[] memory deck2 = vm.parseJsonUintArray(json, ".deck2");
        uint256[] memory pkcRaw = vm.parseJsonUintArray(json, ".pkc");

        assertEq(deck1.length, DECK_LEN, "deck1 length");
        assertEq(deck2.length, DECK_LEN, "deck2 length");
        assertEq(pkcRaw.length, PKC_LEN, "pkc length");

        for (uint256 i = 0; i < DECK_LEN; i++) {
            publicInput.push(deck1[i]);
        }
        for (uint256 i = 0; i < DECK_LEN; i++) {
            publicInput.push(deck2[i]);
        }
        for (uint256 i = 0; i < PKC_LEN; i++) {
            pkc.push(pkcRaw[i]);
        }
    }

    /// Claim 1: the verifier is deployable under EIP-170.
    function test_verifierFitsUnderEip170() public view {
        uint256 size = address(verifier).code.length;
        console.log("ZgShuffleVerifier runtime size (bytes):", size);
        console.log("EIP-170 limit (bytes):               ", EIP170_LIMIT);
        assertLt(size, EIP170_LIMIT, "ZgShuffleVerifier exceeds EIP-170; not deployable on any EVM chain");
    }

    /// Claim 2: it accepts upstream's real 52-card shuffle proof.
    function test_verifiesUpstream52CardProof() public view {
        bool ok = verifier.verifyShuffle(proof, publicInput, pkc);
        assertTrue(ok, "valid 52-card shuffle proof was rejected");
    }

    /// A tampered proof must be rejected -- guards against the verifier degenerating
    /// into something that returns true unconditionally.
    function test_rejectsTamperedProof() public view {
        bytes memory bad = proof;
        bad[0] = bytes1(uint8(bad[0]) ^ 0xff);

        bool ok;
        try verifier.verifyShuffle(bad, publicInput, pkc) returns (bool r) {
            ok = r;
        } catch {
            ok = false; // reverting is an acceptable rejection
        }
        assertFalse(ok, "tampered proof was accepted");
    }

    /// Report the gas cost of on-chain verification -- the number that decides whether
    /// this is affordable per hand.
    function test_reportVerificationGas() public view {
        uint256 before = gasleft();
        verifier.verifyShuffle(proof, publicInput, pkc);
        uint256 used = before - gasleft();
        console.log("Shuffle 52 on-chain verification gas:", used);
    }
}
