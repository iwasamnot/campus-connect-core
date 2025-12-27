# Firebase Quota Optimization for Spark Free Plan

## Problem
The app exceeded Firebase Spark free plan limits:
- **Reads**: 58K (limit: 50K/day) ❌
- **Writes**: 27K (limit: 20K/day) ❌
- **Spikes occurred at**: 6 AM and 10 PM (peak usage times)

## Optimizations Applied

### 1. Reduced Query Limits (50% reduction)
- **Messages**: 100 → 50 per query
- **Users**: 200 → 100 per query
- **Groups**: 50 → 50 (already optimized)

### 2. Read Receipt Optimizations
- **Debounce delay**: 2s → 5s
- **Cooldown period**: Added 10-second cooldown between updates
- **Batch size**: 5 → 3 messages per update
- **Respects user preferences**: Only updates if `readReceipts` is enabled in Settings

### 3. Cleanup Interval Optimization
- **Expired messages cleanup**: 1 minute → 5 minutes
- **Query limit**: Added limit(50) to cleanup queries

### 4. Infinite Loop Prevention
- Moved all `updateDoc` calls out of `onSnapshot` callbacks
- Added separate `useEffect` hooks with proper debouncing
- Used `useRef` to track processed messages and prevent duplicates

## Expected Impact

### Before:
- **Peak hour reads**: ~20K/hour
- **Peak hour writes**: ~12K/hour
- **Daily total**: 58K reads, 27K writes

### After (estimated):
- **Peak hour reads**: ~5-8K/hour (60-75% reduction)
- **Peak hour writes**: ~2-4K/hour (70-80% reduction)
- **Daily total**: ~15-20K reads, ~5-8K writes (within free tier limits)

## User Experience
- Messages still load and display correctly
- Read receipts are optional (can be disabled in Settings)
- Slightly fewer messages loaded initially (50 instead of 100)
- Cleanup happens less frequently but still works

## Monitoring
Monitor Firebase Console Usage tab to ensure:
- Daily reads stay under 50K
- Daily writes stay under 20K
- No more quota exceeded warnings

## Future Optimizations (if needed)
1. Implement client-side caching with IndexedDB
2. Use pagination for message history
3. Lazy load user profiles
4. Disable read receipts by default for free tier
5. Implement request queuing and rate limiting

