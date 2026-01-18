# Firebase Storage Setup

## ⚠️ Important: Storage Requires Blaze Plan

**Reality Check**: Firebase Storage **requires the Blaze (pay-as-you-go) plan** to be enabled. However:

### The Good News:
- **Blaze plan includes the SAME free tier as Spark plan!**
- **5 GB storage** - FREE (same as Spark)
- **1 GB/day downloads** - FREE (same as Spark)  
- **20,000 operations/day** - FREE (same as Spark)
- **You won't be charged** unless you exceed these free limits

### What This Means:
- You need to **enable billing** (add a payment method)
- But you get the **same free limits** as Spark plan
- **You only pay if you exceed** the free tier limits
- For most apps, you'll stay within free limits and pay $0

## Options

### Option 1: Enable Blaze Plan (Recommended)
1. Click "Upgrade project" in Firebase Console
2. Add a payment method (credit card)
3. **You'll still get the free tier** - same limits as Spark
4. You won't be charged unless you exceed free limits
5. This is the standard way to use Firebase Storage

### Option 2: Disable File Uploads (If You Don't Want Billing)
If you don't want to enable billing, you can:
- Disable file upload functionality in the app
- Use the app without file/image sharing
- All other features (chat, groups, etc.) will work fine
- See "Making File Uploads Optional" section below

## Quick Setup (100% Free)

### Step 1: Enable Firebase Storage (Requires Blaze Plan)

1. Go to Firebase Console: https://console.firebase.google.com/project/campus-connect-sistc/storage
2. Click **Get Started** button
3. Click **"Upgrade project"** button (this enables Blaze plan)
4. **Add a payment method** (credit card required)
   - Don't worry - you still get the free tier!
   - You won't be charged unless you exceed free limits
5. Complete the upgrade process
6. Storage will be enabled with free tier limits

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

## Making File Uploads Optional (If You Don't Want Billing)

If you prefer not to enable billing, you can disable file uploads:

1. **File uploads will be disabled** - users can't upload images/files
2. **Text messages will still work** - all chat features work fine
3. **Profile pictures can use URLs** - users can paste image URLs instead
4. **All other features work** - groups, private chat, admin features, etc.

To disable file uploads, you would need to:
- Comment out or remove FileUpload component usage
- Remove file upload buttons from the UI
- The app will work fine without file uploads

## Direct Links

- **Storage Console**: https://console.firebase.google.com/project/campus-connect-sistc/storage
- **Storage Rules**: Will be deployed automatically after Storage is enabled
- **Billing Settings**: https://console.firebase.google.com/project/campus-connect-sistc/settings/usage

## Summary

- **Storage requires Blaze plan** (billing setup needed)
- **But you get free tier** (5GB, 1GB/day) - same as Spark
- **You won't be charged** unless you exceed free limits
- **Most apps stay within free limits** and pay $0

