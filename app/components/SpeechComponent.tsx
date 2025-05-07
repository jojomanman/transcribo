"use client";

import { useState, useEffect, useRef } from "react";
import { createClient, LiveClient, LiveTranscriptionEvents } from "@deepgram/sdk";

const SpeechComponent = () => {
  // State for the Deepgram API key
  const [apiKey, setApiKey] = useState<string | null>(null);
  // State to track if the component is actively listening and transcribing
  const [isListening, setIsListening] = useState(false);
  // State to store the accumulated final transcript
  const [finalTranscript, setFinalTranscript] = useState<string>("");
  // State to store the current interim (non-final) transcript
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  // Ref to hold the Deepgram LiveClient instance
  // Using useRef to ensure the ondataavailable callback for MediaRecorder
  // has a stable reference to the current connection object.
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

  /**
   * Sets up the microphone for audio capture.
   * Requests user permission for microphone access.
   * Initializes MediaRecorder with 'audio/webm;codecs=opus' mime type.
   * Sets up an event listener for 'dataavailable' to send audio chunks to Deepgram.
   */
  const setupMicrophone = async () => {
    console.log("Attempting to setup microphone...");
    // Prevent multiple setup attempts if already initialized or in progress
    if (microphoneInitialized.current) {
      console.log("Microphone already initialized or setup in progress.");
      return;
    }
    microphoneInitialized.current = true;

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Microphone stream acquired.");

      // Create MediaRecorder instance
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      console.log("MediaRecorder created with mimeType: audio/webm;codecs=opus");

      // Event handler for when audio data is available
      recorder.ondataavailable = (event) => {
        console.log("MediaRecorder ondataavailable event fired.");
        if (event.data.size > 0) {
          console.log(`Audio data available: ${event.data.size} bytes`);
          // Send audio data to Deepgram if connection is open
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

      // Store the MediaRecorder instance in state
      setMediaRecorder(recorder);
      console.log("MediaRecorder set in state.");
    } catch (error) {
      console.error("Error accessing or setting up microphone:", error);
      alert("Error accessing microphone. Please ensure permission is granted and try again. Check console for details.");
      microphoneInitialized.current = false; // Allow retry if setup failed
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
      console.log("MediaRecorder not available, attempting to set it up before connecting to Deepgram.");
      await setupMicrophone();
      if (!mediaRecorder) { // Check again if setupMicrophone failed
        console.error("Microphone setup failed or still not available. Cannot connect to Deepgram.");
        alert("Microphone not available. Cannot connect to Deepgram.");
        return;
      }
      console.log("Microphone setup complete, proceeding with Deepgram connection.");
    }

    console.log("Creating Deepgram client...");
    const deepgram = createClient(apiKey);
    console.log("Deepgram client created. Establishing live connection...");

    // Define Deepgram connection options (aligned with the original, more complex app)
    const liveConnectionOptions = {
      model: "nova-3",
      interim_results: true,
      smart_format: true,
      filler_words: true,
      utterance_end_ms: 3000,
    };
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
    liveConnection.on(LiveTranscriptionEvents.Transcript, (data) => {
      console.log("Deepgram Transcript received:", JSON.stringify(data, null, 2));
      const text = data.channel.alternatives[0].transcript;

      // Handle final and interim transcripts separately
      if (data.is_final && text.trim()) {
        console.log(`Final transcript text: "${text}"`);
        setFinalTranscript((prev) => prev + text + " "); // Append to final transcript
        setInterimTranscript(""); // Clear interim transcript
      } else if (!data.is_final && text.trim()) {
        console.log(`Interim transcript text: "${text}"`);
        setInterimTranscript(text); // Update interim transcript
      } else {
        if (!data.is_final && text === "") {
            // This can occur if Deepgram sends an empty interim result, e.g., before speech_final.
            // Optionally, clear interimTranscript if it should disappear on silence:
            // setInterimTranscript("");
        }
        console.log("Received transcript data, but no significant text found or it's an empty final.");
      }
    });

    // Event listener for when the Deepgram connection closes
    liveConnection.on(LiveTranscriptionEvents.Close, (event) => {
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
    liveConnection.on(LiveTranscriptionEvents.Error, (error) => {
      console.error("Deepgram connection ERROR:", error);
      setIsListening(false);
      // Consider adding logic here to attempt reconnection or notify the user more gracefully.
    });

    // Event listener for Deepgram metadata
    liveConnection.on(LiveTranscriptionEvents.Metadata, (metadata) => {
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
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
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

    // Setup microphone if not already done
    if (!mediaRecorder && !microphoneInitialized.current) {
      console.log("toggleListening: Microphone not ready and not initialized, calling setupMicrophone.");
      await setupMicrophone();
    }

    // Start or stop listening based on current state
    if (isListening && connectionRef.current) {
      console.log("toggleListening: Currently listening, attempting to stop via connectionRef.");
      connectionRef.current.finish(); // This will trigger the Close event and associated cleanup
    } else if (mediaRecorder) { // Only attempt to connect if MediaRecorder is available
      console.log("toggleListening: Not listening, mediaRecorder available, attempting to start.");
      await connectToDeepgram();
    } else {
      console.error("toggleListening: Microphone not ready even after setup attempt.");
      alert("Microphone not ready. Please ensure permissions are granted and try refreshing.");
    }
  };

  // Render the UI
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