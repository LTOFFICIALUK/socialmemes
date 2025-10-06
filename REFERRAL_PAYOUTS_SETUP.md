# Referral Payouts System Setup

## 🎉 Overview

The payout orchestration system now includes **Step 5: Calculate Referral Payouts**, which automatically calculates and records 5% bonuses for users who referred others.

## 📋 How It Works

1. **User A refers User B** (recorded in `referrals` table)
2. **User B earns from the platform** (recorded in `user_payouts` table during Step 4)
3. **User A gets 5% of User B's earnings** (calculated and recorded in `referral_payouts` table during Step 5)

## 🔧 Setup Required

### Step 1: Run SQL in Supabase (CRITICAL!)

You **MUST** run this SQL in your Supabase SQL Editor:

```bash
# Run this file in Supabase:
add-referral-payouts-constraint.sql
```

This adds the unique constraint required for the upsert operation to work properly.

### Step 2: Deploy to Vercel

The code has been pushed to GitHub. Vercel will auto-deploy with the new referral payouts endpoint.

## 📊 New API Endpoint

**`POST /api/admin/revenue/referral-payouts`**

### Request Body:
```json
{
  "periodStart": "2025-10-01",
  "periodEnd": "2025-10-05"
}
```

### Response:
```json
{
  "success": true,
  "period": {
    "start": "2025-10-01",
    "end": "2025-10-05"
  },
  "summary": {
    "totalUserPayouts": 7,
    "totalReferrals": 1,
    "processedReferrals": 1,
    "totalReferralBonus": 0.023456789,
    "referralPercentage": 5,
    "errors": 0
  },
  "referralPayouts": [
    {
      "referrerId": "12f87e85-9a5a-492c-85e3-13deb815592c",
      "referredUserId": "18143da8-d9cd-4467-a691-92beca415426",
      "referredUserPayout": 0.469135780,
      "referralBonus": 0.023456789
    }
  ],
  "message": "Successfully processed 1 referral payouts for period 2025-10-01 to 2025-10-05. Total referral bonus: 0.023456789 SOL"
}
```

## 🔄 Orchestration Flow

The full orchestration now has **5 steps**:

1. **Period Validation** - Validates the period exists and is ready
2. **Calculate Interaction Scores** - Calculates user engagement scores
3. **Calculate PumpFun Period Fees** - Calculates PumpFun revenue share
4. **Calculate Platform Period Fees** - Calculates platform revenue
5. **Calculate User Payouts** - Calculates individual user payouts
6. **Calculate Referral Payouts** ✨ **NEW!** - Calculates 5% bonuses for referrers

## 🧪 Testing

Run the test orchestrator locally:

```bash
node scripts/test-orchestrator.js --verbose
```

Expected output:
```
[STEP 5] ✅ Calculate Referral Payouts
  Processed referrals: 1
  Total referral bonus: 0.023456789 SOL
  Referral percentage: 5%
  Errors: 0

💰 FINAL RESULTS:
  Total pool: 45.919732548 SOL
  Total users: 7
  Total payout: 32.143612083 SOL
  Referral bonuses: 0.023456789 SOL
  Processed referrals: 1
  Balanced: true
```

## 📊 Database Tables

### `referrals` Table
Links referrers to referred users:
```sql
id, referrer_id, referred_user_id, created_at
```

### `user_payouts` Table
User earnings for each period:
```sql
id, user_id, period_start, period_end, final_payout_sol, ...
```

### `referral_payouts` Table ✨ **NEW!**
Referral bonuses for each period:
```sql
id, referrer_id, referred_user_id, period_start, period_end, 
referral_bonus_sol, payout_status, payment_tx_hash, created_at
```

**Unique constraint**: `(referrer_id, referred_user_id, period_start, period_end)`

## 🎯 Calculation Logic

```typescript
const REFERRAL_BONUS_PERCENTAGE = 0.05 // 5%

for each user_payout:
  if user has a referrer:
    referral_bonus = user_payout.final_payout_sol * 0.05
    save to referral_payouts table
```

## ⚠️ Important Notes

1. **Run the SQL constraint file first!** The upsert will silently fail without it.
2. **Referral bonuses are calculated AFTER user payouts** (Step 5 runs after Step 4)
3. **Users with 0 earnings generate no referral bonus** (bonus is skipped)
4. **One referral bonus per referred user per period** (enforced by unique constraint)
5. **Referral relationships are permanent** (stored in `referrals` table)

## 🚀 GitHub Actions

The GitHub Actions workflow (`.github/workflows/payout-orchestration.yml`) will automatically run Step 5 when it executes on schedule.

No changes needed to the workflow file - it already calls the orchestration endpoint which now includes Step 5!

## ✅ Verification

After deployment, verify the system is working:

1. Check Vercel deployment succeeded
2. Run the test orchestrator locally
3. Check Supabase `referral_payouts` table has entries
4. Verify Step 5 appears in GitHub Actions logs

## 📝 Next Steps

1. ✅ Run `add-referral-payouts-constraint.sql` in Supabase
2. ✅ Wait for Vercel deployment to complete
3. ✅ Test locally with `node scripts/test-orchestrator.js --verbose`
4. ✅ Verify referral payouts appear in database
5. ✅ Monitor first automated run via GitHub Actions

---

**Status**: Ready for deployment! 🎉

