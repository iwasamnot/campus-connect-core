import { useMeeting, useParticipant } from '@videosdk.live/react-sdk';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { useEffect, useRef } from 'react';

const MeetingView = ({ onLeave, userName }) => {
  const { toggleMic, toggleWebcam, leave, participants, micEnabled, webcamEnabled, localParticipant, meeting, join } = useMeeting();

  // Join meeting on mount
  useEffect(() => {
    if (join) {
      join();
    }
    return () => {
      // Cleanup on unmount
      if (leave && meeting) {
        try {
          leave();
        } catch (err) {
          console.warn('Error leaving meeting on unmount:', err);
        }
      }
    };
  }, [join, leave, meeting]);

  const ParticipantView = ({ participantId }) => {
    const { webcamStream, micStream, displayName, webcamOn, micOn, isLocal: isLocalParticipant } = useParticipant(participantId);
    const videoRef = useRef(null);
    const audioRef = useRef(null);
    
    // Attach webcam stream to video element (safe version)
    useEffect(() => {
      if (videoRef.current && webcamOn && webcamStream && webcamStream.track) {
        try {
          const mediaStream = new MediaStream();
          mediaStream.addTrack(webcamStream.track);
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch((err) => {
            console.warn('Video play error:', err);
          });
        } catch (err) {
          console.error('Error attaching video stream:', err);
        }
      } else if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }, [webcamStream, webcamOn]);

    // Attach mic stream to audio element (only for remote participants)
    useEffect(() => {
      if (!isLocalParticipant && audioRef.current && micStream && micStream.track) {
        try {
          const mediaStream = new MediaStream();
          mediaStream.addTrack(micStream.track);
          audioRef.current.srcObject = mediaStream;
        } catch (err) {
          console.error('Error attaching audio stream:', err);
        }
      } else if (audioRef.current) {
        audioRef.current.srcObject = null;
      }
    }, [micStream, isLocalParticipant]);
    
    return (
      <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocalParticipant}
          className="w-full h-full object-cover"
        />
        {!webcamOn && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="text-center">
              <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl text-white font-bold">
                  {(displayName || userName || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <p className="text-white text-sm">{displayName || userName || 'Participant'}</p>
              {!micOn && (
                <p className="text-gray-400 text-xs mt-1">🔇 Muted</p>
              )}
            </div>
          </div>
        )}
        {!isLocalParticipant && micStream && (
          <audio
            ref={audioRef}
            autoPlay
            playsInline
          />
        )}
      </div>
    );
  };

  // Filter remote participants (exclude local user to avoid duplication)
  const remoteParticipants = localParticipant 
    ? Array.from(participants.keys()).filter(id => id !== localParticipant.id)
    : Array.from(participants.keys());

  // Calculate grid columns
  const participantCount = (localParticipant ? 1 : 0) + remoteParticipants.length;
  const gridCols = participantCount === 1 ? 'grid-cols-1' : participantCount === 2 ? 'grid-cols-2' : 'grid-cols-2';

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Video Grid */}
      <div className={`flex-1 p-4 grid ${gridCols} gap-4 overflow-auto`}>
        {/* Always show local user first */}
        {localParticipant && (
          <ParticipantView 
            key={localParticipant.id} 
            participantId={localParticipant.id} 
          />
        )}
        
        {/* Show remote participants */}
        {remoteParticipants.map((participantId) => (
          <ParticipantView 
            key={participantId} 
            participantId={participantId} 
          />
        ))}
        
        {/* Show waiting message if no participants */}
        {participantCount === 0 && (
          <div className="flex items-center justify-center h-full col-span-2">
            <div className="text-center text-white">
              <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video size={40} className="text-white" />
              </div>
              <p className="text-lg">Waiting for other participants to join...</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="bg-gradient-to-t from-black to-transparent p-6 flex-shrink-0">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => toggleMic()}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              micEnabled 
                ? 'bg-gray-700 hover:bg-gray-600' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
            aria-label={micEnabled ? 'Mute' : 'Unmute'}
            title={micEnabled ? 'Mute' : 'Unmute'}
          >
            {micEnabled ? (
              <Mic size={24} className="text-white" />
            ) : (
              <MicOff size={24} className="text-white" />
            )}
          </button>

          <button
            onClick={() => toggleWebcam()}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              webcamEnabled 
                ? 'bg-gray-700 hover:bg-gray-600' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
            aria-label={webcamEnabled ? 'Turn off camera' : 'Turn on camera'}
            title={webcamEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {webcamEnabled ? (
              <Video size={24} className="text-white" />
            ) : (
              <VideoOff size={24} className="text-white" />
            )}
          </button>

          <button
            onClick={() => {
              // Guard: Only call leave() if meeting object exists
              try {
                if (meeting && leave) {
                  leave();
                }
              } catch (err) {
                console.warn('Error calling leave():', err);
              }
              // Always call onLeave to clean up state
              if (onLeave) onLeave();
            }}
            className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors"
            aria-label="Leave meeting"
            title="Leave meeting"
          >
            <PhoneOff size={28} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingView;
