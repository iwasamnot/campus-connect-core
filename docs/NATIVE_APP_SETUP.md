# Native Mobile App Setup - Complete Guide

## ✅ Setup Complete!

Your CampusConnect app is now configured for native iOS and Android development using Capacitor.

## 📱 What's Been Set Up:

1. ✅ **Capacitor Core** - Installed and configured
2. ✅ **iOS Platform** - Added and synced
3. ✅ **Android Platform** - Added and synced
4. ✅ **Build Scripts** - Added to package.json
5. ✅ **Configuration** - capacitor.config.json created

## 🚀 Quick Start Commands:

### Build and Sync:
```bash
npm run cap:sync
```
This builds your app and syncs it to both iOS and Android platforms.

### Open in Native IDEs:
```bash
# iOS (requires Mac with Xcode)
npm run cap:ios

# Android (requires Android Studio)
npm run cap:android
```

## 📋 Next Steps:

### For iOS Development:

1. **Install Xcode:**
   - Download from Mac App Store (free)
   - Install Command Line Tools: `xcode-select --install`

2. **Install CocoaPods:**
   ```bash
   sudo gem install cocoapods
   cd ios/App
   pod install
   cd ../..
   ```

3. **Open in Xcode:**
   ```bash
   npm run cap:ios
   ```

4. **Configure Signing:**
   - In Xcode, select your project
   - Go to "Signing & Capabilities"
   - Select your Apple Developer Team
   - Xcode will automatically manage certificates

5. **Run on Simulator:**
   - Select a simulator from Xcode
   - Click the Play button

6. **Run on Device:**
   - Connect your iPhone via USB
   - Select your device in Xcode
   - Click Play (you may need to trust the developer certificate on your device)

### For Android Development:

1. **Install Android Studio:**
   - Download from https://developer.android.com/studio
   - Install Android SDK (API 33+ recommended)
   - Install Java JDK 11 or higher

2. **Set Environment Variables:**
   ```bash
   # Windows (PowerShell)
   $env:ANDROID_HOME = "C:\Users\YourName\AppData\Local\Android\Sdk"
   $env:PATH += ";$env:ANDROID_HOME\tools;$env:ANDROID_HOME\platform-tools"
   
   # Mac/Linux
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
   ```

3. **Open in Android Studio:**
   ```bash
   npm run cap:android
   ```

4. **Run on Emulator:**
   - Create an Android Virtual Device (AVD) in Android Studio
   - Click Run button

5. **Run on Device:**
   - Enable USB Debugging on your Android device
   - Connect via USB
   - Click Run in Android Studio

## 🔥 Firebase Configuration for Native Apps:

### iOS Setup:

1. **Download GoogleService-Info.plist:**
   - Go to Firebase Console → Project Settings
   - Add iOS app (if not already added)
   - Download `GoogleService-Info.plist`

2. **Add to Xcode:**
   - Open `ios/App/App.xcworkspace` in Xcode
   - Drag `GoogleService-Info.plist` into `App` folder
   - Make sure "Copy items if needed" is checked
   - Add to target: `App`

### Android Setup:

1. **Download google-services.json:**
   - Go to Firebase Console → Project Settings
   - Add Android app (if not already added)
   - Package name: `com.campusconnect.app`
   - Download `google-services.json`

2. **Add to Android:**
   - Copy `google-services.json` to `android/app/` folder
   - The build.gradle files are already configured

## 📦 Building for Production:

### iOS (App Store):

1. **Archive:**
   ```bash
   npm run cap:ios
   # In Xcode: Product → Archive
   ```

2. **Upload:**
   - Xcode will open Organizer
   - Click "Distribute App"
   - Follow the wizard to upload to App Store Connect

3. **Submit:**
   - Go to App Store Connect
   - Complete app information
   - Submit for review

### Android (Google Play):

1. **Generate Signed Bundle:**
   ```bash
   npm run cap:android
   # In Android Studio: Build → Generate Signed Bundle / APK
   ```

2. **Create Keystore (first time):**
   - Create a new keystore
   - Save credentials securely!

3. **Upload to Play Console:**
   - Go to Google Play Console
   - Create new app (if first time)
   - Upload AAB file
   - Complete store listing
   - Submit for review

## 🔧 Development Workflow:

### After Making Code Changes:

1. **Build your web app:**
   ```bash
   npm run build
   ```

2. **Sync to native platforms:**
   ```bash
   npm run cap:sync
   ```

3. **Or use the combined command:**
   ```bash
   npm run cap:sync
   ```

### Adding Native Plugins:

```bash
npm install @capacitor/camera
npx cap sync
```

### Updating Capacitor:

```bash
npm install @capacitor/core@latest @capacitor/cli@latest
npm install @capacitor/ios@latest @capacitor/android@latest
npm run cap:update
```

## 📱 Testing:

### Test on Simulator/Emulator:
- iOS: Use Xcode simulator
- Android: Use Android Studio emulator

### Test on Real Device:
- iOS: Connect iPhone, select in Xcode, run
- Android: Enable USB debugging, connect, run

### Test PWA:
- Deploy to Firebase Hosting
- Open on mobile browser
- Install as PWA

## 🐛 Troubleshooting:

### iOS Issues:

**"No such module 'Capacitor'"**
```bash
cd ios/App
pod install
cd ../..
```

**Build errors:**
- Clean build folder: Product → Clean Build Folder
- Delete DerivedData
- Re-run pod install

### Android Issues:

**Gradle sync failed:**
```bash
cd android
./gradlew clean
cd ..
npm run cap:sync
```

**Build errors:**
- In Android Studio: File → Invalidate Caches / Restart
- Clean project: Build → Clean Project

### General Issues:

**Assets not updating:**
```bash
npm run build
npm run cap:sync
```

**Plugin not working:**
- Check if plugin is installed: `npm list`
- Sync again: `npm run cap:sync`
- Rebuild native project

## 📚 Resources:

- [Capacitor Docs](https://capacitorjs.com/docs)
- [iOS Setup Guide](https://capacitorjs.com/docs/ios)
- [Android Setup Guide](https://capacitorjs.com/docs/android)
- [Firebase for Mobile](https://firebase.google.com/docs)

## 🎯 Current Status:

✅ Capacitor installed and configured
✅ iOS platform added
✅ Android platform added
✅ Build scripts added
✅ Configuration files created

## ⚠️ Important Notes:

1. **iOS requires Mac** - You cannot build iOS apps on Windows/Linux
2. **Android works on all platforms** - Windows, Mac, Linux
3. **Always sync after changes** - Run `npm run cap:sync` after code changes
4. **Keep native folders in sync** - Don't manually edit native code unless necessary
5. **Firebase config required** - Add Firebase config files before building

## 🚀 Ready to Build!

Your app is ready for native development. Choose your platform and start building!

```bash
# For iOS (Mac only)
npm run cap:ios

# For Android (All platforms)
npm run cap:android
```

