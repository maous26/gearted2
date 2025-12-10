// Version Web - utilise localStorage au lieu de SecureStore

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
 * Store authentication token (localStorage for web)
 */
export async function storeAuthToken(token: string): Promise<void> {
  try {
    localStorage.setItem(TOKEN_KEY, token);
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
    return localStorage.getItem(TOKEN_KEY);
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
    localStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error removing auth token:', error);
  }
}

/**
 * Store user data
 */
export async function storeUserData(user: StoredUser): Promise<void> {
  try {
    let serialized: string;
    try {
      serialized = JSON.stringify(user);
    } catch (jsonError) {
      console.error('User data is not serializable:', user);
      throw new Error('Les données utilisateur ne sont pas valides pour la sauvegarde');
    }
    localStorage.setItem(USER_KEY, serialized);
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
    const userData = localStorage.getItem(USER_KEY);
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
    localStorage.removeItem(USER_KEY);
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
