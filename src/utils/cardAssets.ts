/**
 * Local assets live under /public/images (served as /images/...).
 * If a file is missing or fails to load, components fall back to Picsum
 * (same seed = stable image per id) so the UI still works offline after first load
 * or when assets are not committed.
 */

const PICSUM_CARD = (id: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(`splendor-${id}`)}/400/600`;

const PICSUM_NOBLE = (id: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(`splendor-${id}`)}/400/400`;

export function cardImageSrc(cardId: string): string {
  return `/images/cards/${cardId}.jpg`;
}

export function cardImageFallback(cardId: string): string {
  return PICSUM_CARD(cardId);
}

export function nobleImageSrc(nobleId: string): string {
  return `/images/nobles/${nobleId}.jpg`;
}

export function nobleImageFallback(nobleId: string): string {
  return PICSUM_NOBLE(nobleId);
}

export function deckTextureSrc(isDark: boolean): string {
  return isDark
    ? "/images/textures/diagmonds-dark.png"
    : "/images/textures/diagmonds-light.png";
}

/** Fallback when local texture is missing (e.g. first dev run before script). */
export function deckTextureFallback(isDark: boolean): string {
  return isDark
    ? "https://www.transparenttextures.com/patterns/diagmonds.png"
    : "https://www.transparenttextures.com/patterns/diagmonds-light.png";
}
