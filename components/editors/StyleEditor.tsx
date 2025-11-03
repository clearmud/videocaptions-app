
import React from 'react';
import type { Caption, FontFamily } from '../../types';
import { FONT_OPTIONS, COLOR_PALETTE } from '../../constants';

interface StyleEditorProps {
  selectedCaption: Caption;
  onUpdateCaption: (caption: Caption, field: 'style') => void;
}

const StyleEditor: React.FC<StyleEditorProps> = ({ selectedCaption, onUpdateCaption }) => {
  const handleStyleChange = <K extends keyof Caption['style']>(
    key: K,
    value: Caption['style'][K]
  ) => {
    onUpdateCaption({
      ...selectedCaption,
      style: { ...selectedCaption.style, [key]: value },
    }, 'style');
  };

  const ColorPicker: React.FC<{ label: string; value: string; onChange: (color: string) => void }> = ({ label, value, onChange }) => (
    <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <div className="flex items-center gap-2 flex-wrap">
            {COLOR_PALETTE.map(color => (
                <button
                    key={color}
                    onClick={() => onChange(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform transform hover:scale-110 ${value.toLowerCase() === color.toLowerCase() ? 'border-indigo-400 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                />
            ))}
        </div>
    </div>
  );
  
  const ToggleSwitch: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void }> = ({ label, checked, onChange }) => (
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300">{label}</label>
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
    <div className="space-y-6">
      <div>
        <label htmlFor="font-family" className="block text-sm font-medium text-gray-300 mb-1">
          Font Family
        </label>
        <select
          id="font-family"
          value={selectedCaption.style.fontFamily}
          // FIX: Property 'value' does not exist on type 'EventTarget & HTMLSelectElement'.
          onChange={(e) => handleStyleChange('fontFamily', (e.target as any).value as FontFamily)}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
        >
          {FONT_OPTIONS.map((font) => (
            <option key={font.value} value={font.value}>
              {font.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="font-size" className="block text-sm font-medium text-gray-300 mb-1">
            Font Size
          </label>
          <input
            id="font-size"
            type="number"
            value={selectedCaption.style.fontSize}
            // FIX: Property 'value' does not exist on type 'EventTarget & HTMLInputElement'.
            onChange={(e) => handleStyleChange('fontSize', parseInt((e.target as any).value))}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
          />
        </div>
        <div>
          <label htmlFor="outline-width" className="block text-sm font-medium text-gray-300 mb-1">
            Outline Width
          </label>
          <input
            id="outline-width"
            type="number"
            min="0"
            max="10"
            value={selectedCaption.style.outlineWidth}
            // FIX: Property 'value' does not exist on type 'EventTarget & HTMLInputElement'.
            onChange={(e) => handleStyleChange('outlineWidth', parseInt((e.target as any).value))}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
          />
        </div>
      </div>
      
       <ToggleSwitch 
        label="All Caps" 
        checked={selectedCaption.style.textTransform === 'uppercase'} 
        onChange={(checked) => handleStyleChange('textTransform', checked ? 'uppercase' : 'none')} 
      />
      
      <ColorPicker label="Primary Color" value={selectedCaption.style.primaryColor} onChange={(c) => handleStyleChange('primaryColor', c)} />
      <ColorPicker label="Outline Color" value={selectedCaption.style.outlineColor} onChange={(c) => handleStyleChange('outlineColor', c)} />

       {/* Background Section */}
      <div className="p-4 bg-gray-900/50 rounded-lg space-y-4">
        <ToggleSwitch 
          label="Show Background" 
          checked={selectedCaption.style.showBackground} 
          onChange={(checked) => handleStyleChange('showBackground', checked)} 
        />
        <div className={`space-y-4 ${!selectedCaption.style.showBackground ? 'opacity-50 pointer-events-none' : ''}`}>
          <ColorPicker 
            label="Background Color" 
            value={selectedCaption.style.backgroundColor} 
            onChange={(c) => handleStyleChange('backgroundColor', c)} 
          />
          <div>
              <label htmlFor="bg-opacity" className="block text-sm font-medium text-gray-300 mb-1">
                  Background Opacity ({Math.round(selectedCaption.style.backgroundOpacity * 100)}%)
              </label>
              <input
                  id="bg-opacity"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={selectedCaption.style.backgroundOpacity}
                  // FIX: Property 'value' does not exist on type 'EventTarget & HTMLInputElement'.
                  onChange={(e) => handleStyleChange('backgroundOpacity', parseFloat((e.target as any).value))}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
          </div>
        </div>
      </div>

      {/* Glow Section */}
      <div className="p-4 bg-gray-900/50 rounded-lg space-y-4">
        <h4 className="text-sm font-semibold text-gray-200">Glow Effect</h4>
        <ColorPicker 
          label="Glow Color" 
          value={selectedCaption.style.glowColor} 
          onChange={(c) => handleStyleChange('glowColor', c)} 
        />
        <div>
          <label htmlFor="glow-strength" className="block text-sm font-medium text-gray-300 mb-1">
            Glow Strength ({selectedCaption.style.glowStrength})
          </label>
          <input
            id="glow-strength"
            type="range"
            min="0"
            max="20"
            value={selectedCaption.style.glowStrength}
            // FIX: Property 'value' does not exist on type 'EventTarget & HTMLInputElement'.
            onChange={(e) => handleStyleChange('glowStrength', parseInt((e.target as any).value))}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      </div>

    </div>
  );
};

export default StyleEditor;