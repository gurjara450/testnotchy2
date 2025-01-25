"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { FileText, Hash, Sparkles, Book, Brain, MessageSquare, ListChecks, Lightbulb } from "lucide-react";

export function PlaceholdersAndVanishInput({
  placeholders,
  onChange,
  onSubmit,
  disabled = false,
  sources = [],
}: {
  placeholders: string[];
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  disabled?: boolean;
  sources?: Array<{ name: string; key: string; content?: string }>;
}) {
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const [value, setValue] = useState("");
  const [animating, setAnimating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionType, setSuggestionType] = useState<'sources' | 'content' | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ type: string; text: string; icon?: JSX.Element; description?: string }>>([]);
  const [showFloatingPrompts, setShowFloatingPrompts] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const newDataRef = useRef<Array<{
    x: number;
    y: number;
    r: number;
    color: string;
  }>>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const startAnimation = () => {
    intervalRef.current = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
    }, 3000);
  };
  const handleVisibilityChange = () => {
    if (document.visibilityState !== "visible" && intervalRef.current) {
      clearInterval(intervalRef.current); // Clear the interval when the tab is not visible
      intervalRef.current = null;
    } else if (document.visibilityState === "visible") {
      startAnimation(); // Restart the interval when the tab becomes visible
    }
  };

  useEffect(() => {
    startAnimation();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [placeholders]);

  const draw = useCallback(() => {
    if (!inputRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 800;
    ctx.clearRect(0, 0, 800, 800);
    const computedStyles = getComputedStyle(inputRef.current);

    const fontSize = parseFloat(computedStyles.getPropertyValue("font-size"));
    ctx.font = `${fontSize * 2}px ${computedStyles.fontFamily}`;
    ctx.fillStyle = "#FFF";
    ctx.fillText(value, 16, 40);

    const imageData = ctx.getImageData(0, 0, 800, 800);
    const pixelData = imageData.data;
    const newData: Array<{
      x: number;
      y: number;
      color: [number, number, number, number];
    }> = [];

    for (let t = 0; t < 800; t++) {
      const i = 4 * t * 800;
      for (let n = 0; n < 800; n++) {
        const e = i + 4 * n;
        if (
          pixelData[e] !== 0 &&
          pixelData[e + 1] !== 0 &&
          pixelData[e + 2] !== 0
        ) {
          newData.push({
            x: n,
            y: t,
            color: [
              pixelData[e],
              pixelData[e + 1],
              pixelData[e + 2],
              pixelData[e + 3],
            ],
          });
        }
      }
    }

    newDataRef.current = newData.map(({ x, y, color }) => ({
      x,
      y,
      r: 1,
      color: `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`,
    }));
  }, [value]);

  useEffect(() => {
    draw();
  }, [value, draw]);

  const animate = (start: number) => {
    const animateFrame = (pos: number = 0) => {
      requestAnimationFrame(() => {
        const newArr = [];
        for (let i = 0; i < newDataRef.current.length; i++) {
          const current = newDataRef.current[i];
          if (current.x < pos) {
            newArr.push(current);
          } else {
            if (current.r <= 0) {
              current.r = 0;
              continue;
            }
            current.x += Math.random() > 0.5 ? 1 : -1;
            current.y += Math.random() > 0.5 ? 1 : -1;
            current.r -= 0.05 * Math.random();
            newArr.push(current);
          }
        }
        newDataRef.current = newArr;
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) {
          ctx.clearRect(pos, 0, 800, 800);
          newDataRef.current.forEach((t) => {
            const { x: n, y: i, r: s, color: color } = t;
            if (n > pos) {
              ctx.beginPath();
              ctx.rect(n, i, s, s);
              ctx.fillStyle = color;
              ctx.strokeStyle = color;
              ctx.stroke();
            }
          });
        }
        if (newDataRef.current.length > 0) {
          animateFrame(pos - 8);
        } else {
          setValue("");
          setAnimating(false);
        }
      });
    };
    animateFrame(start);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !animating) {
      if (showSuggestions && suggestions.length > 0) {
        e.preventDefault();
        handleSuggestionSelect(suggestions[0].text);
      } else {
        vanishAndSubmit();
      }
    } else if (e.key === "@") {
      setSuggestionType('sources');
      setShowSuggestions(true);
    } else if (e.key === "/") {
      setSuggestionType('content');
      setShowSuggestions(true);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    } else if (showSuggestions && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      // Handle suggestion navigation
    }
  };

  const getContextualCommands = useCallback(() => {
    const baseCommands = [
      { 
        type: 'command', 
        text: 'summarize', 
        icon: <Sparkles className="h-4 w-4 text-purple-400" />,
        description: 'Get a concise summary of the content'
      },
      { 
        type: 'command', 
        text: 'explain', 
        icon: <Brain className="h-4 w-4 text-blue-400" />,
        description: 'Get a detailed explanation'
      },
      { 
        type: 'command', 
        text: 'quiz', 
        icon: <ListChecks className="h-4 w-4 text-green-400" />,
        description: 'Generate practice questions'
      }
    ];

    const contextualCommands = [
      { 
        type: 'prompt', 
        text: 'key concepts', 
        icon: <Lightbulb className="h-4 w-4 text-yellow-400" />,
        description: 'Extract main ideas and concepts'
      },
      { 
        type: 'prompt', 
        text: 'compare with', 
        icon: <MessageSquare className="h-4 w-4 text-indigo-400" />,
        description: 'Compare with another source'
      },
      { 
        type: 'prompt', 
        text: 'study guide', 
        icon: <Book className="h-4 w-4 text-orange-400" />,
        description: 'Create a comprehensive study guide'
      }
    ];

    // Add contextual commands based on content type or selected sources
    if (sources.some(s => s.content?.toLowerCase().includes('math') || s.name.toLowerCase().includes('math'))) {
      contextualCommands.push({
        type: 'prompt',
        text: 'solve step by step',
        icon: <Hash className="h-4 w-4 text-pink-400" />,
        description: 'Get step-by-step problem solving'
      });
    }

    return [...baseCommands, ...contextualCommands];
  }, [sources]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!animating) {
      const newValue = e.target.value;
      setValue(newValue);
      onChange?.(e);

      // Check for triggers and update suggestions
      const lastWord = newValue.split(" ").pop() || "";
      
      if (lastWord.startsWith("@")) {
        setSuggestionType('sources');
        const searchTerm = lastWord.slice(1).toLowerCase();
        const sourceMatches = sources
          .filter(source => source.name.toLowerCase().includes(searchTerm))
          .map(source => ({
            type: 'source',
            text: source.name,
            icon: <FileText className="h-4 w-4 text-gray-400" />,
            description: `Reference ${source.name}`
          }));
        setSuggestions(sourceMatches);
        setShowSuggestions(sourceMatches.length > 0);
      } else if (lastWord.startsWith("/")) {
        setSuggestionType('content');
        const commands = getContextualCommands();
        const searchTerm = lastWord.slice(1).toLowerCase();
        const commandMatches = commands.filter(cmd => 
          cmd.text.toLowerCase().includes(searchTerm) || 
          cmd.description?.toLowerCase().includes(searchTerm)
        );
        setSuggestions(commandMatches);
        setShowSuggestions(commandMatches.length > 0);
      } else {
        setShowSuggestions(false);
      }
    }
  };

  const handleSuggestionSelect = (text: string) => {
    if (inputRef.current) {
      const words = value.split(" ");
      words[words.length - 1] = suggestionType === 'sources' ? `@${text} ` : `/${text} `;
      const newValue = words.join(" ");
      setValue(newValue);
      inputRef.current.focus();
      setShowSuggestions(false);
      
      // Create a new input event
      const event = new Event('input', { bubbles: true }) as unknown as React.ChangeEvent<HTMLInputElement>;
      Object.defineProperty(event, 'target', { value: { value: newValue } });
      onChange?.(event);
    }
  };

  const vanishAndSubmit = () => {
    setAnimating(true);
    draw();

    const value = inputRef.current?.value || "";
    if (value && inputRef.current) {
      const maxX = newDataRef.current.reduce(
        (prev, current) => (current.x > prev ? current.x : prev),
        0
      );
      animate(maxX);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    vanishAndSubmit();
    onSubmit?.(e);
  };

  const handleFocus = () => {
    if (sources.length > 0) {
      setShowSuggestions(true);
    }
    setShowFloatingPrompts(true);
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Check if the new focus target is within the suggestions
    if (suggestionsRef.current && !suggestionsRef.current.contains(e.relatedTarget as Node)) {
      setShowSuggestions(false);
      setShowFloatingPrompts(false);
    }
  };

  useEffect(() => {
    // Hide floating prompts when there's input
    if (value) {
      setShowFloatingPrompts(false);
    } else {
      setShowFloatingPrompts(true);
    }
  }, [value]);

  const FloatingPrompts = () => {
    const prompts = [
      { icon: <Sparkles className="h-3 w-3" />, text: "Summarize", command: "/summarize" },
      { icon: <Brain className="h-3 w-3" />, text: "Explain", command: "/explain" },
      { icon: <ListChecks className="h-3 w-3" />, text: "Quiz", command: "/quiz" },
      { icon: <Book className="h-3 w-3" />, text: "Study Guide", command: "/study guide" },
    ];

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="absolute -top-10 left-0 right-0 flex items-center justify-center gap-2"
      >
        {prompts.map((prompt) => (
          <motion.button
            key={prompt.command}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (inputRef.current) {
                const newValue = prompt.command + " ";
                setValue(newValue);
                inputRef.current.focus();
                const event = new Event('input', { bubbles: true }) as unknown as React.ChangeEvent<HTMLInputElement>;
                Object.defineProperty(event, 'target', { value: { value: newValue } });
                onChange?.(event);
              }
            }}
            className={cn(
              "px-2.5 h-7 text-xs flex items-center gap-1.5 rounded-full",
              "bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm",
              "border border-purple-100/20 dark:border-purple-900/20",
              "text-gray-600 dark:text-gray-300",
              "hover:bg-purple-50/50 dark:hover:bg-gray-800/50",
              "transition-all duration-200",
              "shadow-[0_2px_3px_-1px_rgba(0,0,0,0.1),0_1px_0px_0px_rgba(25,28,33,0.02),0_0px_0px_1px_rgba(25,28,33,0.08)]"
            )}
          >
            {prompt.icon}
            {prompt.text}
          </motion.button>
        ))}
      </motion.div>
    );
  };

  return (
    <div className="relative w-full max-w-xl mx-auto">
      {/* Floating Prompts */}
      <AnimatePresence>
        {showFloatingPrompts && !value && !disabled && (
          <FloatingPrompts />
        )}
      </AnimatePresence>

      {/* Suggestions Panel */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full mb-2 w-full bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {suggestionType === 'sources' ? 'SOURCES' : 'COMMANDS & PROMPTS'}
              </div>
            </div>
            <div className="p-1 max-h-[200px] overflow-y-auto">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.text}
                  className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md text-sm text-gray-700 dark:text-gray-300 transition-colors"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSuggestionSelect(suggestion.text);
                  }}
                >
                  {suggestion.icon}
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="truncate text-left w-full">{suggestion.text}</span>
                    {suggestion.description && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate w-full">
                        {suggestion.description}
                      </span>
                    )}
                  </div>
                  <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-1.5 font-mono text-[10px] font-medium text-gray-400 dark:text-gray-500">
                    {suggestionType === 'sources' ? '@' : '/'}
                  </kbd>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form
        className={cn(
          "w-full relative max-w-xl mx-auto bg-white dark:bg-zinc-800 h-12 rounded-full overflow-hidden shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),_0px_1px_0px_0px_rgba(25,28,33,0.02),_0px_0px_0px_1px_rgba(25,28,33,0.08)] transition duration-200",
          value && "bg-gray-50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onSubmit={handleSubmit}
      >
        <canvas
          className={cn(
            "absolute pointer-events-none text-base transform scale-50 top-[20%] left-2 sm:left-8 origin-top-left filter invert dark:invert-0 pr-20",
            !animating ? "opacity-0" : "opacity-100"
          )}
          ref={canvasRef}
        />
        <input
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          ref={inputRef}
          value={value}
          type="text"
          disabled={disabled}
          className={cn(
            "w-full relative text-sm sm:text-base z-50 border-none dark:text-white bg-transparent text-black h-full rounded-full focus:outline-none focus:ring-0 pl-4 sm:pl-10 pr-20",
            animating && "text-transparent dark:text-transparent",
            disabled && "cursor-not-allowed"
          )}
        />

        <button
          disabled={!value}
          type="submit"
          className="absolute right-2 top-1/2 z-50 -translate-y-1/2 h-8 w-8 rounded-full disabled:bg-gray-100 bg-black dark:bg-zinc-900 dark:disabled:bg-zinc-800 transition duration-200 flex items-center justify-center"
        >
          <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-300 h-4 w-4"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <motion.path
              d="M5 12l14 0"
              initial={{
                strokeDasharray: "50%",
                strokeDashoffset: "50%",
              }}
              animate={{
                strokeDashoffset: value ? 0 : "50%",
              }}
              transition={{
                duration: 0.3,
                ease: "linear",
              }}
            />
            <path d="M13 18l6 -6" />
            <path d="M13 6l6 6" />
          </motion.svg>
        </button>

        <div className="absolute inset-0 flex items-center rounded-full pointer-events-none">
          <AnimatePresence mode="wait">
            {!value && (
              <motion.p
                initial={{
                  y: 5,
                  opacity: 0,
                }}
                key={`current-placeholder-${currentPlaceholder}`}
                animate={{
                  y: 0,
                  opacity: 1,
                }}
                exit={{
                  y: -15,
                  opacity: 0,
                }}
                transition={{
                  duration: 0.3,
                  ease: "linear",
                }}
                className="dark:text-gray-400 text-sm sm:text-base font-normal text-gray-500/80 pl-4 sm:pl-12 text-left w-[calc(100%-2rem)] truncate"
              >
                {placeholders[currentPlaceholder]}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </form>
    </div>
  );
}
