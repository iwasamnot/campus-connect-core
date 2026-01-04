# Google Cloud Console Access Guide

## Why You Can't See Your Project in Cloud Console

Your Firebase project `campus-connect-sistc` exists, but you might not see it in Google Cloud Console for several reasons:

## Common Reasons

### 1. Different Google Account
- **Most Common Issue**: You're logged into Google Cloud Console with a different Google account than the one that owns the Firebase project
- **Solution**: 
  - Check which account you're using in Google Cloud Console (top right corner)
  - Log out and log in with the account that created the Firebase project
  - Or add your current account as a member to the project

### 2. Project is in Different Organization
- The project might be under a different Google Workspace organization
- **Solution**: Switch to the correct organization in the account selector

### 3. No Cloud Console Access
- Firebase projects don't automatically grant Cloud Console access
- **Solution**: You need to explicitly enable Cloud Console access or be added as a member

## Solutions

### Solution 1: Direct Link to Cloud Console

Try accessing your project directly:
- **Direct Link**: https://console.cloud.google.com/home/dashboard?project=campus-connect-sistc
- This should take you directly to your project even if it doesn't show in the list

### Solution 2: Enable Cloud Console Access

1. Go to [Firebase Console](https://console.firebase.google.com/project/campus-connect-sistc)
2. Click on **Project Settings** (gear icon)
3. Scroll down to **Your project**
4. Click **View in Google Cloud Console** or **Open in Google Cloud Console**
5. This will open the project in Cloud Console and grant you access

### Solution 3: Add Yourself as a Member

If you have access to Firebase Console but not Cloud Console:

1. Go to [Firebase Console](https://console.firebase.google.com/project/campus-connect-sistc)
2. Click on **Project Settings** → **Users and permissions**
3. Add your email address with appropriate roles
4. Then try accessing Cloud Console again

### Solution 4: Check All Your Google Accounts

1. Open Google Cloud Console: https://console.cloud.google.com/
2. Click on your profile picture (top right)
3. Check which account is selected
4. Try switching to different accounts
5. Look for the project in each account

### Solution 5: Use Firebase Console Instead

You don't actually need Cloud Console for most Firebase operations. You can do everything from Firebase Console:

- **Firestore**: https://console.firebase.google.com/project/campus-connect-sistc/firestore
- **Storage**: https://console.firebase.google.com/project/campus-connect-sistc/storage
- **Authentication**: https://console.firebase.google.com/project/campus-connect-sistc/authentication
- **Hosting**: https://console.firebase.google.com/project/campus-connect-sistc/hosting
- **IAM & Admin**: Available in Firebase Console → Project Settings → Users and permissions

## Verify Project Access

### Check in Firebase Console

1. Go to: https://console.firebase.google.com/project/campus-connect-sistc
2. If you can access this, you have Firebase access
3. Go to **Project Settings** → **Service Accounts**
4. You should see service accounts here

### Check Project Number

Your project details:
- **Project ID**: `campus-connect-sistc`
- **Project Number**: `680423970030`
- **Display Name**: `campus-connect`

## For GitHub Actions (Service Account)

If you're setting up GitHub Actions, you need a **Service Account**, not your personal account:

1. Go to [Firebase Console](https://console.firebase.google.com/project/campus-connect-sistc)
2. **Project Settings** → **Service Accounts**
3. Click **Generate new private key**
4. Download the JSON file
5. Add it to GitHub Secrets as `FIREBASE_SERVICE_ACCOUNT_CAMPUS_CONNECT_SISTC`

The service account will have the permissions needed for deployment.

## Quick Test

Try these direct links:

1. **Cloud Console Dashboard**: https://console.cloud.google.com/home/dashboard?project=campus-connect-sistc
2. **Cloud Console IAM**: https://console.cloud.google.com/iam-admin/iam?project=campus-connect-sistc
3. **Cloud Console APIs**: https://console.cloud.google.com/apis/dashboard?project=campus-connect-sistc

If these links work, you have access! If they ask for permission, you need to be added as a member.

## Still Can't Access?

### Option 1: Use Firebase Console Only
- Most Firebase operations can be done from Firebase Console
- You don't need Cloud Console for basic Firebase usage
- Only needed for advanced IAM management

### Option 2: Request Access
- Contact the project owner
- Ask them to add you as a member with appropriate roles
- Or ask them to generate the service account JSON for you

### Option 3: Create New Project
- If you can't get access, create a new Firebase project
- Update your configuration files with the new project ID
- This is a last resort option

## Important Note

**For GitHub Actions deployment**, you only need:
- The service account JSON (from Firebase Console → Service Accounts)
- You don't need personal Cloud Console access

The service account will handle all the deployment permissions automatically.

