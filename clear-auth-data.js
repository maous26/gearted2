// Quick Fix: Add this to your app to force clear all data
// You can run this in the console or add a button temporarily

import TokenManager from './services/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Force clear all authentication data
async function forceClearAuth() {
  console.log('🧹 Clearing all authentication data...');
  
  try {
    // Clear JWT tokens
    await TokenManager.clearTokens();
    console.log('✅ Tokens cleared');
    
    // Clear user data
    await AsyncStorage.removeItem('user_profile');
    console.log('✅ User profile cleared');
    
    // Clear any other auth data
    await AsyncStorage.removeItem('onboarding_complete');
    console.log('✅ Onboarding state cleared');
    
    console.log('✅ All authentication data cleared!');
    console.log('👉 You can now log in with Discord again');
    
  } catch (error) {
    console.error('❌ Error clearing data:', error);
  }
}

// Run this function
forceClearAuth();

