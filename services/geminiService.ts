
import { GoogleGenAI, Type } from "@google/genai";
import type { Caption } from "../types";

// This service uses the Gemini API to generate captions by transcribing
// the audio from a video file provided by the user.

// FIX: Initialize GoogleGenAI client according to guidelines, removing manual API key checks.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const captionSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        startTime: {
          type: Type.NUMBER,
          description: 'The start time of the caption in seconds.',
        },
        endTime: {
          type: Type.NUMBER,
          description: 'The end time of the caption in seconds.',
        },
        text: {
          type: Type.STRING,
          description: 'The text content of the caption.',
        },
      },
      required: ['startTime', 'endTime', 'text'],
    },
};

type GeneratedCaption = Omit<Caption, 'id' | 'style' | 'animation'>;

const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
};

export const generateCaptionsFromVideo = async (videoFile: File, duration: number): Promise<GeneratedCaption[]> => {
  const videoPart = await fileToGenerativePart(videoFile);
  
  const prompt = `
    You are an expert video caption generator. Transcribe the audio from the provided video and create a series of short, engaging captions.
    The video is ${Math.round(duration)} seconds long.
    Provide the output as a valid JSON array of objects.
    Each object must have 'startTime', 'endTime', and 'text' properties.
    - 'startTime' and 'endTime' must be in seconds.
    - Captions should not overlap. There should be a small gap between them.
    - Ensure the timestamps are chronologically ordered and do not exceed the video duration of ${duration} seconds.
    - Make the captions concise, easy to read, and break them down into smaller chunks for better readability.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [ videoPart, { text: prompt } ] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: captionSchema,
      },
    });

    const jsonText = response.text.trim();
    const parsedCaptions = JSON.parse(jsonText) as GeneratedCaption[];

    // Validate and clean the generated data
    return parsedCaptions.filter(
      (cap) =>
        typeof cap.startTime === 'number' &&
        typeof cap.endTime === 'number' &&
        typeof cap.text === 'string' &&
        cap.startTime < cap.endTime &&
        cap.endTime <= duration
    );

  } catch (error) {
    console.error('Error generating captions with Gemini:', error);
    throw new Error('Failed to parse or fetch captions from the AI model.');
  }
};
