# 🚂 Railway Deployment Instructions

## ⚠️ IMPORTANT: Configure Root Directory

Railway MUST be configured to use `backend` as the Root Directory, otherwise it will try to deploy the React Native frontend (which will fail).

### How to Configure Railway

1. Go to your Railway project dashboard
2. Click on your service
3. Go to **Settings** tab
4. Scroll to **"Source"** or **"Build"** section
5. Find **"Root Directory"** field
6. Enter: `backend`
7. Click **"Deploy"** to save and redeploy

**Important**: After changing Root Directory, Railway will automatically redeploy with the correct configuration.

## Environment Variables Required

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://... (auto-populated if you added PostgreSQL)
JWT_SECRET=your-64-char-secret-here
CORS_ORIGIN=*
```

### Generate JWT_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Deployment Process

Once Root Directory is set to `backend`:

1. Railway will run: `npm install && npm run build`
2. Then migrate DB: `npm run db:migrate:deploy`
3. Then start: `npm start`

## Verify Deployment

```bash
curl https://your-app.up.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-16T...",
  "uptime": 123.45
}
```

## 💾 Data Persistence

### Database is PERSISTENT
Your PostgreSQL database on Railway **persists across deployments**. Your data (users, products, transactions) will NOT be lost when you redeploy.

### What CAN cause data loss:
1. ❌ Running `prisma migrate reset`
2. ❌ Deleting the PostgreSQL service in Railway
3. ❌ Using `--accept-data-loss` flag in prisma commands
4. ❌ Running cleanup scripts (`clean-database.ts`, `delete-all-products.ts`)

### Recommended: Regular Backups
Railway PostgreSQL supports automatic backups. Enable them in:
- Railway Dashboard → Your PostgreSQL service → Settings → Backups

### Check Database Status
```bash
# From backend folder
npx ts-node scripts/check-db-status.ts
```

## Troubleshooting

If you see errors about `GEARTEDicon5.png` or React Native components:
- ❌ Railway is trying to deploy the frontend
- ✅ Set Root Directory to `backend` in Railway Settings

