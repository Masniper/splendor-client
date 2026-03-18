import {
  GameState,
  Player,
  GemColor,
  GemCount,
  DevelopmentCard,
  NobleTile,
} from './models';

// Helper to create an initial empty gem count
export const createEmptyGemCount = (): GemCount => ({
  [GemColor.Emerald]: 0,
  [GemColor.Diamond]: 0,
  [GemColor.Sapphire]: 0,
  [GemColor.Onyx]: 0,
  [GemColor.Ruby]: 0,
  [GemColor.Gold]: 0,
});

// Helper to shuffle an array (Fisher-Yates algorithm)
const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

/**
 * Initializes the game state based on the player count.
 * @param playerNames Array of player names (2 to 4 players)
 * @param allLevel1Cards All available Level 1 cards
 * @param allLevel2Cards All available Level 2 cards
 * @param allLevel3Cards All available Level 3 cards
 * @param allNobles All available Noble tiles
 * @returns The initial GameState
 */
export const initializeGame = (
  playerNames: string[],
  allLevel1Cards: DevelopmentCard[],
  allLevel2Cards: DevelopmentCard[],
  allLevel3Cards: DevelopmentCard[],
  allNobles: NobleTile[]
): GameState => {
  const playerCount = playerNames.length;
  if (playerCount < 2 || playerCount > 4) {
    throw new Error('Game requires 2 to 4 players.');
  }

  // 1. Adjust the number of available gem tokens based on player count
  let standardGemCount = 7; // Default for 4 players
  if (playerCount === 2) standardGemCount = 4;
  if (playerCount === 3) standardGemCount = 5;

  const bank: GemCount = {
    [GemColor.Emerald]: standardGemCount,
    [GemColor.Diamond]: standardGemCount,
    [GemColor.Sapphire]: standardGemCount,
    [GemColor.Onyx]: standardGemCount,
    [GemColor.Ruby]: standardGemCount,
    [GemColor.Gold]: 5, // Always 5 gold
  };

  // 2. Shuffle and deal 4 cards from each deck (Level 1, 2, 3) to the board
  const shuffledLevel1 = shuffleArray(allLevel1Cards);
  const shuffledLevel2 = shuffleArray(allLevel2Cards);
  const shuffledLevel3 = shuffleArray(allLevel3Cards);

  const boardCards = {
    level1: shuffledLevel1.splice(0, 4),
    level2: shuffledLevel2.splice(0, 4),
    level3: shuffledLevel3.splice(0, 4),
  };

  const decks = {
    level1: shuffledLevel1,
    level2: shuffledLevel2,
    level3: shuffledLevel3,
  };

  // 3. Deal the correct number of Noble tiles (Players + 1)
  const shuffledNobles = shuffleArray(allNobles);
  const boardNobles = shuffledNobles.splice(0, playerCount + 1);

  // Initialize players
  const players: Player[] = playerNames.map((name, index) => ({
    id: `player-${index}`,
    name,
    reservedCards: [],
    purchasedCards: [],
    ownedTokens: createEmptyGemCount(),
    ownedNobles: [],
    currentScore: 0,
    currentBonuses: {},
  }));

  return {
    players,
    currentPlayerIndex: 0,
    bank,
    boardCards,
    decks,
    boardNobles,
    isLastRound: false,
    winner: null,
    turnPhase: 'MainAction',
    pendingNobles: [],
  };
};
