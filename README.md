<p align="center">
<img src="./assets/logo-text.png" alt=""  width="400px"/></p>

<p align="center">
  <strong>A fully on-chain Texas Hold'em poker game with ZK-powered trustless card shuffling</strong>
</p>

<p align="center">
  Built with Zypher Network's ZK Shuffle SDK • Deployed on Lisk Sepolia
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-how-it-works">How It Works</a> •
  <a href="#-game-mechanics">Game Mechanics</a> •
  <a href="#-get-started">Get Started</a> •
  <a href="#-deployment">Deployment</a>
</p>

---

## 🎯 Features

✅ **Trustless Card Shuffling** - ZK-SNARK proofs ensure fair card distribution
✅ **Real ETH Stakes** - Smart contracts hold and distribute winnings automatically
✅ **Strategic Gameplay** - Choose 3 from 5 community cards for best hand
✅ **Anti-Griefing** - 2-minute action timeout with force-fold mechanism
✅ **User-Friendly Errors** - Clear blockchain error messages for non-technical users
✅ **Compact UI** - Betting overlay doesn't block card view
✅ **Auto-Decryption** - Cards reveal automatically when tokens are submitted

### 📜 Deployed Contracts (Lisk Sepolia)

- **Game Factory**: [0x48ae2a23841aBb319445Ccb29722b46973B03A81](https://sepolia-blockscout.lisk.com/address/0x48ae2a23841aBb319445Ccb29722b46973B03A81) ⭐ **LATEST**
- **Reveal Verifier**: [0x49cFFa95ffB77d398222393E3f0C4bFb5D996321](https://sepolia-blockscout.lisk.com/address/0x49cFFa95ffB77d398222393E3f0C4bFb5D996321)

### 🔐 Security Model

**Trustless Components:**
- ✅ Card revealing via ZK proofs (on-chain verification)
- ✅ Hand evaluation (TexasPoker library)
- ✅ Pot distribution (immutable logic)

**Trust-Based Component:**
- ⚠️ **Shuffle verification**: Client-side only due to Lisk Sepolia's 24KB contract size limit
- Players generate valid ZK shuffle proofs off-chain
- Suitable for demos and casual play

> **Note**: For production with real money, deploy on chains with higher contract size limits (e.g., Base, Optimism) for full on-chain shuffle verification.

## 🎮 How it works

The game follows a **6-stage flow** from shuffle to showdown:

```
Shuffle → Ante → Pre-Flop → Flop → Turn → River → End (Choose Cards) → Winner
```

### 🔀 Stage 1: Shuffle

All players must shuffle the deck using ZK proofs before betting begins.

**Process:**
1. **Player 1**: Generates masked deck + public key commitment + SNARK proof → submits on-chain
2. **Players 2-N**: Fetch on-chain deck → shuffle → generate SNARK proof → submit on-chain
3. All players must complete shuffling before game can start

**ZK Security:** Each shuffle is cryptographically proven to be a valid permutation without revealing card order.

---

### 💰 Stages 2-6: Betting Rounds (5 Rounds)

Players bet in turns. Each round has different cards revealed:

| Round | Cards Revealed | Action Required |
|-------|---------------|-----------------|
| **1. Ante** | None | Initial pot contribution |
| **2. Pre-Flop** | 2 hole cards per player | Bet + Submit reveal tokens for opponents' cards |
| **3. Flop** | 3 community cards | Bet + Submit reveal tokens for community cards |
| **4. Turn** | 4th community card | Bet + Submit reveal tokens |
| **5. River** | 5th community card | Bet + Submit reveal tokens |

**Betting Mechanics:**
- ✅ Players must send **actual ETH** with bets (no IOU system)
- ✅ Must match or raise current highest bet
- ✅ Can fold to exit (forfeit stake)
- ✅ 120-second timeout per action (force-fold if exceeded)

---

### 🃏 Stage 7: End Round (Strategic Choice)

**This is where strategy matters!**

After River betting completes, each player must:
1. **Choose 3 cards** from the 5 community cards
2. Submit choice on-chain via `chooseCards()` function

**Your Final Hand Structure:**
```
[Hole Card 1] [Hole Card 2] [Community Card] [Community Card] [Community Card]
     ↑              ↑              ↑                ↑                ↑
  Fixed (index 0) (index 1)    Your Choice    Your Choice    Your Choice
```

**Example:**
```
Your Hole: [A♠ K♠]
Community: [Q♠ J♠ 10♠ 2♦ 7♣]
            1   2   3   4  5

Best Choice: Pick cards 1, 2, 3
Final Hand: [A♠ K♠ Q♠ J♠ 10♠] = Royal Flush! 🏆
```

**Why This Mechanic?**
- More **strategic** than auto-selecting best hand
- Requires **poker knowledge** and hand evaluation skills
- Adds **skill-based gameplay** element
- Different from standard Texas Hold'em where computer picks best 5 from 7

---

### 🏆 Stage 8: Winner Determination & Payout

After all players choose their cards:

1. **Hand Evaluation**: Contract evaluates each player's 5-card hand using `TexasPoker.sol`
2. **Weight Calculation**: Each hand gets a weight (Royal Flush = 9000+, High Card = 1000+)
3. **Winner Selection**: Highest weight wins
4. **Automatic Payout**: ETH transferred to winner immediately
5. **Backup Withdrawal**: `claimWinnings()` available if auto-transfer fails

**Hand Rankings** (see [TexasPoker.sol](./packages/contracts/src/libraries/TexasPoker.sol)):
1. Royal Flush → 9000+
2. Straight Flush → 8000+
3. Four of a Kind → 7000+
4. Full House → 6000+
5. Flush → 5000+
6. Straight → 4000+
7. Three of a Kind → 3000+
8. Two Pair → 2000+
9. Pair → 1000+
10. High Card → 0-999

---

## 🎯 Game Mechanics

### Anti-Griefing System

**Problem:** Players could stall the game indefinitely
**Solution:** 120-second action timeout

- Each player has 2 minutes per action
- Timer resets after each valid action
- Any player can call `forceFold()` after timeout expires
- Timed-out player automatically folds and forfeits stake

### Card Reveal System

**How Decryption Works:**

1. **Submit Reveal Tokens** (⚠️ button appears)
   - Click to generate tokens for cards that need revealing
   - Uses your secret key + ZK cryptography
   - Tokens allow others to decrypt without exposing your key

2. **Auto-Decryption** (happens automatically)
   - Once all players submit tokens, cards decrypt
   - Refreshes every 2 seconds
   - No manual action needed after token submission

3. **Privacy Guarantee**
   - Only you can decrypt your hole cards (until End round)
   - Community cards decrypt when all tokens submitted
   - ZK proofs ensure no cheating

### Smart Error Handling

Blockchain errors are translated to user-friendly messages:


See all error messages in [utils.ts](./apps/www/src/lib/utils.ts)

## Demo Video 🎥

[![Demo Video](https://img.youtube.com/vi/1lw5bxYwsPk/0.jpg)](https://www.youtube.com/watch?v=1lw5bxYwsPk)

## Screenshots 📸

<table>
  <tr>
    <td valign="top" width="50%">
      <br>
      <img src="./assets/1.png" alt="" >
    </td>
    <td valign="top" width="50%">
      <br>
      <img src="./assets/2.png" alt="" >
    </td>
  </tr>
</table>

<table>
  <tr>
    <td valign="top" width="50%">
      <br>
            <img src="./assets/3.png" alt="" >
    </td>
    <td valign="top" width="50%">
      <br>
            <img src="./assets/4.png" alt="" >
    </td>
  </tr>
</table>

<table>
  <tr>
    <td valign="top" width="50%">
      <br>
            <img src="./assets/5.png" alt="" >
    </td>
    <td valign="top" width="50%">
      <br>
            <img src="./assets/6.png" alt="" >
    </td>
  </tr>
</table>

<table>
  <tr>
    <td valign="top" width="50%">
      <br>
            <img src="./assets/7.png" alt="" >
    </td>
    <td valign="top" width="50%">
      <br>
            <img src="./assets/8.png" alt="" >
    </td>
  </tr>
</table>

## 🧑🏼‍💻 Tech Stack

- **Frontend**: Next.js, Tailwind CSS, `@shadcn/ui`
- **Integration**: `wagmi`, `web3modal`, `@zypher-game/secret-engine`
- **Smart Contracts**: `Solidity`, `Foundry`
- **Backend**: `Hono`

## Get Started 🚀

The following repository is a turborepo and divided into the following:

- **apps/www** - The web application built using NextJS.

First install the dependencies by running the following:

```

pnpm install

```

Then run the following command to start the application:

```bash
pnpm dev
```