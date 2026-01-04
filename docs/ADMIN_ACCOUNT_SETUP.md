# Admin Account Setup - Step by Step Guide

## Problem: No Document Option in Firestore

If you can't see the option to create a document in Firestore, follow these steps:

## Method 1: Create Admin Account via Firebase Console (Recommended)

### Step 1: Create Admin User in Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `campus-connect-sistc`
3. Click on **Authentication** in the left sidebar
4. Go to the **Users** tab
5. Click **Add user** button (top of the page)
6. Enter:
   - **Email**: `admin@admin.com`
   - **Password**: `admin`
   - **Disable email verification** (uncheck if checked)
7. Click **Add user**
8. **Copy the User UID** - You'll see it in the users list (it's a long string like `abc123xyz...`)

### Step 2: Create User Document in Firestore

1. In Firebase Console, click on **Firestore Database** in the left sidebar
2. Click on the **Data** tab (if not already selected)
3. Look for the **users** collection:
   - If it doesn't exist, you'll need to create it
   - Click **Start collection** (if no collections exist)
   - Collection ID: `users`
   - Click **Next**
4. To add a document:
   - Click **Add document** button (or the **+** icon)
   - **Document ID**: Paste the User UID you copied from Authentication
   - Click **Next**
5. Add the following fields:
   - Field: `email`
     - Type: `string`
     - Value: `admin@admin.com`
   - Field: `role`
     - Type: `string`
     - Value: `admin`
   - Field: `createdAt`
     - Type: `string`
     - Value: `2024-01-01T00:00:00.000Z` (or current date)
6. Click **Save**

## Method 2: Use the App to Create Admin (Temporary Workaround)

If you can't create the document manually, temporarily enable admin registration:

1. Edit `src/components/Login.jsx`
2. Temporarily allow admin registration by modifying the register function
3. Register with `admin@admin.com` / `admin` and select admin role
4. After creating the account, remove the admin registration option again

## Method 3: Use Firebase CLI (Advanced)

If you have Firebase CLI installed:

```bash
firebase firestore:set users/ADMIN_UID '{"email":"admin@admin.com","role":"admin","createdAt":"2024-01-01T00:00:00.000Z"}'
```

Replace `ADMIN_UID` with the actual UID from Authentication.

## Verify Admin Account

After setup:
1. Try logging in with `admin@admin.com` / `admin`
2. You should see the Admin Panel with:
   - Audit Logs
   - Users Management
3. Check that you can delete messages and users

## Troubleshooting

### "No option to create document"
- Make sure you're in the **Data** tab, not the **Rules** or **Indexes** tab
- Look for a **+** button or **Add document** button
- If using Firestore in Native mode, you might need to create the collection first

### "Permission denied"
- Check that your Firestore rules allow creating user documents
- Make sure you're authenticated in Firebase Console

### "User not found" when logging in
- The user exists in Authentication but not in Firestore
- Create the Firestore document with the correct UID

### "Can't find users collection"
- Create it manually:
  1. Click **Start collection**
  2. Collection ID: `users`
  3. Add the admin document as described above

