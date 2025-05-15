# Minimal Next.js Deepgram Speech-to-Text

A minimal implementation of live speech-to-text functionality using Next.js, TypeScript, and the Deepgram SDK. This project serves as a basic example of capturing microphone audio in the browser and streaming it to Deepgram for live transcription.

## Key Features

*   Live audio transcription from the browser microphone.
*   Uses Deepgram's Nova-3 model by default.
*   Client-side fetching of the Deepgram API key via a simple server-side API route.
*   Basic UI to start/stop listening.
*   Differentiated display for interim (real-time, lighter font) and final (confirmed) transcripts.

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
    *   The options passed to `deepgram.listen.live()` in [`app/components/SpeechComponent.tsx`](c:\Users\jonas\Desktop\minimal-speech-to-text\app\components\SpeechComponent.tsx:1) (e.g., `model`, `interim_results`, `smart_format`, `filler_words`, `utterance_end_ms`) are based on the settings from the original, more complex application this was derived from. These provide a good starting point for real-time transcription.
    *   During debugging, it was observed that even when `channels: 1` was explicitly set, Deepgram's response sometimes indicated `channel_index: [0, 1]`. The current configuration (without explicitly setting `channels`) relies on Deepgram or the SDK to correctly interpret the mono Opus stream.
*   **Transcript Display:**
    *   The component now manages separate states for `finalTranscript` and `interimTranscript`.
    *   Interim results are displayed in a lighter color (gray) and are replaced as new interim results arrive.
    *   Final results are appended to the `finalTranscript` string and displayed in the default color.
*   **Code Readability:**
    *   Comments have been added to [`app/components/SpeechComponent.tsx`](c:\Users\jonas\Desktop\minimal-speech-to-text\app\components\SpeechComponent.tsx:1) to explain state variables, function purposes, and key logic sections.

*   **Deepgram API Reference:** For a comprehensive reference of the Deepgram API, including all available query parameters, response structures, and features discussed in this project, please see the [Deepgram API Documentation](../deepgram_api.md).
## Deployment (Example: Vercel)

1.  Push your code to a GitHub repository.
2.  Import the project into Vercel from your GitHub repository.
3.  Vercel should automatically detect it as a Next.js project.
4.  **Crucially, set the `DEEPGRAM_API_KEY` as an environment variable in your Vercel project settings.**
5.  Deploy. Vercel will provide a public URL for your application.
6.  Test on a device with a microphone (e.g., your mobile phone).

This minimal version provides a foundational understanding of integrating Deepgram's live transcription into a Next.js application.