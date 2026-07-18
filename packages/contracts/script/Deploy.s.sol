// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";

import {GameFactory} from "src/GameFactory.sol";
import {RevealVerifier} from "src/zypher-verifiers/shuffle/RevealVerifier.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract DeployScript is Script {
    GameFactory public factory;

    // Previously deployed RevealVerifier on Lisk Sepolia (chain 4202). On any other
    // chain a fresh one is deployed, unless REVEAL_VERIFIER is set in the environment.
    address public constant LISK_SEPOLIA_REVEAL_VERIFIER = 0x49cFFa95ffB77d398222393E3f0C4bFb5D996321;
    uint256 public constant LISK_SEPOLIA = 4202;

    address public revealVerifier;

    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);

        console.log("========================================");
        console.log("Starting Deployment - chain id:", block.chainid);
        console.log("Deployer Address:", deployerAddress);
        console.log("Deployer Balance:", deployerAddress.balance);
        console.log("========================================\n");

        // Resolve the RevealVerifier: explicit env override, else the known Lisk
        // Sepolia deployment, else deploy a fresh one for this chain.
        address configured = vm.envOr("REVEAL_VERIFIER", address(0));

        vm.startBroadcast(deployerPrivateKey);

        if (configured != address(0)) {
            revealVerifier = configured;
            console.log("Using RevealVerifier from env:", revealVerifier);
        } else if (block.chainid == LISK_SEPOLIA) {
            revealVerifier = LISK_SEPOLIA_REVEAL_VERIFIER;
            console.log("Using existing Lisk Sepolia RevealVerifier:", revealVerifier);
        } else {
            console.log("Deploying RevealVerifier...");
            revealVerifier = address(new RevealVerifier());
            console.log("RevealVerifier deployed at:", revealVerifier);
        }
        console.log("");

        // Deploy GameFactory
        // Note: Forge will automatically deploy and link required libraries
        // (QuickSort and TexasPoker) when deploying contracts that use them
        console.log("Deploying GameFactory...");
        factory = new GameFactory();
        console.log("GameFactory deployed at:", address(factory));
        console.log("");
        
        // Write GameFactory address to config.json
        string memory addressPath = "../../apps/www/public/config.json";
        vm.writeJson(
            Strings.toHexString(uint160(address(factory))), 
            addressPath, 
            ".GAME_FACTORY_ADDRESS"
        );

        vm.stopBroadcast();
        
        // Display summary
        console.log("========================================");
        console.log("DEPLOYMENT SUMMARY");
        console.log("========================================");
        console.log("GameFactory:        ", address(factory));
        console.log("\nNote: Libraries (QuickSort, TexasPoker) are automatically");
        console.log("deployed and linked by Forge. Check transaction logs for addresses.");
        console.log("");
        console.log("========================================");
        console.log("SECURITY NOTE");
        console.log("========================================");
        console.log("RevealVerifier:     ", revealVerifier);
        console.log("ShuffleVerifier:     NOT DEPLOYED");
        console.log("");
        console.log("- Reveal: verified on-chain (trustless)");
        console.log("- Shuffle: verified client-side (trusted)");
        console.log("");
        console.log("ZgShuffleVerifier now fits under EIP-170 (20,755 bytes),");
        console.log("but Game.sol does not yet call verifyShuffle. Wiring that");
        console.log("up is roadmap milestone 1. See README 'Security Model'.");
        console.log("========================================");
        console.log("NEXT STEPS");
        console.log("========================================");
        console.log("1. Record the addresses above in:");
        console.log("   apps/www/src/lib/viem/chains.ts (CONTRACTS map)");
        console.log("");
        console.log("2. Point the frontend at this chain:");
        console.log("   NEXT_PUBLIC_CHAIN_ID=", block.chainid);
        console.log("");
        console.log("3. Verify the contracts:");
        console.log("   forge verify-contract <addr> GameFactory --chain <fuji|lisk_sepolia>");
        console.log("");
        console.log("4. Start frontend: cd apps/www && pnpm dev");
        console.log("========================================\n");
    }

}
