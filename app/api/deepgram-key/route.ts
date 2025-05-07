import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.DEEPGRAM_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'DEEPGRAM_API_KEY is not set in environment variables.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ apiKey });
}