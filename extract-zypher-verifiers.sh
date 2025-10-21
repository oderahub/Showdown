#!/bin/bash

# Extract Zypher Verifier Contracts from uzkge repo
# Compatible with pnpm monorepo structure

set -e

echo "========================================"
echo "Extracting Zypher Verifier Contracts"
echo "========================================"

BASE_URL="https://raw.githubusercontent.com/zypher-game/uzkge/main/contracts/solidity/contracts"
TARGET_DIR="packages/contracts/src/zypher-verifiers"

# Create directory structure
echo -e "\n📁 Creating directory structure..."
mkdir -p "$TARGET_DIR/shuffle"
mkdir -p "$TARGET_DIR/verifier"
mkdir -p "$TARGET_DIR/libraries"

echo "✅ Directories created"

# Download shuffle verifiers
echo -e "\n📥 Downloading shuffle verifiers..."
curl -sSL "$BASE_URL/shuffle/RevealVerifier.sol" -o "$TARGET_DIR/shuffle/RevealVerifier.sol"
echo "  ✓ RevealVerifier.sol"

curl -sSL "$BASE_URL/shuffle/ShuffleVerifier.sol" -o "$TARGET_DIR/shuffle/ShuffleVerifier.sol"
echo "  ✓ ShuffleVerifier.sol"

curl -sSL "$BASE_URL/shuffle/ExternalTranscript.sol" -o "$TARGET_DIR/shuffle/ExternalTranscript.sol"
echo "  ✓ ExternalTranscript.sol"

curl -sSL "$BASE_URL/shuffle/VerifierKey_20.sol" -o "$TARGET_DIR/shuffle/VerifierKey_20.sol"
echo "  ✓ VerifierKey_20.sol"

curl -sSL "$BASE_URL/shuffle/VerifierKey_52.sol" -o "$TARGET_DIR/shuffle/VerifierKey_52.sol"
echo "  ✓ VerifierKey_52.sol"

curl -sSL "$BASE_URL/shuffle/VerifierKeyExtra1_52.sol" -o "$TARGET_DIR/shuffle/VerifierKeyExtra1_52.sol"
echo "  ✓ VerifierKeyExtra1_52.sol"

curl -sSL "$BASE_URL/shuffle/VerifierKeyExtra2_52.sol" -o "$TARGET_DIR/shuffle/VerifierKeyExtra2_52.sol"
echo "  ✓ VerifierKeyExtra2_52.sol"

# Download base verifiers
echo -e "\n📥 Downloading base verifiers..."
curl -sSL "$BASE_URL/verifier/PlonkVerifier.sol" -o "$TARGET_DIR/verifier/PlonkVerifier.sol"
echo "  ✓ PlonkVerifier.sol"

curl -sSL "$BASE_URL/verifier/Groth16Verifier.sol" -o "$TARGET_DIR/verifier/Groth16Verifier.sol"
echo "  ✓ Groth16Verifier.sol"

curl -sSL "$BASE_URL/verifier/ChaumPedersenDLVerifier.sol" -o "$TARGET_DIR/verifier/ChaumPedersenDLVerifier.sol"
echo "  ✓ ChaumPedersenDLVerifier.sol"

# Download libraries
echo -e "\n📥 Downloading libraries..."
curl -sSL "$BASE_URL/libraries/EdOnBN254.sol" -o "$TARGET_DIR/libraries/EdOnBN254.sol"
echo "  ✓ EdOnBN254.sol"

curl -sSL "$BASE_URL/libraries/Transcript.sol" -o "$TARGET_DIR/libraries/Transcript.sol"
echo "  ✓ Transcript.sol"

curl -sSL "$BASE_URL/libraries/BN254.sol" -o "$TARGET_DIR/libraries/BN254.sol"
echo "  ✓ BN254.sol"

curl -sSL "$BASE_URL/libraries/BytesLib.sol" -o "$TARGET_DIR/libraries/BytesLib.sol"
echo "  ✓ BytesLib.sol"

curl -sSL "$BASE_URL/libraries/Utils.sol" -o "$TARGET_DIR/libraries/Utils.sol"
echo "  ✓ Utils.sol"

echo -e "\n========================================"
echo "✅ All verifier contracts downloaded!"
echo "========================================"
echo -e "\nLocation: $TARGET_DIR"
echo -e "\nNext steps:"
echo "1. Run: chmod +x create-verifier-wrappers.sh && ./create-verifier-wrappers.sh"
echo "2. Run: cd packages/contracts && forge build"
echo "3. Deploy verifiers to Lisk Sepolia"