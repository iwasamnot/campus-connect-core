import { useContext } from 'react';
import { CallContext } from '../context/CallContext';
import { Phone, Video, Mic, MicOff, VideoOff, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MeetingProvider } from '@videosdk.live/react-sdk';
import MeetingView from './MeetingView';

const CallModal = () => {
  // Safely get context with fallback
  const callContext = useContext(CallContext);
  
  // If context is not available, don't render (prevents error during HMR or initialization)
  if (!callContext) {
    return null;
  }

  const { 
    callState, 
    callType, 
    callTarget, 
    isMuted, 
    isVideoEnabled, 
    localVideoRef, 
    remoteVideoRef,
    token,
    meetingId,
    acceptCall,
    endCall, 
    toggleMute, 
    toggleVideo
  } = callContext;
  const { user } = useAuth();

  if (!callState || !callTarget) return null;

  // If call is active and we have token/meetingId, use VideoSDK MeetingProvider
  if (callState === 'active' && token && meetingId) {
    const userName = user?.email?.split('@')[0] || user?.displayName || 'User';
    
    return (
      <div className="fixed inset-0 bg-black z-50">
        <MeetingProvider
          config={{
            meetingId: meetingId,
            micEnabled: !isMuted,
            webcamEnabled: callType === 'video' && isVideoEnabled,
            name: userName
          }}
          token={token}
          joinWithoutUserInteraction={true}
        >
          <MeetingView 
            onLeave={endCall}
            userName={userName}
          />
        </MeetingProvider>
      </div>
    );
  }

  // Render pre-call UI (outgoing/incoming)
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="relative w-full h-full flex flex-col">
        {/* Placeholder screen */}
        <div className="flex-1 relative bg-gray-900">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                {callType === 'video' ? (
                  <Video size={40} className="text-white" />
                ) : (
                  <Phone size={40} className="text-white" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {callState === 'outgoing' ? 'Calling...' : callState === 'incoming' ? 'Incoming Call' : callTarget.name || callTarget.email}
              </h2>
              <p className="text-gray-400">
                {callState === 'incoming' ? (callTarget.name || callTarget.email) : (callType === 'video' ? 'Video Call' : 'Voice Call')}
              </p>
            </div>
          </div>
        </div>

        {/* Call controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-8">
          <div className="flex items-center justify-center gap-4">
            {/* Incoming call controls */}
            {callState === 'incoming' && (
              <>
                <button
                  onClick={endCall}
                  className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors shadow-lg"
                  aria-label="Decline call"
                  title="Decline"
                >
                  <X size={28} className="text-white" />
                </button>
                <button
                  onClick={acceptCall}
                  className="w-16 h-16 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center transition-colors shadow-lg animate-pulse"
                  aria-label="Accept call"
                  title="Accept"
                >
                  <Phone size={28} className="text-white" />
                </button>
              </>
            )}

            {/* Outgoing call controls */}
            {callState === 'outgoing' && (
              <button
                onClick={endCall}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors"
                aria-label="Cancel call"
                title="Cancel"
              >
                <X size={28} className="text-white" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallModal;
