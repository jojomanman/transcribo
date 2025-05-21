import { useState, useEffect, useRef, useCallback } from "react";
import {
  createClient,
  LiveClient,
  LiveTranscriptionEvents,
  LiveTranscriptionEvent,
  DeepgramError,
  LiveMetadataEvent,
} from "@deepgram/sdk";
import { fetchFixedTranscript } from "@/lib/gemini"; // Import Gemini service

// Interfaces (can be moved to a types file later if they grow)
interface DeepgramWordType {
  word?: string;
  punctuated_word?: string;
  confidence?: number;
  start?: number;
  end?: number;
  speaker?: number;
}

export interface WordConfidence {
  text: string;
  confidence: number;
  speaker?: number;
}

export interface TranscriptionOption {
  key: string;
  label: string;
  model: string;
  language: string;
  filler_words: boolean;
}

export const transcriptionOptions: TranscriptionOption[] = [
  { key: "nova3-en-fw", label: "English (Nova-3) + Filler Words", model: "nova-3", language: "en", filler_words: true },
  { key: "nova3-en", label: "English (Nova-3)", model: "nova-3", language: "en", filler_words: false },
  { key: "nova3-multi", label: "Multi (Nova-3) (EN,ES,FR,DE,IT,PT,NL,HI,JA,RU)", model: "nova-3", language: "multi", filler_words: false },
  { key: "nova2-bg", label: "Bulgarian (Nova-2)", model: "nova-2", language: "bg", filler_words: false },
  { key: "nova2-ca", label: "Catalan (Nova-2)", model: "nova-2", language: "ca", filler_words: false },
  { key: "nova2-zh", label: "Chinese (Mandarin, Simplified) (Nova-2)", model: "nova-2", language: "zh", filler_words: false },
  { key: "nova2-zh-TW", label: "Chinese (Mandarin, Traditional) (Nova-2)", model: "nova-2", language: "zh-TW", filler_words: false },
  { key: "nova2-zh-HK", label: "Chinese (Cantonese, Traditional) (Nova-2)", model: "nova-2", language: "zh-HK", filler_words: false },
  { key: "nova2-cs", label: "Czech (Nova-2)", model: "nova-2", language: "cs", filler_words: false },
  { key: "nova2-da", label: "Danish (Nova-2)", model: "nova-2", language: "da", filler_words: false },
  { key: "nova2-nl", label: "Dutch (Nova-2)", model: "nova-2", language: "nl", filler_words: false },
  { key: "nova2-en", label: "English (Nova-2)", model: "nova-2", language: "en", filler_words: false },
  { key: "nova2-en-fw", label: "English (Nova-2) + Filler Words", model: "nova-2", language: "en", filler_words: true },
  { key: "nova2-et", label: "Estonian (Nova-2)", model: "nova-2", language: "et", filler_words: false },
  { key: "nova2-fi", label: "Finnish (Nova-2)", model: "nova-2", language: "fi", filler_words: false },
  { key: "nova2-nl-BE", label: "Flemish (Nova-2)", model: "nova-2", language: "nl-BE", filler_words: false },
  { key: "nova2-fr", label: "French (Nova-2)", model: "nova-2", language: "fr", filler_words: false },
  { key: "nova2-de", label: "German (Nova-2)", model: "nova-2", language: "de", filler_words: false },
  { key: "nova2-de-CH", label: "German (Switzerland) (Nova-2)", model: "nova-2", language: "de-CH", filler_words: false },
  { key: "nova2-el", label: "Greek (Nova-2)", model: "nova-2", language: "el", filler_words: false },
  { key: "nova2-hi", label: "Hindi (Nova-2)", model: "nova-2", language: "hi", filler_words: false },
  { key: "nova2-hu", label: "Hungarian (Nova-2)", model: "nova-2", language: "hu", filler_words: false },
  { key: "nova2-id", label: "Indonesian (Nova-2)", model: "nova-2", language: "id", filler_words: false },
  { key: "nova2-it", label: "Italian (Nova-2)", model: "nova-2", language: "it", filler_words: false },
  { key: "nova2-ja", label: "Japanese (Nova-2)", model: "nova-2", language: "ja", filler_words: false },
  { key: "nova2-ko", label: "Korean (Nova-2)", model: "nova-2", language: "ko", filler_words: false },
  { key: "nova2-lv", label: "Latvian (Nova-2)", model: "nova-2", language: "lv", filler_words: false },
  { key: "nova2-lt", label: "Lithuanian (Nova-2)", model: "nova-2", language: "lt", filler_words: false },
  { key: "nova2-ms", label: "Malay (Nova-2)", model: "nova-2", language: "ms", filler_words: false },
  { key: "nova2-no", label: "Norwegian (Nova-2)", model: "nova-2", language: "no", filler_words: false },
  { key: "nova2-pl", label: "Polish (Nova-2)", model: "nova-2", language: "pl", filler_words: false },
  { key: "nova2-pt", label: "Portuguese (Nova-2)", model: "nova-2", language: "pt", filler_words: false },
  { key: "nova2-ro", label: "Romanian (Nova-2)", model: "nova-2", language: "ro", filler_words: false },
  { key: "nova2-ru", label: "Russian (Nova-2)", model: "nova-2", language: "ru", filler_words: false },
  { key: "nova2-sk", label: "Slovak (Nova-2)", model: "nova-2", language: "sk", filler_words: false },
  { key: "nova2-es", label: "Spanish (Nova-2)", model: "nova-2", language: "es", filler_words: false },
  { key: "nova2-sv", label: "Swedish (Nova-2)", model: "nova-2", language: "sv", filler_words: false },
  { key: "nova2-th", label: "Thai (Nova-2)", model: "nova-2", language: "th", filler_words: false },
  { key: "nova2-tr", label: "Turkish (Nova-2)", model: "nova-2", language: "tr", filler_words: false },
  { key: "nova2-uk", label: "Ukrainian (Nova-2)", model: "nova-2", language: "uk", filler_words: false },
  { key: "nova2-vi", label: "Vietnamese (Nova-2)", model: "nova-2", language: "vi", filler_words: false },
];

