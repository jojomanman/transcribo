"use client";

import React from 'react';
import SpeechComponent from "@/app/components/SpeechComponent";
import { ThemeToggle } from "@/components/theme-toggle";
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
import { Mic, MicOff, AlertTriangle, CheckCircle2, Info, Settings2 } from "lucide-react"; // Added Settings2
import { useSpeechRecognition, transcriptionOptions } from "@/hooks/useSpeechRecognition";

export default function DesktopLayout() {
  const {
    apiKeyStatus,
    isListening,
    selectedOptionKey,
    setSelectedOptionKey,
    enableDiarization,
    setEnableDiarization,
    userMessage,
    toggleListening,
  } = useSpeechRecognition();

  return (
    <main className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900 dark:to-gray-800 text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            {/* <Mic className="h-7 w-7 text-primary mr-2" /> */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 text-primary mr-2">
              <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
              <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.041h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.041a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
            </svg>
            <h1 className="text-2xl font-bold text-primary tracking-tight">
              Transcribo
            </h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-grow container max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {userMessage && (
          <div className={`p-3 rounded-md text-sm flex items-center space-x-2 mb-4 shadow-md ${
            userMessage.type === 'error' ? 'bg-red-100 dark:bg-red-800/30 text-red-700 dark:text-red-200 border border-red-300 dark:border-red-700' :
            userMessage.type === 'success' ? 'bg-green-100 dark:bg-green-800/30 text-green-700 dark:text-green-200 border border-green-300 dark:border-green-700' :
            'bg-blue-100 dark:bg-blue-800/30 text-blue-700 dark:text-blue-200 border border-blue-300 dark:border-blue-700'
          }`}>
            {userMessage.type === 'error' && <AlertTriangle className="h-5 w-5 flex-shrink-0" />}
            {userMessage.type === 'success' && <CheckCircle2 className="h-5 w-5 flex-shrink-0" />}
            {userMessage.type === 'info' && <Info className="h-5 w-5 flex-shrink-0" />}
            <span>{userMessage.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8">
          {/* Left Sidebar: Controls */}
          <aside className="lg:col-span-1 space-y-6">
            <Card className="shadow-lg dark:shadow-primary/10">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center">
                  <Settings2 className="mr-2 h-5 w-5 text-primary" />
                  Controls & Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-4 pb-5">
                <div className="space-y-1.5">
                  <Label htmlFor="transcription-option-select-desktop" className="text-sm font-medium">
                    Model & Language
                  </Label>
                  <Select
                    value={selectedOptionKey}
                    onValueChange={setSelectedOptionKey}
                    disabled={isListening || apiKeyStatus !== 'loaded'}
                  >
                    <SelectTrigger id="transcription-option-select-desktop" className="w-full bg-background focus:ring-primary focus:border-primary">
                      <SelectValue placeholder="Select model..." />
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

                <div className="flex items-center justify-between pt-2">
                  <Label htmlFor="diarization-toggle-desktop" className="text-sm font-medium flex-1">
                    Speaker Diarization
                  </Label>
                  <Switch
                    id="diarization-toggle-desktop"
                    checked={enableDiarization}
                    onCheckedChange={setEnableDiarization}
                    disabled={isListening || apiKeyStatus !== 'loaded'}
                  />
                </div>
                 <p className="text-xs text-muted-foreground pt-1">
                    Status: {apiKeyStatus === 'loading' && "Initializing API Key..."}
                    {apiKeyStatus === 'not_configured' && "API Key Not Configured."}
                    {apiKeyStatus === 'error' && "API Key Error."}
                    {apiKeyStatus === 'loaded' && (isListening ? "Listening actively..." : "Ready to listen.")}
                </p>
              </CardContent>
              <CardFooter className="border-t pt-5">
                <Button
                  onClick={toggleListening}
                  disabled={apiKeyStatus !== 'loaded'}
                  className="w-full transition-all duration-150 ease-in-out group"
                  variant={isListening ? "destructive" : "default"}
                  size="lg"
                >
                  {isListening ? (
                    <MicOff className="mr-2 h-5 w-5 animate-pulse group-hover:animate-none" />
                  ) : (
                    <Mic className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  )}
                  {isListening ? "Stop Listening" : "Start Listening"}
                </Button>
              </CardFooter>
            </Card>
            <Card className="shadow-lg dark:shadow-primary/10">
                <CardHeader>
                    <CardTitle className="text-lg font-medium">Session Info</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-1">
                    <p>Selected Model: <span className="font-semibold text-foreground">{transcriptionOptions.find(o => o.key === selectedOptionKey)?.label || 'N/A'}</span></p>
                    <p>Diarization: <span className="font-semibold text-foreground">{enableDiarization ? "Enabled" : "Disabled"}</span></p>
                </CardContent>
            </Card>
          </aside>

          {/* Right Main Area: Transcription */}
          <section className="lg:col-span-2">
            <Card className="shadow-xl dark:shadow-primary/15 h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Live Transcript</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow p-0"> {/* Remove padding here, SpeechComponent will handle it */}
                {/* SpeechComponent will manage its own height and scrolling */}
                <SpeechComponent isDesktopView={true} />
              </CardContent>
               <CardFooter className="border-t pt-3 pb-3 text-xs text-muted-foreground">
                <p>Words are colored by confidence. Green (High) to Red (Low).</p>
              </CardFooter>
            </Card>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-background/80">
        <div className="container max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Transcribo. Professional Desktop Experience.</p>
        </div>
      </footer>
    </main>
  );
}