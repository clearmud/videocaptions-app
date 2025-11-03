
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { Caption } from '../types';

let ffmpeg: FFmpeg | null = null;

const loadFFmpeg = async (onProgress: (message: string) => void): Promise<FFmpeg> => {
    if (ffmpeg) return ffmpeg;

    ffmpeg = new FFmpeg();
    ffmpeg.on('log', ({ message }) => {
        console.log(message);
    });
    
    onProgress('Loading video engine...');
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    
    return ffmpeg;
};

const formatSrtTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.round((time - Math.floor(time)) * 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
};

const captionsToSrt = (captions: Caption[]): string => {
    return captions
        .map((caption, index) => {
            const startTime = formatSrtTime(caption.startTime);
            const endTime = formatSrtTime(caption.endTime);
            // Basic SRT styling conversion. This is very limited.
            // For full styling, a more complex format like ASS would be needed.
            // Here, we just handle color and font size.
            // NOTE: FFmpeg's SRT parser for subtitles filter is limited and might not render HTML-like tags.
            // For complex styling, ASS is better, but requires font files to be loaded.
            // We are keeping it simple for now.
            const text = caption.text;
            return `${index + 1}\n${startTime} --> ${endTime}\n${text}\n`;
        })
        .join('\n');
};


export const exportVideoWithCaptions = async (
    videoFile: File,
    captions: Caption[],
    onProgress: (message: string) => void
): Promise<Blob> => {
    const ffmpegInstance = await loadFFmpeg(onProgress);
    
    onProgress('Preparing files...');
    await ffmpegInstance.writeFile(videoFile.name, await fetchFile(videoFile));
    
    const srtContent = captionsToSrt(captions);
    const srtFileName = 'subtitles.srt';
    await ffmpegInstance.writeFile(srtFileName, srtContent);
    
    const outputFileName = `output_${videoFile.name}`;

    ffmpegInstance.on('progress', ({ progress, time }) => {
        const percentage = progress * 100;
        if (percentage > 0 && percentage <= 100) {
            onProgress(`Encoding... ${Math.round(percentage)}% done.`);
        }
    });
    
    onProgress('Burning captions onto video. This may take a while...');
    
    // We must re-encode to burn subtitles. These settings are a balance of quality and speed.
    const command = [
        '-i', videoFile.name,
        '-vf', `subtitles=${srtFileName}`,
        // These settings aim to preserve quality
        '-c:v', 'libx264',
        '-preset', 'fast', 
        '-crf', '22', // Lower is better quality, 18-28 is a good range
        '-c:a', 'copy', // Copy audio stream without re-encoding
        outputFileName
    ];

    await ffmpegInstance.exec(command);
    
    onProgress('Finalizing export...');
    const data = await ffmpegInstance.readFile(outputFileName);

    // Clean up files
    await ffmpegInstance.deleteFile(videoFile.name);
    await ffmpegInstance.deleteFile(srtFileName);
    await ffmpegInstance.deleteFile(outputFileName);
    
    return new Blob([data], { type: videoFile.type });
};
