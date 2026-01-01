import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

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
    return !!appID && appID.trim() !== '';
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
        try {
          const streamList = await zg.getStreamList();
          streamList.forEach(stream => {
            if (stream.streamID !== streamID) {
              zg.stopPlayingStream(stream.streamID).catch(err => {
                console.error('Error stopping remote stream:', err);
              });
            }
          });
        } catch (err) {
          console.error('Error getting stream list:', err);
        }

        // Leave room
        try {
          await zg.logoutRoom(roomIDRef.current);
        } catch (err) {
          console.error('Error logging out of room:', err);
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

      // Generate room ID
      const roomID = [user.uid, target.id].sort().join('_');
      roomIDRef.current = roomID;

      // Join room (token-less mode for development - empty string as token)
      // For production, generate token server-side and pass it here
      const token = ''; // Empty token for token-less mode (requires ZEGOCLOUD app config)
      const loginResult = await zg.loginRoom(roomID, token, { 
        userID: user.uid, 
        userName: user.email || user.displayName || 'User' 
      });

      if (loginResult !== 0) {
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

      // Check for existing remote streams and subscribe to them
      const streamList = await zg.getStreamList();
      streamList.forEach(existingStream => {
        if (existingStream.streamID !== streamID) {
          console.log('Found existing remote stream, subscribing:', existingStream.streamID);
          zg.startPlayingStream(existingStream.streamID).then(remoteStream => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
            }
          }).catch(err => {
            console.error('Error subscribing to existing remote stream:', err);
          });
        }
      });

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

  const value = {
    callState,
    callType,
    callTarget,
    isMuted,
    isVideoEnabled,
    localVideoRef,
    remoteVideoRef,
    isCallingAvailable: isCallingAvailable(),
    startCall,
    endCall,
    toggleMute,
    toggleVideo
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};
