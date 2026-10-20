#!/bin/bash

# =============================================================================
# Globeflight Backend VPS Setup Script
# =============================================================================

echo "============================================================"
echo "GLOBEFLIGHT BACKEND VPS SETUP"
echo "============================================================"
echo ""

# Check if .env exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled."
        exit 1
    fi
fi

# Copy template to .env
echo "📝 Creating .env file from template..."
cp .env.vps.template .env

if [ $? -eq 0 ]; then
    echo "✅ .env file created successfully!"
else
    echo "❌ Failed to create .env file"
    exit 1
fi

echo ""
echo "============================================================"
echo "NEXT STEPS:"
echo "============================================================"
echo ""
echo "1. Run database migration:"
echo "   node migrate-production.js"
echo ""
echo "2. Start the application:"
echo "   npm start"
echo ""
echo "   OR with PM2:"
echo "   pm2 start ecosystem.config.js --env production"
echo "   pm2 save"
echo ""
echo "3. Test the API:"
echo "   curl http://localhost:5000/admin/api/health"
echo ""
echo "============================================================"
echo "✅ Setup complete!"
echo "============================================================"

