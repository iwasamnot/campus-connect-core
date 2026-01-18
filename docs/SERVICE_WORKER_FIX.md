# Service Worker Errors - Fix Guide

## Error 1: Navigation Preload Request Cancelled

**Error Message:**
```
The service worker navigation preload request was cancelled before 'preloadResponse' settled.
```

**Cause:**
- Service worker is trying to use navigation preload, but the response is being cancelled
- This happens when navigation preload is enabled but not properly handled

**Fix Applied:**
- Set `navigationPreload: false` in `vite.config.js`
- This disables navigation preload to prevent the error

**If Error Persists:**
1. **Clear Service Worker Cache:**
   ```javascript
   // Run in browser console
   navigator.serviceWorker.getRegistrations().then(registrations => {
     registrations.forEach(reg => reg.unregister());
   });
   ```

2. **Clear Browser Cache:**
   - Chrome: Settings → Privacy → Clear browsing data → Cached images and files
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

3. **Rebuild the App:**
   ```bash
   npm run build
   ```

## Error 2: Logo Export Not Defined

**Error Message:**
```
Uncaught SyntaxError: Export 'Logo' is not defined in module
```

**Cause:**
- Build process is trying to import Logo as a named export, but it's only exported as default
- Module bundling issue during build

**Fix Applied:**
- Added both default and named export to `Logo.jsx`:
  ```javascript
  export default Logo;
  export { Logo };
  ```

**If Error Persists:**
1. **Clear Build Cache:**
   ```bash
   rm -rf dist
   rm -rf node_modules/.vite
   npm run build
   ```

2. **Check for Circular Dependencies:**
   - Logo component should not import components that import Logo
   - Check all files that import Logo

3. **Rebuild from Scratch:**
   ```bash
   npm run build -- --force
   ```

## Complete Fix Steps

1. **Update Code** (already done):
   - ✅ `vite.config.js` - navigationPreload disabled
   - ✅ `Logo.jsx` - both exports added

2. **Clear Service Worker:**
   ```javascript
   // In browser console
   navigator.serviceWorker.getRegistrations().then(r => r.forEach(reg => reg.unregister()));
   ```

3. **Clear Cache:**
   - Browser cache
   - Service worker cache
   - Build cache (`dist` folder)

4. **Rebuild:**
   ```bash
   npm run build
   ```

5. **Test:**
   - Open app in incognito/private window
   - Check console for errors
   - Verify Logo component loads correctly

## Prevention

- **Navigation Preload:** Keep disabled unless specifically needed
- **Exports:** Use both default and named exports for components that might be imported differently
- **Build Cache:** Clear build cache when making export changes

## Related Files

- `vite.config.js` - Service worker configuration
- `src/components/Logo.jsx` - Logo component exports
- `src/main.jsx` - Service worker registration


