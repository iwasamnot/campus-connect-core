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

  // Initialize ZEGOCLOUD
  const initZegoCloud = useCallback(async () => {
    try {
      const ZegoExpressEngine = (await import('zego-express-engine-webrtc')).ZegoExpressEngine;
      
      const appID = import.meta.env.VITE_ZEGOCLOUD_APP_ID;
      
      if (!appID) {
        console.warn('ZEGOCLOUD App ID not found. Calls will not work.');
        return null;
      }

      // Note: Token generation should be done server-side for security
      // For now using placeholder - implement server-side token generation
      const token = 'placeholder-token';
      
      const zg = new ZegoExpressEngine(parseInt(appID), token);
      
      zegoCloudRef.current = zg;
      return zg;
    } catch (error) {
      console.error('Error initializing ZEGOCLOUD:', error);
      return null;
    }
  }, []);

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

      const zg = await initZegoCloud();
      if (!zg) {
        showError('Calling service unavailable. Please check configuration.');
        setCallState(null);
        return;
      }

      // Generate room ID
      const roomID = [user.uid, target.id].sort().join('_');
      roomIDRef.current = roomID;

      // Join room
      await zg.loginRoom(roomID, { userID: user.uid, userName: user.email || 'User' });

      // Create and publish stream
      const streamConfig = type === 'video'
        ? { camera: { video: true, audio: true }, microphone: { audio: true } }
        : { camera: { video: false, audio: true }, microphone: { audio: true } };

      const stream = await zg.createStream(streamConfig);
      setLocalStream(stream);
      
      if (type === 'video' && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      await zg.startPublishingStream(`${user.uid}_main`, stream);
      setIsVideoEnabled(type === 'video');
      setCallState('active');
      setIsMuted(false);
    } catch (error) {
      console.error('Error starting call:', error);
      showError('Failed to start call. Please try again.');
      setCallState(null);
      endCall();
    }
  }, [user, initZegoCloud, showError]);

  // End call
  const endCall = useCallback(async () => {
    try {
      const zg = zegoCloudRef.current;
      if (zg && roomIDRef.current) {
        if (localStream) {
          await zg.stopPublishingStream(`${user?.uid}_main`);
          localStream.getTracks().forEach(track => track.stop());
        }
        await zg.logoutRoom(roomIDRef.current);
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }

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
      endCall();
      if (zegoCloudRef.current) {
        zegoCloudRef.current.destroyEngine();
      }
    };
  }, [endCall]);

  const value = {
    callState,
    callType,
    callTarget,
    isMuted,
    isVideoEnabled,
    localVideoRef,
    remoteVideoRef,
    startCall,
    endCall,
    toggleMute,
    toggleVideo
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};
