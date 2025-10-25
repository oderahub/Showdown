// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IGame, Player, GameRound, PlayerWitWeight} from "./interfaces/IGame.sol";
import {ZgRevealVerifier, MaskedCard, Point} from "./secret-engine/Verifiers.sol";

import {TexasPoker, PokerCard} from "./libraries/TexasPoker.sol";

// Modules
import {Shuffle} from "./modules/Shuffle.sol";

contract Game is IGame, Shuffle {
    /// =================================================================
    ///                         State Variables
    /// =================================================================

    mapping(uint256 => Player) public _players;
    mapping(address => bool) public _isPlayer;
    uint8 public _totalPlayers;

    mapping(uint256 => uint256) public _weights;
    Player public winner;

    // Bets
    mapping(address => uint256) public _bets;
    uint8 public _nextBet;
    uint256 public _highestBet;

    // Timeout mechanism (2 minutes per action)
    uint256 public constant ACTION_TIMEOUT = 120; // 2 minutes in seconds
    uint256 public _lastActionTimestamp;

    // Game State
    bool public _gameStarted;
    GameRound public _currentRound;
    mapping(address => bool) public _isFolded;
    uint256 public _totalFolds;

    // Cards
    mapping(uint256 => uint8[5]) public _playerCards;
    uint8[5] public _communityCards;
    uint8 public _nextCard;
    mapping(address => bool) public _hasChosenCards;
    uint256 public _totalChoices;

    /// =================================================================
    ///                         Constructor
    /// =================================================================

    constructor(address _revealVerifier, Player memory _initialPlayer) {
        _players[_totalPlayers] = _initialPlayer;
        revealVerifier = ZgRevealVerifier(_revealVerifier);
        // Shuffle verification done off-chain for Lisk compatibility
        _totalPlayers++;
        _isPlayer[_initialPlayer.addr] = true;
        _lastActionTimestamp = block.timestamp;
    }

    /// =================================================================
    ///                         Modifiers
    /// =================================================================

    modifier onlyPlayer(address _player) {
        if (!_isPlayer[_player]) {
            revert NotAPlayer();
        }
        _;
    }

    /// =================================================================
    ///                         Write Functions
    /// =================================================================

    function joinGame(Player memory _player) public {
        if (_isPlayer[_player.addr]) {
            revert AlreadyAPlayer();
        }
        if (_gameStarted) {
            revert GameAlreadyStarted();
        }
        _players[_totalPlayers] = _player;
        _totalPlayers++;
        _isPlayer[_player.addr] = true;
    }

    function startGame() public onlyPlayer(msg.sender) {
        if (_gameStarted) revert GameAlreadyStarted();
        if (_totalPlayers < 2) revert NotEnoughPlayers();
        
        _gameStarted = true;
        _lastActionTimestamp = block.timestamp;
        Point[] memory publicKeys = new Point[](_totalPlayers);
        for (uint256 i = 0; i < _totalPlayers; i++) {
            publicKeys[i] = _players[i].publicKey;
        }
        gameKey = revealVerifier.aggregateKeys(publicKeys);
    }

    function initShuffle(uint256[] calldata _publicKeyCommitment, uint256[4][52] calldata _newDeck)
        public
        onlyPlayer(msg.sender)
    {
        _initShuffle(_publicKeyCommitment, _newDeck);
    }

    function shuffle(uint256[4][52] calldata _newDeck) public onlyPlayer(msg.sender) {
        _shuffle(_newDeck);
    }

    function addRevealToken(uint8 index, RevealToken calldata revealToken) public {
        Player memory player = getPlayer(msg.sender);
        if (player.addr == address(0)) {
            revert NotAPlayer();
        }

        _addRevealToken(index, revealToken);
    }

    function addMultipleRevealTokens(uint8[] memory indexes, RevealToken[] calldata revealTokens)
        public
        onlyPlayer(msg.sender)
    {
        _addMultipleRevealTokens(indexes, revealTokens);
    }

    function placeBet(uint256 _amount) public payable onlyPlayer(msg.sender) {
        // Validate game state
        if (!_gameStarted) revert GameNotStarted();
        if (_totalShuffles < _totalPlayers) revert NotShuffled();
        if (_currentRound == GameRound.End) revert GameEnded();

        // Validate player turn
        if (_players[_nextBet].addr != msg.sender) revert InvalidBetSequence();

        // Validate player hasn't folded
        if (_isFolded[msg.sender]) revert PlayerFolded();

        // Validate bet amount and msg.value match
        if (msg.value != _amount) revert IncorrectBetAmount();

        // Validate that player's new total bet meets or exceeds highest bet
        uint256 newTotalBet = _bets[msg.sender] + _amount;
        if (newTotalBet < _highestBet) revert InvalidBetAmount();

        _bets[msg.sender] = newTotalBet;
        if (_bets[msg.sender] > _highestBet) {
            _highestBet = _bets[msg.sender];
        }
        _lastActionTimestamp = block.timestamp; // Reset timeout
        _nextBet++;

        if (_nextBet == _totalPlayers) {
            _nextBet = 0;
            _nextRound();
        }
    }

    function fold() public onlyPlayer(msg.sender) {
        // Validate game state
        if (!_gameStarted) revert GameNotStarted();
        if (_totalShuffles < _totalPlayers) revert NotShuffled();
        if (_currentRound == GameRound.End) revert GameEnded();

        // Validate player turn
        if (_players[_nextBet].addr != msg.sender) revert InvalidBetSequence();

        // Validate player hasn't already folded
        if (_isFolded[msg.sender]) revert AlreadyFolded();

        _isFolded[msg.sender] = true;
        _totalFolds++;
        _lastActionTimestamp = block.timestamp; // Reset timeout
        _nextBet++;

        if (_totalFolds == _totalPlayers - 1) {
            _currentRound = GameRound.End;
            // Auto-declare winner if only 1 player remains
            _autoDeclareWinnerIfOnlyOne();
        }

        if (_nextBet == _totalPlayers) {
            _nextBet = 0;
            _nextRound();
        }
    }

    function chooseCards(uint8[3] memory cards) public onlyPlayer(msg.sender) {
        if (!_gameStarted) revert GameNotStarted();
        if (_currentRound != GameRound.End) revert GameNotEnded();

        // check if three cards are in community cards.
        for (uint8 i = 0; i < 3; i++) {
            bool found = false;
            for (uint8 j = 0; j < 5; j++) {
                if (_communityCards[j] == cards[i]) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                revert NotACommunityCard();
            }
        }

        // check if all are unique
        for (uint8 i = 0; i < 3; i++) {
            for (uint8 j = i + 1; j < 3; j++) {
                if (cards[i] == cards[j]) {
                    revert DuplicateCommunityCard();
                }
            }
        }

        uint256 playerIndex = getPlayerIndex(msg.sender);

        _playerCards[playerIndex][2] = cards[0];
        _playerCards[playerIndex][3] = cards[1];
        _playerCards[playerIndex][4] = cards[2];

        // Track card selection
        if (!_hasChosenCards[msg.sender]) {
            _hasChosenCards[msg.sender] = true;
            _totalChoices++;
        }

        // Auto-declare winner if all non-folded players have chosen
        uint256 playersInGame = _totalPlayers - _totalFolds;
        if (_totalChoices == playersInGame) {
            _autoDeclareWinner();
        }
    }

    function forceFold() public onlyPlayer(msg.sender) {
        if (!_gameStarted) revert GameNotStarted();
        if (_totalShuffles < _totalPlayers) revert NotShuffled();
        if (_currentRound == GameRound.End) revert GameEnded();

        Player memory currentPlayer = _players[_nextBet];

        // Check if timeout has expired
        if (block.timestamp <= _lastActionTimestamp + ACTION_TIMEOUT) {
            revert ActionTimeoutNotExpired();
        }

        // Check player hasn't already folded
        if (_isFolded[currentPlayer.addr]) {
            revert AlreadyFolded();
        }

        // Force fold the inactive player
        _isFolded[currentPlayer.addr] = true;
        _totalFolds++;
        _bets[currentPlayer.addr] = 0; // Forfeit stake
        _lastActionTimestamp = block.timestamp;
        _nextBet++;

        // Check if game should end
        if (_totalFolds == _totalPlayers - 1) {
            _currentRound = GameRound.End;
            // Auto-declare winner if only 1 player remains
            _autoDeclareWinnerIfOnlyOne();
        }

        if (_nextBet == _totalPlayers) {
            _nextBet = 0;
            _nextRound();
        }
    }

    function declareWinner() public onlyPlayer(msg.sender) {
        if (!_gameStarted) revert GameNotStarted();
        if (_currentRound != GameRound.End) revert GameNotEnded();
        if (winner.addr != address(0)) {
            revert WinnerAlreadyDeclared();
        }

        Player[] memory players = getPlayersInGame();

        uint8[5][] memory revealedCards = new uint8[5][](players.length);
        PokerCard[5][] memory cards = new PokerCard[5][](players.length);
        uint256[] memory weights = new uint256[](players.length);

        for (uint256 i = 0; i < players.length; i++) {
            uint256 index = getPlayerIndex(players[i].addr);
            revealedCards[i] = revealMultipleCards(_playerCards[index]);
            cards[i] = TexasPoker.toPokerCards(revealedCards[i]);
            weights[i] = TexasPoker.getWeight(cards[i]);
            _weights[index] = weights[i];
        }

        // Get index of largest weight
        uint256 maxIndex = 0;
        for (uint256 i = 1; i < players.length; i++) {
            if (weights[i] > weights[maxIndex]) {
                maxIndex = i;
            }
        }

        uint256 winnerIndex = getPlayerIndex(players[maxIndex].addr);
        winner = _players[winnerIndex];

        // Calculate pot BEFORE clearing bets (bug fix)
        uint256 totalPot = getPotAmount();

        // Clear all player bets except winner's
        for (uint256 i = 0; i < _totalPlayers; i++) {
            _bets[_players[i].addr] = 0;
        }

        // Store total pot for winner to claim
        _bets[winner.addr] = totalPot;

        // Automatically transfer winnings to winner
        (bool success, ) = payable(winner.addr).call{value: totalPot}("");
        if (!success) revert TransferFailed();
    }

    function claimWinnings() public {
        if (winner.addr == address(0)) revert GameNotEnded();
        if (msg.sender != winner.addr) revert NotWinner();

        uint256 amount = _bets[msg.sender];
        if (amount == 0) revert NoWinningsToWithdraw();

        _bets[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) revert TransferFailed();
    }

    // Allow contract to receive ETH
    receive() external payable {}
    fallback() external payable {}

    /// =================================================================
    ///                         View Functions
    /// =================================================================

    function getDeck() public view returns (uint256[4][] memory) {
        return deck;
    }

    function getPublicKeyCommitment() public view returns (uint256[] memory) {
        return publicKeyCommitment;
    }

    function getPlayer(address addr) public view returns (Player memory) {
        Player memory player;
        for (uint8 i = 0; i < _totalPlayers; i++) {
            if (_players[i].addr == addr) {
                player = _players[i];
                break;
            }
        }
        return player;
    }

    function nextPlayer() public view returns (Player memory) {
        return _players[_nextBet];
    }

    function getTimeRemaining() public view returns (uint256) {
        if (block.timestamp >= _lastActionTimestamp + ACTION_TIMEOUT) {
            return 0;
        }
        return (_lastActionTimestamp + ACTION_TIMEOUT) - block.timestamp;
    }

    function getPotAmount() public view returns (uint256) {
        uint256 potAmount = 0;
        for (uint8 i = 0; i < _totalPlayers; i++) {
            potAmount += _bets[_players[i].addr];
        }
        return potAmount;
    }

    function getPlayerCards(address player) public view returns (uint8[5] memory) {
        uint256 index = getPlayerIndex(player);
        return _playerCards[index];
    }

    function getPlayerWeight(address player) public view returns (uint256) {
        uint256 index = getPlayerIndex(player);
        return _weights[index];
    }

    function getAllWeights() public view returns (PlayerWitWeight[] memory) {
        PlayerWitWeight[] memory players = new PlayerWitWeight[](_totalPlayers);
        for (uint8 i = 0; i < _totalPlayers; i++) {
            players[i] = PlayerWitWeight(_players[i].addr, _weights[i]);
        }
        return players;
    }

    function getPlayerRevealedCards(address player) public view returns (uint8[] memory) {
        uint256 index = getPlayerIndex(player);
        uint8[] memory cards = new uint8[](5);
        for (uint8 i = 0; i < 5; i++) {
            if (_playerCards[index][i] != 0) {
                cards[i] = revealCard(_playerCards[index][i]);
            }
        }
        return cards;
    }

    function getCommunityCards() public view returns (uint8[5] memory) {
        return _communityCards;
    }

    function getPlayersInGame() public view returns (Player[] memory) {
        Player[] memory players = new Player[](_totalPlayers - _totalFolds);
        for (uint256 i = 0; i < _totalPlayers - _totalFolds; i++) {
            if (!_isFolded[_players[i].addr]) {
                players[i] = _players[i];
            }
        }

        return players;
    }

    function getRevealedCommunityCards() public view returns (uint8[] memory) {
        uint8[] memory cards = new uint8[](5);
        for (uint8 i = 0; i < 5; i++) {
            if (_communityCards[i] != 0) {
                cards[i] = revealCard(_communityCards[i]);
            }
        }

        return cards;
    }

    function getPendingCommunityRevealTokens(address user) public view returns (uint8[] memory) {
        uint8[] memory cards = new uint8[](5);
        for (uint8 i = 0; i < 5; i++) {
            if (_communityCards[i] != 0) {
                bool hasRevealToken = hasRevealToken(_communityCards[i], user);
                if (!hasRevealToken) {
                    cards[i] = _communityCards[i];
                }
            }
        }

        return cards;
    }

    function getPendingPlayerRevealTokens(address user) public view returns (uint8[] memory) {
        uint8[] memory cards = new uint8[](_totalPlayers * 2);
        uint256 cardIndex = 0;
        for (uint256 i = 0; i < _totalPlayers; i++) {
            if (_players[i].addr != user) {
                uint8[5] memory pCards = _playerCards[i];
                for (uint256 j = 0; j < 2; j++) {
                    bool hasRevealToken = hasRevealToken(pCards[j], user);
                    if (!hasRevealToken) {
                        cards[cardIndex] = pCards[j];
                        cardIndex++;
                    }
                }
            } else {
                if (_currentRound == GameRound.End) {
                    uint8[5] memory pCards = _playerCards[i];
                    for (uint256 j = 0; j < 2; j++) {
                        bool hasRevealToken = hasRevealToken(pCards[j], user);
                        if (!hasRevealToken) {
                            cards[cardIndex] = pCards[j];
                            cardIndex++;
                        }
                    }
                }
            }
        }

        return cards;
    }

    /// =================================================================
    ///                         Internal Functions
    /// =================================================================

    function _nextRound() internal {
        if (_currentRound == GameRound.Ante) {
            _distributeCards();
            _currentRound = GameRound.PreFlop;
        } else if (_currentRound == GameRound.PreFlop) {
            _currentRound = GameRound.Flop;
            _addCommunityCards(0, 3);
        } else if (_currentRound == GameRound.Flop) {
            _addCommunityCards(3, 4);
            _currentRound = GameRound.Turn;
        } else if (_currentRound == GameRound.Turn) {
            _addCommunityCards(4, 5);
            _currentRound = GameRound.River;
        } else {
            _currentRound = GameRound.End;
        }
    }

    function getPlayerIndex(address player) internal view returns (uint256) {
        for (uint256 i = 0; i < _totalPlayers; i++) {
            if (_players[i].addr == player) {
                return i;
            }
        }
        revert NotAPlayer();
    }

    function _distributeCards() internal {
        // Discard first card and the give 2 cards to each
        uint8 nextCard = 1;
        for (uint256 i = 0; i < _totalPlayers; i++) {
            _playerCards[i][0] = nextCard;
            _playerCards[i][1] = nextCard + 1;
            nextCard += 2;
        }
        _nextCard = nextCard;
    }

    function _isPlayerTurn(address player) internal view {
        if (_players[_nextBet].addr != player) {
            revert InvalidBetSequence();
        }
    }

    function _isPlayerNotFolded(address player) internal view {
        if (_isFolded[player] == true) {
            revert PlayerFolded();
        }
    }

    function _isValidBet(uint256 amount) internal view {
        if (amount < _highestBet) {
            revert InvalidBetAmount();
        }
    }

    function _addCommunityCards(uint8 start, uint8 end) internal {
        uint8 nextCard = _nextCard;
        for (uint8 i = start; i < end; i++) {
            _communityCards[i] = nextCard;
            nextCard++;
        }
        _nextCard = nextCard;
    }

    function _isShuffled() internal view {
        if (_totalShuffles != _totalPlayers) {
            revert NotShuffled();
        }
    }

    /**
     * @dev Auto-declares winner if only one player remains (others folded)
     * This is called after fold() or forceFold() when _totalFolds == _totalPlayers - 1
     */
    function _autoDeclareWinnerIfOnlyOne() internal {
        // Winner already declared
        if (winner.addr != address(0)) return;

        // Find the remaining player
        Player memory remainingPlayer;
        for (uint256 i = 0; i < _totalPlayers; i++) {
            if (!_isFolded[_players[i].addr]) {
                remainingPlayer = _players[i];
                break;
            }
        }

        // Declare them as winner
        winner = remainingPlayer;

        // Calculate pot BEFORE clearing bets
        uint256 totalPot = getPotAmount();

        // Clear all player bets
        for (uint256 i = 0; i < _totalPlayers; i++) {
            _bets[_players[i].addr] = 0;
        }

        // Give pot to winner
        _bets[winner.addr] = totalPot;

        // Automatically transfer winnings to winner
        (bool success, ) = payable(winner.addr).call{value: totalPot}("");
        if (!success) revert TransferFailed();
    }

    /**
     * @dev Auto-declares winner after all non-folded players have chosen their cards
     * This implements the same logic as declareWinner() but is called automatically
     * Note: This will silently fail if reveal tokens are not yet submitted
     */
    function _autoDeclareWinner() internal {
        // Winner already declared
        if (winner.addr != address(0)) return;

        Player[] memory players = getPlayersInGame();

        // Try to reveal cards and compute winner
        // If this fails due to missing reveal tokens, we silently skip
        // Players can manually call declareWinner() later
        uint8[5][] memory revealedCards = new uint8[5][](players.length);
        PokerCard[5][] memory cards = new PokerCard[5][](players.length);
        uint256[] memory weights = new uint256[](players.length);

        // Attempt to reveal all cards
        // This might fail if reveal tokens not submitted yet
        bool canReveal = true;
        for (uint256 i = 0; i < players.length; i++) {
            uint256 index = getPlayerIndex(players[i].addr);

            // Check if we have enough reveal tokens for this player's cards
            for (uint256 j = 0; j < 5; j++) {
                uint8 cardIndex = _playerCards[index][j];
                if (cardIndex != 0) {
                    RevealToken[] memory tokens = _revealTokens[cardIndex];
                    // For hole cards (j < 2), need N-1 tokens
                    // For community cards (j >= 2), need N tokens (all players)
                    uint256 requiredTokens = j < 2 ? _totalPlayers - 1 : _totalPlayers;
                    if (tokens.length < requiredTokens) {
                        canReveal = false;
                        break;
                    }
                }
            }
            if (!canReveal) break;
        }

        // If we can't reveal all cards yet, skip auto-declare
        if (!canReveal) return;

        // Reveal and evaluate all hands
        for (uint256 i = 0; i < players.length; i++) {
            uint256 index = getPlayerIndex(players[i].addr);
            revealedCards[i] = revealMultipleCards(_playerCards[index]);
            cards[i] = TexasPoker.toPokerCards(revealedCards[i]);
            weights[i] = TexasPoker.getWeight(cards[i]);
            _weights[index] = weights[i];
        }

        // Find winner
        uint256 winnerIndex = 0;
        uint256 highestWeight = weights[0];
        for (uint256 i = 1; i < weights.length; i++) {
            if (weights[i] > highestWeight) {
                highestWeight = weights[i];
                winnerIndex = i;
            }
        }

        winner = players[winnerIndex];

        // Calculate pot BEFORE clearing bets
        uint256 totalPot = getPotAmount();

        // Clear all player bets
        for (uint256 i = 0; i < _totalPlayers; i++) {
            _bets[_players[i].addr] = 0;
        }

        // Give pot to winner
        _bets[winner.addr] = totalPot;

        // Automatically transfer winnings to winner
        (bool success, ) = payable(winner.addr).call{value: totalPot}("");
        if (!success) revert TransferFailed();
    }
}
