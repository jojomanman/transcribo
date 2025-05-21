"use client";

import { FC, CSSProperties, RefObject } from "react"; // Added RefObject
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
import { Checkbox } from "@/components/ui/checkbox";
import { FC, CSSProperties, RefObject, useEffect } from "react"; // Removed useState, added useEffect
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
import { Checkbox } from "@/components/ui/checkbox";
// Removed: import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSpeechRecognition, WordConfidence, transcriptionOptions, UserMessageType } from "@/hooks/useSpeechRecognition";
// Removed: import { fetchFixedTranscript } from "@/lib/gemini";
import { highlightChanges } from "@/lib/utils"; // Import highlightChanges

interface SpeechComponentProps {
  isDesktopView?: boolean;
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
    toggleListening,
    transcriptContainerRef,
    handleCopyToClipboard, // Added from hook
    copyStatusMessage,
    // AI Text Fix states and functions from hook
    aiPrompt,
    setAiPrompt,
    fixedTranscript,
    isFixingText,
    aiFixError,
    handleFixTranscript,
    // finalWords is already destructured above
  } = useSpeechRecognition();

  // Removed local AI states: aiPrompt, fixedTranscript, isFixingText, aiFixError, geminiApiKey
  // Removed local useEffect for fetching Gemini API key
  // Removed local handleCopyToClipboard (already done)
  //   if (finalWords.length === 0) {
  //     setCopySuccessMessage("Nothing to copy.");
  //     setTimeout(() => setCopySuccessMessage(null), 3000);
  //     return;
  //   }
  //
  //   const transcriptText = finalWords.map(word => word.text).join(" ");
  //   try {
  //     await navigator.clipboard.writeText(transcriptText);
  //     setCopySuccessMessage("Transcript copied to clipboard!");
  //   } catch (err) {
  //     console.error("Failed to copy text: ", err);
  //     setCopySuccessMessage("Failed to copy transcript.");
  //   } finally {
  //     setTimeout(() => setCopySuccessMessage(null), 3000);
  //   }
  // };

  const getConfidenceStyle = (confidence: number): CSSProperties => {
    const hue = confidence * 120; // 0 (red) to 120 (green)
    return {
      backgroundColor: `hsla(${hue}, 90%, 70%, 0.5)`,
      padding: '1px 4px',
      borderRadius: '3px',
      display: 'inline',
    };
  };

  const renderTranscriptWords = (words: WordConfidence[], isInterim: boolean) => {
    let lastSpeaker: number | undefined = undefined;
    const currentFinalSpeaker = !isInterim && finalWords.length > 0 ? finalWords[finalWords.length -1].speaker : undefined;

    return words.map((word, index) => {
      const showSpeakerLabel = enableDiarization && word.speaker !== undefined && word.speaker !== lastSpeaker && (isInterim && index === 0 ? word.speaker !== currentFinalSpeaker : true);
      if (word.speaker !== undefined) {
        lastSpeaker = word.speaker;
      }
      return (
        <span key={`${isInterim ? 'interim' : 'final'}-${index}`}>
          {showSpeakerLabel && (
            <strong className={`block mt-1.5 mb-0.5 text-xs font-semibold ${isInterim ? 'text-muted-foreground/70 dark:text-muted-foreground/50' : 'text-primary dark:text-primary-foreground/80'}`}>
              Speaker {word.speaker}:
            </strong>
          )}
          <span style={getConfidenceStyle(word.confidence)} className={isInterim ? 'opacity-70' : ''}>
            {word.text}{' '}
          </span>
        </span>
      );
    });
  };

  const renderTranscript = () => (
    <ScrollArea
      className={`whitespace-pre-wrap text-sm leading-relaxed scroll-smooth
                  ${isDesktopView ? 'h-[calc(100vh-300px)] min-h-[300px] border rounded-md bg-muted/30 dark:bg-muted/50'
                                 : 'h-full'}`}
    >
      <div
        ref={transcriptContainerRef as RefObject<HTMLDivElement>} // Cast for clarity with ScrollArea's child
        className={`p-3 ${isDesktopView ? '' : ''}`}
      >
        {finalWords.length === 0 && interimWords.length === 0 && (
          <p className="text-muted-foreground italic">
            {apiKeyStatus === 'loading' && "Initializing..."}
            {apiKeyStatus === 'not_configured' && "API Key not configured. Check setup."}
            {apiKeyStatus === 'error' && "Error loading API Key. Check console."}
            {apiKeyStatus === 'loaded' && (isListening ? "Listening for speech..." : "Press Mic to begin.")}
          </p>
        )}
        {renderTranscriptWords(finalWords, false)}
        {renderTranscriptWords(interimWords, true)}
      </div>
    </ScrollArea>
  );

  const renderMobileControls = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-background/80 dark:bg-background/80 backdrop-blur-sm border-t border-border/60 p-2 shadow-lg rounded-t-xl h-auto min-h-14"> {/* Opacity 80%, h-auto for content, min-h-14 */}
      {copyStatusMessage && ( // Changed from copySuccessMessage to copyStatusMessage
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-auto whitespace-nowrap">
          <div className="bg-foreground text-background text-xs font-semibold px-3 py-1.5 rounded-md shadow-md">
            {copyStatusMessage}
          </div>
        </div>
      )}
      <div className="flex items-center justify-between space-x-2 h-full">
        {/* Left side: Model Select and Diarization Checkbox (stacked) */}
        <div className="flex flex-col space-y-1 flex-grow-[2] min-w-0"> {/* Adjusted flex-grow */}
          <div className="w-full"> {/* Ensure Select takes full width of its column part */}
            <Select
              value={selectedOptionKey}
              onValueChange={setSelectedOptionKey}
              disabled={isListening || apiKeyStatus !== 'loaded'}
            >
              <SelectTrigger id="transcription-option-select-mobile" className="w-full bg-background text-xs h-9 truncate">
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
          <div className="flex items-center space-x-1.5 self-start pt-0.5"> {/* Moved diarization under, self-start for alignment */}
            <Checkbox
              id="diarization-toggle-mobile"
              checked={enableDiarization}
              onCheckedChange={(checked) => setEnableDiarization(Boolean(checked))}
              disabled={isListening || apiKeyStatus !== 'loaded'}
            />
            <Label htmlFor="diarization-toggle-mobile" className="text-xs text-muted-foreground cursor-pointer">
              Enable Speaker Diarization
            </Label>
          </div>
        </div>

        {/* Middle: Copy Button */}
        <div className="flex-grow-[1] min-w-[70px] flex items-center justify-center">
          <Button
            onClick={handleCopyToClipboard} // This is now the function from the hook
            disabled={finalWords.length === 0 && interimWords.length === 0} // finalWords is from the hook
            variant="outline"
            size="icon"
            className="h-9 w-full max-w-[100px] aspect-square p-0"
          >
            <CheckCircle2 className="h-5 w-5" /> {/* Placeholder icon, replace if a copy icon is available */}
            <span className="sr-only">Copy Transcript</span>
          </Button>
        </div>

        {/* Right side: Mic Button (aligned to center of the potentially taller left column) */}
        <div className="flex-grow-[1] min-w-[70px] flex items-center justify-end"> {/* Added items-center for vertical alignment */}
          <Button
            onClick={toggleListening}
            disabled={apiKeyStatus !== 'loaded'}
            className="h-9 w-full max-w-[100px] transition-all duration-150 ease-in-out aspect-square p-0"
            variant={isListening ? "destructive" : "default"}
            size="icon"
          >
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            <span className="sr-only">{isListening ? "Stop Listening" : "Start Listening"}</span>
          </Button>
        </div>
      </div>
    </div>
  );

  const renderAiFixSection = () => {
    // AI Fix section is now only rendered for mobile view in this component
    if (isDesktopView || (finalWords.length === 0 && !isDesktopView)) {
      return null;
    }

    // Note: `aiPrompt`, `setAiPrompt`, `fixedTranscript`, `isFixingText`, `aiFixError`, `handleFixTranscript`
    // and `finalWords` are now all from the useSpeechRecognition hook.

    return (
      <div className="p-3 mb-16"> {/* Ensure margin-bottom for mobile to avoid overlap with controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI Transcript Correction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="ai-prompt-mobile" className="text-sm font-medium">
                AI Fixing Prompt:
              </Label>
              <Textarea
                id="ai-prompt-mobile"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g., Fix grammar and clarity, ensure a professional tone."
                className="mt-1"
                rows={3}
                disabled={isFixingText}
              />
            </div>
            <Button
              onClick={handleFixTranscript} // From hook
              disabled={isFixingText || finalWords.length === 0} // finalWords from hook
              className="w-full"
            >
              {isFixingText ? "Processing with AI..." : "Fix Transcript with AI"}
            </Button>
            {isFixingText && (
              <div className="text-center p-2 text-sm text-muted-foreground">Processing, please wait...</div>
            )}
            {aiFixError && (
              <div className="text-center p-2 text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded-md">
                Error: {aiFixError}
              </div>
            )}
            {fixedTranscript && !isFixingText && !aiFixError && (
              <div className="p-3 border rounded-md bg-muted/50 dark:bg-muted/70 whitespace-pre-wrap text-sm">
                <Label className="font-semibold mb-1 block">Corrected Transcript:</Label>
                {/* highlightChanges is now imported from lib/utils */}
                {highlightChanges(finalWords.map(w => w.text).join(" "), fixedTranscript)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // Removed the local highlightChanges function. It's now imported from lib/utils.

  return (
    <div className={`flex flex-col w-full ${isDesktopView ? 'h-full' : 'h-full'}`}> {/* Mobile: h-full, flex flex-col */}
      {userMessage && (
        <div className={`p-3 rounded-md text-sm flex items-center space-x-2 mb-2 ${isDesktopView ? 'mx-0' : 'mx-2'} ${
          userMessage.type === 'error' ? 'bg-red-100 dark:bg-red-900/70 text-red-700 dark:text-red-200' :
          userMessage.type === 'success' ? 'bg-green-100 dark:bg-green-900/70 text-green-700 dark:text-green-200' :
          'bg-blue-100 dark:bg-blue-900/70 text-blue-700 dark:text-blue-200'
        }`}>
          {userMessage.type === 'error' && <AlertTriangle className="h-5 w-5" />}
          {userMessage.type === 'success' && <CheckCircle2 className="h-5 w-5" />}
          {userMessage.type === 'info' && <Info className="h-5 w-5" />}
          <span>{userMessage.text}</span>
        </div>
      )}

      {/* Wrapper for transcript area to make it grow */}
      <div className={` ${isDesktopView ? '' : 'flex-grow overflow-hidden pb-2'}`}> {/* Added pb-2 for mobile */}
        {renderTranscript()}
      </div>

      {/* AI Fix Section - Only rendered for mobile view by this component */}
      {!isDesktopView && (
        <div className="px-2">{renderAiFixSection()}</div>
      )}
      {/* Note: renderMobileControls() is called separately and is not affected by isDesktopView here */}
      {!isDesktopView && renderMobileControls()}
      {/* The mobile controls bar is fixed, so its height (h-14 / 56px) is implicitly handled by its fixed positioning.
          The main content area above needs to allow space for it.
          The MobileLayout in page.tsx should ensure this SpeechComponent has a full height context to work within,
          and the pb-14 on MobileLayout's main content div will prevent overlap with fixed mobile controls.
          The AI fix section in mobile might need `pb` on its container if it's directly above the fixed controls.
      */}
    </div>
  );
};

export default SpeechComponent;