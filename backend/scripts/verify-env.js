#!/usr/bin/env node

/**
 * Verify Railway Environment Variables
 * Run this to check if all required environment variables are set
 */

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'DISCORD_CLIENT_ID',
  'DISCORD_CLIENT_SECRET',
  'DISCORD_REDIRECT_URI',
  'DISCORD_BOT_TOKEN',
  'DISCORD_GUILD_ID',
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NODE_ENV',
  'CORS_ORIGIN'
];

const optionalEnvVars = [
  'SHIPPO_API_KEY',
  'MONDIAL_RELAY_ENSEIGNE',
  'MONDIAL_RELAY_PRIVATE_KEY',
  'MONDIAL_RELAY_BRAND'
];

console.log('🔍 Checking Required Environment Variables...\n');

let allPresent = true;
let missingVars = [];

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: MISSING`);
    missingVars.push(varName);
    allPresent = false;
  } else {
    // Show first 20 chars only for security
    const preview = value.length > 20 ? `${value.substring(0, 20)}...` : value;
    console.log(`✅ ${varName}: ${preview}`);
  }
});

console.log('\n📋 Optional Environment Variables:\n');
optionalEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`⚠️  ${varName}: Not set (optional)`);
  } else {
    const preview = value.length > 20 ? `${value.substring(0, 20)}...` : value;
    console.log(`✅ ${varName}: ${preview}`);
  }
});

console.log('\n' + '='.repeat(60));

if (allPresent) {
  console.log('✅ All required environment variables are set!');
  process.exit(0);
} else {
  console.log('❌ Missing required environment variables:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log('\nPlease set these variables in Railway dashboard.');
  process.exit(1);
}

