# 🔧 Railway Connection Troubleshooting Guide

## ✅ Quick Status Check

### 1. Backend Status
```bash
curl -k https://empowering-truth-production.up.railway.app/health
```

**Expected output:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-19T...",
  "uptime": 123.45,
  "environment": "production"
}
```

✅ **Backend is HEALTHY** (verified on 2025-11-19)

### 2. Search API Test
```bash
curl -k "https://empowering-truth-production.up.railway.app/api/search/items?query=Tokyo"
```

**Expected output:**
5 Tokyo Marui items (M4A1 MWS, AK47, VSR-10, Hi-Capa, Magazine)

✅ **Search API is WORKING** (verified on 2025-11-19)

---

## 🎯 The Real Problem

**It's NOT Railway** - the backend is 100% functional.

**It IS Expo Metro Bundler** - the dev server can't connect to deliver your app bundle.

### Error You're Seeing
```
CommandError: ngrok tunnel took too long to connect.
```

This means:
- Expo can't establish a tunnel relay through ngrok
- Your phone never receives the app bundle
- Railway API is never reached because the app doesn't load

---

## 🚀 SOLUTION: Use the Connection Script

### Method 1: LAN Mode (Recommended)
```bash
./CONNECT_RAILWAY.sh lan
```

**Requirements:**
- Mac and phone on **same WiFi network**
- No VPN or guest network isolation
- Firewall allows local connections

**Pros:** Fast, reliable, no external dependencies

**Cons:** Only works on same network

### Method 2: Localhost Mode (USB)
```bash
./CONNECT_RAILWAY.sh localhost
```

**Requirements:**
- iPhone connected via USB cable
- USB debugging enabled
- Expo Go installed on phone

**Pros:** Works without WiFi, most reliable

**Cons:** Requires cable connection

### Method 3: Tunnel Mode (Last Resort)
```bash
./CONNECT_RAILWAY.sh tunnel
```

**Requirements:**
- Expo account login: `npx expo login`
- No VPN blocking ngrok
- Stable internet connection
- May take 1-2 minutes to connect

**Pros:** Works from anywhere

**Cons:** Slow, can timeout, requires ngrok

---

## 📋 Step-by-Step Connection Process

### Phase 1: Pre-flight Checks

1. **Verify Railway backend:**
   ```bash
   curl -k https://empowering-truth-production.up.railway.app/health
   ```
   Should return `{ "status": "ok" }`

2. **Check your .env file:**
   ```bash
   cat .env
   ```
   Should contain:
   ```
   EXPO_PUBLIC_API_URL=https://empowering-truth-production.up.railway.app
   EXPO_PUBLIC_ENV=production
   ```

3. **Kill existing Metro processes:**
   ```bash
   pkill -f "expo start" && pkill -f "metro"
   ```

### Phase 2: Run Connection Script

```bash
./CONNECT_RAILWAY.sh lan
```

The script will:
1. ✅ Test Railway backend
2. ✅ Update .env to Railway
3. ✅ Clear all Metro/Expo caches
4. ✅ Kill existing Metro processes
5. ✅ Wait for your confirmation
6. 🚀 Start Expo with clean state

### Phase 3: Phone Setup

**CRITICAL STEPS:**

1. **Force quit Expo Go:**
   - iPhone: Swipe up → Swipe Expo Go away
   - Android: Recent apps → Swipe Expo Go away
   
2. **Wait 3 seconds** (let the app fully close)

3. **Reopen Expo Go**

4. **Scan the NEW QR code** from the terminal

5. **Check console logs:**
   - Shake phone → "Show Logs" or "Debug Remote JS"
   - Look for:
     ```
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     🔧 [API] Configuration:
        URL: https://empowering-truth-production.up.railway.app
        Environment: production
        Timestamp: 2025-11-19T...
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     ✅ [API] Backend connection successful: { status: 'ok', ... }
     ```

---

## ❌ Common Issues & Fixes

### Issue 1: "ngrok tunnel took too long"

**Cause:** Tunnel mode timeout (VPN, firewall, or slow connection)

**Fix:**
```bash
# Try LAN mode instead
./CONNECT_RAILWAY.sh lan

# Or localhost with USB
./CONNECT_RAILWAY.sh localhost
```

### Issue 2: App shows old IP (172.21.86.69)

**Cause:** Metro cache not cleared, .env not reloaded

**Fix:**
```bash
rm -rf .expo node_modules/.cache tmp
npx expo start --clear --lan
```

Then **force quit and reopen** Expo Go on phone.

### Issue 3: "Could not connect to server" in app

**Cause:** App bundle loaded but can't reach Railway

**Fix:**

1. Check app console logs (shake → Show Logs)
2. Look for API URL in logs - should be Railway URL
3. If it shows old IP, cache wasn't cleared properly
4. Re-run connection script

### Issue 4: "Network Error" in API calls

**Cause:** Phone has no internet, or Railway is down

**Fix:**

1. Test phone internet: Open Safari/Chrome, load website
2. Test Railway from Mac: `curl -k https://empowering-truth-production.up.railway.app/health`
3. If Railway down, check Railway dashboard

