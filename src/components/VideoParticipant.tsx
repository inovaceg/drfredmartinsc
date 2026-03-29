"use client";

import React, { useEffect, useRef, useState } from 'react';
import { RemoteTrackPublication, RemoteVideoTrack, RemoteAudioTrack, LocalVideoTrack, LocalAudioTrack, RemoteTrack, LocalTrack } from 'twilio-video';
import { MicOff, VideoOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoParticipantProps {
  participant: any; // Twilio Participant object (LocalParticipant or RemoteParticipant)
  isLocal?: boolean;
  displayName: string;
}

// Define a type guard for media tracks
type MediaTrack = RemoteVideoTrack | RemoteAudioTrack | LocalVideoTrack | LocalAudioTrack;

const isMediaTrack = (track: RemoteTrack | LocalTrack | null): track is MediaTrack => {
  return track !== null && (track.kind === 'audio' || track.kind === 'video');
};

const trackpubsToTracks = (trackMap: Map<string, RemoteTrackPublication>): MediaTrack[] =>
  Array.from(trackMap.values())
    .map((publication) => publication.track)
    .filter((track): track is MediaTrack => isMediaTrack(track)); // Explicit narrowing

export const VideoParticipant: React.FC<VideoParticipantProps> = ({ participant, isLocal = false, displayName }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);

  useEffect(() => {
    const attachTracks = (tracks: MediaTrack[]) => {
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

    const detachTracks = (tracks: MediaTrack[]) => {
      tracks.forEach((track) => {
        track.detach().forEach((element) => element.remove());
        if (track.kind === 'video') setIsVideoDisabled(true);
        if (track.kind === 'audio') setIsAudioMuted(true);
      });
    };

    const handleTrackPublication = (publication: RemoteTrackPublication) => {
      if (!isMediaTrack(publication.track)) return; // Ignore DataTracks

      if (publication.isSubscribed) {
        attachTracks([publication.track! as MediaTrack]);
      }
      publication.on('subscribed', (track) => {
        if (isMediaTrack(track)) attachTracks([track]);
      });
      publication.on('unsubscribed', (track) => {
        if (isMediaTrack(track)) detachTracks([track]);
      });
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
    participant.on('trackSubscribed', (track: RemoteTrack | LocalTrack) => {
      if (isMediaTrack(track)) attachTracks([track]);
    });
    participant.on('trackUnsubscribed', (track: RemoteTrack | LocalTrack) => {
      if (isMediaTrack(track)) detachTracks([track]);
    });
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
        muted={isLocal}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          isVideoDisabled ? "opacity-0" : "opacity-100"
        )}
      />
      <audio ref={audioRef} autoPlay muted={isLocal} />

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