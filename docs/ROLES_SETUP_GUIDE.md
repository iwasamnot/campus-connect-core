# Roles Setup Guide

This guide covers two types of roles:
1. **Service Account IAM Roles** (for GitHub Actions deployment)
2. **Application User Roles** (admin vs student in the app)

## Part 1: Service Account IAM Roles (For GitHub Actions)

Your service account needs specific IAM roles to deploy to Firebase. Here's how to set them up:

### Required Roles

Your service account needs these roles:
1. **Firebase Admin** - For deploying Firestore rules, Storage rules, and Hosting
2. **Service Usage Admin** - For enabling Firebase APIs (if not already enabled)
3. **Storage Admin** - For deploying Storage rules

### Method 1: Using Firebase Console (Easiest)

1. Go to [Firebase Console](https://console.firebase.google.com/project/campus-connect-sistc)
2. Navigate to **Project Settings** → **Service Accounts**
3. You'll see your service account listed
4. Click on the service account email (or create one if needed)
5. This will take you to Google Cloud Console IAM page
6. Click **Edit** (pencil icon) next to your service account
7. Click **Add Another Role**
8. Add these roles one by one:
   - `Firebase Admin` (roles/firebase.admin)
   - `Service Usage Admin` (roles/serviceusage.serviceUsageAdmin)
   - `Storage Admin` (roles/storage.admin)
9. Click **Save**

### Method 2: Using Google Cloud Console Direct Link

1. Go directly to IAM page: https://console.cloud.google.com/iam-admin/iam?project=campus-connect-sistc
2. Find your service account in the list
3. Click **Edit** (pencil icon)
4. Click **Add Another Role**
5. Add the three roles mentioned above
6. Click **Save**

### Method 3: Using gcloud CLI (If Installed)

If you have gcloud CLI installed and authenticated:

```bash
# Replace YOUR_SERVICE_ACCOUNT_EMAIL with your actual service account email
# You can find it in Firebase Console → Project Settings → Service Accounts

# Grant Firebase Admin role
gcloud projects add-iam-policy-binding campus-connect-sistc \
  --member="serviceAccount:YOUR_SERVICE_ACCOUNT_EMAIL" \
  --role="roles/firebase.admin"

# Grant Service Usage Admin role
gcloud projects add-iam-policy-binding campus-connect-sistc \
  --member="serviceAccount:YOUR_SERVICE_ACCOUNT_EMAIL" \
  --role="roles/serviceusage.serviceUsageAdmin"

# Grant Storage Admin role
gcloud projects add-iam-policy-binding campus-connect-sistc \
  --member="serviceAccount:YOUR_SERVICE_ACCOUNT_EMAIL" \
  --role="roles/storage.admin"
```

### Finding Your Service Account Email

1. Go to [Firebase Console](https://console.firebase.google.com/project/campus-connect-sistc/settings/serviceaccounts/adminsdk)
2. You'll see a service account listed (usually ends with `@appspot.gserviceaccount.com` or `@campus-connect-sistc.iam.gserviceaccount.com`)
3. Copy the email address
4. Use this email when adding roles

### Alternative: Create New Service Account with Roles

If you need to create a new service account:

1. Go to [Firebase Console](https://console.firebase.google.com/project/campus-connect-sistc/settings/serviceaccounts/adminsdk)
2. Click **Generate new private key**
3. This creates a service account and downloads the JSON
4. Then add the roles using Method 1 or 2 above

### Verify Roles Are Set

1. Go to IAM page: https://console.cloud.google.com/iam-admin/iam?project=campus-connect-sistc
2. Find your service account
3. Check that it has:
   - ✅ Firebase Admin
   - ✅ Service Usage Admin
   - ✅ Storage Admin

## Part 2: Application User Roles (Admin vs Student)

Your application has two user roles:

### Student Role

- **Default role** for all registered users
- **Email format**: Must start with "s20" and contain "@sistc.edu.au" or "@sistc.nsw.edu.au"
- **Examples**: 
  - `s2012345@sistc.edu.au`
  - `s20230091@sistc.nsw.edu.au`
- **Permissions**:
  - Can send messages
  - Can create groups
  - Can use private chat
  - Can save messages
  - Can schedule messages
  - Email verification required

### Admin Role

- **Special role** for administrators
- **Email format**: Must start with "admin" and contain "@campusconnect"
- **Examples**: 
  - `admin1@campusconnect.com`
  - `admin2@campusconnect.com`
- **Permissions**:
  - All student permissions PLUS:
  - Access to Admin Dashboard
  - Manage users (view, edit, verify emails)
  - View analytics
  - Manage reports
  - View audit logs
  - Delete messages
  - Pin/unpin messages
  - No email verification required

### How to Create Admin Account

See `ADMIN_ACCOUNT_SETUP.md` for detailed instructions. Quick steps:

1. Go to [Firebase Console](https://console.firebase.google.com/project/campus-connect-sistc/authentication/users)
2. Click **Add user**
3. Enter email (must start with "admin" and contain "@campusconnect")
4. Set a password
5. After creation, go to Firestore Database
6. Navigate to `users` collection
7. Find the user document (by UID)
8. Set `role: "admin"` and `emailVerified: true`

### How to Change User Role

**For Admins (in the app)**:
1. Go to Admin Dashboard
2. Navigate to Users Management
3. Find the user
4. Click Edit
5. Change the role field
6. Save

**For Firebase Console**:
1. Go to Firestore Database
2. Navigate to `users` collection
3. Find the user document
4. Edit the `role` field
5. Set to `"admin"` or `"student"`

## Troubleshooting

### Issue: Service Account Can't Deploy

**Error**: "Permission denied to get service [firestore.googleapis.com]"

**Solution**: 
1. Grant **Service Usage Admin** role to your service account
2. Wait a few minutes for permissions to propagate
3. Try deployment again

### Issue: Can't Access IAM Page

**Solution**:
1. Try direct link: https://console.cloud.google.com/iam-admin/iam?project=campus-connect-sistc
2. Or enable Cloud Console access from Firebase Console (see `CLOUD_CONSOLE_ACCESS.md`)
3. Make sure you're logged in with the correct Google account

### Issue: User Can't Access Admin Features

**Solution**:
1. Verify the user's email format (must start with "admin" and contain "@campusconnect")
2. Check Firestore `users` collection - ensure `role: "admin"`
3. User may need to log out and log back in
4. Clear browser cache

### Issue: Student Can't Verify Email

**Solution**:
1. Check email format (must be @sistc.edu.au or @sistc.nsw.edu.au)
2. Check spam folder
3. Admin can manually verify in Users Management
4. Or set `emailVerified: true` in Firestore

## Quick Reference

### Service Account Roles (for GitHub Actions)
- `roles/firebase.admin` - Firebase Admin
- `roles/serviceusage.serviceUsageAdmin` - Service Usage Admin
- `roles/storage.admin` - Storage Admin

### Application User Roles
- `"student"` - Default role, email verification required
- `"admin"` - Admin role, no email verification, full access

### Direct Links
- **Firebase Console**: https://console.firebase.google.com/project/campus-connect-sistc
- **Service Accounts**: https://console.firebase.google.com/project/campus-connect-sistc/settings/serviceaccounts/adminsdk
- **IAM Page**: https://console.cloud.google.com/iam-admin/iam?project=campus-connect-sistc
- **Firestore Users**: https://console.firebase.google.com/project/campus-connect-sistc/firestore/data/~2Fusers

## Need More Help?

- **Service Account Issues**: See `GITHUB_ACTIONS_SETUP.md`
- **Cloud Console Access**: See `CLOUD_CONSOLE_ACCESS.md`
- **Admin Account Setup**: See `ADMIN_ACCOUNT_SETUP.md`

