import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { db, functions } from '../firebaseConfig';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs, serverTimestamp, query, where, limit } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

const CallContext = createContext();

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};

export const CallProvider = ({ children }) => {
  const { user } = useAuth();
  const { error: showError } = useToast();
  
  const [callState, setCallState] = useState(null); // null | 'outgoing' | 'incoming' | 'active'
  const [callType, setCallType] = useState(null); // 'voice' | 'video'
  const [callTarget, setCallTarget] = useState(null);
  const [token, setToken] = useState(null);
  const [meetingId, setMeetingId] = useState(null);
  
  const incomingCallRef = useRef(null);

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

      // Request permissions
      try {
        const constraints = type === 'video' ? { video: true, audio: true } : { audio: true };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        showError(`${type === 'video' ? 'Camera and microphone' : 'Microphone'} access is required`);
        setCallState(null);
        return;
      }

      // Get VideoSDK token and create meeting
      const getToken = httpsCallable(functions, 'getVideoSDKToken');
      const result = await getToken({ userId: user.uid });

      if (result.data?.token && result.data?.meetingId) {
        setToken(result.data.token);
        setMeetingId(result.data.meetingId);
        setCallState('active');

        // Send call notification to target
        const notificationRef = doc(collection(db, 'callNotifications'), `${target.id}_${Date.now()}`);
        await setDoc(notificationRef, {
          from: user.uid,
          fromName: user.email?.split('@')[0] || user.displayName || 'User',
          to: target.id,
          meetingId: result.data.meetingId,
          type: type,
          status: 'ringing',
          createdAt: serverTimestamp()
        });
      } else {
        throw new Error('Failed to get token');
      }
    } catch (error) {
      console.error('Error starting call:', error);
      showError('Failed to start call. Please try again.');
      setCallState(null);
    }
  }, [user, showError]);

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    if (!incomingCallRef.current || !user) return;

    const notification = incomingCallRef.current.notification;
    const notificationDoc = incomingCallRef.current.doc;

    try {
      // Request permissions
      try {
        const constraints = notification.type === 'video' ? { video: true, audio: true } : { audio: true };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        showError(`${notification.type === 'video' ? 'Camera and microphone' : 'Microphone'} access is required`);
        return;
      }

      // Get VideoSDK token
      const getToken = httpsCallable(functions, 'getVideoSDKToken');
      const result = await getToken({ userId: user.uid });

      if (result.data?.token && notification.meetingId) {
        setToken(result.data.token);
        setMeetingId(notification.meetingId);
        setCallType(notification.type);
        setCallState('active');

        // Delete notification
        if (notificationDoc?.ref) {
          await deleteDoc(notificationDoc.ref);
        }
        incomingCallRef.current = null;
      }
    } catch (error) {
      console.error('Error accepting call:', error);
      showError('Failed to accept call. Please try again.');
    }
  }, [user, showError]);

  // End call
  const endCall = useCallback(async () => {
    // Delete notification if declining incoming call
    if (callState === 'incoming' && incomingCallRef.current?.doc?.ref) {
      try {
        await deleteDoc(incomingCallRef.current.doc.ref);
      } catch (err) {
        console.error('Error deleting notification:', err);
      }
      incomingCallRef.current = null;
    }

    // Clear all call notifications for this user
    if (user?.uid) {
      try {
        const notificationsRef = collection(db, 'callNotifications');
        const q = query(notificationsRef, where('to', '==', user.uid), limit(10));
        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
      } catch (err) {
        console.error('Error clearing notifications:', err);
      }
    }

    // Reset state
    setCallState(null);
    setCallType(null);
    setCallTarget(null);
    setToken(null);
    setMeetingId(null);
  }, [callState, user]);

  // Listen for incoming calls
  useEffect(() => {
    if (!user?.uid) return;

    const notificationsRef = collection(db, 'callNotifications');
    const q = query(notificationsRef, where('to', '==', user.uid), where('status', '==', 'ringing'), limit(1));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty && callState === null) {
        const doc = snapshot.docs[0];
        const notification = doc.data();

        setCallTarget({
          id: notification.from,
          name: notification.fromName || 'User',
          email: null
        });
        setCallType(notification.type);
        setCallState('incoming');

        incomingCallRef.current = {
          notification,
          doc
        };
      } else if (snapshot.empty && callState === 'incoming') {
        setCallState(null);
        incomingCallRef.current = null;
      }
    });

    return () => unsubscribe();
  }, [user, callState]);

  const value = {
    callState,
    callType,
    callTarget,
    token,
    meetingId,
    startCall,
    acceptCall,
    endCall,
    isCallingAvailable: () => true
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};

export { CallContext };

