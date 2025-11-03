
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { Caption } from './types';
import { AnimationType, FontFamily } from './types';
import VideoUploader from './components/VideoUploader';
import VideoPlayer from './components/VideoPlayer';
import Timeline from './components/Timeline';
import EditorPanel from './components/EditorPanel';
import { generateCaptionsFromVideo } from './services/geminiService';
import { exportVideoWithCaptions } from './services/ffmpegService';
import { MagicIcon } from './components/icons/MagicIcon';
import { DownloadIcon } from './components/icons/DownloadIcon';
import { VideoIcon } from './components/icons/VideoIcon';

const App: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [selectedCaptionId, setSelectedCaptionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportMessage, setExportMessage] = useState<string>('');
  const [isStyleSyncEnabled, setIsStyleSyncEnabled] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const videoUrl = useMemo(() => (videoFile ? URL.createObjectURL(videoFile) : null), [videoFile]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // FIX: Property 'code' does not exist on type 'KeyboardEvent'. Using `e.key` is a more compatible alternative.
      if (e.key === ' ') {
        // FIX: Cannot find name 'document'.
        if (window.document.activeElement?.tagName.toLowerCase() !== 'textarea' && window.document.activeElement?.tagName.toLowerCase() !== 'input') {
          e.preventDefault();
          setIsPlaying(prev => !prev);
        }
      }
    };

    // FIX: Property 'addEventListener' does not exist on type 'Window'.
    (window as any).addEventListener('keydown', handleKeyDown);
    // FIX: Property 'removeEventListener' does not exist on type 'Window'.
    return () => (window as any).removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleVideoUpload = (file: File) => {
    setVideoFile(file);
    setCaptions([]);
    setCurrentTime(0);
    setDuration(0);
    setSelectedCaptionId(null);
    setError(null);
  };

  const handleGenerateCaptions = useCallback(async () => {
    if (!videoFile || !duration) return;
    setIsLoading(true);
    setError(null);
    try {
      const generatedCaptions = await generateCaptionsFromVideo(videoFile, duration);
      // FIX: Add explicit 'Caption' return type to fix textTransform typing issue.
      const styledCaptions = generatedCaptions.map((cap, index): Caption => ({
        ...cap,
        id: `caption-${index}-${Date.now()}`,
        style: {
          fontFamily: FontFamily.Poppins,
          fontSize: 48,
          primaryColor: '#FFFFFF',
          outlineColor: '#000000',
          outlineWidth: 2,
          backgroundColor: '#000000',
          backgroundOpacity: 0.5,
          showBackground: true,
          textTransform: 'none',
          glowColor: '#FFD700',
          glowStrength: 0,
          position: { x: 50, y: 85 },
        },
        animation: AnimationType.PopUp,
      }));
      setCaptions(styledCaptions);
    } catch (err) {
      console.error("Failed to generate captions:", err);
      setError("Sorry, I couldn't generate captions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [videoFile, duration]);

  const handleUpdateCaption = useCallback((updatedCaption: Caption, updatedField?: 'text' | 'style' | 'animation') => {
    if (isStyleSyncEnabled && (updatedField === 'style' || updatedField === 'animation')) {
        setCaptions(prev => prev.map(c => {
            const newCaption = { ...c };
            if (updatedField === 'style') {
                newCaption.style = updatedCaption.style;
            }
            if (updatedField === 'animation') {
                newCaption.animation = updatedCaption.animation;
            }
            return newCaption;
        }));
    } else {
        setCaptions(prev =>
            prev.map(c => (c.id === updatedCaption.id ? updatedCaption : c))
        );
    }
  }, [isStyleSyncEnabled]);

  const selectedCaption = useMemo(() => {
    return captions.find(c => c.id === selectedCaptionId) || null;
  }, [captions, selectedCaptionId]);
  
  const handleSplitCaption = (captionId: string, splitIndex: number) => {
    setCaptions(prev => {
      const captionToSplitIndex = prev.findIndex(c => c.id === captionId);
      if (captionToSplitIndex === -1) return prev;

      const originalCaption = prev[captionToSplitIndex];
      const text1 = originalCaption.text.slice(0, splitIndex).trim();
      const text2 = originalCaption.text.slice(splitIndex).trim();

      if (!text1 || !text2) return prev; // Don't split if it results in an empty caption

      const originalDuration = originalCaption.endTime - originalCaption.startTime;
      // Split time based on character count proportion
      const splitTime = originalCaption.startTime + (originalDuration * (splitIndex / originalCaption.text.length));

      const firstCaption: Caption = {
        ...originalCaption,
        text: text1,
        endTime: splitTime,
      };

      const secondCaption: Caption = {
        ...originalCaption,
        id: `caption-${Date.now()}`,
        text: text2,
        startTime: splitTime,
      };

      const newCaptions = [...prev];
      newCaptions.splice(captionToSplitIndex, 1, firstCaption, secondCaption);
      return newCaptions;
    });
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      // FIX: Property 'currentTime' does not exist on type 'HTMLVideoElement'.
      videoRef.current.currentTime = time;
    }
  };
  
  const formatSrtTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.round((time - Math.floor(time)) * 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
  };

  const handleExportSrt = () => {
      if (captions.length === 0) {
        // FIX: Cannot find name 'alert'.
        window.alert("No captions to export.");
        return;
      }
      const srtContent = captions
        .map((caption, index) => {
          const startTime = formatSrtTime(caption.startTime);
          const endTime = formatSrtTime(caption.endTime);
          return `${index + 1}\n${startTime} --> ${endTime}\n${caption.text}\n`;
        })
        .join('\n');
      
      const blob = new Blob([srtContent], { type: 'text/srt' });
      const url = URL.createObjectURL(blob);
      // FIX: Cannot find name 'document'.
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${videoFile?.name.split('.')[0] || 'captions'}.srt`;
      // FIX: Cannot find name 'document'.
      window.document.body.appendChild(a);
      a.click();
      // FIX: Cannot find name 'document'.
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };
  
  const handleExportVideo = async () => {
    if (!videoFile || captions.length === 0) {
      // FIX: Cannot find name 'alert'.
      window.alert("No video or captions to export.");
      return;
    }
    setIsExporting(true);
    try {
      const outputBlob = await exportVideoWithCaptions(videoFile, captions, (message) => {
        setExportMessage(message);
      });

      const url = URL.createObjectURL(outputBlob);
      // FIX: Cannot find name 'document'.
      const a = window.document.createElement('a');
      a.href = url;
      const originalName = videoFile.name.split('.')[0];
      const originalExtension = videoFile.name.split('.').pop() || 'mp4';
      a.download = `${originalName}_captioned.${originalExtension}`;
      // FIX: Cannot find name 'document'.
      window.document.body.appendChild(a);
      a.click();
      // FIX: Cannot find name 'document'.
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Failed to export video:", err);
      // FIX: Cannot find name 'alert'.
      window.alert("An error occurred while exporting the video. Check the console for details.");
    } finally {
      setIsExporting(false);
      setExportMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans">
       {isExporting && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-gray-800 p-8 rounded-lg text-center shadow-xl">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-xl font-bold mb-2">Exporting Video...</h3>
            <p className="text-gray-400">{exportMessage}</p>
          </div>
        </div>
      )}
      <header className="bg-gray-800 shadow-lg p-4 flex items-center justify-between z-10">
        <h1 className="text-2xl font-bold text-white tracking-wider">
          AI Video Caption Editor
        </h1>
        {videoUrl && (
          <div className="flex items-center gap-4">
            <button
              onClick={handleExportVideo}
              disabled={isExporting}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900/50 disabled:cursor-wait text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 flex items-center gap-2"
            >
              <VideoIcon className="w-5 h-5" />
              Export Video
            </button>
            <button
              onClick={handleExportSrt}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 flex items-center gap-2"
            >
              <DownloadIcon className="w-5 h-5" />
              Export SRT
            </button>
          </div>
        )}
      </header>
      <main className="flex-grow p-4 lg:p-6 flex flex-col">
        {!videoUrl ? (
          <VideoUploader onVideoUpload={handleVideoUpload} />
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 flex-grow min-h-0">
            {/* Left Column */}
            <div className="flex-grow lg:w-2/3 flex flex-col gap-4">
               <div className="w-full flex-grow relative flex items-center justify-center min-h-0">
                  <VideoPlayer
                    ref={videoRef}
                    videoUrl={videoUrl}
                    captions={captions}
                    currentTime={currentTime}
                    onTimeUpdate={setCurrentTime}
                    onLoadedMetadata={setDuration}
                    isPlaying={isPlaying}
                    onPlayPause={setIsPlaying}
                    onUpdateCaption={handleUpdateCaption}
                  />
               </div>
               <Timeline
                duration={duration}
                captions={captions}
                currentTime={currentTime}
                onCaptionSelect={setSelectedCaptionId}
                selectedCaptionId={selectedCaptionId}
              />
            </div>
            {/* Right Column */}
            <div className="lg:w-1/3 bg-gray-800 rounded-lg p-4 flex flex-col min-h-0">
              <div className="flex-shrink-0 mb-4">
                <button
                  onClick={handleGenerateCaptions}
                  disabled={isLoading || duration === 0}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900/50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <MagicIcon />
                      Generate AI Captions
                    </>
                  )}
                </button>
                {error && <p className="text-red-400 text-center mt-2">{error}</p>}
              </div>
              <EditorPanel
                selectedCaption={selectedCaption}
                onUpdateCaption={handleUpdateCaption}
                captions={captions}
                onCaptionSelect={setSelectedCaptionId}
                onSplitCaption={handleSplitCaption}
                onSeek={handleSeek}
                isStyleSyncEnabled={isStyleSyncEnabled}
                setIsStyleSyncEnabled={setIsStyleSyncEnabled}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;