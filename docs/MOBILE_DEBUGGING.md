# Mobile Debugging Guide

## White Screen on Mobile - Troubleshooting

If the app works on PC but shows a white screen on mobile, follow these steps:

### 1. Check Browser Console (Mobile)

**Chrome/Edge on Android:**
1. Connect phone to PC via USB
2. Enable USB Debugging on phone
3. Open Chrome on PC → `chrome://inspect`
4. Select your device and inspect the page
5. Check Console tab for errors

**Safari on iOS:**
1. Enable Web Inspector: Settings → Safari → Advanced → Web Inspector
2. Connect iPhone to Mac via USB
3. Open Safari on Mac → Develop → [Your iPhone] → [Your Site]
4. Check Console for errors

**Alternative - Remote Debugging:**
- Use [Eruda](https://github.com/liriliri/eruda) or [vConsole](https://github.com/Tencent/vConsole) for on-device debugging

### 2. Common Causes

#### Missing Environment Variables
**Symptom:** Error message shows "Firebase configuration missing"

**Solution:**
- For production: Ensure GitHub Secrets are set correctly
- Check `.github/workflows/firebase-hosting-merge.yml` has all required secrets
- Verify secrets are injected during build (check GitHub Actions logs)

#### Service Worker Issues
**Symptom:** App loads but shows cached/old version

**Solution:**
1. Clear browser cache and service workers:
   - Chrome: Settings → Privacy → Clear browsing data → Cached images and files
   - Safari: Settings → Safari → Clear History and Website Data
2. Unregister service worker:
   - Open browser console
   - Run: `navigator.serviceWorker.getRegistrations().then(r => r.forEach(reg => reg.unregister()))`
3. Hard refresh: Hold refresh button → "Empty Cache and Hard Reload"

#### JavaScript Errors
**Symptom:** Console shows errors

**Solution:**
- Check error messages in console
- Look for missing dependencies or API failures
- Verify network connectivity on mobile device

### 3. Quick Debug Steps

1. **Check if error is visible:**
   - The app now shows error messages on screen (not just console)
   - Look for red error boxes with details

2. **Test in different browsers:**
   - Chrome Mobile
   - Safari iOS
   - Firefox Mobile
   - Samsung Internet

3. **Check network:**
   - Ensure mobile device has internet connection
   - Try on WiFi vs mobile data
   - Check if firewall/network blocks Firebase

4. **Verify build:**
   - Check GitHub Actions build logs
   - Ensure environment variables are set
   - Verify build completed successfully

### 4. Enable Debug Mode

Add this to URL to see more info:
```
?debug=true
```

Or add to localStorage:
```javascript
localStorage.setItem('debug', 'true');
```

### 5. Test Production Build Locally

```bash
npm run build
npm run preview
```

Then test on mobile by accessing your PC's IP address:
```
http://[YOUR-PC-IP]:4173
```

### 6. Check Firebase Console

1. Go to Firebase Console → Project Settings
2. Check if API keys are restricted
3. Verify authorized domains include your domain
4. Check if billing is enabled (required for some features)

### 7. Mobile-Specific Issues

#### iOS Safari
- May require HTTPS (not HTTP)
- Check if service workers are supported
- Verify PWA manifest is valid

#### Android Chrome
- Check if WebView is up to date
- Verify permissions (camera, microphone for calls)
- Check if JavaScript is enabled

### 8. Get Help

If issue persists:
1. Take screenshot of error message (now visible on screen)
2. Copy console errors
3. Check network tab for failed requests
4. Note browser and OS version
5. Check if issue occurs on multiple devices

