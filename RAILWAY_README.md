# 🚂 Connecting Gearted to Railway

## TL;DR - Quick Start

```bash
# Run this ONE command:
./CONNECT_RAILWAY.sh lan
```

Then follow the on-screen instructions to restart Expo Go on your phone.

---

## 📱 What This Fixes

You're seeing this error in your app:
```
There was a problem running the requested app.
Unknown error: Could not connect to the server.
exp://172.21.86.69:8081
```

**The problem:** Your Expo Metro bundler can't establish a connection (tunnel timeout).

**The solution:** Use our automated script that:
1. ✅ Tests Railway backend health
2. ✅ Configures .env for Railway
3. ✅ Clears all Metro caches
4. ✅ Kills old processes
5. ✅ Starts Expo in the right mode

---

## 🎯 Three Connection Modes

### 1. LAN Mode (Recommended) ⭐

```bash
./CONNECT_RAILWAY.sh lan
```

**When to use:** Daily development, fastest performance

**Requirements:**
- Mac and phone on same WiFi
- No VPN interference
- No guest network isolation

### 2. Localhost Mode (USB)

```bash
./CONNECT_RAILWAY.sh localhost
```

**When to use:** Network issues, no WiFi available

**Requirements:**
- iPhone connected via USB
- USB debugging enabled

### 3. Tunnel Mode (Last Resort)

```bash
./CONNECT_RAILWAY.sh tunnel
```

**When to use:** Different networks, sharing with team

**Requirements:**
- Expo account login
- Stable internet
- VPN must not block ngrok

---

## 🔍 Diagnostic Tool

Before connecting, check your setup:

```bash
./CHECK_CONNECTION.sh
```

This will tell you:
- ✅ Is Railway backend healthy?
- ✅ Is your .env configured correctly?
- ✅ Are there old Metro processes?
- ✅ Is your cache clean?
- ✅ Is internet working?

---

## 📱 Phone Instructions (IMPORTANT!)

After the QR code appears:

1. **Force quit Expo Go**
   - iPhone: Swipe up → Swipe away Expo Go
   - Android: Recent apps → Swipe away

2. **Wait 3 seconds**

3. **Reopen Expo Go**

4. **Scan the NEW QR code**

5. **Verify in console** (shake phone → Show Logs):
   ```
   🔧 [API] Configuration:
      URL: https://empowering-truth-production.up.railway.app
   ✅ [API] Backend connection successful
   ```

---

## ❌ Common Problems

### "ngrok tunnel took too long"
```bash
# Use LAN instead of tunnel:
./CONNECT_RAILWAY.sh lan
```

### App still shows old IP (172.21.86.69)
```bash
# Cache not cleared - rerun script:
./CONNECT_RAILWAY.sh lan

# MUST force quit Expo Go on phone and rescan!
```

### "Could not connect to server" in app
1. Check app logs (shake → Show Logs)
2. Look for API URL - should be Railway, not local IP
3. If wrong URL, cache wasn't cleared

---

## 🧪 Testing Railway Connection

### From Terminal (Mac)
```bash
# Health check
curl -k https://empowering-truth-production.up.railway.app/health

# Search test
curl -k "https://empowering-truth-production.up.railway.app/api/search/items?query=Tokyo"
```

### From Phone (Safari/Chrome)
Navigate to:
```
https://empowering-truth-production.up.railway.app/health
```

Should see: `{"status":"ok",...}`

---

## 📂 What Changed

### Enhanced API Service
- Added connection diagnostics
- Increased timeout to 15s (Railway can be slow on cold start)
- Better error logging with visual separators
- Automatic health check on app startup

### New Scripts
- `CONNECT_RAILWAY.sh` - Automated connection setup
- `CHECK_CONNECTION.sh` - Quick diagnostic tool

### Updated Files
- `.env` - Points to Railway (auto-updated by script)
- `services/api.ts` - Better diagnostics and logging

---

## 🎯 Verification Checklist

After running the script, you should see:

✅ In Terminal:
```
✅ Railway backend is healthy
✅ .env updated
✅ All caches cleared
✅ Metro processes stopped
🚀 Starting Expo Metro bundler...
```

✅ In App Console (shake → Show Logs):
```
🔧 [API] Configuration:
   URL: https://empowering-truth-production.up.railway.app
   Environment: production
✅ [API] Backend connection successful: { status: 'ok', ... }
```

✅ In Gearcheck:
- Search "Tokyo" → Shows 5 Tokyo Marui items
- Search "M4" → Shows M4 items
- Select 2 items → Compatibility check works

---

## 🆘 Still Having Issues?

### Option 1: Run Diagnostic
```bash
./CHECK_CONNECTION.sh
```

### Option 2: Use iOS Simulator
```bash
./CONNECT_RAILWAY.sh lan
# Then in another terminal:
npx expo start --ios
```

### Option 3: Check Troubleshooting Guide
See `RAILWAY_TROUBLESHOOTING.md` for detailed solutions.

---

## 📊 Backend Status

**Railway URL:** https://empowering-truth-production.up.railway.app

**Status:** ✅ Operational (verified 2025-11-19)

**Endpoints:**
- `/health` - Health check
- `/api/search/items` - Search weapons/parts
- `/api/compatibility/manufacturers` - List manufacturers
- `/api/search/compatibility/:id1/:id2` - Check compatibility

**Database:**
- 20 manufacturers (Tokyo Marui, KWA, VFC, G&G, etc.)
- 15 weapon models
- 20+ compatible parts
- Full compatibility matrix

---

## 💡 Pro Tips

1. **Always use the script** - Don't manually restart Expo
2. **Always force quit Expo Go** - Cache persists otherwise
3. **Check console logs** - They tell you what's happening
4. **Use LAN mode** - Tunnel is slow and unreliable
5. **Railway URL never changes** - Unlike local IPs that change

---

## 🔗 Quick Links

- **Railway Dashboard:** https://railway.app
- **Backend URL:** https://empowering-truth-production.up.railway.app
- **Health Check:** https://empowering-truth-production.up.railway.app/health

---

**Last Updated:** 2025-11-19  
**Maintained By:** Claude (Full-Stack Mobile Specialist)

