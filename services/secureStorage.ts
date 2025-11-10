import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'gearted_auth_token';
const USER_KEY = 'gearted_user_data';

export interface StoredUser {
  id: string;
  discordId: string;
  username: string;
  email: string;
  points: number;
  badges: string[];
}

/**
 * Store authentication token securely
 */
export async function storeAuthToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error storing auth token:', error);
    throw error;
  }
}

/**
 * Retrieve stored authentication token
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Error retrieving auth token:', error);
    return null;
  }
}

/**
 * Remove stored authentication token
 */
export async function removeAuthToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Error removing auth token:', error);
  }
}

/**
 * Store user data securely
 */
export async function storeUserData(user: StoredUser): Promise<void> {
  try {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error storing user data:', error);
    throw error;
  }
}

/**
 * Retrieve stored user data
 */
export async function getUserData(): Promise<StoredUser | null> {
  try {
    const userData = await SecureStore.getItemAsync(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error retrieving user data:', error);
    return null;
  }
}

/**
 * Remove stored user data
 */
export async function removeUserData(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(USER_KEY);
  } catch (error) {
    console.error('Error removing user data:', error);
  }
}

/**
 * Clear all authentication data
 */
export async function clearAuthData(): Promise<void> {
  await Promise.all([
    removeAuthToken(),
    removeUserData()
  ]);
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken();
  return token !== null;
}
