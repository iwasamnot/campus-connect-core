# Enable Firebase Storage (100% FREE - No Billing Required)

Your project needs Firebase Storage to be enabled before deploying storage rules.

## ✅ Firebase Storage is COMPLETELY FREE!

**Important**: Firebase Storage has a **permanently FREE tier** (Spark plan) - **NOT a trial, it's FREE forever!**

### Free Tier Includes (No Billing Required):
- **5 GB** of storage (permanently free)
- **1 GB/day** of downloads (permanently free)
- **20,000 operations/day** (permanently free)

**You will NEVER be charged** unless you exceed these limits. For most applications, these limits are more than enough!

### No Credit Card Required!
- You can enable Storage **without adding a credit card**
- The free tier is available **forever** (not a trial)
- You only pay if you choose to upgrade to Blaze plan (optional)

## Quick Setup (100% Free)

### Step 1: Enable Firebase Storage (NO BILLING NEEDED)

1. Go to Firebase Console: https://console.firebase.google.com/project/campus-connect-sistc/storage
2. Click **Get Started** button
3. **If it asks about billing or credit card:**
   - **Click "Skip" or "Cancel"** - You don't need billing for the free tier!
   - Look for a "Continue with free plan" or "Skip billing" option
   - The free Spark plan works without any billing setup
   - **You can use Storage completely free without adding a credit card**
4. If you see a prompt about upgrading to Blaze plan:
   - **Choose "Continue with Spark plan"** (free tier)
   - This is the free option that doesn't require billing

### Step 2: Choose Storage Location

1. **Start in test mode** (recommended for initial setup)
   - This allows read/write access for authenticated users
   - You can update rules later
   - Click **Next**

2. **Choose a location** for your storage bucket:
   - Select a location close to your users (e.g., `us-central1`, `us-east1`, etc.)
   - **This is FREE** - location selection doesn't cost anything
   - Click **Done**

### Step 3: Verify You're on Free Plan (No Billing)

1. Go to Firebase Console → Project Settings → Usage and billing
2. You should see **Spark plan** (free tier) - **No billing required!**
3. You can use Storage up to the free limits **forever** without any charges
4. **No credit card needed** - The free tier is permanent

## Important: Free Tier vs Blaze Plan

- **Spark Plan (FREE)**: 
  - No billing required
  - No credit card needed
  - Free forever (5GB storage, 1GB/day downloads)
  - **This is what you want!**

- **Blaze Plan (Pay-as-you-go)**:
  - Requires billing setup
  - Only pay if you exceed free limits
  - **You don't need this - stick with Spark plan!**

### Step 3: Verify Storage is Enabled

1. You should see the Storage dashboard
2. You'll see an empty storage bucket
3. The storage is now ready to use

## After Enabling Storage

Once Storage is enabled:
1. Your GitHub Actions workflow will be able to deploy storage rules
2. File uploads in your app will work
3. You can manage files in Firebase Console

## Storage Rules

After enabling Storage, your storage rules will be automatically deployed via GitHub Actions. The rules allow:
- Authenticated users to upload files (10MB limit for messages, 5MB for profile pictures)
- All authenticated users to read files
- Admins to delete files

## Troubleshooting

### Error: "Firebase Storage has not been set up"
**Solution**: Follow Step 1 above to enable Storage

### Error: "Permission denied"
**Solution**: Make sure you're logged in with the account that owns the project

### Error: "Storage location not available"
**Solution**: Choose a different location or contact Firebase support

## Direct Links

- **Storage Console**: https://console.firebase.google.com/project/campus-connect-sistc/storage
- **Storage Rules**: Will be deployed automatically after Storage is enabled

