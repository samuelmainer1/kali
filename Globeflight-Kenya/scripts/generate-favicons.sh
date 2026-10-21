#!/bin/bash

# Globeflight Kenya - Favicon Generator Script
# This script generates all required favicon sizes from logo.png

set -e

echo "🎨 Globeflight Kenya - Favicon Generator"
echo "=========================================="
echo ""

# Check if logo.png exists
if [ ! -f "public/logo.png" ]; then
    echo "❌ Error: public/logo.png not found!"
    exit 1
fi

echo "✅ Found logo.png"
echo "📏 Generating favicon files..."
echo ""

# Create temporary directory for processing
TEMP_DIR="temp_favicon"
mkdir -p "$TEMP_DIR"

# Copy logo to temp directory
cp public/logo.png "$TEMP_DIR/logo.png"

# Generate favicon-16x16.png
echo "  → favicon-16x16.png"
sips -z 16 16 "$TEMP_DIR/logo.png" --out "public/favicon-16x16.png" > /dev/null 2>&1

# Generate favicon-32x32.png
echo "  → favicon-32x32.png"
sips -z 32 32 "$TEMP_DIR/logo.png" --out "public/favicon-32x32.png" > /dev/null 2>&1

# Generate apple-touch-icon.png (180x180)
echo "  → apple-touch-icon.png"
sips -z 180 180 "$TEMP_DIR/logo.png" --out "public/apple-touch-icon.png" > /dev/null 2>&1

# Generate android-chrome-192x192.png
echo "  → android-chrome-192x192.png"
sips -z 192 192 "$TEMP_DIR/logo.png" --out "public/android-chrome-192x192.png" > /dev/null 2>&1

# Generate android-chrome-512x512.png
echo "  → android-chrome-512x512.png"
sips -z 512 512 "$TEMP_DIR/logo.png" --out "public/android-chrome-512x512.png" > /dev/null 2>&1

# Generate optimized logo for Open Graph (1200x630)
echo "  → logo-og.png (1200x630 for social sharing)"
sips -z 630 1200 "$TEMP_DIR/logo.png" --out "public/logo-og.png" > /dev/null 2>&1

# Generate favicon.ico (multi-size)
# Note: sips cannot create .ico files, so we'll create a 32x32 PNG and rename it
# For proper .ico file, use an online converter or ImageMagick
echo "  → favicon.ico (using 32x32 PNG)"
cp "public/favicon-32x32.png" "public/favicon.ico"

# Clean up temp directory
rm -rf "$TEMP_DIR"

echo ""
echo "✅ All favicon files generated successfully!"
echo ""
echo "📁 Generated files:"
echo "   ✓ public/favicon.ico"
echo "   ✓ public/favicon-16x16.png"
echo "   ✓ public/favicon-32x32.png"
echo "   ✓ public/apple-touch-icon.png"
echo "   ✓ public/android-chrome-192x192.png"
echo "   ✓ public/android-chrome-512x512.png"
echo "   ✓ public/logo-og.png (for social sharing)"
echo ""
echo "⚠️  Note: favicon.ico is currently a PNG file."
echo "   For a proper multi-size .ico file, use:"
echo "   - https://realfavicongenerator.net/"
echo "   - Or install ImageMagick: brew install imagemagick"
echo ""
echo "🎉 Done! Your favicons are ready for SEO optimization."

