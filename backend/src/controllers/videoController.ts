import { Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { UserModel } from '../models/User.js';
import { db } from '../config/database.js';
import { getTierConfig } from '../config/tiers.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

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

export async function generateCaptions(req: any, res: Response) {
  const user = req.user;
  const { duration } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No video file provided' });
  }

  if (!duration || duration <= 0) {
    return res.status(400).json({ error: 'Invalid video duration' });
  }

  const durationMinutes = Math.ceil(duration / 60);

  try {
    // Check tier limits
    const tierConfig = getTierConfig(user.subscription_tier);

    // Check file size
    if (file.size > tierConfig.maxFileSize * 1024 * 1024) {
      await fs.unlink(file.path); // Clean up
      return res.status(400).json({
        error: `File too large. Maximum file size for ${tierConfig.name} tier is ${tierConfig.maxFileSize}MB`,
      });
    }

    // Check video length
    if (duration / 60 > tierConfig.maxVideoLength) {
      await fs.unlink(file.path);
      return res.status(400).json({
        error: `Video too long. Maximum video length for ${tierConfig.name} tier is ${tierConfig.maxVideoLength} minutes`,
      });
    }

    // Check quota
    if (!UserModel.canProcessVideo(user, durationMinutes)) {
      await fs.unlink(file.path);
      return res.status(403).json({
        error: 'Insufficient minutes quota',
        remaining: UserModel.getRemainingMinutes(user),
        required: durationMinutes,
      });
    }

    // Read file and convert to base64
    const fileBuffer = await fs.readFile(file.path);
    const base64Data = fileBuffer.toString('base64');

    const videoPart = {
      inlineData: {
        data: base64Data,
        mimeType: file.mimetype,
      },
    };

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

    // Call Gemini API
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: { parts: [videoPart, { text: prompt }] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: captionSchema,
      },
    });

    const jsonText = response.text.trim();
    const parsedCaptions = JSON.parse(jsonText);

    // Validate captions
    const validCaptions = parsedCaptions.filter(
      (cap: any) =>
        typeof cap.startTime === 'number' &&
        typeof cap.endTime === 'number' &&
        typeof cap.text === 'string' &&
        cap.startTime < cap.endTime &&
        cap.endTime <= duration
    );

    // Save video record to database
    const videoStmt = db.prepare(`
      INSERT INTO videos (user_id, filename, duration, file_size, storage_path, processing_status, minutes_consumed)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const videoResult = videoStmt.run(
      user.id,
      file.originalname,
      duration,
      file.size,
      file.path,
      'completed',
      durationMinutes
    );

    // Deduct minutes from user quota
    UserModel.deductMinutes(user.id, durationMinutes);

    // Log transaction
    const transactionStmt = db.prepare(`
      INSERT INTO transactions (user_id, type, amount, description, video_id)
      VALUES (?, ?, ?, ?, ?)
    `);

    transactionStmt.run(
      user.id,
      'caption_generation',
      durationMinutes,
      `Generated captions for ${file.originalname}`,
      videoResult.lastInsertRowid
    );

    // Clean up uploaded file
    await fs.unlink(file.path);

    res.json({
      success: true,
      captions: validCaptions,
      minutesConsumed: durationMinutes,
      minutesRemaining: UserModel.getRemainingMinutes(UserModel.findById(user.id)!),
    });
  } catch (error: any) {
    console.error('Caption generation error:', error);

    // Clean up file on error
    if (file?.path) {
      try {
        await fs.unlink(file.path);
      } catch (e) {
        console.error('Failed to cleanup file:', e);
      }
    }

    res.status(500).json({ error: 'Failed to generate captions' });
  }
}

export function getVideoHistory(req: any, res: Response) {
  const user = req.user;

  const stmt = db.prepare(`
    SELECT id, filename, duration, minutes_consumed, processing_status, created_at
    FROM videos
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 50
  `);

  const videos = stmt.all(user.id);

  res.json({
    success: true,
    videos,
  });
}

export function getTransactionHistory(req: any, res: Response) {
  const user = req.user;

  const stmt = db.prepare(`
    SELECT id, type, amount, description, created_at
    FROM transactions
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 100
  `);

  const transactions = stmt.all(user.id);

  res.json({
    success: true,
    transactions,
  });
}
