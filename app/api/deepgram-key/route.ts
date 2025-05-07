import { NextResponse, type NextRequest } from "next/server";

export const revalidate = 0;

export async function GET(request: NextRequest) {
  // Always return the API key from the environment for simplicity.
  return NextResponse.json({
    key: process.env.DEEPGRAM_API_KEY ?? "",
  });
}