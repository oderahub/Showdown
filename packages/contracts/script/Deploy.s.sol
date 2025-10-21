// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";

import {GameFactory} from "src/GameFactory.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract DeployScript is Script {
    GameFactory public factory;
    
    // Zypher Verifier addresses - MUST be updated for Lisk Sepolia
    // These are NOT in your codebase - they're external Zypher contracts
    address public revealVerifier;
    address public shuffleVerifier;

    function setUp() public {
        // Check if verifiers are provided via env, otherwise use placeholders
        try vm.envAddress("REVEAL_VERIFIER_ADDRESS") returns (address addr) {
            revealVerifier = addr;
        } catch {
            revealVerifier = address(0); // Will need manual update
        }
        
        try vm.envAddress("SHUFFLE_VERIFIER_ADDRESS") returns (address addr) {
            shuffleVerifier = addr;
        } catch {
            shuffleVerifier = address(0); // Will need manual update
        }
    }

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);
        
        console.log("========================================");
        console.log("Starting Lisk Sepolia Deployment");
        console.log("Deployer Address:", deployerAddress);
        console.log("========================================\n");
        
        vm.startBroadcast(deployerPrivateKey);

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
        console.log("NEXT STEPS - IMPORTANT!");
        console.log("========================================");
        console.log("1. Verify contracts on Blockscout");
        console.log("   https://sepolia-blockscout.lisk.com\n");
        console.log("2. Get Zypher Verifier addresses:");
        if (revealVerifier == address(0)) {
            console.log("   - RevealVerifier:  NOT SET (REQUIRED!)");
        } else {
            console.log("   - RevealVerifier: ", revealVerifier);
        }
        if (shuffleVerifier == address(0)) {
            console.log("   - ShuffleVerifier: NOT SET (REQUIRED!)");
        } else {
            console.log("   - ShuffleVerifier:", shuffleVerifier);
        }
        console.log("\n   Contact: https://zypher.network or check:");
        console.log("   https://github.com/zypher-game/contracts\n");
        console.log("3. Update apps/www/src/components/create-game.tsx");
        console.log("   Lines 43-44 with verifier addresses\n");
        console.log("4. Test game creation on frontend");
        console.log("========================================\n");
    }

}
