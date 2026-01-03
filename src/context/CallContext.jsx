import { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { db, functions } from '../firebaseConfig';
import { collection, doc, setDoc, deleteDoc, onSnapshot, serverTimestamp, query, where, limit, getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

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
  const incomingCallNotificationRef = useRef(null);
  const ringtoneIntervalRef = useRef(null);

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
      
      // Clean up any existing instance before creating a new one
      // This prevents multiple SDK instances and reduces connection warnings
      if (zegoCloudRef.current) {
        try {
          zegoCloudRef.current.destroyEngine();
        } catch (err) {
          console.warn('Error destroying previous ZEGOCLOUD instance:', err);
        }
        zegoCloudRef.current = null;
      }
      
      // CRITICAL: Force test environment mode to match Testing status in ZEGOCLOUD Console
      // Without this, SDK defaults to production (env: 0), which causes connection failures
      // when your console is set to Testing mode, resulting in "frequently shutdown" errors
      // Method A: Pass testEnvironment in constructor (recommended for recent SDK versions)
      let zg;
      try {
        // Try Method A: Pass config as third parameter to constructor
        zg = new ZegoExpressEngine(appIDNum, token, { 
          testEnvironment: true 
        });
        console.log('✅ ZEGOCLOUD initialized with testEnvironment: true (Method A - constructor)');
      } catch (constructorError) {
        console.warn('⚠️ Method A failed, trying Method B:', constructorError);
        // Method B: Try static method before constructor (for older SDK versions)
        try {
          if (ZegoExpressEngine.setDebugConfig) {
            ZegoExpressEngine.setDebugConfig({ testEnvironment: true });
          } else if (ZegoExpressEngine.setLogConfig) {
            ZegoExpressEngine.setLogConfig({ testEnvironment: true });
          }
          zg = new ZegoExpressEngine(appIDNum, token);
          console.log('✅ ZEGOCLOUD initialized with testEnvironment: true (Method B - static method)');
        } catch (methodBError) {
          console.error('❌ CRITICAL: Both methods failed to set test environment:', methodBError);
          // Fallback: Create without test environment config (may fail if console is in Testing mode)
          zg = new ZegoExpressEngine(appIDNum, token);
          console.warn('⚠️ ZEGOCLOUD created without test environment config - connection may fail');
        }
      }
      
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
          
          // Handle specific error codes
          let errorMessage = 'Call connection lost. Please try again.';
          if (errorCode === 20014) {
            errorMessage = 'ZEGOCLOUD app configuration error (20014). Please verify your App ID and app settings in ZEGOCLOUD Console.';
          } else if (errorCode === 50119) {
            errorMessage = 'ZEGOCLOUD token authentication failed. Please check server-side token generation configuration.';
          } else if (errorCode === 1102016) {
            errorMessage = 'ZEGOCLOUD connection error. Please check your network and try again.';
          }
          
          showError(errorMessage);
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

      // Generate token server-side (production) or use token-less mode (development)
      // API signature: loginRoom(roomID, token, config)
      // CRITICAL: Token must always be a string, never null/undefined
      let token = ''; // Use empty string instead of null to prevent SDK errors
      let loginResult;
      
      // Try to get token from server-side Cloud Function first
      try {
        console.log('=== ZEGOCLOUD Token Generation Request ===');
        console.log(`📤 Sending token request with userId: "${user.uid}"`);
        console.log(`📤 RoomID: "${roomID}"`);
        console.log('==========================================');
        
        const generateToken = httpsCallable(functions, 'generateZegoToken');
        const tokenResult = await generateToken({
          userId: user.uid, // CRITICAL: This UserID MUST match the userID used in loginRoom() below
          roomID: roomID
        });
        
        if (tokenResult.data && tokenResult.data.token && typeof tokenResult.data.token === 'string') {
          token = tokenResult.data.token;
          console.log('✅ Token generated successfully from server');
          console.log(`Token length: ${token.length}, preview: ${token.substring(0, 20)}...`);
          console.log(`⚠️ IMPORTANT: This token was generated for userId="${user.uid}"`);
          console.log(`⚠️ IMPORTANT: You MUST use userID="${user.uid}" in loginRoom() call below`);
        } else {
          console.error('❌ Invalid token returned from server:', tokenResult.data);
          throw new Error('Token not returned from server or invalid format');
        }
      } catch (tokenError) {
        console.warn('⚠️ Server-side token generation failed:', tokenError);
        console.warn('Error details:', {
          code: tokenError?.code,
          message: tokenError?.message,
          details: tokenError?.details
        });
        console.warn('💡 Falling back to token-less mode (empty string token)');
        console.warn('📝 For production, ensure:');
        console.warn('   1. ZEGOCLOUD_SERVER_SECRET is set in Firebase Functions config');
        console.warn('   2. generateZegoToken function is deployed');
        console.warn('   3. See ZEGOCLOUD_TOKEN_SETUP.md for setup instructions');
        
        // Fall back to token-less mode (empty string, never null)
        token = '';
      }
      
      // Join room with token (empty string for token-less mode)
      // CRITICAL: Always pass a string to loginRoom, never null/undefined
      // CRITICAL: The userID used here MUST match the userId used to generate the token above
      try {
        console.log('=== ZEGOCLOUD loginRoom Call ===');
        console.log(`🏠 RoomID: "${roomID}"`);
        console.log(`👤 UserID: "${user.uid}" (type: ${typeof user.uid})`);
        console.log(`🔑 Token length: ${token.length}`);
        console.log(`⚠️ CRITICAL: userID="${user.uid}" MUST match the userId used in token generation above`);
        console.log('================================');
        
        loginResult = await zg.loginRoom(roomID, token, { 
          userID: user.uid, // CRITICAL: Must match userId used in generateToken() call above
          userName: user.email || user.displayName || 'User' 
        });
      } catch (err) {
        console.error('Failed to join room:', err);
        const errorMsg = err?.message || String(err || '');
        const errorCode = err?.code || err?.errorCode;
        
        // Check for specific error codes
        let userFriendlyError = `Failed to start call. Error: ${errorMsg || errorCode || 'Unknown error'}`;
        
        if (errorMsg.includes('substring') || errorMsg.includes('null') || errorMsg.includes('Cannot read properties') || errorCode === 1100001) {
          userFriendlyError = 'ZEGOCLOUD token authentication required. Please configure server-side token generation (see ZEGOCLOUD_TOKEN_SETUP.md) OR enable token-less mode in ZEGOCLOUD Console.';
        } else if (errorCode === 20014 || errorMsg.includes('20014')) {
          userFriendlyError = 'ZEGOCLOUD app configuration error (20014). Please verify your App ID (128222087) and app settings in ZEGOCLOUD Console. The app may need to be activated or reconfigured.';
        } else if (errorCode === 50119 || errorMsg.includes('50119') || errorMsg.includes('token auth err')) {
          userFriendlyError = 'ZEGOCLOUD token authentication failed (50119). Check: 1) Token mode is enabled in ZEGOCLOUD Console (Settings → Basic Configurations → Authentication Mode = "Token"), 2) Server Secret matches exactly (32 hex chars, no spaces), 3) Function is redeployed. See function logs for details.';
        }
        
        showError(userFriendlyError);
        setCallState(null);
        return;
      }

      if (loginResult !== 0) {
        let errorMessage = `Failed to join room. Error code: ${loginResult}`;
        if (loginResult === 1100001) {
          errorMessage = 'ZEGOCLOUD requires token authentication. Please enable token-less mode in your ZEGOCLOUD Console (Project Settings → Basic Configurations → Enable Token-less mode) OR implement server-side token generation. See ZEGOCLOUD_SETUP.md for details.';
        } else if (loginResult === 20014) {
          errorMessage = 'ZEGOCLOUD app configuration error (20014). Please verify your App ID (128222087) and app settings in ZEGOCLOUD Console. The app may not be properly activated or configured.';
        } else if (loginResult === 50119) {
          errorMessage = 'ZEGOCLOUD token authentication failed (50119). Check: 1) Token mode is enabled in ZEGOCLOUD Console (Settings → Basic Configurations → Authentication Mode = "Token"), 2) Server Secret matches exactly (32 hex chars, no spaces), 3) Function is redeployed. See function logs for details.';
        } else if (loginResult === 1102016) {
          errorMessage = 'ZEGOCLOUD connection error (1102016). Please check your network connection and try again.';
        }
        throw new Error(errorMessage);
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

    const { notification, notificationDoc } = incomingCallNotificationRef.current;
    
    try {
      const zg = await initZegoCloud();
      if (!zg) {
        showError('Failed to initialize calling service.');
        setCallState(null);
        return;
      }
      
      roomIDRef.current = notification.roomID;
      
      // Generate token server-side (same as startCall)
      let token = '';
      try {
        console.log('=== ZEGOCLOUD Token Generation Request (Incoming Call) ===');
        console.log(`📤 Sending token request with userId: "${user.uid}"`);
        console.log(`📤 RoomID: "${notification.roomID}"`);
        console.log('===========================================================');
        
        const generateToken = httpsCallable(functions, 'generateZegoToken');
        const tokenResult = await generateToken({
          userId: user.uid, // CRITICAL: This UserID MUST match the userID used in loginRoom() below
          roomID: notification.roomID
        });
        
        if (tokenResult.data && tokenResult.data.token && typeof tokenResult.data.token === 'string') {
          token = tokenResult.data.token;
          console.log('✅ Token generated successfully from server for incoming call');
          console.log(`⚠️ IMPORTANT: This token was generated for userId="${user.uid}"`);
          console.log(`⚠️ IMPORTANT: You MUST use userID="${user.uid}" in loginRoom() call below`);
        } else {
          console.error('❌ Invalid token returned from server for incoming call:', tokenResult.data);
          throw new Error('Token not returned from server or invalid format');
        }
      } catch (tokenError) {
        console.warn('⚠️ Server-side token generation failed for incoming call:', tokenError);
        console.warn('💡 Falling back to token-less mode (empty string token)');
        token = '';
      }

      // Join room with token (guaranteed to be a string)
      // CRITICAL: The userID used here MUST match the userId used to generate the token above
      let loginResult;
      try {
        console.log('=== ZEGOCLOUD loginRoom Call (Incoming Call) ===');
        console.log(`🏠 RoomID: "${notification.roomID}"`);
        console.log(`👤 UserID: "${user.uid}" (type: ${typeof user.uid})`);
        console.log(`🔑 Token length: ${token.length}`);
        console.log(`⚠️ CRITICAL: userID="${user.uid}" MUST match the userId used in token generation above`);
        console.log('================================================');
        
        loginResult = await zg.loginRoom(notification.roomID, token, {
          userID: user.uid, // CRITICAL: Must match userId used in generateToken() call above
          userName: user.email || user.displayName || 'User'
        });
      } catch (err) {
        console.error('Failed to join room for incoming call:', err);
        const errorMsg = err?.message || String(err || '');
        const errorCode = err?.code || err?.errorCode;
        
        let userFriendlyError = `Failed to accept call. Error: ${errorMsg || errorCode || 'Unknown error'}`;
        
        if (errorMsg.includes('substring') || errorMsg.includes('null') || errorMsg.includes('Cannot read properties') || errorCode === 1100001) {
          userFriendlyError = 'ZEGOCLOUD token authentication required. Please configure server-side token generation (see ZEGOCLOUD_TOKEN_SETUP.md) OR enable token-less mode in ZEGOCLOUD Console.';
        } else if (errorCode === 20014 || errorMsg.includes('20014')) {
          userFriendlyError = 'ZEGOCLOUD app configuration error (20014). Please verify your App ID (128222087) and app settings in ZEGOCLOUD Console. The app may need to be activated or reconfigured.';
        } else if (errorCode === 50119 || errorMsg.includes('50119') || errorMsg.includes('token auth err')) {
          userFriendlyError = 'ZEGOCLOUD token authentication failed (50119). Check: 1) Token mode is enabled in ZEGOCLOUD Console (Settings → Basic Configurations → Authentication Mode = "Token"), 2) Server Secret matches exactly (32 hex chars, no spaces), 3) Function is redeployed. See function logs for details.';
        } else if (errorCode === 20014 || errorMsg.includes('20014')) {
          userFriendlyError = 'ZEGOCLOUD app configuration error (20014). Please verify your App ID and app settings in ZEGOCLOUD Console. The app may need to be activated or reconfigured.';
        } else if (errorCode === 50119 || errorMsg.includes('50119') || errorMsg.includes('token auth err')) {
          userFriendlyError = 'ZEGOCLOUD token authentication failed. Please verify your Server Secret matches exactly what is in ZEGOCLOUD Console.';
        }
        
        showError(userFriendlyError);
        setCallState(null);
        return;
      }
      
      if (loginResult === 0) {
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
        const publishResult = await zg.startPublishingStream(streamID, stream);
        
        if (publishResult !== 0) {
          throw new Error(`Failed to publish stream. Error code: ${publishResult}`);
        }
        
        setIsVideoEnabled(notification.type === 'video');
        setCallState('active');
        setIsMuted(false);
        
        // Delete the notification
        await deleteDoc(notificationDoc.ref);
        incomingCallNotificationRef.current = null;
      } else {
        console.error('Failed to join room:', loginResult);
        showError('Failed to join call. Please try again.');
        setCallState(null);
      }
    } catch (error) {
      console.error('Error accepting incoming call:', error);
      showError('Failed to accept call. Please try again.');
      setCallState(null);
      incomingCallNotificationRef.current = null;
    }
  }, [callState, user, initZegoCloud, showError]);

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
      // Stop any existing ringtone
      if (ringtoneIntervalRef.current) {
        clearInterval(ringtoneIntervalRef.current);
      }
      
      // Play immediately
      playRingtoneBeep();
      
      // Then play every 2 seconds
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
        
        // Store notification data for acceptCall function
        roomIDRef.current = notification.roomID;
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
              badge: '/logo.png',
              tag: 'incoming-call',
              requireInteraction: true,
              silent: false
            });

            browserNotification.onclick = () => {
              window.focus();
              browserNotification.close();
            };

            // Auto-close after 30 seconds
            setTimeout(() => {
              browserNotification.close();
            }, 30000);
          } catch (err) {
            console.warn('Could not show browser notification:', err);
          }
        }

        // Play ringtone
        playRingtone();
      } else if (snapshot.empty && callState === 'incoming') {
        // Call was cancelled/ended
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
  }, [user, isCallingAvailable, callState]);

  // Stop ringtone when call state changes away from incoming
  useEffect(() => {
    if (callState !== 'incoming' && ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
  }, [callState]);

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
    acceptCall,
    endCall,
    toggleMute,
    toggleVideo
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};

// Export the declared component
export { CallProvider };
