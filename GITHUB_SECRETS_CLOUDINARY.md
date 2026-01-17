# Adding Cloudinary Secrets to GitHub

This guide shows you how to add Cloudinary credentials as GitHub Secrets for production builds.

## Your Cloudinary Credentials

Based on your setup:
- **Cloud Name**: `dngk8azjq`
- **Upload Preset**: `CAMPUSCONNECT`

## Steps to Add GitHub Secrets

1. **Go to your GitHub repository**
   - Navigate to: `https://github.com/iwasamnot/campus-connect-core`

2. **Open Settings**
   - Click on the **Settings** tab (top menu)

3. **Go to Secrets**
   - In the left sidebar, click **Secrets and variables**
   - Then click **Actions**

4. **Add New Secrets**
   - Click **New repository secret** button
   - Add each secret one by one:

### Secret 1: Cloudinary Cloud Name
- **Name**: `VITE_CLOUDINARY_CLOUD_NAME`
- **Value**: `dngk8azjq`
- Click **Add secret**

### Secret 2: Cloudinary Upload Preset
- **Name**: `VITE_CLOUDINARY_UPLOAD_PRESET`
- **Value**: `CAMPUSCONNECT`
- Click **Add secret**

### Secret 3: Storage Provider (Optional)
- **Name**: `VITE_STORAGE_PROVIDER`
- **Value**: `auto` (or `cloudinary` to use only Cloudinary)
- Click **Add secret**

## Quick Copy-Paste Guide

Here are the exact values to add:

```
Secret Name: VITE_CLOUDINARY_CLOUD_NAME
Secret Value: dngk8azjq

Secret Name: VITE_CLOUDINARY_UPLOAD_PRESET
Secret Value: CAMPUSCONNECT

Secret Name: VITE_STORAGE_PROVIDER
Secret Value: auto
```

## Verify Secrets Are Added

After adding, you should see these secrets in your list:
- ✅ `VITE_CLOUDINARY_CLOUD_NAME`
- ✅ `VITE_CLOUDINARY_UPLOAD_PRESET`
- ✅ `VITE_STORAGE_PROVIDER` (optional)

## How It Works

When GitHub Actions builds your app:
1. The secrets are automatically available as environment variables
2. Vite will use them during the build process
3. The built app will have Cloudinary configured
4. The app will automatically use Cloudinary if Firebase Storage fails

## Testing

After adding the secrets:
1. Push a commit to trigger GitHub Actions
2. Check the Actions tab to see the build
3. Once deployed, test uploading an image
4. Check browser console to see which storage provider is used

## Notes

- Secrets are encrypted and only visible during builds
- Never commit secrets to your code repository
- The `.env` file is for local development only
- Production uses GitHub Secrets automatically

## Troubleshooting

### Build Still Fails
- Make sure secret names match exactly (case-sensitive)
- Verify the values are correct (no extra spaces)
- Check that secrets are added to the correct repository

### Images Not Uploading
- Check browser console for error messages
- Verify Cloudinary preset is set to "Unsigned"
- Make sure the preset name matches exactly (case-sensitive)
