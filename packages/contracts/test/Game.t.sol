// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test, console2 as console, Vm} from "forge-std/Test.sol";

import {Game} from "src/Game.sol";
import {IGame, Player, GameRound} from "src/interfaces/IGame.sol";

import {Point} from "src/secret-engine/Verifiers.sol";

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract GameTest is Test {
    using Strings for uint8;

    Game public game;

    Vm.Wallet public alice;
    Vm.Wallet public bob;

    // Test on Lisk Sepolia
    uint256 liskSepoliaFork;

    function setUp() public virtual {
        alice = vm.createWallet("alice");
        bob = vm.createWallet("bob");
        string memory RPC = vm.envString("LISK_RPC_URL");
        liskSepoliaFork = vm.createFork(RPC);

        vm.selectFork(liskSepoliaFork);

        // Use RevealVerifier deployed on Lisk Sepolia
        address revealVerifier = address(0x49cFFa95ffB77d398222393E3f0C4bFb5D996321);

        Player memory alicePlayer = Player({addr: alice.addr, publicKey: Point({x: 0, y: 0})});

        game = new Game(revealVerifier, alicePlayer);
        console.log("Game Contract Deployed: ", address(game));
    }

    function currentRound() internal view returns (string memory) {
        GameRound round = game._currentRound();
        if (round == GameRound.Ante) {
            return "Ante";
        } else if (round == GameRound.PreFlop) {
            return "Pre-Flop";
        } else if (round == GameRound.Flop) {
            return "Flop";
        } else if (round == GameRound.Turn) {
            return "Turn";
        } else if (round == GameRound.River) {
            return "River";
        } else {
            return "";
        }
    }

    function currentMove() internal view returns (string memory) {
        Player memory next = game.nextPlayer();
        if (next.addr == bob.addr) {
            return "Bob";
        } else if (next.addr == alice.addr) {
            return "Alice";
        } else {
            return "None";
        }
    }

    function getCards(address user) internal view {
        uint8[5] memory cards = game.getPlayerCards(user);
        string memory log = string(
            abi.encodePacked(
                user == alice.addr ? "Alice" : "Bob",
                " Cards: ",
                cards[0].toString(),
                " ",
                cards[1].toString(),
                " ",
                cards[2].toString(),
                " ",
                cards[3].toString(),
                " ",
                cards[4].toString()
            )
        );
        console.log(log);
    }

    function getCommunityCards() internal view {
        uint8[5] memory cards = game.getCommunityCards();
        string memory log = string(
            abi.encodePacked(
                "Community Cards: ",
                cards[0].toString(),
                " ",
                cards[1].toString(),
                " ",
                cards[2].toString(),
                " ",
                cards[3].toString(),
                " ",
                cards[4].toString()
            )
        );
        console.log(log);
    }

    function printStats() internal view {
        uint256 totalPlayers = game._totalPlayers();
        console.log("========================================================");
        console.log("|                    Statistics                         |");
        console.log("========================================================");
        console.log("Total Players: ", totalPlayers);
        console.log("Current Round: ", currentRound());
        console.log("Current Move: ", currentMove());
        console.log("Pot Amount: ", game.getPotAmount());

        // Only try to get cards for players who have joined
        if (game.getPlayer(alice.addr).addr != address(0)) {
            getCards(alice.addr);
        }
        if (totalPlayers >= 2 && game.getPlayer(bob.addr).addr != address(0)) {
            getCards(bob.addr);
        }

        getCommunityCards();

        console.log("");
        console.log("");
        console.log("");
    }

    function test_UserFlow() public {
        vm.selectFork(liskSepoliaFork);
        printStats();

        // Fund alice and bob with ETH
        vm.deal(alice.addr, 1000 ether);
        vm.deal(bob.addr, 1000 ether);

        // Add Bob as player
        vm.startBroadcast(bob.addr);
        Player memory bobPlayer = Player({addr: bob.addr, publicKey: Point({x: 0, y: 0})});
        game.joinGame(bobPlayer);
        console.log("Bob joined the game");
        vm.stopBroadcast();

        // Start the game
        vm.startBroadcast(alice.addr);
        game.startGame();
        console.log("Game started");
        vm.stopBroadcast();

        // Simulate shuffles (bypass shuffle stage for testing)
        // In real game, players would shuffle the deck
        // For this test, we'll mock the shuffle completion
        uint256[4][52] memory mockDeck;
        for (uint8 i = 0; i < 52; i++) {
            mockDeck[i] = [uint256(i), uint256(i), uint256(i), uint256(i)];
        }

        uint256[] memory mockPkc = new uint256[](52);
        for (uint8 i = 0; i < 52; i++) {
            mockPkc[i] = uint256(i);
        }

        vm.startBroadcast(alice.addr);
        game.initShuffle(mockPkc, mockDeck);
        console.log("Alice shuffled");
        vm.stopBroadcast();

        vm.startBroadcast(bob.addr);
        game.shuffle(mockDeck);
        console.log("Bob shuffled");
        vm.stopBroadcast();

        // Alice Places Bet
        vm.startBroadcast(alice.addr);
        game.placeBet{value: 10}(10);
        console.log("Alice placed bet of 10");
        vm.stopBroadcast();

        // Bob Places Bet
        vm.startBroadcast(bob.addr);
        vm.expectRevert(IGame.InvalidBetAmount.selector);
        game.placeBet{value: 9}(9);
        console.log("Bob cannot place bet less than highest bid");
        vm.stopBroadcast();

        // Bob Places Bet
        vm.startBroadcast(bob.addr);
        game.placeBet{value: 10}(10);
        console.log("Bob placed bet of 10");
        vm.stopBroadcast();

        printStats();

        // Bob Places Bet in wrong sequence
        vm.startBroadcast(bob.addr);
        vm.expectRevert(IGame.InvalidBetSequence.selector);
        game.placeBet{value: 15}(15);
        console.log("Bob cannot place bet as not his turn");
        vm.stopBroadcast();

        // Alice Places Bet
        vm.startBroadcast(alice.addr);
        game.placeBet{value: 15}(15);
        console.log("Alice placed bet of 15");
        vm.stopBroadcast();

        // Bob Places Bet
        vm.startBroadcast(bob.addr);
        game.placeBet{value: 25}(25);
        console.log("Bob placed bet of 25");
        vm.stopBroadcast();

        printStats();

        // Alice Places Bet
        vm.startBroadcast(alice.addr);
        game.placeBet{value: 30}(30);
        console.log("Alice placed bet of 30");
        vm.stopBroadcast();

        // Bob Places Bet
        vm.startBroadcast(bob.addr);
        game.placeBet{value: 35}(35);
        console.log("Bob placed bet of 35");
        vm.stopBroadcast();

        printStats();

        // Alice Places Bet
        vm.startBroadcast(alice.addr);
        game.placeBet{value: 40}(40);
        console.log("Alice placed bet of 40");
        vm.stopBroadcast();

        // Bob Places Bet
        vm.startBroadcast(bob.addr);
        game.placeBet{value: 45}(45);
        console.log("Bob placed bet of 45");
        vm.stopBroadcast();

        printStats();

        // Alice Places Bet
        vm.startBroadcast(alice.addr);
        game.placeBet{value: 50}(50);
        console.log("Alice placed bet of 50");
        vm.stopBroadcast();

        // Bob Places Bet
        vm.startBroadcast(bob.addr);
        game.placeBet{value: 55}(55);
        console.log("Bob placed bet of 55");
        vm.stopBroadcast();

        printStats();

        // Alice Places Bet
        vm.startBroadcast(alice.addr);
        vm.expectRevert(IGame.GameEnded.selector);
        game.placeBet{value: 60}(60);
        console.log("Alice cannot place bet as game has ended.");
        vm.stopBroadcast();

        vm.startBroadcast(alice.addr);
        game.chooseCards([6, 7, 9]);
        console.log("Alice chose cards 6 7 9.");
        vm.stopBroadcast();

        vm.startBroadcast(bob.addr);
        game.chooseCards([5, 7, 8]);
        console.log("Bob chose cards 5 7 8.");
        vm.stopBroadcast();

        printStats();
    }
}
