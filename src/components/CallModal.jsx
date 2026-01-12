import { useContext, useEffect, useState } from 'react';
import { CallContext } from '../context/CallContext';
import { useAuth } from '../context/AuthContext';
import { MeetingProvider } from '@videosdk.live/react-sdk';
import MeetingView from './MeetingView';
import { Phone, Video, X, Minimize2, Maximize2 } from 'lucide-react';

const CallModal = () => {
  const callContext = useContext(CallContext);
  const { user } = useAuth();

  if (!callContext || !callContext.callState || !callContext.callTarget) {
    return null;
  }

  const { callState, callType, callTarget, token, meetingId, acceptCall, endCall } = callContext;
  const [isMinimized, setIsMinimized] = useState(false);

  // Only lock body scroll for pre-call UI, not active calls
  useEffect(() => {
    if (callState && callState !== 'active') {
      // Lock body scroll only for pre-call (incoming/outgoing)
      document.body.style.overflow = 'hidden';
      
      // Handle browser back button - exit call
      const handlePopState = (e) => {
        e.preventDefault();
        endCall();
        window.history.pushState(null, '', window.location.href);
      };

      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
        document.body.style.overflow = '';
      };
    } else {
      // Allow scrolling during active calls so users can see messages
      document.body.style.overflow = '';
    }
  }, [callState, endCall]);

  // Active call - show VideoSDK meeting as floating overlay
  if (callState === 'active' && token && meetingId) {
    const userName = user?.email?.split('@')[0] || user?.displayName || 'User';

    return (
      <div 
        className={`fixed transition-all duration-300 ${
          isMinimized 
            ? 'bottom-4 right-4 w-80 h-60 rounded-lg overflow-hidden shadow-2xl z-[60]' 
            : 'inset-0 bg-black z-[9999]'
        }`}
        style={{ 
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          touchAction: isMinimized ? 'manipulation' : 'none'
        }}
      >
        {/* Minimize/Maximize button */}
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="absolute top-2 right-2 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors touch-manipulation"
          style={{ touchAction: 'manipulation' }}
          aria-label={isMinimized ? 'Maximize call' : 'Minimize call'}
        >
          {isMinimized ? (
            <Maximize2 size={20} className="text-white" />
          ) : (
            <Minimize2 size={20} className="text-white" />
          )}
        </button>

        <MeetingProvider
          config={{
            meetingId: meetingId,
            micEnabled: true,
            webcamEnabled: callType === 'video',
            name: userName
          }}
          token={token}
          joinWithoutUserInteraction={true}
        >
          <MeetingView 
            onLeave={endCall} 
            userName={userName}
            isMinimized={isMinimized}
          />
        </MeetingProvider>
      </div>
    );
  }

  // Pre-call UI (outgoing/incoming)
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 z-[100] flex items-center justify-center touch-none"
      style={{ 
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none'
      }}
      onClick={(e) => {
        // Prevent accidental dismissals, but allow clicking buttons
        if (e.target === e.currentTarget) {
          // Only allow dismiss on outgoing calls by clicking outside
          if (callState === 'outgoing') {
            endCall();
          }
        }
      }}
    >
      <div className="relative w-full h-full flex flex-col">
        <div className="flex-1 relative bg-gray-900 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              {callType === 'video' ? (
                <Video size={40} className="text-white" />
              ) : (
                <Phone size={40} className="text-white" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {callState === 'outgoing' ? 'Calling...' : 'Incoming Call'}
            </h2>
            <p className="text-gray-400">
              {callTarget.name || callTarget.email || 'User'}
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-8" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
          <div className="flex items-center justify-center gap-6">
            {callState === 'incoming' && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    endCall();
                  }}
                  className="w-20 h-20 rounded-full bg-red-600 active:bg-red-700 flex items-center justify-center transition-colors touch-manipulation"
                  style={{ touchAction: 'manipulation' }}
                  aria-label="Decline call"
                >
                  <X size={32} className="text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    acceptCall();
                  }}
                  className="w-20 h-20 rounded-full bg-green-600 active:bg-green-700 flex items-center justify-center transition-colors animate-pulse touch-manipulation"
                  style={{ touchAction: 'manipulation' }}
                  aria-label="Accept call"
                >
                  <Phone size={32} className="text-white" />
                </button>
              </>
            )}

            {callState === 'outgoing' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  endCall();
                }}
                className="w-20 h-20 rounded-full bg-red-600 active:bg-red-700 flex items-center justify-center transition-colors touch-manipulation"
                style={{ touchAction: 'manipulation' }}
                aria-label="Cancel call"
              >
                <X size={32} className="text-white" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallModal;

