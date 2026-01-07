# Project Verification Guide

This guide helps you find and verify your Firebase project `campus-connect-sistc`.

## Your Project Details

Based on your configuration:
- **Project ID**: `campus-connect-sistc`
- **Project Number**: `680423970030`
- **Display Name**: `campus-connect` (may vary)

## How to Find Your Project

### Option 1: Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. **If you see a project list:**
   - Look for `campus-connect` or `campus-connect-sistc`
   - Click on it to open
3. **If you don't see any projects:**
   - You might be logged in with a different Google account
   - Check if you're using the correct Google account
   - Try logging out and logging back in
4. **If you see "No projects":**
   - The project might be in a different Google account
   - Check all your Google accounts
   - Or the project might have been deleted (unlikely)

### Option 2: Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project selector at the top
3. Search for `campus-connect-sistc` or `campus-connect`
4. Select the project

### Option 3: Check Project Access

If you can't see the project, you might not have access:

1. **Check if you're the owner:**
   - Ask the project owner to verify your access
   - Or check if you're using the correct Google account

2. **Verify your email:**
   - The project might be under a different email
   - Check all Google accounts you have access to

## Verify Project Configuration

### Check Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (if visible)
3. Go to **Project Settings** (gear icon)
4. Verify:
   - **Project ID**: Should be `campus-connect-sistc`
   - **Project Number**: Should be `680423970030`

### Check Your Local Configuration

Your project is configured in:
- `src/firebaseConfig.js` - Contains project ID: `campus-connect-sistc`
- `.firebaserc` - Firebase project configuration
- `firebase.json` - Firebase services configuration

## Quick Verification Commands

If you have Firebase CLI installed locally:

```bash
# List all projects you have access to
firebase projects:list

# Use the specific project
firebase use campus-connect-sistc

# Verify current project
firebase projects:list
```

## Common Issues

### Issue: "Project not found"
**Solution**: 
- Verify you're logged in with the correct Google account
- Check if the project exists in Firebase Console
- Verify the project ID is correct: `campus-connect-sistc`

### Issue: "Permission denied"
**Solution**:
- You might not have access to the project
- Ask the project owner to grant you access
- Or create a new Firebase project

### Issue: "Can't see project in list"
**Solution**:
- Try refreshing the page
- Clear browser cache
- Try a different browser
- Check if you're in the correct organization/account

## Creating a New Project (If Needed)

If you can't find the project and need to create a new one:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project** or **Create a project**
3. Enter project name: `campus-connect` or `campus-connect-sistc`
4. Follow the setup wizard
5. Update your configuration:
   - Update `src/firebaseConfig.js` with new project details
   - Update `.firebaserc` with new project ID
   - Update GitHub Secrets with new project configuration

## Verify Project is Active

Check if the project is active:
1. Go to Firebase Console
2. Select your project
3. Check the project status (should be "Active")
4. Verify services are enabled:
   - Authentication
   - Firestore Database
   - Storage
   - Hosting

## Need Help?

If you still can't find your project:
1. Check which Google account you're using
2. Verify the project ID: `campus-connect-sistc`
3. Contact the project owner for access
4. Or create a new project and update the configuration

