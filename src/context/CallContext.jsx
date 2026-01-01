import { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { db } from '../firebaseConfig';
import { collection, doc, setDoc, deleteDoc, onSnapshot, serverTimestamp, query, where, limit, getDocs } from 'firebase/firestore';

export const CallContext = createContext();

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};

export const CallProvider = ({ children }) => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [callState, setCallState] = useState(null); // null | 'outgoing' | 'active'
  const [callType, setCallType] = useState(null); // 'voice' | 'video'
  const [callTarget, setCallTarget] = useState(null); // { id, name, email }
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [localStream, setLocalStream] = useState(null);
  const zegoCloudRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const roomIDRef = useRef(null);

  // Check if calling is configured
  const isCallingAvailable = useCallback(() => {
    const appID = import.meta.env.VITE_ZEGOCLOUD_APP_ID;
    const available = !!appID && appID.trim() !== '';
    
    // Enhanced debugging
    if (!available) {
      console.warn('⚠️ ZEGOCLOUD App ID not found');
      console.warn('Current value:', appID);
      console.warn('Type:', typeof appID);
      console.warn('All env vars starting with VITE_ZEGOCLOUD:', 
        Object.keys(import.meta.env).filter(key => key.startsWith('VITE_ZEGOCLOUD')));
      console.warn('All VITE_ env vars:', 
        Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')).slice(0, 10));
      console.warn('📝 For local dev: Add VITE_ZEGOCLOUD_APP_ID=128222087 to .env file and restart dev server');
      console.warn('📝 For Firebase: Add VITE_ZEGOCLOUD_APP_ID=128222087 to GitHub Secrets (Settings → Secrets → Actions)');
      console.warn('💡 If secret is set, clear browser cache and service worker, then hard refresh (Ctrl+Shift+R)');
    } else {
      console.log('✅ ZEGOCLOUD App ID found:', appID);
      console.log('✅ Calling feature is available');
    }
    return available;
  }, []);

  // End call helper (defined early for use in other callbacks)
  const endCallInternal = useCallback(async () => {
    try {
      const zg = zegoCloudRef.current;
      if (zg && roomIDRef.current) {
        const streamID = `${user?.uid}_main`;
        
        // Stop publishing local stream
        if (localStream) {
          try {
            await zg.stopPublishingStream(streamID);
            localStream.getTracks().forEach(track => track.stop());
          } catch (err) {
            console.error('Error stopping local stream:', err);
          }
        }

        // Stop all playing streams
        // Note: Remote streams are tracked via roomStreamUpdate events
        // We'll stop them individually as they're tracked in state if needed

        // Leave room
        try {
          await zg.logoutRoom(roomIDRef.current);
        } catch (err) {
          console.error('Error logging out of room:', err);
        }
      }

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
      setLocalStream(null);
      setIsMuted(false);
      setIsVideoEnabled(true);
      roomIDRef.current = null;
    } catch (error) {
      console.error('Error ending call:', error);
    }
  }, [localStream, user]);

  // Initialize ZEGOCLOUD
  const initZegoCloud = useCallback(async () => {
    try {
      const ZegoExpressEngine = (await import('zego-express-engine-webrtc')).ZegoExpressEngine;
      
      const appID = import.meta.env.VITE_ZEGOCLOUD_APP_ID;
      
      if (!appID || appID.trim() === '') {
        console.warn('ZEGOCLOUD App ID not found. Calls will not work.');
        console.warn('To enable calling: Add VITE_ZEGOCLOUD_APP_ID to your .env file');
        console.warn('See ZEGOCLOUD_SETUP.md for instructions');
        return null;
      }

      // Validate App ID is a number
      const appIDNum = parseInt(appID);
      if (isNaN(appIDNum)) {
        console.error('ZEGOCLOUD App ID must be a number');
        return null;
      }

      // For development/testing: Use empty token (token-less mode)
      // For production: Generate token server-side using Server Secret
      // See ZEGOCLOUD_SETUP.md for production token generation
      const token = '';
      
      const zg = new ZegoExpressEngine(appIDNum, token);
      
      // Set up event listeners for remote streams
      zg.on('roomStreamUpdate', (roomID, updateType, streamList) => {
        console.log('Room stream update:', { roomID, updateType, streamList });
        
        if (updateType === 'ADD') {
          // Subscribe to new remote streams
          streamList.forEach(stream => {
            if (stream.streamID !== `${user?.uid}_main`) {
              console.log('Subscribing to remote stream:', stream.streamID);
              zg.startPlayingStream(stream.streamID).then(remoteStream => {
                if (remoteVideoRef.current) {
                  remoteVideoRef.current.srcObject = remoteStream;
                }
              }).catch(err => {
                console.error('Error subscribing to remote stream:', err);
              });
            }
          });
        } else if (updateType === 'DELETE') {
          // Stop playing removed streams
          streamList.forEach(stream => {
            console.log('Stopping remote stream:', stream.streamID);
            zg.stopPlayingStream(stream.streamID);
            if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
              remoteVideoRef.current.srcObject = null;
            }
          });
        }
      });

      // Handle room user updates
      zg.on('roomUserUpdate', (roomID, updateType, userList) => {
        console.log('Room user update:', { roomID, updateType, userList });
      });

      // Handle errors
      zg.on('roomStateChanged', (roomID, state, errorCode, extendedData) => {
        console.log('Room state changed:', { roomID, state, errorCode, extendedData });
        if (state === 'DISCONNECTED' && errorCode !== 0) {
          console.error('Room disconnected with error:', errorCode);
          showError('Call connection lost. Please try again.');
          endCallInternal();
        }
      });

      zegoCloudRef.current = zg;
      return zg;
    } catch (error) {
      console.error('Error initializing ZEGOCLOUD:', error);
      return null;
    }
  }, [user, showError, endCallInternal]);

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

      // Check configuration before attempting to initialize
      if (!isCallingAvailable()) {
        showError('Calling is not configured. Please add VITE_ZEGOCLOUD_APP_ID to your .env file. See ZEGOCLOUD_SETUP.md for instructions.');
        setCallState(null);
        return;
      }

      const zg = await initZegoCloud();
      if (!zg) {
        showError('Failed to initialize calling service. Please check your ZEGOCLOUD configuration and restart the server.');
        setCallState(null);
        return;
      }

      // Validate user
      if (!user || !user.uid) {
        throw new Error('User not authenticated');
      }

      // Generate room ID
      const roomID = [user.uid, target.id].sort().join('_');
      roomIDRef.current = roomID;

      // Send call notification to the other user via Firestore
      try {
        const callNotificationRef = doc(collection(db, 'callNotifications'), `${target.id}_${Date.now()}`);
        await setDoc(callNotificationRef, {
          from: user.uid,
          fromName: user.email || user.displayName || 'User',
          to: target.id,
          roomID: roomID,
          type: type, // 'voice' or 'video'
          status: 'ringing',
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.error('Error sending call notification:', err);
        // Continue anyway - the call might still work
      }

      // Join room (token-less mode for development)
      // For production, generate token server-side and pass it as second parameter
      // Note: ZEGOCLOUD SDK requires token parameter - for token-less mode, we need to pass null or empty string
      // However, based on the error, it seems the app might require actual tokens
      // API signature: loginRoom(roomID, token, config)
      // Try with null first (some SDK versions accept null for token-less), then empty string
      let loginResult;
      try {
        // Try with null token (some ZEGOCLOUD versions accept null for token-less mode)
        loginResult = await zg.loginRoom(roomID, null, { 
          userID: user.uid, 
          userName: user.email || user.displayName || 'User' 
        });
      } catch (err) {
        console.log('Null token failed, trying empty string:', err);
        try {
          // Try with empty string token
          loginResult = await zg.loginRoom(roomID, '', { 
            userID: user.uid, 
            userName: user.email || user.displayName || 'User' 
          });
        } catch (err2) {
          console.error('Both null and empty string tokens failed. ZEGOCLOUD app may require actual tokens.');
          console.error('Error with empty string:', err2);
          throw new Error('ZEGOCLOUD requires token authentication. Please enable token-less mode in ZEGOCLOUD Console or implement server-side token generation. See ZEGOCLOUD_SETUP.md for details.');
        }
      }

      if (loginResult !== 0) {
        if (loginResult === 1100001) {
          throw new Error('ZEGOCLOUD requires token authentication. Please enable token-less mode in your ZEGOCLOUD Console (Project Settings → Basic Configurations → Enable Token-less mode) OR implement server-side token generation. See ZEGOCLOUD_SETUP.md for details.');
        }
        throw new Error(`Failed to join room. Error code: ${loginResult}`);
      }

      // Create and publish stream
      const streamConfig = type === 'video'
        ? { camera: { video: true, audio: true }, microphone: { audio: true } }
        : { camera: { video: false, audio: true }, microphone: { audio: true } };

      const stream = await zg.createStream(streamConfig);
      setLocalStream(stream);
      
      if (type === 'video' && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      const streamID = `${user.uid}_main`;
      const publishResult = await zg.startPublishingStream(streamID, stream);
      
      if (publishResult !== 0) {
        throw new Error(`Failed to publish stream. Error code: ${publishResult}`);
      }

      // Note: Remote streams will be handled by the 'roomStreamUpdate' event listener
      // which is already set up in initZegoCloud. No need to manually check for streams here.

      setIsVideoEnabled(type === 'video');
      setCallState('active');
      setIsMuted(false);
    } catch (error) {
      console.error('Error starting call:', error);
      showError('Failed to start call. Please try again.');
      setCallState(null);
      endCallInternal();
    }
  }, [user, initZegoCloud, showError, isCallingAvailable, endCallInternal]);

  // End call (public API)
  const endCall = endCallInternal;

  // Toggle mute
  const toggleMute = useCallback(async () => {
    try {
      if (localStream) {
        const audioTracks = localStream.getAudioTracks();
        audioTracks.forEach(track => {
          track.enabled = isMuted;
        });
        setIsMuted(!isMuted);
      }
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  }, [localStream, isMuted]);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    try {
      if (localStream && callType === 'video') {
        const videoTracks = localStream.getVideoTracks();
        videoTracks.forEach(track => {
          track.enabled = !isVideoEnabled;
        });
        setIsVideoEnabled(!isVideoEnabled);
      }
    } catch (error) {
      console.error('Error toggling video:', error);
    }
  }, [localStream, callType, isVideoEnabled]);

  // Listen for incoming call notifications
  useEffect(() => {
    if (!user?.uid || !isCallingAvailable()) return;

    const notificationsRef = collection(db, 'callNotifications');
    const q = query(notificationsRef, where('to', '==', user.uid), where('status', '==', 'ringing'), limit(1));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (!snapshot.empty && callState === null) { // Only accept if not already in a call
        const notification = snapshot.docs[0].data();
        const notificationDoc = snapshot.docs[0];
        console.log('Incoming call notification:', notification);
        
        // Set call state to show incoming call
        setCallTarget({
          id: notification.from,
          name: notification.fromName || 'User',
          email: null
        });
        setCallType(notification.type);
        setCallState('incoming');
        
        // Auto-join the room after a short delay
        setTimeout(async () => {
          try {
            const zg = await initZegoCloud();
            if (!zg) {
              setCallState(null);
              return;
            }
            
            roomIDRef.current = notification.roomID;
            
            // Try with empty string token first, then without token
            let loginResult;
            try {
              loginResult = await zg.loginRoom(notification.roomID, '', {
                userID: user.uid,
                userName: user.email || user.displayName || 'User'
              });
            } catch (err) {
              console.log('Trying token-less mode without token parameter');
              loginResult = await zg.loginRoom(notification.roomID, {
                userID: user.uid,
                userName: user.email || user.displayName || 'User'
              });
            }
            
            if (loginResult === 0) {
              // Create and publish stream
              const streamConfig = notification.type === 'video'
                ? { camera: { video: true, audio: true }, microphone: { audio: true } }
                : { camera: { video: false, audio: true }, microphone: { audio: true } };
              
              const stream = await zg.createStream(streamConfig);
              setLocalStream(stream);
              
              if (notification.type === 'video' && localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
              }
              
              const streamID = `${user.uid}_main`;
              await zg.startPublishingStream(streamID, stream);
              
              setIsVideoEnabled(notification.type === 'video');
              setCallState('active');
              setIsMuted(false);
              
              // Delete the notification
              await deleteDoc(notificationDoc.ref);
            } else {
              console.error('Failed to join room:', loginResult);
              setCallState(null);
            }
          } catch (error) {
            console.error('Error accepting incoming call:', error);
            setCallState(null);
          }
        }, 1000); // Auto-join after 1 second
      }
    }, (error) => {
      console.error('Error listening for call notifications:', error);
    });

    return () => unsubscribe();
  }, [user, isCallingAvailable, initZegoCloud, callState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCallInternal();
      if (zegoCloudRef.current) {
        try {
          // Remove event listeners before destroying
          const zg = zegoCloudRef.current;
          zg.off('roomStreamUpdate');
          zg.off('roomUserUpdate');
          zg.off('roomStateChanged');
          zg.destroyEngine();
        } catch (err) {
          console.error('Error destroying ZEGOCLOUD engine:', err);
        }
      }
    };
  }, [endCallInternal]);

  // Memoize the availability check to avoid re-computing on every render
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
    startCall,
    endCall,
    toggleMute,
    toggleVideo
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};
