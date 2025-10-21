// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test, console2 as console, Vm} from "forge-std/Test.sol";

import {GameFactory} from "src/GameFactory.sol";
import {Player} from "src/interfaces/IGame.sol";
import {Point} from "src/secret-engine/Verifiers.sol";

contract GameFactoryTest is Test {
    Vm.Wallet public alice;
    Vm.Wallet public bob;

    GameFactory public factory;

    // RevealVerifier deployed on Lisk Sepolia
    address revealVerifier = address(0x49cFFa95ffB77d398222393E3f0C4bFb5D996321);

    function setUp() public virtual {
        alice = vm.createWallet("alice");
        bob = vm.createWallet("bob");

        factory = new GameFactory();
    }

    function test_GameFactory() public {
        Player memory alicePlayer = Player({addr: alice.addr, publicKey: Point({x: 0, y: 0})});

        bytes32 salt = bytes32(0);

        address game = factory.createGame(salt, revealVerifier, alicePlayer);
        console.log("Game Address: ", game);
    }
}
