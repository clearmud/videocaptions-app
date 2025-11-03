
import React, { useCallback, useState } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface VideoUploaderProps {
  onVideoUpload: (file: File) => void;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ onVideoUpload }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // FIX: Property 'files' does not exist on type 'EventTarget & HTMLInputElement'.
    if ((e.target as any).files && (e.target as any).files[0]) {
      onVideoUpload((e.target as any).files[0]);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      // FIX: Property 'files' does not exist on type 'DataTransfer'.
      const files = (e.dataTransfer as any).files;
      if (files && files[0]) {
        if (files[0].type.startsWith('video/')) {
          onVideoUpload(files[0]);
        } else {
          // FIX: Cannot find name 'alert'.
          window.alert('Please upload a valid video file.');
        }
      }
    },
    [onVideoUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  return (
    <div className="flex-grow flex items-center justify-center">
      <div
        className={`w-full max-w-2xl p-10 border-2 border-dashed rounded-lg text-center cursor-pointer transition-all duration-300 ${
          isDragging ? 'border-indigo-500 bg-gray-800/50' : 'border-gray-600 hover:border-indigo-500 hover:bg-gray-800/30'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        // FIX: Cannot find name 'document'.
        onClick={() => window.document.getElementById('video-upload-input')?.click()}
      >
        <div className="flex flex-col items-center justify-center gap-4">
          <UploadIcon className="w-16 h-16 text-gray-500" />
          <h2 className="text-2xl font-semibold text-gray-300">
            Drag & Drop Your Video Here
          </h2>
          <p className="text-gray-400">or click to browse files</p>
          <p className="text-xs text-gray-500 mt-2">MP4, MOV, AVI, etc.</p>
        </div>
        <input
          id="video-upload-input"
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

export default VideoUploader;