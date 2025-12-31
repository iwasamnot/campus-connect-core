import { useCall } from '../context/CallContext';
import { Phone, Video, Mic, MicOff, VideoOff, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CallModal = () => {
  const { 
    callState, 
    callType, 
    callTarget, 
    isMuted, 
    isVideoEnabled, 
    localVideoRef, 
    remoteVideoRef,
    endCall, 
    toggleMute, 
    toggleVideo 
  } = useCall();
  const { user } = useAuth();

  if (!callState || !callTarget) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="relative w-full h-full flex flex-col">
        {/* Remote video (full screen when active) */}
        <div className="flex-1 relative bg-gray-900">
          {callType === 'video' && callState === 'active' ? (
            <>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {/* Local video overlay (small, bottom right) */}
              <div className="absolute bottom-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-white">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            </>
          ) : (
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
                  {callState === 'outgoing' ? 'Calling...' : callTarget.name || callTarget.email}
                </h2>
                <p className="text-gray-400">
                  {callType === 'video' ? 'Video Call' : 'Voice Call'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Call controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-8">
          <div className="flex items-center justify-center gap-4">
            {/* Mute button */}
            {callState === 'active' && (
              <button
                onClick={toggleMute}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                  isMuted 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff size={24} className="text-white" /> : <Mic size={24} className="text-white" />}
              </button>
            )}

            {/* Video toggle (only for video calls) */}
            {callState === 'active' && callType === 'video' && (
              <button
                onClick={toggleVideo}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                  isVideoEnabled 
                    ? 'bg-gray-700 hover:bg-gray-600' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
                aria-label={isVideoEnabled ? 'Turn off video' : 'Turn on video'}
              >
                {isVideoEnabled ? <Video size={24} className="text-white" /> : <VideoOff size={24} className="text-white" />}
              </button>
            )}

            {/* End call button */}
            <button
              onClick={endCall}
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors"
              aria-label="End call"
            >
              <X size={28} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallModal;

