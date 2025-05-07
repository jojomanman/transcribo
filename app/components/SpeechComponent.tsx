"use client";

import { useState, useEffect, useRef } from "react";
import { createClient, LiveClient, LiveTranscriptionEvents } from "@deepgram/sdk";

const SpeechComponent = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState<string>("");
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  // const [connection, setConnection] = useState<LiveClient | null>(null); // Replaced by useRef
  const connectionRef = useRef<LiveClient | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const microphoneInitialized = useRef(false);

  useEffect(() => {
    fetch("/api/deepgram-key")
      .then((res) => res.json())
      .then((data) => {
        if (data.apiKey) {
          console.log("API Key fetched successfully.");
          setApiKey(data.apiKey);
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

  const setupMicrophone = async () => {
    console.log("Attempting to setup microphone...");
    if (microphoneInitialized.current) {
      console.log("Microphone already initialized or setup in progress.");
      return;
    }
    microphoneInitialized.current = true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Microphone stream acquired.");
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      console.log("MediaRecorder created with mimeType: audio/webm;codecs=opus");

      recorder.ondataavailable = (event) => {
        console.log("MediaRecorder ondataavailable event fired.");
        if (event.data.size > 0) {
          console.log(`Audio data available: ${event.data.size} bytes`);
          if (connectionRef.current && connectionRef.current.getReadyState() === 1 /* OPEN */) {
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
      console.log("MediaRecorder set in state.");
    } catch (error) {
      console.error("Error accessing or setting up microphone:", error);
      alert("Error accessing microphone. Please ensure permission is granted and try again. Check console for details.");
      microphoneInitialized.current = false; // Allow retry
    }
  };


  const connectToDeepgram = async () => {
    console.log("Attempting to connect to Deepgram...");
    if (!apiKey) {
      console.error("API Key not available. Cannot connect to Deepgram.");
      alert("API Key not available. Cannot connect to Deepgram.");
      return;
    }

    if (!mediaRecorder) {
      console.log("MediaRecorder not available, attempting to set it up before connecting to Deepgram.");
      await setupMicrophone();
      if (!mediaRecorder) {
        console.error("Microphone setup failed or still not available. Cannot connect to Deepgram.");
        alert("Microphone not available. Cannot connect to Deepgram.");
        return;
      }
      console.log("Microphone setup complete, proceeding with Deepgram connection.");
    }

    console.log("Creating Deepgram client...");
    const deepgram = createClient(apiKey);
    console.log("Deepgram client created. Establishing live connection...");
    const liveConnection = deepgram.listen.live({
      model: "nova-3",
      interim_results: true,
      smart_format: true,
      filler_words: true, // Added from original app
      utterance_end_ms: 3000, // Added from original app
      // channels: 1, // Removed, as original app doesn't specify it
      // encoding: "opus", // Kept removed, SDK should handle
      // sample_rate: 48000, // Kept removed, SDK should handle
    });

    liveConnection.on(LiveTranscriptionEvents.Open, () => {
      console.log("Deepgram connection OPENED successfully.");
      connectionRef.current = liveConnection;
      // setConnection(liveConnection); // Replaced by useRef
      if (mediaRecorder?.state === "inactive") {
        console.log("MediaRecorder is inactive, starting it now with 250ms timeslice.");
        mediaRecorder?.start(250);
      } else {
        console.warn(`MediaRecorder state is: ${mediaRecorder?.state}. Not starting explicitly.`);
      }
      setIsListening(true);
    });

    liveConnection.on(LiveTranscriptionEvents.Transcript, (data) => {
      console.log("Deepgram Transcript received:", JSON.stringify(data, null, 2));
      const text = data.channel.alternatives[0].transcript;

      if (data.is_final && text.trim()) {
        console.log(`Final transcript text: "${text}"`);
        setFinalTranscript((prev) => prev + text + " ");
        setInterimTranscript(""); // Clear interim when final arrives
      } else if (!data.is_final && text.trim()) {
        console.log(`Interim transcript text: "${text}"`);
        setInterimTranscript(text);
      } else {
        // Potentially clear interim if text is empty but not final, or handle as needed
        if (!data.is_final && text === "") {
            // This can happen if Deepgram sends an empty interim result before speech_final
            // setInterimTranscript(""); // Optionally clear if you want interim to disappear on silence
        }
        console.log("Received transcript data, but no significant text found or it's an empty final.");
      }
    });

    liveConnection.on(LiveTranscriptionEvents.Close, (event) => {
      console.log("Deepgram connection CLOSED.", event);
      setIsListening(false);
      connectionRef.current = null;
      // setConnection(null); // Replaced by useRef
      if (mediaRecorder?.state === "recording") {
        console.log("Deepgram connection closed, stopping MediaRecorder.");
        mediaRecorder.stop();
      }
    });

    liveConnection.on(LiveTranscriptionEvents.Error, (error) => {
      console.error("Deepgram connection ERROR:", error);
      setIsListening(false);
      // Optionally, try to reconnect or alert the user
    });

    liveConnection.on(LiveTranscriptionEvents.Metadata, (metadata) => {
      console.log("Deepgram connection METADATA:", metadata);
    });


    // Keep alive for the connection
    const keepAliveInterval = setInterval(() => {
      if (connectionRef.current && connectionRef.current.getReadyState() === 1 /* OPEN */) {
        // console.log("Sending keepAlive to Deepgram."); // Can be noisy
        connectionRef.current.keepAlive();
      } else {
        // console.log("Clearing keepAlive interval as connection is not open."); // Can be noisy
        clearInterval(keepAliveInterval);
      }
    }, 10000);


    return () => {
      console.log("Cleanup function for connectToDeepgram called.");
      clearInterval(keepAliveInterval);
      if (connectionRef.current) {
        console.log("Finishing Deepgram live connection via connectionRef.");
        connectionRef.current.finish();
        connectionRef.current = null;
      }
      if (mediaRecorder?.stream) {
        console.log("Stopping all media tracks.");
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }
    };
  };

  const toggleListening = async () => {
    console.log(`toggleListening called. isListening: ${isListening}`);
    if (!apiKey) {
      console.error("toggleListening: Deepgram API Key is not configured.");
      alert("Deepgram API Key is not configured. Please check server logs or .env.local setup.");
      return;
    }

    if (!mediaRecorder && !microphoneInitialized.current) {
      console.log("toggleListening: Microphone not ready and not initialized, calling setupMicrophone.");
      await setupMicrophone();
    }


    if (isListening && connectionRef.current) {
      console.log("toggleListening: Currently listening, attempting to stop via connectionRef.");
      connectionRef.current.finish(); // This will trigger the Close event and cleanup
    } else if (mediaRecorder) {
      console.log("toggleListening: Not listening, mediaRecorder available, attempting to start.");
      await connectToDeepgram();
    } else {
      console.error("toggleListening: Microphone not ready even after setup attempt.");
      alert("Microphone not ready. Please ensure permissions are granted and try refreshing.");
    }
  };

  return (
    <div>
      <button onClick={toggleListening} disabled={!apiKey}>
        {isListening ? "Stop Listening" : "Start Listening"}
      </button>
      <p>Status: {isListening ? "Listening..." : "Not Listening"}</p>
      {apiKey ? <p style={{color: "green"}}>API Key Loaded</p> : <p style={{color: "red"}}>API Key NOT Loaded - Check .env.local and server console.</p>}
      <h3>Transcript:</h3>
      <p>
        {finalTranscript}
        <span style={{ color: "gray" }}>{interimTranscript}</span>
      </p>
    </div>
  );
};

export default SpeechComponent;