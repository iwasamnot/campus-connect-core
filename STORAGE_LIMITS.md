# Firebase Storage Limits & Free Tier Management

## Free Tier Limits (Blaze Plan)

Your Firebase Storage is configured with **strict limits** to stay within the free tier:

- **5 GB** total storage (FREE)
- **1 GB/day** downloads (FREE)
- **20,000 operations/day** (FREE)

**You will only be charged if you exceed these limits.**

## Current File Size Limits

To stay within the free tier, we've set strict file size limits:

### Message Files (Campus Chat, Groups, Private Chats)
- **Maximum: 5MB per file**
- Allowed types: Images, PDFs, Word documents
- **Reduced from 10MB** to conserve storage

### Profile Pictures
- **Maximum: 2MB per file**
- **Reduced from 5MB** to conserve storage
- Users should compress images before uploading

## Storage Rules Enforcement

All limits are enforced at multiple levels:

1. **Storage Rules** (`storage.rules`) - Server-side enforcement
   - Files over limit are rejected by Firebase
   - Cannot be bypassed by users

2. **App Validation** - Client-side validation
   - Files are checked before upload
   - Users see error messages immediately

3. **File Type Restrictions**
   - Only allowed file types can be uploaded
   - Prevents unnecessary storage usage

## Monitoring Your Usage

### Check Storage Usage

1. Go to [Firebase Console](https://console.firebase.google.com/project/campus-connect-sistc/storage)
2. Click on **Usage** tab
3. You'll see:
   - Total storage used
   - Daily download bandwidth
   - Number of operations

### Check Billing

1. Go to [Firebase Console Billing](https://console.firebase.google.com/project/campus-connect-sistc/settings/usage)
2. View your usage and costs
3. Set up billing alerts (recommended)

### Set Up Billing Alerts

**Highly Recommended!** Set up alerts to avoid unexpected charges:

1. Go to [Google Cloud Console](https://console.cloud.google.com/billing)
2. Select your project
3. Go to **Budgets & alerts**
4. Create a budget:
   - Set limit to **$1** (or $0 if you want to be notified of any charges)
   - Get email alerts when approaching limit
   - This way you'll know if you're about to exceed free tier

## Best Practices to Stay Within Free Tier

### 1. Compress Images Before Upload
- Use image compression tools
- Reduce image quality if needed
- Use WebP format when possible (smaller file size)

### 2. Delete Old Files
- Regularly clean up old/unused files
- Admins can delete files from Storage console
- Consider auto-deleting files older than X days

### 3. Monitor Usage Regularly
- Check storage usage weekly
- Watch for unusual spikes
- Delete unnecessary files immediately

### 4. Educate Users
- Tell users about file size limits
- Encourage image compression
- Remind users to delete old files

### 5. Set Up Alerts
- Enable billing alerts (see above)
- Get notified before exceeding limits
- Take action before charges occur

## What Happens If You Exceed Limits?

### Storage (5GB)
- **First 5GB**: FREE
- **After 5GB**: $0.026 per GB/month
- Example: 6GB total = $0.026/month (very cheap!)

### Downloads (1GB/day)
- **First 1GB/day**: FREE
- **After 1GB/day**: $0.12 per GB
- Example: 2GB downloaded in a day = $0.12

### Operations (20,000/day)
- **First 20,000/day**: FREE
- **After 20,000/day**: $0.05 per 10,000 operations
- Example: 30,000 operations = $0.05

## Current Configuration

### File Size Limits
- **Messages**: 5MB max
- **Profile Pictures**: 2MB max
- **Group Files**: 5MB max
- **Private Chat Files**: 5MB max

### Allowed File Types
- Images: `image/*` (JPEG, PNG, GIF, WebP, etc.)
- Documents: PDF, Word (.doc, .docx)

### Rate Limiting
- No automatic rate limiting (users can upload multiple files)
- Consider adding daily upload limits per user if needed

## Recommendations

1. **Set up billing alerts** - Most important!
2. **Monitor usage weekly** - Check Firebase Console
3. **Compress images** - Use tools like TinyPNG, Squoosh
4. **Delete old files** - Clean up regularly
5. **Educate users** - Tell them about limits

## Emergency: Approaching Limits

If you're approaching the free tier limits:

1. **Immediately delete old/unused files**
2. **Reduce file size limits further** (edit `storage.rules`)
3. **Disable file uploads temporarily** (if needed)
4. **Contact support** if you need help

## Storage Rules Location

Storage rules are in `storage.rules` and are automatically deployed via GitHub Actions.

To update limits:
1. Edit `storage.rules`
2. Commit and push to GitHub
3. Rules will deploy automatically

## Direct Links

- **Storage Console**: https://console.firebase.google.com/project/campus-connect-sistc/storage
- **Billing & Usage**: https://console.firebase.google.com/project/campus-connect-sistc/settings/usage
- **Google Cloud Billing**: https://console.cloud.google.com/billing

