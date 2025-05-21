interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

export async function fetchFixedTranscript(
  text: string,
  userPrompt: string,
  apiKey: string
): Promise<string | null> {
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [{
      parts: [{
        text: `${userPrompt}\n\nOriginal Text:\n${text}\n\nFixed Text:`
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      topK: 1,
      topP: 1,
      maxOutputTokens: 1024, // Increased from 256 as per common practice for potentially longer texts
    }
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseData: GeminiResponse = await response.json();

    if (!response.ok) {
      console.error('Gemini API Error:', responseData.error || response.statusText);
      if (responseData.error) {
        throw new Error(`Gemini API Error: ${responseData.error.code} ${responseData.error.message}`);
      }
      throw new Error(`Gemini API HTTP Error: ${response.status}`);
    }

    const fixedText = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!fixedText) {
      console.error('Gemini API Error: No text found in response', responseData);
      throw new Error('No fixed text found in Gemini response.');
    }

    return fixedText.trim();

  } catch (error) {
    console.error('Error fetching fixed transcript from Gemini:', error);
    // Optionally, rethrow the error if the caller should handle it,
    // or return null/empty string if a default/fallback behavior is desired.
    // For this case, rethrowing allows the UI to be aware of the failure.
    if (error instanceof Error) {
        throw error;
    }
    throw new Error('An unknown error occurred while fetching the fixed transcript.');
  }
}
