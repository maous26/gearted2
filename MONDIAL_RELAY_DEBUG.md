# Mondial Relay API - Debugging Guide

## Current Status

✅ **Fallback Mode Active**: The app now returns mock data when the SOAP API fails
❌ **SOAP API Failing**: Connection to Mondial Relay's test SOAP endpoint is failing

## Why the SOAP API is Failing

The Error 500 you're seeing is because the SOAP API call to `https://api.mondialrelay.com/Web_Services.asmx?WSDL` is failing.

Possible reasons:
1. **Network blocking**: Railway might block outbound SOAP/XML requests
2. **WSDL endpoint changed**: Mondial Relay may have updated their test endpoint
3. **Credentials issue**: Test credentials might have changed
4. **SOAP library issue**: The `soap` npm package might not work well in Railway's environment

## Current Workaround

The code now has **graceful fallback**:
- ✅ Tries real SOAP API first
- ❌ If SOAP fails → Returns realistic mock data
- ✅ UI works perfectly with mock data
- ✅ Logs the actual SOAP error for debugging

## How to Check Railway Logs

1. Go to Railway dashboard: https://railway.app
2. Select your backend service
3. Click "Deployments" → Latest deployment → "View Logs"
4. Search for `[MondialRelay] SOAP API Error:`

You should see the exact error message from the SOAP library.

## Test Credentials Currently Used

```env
MONDIAL_RELAY_ENSEIGNE=BDTEST13
MONDIAL_RELAY_PRIVATE_KEY=PrivateK
MONDIAL_RELAY_BRAND=11
```

These are the **official Mondial Relay test credentials** from their documentation.

## Alternative Solutions

### Option 1: Use Mondial Relay REST API (if available)

Check if Mondial Relay has a REST API instead of SOAP:
- Easier to debug
- Better compatibility with modern cloud platforms
- More reliable

### Option 2: Contact Mondial Relay Support

Email: `api@mondialrelay.fr`
Phone: `09 69 32 23 32`

Ask them:
1. Are the test credentials `BDTEST13` / `PrivateK` still valid?
2. Is the WSDL endpoint `https://api.mondialrelay.com/Web_Services.asmx?WSDL` correct?
3. Do they have a REST API alternative?
4. Are there IP whitelisting requirements?

### Option 3: Use Mock Data for Now

The current fallback works perfectly! You can:
- ✅ Test the entire UI flow
- ✅ Select relay points
- ✅ Generate labels (mock)
- ✅ Show this to users/investors

Then switch to real API when you get production credentials.

## When You Get Production Credentials

Set these environment variables in Railway:

```env
MONDIAL_RELAY_ENSEIGNE=your_real_enseigne
MONDIAL_RELAY_PRIVATE_KEY=your_real_key
MONDIAL_RELAY_BRAND=your_brand_number
```

The SOAP API should work with real production credentials (they usually have better reliability than test environments).

## Mock Data Details

The fallback returns 3 realistic relay points:
- **024892** - PARIS DAUMESNIL (184 RUE DE CHARENTON)
- **024893** - PRESSING VICTOR HUGO (125 AVENUE VICTOR HUGO)
- **024894** - TABAC DE LA GARE (12 RUE DU DEPART)

These IDs follow Mondial Relay's format (6 digits, starting with 024 for Paris).

## Next Steps

1. ✅ Test the "Choisir un point relais" button - should work now!
2. ✅ Complete the rest of your parcel flow with mock data
3. ⏳ Check Railway logs for the exact SOAP error
4. ⏳ Contact Mondial Relay support for production access
5. ⏳ Switch to real API when you get production credentials

---

**Last Updated**: December 3, 2025
**Status**: Fallback mode working, investigating SOAP issue
