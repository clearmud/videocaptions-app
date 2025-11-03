
import React from 'react';
import type { Caption } from '../types';

interface TimelineProps {
  duration: number;
  captions: Caption[];
  currentTime: number;
  onCaptionSelect: (id: string) => void;
  selectedCaptionId: string | null;
}

const Timeline: React.FC<TimelineProps> = ({
  duration,
  captions,
  currentTime,
  onCaptionSelect,
  selectedCaptionId
}) => {
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gray-800 p-3 rounded-lg">
      <div className="relative w-full h-16 bg-gray-700 rounded overflow-hidden">
        {/* Captions */}
        {captions.map((caption) => {
          const left = (caption.startTime / duration) * 100;
          const width = ((caption.endTime - caption.startTime) / duration) * 100;
          const isSelected = caption.id === selectedCaptionId;

          return (
            <div
              key={caption.id}
              className={`absolute top-0 h-full cursor-pointer transition-all duration-200 ${isSelected ? 'bg-indigo-500 border-2 border-indigo-300' : 'bg-indigo-700/70 hover:bg-indigo-600'}`}
              style={{ left: `${left}%`, width: `${width}%` }}
              onClick={() => onCaptionSelect(caption.id)}
            >
              <div className="px-2 py-1 text-xs text-white truncate">
                {caption.text}
              </div>
            </div>
          );
        })}

        {/* Playhead */}
        {duration > 0 && (
          <div
            className="absolute top-0 h-full w-1 bg-red-500 pointer-events-none"
            style={{ left: `${(currentTime / duration) * 100}%` }}
          >
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full"></div>
          </div>
        )}
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
};

export default Timeline;
