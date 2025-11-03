import React, { useState } from 'react';
import type { Caption } from '../types';
import CaptionListEditor from './editors/CaptionListEditor';
import StyleEditor from './editors/StyleEditor';
import AnimationEditor from './editors/AnimationEditor';

interface EditorPanelProps {
  selectedCaption: Caption | null;
  onUpdateCaption: (caption: Caption, field?: 'text' | 'style' | 'animation') => void;
  captions: Caption[];
  onCaptionSelect: (id: string) => void;
  onSplitCaption: (id: string, splitIndex: number) => void;
  onSeek: (time: number) => void;
  isStyleSyncEnabled: boolean;
  setIsStyleSyncEnabled: (enabled: boolean) => void;
}

type Tab = 'Text' | 'Style' | 'Animation';

const EditorPanel: React.FC<EditorPanelProps> = ({ 
  selectedCaption, 
  onUpdateCaption,
  captions,
  onCaptionSelect,
  onSplitCaption,
  onSeek,
  isStyleSyncEnabled,
  setIsStyleSyncEnabled,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('Text');

  const renderContent = () => {
    if (!selectedCaption && activeTab !== 'Text') {
      return (
        <div className="flex-grow flex items-center justify-center text-center">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-300">No Caption Selected</h3>
            <p className="text-gray-500 mt-1">
              Click a caption on the timeline to start editing.
            </p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'Text':
        return <CaptionListEditor 
          captions={captions}
          selectedCaptionId={selectedCaption?.id || null}
          onUpdateCaption={onUpdateCaption}
          onCaptionSelect={onCaptionSelect}
          onSplitCaption={onSplitCaption}
          onSeek={onSeek}
        />;
      case 'Style':
        return <StyleEditor selectedCaption={selectedCaption!} onUpdateCaption={onUpdateCaption} />;
      case 'Animation':
        return <AnimationEditor selectedCaption={selectedCaption!} onUpdateCaption={onUpdateCaption} />;
      default:
        return null;
    }
  };

  const TabButton: React.FC<{ tabName: Tab }> = ({ tabName }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
        activeTab === tabName
          ? 'bg-indigo-600 text-white'
          : 'text-gray-400 hover:bg-gray-700 hover:text-white'
      }`}
    >
      {tabName}
    </button>
  );
  
  const ToggleSwitch: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void }> = ({ label, checked, onChange }) => (
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-300">{label}</span>
        <button
          onClick={() => onChange(!checked)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
            checked ? 'bg-indigo-600' : 'bg-gray-600'
          }`}
          aria-label={label}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
              checked ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-shrink-0 mb-4">
        <div className="flex space-x-2 bg-gray-900/50 p-1 rounded-lg">
          <TabButton tabName="Text" />
          <TabButton tabName="Style" />
          <TabButton tabName="Animation" />
        </div>
        {(activeTab === 'Style' || activeTab === 'Animation') && selectedCaption && (
           <div className="mt-4 p-3 bg-gray-900/50 rounded-lg">
               <ToggleSwitch 
                   label="Apply to All Captions"
                   checked={isStyleSyncEnabled}
                   onChange={setIsStyleSyncEnabled}
               />
           </div>
       )}
      </div>
      <div className="flex-grow overflow-y-auto pr-2">
        {renderContent()}
      </div>
    </div>
  );
};

export default EditorPanel;