import { useMeeting, useParticipant } from '@videosdk.live/react-sdk';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { useEffect, useRef } from 'react';

const MeetingView = ({ onLeave, userName }) => {
  const { toggleMic, toggleWebcam, leave, participants, micEnabled, webcamEnabled, localParticipant, meeting } = useMeeting();

  const ParticipantView = ({ participantId, isLocal = false }) => {
    const { webcamStream, micStream, displayName, isLocal: isLocalParticipant } = useParticipant(participantId);
    const videoRef = useRef(null);
    const audioRef = useRef(null);
    
    useEffect(() => {
      if (videoRef.current && webcamStream) {
        const mediaStream = new MediaStream();
        mediaStream.addTrack(webcamStream.track);
        videoRef.current.srcObject = mediaStream;
      }
    }, [webcamStream]);

    useEffect(() => {
      if (audioRef.current && micStream) {
        const mediaStream = new MediaStream();
        mediaStream.addTrack(micStream.track);
        audioRef.current.srcObject = mediaStream;
      }
    }, [micStream]);
    
    return (
      <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
        {webcamStream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocalParticipant}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <div className="text-center">
              <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-white font-bold">
                  {(displayName || userName || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <p className="text-white">{displayName || userName || 'Participant'}</p>
            </div>
          </div>
        )}
        {micStream && !isLocalParticipant && (
          <audio
            ref={audioRef}
            autoPlay
            playsInline
          />
        )}
      </div>
    );
  };

  const participantsArray = Array.from(participants.keys());

  return (
    <div className="w-full h-full flex flex-col bg-black">
      {/* Video Grid */}
      <div className="flex-1 p-4 grid grid-cols-1 gap-4 overflow-auto">
        {/* Local participant (self) */}
        {localParticipant && (
          <ParticipantView 
            key={localParticipant.id} 
            participantId={localParticipant.id} 
            isLocal={true}
          />
        )}
        {/* Remote participants */}
        {participantsArray.length > 0 ? (
          participantsArray.map((participantId) => (
            <ParticipantView key={participantId} participantId={participantId} />
          ))
        ) : (
          !localParticipant && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white">
                <p>Waiting for other participants to join...</p>
              </div>
            </div>
          )
        )}
      </div>

      {/* Controls */}
      <div className="bg-gradient-to-t from-black to-transparent p-6">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={toggleMic}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              micEnabled 
                ? 'bg-gray-700 hover:bg-gray-600' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
            aria-label={micEnabled ? 'Mute' : 'Unmute'}
          >
            {micEnabled ? (
              <Mic size={24} className="text-white" />
            ) : (
              <MicOff size={24} className="text-white" />
            )}
          </button>

          <button
            onClick={toggleWebcam}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              webcamEnabled 
                ? 'bg-gray-700 hover:bg-gray-600' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
            aria-label={webcamEnabled ? 'Turn off camera' : 'Turn on camera'}
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
          >
            <PhoneOff size={28} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingView;
