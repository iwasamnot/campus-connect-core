# Admin Account Setup Guide

## Problem: Cannot Login as Admin

If you're unable to login as admin, it's likely because the admin account doesn't exist yet. Follow these steps to create it:

## Step 1: Create Admin Account in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `campus-connect-sistc`
3. Go to **Authentication** → **Users** tab
4. Click **Add user**
5. Enter:
   - **Email**: `admin@sistc.app`
   - **Password**: (set a secure password)
6. Click **Add user**

## Step 2: Create Admin User Document in Firestore

1. In Firebase Console, go to **Firestore Database**
2. Click on the `users` collection
3. Click **Add document**
4. Set the **Document ID** to match the User UID from Authentication:
   - Go back to **Authentication** → **Users**
   - Copy the UID of the `admin@sistc.app` user
   - Use this UID as the document ID
5. Add the following fields:
   - `email` (string): `admin@sistc.app`
   - `role` (string): `admin`
   - `emailVerified` (boolean): `true`
   - `createdAt` (string): Current timestamp (or use Firestore timestamp)

## Alternative: Create Admin Account via Registration (Temporary)

If you need to create the admin account quickly, you can temporarily allow admin registration:

1. In `src/components/Login.jsx`, temporarily allow admin registration
2. Register with:
   - Email: `admin@sistc.app`
   - Password: (set a secure password)
   - Role: `admin`
3. After creating the account, you can remove the admin registration option again

## Verify Admin Account

After setup, you should be able to:
1. Login with `admin@sistc.app` and your password
2. See the Admin Panel with Audit Logs and Users Management
3. Have full admin privileges

## Troubleshooting

- **"User not found"**: The account doesn't exist in Firebase Authentication
- **"Wrong password"**: Check the password in Firebase Console
- **Login works but shows Student view**: The Firestore user document is missing or doesn't have `role: 'admin'`
- **Permission denied**: Check Firestore security rules allow reading user documents

