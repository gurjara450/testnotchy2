"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export const TextGenerateEffect = ({
  words,
  className,
}: {
  words: string;
  className?: string;
}) => {
  const scope = useRef<HTMLDivElement>(null);
  const [currentText, setCurrentText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!isGenerating) return;
    
    let currentIndex = 0;
    const interval = setInterval(() => {
      const currentElement = scope.current;
      if (!currentElement) return;

      if (currentIndex <= words.length) {
        setCurrentText(words.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
        setIsGenerating(false);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [isGenerating, words]);

  return (
    <div ref={scope} className={cn("font-bold", className)}>
      <div className="mt-4">
        <button
          onClick={() => setIsGenerating(!isGenerating)}
          className="border border-neutral-200 dark:border-neutral-800 rounded-lg px-4 py-2"
        >
          {isGenerating ? "Pause" : "Generate"}
        </button>
      </div>
      <div className="my-6">
        {currentText || "Click generate to start the effect"}
      </div>
    </div>
  );
};
