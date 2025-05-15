"use client";

import { useState, useEffect, useRef, FC } from "react";
import {
  createClient,
  LiveClient,
  LiveTranscriptionEvents,
  LiveTranscriptionEvent,
  // Word, // Removed problematic import
  LiveConnectionState,
  DeepgramError,
  LiveMetadataEvent
} from "@deepgram/sdk";

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
    { key: "nova2-en", label: "English (Nova-2)", model: "nova-2", language: "en", filler_words: false }, // Nova-2 English without filler words by default in this list
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

// State for the Deepgram API key
  const [apiKey, setApiKey] = useState<string | null>(null);
  // State to track if the component is actively listening and transcribing
  const [isListening, setIsListening] = useState(false);
  // State to store the accumulated final transcript as words with confidence
  const [finalWords, setFinalWords] = useState<WordConfidence[]>([]);
  // State to store the current interim (non-final) transcript as words with confidence
  const [interimWords, setInterimWords] = useState<WordConfidence[]>([]);
  // State for the selected combined transcription option
  const [selectedOptionKey, setSelectedOptionKey] = useState<string>(transcriptionOptions[0].key); // Default to the first option
  // Feature toggle for diarization
  const [enableDiarization, setEnableDiarization] = useState<boolean>(false);

  const connectionRef = useRef<LiveClient | null>(null);
  // State to hold the MediaRecorder instance for microphone input
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  // Ref to track if microphone setup has been attempted/completed, to avoid redundant setup calls
  const microphoneInitialized = useRef(false);

  // Effect to fetch the Deepgram API key when the component mounts
  useEffect(() => {
    fetch("/api/deepgram-key")
      .then((res) => res.json())
      .then((data) => {
        if (data.key) {
          console.log("API Key fetched successfully.");
          setApiKey(data.key);
        } else {
          console.error("Failed to get API key:", data.error);
          alert("Error: DEEPGRAM_API_KEY not configured on the server. Please check your .env.local file.");
        }
      })
      .catch(err => {
        console.error("Error fetching API key:", err);
        alert("Error fetching API key. Check the console for details.");
      });
  }, []);

  /**
   * Sets up the microphone for audio capture.
   * Requests user permission for microphone access.
   * Initializes MediaRecorder with 'audio/webm;codecs=opus' mime type.
   * Sets up an event listener for 'dataavailable' to send audio chunks to Deepgram.
   */
  const setupMicrophone = async (): Promise<MediaRecorder | null> => {
    console.log("Attempting to setup microphone...");

    // If already successfully initialized and recorder exists in state, return it.
    if (microphoneInitialized.current && mediaRecorder) {
      console.log("Microphone already initialized and recorder available in state.");
      return mediaRecorder;
    }

    // If flag is true but no recorder, it implies an issue; reset flag to allow re-attempt.
    if (microphoneInitialized.current && !mediaRecorder) {
        console.warn("Microphone was marked initialized but no recorder found in state. Resetting for new setup attempt.");
        microphoneInitialized.current = false;
    }

    try {
      console.log("Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Microphone stream acquired.");

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      console.log("MediaRecorder created with mimeType: audio/webm;codecs=opus");

      recorder.ondataavailable = (event) => {
        console.log("MediaRecorder ondataavailable event fired.");
        if (event.data.size > 0) {
          console.log(`Audio data available: ${event.data.size} bytes`);
          if (connectionRef.current && connectionRef.current.getReadyState() === 1 /* WebSocket.OPEN */) {
            console.log("Sending audio data to Deepgram via connectionRef.");
            connectionRef.current.send(event.data);
          } else {
            console.warn(`No open Deepgram connection to send audio data to, or connection not ready. connectionRef.current state: ${connectionRef.current?.getReadyState()}`);
          }
        } else {
          console.log("Audio data available but size is 0.");
        }
      };

      setMediaRecorder(recorder);
      microphoneInitialized.current = true; // Mark as successfully initialized
      console.log("MediaRecorder set in state and microphone marked as initialized.");
      return recorder;
    } catch (error) {
      console.error("Error accessing or setting up microphone:", error);
      alert("Error accessing microphone. Please ensure permission is granted and try again. Check console for details.");
      setMediaRecorder(null); // Ensure recorder state is null on failure
      microphoneInitialized.current = false; // Mark as not successfully initialized
      return null;
    }
  };

  /**
   * Connects to the Deepgram live transcription service.
   * Ensures API key and MediaRecorder are available before attempting connection.
   * Sets up event listeners for Deepgram connection events (Open, Transcript, Close, Error, Metadata).
   * Starts the MediaRecorder when the connection opens.
   * Implements a keep-alive mechanism for the Deepgram connection.
   * Returns a cleanup function to close the connection and stop media tracks.
   */
  const connectToDeepgram = async () => {
    console.log("Attempting to connect to Deepgram...");

    // Ensure API key is available
    if (!apiKey) {
      console.error("API Key not available. Cannot connect to Deepgram.");
      alert("API Key not available. Cannot connect to Deepgram.");
      return;
    }

    // Ensure MediaRecorder is available, setting it up if necessary
    if (!mediaRecorder) {
      console.log("connectToDeepgram: MediaRecorder not in state, calling setupMicrophone.");
      const recorderInstance = await setupMicrophone(); // setupMicrophone now returns MediaRecorder | null
      if (!recorderInstance) {
        console.error("connectToDeepgram: Microphone setup failed. Cannot connect to Deepgram.");
        alert("Microphone not available. Cannot connect to Deepgram.");
        return; // No cleanup function to return as connection wasn't made
      }
      // If setupMicrophone succeeded, it called setMediaRecorder.
      // The mediaRecorder state will update. The Open event handler later should see the updated state.
      console.log("connectToDeepgram: Microphone setup initiated, instance obtained. State will update.");
    }

    console.log("Creating Deepgram client...");
    const deepgram = createClient(apiKey);
    console.log("Deepgram client created. Establishing live connection...");

    // Define Deepgram connection options
    const selectedOption = transcriptionOptions.find(opt => opt.key === selectedOptionKey);
    if (!selectedOption) {
      console.error("Selected transcription option not found!");
      alert("Error: Selected transcription option is invalid.");
      return;
    }

    const liveConnectionOptions: any = {
      model: selectedOption.model,
      language: selectedOption.language,
      interim_results: true,
      smart_format: true,
      utterance_end_ms: 3000,
    };

    if (selectedOption.filler_words) {
      liveConnectionOptions.filler_words = true;
    }
    if (enableDiarization) {
      liveConnectionOptions.diarize = true;
    }

    console.log("Connecting with options:", liveConnectionOptions);
    const liveConnection = deepgram.listen.live(liveConnectionOptions);

    // Event listener for when the Deepgram connection opens
    liveConnection.on(LiveTranscriptionEvents.Open, () => {
      console.log("Deepgram connection OPENED successfully.");
      connectionRef.current = liveConnection; // Store the connection in the ref

      // Start MediaRecorder if it's inactive
      if (mediaRecorder?.state === "inactive") {
        console.log("MediaRecorder is inactive, starting it now with 250ms timeslice.");
        mediaRecorder?.start(250); // Start recording and send data every 250ms
      } else {
        console.warn(`MediaRecorder state is: ${mediaRecorder?.state}. Not starting explicitly.`);
      }
      setIsListening(true); // Update listening state
    });

    // Event listener for receiving transcripts from Deepgram
    liveConnection.on(LiveTranscriptionEvents.Transcript, (data: LiveTranscriptionEvent) => {
      console.log("Deepgram Transcript received:", JSON.stringify(data, null, 2));
      const alternative = data.channel?.alternatives[0];
      if (!alternative) return;

      const words = alternative.words;

      if (!words || words.length === 0) {
        console.log("Received transcript data, but no words found.");
        if (data.is_final) {
          setInterimWords([]); // Clear interim if final and no words
        }
        return;
      }

      const newWords: WordConfidence[] = words.map((wordInfo: DeepgramWordType) => ({
        text: wordInfo.punctuated_word || wordInfo.word || "",
        confidence: wordInfo.confidence || 0,
        speaker: wordInfo.speaker,
      }));

      if (data.is_final) {
        console.log("Final transcript words:", newWords);
        setFinalWords((prev: WordConfidence[]) => [...prev, ...newWords]);
        setInterimWords([]); // Clear interim transcript
      } else {
        console.log("Interim transcript words:", newWords);
        setInterimWords(newWords); // Update interim transcript
      }
    });

    // Event listener for when the Deepgram connection closes
    liveConnection.on(LiveTranscriptionEvents.Close, (event: LiveConnectionState) => {
      console.log("Deepgram connection CLOSED.", event);
      setIsListening(false);
      connectionRef.current = null; // Clear the connection ref

      // Stop MediaRecorder if it's still recording
      if (mediaRecorder?.state === "recording") {
        console.log("Deepgram connection closed, stopping MediaRecorder.");
        mediaRecorder.stop();
      }
    });

    // Event listener for Deepgram connection errors
    liveConnection.on(LiveTranscriptionEvents.Error, (error: DeepgramError) => {
      console.error("Deepgram connection ERROR:", error);
      setIsListening(false);
      // Consider adding logic here to attempt reconnection or notify the user more gracefully.
    });

    // Event listener for Deepgram metadata
    liveConnection.on(LiveTranscriptionEvents.Metadata, (metadata: LiveMetadataEvent) => {
      console.log("Deepgram connection METADATA:", metadata);
    });

    // Interval to send keep-alive messages to Deepgram to maintain the connection
    const keepAliveInterval = setInterval(() => {
      if (connectionRef.current && connectionRef.current.getReadyState() === 1 /* WebSocket.OPEN */) {
        // console.log("Sending keepAlive to Deepgram."); // Uncomment for verbose keep-alive logging
        connectionRef.current.keepAlive();
      } else {
        // console.log("Clearing keepAlive interval as connection is not open."); // Uncomment for verbose logging
        clearInterval(keepAliveInterval);
      }
    }, 10000); // Send keep-alive every 10 seconds

    // Cleanup function to be returned by useEffect or called when disconnecting
    // This ensures resources are released properly.
    return () => {
      console.log("Cleanup function for connectToDeepgram called.");
      clearInterval(keepAliveInterval); // Clear the keep-alive interval
      if (connectionRef.current) {
        console.log("Finishing Deepgram live connection via connectionRef.");
        connectionRef.current.finish(); // Gracefully close the Deepgram connection
        connectionRef.current = null; // Clear the ref
      }
      // Stop all tracks on the media stream to release the microphone
      if (mediaRecorder?.stream) {
        console.log("Stopping all media tracks.");
        mediaRecorder.stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      }
    };
  };

  /**
   * Toggles the listening state (starts or stops transcription).
   * Ensures API key and microphone are ready before starting.
   * Calls `connectToDeepgram` to start or `connection.finish()` to stop.
   */
  const toggleListening = async () => {
    console.log(`toggleListening called. isListening: ${isListening}`);

    // Check for API key
    if (!apiKey) {
      console.error("toggleListening: Deepgram API Key is not configured.");
      alert("Deepgram API Key is not configured. Please check server logs or .env.local setup.");
      return;
    }

    if (isListening && connectionRef.current) {
      console.log("toggleListening: Currently listening, attempting to stop via connectionRef.");
      connectionRef.current.finish(); // This will trigger the Close event and associated cleanup
    } else { // Not listening, try to start
      let recorderToUse = mediaRecorder; // Check current state

      if (!recorderToUse) { // If no recorder from state, try to set it up
        console.log("toggleListening: MediaRecorder not in state, calling setupMicrophone.");
        recorderToUse = await setupMicrophone(); // This will set state and return the instance
      }
      // After this, recorderToUse holds the instance if setup was successful (now or previously).
      // And mediaRecorder state should also be (or getting) updated.

      if (recorderToUse) {
        console.log("toggleListening: MediaRecorder is available. Attempting to connect to Deepgram.");
        await connectToDeepgram();
      } else {
        console.error("toggleListening: Microphone setup failed or not available after attempt.");
        alert("Microphone not ready. Please ensure permissions are granted and try refreshing.");
      }
    }
  };

  // Helper function to get background color based on confidence
  const getConfidenceColor = (confidence: number): string => {
    if (confidence > 0.9) {
      return "rgba(0, 255, 0, 0.3)"; // Light Green
    } else if (confidence > 0.7) {
      return "rgba(255, 255, 0, 0.3)"; // Light Yellow
    } else if (confidence > 0.5) {
      return "rgba(255, 165, 0, 0.3)"; // Light Orange
    } else {
      return "rgba(255, 0, 0, 0.3)"; // Light Red
    }
  };

  // Render the UI
  return (
    <div>
      <div>
        <label htmlFor="transcription-option-select">Transcription Setting: </label>
        <select
          id="transcription-option-select"
          value={selectedOptionKey}
          onChange={(e) => setSelectedOptionKey(e.target.value)}
          disabled={isListening}
        >
          {transcriptionOptions.map(option => (
            <option key={option.key} value={option.key}>{option.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="diarization-toggle" style={{ marginRight: "10px" }}>Enable Speaker Diarization: </label>
        <input
          type="checkbox"
          id="diarization-toggle"
          checked={enableDiarization}
          onChange={(e) => setEnableDiarization(e.target.checked)}
          disabled={isListening}
        />
      </div>
      <br />
      <button onClick={toggleListening} disabled={!apiKey}>
        {isListening ? "Stop Listening" : "Start Listening"}
      </button>
      <p>Status: {isListening ? "Listening..." : "Not Listening"}</p>
      {apiKey ? <p style={{color: "green"}}>API Key Loaded</p> : <p style={{color: "red"}}>API Key NOT Loaded - Check .env.local and server console.</p>}
      <h3>Transcript:</h3>
      <div style={{ border: "1px solid #ccc", padding: "10px", minHeight: "100px", whiteSpace: "pre-wrap" }}>
        {(() => {
          let lastSpeaker: number | undefined = undefined;
          return finalWords.map((word: WordConfidence, index: number) => {
            const showSpeakerLabel = enableDiarization && word.speaker !== undefined && word.speaker !== lastSpeaker;
            lastSpeaker = word.speaker;
            return (
              <span key={`final-${index}`}>
                {showSpeakerLabel && <strong style={{ display: 'block', marginTop: index > 0 ? '5px' : '0' }}>Speaker {word.speaker}:</strong>}
                <span style={{ backgroundColor: getConfidenceColor(word.confidence), padding: "1px 2px", margin: "0 1px", borderRadius: "3px" }}>
                  {word.text}{' '}
                </span>
              </span>
            );
          });
        })()}
        {(() => {
          let lastSpeaker: number | undefined = undefined;
          return interimWords.map((word: WordConfidence, index: number) => {
            const showSpeakerLabel = enableDiarization && word.speaker !== undefined && word.speaker !== lastSpeaker;
            lastSpeaker = word.speaker;
            return (
              <span key={`interim-${index}`}>
                {showSpeakerLabel && <strong style={{ display: 'block', marginTop: index > 0 ? '5px' : '0', color: "#777" }}>Speaker {word.speaker}:</strong>}
                <span style={{ backgroundColor: getConfidenceColor(word.confidence), color: "#555", padding: "1px 2px", margin: "0 1px", borderRadius: "3px" }}>
                  {word.text}{' '}
                </span>
              </span>
            );
          });
        })()}
      </div>
    </div>
  );
};

export default SpeechComponent;