# Local Testing - Browser Permissions Guide

This guide helps you grant microphone and camera permissions in your browser for local testing of ZEGOCLOUD calling features.

## ⚠️ Important: Use External Browser

**If you're using Cursor's built-in browser preview or any embedded browser in a code editor**, you **must use an external browser** (Chrome, Edge, Firefox, Safari) for testing calling features. Embedded browsers don't support microphone/camera permissions.

### Quick Setup Steps:

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Open the URL shown in the terminal** (usually `http://localhost:5173`) in an **external browser**:
   - **Chrome/Edge**: Copy the URL and paste it in a new tab
   - **Firefox**: Copy the URL and paste it in a new tab
   - **Or**: Press `Ctrl+Click` (Windows) / `Cmd+Click` (Mac) on the localhost link in the terminal

3. **Grant permissions** using the steps below for your browser

## Quick Setup for Local Testing

### Chrome/Edge (Chromium-based browsers)

1. **Open your app in the browser** (usually `http://localhost:5173` or similar)

2. **Click the lock/camera icon** in the address bar (left side of the URL)

3. **Click "Site settings"** or "Permissions"

4. **Set permissions:**
   - **Microphone**: Allow
   - **Camera**: Allow (for video calls)

5. **Refresh the page**

### Firefox

1. **Open your app in the browser**

2. **Click the lock icon** in the address bar

3. **Click "More Information"**

4. **Go to "Permissions" tab**

5. **Set permissions:**
   - **Use the Microphone**: Allow
   - **Use the Camera**: Allow (for video calls)

6. **Refresh the page**

### Safari (macOS)

1. **Open your app in the browser**

2. **Go to Safari menu → Settings → Websites**

3. **Select "Microphone" and "Camera"**

4. **Find your localhost URL and set to "Allow"**

5. **Refresh the page**

## Browser URL Bar Method (Fastest)

**For Chrome/Edge/Firefox:**

1. Look for the **lock icon** or **camera/microphone icon** in the address bar
2. Click it
3. Change permissions from "Ask" or "Block" to **"Allow"**
4. Refresh the page

## Using Browser Developer Tools

**Chrome/Edge:**

1. Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
2. Go to **Console** tab
3. Type this command to check current permissions:
   ```javascript
   navigator.permissions.query({name: 'microphone'}).then(r => console.log('Microphone:', r.state));
   navigator.permissions.query({name: 'camera'}).then(r => console.log('Camera:', r.state));
   ```

## Important Notes

### HTTPS Requirement

- **Localhost is allowed** - You can test with `http://localhost` (no HTTPS needed)
- **For production** - HTTPS is required for microphone/camera access
- **Vite dev server** - Runs on HTTP by default, which works fine for localhost testing

### Permission States

- **"Allow"** - Permissions granted, calls will work
- **"Ask"** - Browser will prompt when needed (works fine)
- **"Block"** - Permissions denied, calls will fail

### Clearing Permissions (if needed)

If you want to reset permissions:

1. **Chrome/Edge**: Settings → Privacy and security → Site Settings → View permissions and data stored across sites → Find localhost → Delete
2. **Firefox**: Settings → Privacy & Security → Permissions → Manage Permissions → Find localhost → Remove
3. Or simply **clear browser data** for localhost

## Testing Your Setup

After granting permissions:

1. **Refresh your browser** (hard refresh: `Ctrl+Shift+R` or `Cmd+Shift+R`)
2. **Try making a call** (voice or video)
3. **Check browser console** - Should not see permission errors
4. **Check for permission prompts** - Should not appear if already granted

## Troubleshooting

### "Microphone/Camera access is required" error

**Solution:**
- Grant permissions using the steps above
- Make sure you clicked "Allow" when the browser prompted
- Refresh the page after granting permissions

### Permissions keep getting blocked

**Solution:**
- Check browser settings → Privacy → Microphone/Camera
- Make sure your browser allows sites to request permissions
- Try a different browser if issue persists
- Clear browser cache and cookies for localhost

### No permission prompt appears

**Solution:**
- Check if permissions are already set (click lock icon in address bar)
- Make sure you're using localhost (not 127.0.0.1 or other IP)
- Try in an incognito/private window (will reset permissions)
- Check browser console for errors

## Quick Command Reference

**Check permissions in console:**
```javascript
// Check microphone
navigator.permissions.query({name: 'microphone'}).then(r => console.log('Mic:', r.state));

// Check camera  
navigator.permissions.query({name: 'camera'}).then(r => console.log('Camera:', r.state));

// Request test (will show current state)
navigator.mediaDevices.getUserMedia({audio: true}).then(stream => {
  console.log('Microphone access granted');
  stream.getTracks().forEach(track => track.stop());
}).catch(err => console.error('Microphone access denied:', err));
```

