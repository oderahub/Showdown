// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/zypher-verifiers/ZgRevealVerifier.sol";
import "../src/zypher-verifiers/ZgShuffleVerifier.sol";
import "../src/zypher-verifiers/shuffle/VerifierKeyExtra1_52.sol";
import "../src/zypher-verifiers/shuffle/VerifierKeyExtra2_52.sol";

contract DeployZypherVerifiersScript is Script {
    function run() public {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(privateKey);

        console.log("========================================");
        console.log("Deploying Zypher Verifiers to Lisk Sepolia");
        console.log("Deployer:", deployer);
        console.log("========================================\n");

        vm.startBroadcast(privateKey);

        // Deploy RevealVerifier
        console.log("Deploying ZgRevealVerifier...");
        ZgRevealVerifier revealVerifier = new ZgRevealVerifier();
        console.log("ZgRevealVerifier deployed at:", address(revealVerifier));

        // Deploy VerifierKey contracts separately to reduce init code size
        console.log("\nDeploying VerifierKeyExtra1_52...");
        VerifierKeyExtra1_52 vk1 = new VerifierKeyExtra1_52();
        console.log("VerifierKeyExtra1_52 deployed at:", address(vk1));

        console.log("\nDeploying VerifierKeyExtra2_52...");
        VerifierKeyExtra2_52 vk2 = new VerifierKeyExtra2_52();
        console.log("VerifierKeyExtra2_52 deployed at:", address(vk2));

        // Deploy ShuffleVerifier with pre-deployed verifier key addresses
        console.log("\nDeploying ZgShuffleVerifier...");
        ZgShuffleVerifier shuffleVerifier = new ZgShuffleVerifier(address(vk1), address(vk2));
        console.log("ZgShuffleVerifier deployed at:", address(shuffleVerifier));

        vm.stopBroadcast();

        // Write to config
        console.log("\n========================================");
        console.log("DEPLOYMENT COMPLETE");
        console.log("========================================");
        console.log("ZgRevealVerifier:", address(revealVerifier));
        console.log("ZgShuffleVerifier:", address(shuffleVerifier));
        console.log("========================================\n");

        // Update config.json
        string memory json = string.concat(
            '{"GAME_FACTORY_ADDRESS":"',
            vm.toString(vm.envAddress("GAME_FACTORY_ADDRESS")),
            '",',
            '"REVEAL_VERIFIER":"',
            vm.toString(address(revealVerifier)),
            '",',
            '"SHUFFLE_VERIFIER":"',
            vm.toString(address(shuffleVerifier)),
            '"}'
        );
        vm.writeFile("../../apps/www/public/config.json", json);
        console.log("Updated apps/www/public/config.json");
    }
}
