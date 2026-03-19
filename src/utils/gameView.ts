import { DevelopmentCard, GemColor, Player } from '../game/models';

export function getTotalTokens(player: Player): number {
  return Object.values(player.ownedTokens).reduce((sum, count) => sum + count, 0);
}

export function canAffordCard(player: Player, card: DevelopmentCard): boolean {
  let missingTokens = 0;

  for (const [colorStr, cost] of Object.entries(card.cost)) {
    const color = colorStr as GemColor;
    const available = player.ownedTokens[color] + (player.currentBonuses[color] || 0);
    if (available < cost) missingTokens += cost - available;
  }

  return player.ownedTokens[GemColor.Gold] >= missingTokens;
}

