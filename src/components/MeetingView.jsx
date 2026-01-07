import React, { useEffect, useRef, useMemo } from "react";
import { useMeeting, useParticipant } from "@videosdk.live/react-sdk";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';

const ParticipantView = ({ participantId, userName }) => {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const { webcamStream, micStream, webcamOn, micOn, displayName, isLocal } = useParticipant(participantId);

  useEffect(() => {
    if (videoRef.current) {
      if (webcamOn && webcamStream && webcamStream.track) {
        // Wrap the track in a new MediaStream to prevent the 'srcObject' error
        const mediaStream = new MediaStream();
        mediaStream.addTrack(webcamStream.track);
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch((err) => console.error("Video play error", err));
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [webcamStream, webcamOn]);

  // Attach mic stream to audio element (only for remote participants)
  useEffect(() => {
    if (!isLocal && audioRef.current && micStream && micStream.track) {
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
            {!micOn && (
              <p className="text-gray-400 text-xs mt-1">🔇 Muted</p>
            )}
          </div>
        </div>
      )}
      {!isLocal && micStream && (
        <audio
          ref={audioRef}
          autoPlay
          playsInline
        />
      )}
    </div>
  );
};

const MeetingView = ({ onLeave, userName }) => {
  const { join, leave, participants, localParticipant, toggleMic, toggleWebcam, micEnabled, webcamEnabled } = useMeeting();

  // FIX: Join only once on mount to avoid "Maximum update depth exceeded"
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
      if (leave) {
        try {
          leave();
        } catch (err) {
          console.warn('Error leaving meeting on unmount:', err);
        }
      }
    };
  }, []); // Empty dependency array - only run once

  // FIX: Filter participants to avoid showing the local user twice
  const remoteParticipants = useMemo(() => {
    if (!participants || typeof participants.keys !== 'function') {
      return [];
    }
    const localId = localParticipant?.id;
    return [...participants.keys()].filter((id) => id !== localId);
  }, [participants, localParticipant]);

  // Safe toggle handlers to avoid circular JSON error
  const handleToggleMic = () => {
    if (toggleMic) {
      try {
        toggleMic();
      } catch (err) {
        console.warn('Error toggling mic:', err);
      }
    }
  };

  const handleToggleWebcam = () => {
    if (toggleWebcam) {
      try {
        toggleWebcam();
      } catch (err) {
        console.warn('Error toggling webcam:', err);
      }
    }
  };

  const handleLeave = () => {
    try {
      if (leave) leave();
    } catch (err) {
      console.warn('Error calling leave():', err);
    }
    if (onLeave) onLeave();
  };

  const participantCount = (localParticipant ? 1 : 0) + remoteParticipants.length;
  const gridCols = participantCount === 1 ? 'grid-cols-1' : participantCount === 2 ? 'grid-cols-2' : 'grid-cols-2';

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Video Grid - Responsive: 1 col for mobile, 2 for desktop */}
      <div className={`flex-1 p-4 grid ${gridCols} gap-4 overflow-auto items-center`}>
        {/* Render Local User (You) - Only if it exists */}
        {localParticipant && localParticipant.id && (
          <ParticipantView 
            key={`local-${localParticipant.id}`}
            participantId={localParticipant.id}
            userName={userName}
          />
        )}
        
        {/* Render Remote Participants - Filtered to exclude local user */}
        {remoteParticipants.map((id) => (
          <ParticipantView 
            key={`remote-${id}`}
            participantId={id}
            userName={userName}
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

      {/* Control Bar */}
      <div className="bg-gradient-to-t from-black to-transparent p-6 flex-shrink-0">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleToggleMic}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              micEnabled 
                ? 'bg-gray-700 hover:bg-gray-600' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
            aria-label={micEnabled ? 'Mute' : 'Unmute'}
            title={micEnabled ? 'Mute' : 'Unmute'}
            disabled={!toggleMic}
          >
            {micEnabled ? (
              <Mic size={24} className="text-white" />
            ) : (
              <MicOff size={24} className="text-white" />
            )}
          </button>

          <button
            onClick={handleToggleWebcam}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              webcamEnabled 
                ? 'bg-gray-700 hover:bg-gray-600' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
            aria-label={webcamEnabled ? 'Turn off camera' : 'Turn on camera'}
            title={webcamEnabled ? 'Turn off camera' : 'Turn on camera'}
            disabled={!toggleWebcam}
          >
            {webcamEnabled ? (
              <Video size={24} className="text-white" />
            ) : (
              <VideoOff size={24} className="text-white" />
            )}
          </button>

          <button
            onClick={handleLeave}
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
