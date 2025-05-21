import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function highlightChanges (originalText: string, fixedText: string): React.ReactNode[] {
  const originalWords = originalText.split(/\s+/).filter(Boolean); // filter Boolean to remove empty strings
  const fixedWords = fixedText.split(/\s+/).filter(Boolean);
  const highlightedNodes: React.ReactNode[] = [];

  // This is a simplified diff algorithm, more sophisticated ones like Myers diff could be used for complex cases.
  // This version will highlight words in fixedText that are not exact matches in sequence to originalWords.

  let fixedIdx = 0;
  let originalIdx = 0;

  while (fixedIdx < fixedWords.length) {
    const fixedWord = fixedWords[fixedIdx];
    const originalWord = originalWords[originalIdx];

    if (originalWord === fixedWord) {
      highlightedNodes.push(<span key={`word-orig-${fixedIdx}`}>{fixedWord} </span>);
      fixedIdx++;
      originalIdx++;
    } else {
      // Try to find the current fixedWord in the next few words of the original text (simple lookahead)
      let foundMatchAhead = false;
      for (let lookAhead = 1; lookAhead <= 3 && originalIdx + lookAhead < originalWords.length; lookAhead++) {
        if (originalWords[originalIdx + lookAhead] === fixedWord) {
          // Words in original that were skipped (considered deleted)
          for (let i = 0; i < lookAhead; i++) {
            // Optionally, represent deleted words, but for this highlighting, we just skip them
          }
          highlightedNodes.push(<span key={`word-match-${fixedIdx}`}>{fixedWord} </span>);
          originalIdx += lookAhead + 1;
          fixedIdx++;
          foundMatchAhead = true;
          break;
        }
      }

      if (!foundMatchAhead) {
        // If no match found ahead, or if originalWord is undefined (end of original text)
        // then the fixedWord is considered new or changed.
        highlightedNodes.push(
          <span key={`word-changed-${fixedIdx}`} className="font-bold text-primary">{fixedWord} </span>
        );
        fixedIdx++;
        // If originalWord is not the same and we didn't find a match ahead,
        // we might increment originalIdx if we want to consider the original word as "replaced".
        // For a simple highlight-additions/changes approach, we might only advance originalIdx when matches occur.
        // However, to prevent getting stuck, if fixedWord is different, we should advance originalIdx.
        if (originalWord) {
            originalIdx++;
        }
      }
    }
  }
  return highlightedNodes;
}
