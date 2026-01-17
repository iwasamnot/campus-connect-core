# Cloudinary Storage Setup Guide

This guide will help you set up Cloudinary as an alternative storage solution for your CampusConnect app. Cloudinary offers a generous free tier (25GB storage, 25GB bandwidth/month) which is perfect when Firebase Storage free tier limits are reached.

## Why Cloudinary?

- **Free Tier**: 25GB storage, 25GB bandwidth/month (much more than Firebase's 5GB)
- **Automatic Image Optimization**: Images are automatically optimized for web
- **CDN**: Fast global content delivery
- **Easy Integration**: Simple API, no complex setup
- **Automatic Fallback**: The app will automatically use Cloudinary if Firebase Storage fails

## Step 1: Create a Cloudinary Account

1. Go to [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. Sign up for a free account (no credit card required)
3. Verify your email address

## Step 2: Get Your Cloudinary Credentials

1. After logging in, you'll see your **Cloud Name** on the dashboard
   - Example: `demo` (this is your cloud name)
2. Go to **Settings** → **Upload** → **Upload presets**
3. Click **Add upload preset**
4. Configure the preset:
   - **Preset name**: `campusconnect_upload` (or any name you prefer)
   - **Signing mode**: **Unsigned** (for client-side uploads)
   - **Folder**: `campusconnect` (optional, for organization)
   - **Allowed formats**: Leave empty or specify `jpg,png,gif,pdf,doc,docx`
   - **Max file size**: `10MB` (or your preferred limit)
   - Click **Save**

5. Note down:
   - **Cloud Name**: Found on your dashboard
   - **Upload Preset**: The preset name you just created

## Step 3: Add Environment Variables

### For Local Development (.env file)

Create or update your `.env` file in the project root:

```env
# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset_name_here

# Storage Provider (optional)
# Options: 'firebase', 'cloudinary', or 'auto' (default: 'auto')
# 'auto' will try Firebase first, then fallback to Cloudinary if Firebase fails
VITE_STORAGE_PROVIDER=auto
```

**Example:**
```env
VITE_CLOUDINARY_CLOUD_NAME=demo
VITE_CLOUDINARY_UPLOAD_PRESET=campusconnect_upload
VITE_STORAGE_PROVIDER=auto
```

### For Production (GitHub Secrets / Firebase Hosting)

1. **GitHub Secrets** (if using GitHub Actions):
   - Go to your repository → **Settings** → **Secrets and variables** → **Actions**
   - Add the following secrets:
     - `VITE_CLOUDINARY_CLOUD_NAME`: Your cloud name
     - `VITE_CLOUDINARY_UPLOAD_PRESET`: Your upload preset name
     - `VITE_STORAGE_PROVIDER`: `auto` (or `cloudinary` to use only Cloudinary)

2. **Firebase Hosting** (if deploying via Firebase):
   - Update your build script to include these environment variables
   - Or use Firebase Functions environment config

## Step 4: How It Works

The app now supports **automatic fallback**:

1. **Auto Mode** (default): 
   - Tries Firebase Storage first
   - If Firebase fails (quota exceeded, network error, etc.), automatically falls back to Cloudinary
   - No user intervention needed

2. **Firebase Only Mode**:
   - Set `VITE_STORAGE_PROVIDER=firebase`
   - Only uses Firebase Storage

3. **Cloudinary Only Mode**:
   - Set `VITE_STORAGE_PROVIDER=cloudinary`
   - Only uses Cloudinary

## Step 5: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Try uploading an image in the chat or profile picture
3. Check the browser console - you should see:
   - `Attempting Firebase Storage upload...` (if Firebase is available)
   - `Firebase Storage upload successful` OR
   - `Firebase Storage upload failed, falling back to Cloudinary...`
   - `Cloudinary upload successful`

## Troubleshooting

### "Cloudinary configuration missing" Error

- Make sure you've added the environment variables to your `.env` file
- Restart your development server after adding environment variables
- Check that variable names start with `VITE_` (required for Vite)

### Uploads Still Failing

1. **Check Cloudinary Dashboard**:
   - Go to **Media Library** to see if files are uploading
   - Check **Usage** to see if you've exceeded free tier limits

2. **Check Upload Preset**:
   - Make sure the preset is set to **Unsigned**
   - Verify the preset name matches exactly (case-sensitive)

3. **Check File Size**:
   - Free tier allows up to 10MB per file
   - Larger files require a paid plan

### Firebase Storage Still Being Used

- The app will try Firebase first in `auto` mode
- To force Cloudinary only, set `VITE_STORAGE_PROVIDER=cloudinary`
- Check that Cloudinary credentials are correctly set

## Storage Provider Comparison

| Feature | Firebase (Spark/Free) | Cloudinary (Free) |
|---------|----------------------|-------------------|
| Storage | 5GB | 25GB |
| Bandwidth | 1GB/day | 25GB/month |
| File Size Limit | 5MB (your rules) | 10MB |
| Image Optimization | Manual | Automatic |
| CDN | Yes | Yes |
| Cost | Free | Free |

## Best Practices

1. **Use Auto Mode**: Let the app automatically choose the best storage provider
2. **Monitor Usage**: Check both Firebase and Cloudinary dashboards regularly
3. **Optimize Images**: Cloudinary automatically optimizes, but you can compress before upload
4. **Set Limits**: Keep file size limits reasonable (5-10MB max)

## Need Help?

- Cloudinary Docs: [https://cloudinary.com/documentation](https://cloudinary.com/documentation)
- Cloudinary Support: [https://support.cloudinary.com](https://support.cloudinary.com)
- Check browser console for detailed error messages

## Security Notes

⚠️ **Important**: The upload preset should be set to **Unsigned** for client-side uploads. This means:
- Anyone with your cloud name and preset can upload files
- Set appropriate file type and size limits in the preset
- Consider using signed uploads for production (requires server-side code)
- Monitor your Cloudinary dashboard for unusual activity

For production, consider implementing server-side signed uploads for better security.
