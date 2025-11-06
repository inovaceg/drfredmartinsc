"use client";

import React, { useEffect, useRef, useState } from 'react';
import { RemoteTrackPublication, RemoteVideoTrack, RemoteAudioTrack, LocalVideoTrack, LocalAudioTrack } from 'twilio-video';
import { MicOff, VideoOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoParticipantProps {
  participant: any; // Twilio Participant object (LocalParticipant or RemoteParticipant)
  isLocal?: boolean;
  displayName: string;
}

export const VideoParticipant: React.FC<VideoParticipantProps> = ({ participant, isLocal = false, displayName }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);

  const trackpubsToTracks = (trackMap: Map<string, RemoteTrackPublication>) =>
    Array.from(trackMap.values())
      .map((publication) => publication.track)
      .filter((track) => track !== null);

  useEffect(() => {
    const attachTracks = (tracks: (RemoteVideoTrack | RemoteAudioTrack | LocalVideoTrack | LocalAudioTrack)[]) => {
      tracks.forEach((track) => {
        if (track.kind === 'video' && videoRef.current) {
          track.attach(videoRef.current);
          setIsVideoDisabled(false);
        } else if (track.kind === 'audio' && audioRef.current) {
          track.attach(audioRef.current);
          setIsAudioMuted(false);
        }
      });
    };

    const detachTracks = (tracks: (RemoteVideoTrack | RemoteAudioTrack | LocalVideoTrack | LocalAudioTrack)[]) => {
      tracks.forEach((track) => {
        track.detach().forEach((element) => element.remove());
        if (track.kind === 'video') setIsVideoDisabled(true);
        if (track.kind === 'audio') setIsAudioMuted(true);
      });
    };

    const handleTrackPublication = (publication: RemoteTrackPublication) => {
      if (publication.isSubscribed) {
        attachTracks([publication.track!]);
      }
      publication.on('subscribed', (track) => attachTracks([track]));
      publication.on('unsubscribed', (track) => detachTracks([track]));
      publication.on('disabled', (track) => {
        if (track.kind === 'video') setIsVideoDisabled(true);
        if (track.kind === 'audio') setIsAudioMuted(true);
      });
      publication.on('enabled', (track) => {
        if (track.kind === 'video') setIsVideoDisabled(false);
        if (track.kind === 'audio') setIsAudioMuted(false);
      });
    };

    // Initial attachment for existing tracks
    const videoTracks = trackpubsToTracks(participant.videoTracks);
    const audioTracks = trackpubsToTracks(participant.audioTracks);
    attachTracks([...videoTracks, ...audioTracks]);

    // Listen for new tracks
    participant.on('trackPublished', handleTrackPublication);
    participant.on('trackSubscribed', attachTracks);
    participant.on('trackUnsubscribed', detachTracks);
    participant.on('trackDisabled', (track: any) => {
      if (track.kind === 'video') setIsVideoDisabled(true);
      if (track.kind === 'audio') setIsAudioMuted(true);
    });
    participant.on('trackEnabled', (track: any) => {
      if (track.kind === 'video') setIsVideoDisabled(false);
      if (track.kind === 'audio') setIsAudioMuted(false);
    });

    // Cleanup
    return () => {
      detachTracks([...videoTracks, ...audioTracks]);
      participant.removeAllListeners();
    };
  }, [participant]);

  return (
    <div className="relative bg-black rounded-lg overflow-hidden w-full h-full">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal} // Mute local video to avoid echo
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          isVideoDisabled ? "opacity-0" : "opacity-100"
        )}
      />
      <audio ref={audioRef} autoPlay muted={isLocal} /> {/* Mute local audio to avoid echo */}

      {isVideoDisabled && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 text-white">
          <VideoOff className="h-12 w-12" />
        </div>
      )}

      <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded-md text-sm flex items-center gap-1">
        {displayName}
        {isAudioMuted && <MicOff className="h-4 w-4 text-red-400" />}
      </div>
    </div>
  );
};