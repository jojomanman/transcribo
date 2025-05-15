"use client";

import { useState, useEffect, useRef, FC } from "react";
import {
  createClient,
  LiveClient,
  LiveTranscriptionEvents,
  LiveTranscriptionEvent,
  LiveConnectionState,
  DeepgramError,
  LiveMetadataEvent,
} from "@deepgram/sdk";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Settings2, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

// Define a local interface for the Deepgram word object structure
interface DeepgramWordType {
  word?: string;
  punctuated_word?: string;
  confidence?: number;
  start?: number;
  end?: number;
  speaker?: number;
}

const SpeechComponent: FC = () => {
  // Interface for word with confidence (used for state)
  interface WordConfidence {
    text: string;
    confidence: number;
    speaker?: number; // Added for diarization
  }

  // Interface for combined transcription options
  interface TranscriptionOption {
    key: string;
    label: string;
    model: string;
    language: string;
    filler_words: boolean;
  }

  // Define all transcription options
  const transcriptionOptions: TranscriptionOption[] = [
    { key: "nova3-en-fw", label: "English (Nova-3) + Filler Words", model: "nova-3", language: "en", filler_words: true },
    { key: "nova3-en", label: "English (Nova-3)", model: "nova-3", language: "en", filler_words: false },
    { key: "nova3-multi", label: "Multi (Nova-3) (EN,ES,FR,DE,IT,PT,NL,HI,JA,RU)", model: "nova-3", language: "multi", filler_words: false },
    // Nova-2 Languages (filler_words: false for all non-English)
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

  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [finalWords, setFinalWords] = useState<WordConfidence[]>([]);
  const [interimWords, setInterimWords] = useState<WordConfidence[]>([]);
  const [selectedOptionKey, setSelectedOptionKey] = useState<string>(transcriptionOptions[0].key);
  const [enableDiarization, setEnableDiarization] = useState<boolean>(false);
  const [userMessage, setUserMessage] = useState<{ type: 'error' | 'success' | 'info', text: string } | null>(null);


  const connectionRef = useRef<LiveClient | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null); // Changed to ref
  const microphoneInitialized = useRef(false);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    fetch("/api/deepgram-key")
      .then((res) => res.json())
      .then((data) => {
        if (data.key) {
          console.log("API Key fetched successfully.");
          setApiKey(data.key);
          setUserMessage({ type: 'success', text: 'API Key loaded successfully.' });
        } else {
          console.error("Failed to get API key:", data.error);
          setUserMessage({ type: 'error', text: 'Error: DEEPGRAM_API_KEY not configured. Please check server setup.' });
        }
      })
      .catch(err => {
        console.error("Error fetching API key:", err);
        setUserMessage({ type: 'error', text: 'Error fetching API key. Check console.' });
      });
  }, []);

  useEffect(() => {
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
    }
  }, [finalWords, interimWords]);


  const setupMicrophone = async (): Promise<MediaRecorder | null> => {
    console.log("Attempting to setup microphone...");

    if (microphoneInitialized.current && mediaRecorderRef.current) {
      console.log("Microphone already initialized.");
      return mediaRecorderRef.current;
    }

    if (microphoneInitialized.current && !mediaRecorderRef.current) {
      console.warn("Microphone marked initialized but no recorder found. Resetting.");
      microphoneInitialized.current = false;
    }

    try {
      console.log("Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Microphone stream acquired.");

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      console.log("MediaRecorder created.");

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0 && connectionRef.current?.getReadyState() === 1) {
          connectionRef.current.send(event.data);
        }
      };

      mediaRecorderRef.current = recorder; // Store in ref
      microphoneInitialized.current = true;
      console.log("MediaRecorder set in ref and microphone marked as initialized.");
      return recorder;
    } catch (error) {
      console.error("Error accessing or setting up microphone:", error);
      setUserMessage({ type: 'error', text: 'Microphone access denied or error. Please grant permission and refresh.' });
      mediaRecorderRef.current = null;
      microphoneInitialized.current = false;
      return null;
    }
  };

  const connectToDeepgram = async () => {
    console.log("Attempting to connect to Deepgram...");

    if (!apiKey) {
      setUserMessage({ type: 'error', text: 'API Key not available. Cannot connect.' });
      return;
    }

    let currentMediaRecorder = mediaRecorderRef.current;
    if (!currentMediaRecorder) {
      console.log("MediaRecorder not in ref, calling setupMicrophone.");
      currentMediaRecorder = await setupMicrophone();
      if (!currentMediaRecorder) {
        setUserMessage({ type: 'error', text: 'Microphone setup failed. Cannot connect.' });
        return;
      }
    }
    
    console.log("Creating Deepgram client...");
    const deepgram = createClient(apiKey);
    console.log("Deepgram client created. Establishing live connection...");

    const selectedOption = transcriptionOptions.find(opt => opt.key === selectedOptionKey);
    if (!selectedOption) {
      setUserMessage({ type: 'error', text: 'Invalid transcription option selected.' });
      return;
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

    console.log("Connecting with options:", liveConnectionOptions);
    const liveConnection = deepgram.listen.live(liveConnectionOptions);
    connectionRef.current = liveConnection;

    liveConnection.on(LiveTranscriptionEvents.Open, () => {
      console.log("Deepgram connection OPENED.");
      setUserMessage({ type: 'info', text: 'Connection opened. Listening...' });
      if (currentMediaRecorder?.state === "inactive") {
        currentMediaRecorder.start(250);
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
      console.log("Deepgram connection CLOSED.");
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
      console.log("Deepgram METADATA:", metadata);
    });

    const keepAliveInterval = setInterval(() => {
      if (connectionRef.current?.getReadyState() === 1) {
        connectionRef.current.keepAlive();
      } else {
        clearInterval(keepAliveInterval);
      }
    }, 10000);

    return () => {
      console.log("Cleanup for connectToDeepgram.");
      clearInterval(keepAliveInterval);
      if (connectionRef.current) {
        connectionRef.current.finish();
        connectionRef.current = null;
      }
      if (mediaRecorderRef.current?.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  };

  const toggleListening = async () => {
    if (!apiKey) {
      setUserMessage({ type: 'error', text: 'API Key not configured.' });
      return;
    }

    if (isListening && connectionRef.current) {
      console.log("Stopping listening.");
      connectionRef.current.finish();
    } else {
      console.log("Starting listening.");
      setFinalWords([]); // Clear previous transcript
      setInterimWords([]);
      let recorder = mediaRecorderRef.current;
      if (!recorder) {
        recorder = await setupMicrophone();
      }
      if (recorder) {
        await connectToDeepgram();
      } else {
         setUserMessage({ type: 'error', text: 'Microphone not ready. Cannot start listening.' });
      }
    }
  };

  const getConfidenceColorClasses = (confidence: number): string => {
    if (confidence > 0.9) return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200";
    if (confidence > 0.7) return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200";
    if (confidence > 0.5) return "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200";
    return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200";
  };

  return (
    <div className="flex flex-col h-full w-full max-w-2xl mx-auto"> {/* Occupy available height */}
      {userMessage && (
        <div className={`p-3 rounded-md text-sm flex items-center space-x-2 mb-2 ${
          userMessage.type === 'error' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200' :
          userMessage.type === 'success' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200' :
          'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
        }`}>
          {userMessage.type === 'error' && <AlertTriangle className="h-5 w-5" />}
          {userMessage.type === 'success' && <CheckCircle2 className="h-5 w-5" />}
          {userMessage.type === 'info' && <Info className="h-5 w-5" />}
          <span>{userMessage.text}</span>
        </div>
      )}

      {/* Transcript Area */}
      <div
        ref={transcriptContainerRef}
        className="flex-grow p-3 border rounded-md bg-muted/30 dark:bg-muted/50 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed scroll-smooth mb-4" // flex-grow to take available space, mb-4 for spacing from controls
      >
        {finalWords.length === 0 && interimWords.length === 0 && (
          <p className="text-muted-foreground italic">
            {isListening ? "Listening for speech..." : "Press Mic to begin."}
          </p>
        )}
        {(() => {
          let lastSpeaker: number | undefined = undefined;
          return finalWords.map((word, index) => {
            const showSpeakerLabel = enableDiarization && word.speaker !== undefined && word.speaker !== lastSpeaker;
            lastSpeaker = word.speaker;
            return (
              <span key={`final-${index}`}>
                {showSpeakerLabel && (
                  <strong className="block mt-1.5 mb-0.5 text-xs font-semibold text-primary dark:text-primary-foreground/80">
                    Speaker {word.speaker}:
                  </strong>
                )}
                <span className={`px-1 py-0.5 rounded-sm ${getConfidenceColorClasses(word.confidence)}`}>
                  {word.text}{' '}
                </span>
              </span>
            );
          });
        })()}
        {(() => {
          let lastSpeaker: number | undefined = undefined;
          const currentFinalSpeaker = finalWords.length > 0 ? finalWords[finalWords.length -1].speaker : undefined;

          return interimWords.map((word, index) => {
            const showSpeakerLabel = enableDiarization && word.speaker !== undefined && word.speaker !== lastSpeaker && (index === 0 ? word.speaker !== currentFinalSpeaker : true);
            lastSpeaker = word.speaker;
            return (
              <span key={`interim-${index}`}>
                {showSpeakerLabel && (
                   <strong className="block mt-1.5 mb-0.5 text-xs font-semibold text-muted-foreground/70 dark:text-muted-foreground/50">
                    Speaker {word.speaker}:
                  </strong>
                )}
                <span className={`px-1 py-0.5 rounded-sm opacity-70 ${getConfidenceColorClasses(word.confidence)}`}>
                  {word.text}{' '}
                </span>
              </span>
            );
          });
        })()}
      </div>

      {/* Controls/Options Area (Below Transcript - Mobile Only) */}
      <div className="mb-4 px-1 space-y-3 md:hidden"> {/* Spacing for controls, md:hidden */}
        <div className="flex items-center justify-between">
          <Label htmlFor="diarization-toggle-mobile" className="text-sm font-medium">
            Enable Speaker Diarization
          </Label>
          <Switch
            id="diarization-toggle-mobile"
            checked={enableDiarization}
            onCheckedChange={setEnableDiarization}
            disabled={isListening}
          />
        </div>
        {/* "Live Transcription" toggle is implicitly handled by the main record button */}
      </div>

      {/* Bottom Action Bar (Fixed - Mobile Only) */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-3 shadow-md flex items-center justify-between space-x-3 md:hidden"> {/* md:hidden to hide on desktop */}
        {/* Model Selection */}
        <div className="flex-grow-[2] min-w-0"> {/* Allow select to take space but also shrink */}
          <Select
            value={selectedOptionKey}
            onValueChange={setSelectedOptionKey}
            disabled={isListening}
          >
            <SelectTrigger id="transcription-option-select-mobile" className="w-full bg-background text-xs h-10">
              <SelectValue placeholder="Model & Lang." />
            </SelectTrigger>
            <SelectContent>
              {transcriptionOptions.map(option => (
                <SelectItem key={option.key} value={option.key} className="text-xs">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Record Button */}
        <Button
          onClick={toggleListening}
          disabled={!apiKey || (isListening && !connectionRef.current)}
          className="flex-grow-[1] min-w-[80px] h-10 transition-all duration-150 ease-in-out" // Adjusted for mobile
          variant={isListening ? "destructive" : "default"}
          size="lg" // Make button prominent
        >
          {isListening ? (
            <MicOff className="h-5 w-5 sm:mr-2" /> // Icon only on very small, then with text
          ) : (
            <Mic className="h-5 w-5 sm:mr-2" />
          )}
          <span className="hidden sm:inline">{isListening ? "Stop" : "Record"}</span>
        </Button>
      </div>
      {/* Desktop Controls Area */}
      <div className="hidden md:block mt-6 w-full"> {/* md:block to show on desktop, mt-6 for spacing from transcript */}
        <Card className="shadow-lg dark:shadow-primary/10">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Controls & Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-4 pb-6">
            <div className="space-y-2">
              <Label htmlFor="transcription-option-select-desktop" className="text-sm font-medium">
                Transcription Model & Language
              </Label>
              <Select
                value={selectedOptionKey}
                onValueChange={setSelectedOptionKey}
                disabled={isListening}
              >
                <SelectTrigger id="transcription-option-select-desktop" className="w-full bg-background">
                  <SelectValue placeholder="Select model and language" />
                </SelectTrigger>
                <SelectContent>
                  {transcriptionOptions.map(option => (
                    <SelectItem key={option.key} value={option.key}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="diarization-toggle-desktop" className="text-sm font-medium">
                Enable Speaker Diarization
              </Label>
              <Switch
                id="diarization-toggle-desktop"
                checked={enableDiarization}
                onCheckedChange={setEnableDiarization}
                disabled={isListening}
              />
            </div>
            
            <p className="text-sm text-muted-foreground">
              Status: {isListening ? "Listening..." : "Not Listening"}
              {apiKey === null && " (API Key Loading...)"}
              {!apiKey && !userMessage?.text.includes("DEEPGRAM_API_KEY not configured") && " (Attempting to load API Key)"}
            </p>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row items-center justify-end pt-4 border-t">
            <Button
              onClick={toggleListening}
              disabled={!apiKey || (isListening && !connectionRef.current)}
              className="w-full sm:w-auto min-w-[180px] transition-all duration-150 ease-in-out"
              variant={isListening ? "destructive" : "default"}
              size="lg"
            >
              {isListening ? (
                <MicOff className="mr-2 h-5 w-5 animate-pulse" />
              ) : (
                <Mic className="mr-2 h-5 w-5" />
              )}
              {isListening ? "Stop Listening" : "Start Listening"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default SpeechComponent;