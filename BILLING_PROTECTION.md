# Billing Protection Guide - Prevent Unexpected Charges

## Goal: Stop All Charges After $1

You want to ensure you never pay more than $1. Here's how to set this up:

## ⚠️ Important: Google Cloud Limitations

**Google Cloud does NOT have a hard "automatic cutoff" at a specific dollar amount.** However, you can:

1. Set up **budget alerts** to get notified
2. Set up **budget actions** to disable services automatically
3. **Manually disable billing** if needed

## Method 1: Budget Alerts (Get Notified)

This won't stop charges automatically, but you'll know immediately:

### Setup Steps:

1. Go to [Google Cloud Billing](https://console.cloud.google.com/billing)
2. Select your billing account
3. Click **Budgets & alerts** → **Create Budget**
4. Configure:
   - **Name**: "Firebase $1 Limit"
   - **Amount**: $1.00
   - **Period**: Monthly
   - **Scope**: Select project `campus-connect-sistc`
   - **Alerts**:
     - 50% ($0.50) - Email
     - 75% ($0.75) - Email  
     - 90% ($0.90) - Email
     - 100% ($1.00) - Email
5. Click **Create**

**Result**: You'll get email alerts at each threshold.

## Method 2: Budget Actions (Automatic Disable)

This will automatically disable billing when $1 is reached:

### Setup Steps:

1. Create budget (follow Method 1 above)
2. After creating, click **Edit** on your budget
3. Scroll to **Actions** section
4. Click **Add Action**
5. Select: **Disable billing for project**
6. Set threshold: **100%** (when $1 is reached)
7. Click **Save**

**Result**: When you hit $1, billing will be automatically disabled for the project.

**⚠️ Warning**: This will disable ALL paid services, not just Storage. Your app may stop working if it relies on paid features.

## Method 3: Manual Cutoff (Safest)

The safest approach is to monitor and manually disable:

### Daily Check Routine:

1. **Check Usage Daily**:
   - Go to [Firebase Usage](https://console.firebase.google.com/project/campus-connect-sistc/settings/usage)
   - Check storage used, downloads, operations
   - If approaching limits, take action

2. **If Approaching $1**:
   - **Option A**: Delete old files to free up space
   - **Option B**: Disable Storage temporarily
   - **Option C**: Close billing account (nuclear option)

### How to Disable Storage Manually:

1. Go to [Firebase Console Storage](https://console.firebase.google.com/project/campus-connect-sistc/storage)
2. Delete files or disable Storage
3. Or go to [Billing Settings](https://console.cloud.google.com/billing)
4. Click **Close billing account** (disables all paid services)

## Method 4: Close Billing Account (Hard Cutoff)

This completely disables billing and all paid services:

### Steps:

1. Go to [Google Cloud Billing](https://console.cloud.google.com/billing)
2. Select your billing account
3. Click **Close billing account**
4. Confirm the action

**Result**: 
- ✅ No more charges possible
- ❌ All paid services disabled (Storage, etc.)
- ❌ Your app's file uploads will stop working

## Recommended Setup (Best Protection)

Combine multiple methods for maximum protection:

### Step 1: Set Up Budget Alerts
- Create $1 budget with alerts at 50%, 75%, 90%, 100%
- Get email notifications immediately

### Step 2: Set Up Budget Action
- Add action to disable billing at 100% ($1)
- Automatic protection if you miss the alerts

### Step 3: Daily Monitoring
- Check usage daily when you get alerts
- Delete files if needed
- Take action before hitting $1

### Step 4: Emergency Plan
- If you hit $1, immediately close billing account
- Or manually disable Storage
- Prevent further charges

## What Happens at Each Threshold

### At 50% ($0.50):
- ✅ Email alert sent
- ✅ Still within free tier (likely)
- ⚠️ Time to monitor closely

### At 75% ($0.75):
- ✅ Email alert sent
- ⚠️ Approaching limit
- ⚠️ Consider deleting old files

### At 90% ($0.90):
- ✅ Email alert sent
- ⚠️ Very close to $1
- ⚠️ Take action immediately

### At 100% ($1.00):
- ✅ Email alert sent
- ✅ Budget action triggered (if set up)
- ✅ Billing disabled automatically (if action configured)

## Current Free Tier Status

With your current limits (5MB files, 2MB profile pics), you should stay well within free tier:

- **5GB storage**: FREE
- **1GB/day downloads**: FREE
- **20,000 operations/day**: FREE

**You should pay $0** if you stay within these limits.

## Direct Links

- **Billing Dashboard**: https://console.cloud.google.com/billing
- **Budgets & Alerts**: https://console.cloud.google.com/billing/budgets
- **Firebase Usage**: https://console.firebase.google.com/project/campus-connect-sistc/settings/usage
- **Storage Console**: https://console.firebase.google.com/project/campus-connect-sistc/storage

## Quick Setup Checklist

- [ ] Create $1 budget with alerts
- [ ] Set up budget action to disable at $1
- [ ] Test email alerts work
- [ ] Bookmark usage page for daily checks
- [ ] Set reminder to check usage weekly

## Emergency Contacts

If you need to immediately stop charges:
1. Close billing account: https://console.cloud.google.com/billing
2. Or disable Storage: https://console.firebase.google.com/project/campus-connect-sistc/storage
3. Or contact Google Cloud support

## Summary

**Best Protection**: 
1. Budget alerts (get notified)
2. Budget action (auto-disable at $1)
3. Daily monitoring (manual checks)

This triple protection ensures you'll never pay more than $1, and likely pay $0 if you stay within free tier limits.

