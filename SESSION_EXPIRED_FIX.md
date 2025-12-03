# 🔴 Session Expired Error - Quick Fix

## Problem

You're seeing this error:
```
[API] Refresh token request failed: 401
Session expired - please log in again
```

This happens because you have **old/invalid tokens** stored from when the app was connecting to the wrong backend URL.

## Solution: Clear Auth Data and Log In Fresh

### 🚀 Quick Fix (Use the Debug Button)

I've added a **"Clear Auth Data"** button to your login screen:

1. **Open your app**
2. You should see the login screen
3. **Tap the red "🧹 Clear Auth Data (Debug)" button**
4. You'll see an alert: "✅ Auth data cleared!"
5. **Now tap "Se connecter avec Discord"**
6. Log in with Discord
7. ✅ Done!

### Why This Happened

1. Before: Your app was trying to use `empowering-truth-production.up.railway.app` (which doesn't exist → 404)
2. The app couldn't connect, but it had stored invalid tokens
3. Now: We fixed the URL to `gearted2-production.up.railway.app` (which works!)
4. But the old tokens are still in storage
5. When the app tries to refresh them, the backend says "These tokens are invalid" → 401

### What the Clear Button Does

```typescript
// Clears all authentication data
await TokenManager.clearTokens();           // JWT tokens
await AsyncStorage.removeItem('user_profile');  // User profile
await AsyncStorage.removeItem('onboarding_complete');  // Onboarding state
```

## Alternative Methods

### Option 1: Clear App Data on Device

**iOS Simulator:**
```bash
# Delete the app completely
xcrun simctl uninstall booted [your.bundle.id]

# Or long press app → Remove App → Delete App
```

**Android Emulator:**
```
Settings → Apps → [Your App] → Storage → Clear Data
```

**Expo Go:**
```
Long press your project → Clear cache and data
```

### Option 2: Reinstall the App

```bash
# Stop Metro
# Press Ctrl+C

# Clear everything and restart
npm start -- --reset-cache

# Then press 'i' for iOS or 'a' for Android
```

## After Clearing Auth Data

1. ✅ Tap "Se connecter avec Discord"
2. ✅ Browser opens with Discord OAuth page
3. ✅ Click "Authorize"
4. ✅ Redirects back to app
5. ✅ You're logged in with fresh, valid tokens!

## Testing the New Backend URL

The backend is now working correctly:

```bash
# Test health endpoint
curl https://gearted2-production.up.railway.app/health
# Returns: {"status":"ok",...}

# Test Discord auth endpoint
curl https://gearted2-production.up.railway.app/api/auth/discord
# Returns: {"success":true,"authUrl":"https://discord.com/...",...}
```

## If You Still See Errors

1. **Make sure you updated Discord Developer Portal:**
   - Go to: https://discord.com/developers/applications
   - Update redirect URI to: `https://gearted2-production.up.railway.app/api/auth/discord/callback`

2. **Make sure you updated Railway environment variable:**
   - Go to: https://railway.app
   - Update `DISCORD_REDIRECT_URI` to match the above URL
   - Redeploy (wait 2 minutes)

3. **Restart your app with cache clear:**
   ```bash
   npx expo start --clear
   ```

## Remove the Debug Button Later

Once everything works, you can remove the red "Clear Auth Data" button by removing these lines from `app/login.tsx`:

- The `handleForceClearAuth` function (lines ~37-48)
- The red button UI (lines ~382-405)

## Summary

- ❌ **Old Problem**: Backend was at wrong URL, tokens were invalid
- ✅ **Fixed**: Backend URL updated to `gearted2-production.up.railway.app`
- 🔄 **Current Issue**: Old tokens still in storage
- 🎯 **Solution**: Tap "Clear Auth Data" button → Log in with Discord again
- ✅ **Result**: Fresh tokens, successful login!

---

**Next Steps:**
1. Tap the red "Clear Auth Data" button
2. Log in with Discord
3. Enjoy your working app! 🚀

