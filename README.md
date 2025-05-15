# Minimal Next.js Deepgram Speech-to-Text

A minimal implementation of live speech-to-text functionality using Next.js, TypeScript, and the Deepgram SDK. This project serves as a basic example of capturing microphone audio in the browser and streaming it to Deepgram for live transcription.

## Key Features

*   Live audio transcription from the browser microphone.
*   Selectable transcription settings via a single dropdown:
    *   **Models:** Nova-3 and Nova-2.
    *   **Languages:** Includes English, Spanish, French, German, Hindi, Russian, Portuguese, Japanese, Italian, Dutch for Nova-3 (using `multi` for non-English). Extensive language list for Nova-2.
    *   **Filler Words:** Option for English with Nova-3 and Nova-2.
*   Toggle for **Speaker Diarization** (all languages).
*   Visual feedback for **word-level confidence scores** (background color).
*   Client-side fetching of the Deepgram API key via a simple server-side API route.
*   Basic UI to start/stop listening and configure options.
*   Differentiated display for interim (real-time, lighter font) and final (confirmed) transcripts, including speaker labels when diarization is active.

## Project Structure

*   `app/components/SpeechComponent.tsx`: The core client component handling:
    *   Microphone access (`navigator.mediaDevices.getUserMedia`, `MediaRecorder`).
    *   Connection to Deepgram's live transcription service.
    *   Sending audio data and receiving/displaying transcripts.
*   `app/api/deepgram-key/route.ts`: A Next.js API route that securely generates a **short-lived, temporary Deepgram API key** for the client. It uses the main `DEEPGRAM_API_KEY` (stored as an environment variable on the server) to create this temporary key.
*   `app/page.tsx`: The main page that renders the `SpeechComponent`.
*   `app/layout.tsx`: The root layout for the Next.js application.
*   `.env.local.example`: Template for setting up the required environment variable.

## Setup and Running Locally

1.  **Clone the repository (if you haven't already):**
    ```bash
    git clone https://github.com/jojomanman/transcribo.git
    cd transcribo # Or your chosen directory name
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up your Deepgram API Key:**
    *   Copy the [`.env.local.example`](c:\Users\jonas\Desktop\minimal-speech-to-text\.env.local.example:1) file to a new file named `.env.local` in the project root.
    *   Open `.env.local` and replace `YOUR_DEEPGRAM_API_KEY` with your actual Deepgram API key.
    ```
    DEEPGRAM_API_KEY=YOUR_DEEPGRAM_API_KEY
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will typically be available at `http://localhost:3000`.

## Important Notes for Developers

*   **API Key Management (Secure Approach):**
    *   The main `DEEPGRAM_API_KEY` (your powerful, primary key) is stored as an environment variable on the server (e.g., in Vercel settings or your local `.env.local` file). **This main key is never sent to the client.**
    *   The client-side `SpeechComponent.tsx` calls the `/api/deepgram-key` API route.
    *   This server-side API route ([`app/api/deepgram-key/route.ts`](c:\Users\jonas\Desktop\minimal-speech-to-text\app\api\deepgram-key\route.ts:1)) uses the main `DEEPGRAM_API_KEY` to initialize a Deepgram SDK client *on the server*.
    *   It then uses this server-side client to call Deepgram's API (`deepgram.keys.create()`) to generate a **new, short-lived, temporary API key**. This temporary key has a limited Time-To-Live (TTL, e.g., 10 minutes) and is scoped with general "member" permissions suitable for transcription.
    *   Only this **temporary key** is sent back to the client. The client uses this temporary key to connect to Deepgram for the transcription session.
    *   This approach significantly enhances security by preventing your main API key from ever being exposed in the browser.
    *   **Never commit your actual `.env.local` file or main API key directly into your repository.** The [`.gitignore`](c:\Users\jonas\Desktop\minimal-speech-to-text\.gitignore:1) file is configured to prevent this.
*   **Microphone Permissions:**
    *   The application requests microphone access from the user via the browser. Ensure permissions are granted.
    *   Error handling for permission denial is basic (an `alert` and console error).
*   **Deepgram Connection (`LiveClient`) Management:**
    *   The Deepgram `LiveClient` instance is stored in a `useRef` (`connectionRef`) within [`app/components/SpeechComponent.tsx`](c:\Users\jonas\Desktop\minimal-speech-to-text\app\components\SpeechComponent.tsx:1).
    *   This is important because the `MediaRecorder.ondataavailable` callback needs a stable reference to the current connection object to send audio data. Using `useState` directly for the connection object can lead to the callback capturing a stale closure if not handled carefully.
*   **Audio Capture & Encoding:**
    *   `MediaRecorder` is used to capture audio.
    *   The `mimeType` is set to `audio/webm;codecs=opus`, which is generally well-supported and works effectively with Deepgram.
*   **Deepgram Connection Options:**
    *   The application now provides a consolidated dropdown in [`app/components/SpeechComponent.tsx`](transcribo/app/components/SpeechComponent.tsx:0) to select transcription settings, including:
        *   **Model:** Nova-3 or Nova-2.
        *   **Language:** A comprehensive list of languages. For Nova-3, non-English selections utilize the `multi` language code for auto-detection among supported languages (English, Spanish, French, German, Hindi, Russian, Portuguese, Japanese, Italian, Dutch). Nova-2 uses specific language codes.
        *   **Filler Words:** This option is bundled with English selections for both Nova-3 and Nova-2.
    *   A separate toggle allows enabling/disabling **Speaker Diarization** (`diarize: true/false`).
    *   Other parameters like `interim_results: true`, `smart_format: true`, and `utterance_end_ms: 3000` are maintained for real-time transcription.
*   **Transcript Display:**
    *   The component displays words with a background color indicating their confidence score (green for high, yellow for medium, red for low).
    *   If Speaker Diarization is enabled, the transcript will show speaker labels (e.g., "Speaker 0:", "Speaker 1:") before the corresponding speech segments.
    *   Interim results are displayed in a lighter color (gray) and are replaced as new interim results arrive.
    *   Final results are accumulated and displayed.
*   **Code Readability:**
    *   Comments have been added to [`app/components/SpeechComponent.tsx`](transcribo/app/components/SpeechComponent.tsx:0) to explain state variables, function purposes, and key logic sections.

*   **Deepgram API Reference:** For a comprehensive reference of the Deepgram API, including all available query parameters (like `model`, `language`, `filler_words`, `diarize`), response structures, and features discussed in this project, please see the [Deepgram API Documentation](../deepgram_api.md).
## Deployment (Example: Vercel)

1.  Push your code to a GitHub repository.
2.  Import the project into Vercel from your GitHub repository.
3.  Vercel should automatically detect it as a Next.js project.
4.  **Crucially, set the `DEEPGRAM_API_KEY` as an environment variable in your Vercel project settings.**
5.  Deploy. Vercel will provide a public URL for your application.
6.  Test on a device with a microphone (e.g., your mobile phone).

This minimal version provides a foundational understanding of integrating Deepgram's live transcription into a Next.js application.