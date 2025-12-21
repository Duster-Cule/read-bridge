import { NextResponse } from 'next/server';
import { TTSRequest } from '@/types/tts';
import { generateUUID } from '@/utils/uuid'
import { requireAuth } from '@/app/api/_lib/auth'
export const runtime = 'nodejs';

const VOLCENGINE_TTS_URL = 'https://openspeech.bytedance.com/api/v1/tts';

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req)
    if (auth) return auth

    const { text, token, appid, voiceType, speedRatio } = await req.json() as TTSRequest;

    const response = await fetch(VOLCENGINE_TTS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer;${token}`,
      },
      body: JSON.stringify({
        app: {
          appid: appid,
          cluster: 'volcano_tts',
        },
        user: {
          uid: 'uid',
        },
        audio: {
          voice_type: voiceType,
          encoding: 'mp3',
          speed_ratio: speedRatio,
        },
        request: {
          reqid: generateUUID(),
          text,
          operation: 'query',
        },
      }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('TTS API error:', error);
    return NextResponse.json(
      { error: 'Failed to process TTS request' },
      { status: 500 }
    );
  }
} 
