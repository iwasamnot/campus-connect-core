# VideoSDK Error Fixes

## Issues Fixed

### 1. `TypeError: Cannot read properties of null (reading 'emit')`

**Problem**: `leave()` was being called on a null meeting object when VideoSDK connection failed.

**Fix**: Added guard in `MeetingView.jsx` to check if meeting exists before calling `leave()`:

```javascript
onClick={() => {
  try {
    if (meeting && leave) {
      leave();
    }
  } catch (err) {
    console.warn('Error calling leave():', err);
  }
  if (onLeave) onLeave();
}}
```

### 2. `notificationDoc` Null Reference Error

**Problem**: `acceptCall` was trying to access `notificationDoc` without checking if it exists.

**Fix**: Added comprehensive null checks in `acceptCall`:

```javascript
// Guard: Check if we have an incoming call
if (callState !== 'incoming' || !incomingCallNotificationRef.current) {
  return;
}

// Guard: Check if notification and notificationDoc exist
const notificationRef = incomingCallNotificationRef.current;
if (!notificationRef.notification || !notificationRef.notificationDoc) {
  console.error('Incoming call notification is missing data');
  setCallState(null);
  incomingCallNotificationRef.current = null;
  return;
}
```

### 3. Missing `meetingId` in Signaling

**Problem**: Caller was creating notifications with a fake meetingId, but callee needed the real VideoSDK meetingId to join.

**Fix**: 
- `startCall` now gets the real meetingId from VideoSDK first
- Then creates the notification with the real meetingId
- Callee uses the meetingId from the notification to join

```javascript
// Get token and real meetingId first
const tokenResult = await getToken({ userId: user.uid });
const realMeetingId = tokenResult.data.meetingId;

// Then create notification with real meetingId
await setDoc(callNotificationRef, {
  // ...
  roomID: realMeetingId,
  meetingId: realMeetingId, // Real VideoSDK meetingId
  // ...
});
```

### 4. `endCall` Null Reference

**Problem**: `endCall` was accessing `notificationDoc` without checking if it exists.

**Fix**: Added guard in `endCall`:

```javascript
if (callState === 'incoming' && incomingCallNotificationRef.current) {
  try {
    const notificationRef = incomingCallNotificationRef.current;
    if (notificationRef.notificationDoc && notificationRef.notificationDoc.ref) {
      await deleteDoc(notificationRef.notificationDoc.ref);
    }
  } catch (err) {
    console.error('Error deleting call notification:', err);
  }
  incomingCallNotificationRef.current = null;
}
```

## Flow Summary

### Outgoing Call Flow:
1. User starts call → `startCall()`
2. Get VideoSDK token and real meetingId from backend
3. Create Firestore notification with real meetingId
4. Caller joins meeting (state = 'active')

### Incoming Call Flow:
1. Callee receives Firestore notification with real meetingId
2. Callee accepts → `acceptCall()`
3. Get VideoSDK token from backend
4. Use meetingId from notification to join
5. Callee joins same meeting (state = 'active')

## Testing

After these fixes:
- ✅ No more `emit` errors when leaving failed calls
- ✅ No more `notificationDoc` null reference errors
- ✅ Both users join the same VideoSDK meeting
- ✅ Proper cleanup when calls fail or are declined