### Issue 5: Stuck at "Bundling..."

**Cause:** Metro bundler building with old cache

**Fix:**
```bash
# Kill Metro completely
pkill -f "expo" && pkill -f "metro"

# Clean everything
rm -rf .expo node_modules/.cache tmp
rm -rf /tmp/metro-* /tmp/haste-map-*

# Restart clean
npx expo start --clear --lan
```

---

## 🔍 Advanced Diagnostics

### Check what URL your app is actually using:

**In app console logs:**
```
🔧 [API] Configuration:
   URL: https://empowering-truth-production.up.railway.app  ← Should be Railway
   Environment: production
```

**If you see a local IP instead (e.g., http://172.21.86.69:3000):**
- Metro cache wasn't cleared
- .env wasn't reloaded
- App needs force quit + rescan

### Test Railway connectivity from phone:

1. Open Safari on iPhone (or Chrome on Android)
2. Navigate to: `https://empowering-truth-production.up.railway.app/health`
3. Should see: `{"status":"ok",...}`
4. If not, phone can't reach Railway (network issue)

### Check Metro bundler logs:

Look for:
```
› Metro waiting on exp://192.168.1.x:8081
› Scan the QR code above with Expo Go (Android) or Camera (iOS)
```

If you see errors about "ngrok" or "tunnel", switch to LAN mode.

---

## 📱 Network Modes Explained

### LAN Mode (--lan)
- **How it works:** Direct connection via local WiFi
- **URL format:** `exp://192.168.x.x:8081`
- **Best for:** Daily development
- **Fails if:** Different networks, VPN, firewall

### Localhost Mode (--localhost)
- **How it works:** USB connection to Mac
- **URL format:** `exp://127.0.0.1:8081`
- **Best for:** No WiFi, or network issues
- **Fails if:** USB not connected, debugging not enabled

### Tunnel Mode (--tunnel)
- **How it works:** ngrok relay (Expo servers)
- **URL format:** `exp://abc-xyz.exp.direct:80`
- **Best for:** Different networks, sharing with others
- **Fails if:** VPN blocks ngrok, slow connection, quota exceeded

---

## ✅ Success Checklist

After running the connection script, verify:

- [ ] Terminal shows: "✅ Railway backend is healthy"
- [ ] .env contains Railway URL (not local IP)
- [ ] Metro bundler started without errors
- [ ] QR code visible in terminal
- [ ] Expo Go force quit on phone
- [ ] Expo Go reopened and QR scanned
- [ ] App loads successfully
- [ ] Console shows Railway URL (shake → Show Logs)
- [ ] Console shows "✅ Backend connection successful"
- [ ] Test Gearcheck search: "Tokyo" returns 5 results

---

## 🎯 Key Takeaways

1. **Railway backend is working perfectly** ✅
2. **The issue is Metro bundler connection**, not Railway
3. **Use LAN mode** unless you have network restrictions
4. **Always force quit Expo Go** after restarting Metro
5. **Check console logs** to verify Railway URL is loaded
6. **Clear caches thoroughly** - Metro aggressively caches .env

---

## 🆘 Still Not Working?

### Option 1: Use iOS Simulator (No Phone Required)

```bash
# Update .env to Railway (script does this)
./CONNECT_RAILWAY.sh lan

# Then in another terminal:
npx expo start --ios
```

This opens iOS Simulator on Mac - no phone, no network issues.

### Option 2: Build Standalone App

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build for iOS (or android)
eas build --platform ios --profile preview
```

Creates installable app that connects directly to Railway.

### Option 3: Use Web Version

```bash
npx expo start --web
```

Opens app in browser at `http://localhost:8081` - connects to Railway without phone.

---

## 📞 Debug Information to Share

If you need help, share these:

1. **Railway health test:**
   ```bash
   curl -k https://empowering-truth-production.up.railway.app/health
   ```

2. **Your .env content:**
   ```bash
   cat .env
   ```

3. **Metro bundler output** (first 50 lines after starting Expo)

4. **App console logs** (shake phone → Show Logs)

5. **Network mode used:** (lan/localhost/tunnel)

6. **Mac and phone on same WiFi?** (yes/no)

---

**Last Updated:** 2025-11-19  
**Backend Status:** ✅ Operational  
**Backend URL:** https://empowering-truth-production.up.railway.app

