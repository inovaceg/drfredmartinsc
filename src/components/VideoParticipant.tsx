"use client";

import React, { useEffect, useRef, useState } from 'react';
import { 
  RemoteTrackPublication, 
  LocalTrackPublication,
  RemoteVideoTrack, 
  RemoteAudioTrack, 
  LocalVideoTrack, 
  LocalAudioTrack, 
  RemoteTrack, 
  LocalTrack 
} from 'twilio-video';
import { MicOff, VideoOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoParticipantProps {
  participant: any; // Objeto Participant do Twilio (LocalParticipant ou RemoteParticipant)
  isLocal?: boolean;
  displayName: string;
}

// Define os tipos de faixas que possuem os métodos attach/detach
type MediaTrack = RemoteVideoTrack | RemoteAudioTrack | LocalVideoTrack | LocalAudioTrack;
type TrackPublication = RemoteTrackPublication | LocalTrackPublication;

const trackpubsToTracks = (trackMap: Map<string, TrackPublication>): MediaTrack[] =>
  Array.from(trackMap.values())
    .map((publication) => publication.track as any)
    .filter((track): track is MediaTrack => 
      !!track && (track.kind === 'audio' || track.kind === 'video')
    );

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
      if (publication.track && (publication.track.kind === 'audio' || publication.track.kind === 'video')) {
        if (publication.isSubscribed) {
          attachTracks([publication.track as MediaTrack]);
        }
        publication.on('subscribed', (track) => attachTracks([track as MediaTrack]));
        publication.on('unsubscribed', (track) => detachTracks([track as MediaTrack]));
      }
      
      publication.on('disabled', () => {
        if (publication.kind === 'video') setIsVideoDisabled(true);
        if (publication.kind === 'audio') setIsAudioMuted(true);
      });
      publication.on('enabled', () => {
        if (publication.kind === 'video') setIsVideoDisabled(false);
        if (publication.kind === 'audio') setIsAudioMuted(false);
      });
    };

    // Inicialização das faixas existentes
    const videoTracks = trackpubsToTracks(participant.videoTracks);
    const audioTracks = trackpubsToTracks(participant.audioTracks);
    attachTracks([...videoTracks, ...audioTracks]);

    // Ouvintes para novas faixas e mudanças de estado
    participant.on('trackPublished', handleTrackPublication);
    participant.on('trackSubscribed', (track: RemoteTrack | LocalTrack) => {
      if (track.kind !== 'data') attachTracks([track as MediaTrack]);
    });
    participant.on('trackUnsubscribed', (track: RemoteTrack | LocalTrack) => {
      if (track.kind !== 'data') detachTracks([track as MediaTrack]);
    });

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