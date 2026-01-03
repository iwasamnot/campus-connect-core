import { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { db, functions } from '../firebaseConfig';
import { collection, doc, setDoc, deleteDoc, onSnapshot, serverTimestamp, query, where, limit, getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { MeetingProvider } from '@videosdk.live/react-sdk';

// CRITICAL: Declare CallContext as a top-level const before exporting
const CallContext = createContext();

// CRITICAL: Declare useCall as a top-level const before exporting
const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};

// Export the declared values
export { CallContext, useCall };

// CRITICAL: Declare CallProvider as a top-level const (no export keyword here)
const CallProvider = ({ children }) => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [callState, setCallState] = useState(null); // null | 'outgoing' | 'active' | 'incoming'
  const [callType, setCallType] = useState(null); // 'voice' | 'video'
  const [callTarget, setCallTarget] = useState(null); // { id, name, email }
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [token, setToken] = useState(null);
  const [meetingId, setMeetingId] = useState(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const incomingCallNotificationRef = useRef(null);
  const ringtoneIntervalRef = useRef(null);

  // Check if calling is configured (VideoSDK is always available, no config needed)
  const isCallingAvailable = useCallback(() => {
    return true; // VideoSDK doesn't require client-side configuration
  }, []);

  // End call helper
  const endCallInternal = useCallback(async () => {
    try {
      // Clear call notifications
      if (user?.uid) {
        try {
          const notificationsRef = collection(db, 'callNotifications');
          const q = query(notificationsRef, where('to', '==', user.uid), limit(10));
          const snapshot = await getDocs(q);
          const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
          await Promise.all(deletePromises);
        } catch (err) {
          console.error('Error clearing call notifications:', err);
        }
      }

      // Clear video refs
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }

      // Reset state
      setCallState(null);
      setCallType(null);
      setCallTarget(null);
      setToken(null);
      setMeetingId(null);
      setIsMuted(false);
      setIsVideoEnabled(true);
    } catch (error) {
      console.error('Error ending call:', error);
    }
  }, [user]);

  // Start a call
  const startCall = useCallback(async (target, type = 'voice') => {
    if (!user) {
      showError('You must be logged in to make calls');
      return;
    }

    try {
      setCallTarget(target);
      setCallType(type);
      setCallState('outgoing');

      // Request permissions first
      try {
        const constraints = type === 'video' 
          ? { video: true, audio: true }
          : { audio: true };
        const testStream = await navigator.mediaDevices.getUserMedia(constraints);
        testStream.getTracks().forEach(track => track.stop());
      } catch (err) {
        showError(`${type === 'video' ? 'Camera and microphone' : 'Microphone'} access is required`);
        setCallState(null);
        return;
      }

      // Validate user
      if (!user || !user.uid) {
        throw new Error('User not authenticated');
      }

      // Generate meeting ID (same format as before for compatibility)
      const meetingID = [user.uid, target.id].sort().join('_');

      // Send call notification to the other user via Firestore
      try {
        const callNotificationRef = doc(collection(db, 'callNotifications'), `${target.id}_${Date.now()}`);
        await setDoc(callNotificationRef, {
          from: user.uid,
          fromName: user.email || user.displayName || 'User',
          to: target.id,
          roomID: meetingID,
          type: type, // 'voice' or 'video'
          status: 'ringing',
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.error('Error sending call notification:', err);
        // Continue anyway - the call might still work
      }

      // Get VideoSDK token and meeting ID from backend
      try {
        console.log('🔐 Requesting VideoSDK token...');
        const getToken = httpsCallable(functions, 'getVideoSDKToken');
        const tokenResult = await getToken({
          userId: user.uid,
          meetingId: meetingID
        });

        if (tokenResult.data && tokenResult.data.token && tokenResult.data.meetingId) {
          setToken(tokenResult.data.token);
          setMeetingId(tokenResult.data.meetingId);
          setCallState('active');
          console.log('✅ VideoSDK token received, call active');
        } else {
          throw new Error('Invalid token response from server');
        }
      } catch (tokenError) {
        console.error('❌ Failed to get VideoSDK token:', tokenError);
        showError('Failed to start call. Please try again.');
        setCallState(null);
        return;
      }
    } catch (error) {
      console.error('Error starting call:', error);
      showError('Failed to start call. Please try again.');
      setCallState(null);
      endCallInternal();
    }
  }, [user, showError, endCallInternal]);

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    if (callState !== 'incoming' || !incomingCallNotificationRef.current) {
      return;
    }

    // Stop ringtone
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }

    const { notification } = incomingCallNotificationRef.current;

    try {
      // Request permissions first
      try {
        const constraints = notification.type === 'video' 
          ? { video: true, audio: true }
          : { audio: true };
        const testStream = await navigator.mediaDevices.getUserMedia(constraints);
        testStream.getTracks().forEach(track => track.stop());
      } catch (err) {
        showError(`${notification.type === 'video' ? 'Camera and microphone' : 'Microphone'} access is required`);
        setCallState(null);
        return;
      }

      // Get VideoSDK token for the meeting
      try {
        console.log('🔐 Requesting VideoSDK token for incoming call...');
        const getToken = httpsCallable(functions, 'getVideoSDKToken');
        const tokenResult = await getToken({
          userId: user.uid,
          meetingId: notification.roomID
        });

        if (tokenResult.data && tokenResult.data.token && tokenResult.data.meetingId) {
          setToken(tokenResult.data.token);
          setMeetingId(tokenResult.data.meetingId);
          setCallState('active');
          setIsVideoEnabled(notification.type === 'video');
          setIsMuted(false);

          // Delete the notification
          await deleteDoc(incomingCallNotificationRef.current.notificationDoc.ref);
          incomingCallNotificationRef.current = null;
          console.log('✅ VideoSDK token received, call active');
        } else {
          throw new Error('Invalid token response from server');
        }
      } catch (tokenError) {
        console.error('❌ Failed to get VideoSDK token for incoming call:', tokenError);
        showError('Failed to accept call. Please try again.');
        setCallState(null);
        return;
      }
    } catch (error) {
      console.error('Error accepting incoming call:', error);
      showError('Failed to accept call. Please try again.');
      setCallState(null);
      incomingCallNotificationRef.current = null;
    }
  }, [callState, user, showError]);

  // End call (public API)
  const endCall = useCallback(async () => {
    // Stop ringtone if playing
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }

    // If declining an incoming call, delete the notification
    if (callState === 'incoming' && incomingCallNotificationRef.current) {
      try {
        const { notificationDoc } = incomingCallNotificationRef.current;
        await deleteDoc(notificationDoc.ref);
      } catch (err) {
        console.error('Error deleting call notification:', err);
      }
      incomingCallNotificationRef.current = null;
    }
    endCallInternal();
  }, [callState, endCallInternal]);

  // Toggle mute (placeholder - will be handled by VideoSDK hooks in MeetingView)
  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);
  }, [isMuted]);

  // Toggle video (placeholder - will be handled by VideoSDK hooks in MeetingView)
  const toggleVideo = useCallback(() => {
    setIsVideoEnabled(!isVideoEnabled);
  }, [isVideoEnabled]);

  // Listen for incoming call notifications
  useEffect(() => {
    if (!user?.uid) return;

    const notificationsRef = collection(db, 'callNotifications');
    const q = query(notificationsRef, where('to', '==', user.uid), where('status', '==', 'ringing'), limit(1));

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Create ringtone beep sound
    const playRingtoneBeep = () => {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } catch (err) {
        console.warn('Could not play ringtone:', err);
      }
    };

    const playRingtone = () => {
      if (ringtoneIntervalRef.current) {
        clearInterval(ringtoneIntervalRef.current);
      }
      playRingtoneBeep();
      ringtoneIntervalRef.current = setInterval(() => {
        playRingtoneBeep();
      }, 2000);
    };

    const stopRingtone = () => {
      if (ringtoneIntervalRef.current) {
        clearInterval(ringtoneIntervalRef.current);
        ringtoneIntervalRef.current = null;
      }
    };

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (!snapshot.empty && callState === null) {
        const notification = snapshot.docs[0].data();
        const notificationDoc = snapshot.docs[0];
        console.log('Incoming call notification:', notification);

        setCallTarget({
          id: notification.from,
          name: notification.fromName || 'User',
          email: null
        });
        setCallType(notification.type);
        setCallState('incoming');

        incomingCallNotificationRef.current = {
          notification,
          notificationDoc
        };

        // Show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            const browserNotification = new Notification('Incoming Call', {
              body: `${notification.fromName || 'Someone'} is calling you (${notification.type === 'video' ? 'Video' : 'Voice'} call)`,
              icon: '/logo.png',
              tag: 'incoming-call',
              requireInteraction: true
            });
            browserNotification.onclick = () => {
              window.focus();
              browserNotification.close();
            };
            setTimeout(() => browserNotification.close(), 30000);
          } catch (err) {
            console.warn('Could not show browser notification:', err);
          }
        }

        playRingtone();
      } else if (snapshot.empty && callState === 'incoming') {
        stopRingtone();
        setCallState(null);
        incomingCallNotificationRef.current = null;
      }
    }, (error) => {
      console.error('Error listening for call notifications:', error);
    });

    return () => {
      unsubscribe();
      stopRingtone();
    };
  }, [user, callState]);

  // Stop ringtone when call state changes away from incoming
  useEffect(() => {
    if (callState !== 'incoming' && ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
  }, [callState]);

  // Memoize the availability check
  const callingAvailable = useMemo(() => isCallingAvailable(), [isCallingAvailable]);

  const value = {
    callState,
    callType,
    callTarget,
    isMuted,
    isVideoEnabled,
    localVideoRef,
    remoteVideoRef,
    isCallingAvailable: callingAvailable,
    token, // VideoSDK token
    meetingId, // VideoSDK meeting ID
    startCall,
    acceptCall,
    endCall,
    toggleMute,
    toggleVideo
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};

// Export the declared component
export { CallProvider };