export type UserMessageType = { type: 'error' | 'success' | 'info', text: string };

export function useSpeechRecognition() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiKeyStatus, setApiKeyStatus] = useState<'loading' | 'loaded' | 'error' | 'not_configured'>('loading');
  const [isListening, setIsListening] = useState(false);
  const [finalWords, setFinalWords] = useState<WordConfidence[]>([]);
  const [interimWords, setInterimWords] = useState<WordConfidence[]>([]);
  const [selectedOptionKey, setSelectedOptionKey] = useState<string>(transcriptionOptions[0].key);
  const [enableDiarization, setEnableDiarization] = useState<boolean>(false);
  const [userMessage, setUserMessage] = useState<UserMessageType | null>(null);
  const [copyStatusMessage, setCopyStatusMessage] = useState<string | null>(null);

  // States for AI Text Fix
  const [aiPrompt, setAiPrompt] = useState("Fix grammar and clarity, ensure a professional tone.");
  const [fixedTranscript, setFixedTranscript] = useState("");
  const [isFixingText, setIsFixingText] = useState(false);
  const [aiFixError, setAiFixError] = useState<string | null>(null);
  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(null);

  const connectionRef = useRef<LiveClient | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const microphoneInitialized = useRef(false);
  const transcriptContainerRef = useRef<HTMLDivElement>(null); // For auto-scrolling

  // Fetch API Key
  useEffect(() => {
    // Fetch Deepgram API Key
    fetch("/api/deepgram-key")
      .then((res) => res.json())
      .then((data) => {
        if (data.key) {
          setApiKey(data.key);
          setApiKeyStatus('loaded');
          // Set a general success message, or let components handle it.
          // setUserMessage({ type: 'success', text: 'Deepgram API Key loaded.' });
        } else {
          console.error("Failed to get Deepgram API key:", data.error);
          setApiKeyStatus('not_configured'); // Specific to Deepgram
          setUserMessage({ type: 'error', text: 'Error: DEEPGRAM_API_KEY not configured. Transcription may fail.' });
        }
      })
      .catch(err => {
        console.error("Error fetching Deepgram API key:", err);
        setApiKeyStatus('error'); // Specific to Deepgram
        setUserMessage({ type: 'error', text: 'Error fetching Deepgram API key. Check console.' });
      });

    // Fetch Gemini API Key
    fetch('/api/gemini-key')
      .then((res) => res.json())
      .then((data) => {
        if (data.apiKey) {
          setGeminiApiKey(data.apiKey);
          // Clear any previous Gemini key errors if present
          if (aiFixError && (aiFixError.includes("Gemini API key not found") || aiFixError.includes("Failed to load AI features"))) {
            setAiFixError(null);
          }
        } else {
          console.error("Failed to get Gemini API key:", data.error);
          setAiFixError(data.error || "Gemini API key not found. AI features may be unavailable.");
        }
      })
      .catch(err => {
        console.error("Error fetching Gemini API key:", err);
        setAiFixError(`Failed to load AI features: ${(err as Error).message}`);
      });
  }, []); // Removed aiFixError from dependency array to avoid re-fetching on error set

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
    }
  }, [finalWords, interimWords]);

  const setupMicrophone = useCallback(async (): Promise<MediaRecorder | null> => {
    if (microphoneInitialized.current && mediaRecorderRef.current) {
      return mediaRecorderRef.current;
    }
    if (microphoneInitialized.current && !mediaRecorderRef.current) {
      microphoneInitialized.current = false; // Reset if inconsistent
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0 && connectionRef.current?.getReadyState() === 1) {
          connectionRef.current.send(event.data);
        }
      };
      mediaRecorderRef.current = recorder;
      microphoneInitialized.current = true;
      return recorder;
    } catch (error) {
      console.error("Error accessing/setting up microphone:", error);
      setUserMessage({ type: 'error', text: 'Microphone access denied or error. Please grant permission.' });
      mediaRecorderRef.current = null;
      microphoneInitialized.current = false;
      return null;
    }
  }, []);

  const connectToDeepgram = useCallback(async () => {
    if (!apiKey) {
      setUserMessage({ type: 'error', text: 'API Key not available.' });
      return null;
    }

    let currentMediaRecorder = mediaRecorderRef.current;
    if (!currentMediaRecorder) {
      currentMediaRecorder = await setupMicrophone();
      if (!currentMediaRecorder) {
        setUserMessage({ type: 'error', text: 'Microphone setup failed.' });
        return null;
      }
    }
    
    const deepgram = createClient(apiKey);
    const selectedOption = transcriptionOptions.find(opt => opt.key === selectedOptionKey);
    if (!selectedOption) {
      setUserMessage({ type: 'error', text: 'Invalid transcription option.' });
      return null;
    }

    const liveConnectionOptions: any = {
      model: selectedOption.model,
      language: selectedOption.language,
      interim_results: true,
      smart_format: true,
      utterance_end_ms: 3000,
      ...(selectedOption.filler_words && { filler_words: true }),
      ...(enableDiarization && { diarize: true }),
    };

    const liveConnection = deepgram.listen.live(liveConnectionOptions);
    connectionRef.current = liveConnection;

    liveConnection.on(LiveTranscriptionEvents.Open, () => {
      setUserMessage({ type: 'info', text: 'Connection opened. Listening...' });
      if (currentMediaRecorder?.state === "inactive") {
        currentMediaRecorder.start(250); // Start recording and send data every 250ms
      }
      setIsListening(true);
    });

    liveConnection.on(LiveTranscriptionEvents.Transcript, (data: LiveTranscriptionEvent) => {
      const alternative = data.channel?.alternatives[0];
      if (!alternative || !alternative.words || alternative.words.length === 0) {
        if (data.is_final) setInterimWords([]);
        return;
      }
      const newWords: WordConfidence[] = alternative.words.map((wordInfo: DeepgramWordType) => ({
        text: wordInfo.punctuated_word || wordInfo.word || "",
        confidence: wordInfo.confidence || 0,
        speaker: wordInfo.speaker,
      }));
      if (data.is_final) {
        setFinalWords(prev => [...prev, ...newWords]);
        setInterimWords([]);
      } else {
        setInterimWords(newWords);
      }
    });

    liveConnection.on(LiveTranscriptionEvents.Close, () => {
      setUserMessage({ type: 'info', text: 'Connection closed.' });
      setIsListening(false);
      connectionRef.current = null;
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    });

    liveConnection.on(LiveTranscriptionEvents.Error, (error: DeepgramError) => {
      console.error("Deepgram connection ERROR:", error);
      setUserMessage({ type: 'error', text: `Connection error: ${error.message}` });
      setIsListening(false);
    });

    liveConnection.on(LiveTranscriptionEvents.Metadata, (metadata: LiveMetadataEvent) => {
      console.log("Deepgram METADATA:", metadata); // For debugging
    });
    
    // Keep-alive mechanism
    const keepAliveInterval = setInterval(() => {
      if (connectionRef.current?.getReadyState() === 1) { // STATE_OPEN
        connectionRef.current.keepAlive();
      } else {
        clearInterval(keepAliveInterval);
      }
    }, 10000); // Send keepalive every 10 seconds

    return () => { // Cleanup function
      clearInterval(keepAliveInterval);
      if (connectionRef.current) {
        connectionRef.current.finish();
        connectionRef.current = null;
      }
      // Stop microphone tracks when component unmounts or connection is re-established
      if (mediaRecorderRef.current?.stream) {
         mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
         mediaRecorderRef.current = null; 
         microphoneInitialized.current = false;
      }
    };
  }, [apiKey, selectedOptionKey, enableDiarization, setupMicrophone]);

  const toggleListening = useCallback(async () => {
    if (apiKeyStatus !== 'loaded') {
      setUserMessage({ type: 'error', text: 'API Key not loaded or configured.' });
      return;
    }

    if (isListening && connectionRef.current) {
      connectionRef.current.finish();
      // State updates (isListening=false, etc.) are handled by the 'Close' event
    } else {
      const cleanup = await connectToDeepgram();
      // Store cleanup function if needed, though connectToDeepgram returns one for its own internal useEffect-like cleanup
    }
  }, [isListening, apiKeyStatus, connectToDeepgram]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (connectionRef.current) {
        connectionRef.current.finish();
      }
      if (mediaRecorderRef.current?.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCopyToClipboard = useCallback(async () => {
    if (finalWords.length === 0) {
      setCopyStatusMessage("Nothing to copy.");
      setTimeout(() => setCopyStatusMessage(null), 3000);
      return;
    }

    const transcriptText = finalWords.map(word => word.text).join(" ");
    try {
      await navigator.clipboard.writeText(transcriptText);
      setCopyStatusMessage("Transcript copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy text: ", err);
      setCopyStatusMessage("Failed to copy transcript.");
    } finally {
      setTimeout(() => setCopyStatusMessage(null), 3000);
    }
  }, [finalWords]);

  const handleFixTranscript = useCallback(async () => {
    if (isFixingText || !geminiApiKey || finalWords.length === 0) {
      if (!geminiApiKey && !aiFixError) { // Only set error if not already set from key fetching
        setAiFixError("AI features unavailable: API key not loaded.");
      }
      return;
    }

    setIsFixingText(true);
    setAiFixError(null);
    setFixedTranscript("");

    const originalTranscript = finalWords.map(word => word.text).join(" ");

    try {
      const result = await fetchFixedTranscript(originalTranscript, aiPrompt, geminiApiKey);
      if (result) {
        setFixedTranscript(result);
      } else {
        setAiFixError("AI returned an empty response.");
      }
    } catch (error) {
      console.error("Error fixing transcript with AI:", error);
      setAiFixError(`Failed to fix transcript: ${(error as Error).message}`);
    } finally {
      setIsFixingText(false);
    }
  }, [finalWords, aiPrompt, geminiApiKey, isFixingText, aiFixError]); // Added aiFixError

  return {
    apiKey,
    apiKeyStatus,
    isListening,
    finalWords,
    interimWords,
    selectedOptionKey,
    setSelectedOptionKey,
    enableDiarization,
    setEnableDiarization,
    userMessage,
    setUserMessage, // Allow components to set messages too
    toggleListening,
    transcriptionOptions,
    transcriptContainerRef, // Pass the ref for the transcript display area
    handleCopyToClipboard,
    copyStatusMessage,
    // AI Text Fix related exports
    aiPrompt,
    setAiPrompt,
    fixedTranscript,
    isFixingText,
    aiFixError,
    handleFixTranscript,
  };
}