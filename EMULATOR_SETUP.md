# Firebase Emulator Setup Guide

## Quick Start

### 1. Enable Emulator Mode
Create a `.env.local` file in the root directory with:
```
VITE_USE_EMULATOR=true
```

### 2. Start the Emulators
```bash
npm run emulators
```

This will start:
- **Firestore Emulator**: http://localhost:8080
- **Auth Emulator**: http://localhost:9099
- **Storage Emulator**: http://localhost:9199
- **Emulator UI**: http://localhost:4000

### 3. Start Your App
In a separate terminal:
```bash
npm run dev
```

Your app will now connect to the local emulators instead of production Firebase!

## Available Commands

- `npm run emulators` - Start Firebase emulators
- `npm run emulators:export` - Export emulator data to `./firebase-export`
- `npm run emulators:import` - Start emulators with imported data
- `npm run dev:emulator` - Start both emulators and dev server (requires `concurrently`)

## Emulator UI

Access the Emulator UI at http://localhost:4000 to:
- View Firestore data
- Manage authentication users
- Monitor storage
- View logs and requests

## Switching Between Emulator and Production

### Use Emulators (Local Development)
Set in `.env.local`:
```
VITE_USE_EMULATOR=true
```

### Use Production Firebase
Remove or set in `.env.local`:
```
VITE_USE_EMULATOR=false
```

Or simply don't set the variable.

## Benefits

✅ **No Quota Usage** - Test without consuming Firebase quota
✅ **Fast Development** - No network latency
✅ **Safe Testing** - No risk of affecting production data
✅ **Offline Development** - Work without internet connection
✅ **Easy Reset** - Clear data anytime

## Important Notes

- Emulator data is stored in memory by default (lost on restart)
- Use `emulators:export` to save data for later use
- Firestore rules are automatically loaded from `firestore.rules`
- Authentication users need to be created in the Emulator UI or via code
- Storage files are stored locally in the emulator

## Troubleshooting

### Port Already in Use
If ports 4000, 8080, 9099, or 9199 are in use, update `firebase.json` to use different ports.

### Emulator Not Connecting
1. Make sure `.env.local` has `VITE_USE_EMULATOR=true`
2. Restart your dev server after changing the env variable
3. Check browser console for connection errors

### Rules Not Loading
Make sure `firestore.rules` exists in the project root and is properly formatted.

