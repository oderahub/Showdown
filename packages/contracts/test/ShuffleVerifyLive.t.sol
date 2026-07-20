// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2 as console} from "forge-std/Test.sol";

import {ZgShuffleVerifier} from "src/zypher-verifiers/ZgShuffleVerifier.sol";
import {VerifierKeyExtra1_52} from "src/zypher-verifiers/shuffle/VerifierKeyExtra1_52.sol";
import {VerifierKeyExtra2_52} from "src/zypher-verifiers/shuffle/VerifierKeyExtra2_52.sol";

/// @notice End-to-end check: a proof produced by this app's own shuffle pipeline
///         is accepted by the on-chain verifier.
///
/// ShuffleVerify52.t.sol proves the verifier accepts upstream's canonical test
/// vector. This proves it accepts a proof Showdown actually generated, captured
/// from a live run of /api/get-masked-cards followed by /api/first-shuffle.
///
/// Together they close the loop: the shuffle the game produces today is one the
/// contract could verify on-chain, once Game.sol calls verifyShuffle.
contract ShuffleVerifyLiveTest is Test {
    uint256 constant DECK_LEN = 208; // 52 cards x 4 field elements
    uint256 constant PKC_LEN = 24;

    ZgShuffleVerifier verifier;

    bytes proof;
    uint256[] publicInput; // pre-shuffle deck ++ post-shuffle deck
    uint256[] pkc;

    function setUp() public {
        VerifierKeyExtra1_52 vk1 = new VerifierKeyExtra1_52();
        VerifierKeyExtra2_52 vk2 = new VerifierKeyExtra2_52();
        verifier = new ZgShuffleVerifier(address(vk1), address(vk2));

        string memory json = vm.readFile("test/fixtures/shuffle_52_live.json");

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

    function test_verifiesProofGeneratedByThisApp() public view {
        bool ok = verifier.verifyShuffle(proof, publicInput, pkc);
        assertTrue(ok, "app-generated shuffle proof was rejected on-chain");
    }
}
