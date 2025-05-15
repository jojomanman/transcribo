"use client";

import { FC } from "react";
import { Mic, MicOff, Settings2, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useSpeechRecognition, WordConfidence, transcriptionOptions, UserMessageType } from "@/hooks/useSpeechRecognition";

interface SpeechComponentProps {
  isDesktopView?: boolean; // Optional: defaults to false (mobile-first)
}

const SpeechComponent: FC<SpeechComponentProps> = ({ isDesktopView = false }) => {
  const {
    apiKeyStatus,
    isListening,
    finalWords,
    interimWords,
    selectedOptionKey,
    setSelectedOptionKey,
    enableDiarization,
    setEnableDiarization,
    userMessage,
    // setUserMessage, // If direct message setting from component is needed
    toggleListening,
    transcriptContainerRef,
  } = useSpeechRecognition();

  const getConfidenceColorClasses = (confidence: number): string => {
    if (confidence > 0.9) return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200";
    if (confidence > 0.7) return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200";
    if (confidence > 0.5) return "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200";
    return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200";
  };

  const renderTranscript = () => (
    <div
      ref={transcriptContainerRef}
      className={`p-3 border rounded-md bg-muted/30 dark:bg-muted/50 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed scroll-smooth ${isDesktopView ? 'h-[calc(100vh-300px)] min-h-[300px]' : 'flex-grow mb-4'}`} // Adjusted height for desktop
    >
      {finalWords.length === 0 && interimWords.length === 0 && (
        <p className="text-muted-foreground italic">
          {apiKeyStatus === 'loading' && "Initializing..."}
          {apiKeyStatus === 'not_configured' && "API Key not configured. Check setup."}
          {apiKeyStatus === 'error' && "Error loading API Key. Check console."}
          {apiKeyStatus === 'loaded' && (isListening ? "Listening for speech..." : "Press Mic to begin.")}
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
  );

  const renderMobileControls = () => (
    <>
      {/* Mobile specific controls (diarization toggle above fixed bar) */}
      <div className="mb-4 px-1 space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="diarization-toggle-mobile" className="text-sm font-medium">
            Enable Speaker Diarization
          </Label>
          <Switch
            id="diarization-toggle-mobile"
            checked={enableDiarization}
            onCheckedChange={setEnableDiarization}
            disabled={isListening || apiKeyStatus !== 'loaded'}
          />
        </div>
      </div>

      {/* Fixed Bottom Action Bar for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-3 shadow-md flex items-center justify-between space-x-3">
        <div className="flex-grow-[2] min-w-0">
          <Select
            value={selectedOptionKey}
            onValueChange={setSelectedOptionKey}
            disabled={isListening || apiKeyStatus !== 'loaded'}
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
        <Button
          onClick={toggleListening}
          disabled={apiKeyStatus !== 'loaded'}
          className="flex-grow-[1] min-w-[80px] h-10 transition-all duration-150 ease-in-out"
          variant={isListening ? "destructive" : "default"}
          size="lg"
        >
          {isListening ? <MicOff className="h-5 w-5 sm:mr-2" /> : <Mic className="h-5 w-5 sm:mr-2" />}
          <span className="hidden sm:inline">{isListening ? "Stop" : "Record"}</span>
        </Button>
      </div>
    </>
  );

  const renderDesktopControls = () => (
    // These controls are now part of DesktopLayout.tsx's structure,
    // SpeechComponent on desktop is primarily for the transcript display.
    // However, if DesktopLayout passes down control elements, they could be rendered here.
    // For now, assuming DesktopLayout handles its own control section.
    // If SpeechComponent *itself* needs to render controls differently for desktop,
    // that logic would go here.
    // The current DesktopLayout.tsx has placeholders for these.
    // This component will just render the transcript for desktop.
    // The actual controls (Select, Switch, Button) will be in DesktopLayout.tsx
    // and will use the same useSpeechRecognition hook instance if passed down or via context.
    // For simplicity, let's assume DesktopLayout will instantiate its own controls
    // and this component is mainly for the transcript.
    // If we want SpeechComponent to render controls for desktop, it would be like this:
    <Card className="shadow-lg dark:shadow-primary/10 mt-6">
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
                    disabled={isListening || apiKeyStatus !== 'loaded'}
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
                    disabled={isListening || apiKeyStatus !== 'loaded'}
                />
            </div>
            <p className="text-sm text-muted-foreground">
                Status: {apiKeyStatus === 'loaded' ? (isListening ? "Listening..." : "Not Listening") : `API Key: ${apiKeyStatus}`}
            </p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row items-center justify-end pt-4 border-t">
            <Button
                onClick={toggleListening}
                disabled={apiKeyStatus !== 'loaded'}
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
  );


  return (
    <div className={`flex flex-col w-full ${isDesktopView ? 'h-full' : 'h-full max-w-2xl mx-auto'}`}>
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

      {renderTranscript()}

      {isDesktopView ? null : renderMobileControls()} 
      {/* Desktop controls are now part of DesktopLayout.tsx or rendered by SpeechComponent if isDesktopView is true and we decide to keep them here */}
      {/* For the distinct layout, DesktopLayout.tsx will manage its own control section. SpeechComponent will be used there for the transcript display. */}
      {/* If SpeechComponent needs to render its own desktop controls, then we'd call renderDesktopControls() here when isDesktopView is true. */}
      {/* The current DesktopLayout.tsx has placeholders for these controls. */}
      {/* Let's assume for now that DesktopLayout will handle the controls and SpeechComponent is just for transcript + mobile controls. */}
      {/* To make SpeechComponent also render desktop controls when isDesktopView is true: */}
      {/* {isDesktopView ? renderDesktopControls() : renderMobileControls()} */}
      {/* For now, the DesktopLayout will embed its own controls and use this component for the transcript. */}
      {/* So, if isDesktopView, the controls are handled by the parent (DesktopLayout) */}

    </div>
  );
};

export default SpeechComponent;