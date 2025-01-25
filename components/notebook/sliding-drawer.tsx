// components/notebook/sliding-drawer.tsx

"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, BookmarkPlus, Check, 
  MessageSquare, Sparkles, BrainCircuit,
  Loader2, FileText, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
import { useChat } from "ai/react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { Tooltip } from "@nextui-org/react";
import { GeistSans } from 'geist/font/sans';
import { TextShimmerWave } from '@/components/ui/text-shimmer-wave';
import { Select, SelectItem, Selection } from "@nextui-org/react";
import Image from "next/image";

type MessageRole = "user" | "assistant" | "function" | "data" | "system" | "tool";

interface MessageBubbleProps {
  message: {
    id: string;
    role: MessageRole;
    content: string;
  };
  onAddToNotes?: (content: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({ message, onAddToNotes }) => {
  const isUser = message.role === "user";
  const [isHovered, setIsHovered] = React.useState(false);
  const [isAdded, setIsAdded] = React.useState(false);
  const { toast } = useToast();

  const handleAddToNotes = () => {
    if (onAddToNotes) {
      onAddToNotes(message.content);
      setIsAdded(true);
      toast({
        title: "Added to Notes",
        description: "The AI response has been added to your notes.",
        duration: 2000,
      });
      
      setTimeout(() => {
        setIsAdded(false);
      }, 2000);
    }
  };

  const getBubbleStyles = () => {
    switch (message.role) {
      case "user":
        return "bg-blue-500/10 dark:bg-blue-400/20 text-blue-700 dark:text-blue-100 border border-blue-200 dark:border-blue-800";
      case "assistant":
        return "bg-gradient-to-br from-purple-500/5 via-indigo-500/5 to-blue-500/5 dark:from-purple-400/10 dark:via-indigo-400/10 dark:to-blue-400/10 text-gray-800 dark:text-gray-100 shadow-sm border border-purple-100 dark:border-purple-900";
      default:
        return "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100";
    }
  };

  const bubbleVariants = {
    initial: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    animate: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20
      }
    }
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={bubbleVariants}
      className={cn("flex", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "flex flex-col space-y-2 max-w-[85%] relative group",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "px-4 py-3 rounded-2xl backdrop-blur-sm",
            getBubbleStyles(),
            "text-base leading-relaxed",
            isUser ? "rounded-br-md" : "rounded-bl-md",
            "group/message relative",
            GeistSans.className,
            !isUser && "hover:cursor-pointer hover:bg-gradient-to-br hover:from-purple-500/10 hover:via-indigo-500/10 hover:to-blue-500/10 dark:hover:from-purple-400/20 dark:hover:via-indigo-400/20 dark:hover:to-blue-400/20 transition-all duration-200"
          )}
          onClick={() => !isUser && handleAddToNotes()}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <span className="whitespace-pre-wrap">{message.content}</span>
          {!isUser && isHovered && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 flex items-center gap-2"
            >
              {isAdded ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-500">Added to notes</span>
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Save to notes</span>
                </>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

MessageBubble.displayName = 'MessageBubble';

interface SlidingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  addNote: (noteContent: string) => void;
  fileKeys?: string[];
  sources?: { name: string; key: string }[];
  selectedSources?: { name: string; key: string }[];
  onSourceSelect?: (source: { name: string; key: string }) => void;
}

const TextShimmerWaveColor: React.FC = () => (
  <TextShimmerWave
    className='[--base-color:#0D74CE] [--base-gradient-color:#5EB1EF] dark:[--base-color:#5EB1EF] dark:[--base-gradient-color:#0D74CE]'
    duration={1}
    spread={1}
    zDistance={1}
    scaleDistance={1.1}
    rotateYDistance={20}
  >
    AI is thinking...
  </TextShimmerWave>
);

const showErrorToast = (title: string, message: string, icon = <AlertCircle />) => {
  toast.custom((t) => (
    <div
      className={cn(
        "fixed top-4 right-4 flex items-center gap-4 px-6 py-4 max-w-md",
        "rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)]",
        "bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl",
        "border border-purple-100/20 dark:border-purple-900/20",
        "transform transition-all duration-300",
        "animate-[slide-in-right_0.4s_ease-out]",
        t.visible 
          ? "opacity-100 translate-x-0" 
          : "opacity-0 translate-x-full"
      )}
      style={{
        animation: t.visible 
          ? 'slide-in-right 0.4s ease-out, bounce 0.5s ease-out 0.4s' 
          : 'slide-out-right 0.3s ease-in'
      }}
    >
      <div className="relative group">
        <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-violet-500/30 via-purple-500/30 to-indigo-500/30 blur-md opacity-75 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-indigo-500/10 border border-purple-200/20 dark:border-purple-800/20">
          {React.cloneElement(icon as React.ReactElement, {
            className: "w-5 h-5 text-purple-600 dark:text-purple-400"
          })}
        </div>
      </div>
      <div className="flex flex-col gap-0.5">
        <h3 className="font-semibold bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {message}
        </p>
      </div>
      <button 
        onClick={() => toast.dismiss(t.id)}
        className="ml-auto p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
      >
        <X className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:scale-110 transition-transform duration-200" />
      </button>
    </div>
  ), {
    duration: 4000,
    position: 'top-right',
  });
};

export const SlidingDrawer: React.FC<SlidingDrawerProps> = ({
  isOpen,
  onClose,
  addNote,
  fileKeys = [],
  sources = [],
  selectedSources = [],
  onSourceSelect,
}): JSX.Element => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [activeMode, setActiveMode] = useState<'chat' | 'study' | 'explain'>('chat');
  const [uniquePrefix] = useState(() => Date.now());

  // Helper function for scrolling that targets Radix ScrollArea viewport
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      // Find the Radix ScrollArea viewport
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        (viewport as HTMLElement).style.scrollBehavior = 'auto';
        (viewport as HTMLElement).scrollTop = viewport.scrollHeight;
      }
    }
  };

  const { messages: chatMessages, handleInputChange, handleSubmit, setInput, input, isLoading } = useChat({
    api: '/api/chat',
    body: {
      fileKeys,
      mode: activeMode,
    },
    id: fileKeys.join(','),
    onError: (error) => {
      toast.error(error.message || 'An error occurred while sending message');
    }
  });

  const placeholders = {
    chat: [
      "Ask me anything about the PDF...",
      "What would you like to know?",
      "How can I help you understand this better?",
    ],
    study: [
      "Generate practice questions...",
      "Create a study guide for...",
      "Help me memorize...",
    ],
    explain: [
      "Explain this concept in simpler terms...",
      "Break down this topic...",
      "Help me understand...",
    ]
  };

  const handleModeChange = (newMode: 'chat' | 'study' | 'explain') => {
    setActiveMode(newMode);
    setInput('');
  };

  const modes = [
    {
      id: 'chat',
      icon: <MessageSquare className="h-4 w-4" />,
      label: 'Chat',
      description: 'Have a conversation about the PDF content'
    },
    {
      id: 'study',
      icon: <BrainCircuit className="h-4 w-4" />,
      label: 'Study',
      description: 'Active learning and comprehension'
    },
    {
      id: 'explain',
      icon: <Sparkles className="h-4 w-4" />,
      label: 'Explain',
      description: 'Get detailed explanations'
    }
  ];

  // Scroll when messages change or loading state changes
  useEffect(() => {
    if (chatMessages.length > 0 || isLoading) {
      scrollToBottom();
    }
  }, [chatMessages, isLoading]);

  // Scroll when drawer opens
  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    if (!fileKeys.length) {
      showErrorToast(
        "No PDF Selected",
        "Please upload or select a PDF file to continue",
        <FileText />
      );
      return;
    }

    try {
      scrollToBottom(); // Scroll before sending
      await handleSubmit(e);
      scrollToBottom(); // Scroll after sending
    } catch (error) {
      console.error('Error sending message:', error);
      showErrorToast(
        "Message Failed",
        "Unable to send your message. Please try again.",
        <MessageSquare />
      );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="drawer-container"
          className={cn("relative z-[100]", GeistSans.className)}
          style={{ isolation: 'isolate' }}
        >
          <motion.div
            key="drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-[90]"
            onClick={onClose}
            style={{ willChange: 'opacity' }}
          />
          <motion.div
            key="drawer-content"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 1,
            }}
            className={cn(
              "fixed inset-x-0 bottom-0 h-[85vh] max-h-full flex flex-col",
              "bg-gradient-to-b from-white/90 to-white/80 dark:from-gray-950/90 dark:to-gray-950/80",
              "backdrop-blur-xl border-t border-white/20 dark:border-gray-800/20",
              "shadow-[0_-8px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.3)]",
              "rounded-t-[2.5rem] z-[100]",
              GeistSans.className
            )}
            style={{ 
              willChange: 'transform',
              transform: 'translate3d(0,0,0)',
              backfaceVisibility: 'hidden'
            }}
          >
            <div className="flex flex-col border-b border-white/10 dark:border-gray-800/10">
              <div className="relative flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <motion.div
                      key="header-icon-bg"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.3 }}
                      className="absolute -inset-1 rounded-xl bg-gradient-to-r from-violet-500/40 via-purple-500/40 to-indigo-500/40 blur-sm"
                    />
                    <Image 
                      src="/feather.png"
                      alt="Swotify Logo"
                      width={30}
                      height={30}
                      className="relative w-5 h-5 object-contain"
                    />
                  </div>
                  <motion.h2 
                    key="header-title"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.2 }}
                    className="font-semibold bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent text-base"
                  >
                    Swotify
                  </motion.h2>
                </div>

                <div className="flex items-center gap-3">
                  {/* Modes */}
                  <div className="flex gap-1">
                    {modes.map((mode) => (
                      <Tooltip
                        key={mode.id}
                        content={mode.description}
                        placement="bottom"
                        showArrow
                        className="text-sm"
                        delay={0}
                      >
                        <Button
                          variant={activeMode === mode.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleModeChange(mode.id as 'chat' | 'study' | 'explain')}
                          className={cn(
                            "flex items-center gap-1 h-8 px-2.5 transition-all duration-200 rounded-lg",
                            activeMode === mode.id
                              ? "bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 hover:from-violet-600 hover:via-purple-600 hover:to-indigo-600 text-white shadow-lg"
                              : "hover:bg-purple-50 dark:hover:bg-gray-800 border-white/20 dark:border-gray-800/20"
                          )}
                        >
                          {mode.icon}
                          <span className="text-xs font-medium">{mode.label}</span>
                        </Button>
                      </Tooltip>
                    ))}
                  </div>

                  {/* Source selector */}
                  <div className="flex items-center gap-2">
                    <Select
                      className="w-[200px] min-h-unit-8"
                      placeholder="Select sources"
                      selectionMode="multiple"
                      selectedKeys={new Set(selectedSources.map(s => s.key))}
                      onSelectionChange={(keys: Selection) => {
                        const selectedKeys = Array.from(keys as Set<string>);
                        // Find which sources were selected and deselected
                        const currentSelectedKeys = selectedSources.map(s => s.key);
                        const addedKeys = selectedKeys.filter(key => !currentSelectedKeys.includes(key));
                        const removedKeys = currentSelectedKeys.filter(key => !selectedKeys.includes(key));

                        if (addedKeys.length > 0) {
                          // Handle new selection
                          const newSource = sources.find(source => source.key === addedKeys[0]);
                          if (newSource) {
                            onSourceSelect?.(newSource);
                          }
                        } else if (removedKeys.length > 0) {
                          // Handle deselection
                          const removedSource = sources.find(source => source.key === removedKeys[0]);
                          if (removedSource) {
                            onSourceSelect?.(removedSource);
                          }
                        }
                      }}
                      size="sm"
                      classNames={{
                        base: "min-h-unit-8",
                        trigger: "h-8 min-h-unit-8 px-2 py-1 text-xs bg-white/50 dark:bg-gray-900/50 border-gray-200/20 dark:border-gray-800/20",
                        value: "text-xs",
                        listboxWrapper: "bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl",
                        popoverContent: "bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-gray-200/20 dark:border-gray-800/20"
                      }}
                      startContent={
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Sources</span>
                          <div className={cn(
                            "px-1.5 py-0.5 rounded-full text-xs font-medium",
                            selectedSources.length > 0
                              ? "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                          )}>
                            {selectedSources.length}
                          </div>
                        </div>
                      }
                    >
                      {sources.map((source) => (
                        <SelectItem 
                          key={source.key}
                          value={source.key}
                          className="text-xs"
                        >
                          {source.name}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="h-8 w-8 hover:bg-white/10 dark:hover:bg-gray-800/10 hover:scale-110 transition-transform duration-200 rounded-lg"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <ScrollArea 
              className="flex-grow px-4 py-6 overflow-hidden"
              ref={scrollAreaRef}
              data-scroll-container
              scrollHideDelay={0}
              style={{
                transform: 'translate3d(0,0,0)',
                backfaceVisibility: 'hidden',
                willChange: 'scroll-position'
              }}
            >
              <div 
                className="space-y-6"
                style={{ 
                  transform: 'translate3d(0,0,0)',
                  backfaceVisibility: 'hidden'
                }}
              >
                {chatMessages.map((message, index) => (
                  <MessageBubble 
                    key={`message-${message.id || `${uniquePrefix}-${index}`}`}
                    message={{
                      id: message.id || `${uniquePrefix}-${index}`,
                      role: message.role,
                      content: message.content
                    }}
                    onAddToNotes={addNote} 
                  />
                ))}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10 dark:from-purple-400/20 dark:to-blue-400/20 border border-purple-100 dark:border-purple-900">
                        <Loader2 className="w-4 h-4 text-purple-600 dark:text-purple-300 animate-spin" />
                      </div>
                      <TextShimmerWaveColor />
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-white/10 dark:border-gray-800/10 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm">
              <PlaceholdersAndVanishInput
                placeholders={placeholders[activeMode]}
                onChange={(e) => {
                  handleInputChange(e);
                  setInput(e.target.value);
                }}
                onSubmit={onSubmit}
                disabled={isLoading}
                sources={sources}
              />
            </div>

            <style jsx global>{`
              [data-radix-scroll-area-viewport] {
                scrollbar-width: thin !important;
                -ms-overflow-style: -ms-autohiding-scrollbar !important;
                -webkit-overflow-scrolling: touch !important;
                overscroll-behavior-y: contain !important;
                scroll-behavior: auto !important;
                will-change: scroll-position !important;
                transform: translate3d(0,0,0) !important;
                backface-visibility: hidden !important;
                pointer-events: auto !important;
                touch-action: pan-y pinch-zoom !important;
              }

              [data-radix-scroll-area-viewport]::-webkit-scrollbar {
                width: 4px !important;
              }

              [data-radix-scroll-area-viewport]::-webkit-scrollbar-track {
                background: transparent !important;
              }

              [data-radix-scroll-area-viewport]::-webkit-scrollbar-thumb {
                background-color: rgba(0,0,0,.2) !important;
                border-radius: 6px !important;
                border: none !important;
              }

              .dark [data-radix-scroll-area-viewport]::-webkit-scrollbar-thumb {
                background-color: rgba(255,255,255,.2) !important;
              }

              [data-radix-scroll-area-viewport] > div {
                transform: translate3d(0,0,0) !important;
                backface-visibility: hidden !important;
                will-change: transform !important;
                contain: content !important;
              }

              .scroll-view-wrapper {
                position: relative !important;
                transform: translate3d(0,0,0) !important;
                backface-visibility: hidden !important;
                will-change: transform !important;
                contain: content !important;
              }

              * {
                -webkit-tap-highlight-color: transparent;
              }
            `}</style>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};