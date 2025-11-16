# 🚂 Railway Deployment Instructions

## ⚠️ IMPORTANT: Configure Root Directory

Railway MUST be configured to use `backend` as the Root Directory, otherwise it will try to deploy the React Native frontend (which will fail).

### How to Configure Railway

1. Go to your Railway project dashboard
2. Click on your service
3. Go to **Settings** tab
4. Find **"Root Directory"** or **"Service Settings"**
5. Set **Root Directory** to: `backend`
6. Click **Save**

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

## Troubleshooting

If you see errors about `GEARTEDicon5.png` or React Native components:
- ❌ Railway is trying to deploy the frontend
- ✅ Set Root Directory to `backend` in Railway Settings

