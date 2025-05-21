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
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSpeechRecognition, WordConfidence, transcriptionOptions, UserMessageType } from "@/hooks/useSpeechRecognition";

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
  } = useSpeechRecognition();

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
      <div className="flex items-center justify-between space-x-2 h-full">
        {/* Left side: Model Select and Diarization Checkbox (stacked) */}
        <div className="flex flex-col space-y-1 flex-grow-[3] min-w-0"> {/* Changed to flex-col and space-y-1 */}
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

  return (
    <div className={`flex flex-col w-full ${isDesktopView ? 'h-full' : 'h-full'}`}> {/* Mobile: h-full, flex flex-col */}
      {userMessage && (
        <div className={`p-3 rounded-md text-sm flex items-center space-x-2 mb-2 mx-2 ${
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
      <div className={` ${isDesktopView ? '' : 'flex-grow overflow-hidden pb-16'}`}>
        {renderTranscript()}
      </div>

      {!isDesktopView && renderMobileControls()}
      {/* The mobile controls bar is fixed, so its height (h-14 / 56px) is implicitly handled by its fixed positioning.
          The main content area above needs to allow space for it.
          The MobileLayout in page.tsx should ensure this SpeechComponent has a full height context to work within,
          and the pb-14 on MobileLayout's main content div will prevent overlap.
      */}
    </div>
  );
};

export default SpeechComponent;