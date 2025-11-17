import { apiClient } from './client';

export interface Caption {
  startTime: number;
  endTime: number;
  text: string;
}

export interface GenerateCaptionsResponse {
  success: boolean;
  captions: Caption[];
  minutesConsumed: number;
  minutesRemaining: number;
}

export async function generateCaptionsAPI(
  videoFile: File,
  duration: number
): Promise<GenerateCaptionsResponse> {
  return apiClient.uploadFile('/video/generate-captions', videoFile, { duration });
}

export async function getVideoHistory(): Promise<{
  success: boolean;
  videos: Array<{
    id: number;
    filename: string;
    duration: number;
    minutes_consumed: number;
    processing_status: string;
    created_at: string;
  }>;
}> {
  return apiClient.get('/video/history');
}

export async function getTransactionHistory(): Promise<{
  success: boolean;
  transactions: Array<{
    id: number;
    type: string;
    amount: number;
    description: string;
    created_at: string;
  }>;
}> {
  return apiClient.get('/video/transactions');
}
