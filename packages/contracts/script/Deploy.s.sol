// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";

import {GameFactory} from "src/GameFactory.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract DeployScript is Script {
    GameFactory public factory;
    
    // RevealVerifier already deployed on Lisk Sepolia
    address public constant revealVerifier = 0x49cFFa95ffB77d398222393E3f0C4bFb5D996321;

    function setUp() public {}

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
        console.log("SECURITY NOTE");
        console.log("========================================");
        console.log("RevealVerifier:     ", revealVerifier);
        console.log("ShuffleVerifier:     OFF-CHAIN ONLY");
        console.log("");
        console.log("Shuffle verification is done client-side due to");
        console.log("Lisk Sepolia's 24KB contract size limit.");
        console.log("");
        console.log("- Shuffle: Client-side proof generation");
        console.log("- Reveal: On-chain verification (trustless)");
        console.log("========================================");
        console.log("NEXT STEPS");
        console.log("========================================");
        console.log("1. Verify GameFactory on Blockscout:");
        console.log("   https://sepolia-blockscout.lisk.com\n");
        console.log("2. Frontend is already configured:");
        console.log("   - config.json updated automatically");
        console.log("   - RevealVerifier hardcoded\n");
        console.log("3. Start frontend: cd apps/www && pnpm dev");
        console.log("========================================\n");
    }

}
