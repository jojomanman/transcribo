import SpeechComponent from "@/app/components/SpeechComponent";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main>
      <h1>Minimal Speech to Text</h1>
      <SpeechComponent />
      <Button>Click me</Button>
    </main>
  );
}