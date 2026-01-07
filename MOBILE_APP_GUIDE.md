# Mobile App Guide for CampusConnect

This guide explains how to create mobile apps from your CampusConnect web application.

## Option 1: Progressive Web App (PWA) - ✅ Already Set Up!

**Status**: ✅ Configured and ready to use!

### What is a PWA?
A Progressive Web App (PWA) allows your web app to be installed on mobile devices like a native app. Users can add it to their home screen and use it offline.

### How to Use:

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Deploy to Firebase Hosting:**
   ```bash
   firebase deploy
   ```

3. **Install on Mobile Devices:**
   - **Android**: Open the website in Chrome → Menu (3 dots) → "Add to Home screen"
   - **iOS**: Open the website in Safari → Share button → "Add to Home Screen"

### Features:
- ✅ Works on both iOS and Android
- ✅ Can be installed from the browser
- ✅ Offline support (cached resources)
- ✅ App-like experience (standalone display)
- ✅ Push notifications (can be added)
- ✅ No app store submission needed

### Testing Locally:
```bash
npm run build
npm run preview
```
Then open on your mobile device and test the install prompt.

---

## Option 2: Native Apps with Capacitor (iOS & Android)

Capacitor wraps your web app in a native container, allowing you to publish to App Store and Google Play.

### Setup Instructions:

#### Step 1: Install Capacitor
```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android
```

#### Step 2: Initialize Capacitor
```bash
npx cap init
```
When prompted:
- **App name**: CampusConnect
- **App ID**: com.campusconnect.app (or your preferred bundle ID)
- **Web dir**: dist

#### Step 3: Build Your App
```bash
npm run build
```

#### Step 4: Add Platforms
```bash
npx cap add ios
npx cap add android
```

#### Step 5: Sync Files
```bash
npx cap sync
```

#### Step 6: Open in Native IDEs
```bash
# For iOS (requires Mac and Xcode)
npx cap open ios

# For Android (requires Android Studio)
npx cap open android
```

### Required Setup:

#### iOS Setup:
1. Install **Xcode** from Mac App Store
2. Install **CocoaPods**: `sudo gem install cocoapods`
3. In Xcode:
   - Select your project
   - Go to "Signing & Capabilities"
   - Select your development team
   - Configure bundle identifier

#### Android Setup:
1. Install **Android Studio**
2. Install **Java JDK 11+**
3. Set up Android SDK
4. In Android Studio:
   - Open `android` folder
   - Configure signing keys
   - Set up build variants

### Firebase Configuration for Native Apps:

You'll need to add Firebase configuration files:

#### iOS:
1. Download `GoogleService-Info.plist` from Firebase Console
2. Add it to `ios/App/App/` folder in Xcode

#### Android:
1. Download `google-services.json` from Firebase Console
2. Add it to `android/app/` folder

### Building for Production:

#### iOS:
```bash
npx cap sync ios
# Then in Xcode: Product → Archive
```

#### Android:
```bash
npx cap sync android
cd android
./gradlew assembleRelease
```

### Publishing:

#### App Store (iOS):
1. Archive in Xcode
2. Upload via Xcode or App Store Connect
3. Submit for review

#### Google Play (Android):
1. Build signed APK/AAB
2. Upload to Google Play Console
3. Submit for review

---

## Option 3: React Native (Full Native Rewrite)

If you want a fully native experience, you would need to rewrite the app in React Native. This is more work but provides the best performance.

### Considerations:
- ⚠️ Requires rewriting all components
- ⚠️ Different navigation system
- ⚠️ Different styling approach
- ✅ Best performance
- ✅ Full native features access

---

## Recommended Approach:

1. **Start with PWA** (already set up) - Quick, works everywhere
2. **Add Capacitor** if you need App Store distribution
3. **Consider React Native** only if you need maximum performance

---

## Current PWA Features:

✅ **Manifest configured** - App metadata and icons
✅ **Service Worker** - Offline caching
✅ **Installable** - Can be added to home screen
✅ **Responsive** - Works on all screen sizes
✅ **Theme color** - Matches your brand

## Next Steps to Enhance PWA:

1. **Add Push Notifications:**
   ```bash
   npm install web-push
   ```

2. **Create App Icons:**
   - Generate 192x192 and 512x512 PNG icons
   - Replace `/logo.png` with proper icon sizes

3. **Add Splash Screens:**
   - Create splash screen images for iOS
   - Add to manifest

4. **Test on Real Devices:**
   - Test install flow
   - Test offline functionality
   - Test push notifications

---

## Troubleshooting:

### PWA not installing?
- Ensure you're using HTTPS (required for PWA)
- Check browser console for errors
- Verify manifest.json is accessible

### Capacitor build fails?
- Ensure all dependencies are installed
- Run `npx cap sync` after any changes
- Check native IDE console for errors

### Firebase not working in native apps?
- Ensure Firebase config files are added
- Check Firebase SDK versions match
- Verify bundle IDs match Firebase project

---

## Resources:

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Firebase for Mobile](https://firebase.google.com/docs)

---

## Quick Commands Reference:

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Sync Capacitor (after changes)
npx cap sync

# Open in native IDE
npx cap open ios
npx cap open android

# Deploy to Firebase
firebase deploy
```

