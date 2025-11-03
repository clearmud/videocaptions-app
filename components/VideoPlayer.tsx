
import React, { useMemo, useRef, useEffect, forwardRef, useImperativeHandle, useState } from 'react';
import type { Caption } from '../types';
import { AnimationType } from '../types';

interface VideoPlayerProps {
  videoUrl: string;
  captions: Caption[];
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  onLoadedMetadata: (duration: number) => void;
  isPlaying: boolean;
  onPlayPause: (playing: boolean) => void;
  onUpdateCaption: (caption: Caption) => void;
}

const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(({
  videoUrl,
  captions,
  currentTime,
  onTimeUpdate,
  onLoadedMetadata,
  isPlaying,
  onPlayPause,
  onUpdateCaption
}, ref) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  useImperativeHandle(ref, () => localVideoRef.current as HTMLVideoElement);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragInfo = useRef<{ caption: Caption; offsetX: number; offsetY: number; containerRect: DOMRect } | null>(null);
  const [aspectRatio, setAspectRatio] = useState('16 / 9');

  const activeCaption = useMemo(() => {
    return captions.find(c => currentTime >= c.startTime && currentTime <= c.endTime);
  }, [captions, currentTime]);

  useEffect(() => {
    const video = localVideoRef.current;
    if (!video) return;
    if (isPlaying) {
      // FIX: Property 'play' does not exist on type 'HTMLVideoElement'.
      (video as any).play().catch(console.error);
    } else {
      // FIX: Property 'pause' does not exist on type 'HTMLVideoElement'.
      (video as any).pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const video = localVideoRef.current;
    if (!video) return;

    // FIX: Property 'currentTime' does not exist on type 'HTMLVideoElement'.
    const handleTimeUpdate = () => onTimeUpdate((video as any).currentTime);
    const handleLoadedMetadata = () => {
        // FIX: Property 'duration' does not exist on type 'HTMLVideoElement'.
        onLoadedMetadata((video as any).duration);
        // FIX: Properties 'videoWidth'/'videoHeight' do not exist on type 'HTMLVideoElement'.
        if ((video as any).videoWidth > 0 && (video as any).videoHeight > 0) {
            setAspectRatio(`${(video as any).videoWidth} / ${(video as any).videoHeight}`);
        }
    };
    const handlePlay = () => onPlayPause(true);
    const handlePause = () => onPlayPause(false);

    // FIX: Property 'addEventListener' does not exist on type 'HTMLVideoElement'.
    (video as any).addEventListener('timeupdate', handleTimeUpdate);
    (video as any).addEventListener('loadedmetadata', handleLoadedMetadata);
    (video as any).addEventListener('play', handlePlay);
    (video as any).addEventListener('pause', handlePause);

    return () => {
      // FIX: Property 'removeEventListener' does not exist on type 'HTMLVideoElement'.
      (video as any).removeEventListener('timeupdate', handleTimeUpdate);
      (video as any).removeEventListener('loadedmetadata', handleLoadedMetadata);
      (video as any).removeEventListener('play', handlePlay);
      (video as any).removeEventListener('pause', handlePause);
    };
  }, [onTimeUpdate, onLoadedMetadata, onPlayPause]);
  
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, caption: Caption) => {
    e.preventDefault();
    const target = e.currentTarget;
    // FIX: Property 'getBoundingClientRect' does not exist on type 'HTMLDivElement'.
    const containerRect = (containerRef.current! as any).getBoundingClientRect();
    // FIX: Property 'getBoundingClientRect' does not exist on type 'EventTarget & HTMLDivElement'.
    const targetRect = (target as any).getBoundingClientRect();

    dragInfo.current = {
      caption,
      offsetX: e.clientX - targetRect.left,
      offsetY: e.clientY - targetRect.top,
      containerRect,
    };

    // FIX: Property 'addEventListener' does not exist on type 'Window'.
    (window as any).addEventListener('mousemove', handleMouseMove);
    (window as any).addEventListener('mouseup', handleMouseUp);
  };
  
  const handleMouseMove = (e: MouseEvent) => {
    if (!dragInfo.current) return;
    
    const { caption, offsetX, offsetY, containerRect } = dragInfo.current;
    
    // FIX: Property 'clientX'/'clientY' does not exist on type 'MouseEvent'.
    let x = (e as any).clientX - containerRect.left - offsetX;
    let y = (e as any).clientY - containerRect.top - offsetY;

    // Convert to percentage and clamp
    const xPercent = Math.max(0, Math.min(100, (x / containerRect.width) * 100));
    const yPercent = Math.max(0, Math.min(100, (y / containerRect.height) * 100));

    onUpdateCaption({
      ...caption,
      style: {
        ...caption.style,
        position: { x: xPercent, y: yPercent },
      },
    });
  };

  const handleMouseUp = () => {
    dragInfo.current = null;
    // FIX: Property 'removeEventListener' does not exist on type 'Window'.
    (window as any).removeEventListener('mousemove', handleMouseMove);
    (window as any).removeEventListener('mouseup', handleMouseUp);
  };

  const getAnimationClass = (animation: AnimationType) => {
    switch (animation) {
      case AnimationType.FadeIn: return 'animate-fade-in';
      case AnimationType.SlideUp: return 'animate-slide-up';
      case AnimationType.PopUp: return 'animate-pop-up';
      default: return '';
    }
  };
  
  const toRgba = (hex: string, opacity: number): string => {
    if (!hex.startsWith('#') || hex.length !== 7) return hex;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const textStyle = (caption: Caption): React.CSSProperties => {
     const shadows = [];
     const { outlineWidth, outlineColor, glowStrength, glowColor } = caption.style;
     if (outlineWidth > 0) {
       for (let x = -outlineWidth; x <= outlineWidth; x++) {
         for (let y = -outlineWidth; y <= outlineWidth; y++) {
           if (x !== 0 || y !== 0) shadows.push(`${x}px ${y}px 0 ${outlineColor}`);
         }
       }
     }
    if (glowStrength > 0) {
      shadows.push(`0 0 ${glowStrength * 0.5}px ${glowColor}`);
      shadows.push(`0 0 ${glowStrength}px ${glowColor}`);
    }
     return { 
        textShadow: shadows.join(', '),
        textTransform: caption.style.textTransform,
        fontFamily: caption.style.fontFamily,
        fontSize: `${caption.style.fontSize}px`,
        color: caption.style.primaryColor,
        fontWeight: 'bold',
        lineHeight: '1.2',
    };
  };

  const KaraokeWord: React.FC<{ word: string; style: React.CSSProperties; progress: number }> = ({ word, style, progress }) => (
      <span className="relative inline-block" style={{...style}}>
          <span className="absolute top-0 left-0 overflow-hidden whitespace-nowrap" style={{ width: `${progress * 100}%`, color: style.color?.toString() }}>{word}&nbsp;</span>
          <span style={{color: 'rgba(255,255,255,0.5)'}}>{word}&nbsp;</span>
      </span>
  );

  return (
    <div 
        ref={containerRef} 
        className="relative max-w-full max-h-full bg-black rounded-lg overflow-hidden shadow-2xl"
        style={{ aspectRatio }}
    >
      <video ref={localVideoRef} src={videoUrl} controls className="w-full h-full" />
      {activeCaption && (
        <div
          className={`absolute text-center cursor-move ${getAnimationClass(activeCaption.animation)}`}
          style={{
            left: `${activeCaption.style.position.x}%`,
            top: `${activeCaption.style.position.y}%`,
            transform: `translate(-${activeCaption.style.position.x}%, -${activeCaption.style.position.y}%)`,
            width: 'max-content',
            maxWidth: '90%',
          }}
          onMouseDown={(e) => handleMouseDown(e, activeCaption)}
        >
          <div className="inline-block p-2 rounded-md"
            style={{
                backgroundColor: activeCaption.style.showBackground
                ? toRgba(activeCaption.style.backgroundColor, activeCaption.style.backgroundOpacity)
                : 'transparent'
            }}>
             {activeCaption.animation === AnimationType.Karaoke ? (
                <div>
                  {activeCaption.text.split(' ').map((word, index) => {
                     const captionDuration = activeCaption.endTime - activeCaption.startTime;
                     const timeIntoCaption = currentTime - activeCaption.startTime;
                     const progress = timeIntoCaption / captionDuration;
                     const wordCount = activeCaption.text.split(' ').length;
                     const wordProgress = Math.max(0, Math.min(1, (progress * wordCount) - index));
                     return <KaraokeWord key={index} word={word} style={textStyle(activeCaption)} progress={wordProgress} />
                  })}
                </div>
             ) : (
                <p style={textStyle(activeCaption)}>
                    {activeCaption.text}
                </p>
             )}
          </div>
          <style>{`
              @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
              .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
              @keyframes slide-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
              .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
              @keyframes pop-up { 0% { opacity: 0; transform: scale(0.8); } 100% { opacity: 1; transform: scale(1); } }
              .animate-pop-up { animation: pop-up 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards; }
          `}</style>
        </div>
      )}
    </div>
  );
});

export default VideoPlayer;