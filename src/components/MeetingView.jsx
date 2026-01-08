import { useEffect, useRef, useMemo } from 'react';
import { useMeeting, useParticipant } from '@videosdk.live/react-sdk';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';

const ParticipantView = ({ participantId, userName }) => {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const { webcamStream, micStream, webcamOn, micOn, displayName, isLocal } = useParticipant(participantId);

  // Attach video stream
  useEffect(() => {
    if (videoRef.current) {
      if (webcamOn && webcamStream?.track) {
        const mediaStream = new MediaStream();
        mediaStream.addTrack(webcamStream.track);
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(console.error);
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [webcamStream, webcamOn]);

  // Attach audio stream (remote only)
  useEffect(() => {
    if (!isLocal && audioRef.current && micStream?.track) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(micStream.track);
      audioRef.current.srcObject = mediaStream;
    } else if (audioRef.current) {
      audioRef.current.srcObject = null;
    }
  }, [micStream, isLocal]);

  return (
    <div className="relative bg-gray-800 rounded-lg overflow-hidden w-full aspect-video border border-gray-700">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className="w-full h-full object-cover"
      />
      {!webcamOn && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
          <div className="text-center">
            <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
              {(displayName || userName || participantId).charAt(0).toUpperCase()}
            </div>
            <p className="text-white text-sm">{displayName || userName || 'Participant'}</p>
            {!micOn && <p className="text-gray-400 text-xs mt-1">🔇 Muted</p>}
          </div>
        </div>
      )}
      {!isLocal && micStream && (
        <audio ref={audioRef} autoPlay playsInline />
      )}
    </div>
  );
};

const MeetingView = ({ onLeave, userName, isMinimized = false }) => {
  const { join, leave, participants, localParticipant, toggleMic, toggleWebcam, micEnabled, webcamEnabled } = useMeeting();

  // Join meeting once on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (join) {
        try {
          join();
        } catch (err) {
          console.warn('Error joining meeting:', err);
        }
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      // Don't call leave in cleanup - it causes errors when component unmounts
      // The meeting will be cleaned up automatically when MeetingProvider unmounts
    };
  }, [join]);

  // Filter remote participants
  const remoteParticipants = useMemo(() => {
    if (!participants || typeof participants.keys !== 'function') return [];
    const localId = localParticipant?.id;
    return [...participants.keys()].filter(id => id !== localId);
  }, [participants, localParticipant]);

  const participantCount = (localParticipant ? 1 : 0) + remoteParticipants.length;
  const gridCols = participantCount === 1 ? 'grid-cols-1' : 'grid-cols-2';

  // Minimized view - compact picture-in-picture style
  if (isMinimized) {
    const mainParticipant = remoteParticipants[0] || localParticipant?.id;
    
    return (
      <div className="flex flex-col h-full bg-black rounded-lg overflow-hidden">
        <div className="flex-1 relative">
          {mainParticipant && (
            <ParticipantView
              key={mainParticipant}
              participantId={mainParticipant}
              userName={userName}
            />
          )}
        </div>
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-2">
          <button
            onClick={() => toggleMic?.()}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors touch-manipulation ${
              micEnabled ? 'bg-gray-700/80 active:bg-gray-600' : 'bg-red-600/80 active:bg-red-700'
            }`}
            style={{ touchAction: 'manipulation' }}
            aria-label={micEnabled ? 'Mute' : 'Unmute'}
          >
            {micEnabled ? (
              <Mic size={14} className="text-white" />
            ) : (
              <MicOff size={14} className="text-white" />
            )}
          </button>
          <button
            onClick={() => {
              if (onLeave) onLeave();
              if (leave) {
                try {
                  leave();
                } catch (err) {
                  console.warn('Error leaving meeting:', err);
                }
              }
            }}
            className="w-8 h-8 rounded-full bg-red-600/80 active:bg-red-700 flex items-center justify-center transition-colors touch-manipulation"
            style={{ touchAction: 'manipulation' }}
            aria-label="Leave meeting"
          >
            <PhoneOff size={14} className="text-white" />
          </button>
        </div>
      </div>
    );
  }

  // Full view
  return (
    <div className="flex flex-col h-full bg-black">
      <div className={`flex-1 p-4 grid ${gridCols} gap-4 overflow-auto`}>
        {localParticipant?.id && (
          <ParticipantView
            key={`local-${localParticipant.id}`}
            participantId={localParticipant.id}
            userName={userName}
          />
        )}
        {remoteParticipants.map(id => (
          <ParticipantView
            key={`remote-${id}`}
            participantId={id}
            userName={userName}
          />
        ))}
        {participantCount === 0 && (
          <div className="flex items-center justify-center h-full col-span-2">
            <div className="text-center text-white">
              <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video size={40} className="text-white" />
              </div>
              <p className="text-lg">Waiting for participants...</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-t from-black to-transparent p-6 flex-shrink-0" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => toggleMic?.()}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors touch-manipulation ${
              micEnabled ? 'bg-gray-700 active:bg-gray-600' : 'bg-red-600 active:bg-red-700'
            }`}
            style={{ touchAction: 'manipulation' }}
            aria-label={micEnabled ? 'Mute' : 'Unmute'}
          >
            {micEnabled ? (
              <Mic size={28} className="text-white" />
            ) : (
              <MicOff size={28} className="text-white" />
            )}
          </button>

          <button
            onClick={() => toggleWebcam?.()}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors touch-manipulation ${
              webcamEnabled ? 'bg-gray-700 active:bg-gray-600' : 'bg-red-600 active:bg-red-700'
            }`}
            style={{ touchAction: 'manipulation' }}
            aria-label={webcamEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {webcamEnabled ? (
              <Video size={28} className="text-white" />
            ) : (
              <VideoOff size={28} className="text-white" />
            )}
          </button>

          <button
            onClick={() => {
              // Call onLeave first to clean up state
              if (onLeave) onLeave();
              // Then try to leave meeting (with error handling)
              if (leave) {
                try {
                  leave();
                } catch (err) {
                  console.warn('Error leaving meeting:', err);
                }
              }
            }}
            className="w-20 h-20 rounded-full bg-red-600 active:bg-red-700 flex items-center justify-center transition-colors touch-manipulation"
            style={{ touchAction: 'manipulation' }}
            aria-label="Leave meeting"
          >
            <PhoneOff size={32} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingView;

