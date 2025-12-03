# 🔴 URGENT: Backend Service Down on Railway

## Problem Summary

Your Discord authentication is failing with a 404 error, but **this is NOT a Discord auth code issue**. 

The root cause is: **Your entire Railway backend service is NOT running.**

## Evidence

```bash
$ curl https://empowering-truth-production.up.railway.app/health
{"status":"error","code":404,"message":"Application not found"}
```

This response comes from Railway's edge server, indicating that the backend container is not responding.

## Impact

All API endpoints are returning 404:
- ❌ `/health`
- ❌ `/api/auth/discord` (Discord auth)
- ❌ `/api/products`
- ❌ `/api/users`
- ❌ All other endpoints

## What You Need to Do RIGHT NOW

### Step 1: Access Railway Dashboard

1. Go to: **https://railway.app**
2. Sign in
3. Navigate to project: **"astonishing-hope"**
4. Click on service: **"empowering-truth"**

### Step 2: Check Deployment Status

Look at the **Deployments** tab:
- Is there a ❌ red X next to the latest deployment?
- Is the service showing as "Crashed" or "Failed"?
- Click on the deployment to see logs

### Step 3: Read the Deployment Logs

Look for errors like:
- `Error: Environment variable not found: DATABASE_URL`
- `Error connecting to database`
- `TypeError: Cannot read property...`
- `Module not found`
- `Port already in use`

### Step 4: Verify Environment Variables

Click **Variables** tab → **Raw Editor**

Make sure ALL these variables are present (copy from `backend/RAILWAY_VARIABLES_TO_PASTE.txt`):

```
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_SECRET=...
DISCORD_CLIENT_ID=1437825557202206812
DISCORD_CLIENT_SECRET=q0DyAV1b0o9mj5Ewi1RSDPeQm9V6Bryn
DISCORD_REDIRECT_URI=https://empowering-truth-production.up.railway.app/api/auth/discord/callback
DISCORD_BOT_TOKEN=...
DISCORD_GUILD_ID=1438463061181726743
STRIPE_SECRET_KEY=...
STRIPE_PUBLISHABLE_KEY=...
STRIPE_WEBHOOK_SECRET=...
NODE_ENV=production
CORS_ORIGIN=gearted.eu
```

### Step 5: Check Service Settings

Click **Settings** tab:

1. **Root Directory**: 
   - If this is a monorepo, set to: `backend`
   - If backend is at root, leave empty

2. **Build Command** (should be one of):
   - `npm run build` OR
   - `cd backend && npm run build`

3. **Start Command** (should be one of):
   - `npm start` OR
   - `bash start.sh` OR
   - `cd backend && npm start`

4. **Port**: 
   - Should be using `process.env.PORT`
   - Railway automatically sets this

### Step 6: Trigger a New Deployment

1. Click **Deploy** or **Redeploy** button
2. **Watch the logs in real-time**
3. Look for any errors during:
   - Build phase (npm install, tsc compile)
   - Start phase (Prisma migrations, server startup)
4. Wait for "🚀 Gearted API server running on port XXXX"

### Step 7: Test the Backend

After deployment succeeds, run this command locally:

```bash
bash backend/scripts/test-railway.sh
```

You should see:
```
✅ Health endpoint is OK
✅ Discord auth endpoint is OK
✅ All tests completed!
```

## Common Railway Issues and Fixes

### Issue 1: Missing DATABASE_URL
**Symptom:** "Environment variable not found: DATABASE_URL"

**Fix:**
- Go to Railway Variables
- Add: `DATABASE_URL=postgresql://postgres:PASSWORD@postgres.railway.internal:5432/railway`
- Get the actual value from Railway's Postgres service

### Issue 2: Prisma Migration Failed
**Symptom:** "Can't reach database server"

**Fix:**
- Make sure DATABASE_URL uses `postgres.railway.internal` (not external URL)
- Check if Postgres service is running in Railway
- Try: `railway run npx prisma db push --accept-data-loss`

### Issue 3: Port Binding Issue
**Symptom:** Server starts but Railway shows "not responding"

**Fix:**
- Make sure server binds to `0.0.0.0` (not `localhost`)
- Check `src/server.ts` line 307: `server.listen(Number(PORT), '0.0.0.0', ...)`

### Issue 4: Build Failed
**Symptom:** TypeScript compilation errors

**Fix:**
- Check if build works locally: `cd backend && npm run build`
- Make sure all dependencies are in `package.json`
- Check `tsconfig.json` is valid

## Testing After Fix

Once Railway shows green (deployed):

```bash
# Test 1: Health check
curl https://empowering-truth-production.up.railway.app/health
# Should return: {"status":"ok",...}

# Test 2: Discord auth
curl https://empowering-truth-production.up.railway.app/api/auth/discord
# Should return: {"success":true,"authUrl":"https://discord.com/...","state":"..."}
```

## Next Steps After Backend is Running

1. ✅ Restart your React Native app
2. ✅ Try Discord login again
3. ✅ The 404 error should be gone
4. ✅ Discord OAuth should open in browser
5. ✅ You should be logged in successfully

---

## Summary

- ❌ **Current Status**: Backend service is DOWN on Railway
- 🔧 **Action Required**: Fix Railway deployment immediately
- 📝 **Follow**: Steps 1-7 above to diagnose and fix
- ✅ **Goal**: Get backend responding to requests again

## Files Created to Help You

1. `DISCORD_AUTH_FIX.md` - Detailed troubleshooting guide
2. `backend/scripts/test-railway.sh` - Automated diagnostic script
3. `backend/scripts/verify-env.js` - Environment variable checker

## Support

If you're still stuck after following these steps:
1. Check Railway deployment logs (screenshot them)
2. Run `backend/scripts/test-railway.sh` and share output
3. Verify all environment variables are exactly as in `RAILWAY_VARIABLES_TO_PASTE.txt`

The Discord auth code is fine - we just need the backend running first! 🚀

