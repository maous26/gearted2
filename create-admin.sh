#!/bin/bash
set -e

echo "🔐 Creating Admin Account for Gearted"
echo "======================================"
echo ""

# Configuration
API_URL="https://gearted2-production-36e5.up.railway.app"
SECRET_KEY="gearted-admin-2024"

# Prompt for admin credentials
read -p "📧 Admin Email: " ADMIN_EMAIL
read -sp "🔑 Admin Password: " ADMIN_PASSWORD
echo ""
echo ""

# Validate inputs
if [ -z "$ADMIN_EMAIL" ] || [ -z "$ADMIN_PASSWORD" ]; then
    echo "❌ Error: Email and password are required"
    exit 1
fi

echo "🚀 Creating admin account..."
echo ""

# Make API request
RESPONSE=$(curl -s -X POST "$API_URL/api/auth/create-admin-temp" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\",
    \"secretKey\": \"$SECRET_KEY\"
  }")

# Check if request was successful
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ Admin account created successfully!"
    echo ""
    echo "📋 Account Details:"
    echo "$RESPONSE" | grep -o '"email":"[^"]*"' | sed 's/"email":"//;s/"//'
    echo "$RESPONSE" | grep -o '"username":"[^"]*"' | sed 's/"username":"//;s/"//'
    echo "$RESPONSE" | grep -o '"role":"[^"]*"' | sed 's/"role":"//;s/"//'
    echo ""
    echo "🎉 You can now login to your admin dashboard!"
    echo "📱 Use these credentials in your app to access admin features"
else
    echo "❌ Failed to create admin account"
    echo ""
    echo "Response:"
    echo "$RESPONSE"
    exit 1
fi
