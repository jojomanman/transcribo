"use client"; // Required for hooks like useState and useEffect

import SpeechComponent from "@/app/components/SpeechComponent";
import DesktopLayout from "@/app/components/DesktopLayout"; // Import the new DesktopLayout
import { ThemeToggle } from "@/components/theme-toggle";
import { useDeviceDetection } from "@/hooks/useDeviceDetection"; // Import the hook

export default function HomePage() {
  const { isDesktop } = useDeviceDetection();

  // Handle loading state for device detection
  if (isDesktop === null) {
    // You might want to render a loader here or nothing to avoid layout shifts
    return null;
  }

  if (isDesktop) {
    return <DesktopLayout />;
  }

  // Mobile Layout (existing structure)
  return (
    <main className="flex flex-col items-center min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-8">
      <header className="w-full max-w-4xl flex justify-between items-center mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary">
          Transcribo
        </h1>
        <ThemeToggle />
      </header>

      <section className="w-full max-w-2xl flex-grow flex flex-col items-center pb-16 md:pb-0"> {/* Added padding for fixed mobile footer */}
        <SpeechComponent />
      </section>

      <footer className="w-full max-w-4xl text-center mt-8 sm:mt-12 py-4 text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Transcribo. All rights reserved.</p>
      </footer>
    </main>
  );
}