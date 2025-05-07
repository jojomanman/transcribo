"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient, LiveClient, LiveTranscriptionEvents, LiveSchema } from "@deepgram/sdk";
// WordBase is not exported by the SDK, handle word data directly.
import { DeepgramSettings, initialDeepgramSettings } from "../lib/deepgramOptions";
import DeepgramSettingsPanel from "./DeepgramSettingsPanel"; // Import the panel component
// import { CogIcon } from "./icons/CogIcon"; // CogIcon not available

interface WordElement {
  word: string;
  color: string;
  confidence?: number;
}

const SpeechComponent = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  // Revert transcript states to simple strings for debugging
  const [finalTranscript, setFinalTranscript] = useState<string>("");
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  
  const connectionRef = useRef<LiveClient | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const microphoneInitialized = useRef(false);

  const [settings, setSettings] = useState<DeepgramSettings>(initialDeepgramSettings);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const keepAliveIntervalRef = useRef<number | null>(null); // Correct type for browser interval ID

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

  // Wrap setupMicrophone in useCallback and return the recorder instance
  const setupMicrophone = useCallback(async (): Promise<MediaRecorder | null> => {
    if (microphoneInitialized.current) {
      console.log("Microphone setup already attempted.");
      return mediaRecorder; 
    }
    microphoneInitialized.current = true;
    console.log("Attempting to setup microphone...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      
      recorder.ondataavailable = (event) => {
        // Add log here to confirm data is available
        console.log(`recorder.ondataavailable: data size ${event.data.size}`);
        if (event.data.size > 0 && connectionRef.current?.getReadyState() === 1) {
          console.log("recorder.ondataavailable: Sending data to Deepgram");
          connectionRef.current.send(event.data);
        } else if (event.data.size > 0) {
           console.warn(`recorder.ondataavailable: Connection not ready (state: ${connectionRef.current?.getReadyState()}), not sending data.`);
        }
      };
      
      setMediaRecorder(recorder); // Update state
      console.log("MediaRecorder set in state.");
      return recorder; // Return the newly created recorder
    } catch (error) {
      console.error("Error accessing/setting up microphone:", error);
      alert("Error accessing microphone. Please grant permission and try again.");
      microphoneInitialized.current = false; // Allow retry
      return null; // Indicate failure
    }
  }, [mediaRecorder]); // Depend on mediaRecorder state

  // connectToDeepgram now takes the recorder instance as an argument
  // Corrected useCallback signature and dependencies
  const connectToDeepgram = useCallback(async (currentMediaRecorder: MediaRecorder): Promise<number | null> => {
    if (!apiKey) {
      alert("API Key not available for connection.");
      return null;
    }
    
    console.log("Connecting to Deepgram with settings:", settings);
    const deepgram = createClient(apiKey);
    // Destructure settings correctly
    const { model, language, specialization, ...restOfSettings } = settings; 

    let effectiveModelName: string = model;
    if (specialization && specialization !== "general") {
      effectiveModelName = `${model}-${specialization}`;
    }

    const liveConnectionOptions: LiveSchema = {
      model: effectiveModelName as any, 
      language,
      ...restOfSettings, // Spread boolean settings
      encoding: "opus",
      sample_rate: currentMediaRecorder.stream.getAudioTracks()[0].getSettings().sampleRate || 16000,
    };
    
    Object.keys(liveConnectionOptions).forEach(
        (key) => (liveConnectionOptions as any)[key] === undefined && delete (liveConnectionOptions as any)[key]
    );

    console.log("Attempting connection with options:", liveConnectionOptions);
    const liveConnection = deepgram.listen.live(liveConnectionOptions);
    connectionRef.current = liveConnection; 

    liveConnection.on(LiveTranscriptionEvents.Open, () => {
      console.log("Deepgram connection OPENED.");
      if (currentMediaRecorder?.state === "inactive") {
        currentMediaRecorder?.start(250); 
      }
      setIsListening(true);
    });

    // Add log before attaching listener
    console.log("Attaching Transcript event listener...");
    // Add log before attaching listener
    console.log("Attaching Transcript event listener...");
    // Add log before attaching listener
    console.log("Attaching Transcript event listener...");
    liveConnection.on(LiveTranscriptionEvents.Transcript, (data) => {
      console.log(">>> Transcript EVENT RECEIVED:", data);
      const { is_final: isFinal, speech_final: speechFinal, channel } = data;
      
      if (!channel || !channel.alternatives || channel.alternatives.length === 0) {
        console.warn("Received transcript data without alternatives.");
        return;
      }
      
      const alternative = channel.alternatives[0];
      const currentTranscript = alternative.transcript || "";

      // Simplified state update logic (no highlighting)
      if (isFinal && currentTranscript.trim()) {
        // Use functional update for final transcript to ensure correct appending
        setFinalTranscript(prev => prev + currentTranscript + " ");
        setInterimTranscript(""); // Clear interim
      } else if (!isFinal) {
        setInterimTranscript(currentTranscript); // Set interim
      }
      
      // Optional: Clear interim specifically when speech is final (end of utterance)
      // if (isFinal && speechFinal) {
      //    setTimeout(() => setInterimTranscript(""), 50);
      // }
    });

    // Corrected Close handler (removed duplicate)
    liveConnection.on(LiveTranscriptionEvents.Close, (event) => {
      console.log("Deepgram connection CLOSED.", event);
      setIsListening(false);
      connectionRef.current = null; 
      if (mediaRecorder?.state === "recording") { // Check state variable
        mediaRecorder.stop();
      }
      if (keepAliveIntervalRef.current) { 
        clearInterval(keepAliveIntervalRef.current);
        keepAliveIntervalRef.current = null;
      }
    });

    liveConnection.on(LiveTranscriptionEvents.Error, (error) => {
      console.error("Deepgram connection ERROR:", error);
      setIsListening(false);
      if (keepAliveIntervalRef.current) { 
        clearInterval(keepAliveIntervalRef.current);
        keepAliveIntervalRef.current = null;
      }
    });

    liveConnection.on(LiveTranscriptionEvents.Metadata, (metadata) => {
      console.log("Deepgram connection METADATA:", metadata);
    });
    
    const id = window.setInterval(() => { 
        if (connectionRef.current?.getReadyState() === 1) {
            connectionRef.current.keepAlive();
        } else {
            clearInterval(id); 
        }
    }, 10000);
    
    return id; // Return the interval ID (number)
  // Corrected dependencies: remove setupMicrophone, keep mediaRecorder state
  }, [apiKey, settings, mediaRecorder]); 

  // toggleListening uses the recorder instance returned by setupMicrophone
  const toggleListening = async () => {
    if (!apiKey) {
      alert("Deepgram API Key is not configured.");
      return;
    }

    if (isListening && connectionRef.current) {
      console.log("Stopping listening...");
      connectionRef.current.finish(); // Triggers Close event which handles cleanup
      setIsListening(false); 
    } else {
      console.log("Starting listening...");
      // Reset simple string states
      setFinalTranscript("");
      setInterimTranscript("");
      
      let recorderToUse = mediaRecorder;
      if (!recorderToUse) {
        recorderToUse = await setupMicrophone(); 
        if (!recorderToUse) { // Check if setup succeeded (returns null on failure)
          alert("Microphone setup failed. Cannot start listening.");
          return; // Exit if setup failed
        }
      }
      
      // Connect, passing the recorder instance
      // Corrected call signature
      const intervalId = await connectToDeepgram(recorderToUse); 
      if (intervalId !== null) { // Check if connection succeeded
        // Correct assignment type
        keepAliveIntervalRef.current = intervalId; 
      } else {
        setIsListening(false); 
      }
    }
  };
  
  // Effect for component unmount cleanup
  useEffect(() => {
    return () => {
      console.log("SpeechComponent unmounting: Cleaning up...");
      if (connectionRef.current) {
        connectionRef.current.finish();
      }
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
      }
      mediaRecorder?.stream?.getTracks().forEach(track => track.stop());
      console.log("Cleanup complete.");
    };
  // Correct dependency array for cleanup effect - should only run on unmount
  }, []);


  // Render the UI
  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <button 
          onClick={toggleListening} 
          disabled={!apiKey} 
          className={`px-6 py-2 rounded font-semibold text-white transition-colors
            ${isListening ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}
            ${!apiKey ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isListening ? "Stop Listening" : "Start Listening"}
        </button>
        <button 
          onClick={() => setShowSettingsPanel(!showSettingsPanel)} 
          className="p-2 rounded-full hover:bg-gray-200 text-gray-600" 
          aria-label="Toggle Settings"
        >
          {/* Replaced CogIcon */}
          <span role="img" aria-label="settings" style={{fontSize: '1.5rem'}}>⚙️</span> 
        </button>
      </div>

      {showSettingsPanel && (
        <div className="mb-4 p-4 border rounded-lg shadow-lg bg-white">
          {/* Render the actual settings panel */}
          <DeepgramSettingsPanel settings={settings} setSettings={setSettings} />
          <button
            onClick={() => setShowSettingsPanel(false)}
            className="w-full mt-4 p-2 bg-gray-500 hover:bg-gray-600 text-white rounded font-semibold"
          >
            Close Settings
          </button>
        </div>
      )}

      <div className="mb-2">
        <p className={`text-sm ${isListening ? "text-green-600" : "text-red-600"}`}>
          Status: {isListening ? "Listening..." : "Not Listening"}
        </p>
        {apiKey ? 
          <p className="text-sm text-green-600">API Key Loaded</p> : 
          <p className="text-sm text-red-600">API Key NOT Loaded - Check .env.local and server console.</p>
        }
      </div>
      
      <div className="prose max-w-none p-4 border rounded-lg bg-gray-50 min-h-[100px]">
        <h3 className="text-lg font-semibold mb-2">Transcript:</h3>
        <p>
          {/* Render simple string states */}
          {finalTranscript}
          <span className="text-gray-500">{interimTranscript}</span>
        </p>
      </div>
    </div>
  );
// Corrected closing brace for component
}; 

export default SpeechComponent;