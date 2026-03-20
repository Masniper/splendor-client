#!/usr/bin/env bash
# Download development card art, noble portraits, and deck textures into public/images.
# Requires: curl. Run from repo root: ./scripts/download-splendor-assets.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CARDS="$ROOT/public/images/cards"
NOBLES="$ROOT/public/images/nobles"
TEX="$ROOT/public/images/textures"

mkdir -p "$CARDS" "$NOBLES" "$TEX"

echo "Downloading 90 development cards (400x600)..."
for i in $(seq 1 90); do
  curl -fsSL "https://picsum.photos/seed/splendor-c-${i}/400/600" -o "${CARDS}/c-${i}.jpg"
  sleep 0.15
done

echo "Downloading 10 noble tiles (400x400)..."
for i in $(seq 1 10); do
  curl -fsSL "https://picsum.photos/seed/splendor-n-${i}/400/400" -o "${NOBLES}/n-${i}.jpg"
  sleep 0.15
done

echo "Downloading deck face textures..."
curl -fsSL "https://www.transparenttextures.com/patterns/diagmonds.png" \
  -o "${TEX}/diagmonds-dark.png"
curl -fsSL "https://www.transparenttextures.com/patterns/diagmonds-light.png" \
  -o "${TEX}/diagmonds-light.png"

echo "Done. Assets under public/images/"
