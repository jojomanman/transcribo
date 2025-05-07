import { NextResponse } from 'next/server';
import { createClient } from '@deepgram/sdk';

export async function GET() {
  const mainApiKey = process.env.DEEPGRAM_API_KEY;

  if (!mainApiKey) {
    console.error('DEEPGRAM_API_KEY (main) is not set in environment variables.');
    return NextResponse.json(
      { error: 'Server configuration error: Main API key not set.' },
      { status: 500 }
    );
  }

  try {
    // Initialize Deepgram client with the main API key (server-side only)
    const deepgram = createClient(mainApiKey);

    // Create a short-lived, scoped API key
    // TTL is in seconds. 600 seconds = 10 minutes.
    // Scopes: "member" is a general scope that allows transcription.
    // For more fine-grained control, you might create a project and use project-specific scopes.
    // Note: The SDK structure for key creation might be directly under `deepgram.keys`
    // or under `deepgram.projects.keys` if project-specific.
    // We'll try `deepgram.keys.create` first for general member scope.
    const { key: temporaryKeyObject, error: keyError } = await deepgram.keys.create(
      'Temporary key for live transcription', // Comment for the key
      ['member'], // Scopes
      { timeToLiveInSeconds: 600 } // TTL
    );

    if (keyError) {
      console.error('Error creating temporary Deepgram key:', keyError);
      return NextResponse.json(
        { error: 'Failed to generate temporary API key.', details: keyError.message },
        { status: 500 }
      );
    }

    // The 'key' property from the response of keys.create is the actual API key string.
    // The response object itself is 'temporaryKeyObject' here.
    if (!temporaryKeyObject || !temporaryKeyObject.key) {
      console.error('Temporary Deepgram key string was not created or is missing.');
      return NextResponse.json(
        { error: 'Failed to generate temporary API key (key string missing).' },
        { status: 500 }
      );
    }
    
    // Return the temporary key string to the client
    // The client will use this key to connect to Deepgram for transcription.
    return NextResponse.json({ apiKey: temporaryKeyObject.key, expires: temporaryKeyObject.created });

  } catch (error) {
    console.error('Unexpected error in /api/deepgram-key:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'An unexpected error occurred while generating the API key.', details: errorMessage },
      { status: 500 }
    );
  }
}