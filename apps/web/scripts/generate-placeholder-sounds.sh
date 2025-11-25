#!/bin/bash
# Generate Placeholder Sound Files for Holo-Glitch Effects
# Prevents build crashes by creating silent MP3 files

set -e

SOUNDS_DIR="public/sounds"
GLITCH_FILE="$SOUNDS_DIR/glitch.mp3"
BURST_FILE="$SOUNDS_DIR/burst.mp3"

echo "🔊 Generating placeholder sound files..."

# Ensure sounds directory exists
mkdir -p "$SOUNDS_DIR"

# Function to generate silent MP3 using ffmpeg (if available)
generate_silent_mp3() {
  local output_file="$1"
  local duration="$2"

  if command -v ffmpeg &> /dev/null; then
    echo "  ✓ Generating $output_file with ffmpeg (${duration}s silence)..."
    ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t "$duration" -q:a 9 -acodec libmp3lame "$output_file" -y &> /dev/null
    return 0
  else
    return 1
  fi
}

# Function to create placeholder using base64 (fallback)
create_placeholder_mp3() {
  local output_file="$1"
  echo "  ⚠️  ffmpeg not found, creating minimal placeholder..."

  # Minimal valid MP3 header (silent frame)
  # This is a base64-encoded 0.026s silent MP3 frame
  cat > "$output_file" << 'EOF_MP3'
//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADhABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVaqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqv///////////////////////////////8AAAA5TEFNRTMuOThyBKYAAAAALhsAABRAJAMxQQAB4AAAg4S8z9UFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
EOF_MP3
}

# Generate or create glitch.mp3
if [ ! -f "$GLITCH_FILE" ]; then
  if ! generate_silent_mp3 "$GLITCH_FILE" "0.5"; then
    create_placeholder_mp3 "$GLITCH_FILE"
  fi
  echo "  ✓ Created $GLITCH_FILE"
else
  echo "  ℹ️  $GLITCH_FILE already exists, skipping..."
fi

# Generate or create burst.mp3
if [ ! -f "$BURST_FILE" ]; then
  if ! generate_silent_mp3 "$BURST_FILE" "0.5"; then
    create_placeholder_mp3 "$BURST_FILE"
  fi
  echo "  ✓ Created $BURST_FILE"
else
  echo "  ℹ️  $BURST_FILE already exists, skipping..."
fi

echo ""
echo "✅ Placeholder sounds ready!"
echo ""
echo "📝 Next steps:"
echo "   1. Replace placeholder files with actual cyberpunk SFX"
echo "   2. Recommended: <50KB MP3, 64kbps, mono, 0.5s duration"
echo "   3. Sources: Freesound.org, Zapsplat.com (search 'cyberpunk glitch')"
echo ""
