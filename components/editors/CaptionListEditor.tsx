
import React, { useRef } from 'react';
import type { Caption } from '../../types';
import { SplitIcon } from '../icons/SplitIcon';

interface CaptionListEditorProps {
  captions: Caption[];
  selectedCaptionId: string | null;
  onUpdateCaption: (caption: Caption, field: 'text') => void;
  onCaptionSelect: (id: string) => void;
  onSplitCaption: (id: string, splitIndex: number) => void;
  onSeek: (time: number) => void;
}

const CaptionListEditor: React.FC<CaptionListEditorProps> = ({ 
  captions, 
  selectedCaptionId, 
  onUpdateCaption, 
  onCaptionSelect,
  onSplitCaption,
  onSeek
}) => {
  const textareaRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>, caption: Caption) => {
    // FIX: Property 'value' does not exist on type 'EventTarget & HTMLTextAreaElement'.
    onUpdateCaption({ ...caption, text: (e.target as any).value }, 'text');
  };
  
  const handleSelect = (caption: Caption) => {
    onCaptionSelect(caption.id);
    onSeek(caption.startTime);
  };
  
  const handleSplitClick = (captionId: string) => {
    const textarea = textareaRefs.current.get(captionId);
    if (textarea) {
        // FIX: Property 'selectionStart' does not exist on type 'HTMLTextAreaElement'.
        onSplitCaption(captionId, (textarea as any).selectionStart);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, caption: Caption) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const textarea = e.currentTarget;
        // FIX: Property 'selectionStart' does not exist on type 'EventTarget & HTMLTextAreaElement'.
        onSplitCaption(caption.id, (textarea as any).selectionStart);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = (time % 60).toFixed(2);
    return `${String(minutes).padStart(2, '0')}:${seconds.toString().padStart(5, '0')}`;
  };


  if (captions.length === 0) {
      return (
        <div className="flex-grow flex items-center justify-center text-center">
            <p className="text-gray-500">Generate captions to see them here.</p>
        </div>
      );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-white mb-3">Captions</h3>
      {captions.map((caption) => (
          <div
            key={caption.id}
            onClick={() => handleSelect(caption)}
            className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                selectedCaptionId === caption.id 
                ? 'bg-indigo-900/50 ring-2 ring-indigo-500' 
                : 'bg-gray-700/50 hover:bg-gray-700'
            }`}
          >
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span className="font-mono">{formatTime(caption.startTime)} &rarr; {formatTime(caption.endTime)}</span>
              <button 
                onClick={(e) => {
                    e.stopPropagation(); // prevent selection change on split
                    handleSplitClick(caption.id);
                }}
                className="p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded"
                title="Split caption at cursor"
              >
                  <SplitIcon className="w-4 h-4" />
              </button>
            </div>
            <textarea
              ref={node => {
                  if (node) textareaRefs.current.set(caption.id, node);
                  else textareaRefs.current.delete(caption.id);
              }}
              value={caption.text}
              onChange={(e) => handleTextChange(e, caption)}
              onKeyDown={(e) => handleKeyDown(e, caption)}
              onFocus={() => onCaptionSelect(caption.id)} // Select on focus too
              className="w-full h-20 p-2 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white resize-none"
              placeholder="Caption text..."
            />
          </div>
      ))}
    </div>
  );
};

export default CaptionListEditor;