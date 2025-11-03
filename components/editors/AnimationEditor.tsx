import React from 'react';
import type { Caption, AnimationType } from '../../types';
import { ANIMATION_OPTIONS } from '../../constants';

interface AnimationEditorProps {
  selectedCaption: Caption;
  onUpdateCaption: (caption: Caption, field: 'animation') => void;
}

const AnimationEditor: React.FC<AnimationEditorProps> = ({ selectedCaption, onUpdateCaption }) => {
  const handleAnimationChange = (animation: AnimationType) => {
    onUpdateCaption({ ...selectedCaption, animation }, 'animation');
  };

  return (
    <div className="space-y-4">
       <h3 className="text-lg font-semibold text-white">Caption Animation</h3>
       <div className="grid grid-cols-2 gap-3">
            {ANIMATION_OPTIONS.map((option) => (
                <button
                    key={option.value}
                    onClick={() => handleAnimationChange(option.value)}
                    className={`p-4 rounded-lg text-center font-medium transition-all duration-200 ${
                        selectedCaption.animation === option.value
                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                >
                    {option.label}
                </button>
            ))}
       </div>
    </div>
  );
};

export default AnimationEditor;