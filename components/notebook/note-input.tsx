'use client';

import React from 'react';
import { 
  PenLine, Loader, BookOpen, FlipHorizontal, Network, Play, Pause, RotateCcw, 
  CheckCircle2, XCircle, Sparkles, GraduationCap, AlertCircle, FileText, 
  Mic, MicOff, X 
} from "lucide-react";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { FloatingPanel } from "./floatingpanel";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import ShimmerButton from "@/components/magicui/shimmer-button";
import { cn } from "@/lib/utils";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Button,
  Spinner,
} from "@nextui-org/react";
import MindMap from './mind-map';
import { useSubscription } from '@/hooks/use-subscription';
import { useRouter } from 'next/navigation';


interface MCQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface MCQResponse {
  questions: MCQuestion[];
}

interface Flashcard {
  front: string;
  back: string;
}

interface FlashcardResponse {
  flashcards: Flashcard[];
}

interface NoteInputProps {
  onAddNote: (note: string) => void;
  sourceFile?: {
    name: string;
    key: string;
  };
  userId: string;
  selectedSources?: { name: string; key: string }[];
}

// Add these animation variants
const iconAnimation = {
  hover: {
    scale: 1.2,
    rotate: 10,
    transition: {
      type: "spring",
      stiffness: 300,
    }
  },
  tap: {
    scale: 0.9
  }
};

const buttonAnimation = {
  hover: {
    scale: 1.05,
    transition: {
      type: "spring",
      stiffness: 400,
    }
  },
  tap: {
    scale: 0.95
  }
};

// Add new icon animations
const mcqIconAnimation = {
  hover: {
    scale: 1.2,
    rotate: [0, -10, 10, -10, 0],
    transition: {
      rotate: {
        duration: 0.5,
        ease: "easeInOut"
      },
      scale: {
        type: "spring",
        stiffness: 300
      }
    }
  },
  tap: { scale: 0.9 }
};

const flashcardIconAnimation = {
  hover: {
    scale: 1.2,
    rotateY: 180,
    transition: {
      duration: 0.6,
      type: "spring",
      stiffness: 200
    }
  },
  tap: { scale: 0.9 }
};

const mindmapIconAnimation = {
  hover: {
    scale: 1.2,
    rotate: 360,
    transition: {
      duration: 0.6,
      type: "spring",
      stiffness: 200
    }
  },
  tap: { scale: 0.9 }
};

const recordIconAnimation = {
  hover: {
    scale: [1, 1.2, 1],
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "easeInOut"
    }
  },
  tap: { scale: 0.9 }
};

// Add the showErrorToast function after the animations
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

// Add after showErrorToast function
const showSuccessToast = (message: string, icon = <CheckCircle2 />) => {
  toast.custom((t) => (
    <div
      className={cn(
        "fixed top-4 right-4 flex items-center gap-4 px-6 py-4 max-w-md",
        "rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)]",
        "bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl",
        "border border-emerald-100/20 dark:border-emerald-900/20",
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
        <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-emerald-500/30 via-green-500/30 to-teal-500/30 blur-md opacity-75 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10 border border-emerald-200/20 dark:border-emerald-800/20">
          {React.cloneElement(icon as React.ReactElement, {
            className: "w-5 h-5 text-emerald-600 dark:text-emerald-400"
          })}
        </div>
      </div>
      <div className="flex flex-col gap-0.5">
        <h3 className="font-semibold bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 bg-clip-text text-transparent">
          Success
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

const showLoadingToast = (message: string) => {
  return toast.custom((t) => (
    <div
      className={cn(
        "fixed top-4 right-4 flex items-center gap-4 px-6 py-4 max-w-md",
        "rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)]",
        "bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl",
        "border border-blue-100/20 dark:border-blue-900/20",
        "transform transition-all duration-300",
        "animate-[slide-in-right_0.4s_ease-out]",
        t.visible 
          ? "opacity-100 translate-x-0" 
          : "opacity-0 translate-x-full"
      )}
    >
      <div className="relative group">
        <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-blue-500/30 via-indigo-500/30 to-violet-500/30 blur-md opacity-75 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-violet-500/10 border border-blue-200/20 dark:border-blue-800/20">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
      <div className="flex flex-col gap-0.5">
        <h3 className="font-semibold bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 bg-clip-text text-transparent">
          Loading
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {message}
        </p>
      </div>
    </div>
  ), {
    duration: 100000,
    position: 'top-right',
  });
};

export function NoteInput({ onAddNote, sourceFile, userId, selectedSources = [] }: NoteInputProps) {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [mcqs, setMCQs] = useState<MCQResponse | null>(null);
  const [flashcards, setFlashcards] = useState<FlashcardResponse | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isGeneratingMCQs, setIsGeneratingMCQs] = useState(false);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});
  const [studyStats, setStudyStats] = useState({
    correct: 0,
    incorrect: 0,
    skipped: 0,
  });
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showFlashcardSaveDialog, setShowFlashcardSaveDialog] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const { canAccessPremium, canAccessPlus } = useSubscription();

  // Add keyboard event handler for textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        const form = textarea.closest('form');
        if (form) form.requestSubmit();
      }
    };

    textarea.addEventListener('keydown', handleKeyDown);
    return () => textarea.removeEventListener('keydown', handleKeyDown);
  }, []);

  // NextUI Modal controls
  const { 
    isOpen: isMCQOpen, 
    onOpen: onMCQOpen, 
    onClose: onMCQClose 
  } = useDisclosure();
  
  const { 
    isOpen: isFlashcardOpen, 
    onOpen: onFlashcardOpen, 
    onClose: onFlashcardClose 
  } = useDisclosure();
  
  const { 
    isOpen: isMindMapOpen, 
    onOpen: onMindMapOpen, 
    onClose: onMindMapClose 
  } = useDisclosure();

  const { 
    isOpen: isExamCreatorOpen, 
    onOpen: onExamCreatorOpen, 
    onClose: onExamCreatorClose 
  } = useDisclosure();

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => setTime((prev) => prev + 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const startTimer = () => setIsRunning(true);
  const pauseTimer = () => setIsRunning(false);
  const resetTimer = () => {
    setIsRunning(false);
    setTime(0);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const getScore = () => {
    if (!mcqs) return 0;
    return Object.entries(selectedAnswers).reduce((score, [index, answer]) => {
      const question = mcqs.questions[parseInt(index)];
      return score + (answer === question.correctAnswer ? 1 : 0);
    }, 0);
  };

  const handleCardAction = (action: 'correct' | 'incorrect' | 'skipped') => {
    setStudyStats(prev => ({
      ...prev,
      [action]: prev[action] + 1
    }));
    nextCard();
  };

  const nextCard = () => {
    if (flashcards && currentCardIndex < flashcards.flashcards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  };

  const previousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleNoteSubmit = (note: string) => {
    if (note.trim()) {
      onAddNote(note);
      showSuccessToast('Note added successfully!', <PenLine />);
    } else {
      showErrorToast(
        "Empty Note",
        "Please enter some content for your note",
        <PenLine />
      );
    }
  };

  const generateMCQs = async () => {
    if (selectedSources.length === 0) {
      showErrorToast(
        "No Source Selected",
        "Please select at least one file",
        <FileText />
      );
      return;
    }

    let loadingToastId;
    try {
      setIsGeneratingMCQs(true);
      setProgress(10);
      loadingToastId = showLoadingToast("Downloading and processing PDF...");

      const response = await fetch("/api/mcq", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileKeys: selectedSources.map(s => s.key),
        }),
      });

      setProgress(50);
      toast.dismiss(loadingToastId);
      loadingToastId = showLoadingToast("Generating questions...");

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate MCQs");
      }

      setProgress(80);

      if (!data.questions || !Array.isArray(data.questions) || data.questions.length !== 5) {
        throw new Error("Invalid response format from MCQ generation");
      }
      
      setProgress(100);
      setMCQs(data);
      setSelectedAnswers({});
      toast.dismiss(loadingToastId);
      showSuccessToast("MCQs generated successfully!", <BookOpen />);
    } catch (error) {
      console.error("Error generating MCQs:", error);
      if (loadingToastId) toast.dismiss(loadingToastId);
      showErrorToast(
        "Generation Failed",
        error instanceof Error ? error.message : "Failed to generate MCQs",
        <BookOpen />
      );
    } finally {
      setIsGeneratingMCQs(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const generateFlashcards = async () => {
    if (selectedSources.length === 0) {
      showErrorToast(
        "No Source Selected",
        "Please select at least one file",
        <FileText />
      );
      return;
    }

    let loadingToastId;
    try {
      setIsGeneratingFlashcards(true);
      setProgress(10);
      loadingToastId = showLoadingToast("Generating flashcards...");

      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileKeys: selectedSources.map(s => s.key),
          userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate flashcards");
      }

      setFlashcards({ flashcards: data });
      setCurrentCardIndex(0);
      setIsFlipped(false);
      toast.dismiss(loadingToastId);
      showSuccessToast("Flashcards generated successfully!", <FlipHorizontal />);
    } catch (error) {
      console.error("Error generating flashcards:", error);
      if (loadingToastId) toast.dismiss(loadingToastId);
      showErrorToast(
        "Generation Failed",
        error instanceof Error ? error.message : "Failed to generate flashcards",
        <FlipHorizontal />
      );
    } finally {
      setIsGeneratingFlashcards(false);
      setProgress(0);
    }
  };

  const saveAsNote = (format: 'interactive' | 'plain') => {
    if (!mcqs) return;
    
    if (format === 'interactive') {
      // Create a structured data object for the MCQs
      const mcqData = {
        type: "MCQ_NOTE",
        questions: mcqs.questions.map((q, i) => ({
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          userAnswer: selectedAnswers[i] || null
        })),
        score: {
          total: mcqs.questions.length,
          correct: getScore()
        }
      };
      
      const mcqsText = `---MCQ_NOTE_START---\n${JSON.stringify(mcqData, null, 2)}\n---MCQ_NOTE_END---`;
      onAddNote(mcqsText);
    } else {
      // Save as plain text format
      const mcqsText = `# MCQ Practice Results\n\n` +
        mcqs.questions.map((q, i) => {
          const score = selectedAnswers[i] === q.correctAnswer ? "✓" : "✗";
          return `Question ${i + 1}: ${q.question}\n\n` +
            `Options:\n${q.options.map(opt => `- ${opt}`).join('\n')}\n\n` +
            `Your Answer: ${selectedAnswers[i] || 'Not answered'} ${score}\n` +
            `Correct Answer: ${q.correctAnswer}\n\n` +
            `Explanation: ${q.explanation || 'No explanation provided'}\n`;
        }).join('\n---\n\n') +
        `\nFinal Score: ${getScore()}/${mcqs.questions.length}`;

      onAddNote(mcqsText);
    }
    
    setShowSaveDialog(false);
    showSuccessToast("MCQs saved as note!", <PenLine />);
  };

  const saveFlashcardsAsNote = (format: 'interactive' | 'plain') => {
    if (!flashcards) return;
    
    if (format === 'interactive') {
      // Create a structured data object for the flashcards
      const flashcardData = {
        type: "FLASHCARD_NOTE",
        flashcards: flashcards.flashcards.map(card => ({
          front: card.front,
          back: card.back
        })),
        stats: studyStats
      };
      
      const flashcardsText = `---FLASHCARD_NOTE_START---\n${JSON.stringify(flashcardData, null, 2)}\n---FLASHCARD_NOTE_END---`;
      onAddNote(flashcardsText);
    } else {
      // Save as plain text format
      const flashcardsText = `# Flashcards Study Session\n\n` +
        `Study Statistics:\n` +
        `- Correct: ${studyStats.correct}\n` +
        `- Incorrect: ${studyStats.incorrect}\n` +
        `- Skipped: ${studyStats.skipped}\n\n` +
        `## Cards\n\n` +
        flashcards.flashcards.map((card, i) => 
          `Card ${i + 1}:\nFront: ${card.front}\nBack: ${card.back}\n`
        ).join('\n---\n\n');

      onAddNote(flashcardsText);
    }
    
    setShowFlashcardSaveDialog(false);
    showSuccessToast("Flashcards saved as note!", <PenLine />);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const context = new AudioContext({ sampleRate: 16000 });
      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(4096, 1, 1);
      
      source.connect(processor);
      processor.connect(context.destination);

      const chunks: Blob[] = [];
      
      processor.onaudioprocess = async (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const audioBlob = new Blob([inputData], { type: 'audio/wav' });
        chunks.push(audioBlob);

        if (chunks.length >= 32) { // Send ~2 seconds of audio
          const audioData = await new Blob(chunks, { type: 'audio/wav' }).arrayBuffer();
          
          try {
            const response = await fetch('/api/realtime', {
              method: 'POST',
              body: audioData,
            });

            if (!response.ok) {
              throw new Error('API response was not ok');
            }

            const data = await response.json();
            if (data.text) {
              toast.success(data.text);
            }
          } catch (error) {
            console.error('Error sending audio:', error);
            showErrorToast(
              "Processing Error",
              "Error processing audio",
              <MicOff />
            );
          }

          chunks.length = 0; // Clear chunks after sending
        }
      };

      setAudioContext(context);
      setIsRecording(true);
      showSuccessToast('Started recording', <Mic />);
    } catch (error) {
      console.error('Error starting recording:', error);
      showErrorToast(
        "Microphone Error",
        "Error accessing microphone",
        <Mic />
      );
    }
  };

  const stopRecording = async () => {
    if (audioContext && audioContext.state !== 'closed') {
      try {
        await audioContext.close();
      } catch (error) {
        console.error('Error closing AudioContext:', error);
      }
    }
    setAudioContext(null);
    setIsRecording(false);
    showSuccessToast('Stopped recording', <MicOff />);
  };

  useEffect(() => {
    return () => {
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().catch(console.error);
      }
    };
  }, [audioContext]);

  // Example of feature gating
  const handleAIAssist = () => {
    if (!canAccessPremium()) {
      // Show upgrade modal or redirect to pricing
      router.push('/pricing');
      return;
    }
    // Handle AI feature for premium users
  };

  const handleAdvancedAI = () => {
    if (!canAccessPlus()) {
      // Show upgrade modal or redirect to pricing
      router.push('/pricing');
      return;
    }
    // Handle advanced AI feature for plus users
  };

  return (
    <div>
      <div className={`flex items-center space-x-4 antialiased ${GeistSans.className}`}>
        <FloatingPanel.Root>
          <motion.div whileHover="hover" whileTap="tap" variants={buttonAnimation}>
            <FloatingPanel.Trigger 
              title="Add Note" 
              className="flex items-center gap-2 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 group border border-gray-200 dark:border-gray-700"
            >
              <motion.div variants={iconAnimation} className="flex items-center justify-center w-6 h-6 bg-orange-600 rounded-md group-hover:bg-blue-600 transition-colors">
                <PenLine className="h-3.5 w-3.5 text-white" />
              </motion.div>
              <span className="font-medium">Add a note</span>
              <div className="ml-2 text-xs opacity-75 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                <span className={GeistMono.className}>{formatTime(time)}</span>
              </div>
            </FloatingPanel.Trigger>
          </motion.div>
          <FloatingPanel.Content className="w-[500px]">
            <FloatingPanel.Form onSubmit={handleNoteSubmit} className="p-4">
              <FloatingPanel.Label htmlFor="note-input" className="text-base font-medium mb-2 block dark:text-gray-200">
                Write your note
                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                  (Cmd/Ctrl + Enter to save)
                </span>
              </FloatingPanel.Label>
              <FloatingPanel.Textarea 
                id="note-input"
                className="min-h-[200px] p-3 text-base bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 dark:text-gray-100 resize-none outline-none transition-all duration-200 whitespace-pre-wrap break-words font-mono [spellcheck:false]"
              />
              <FloatingPanel.Footer className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
                  <div className={`text-sm font-mono tracking-wide text-gray-700 dark:text-gray-300 px-2 ${GeistMono.className}`}>
                    {formatTime(time)}
                  </div>
                  <div className="h-4 w-[1px] bg-gray-300 dark:bg-gray-600" />
                  <Button 
                    variant="bordered"
                    size="sm" 
                    onClick={isRunning ? pauseTimer : startTimer}
                    className="h-7 w-7 p-0 hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                  >
                    {isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  </Button>
                  <Button 
                    variant="bordered"
                    size="sm" 
                    onClick={resetTimer}
                    className="h-7 w-7 p-0 hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex space-x-2">
                  <FloatingPanel.CloseButton 
                    className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 transition-all duration-200" 
                  />
                  <FloatingPanel.SubmitButton 
                    className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-200" 
                  />
                </div>
              </FloatingPanel.Footer>
            </FloatingPanel.Form>
          </FloatingPanel.Content>
        </FloatingPanel.Root>

        <motion.div whileHover="hover" whileTap="tap" variants={buttonAnimation}>
          <ShimmerButton
            onClick={onExamCreatorOpen}
            background="var(--button-bg)"
            className={cn(
              "group relative flex items-center gap-2 px-4 py-2.5",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800",
              "border border-gray-200 dark:border-gray-800",
              "hover:bg-gray-50 dark:hover:bg-gray-900",
              "transition-colors duration-200",
              "[--button-bg:rgb(255,255,255)] dark:[--button-bg:rgb(0,0,0)]"
            )}
          >
            <motion.div variants={mcqIconAnimation} className="flex items-center justify-center w-6 h-6 bg-green-600 rounded-md">
              <GraduationCap className="h-3.5 w-3.5 text-white" />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-gray-900 dark:text-gray-100">Create & Take Exam</span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">AI-powered exam system</span>
            </div>
            <div className="flex items-center justify-center h-5 w-5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] font-medium">
              <span>+</span>
            </div>
          </ShimmerButton>
        </motion.div>

        <motion.div whileHover="hover" whileTap="tap" variants={buttonAnimation}>
          <ShimmerButton
            onClick={onMCQOpen}
            background="var(--button-bg)"
            className={cn(
              "group relative flex items-center gap-2 px-4 py-2.5",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800",
              "border border-gray-200 dark:border-gray-800",
              "hover:bg-gray-50 dark:hover:bg-gray-900",
              "transition-colors duration-200",
              "[--button-bg:rgb(255,255,255)] dark:[--button-bg:rgb(0,0,0)]"
            )}
            onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onMCQOpen();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Generate MCQs"
          >
            <motion.div variants={mcqIconAnimation} className="flex items-center justify-center w-6 h-6 bg-blue-600 rounded-md">
              <BookOpen className="h-3.5 w-3.5 text-white" />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                {isGeneratingMCQs ? "Generating..." : mcqs ? "Generated" : "Generate MCQs"}
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                {mcqs ? `${mcqs.questions.length} questions` : "Create quiz from content"}
              </span>
            </div>
            <div className={cn(
              "flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-medium transition-all duration-300",
              isGeneratingMCQs ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400" : 
              mcqs ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400" : 
              "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            )}>
              {isGeneratingMCQs ? (
                <div className="h-2.5 w-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : mcqs ? (
                <CheckCircle2 className="h-2.5 w-2.5" />
              ) : (
                <span>+</span>
              )}
            </div>
          </ShimmerButton>
        </motion.div>

        <motion.div whileHover="hover" whileTap="tap" variants={buttonAnimation}>
          <ShimmerButton
            onClick={onFlashcardOpen}
            background="var(--button-bg)"
            className={cn(
              "group relative flex items-center gap-2 px-4 py-2.5",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800",
              "border border-gray-200 dark:border-gray-800",
              "hover:bg-gray-50 dark:hover:bg-gray-900",
              "transition-colors duration-200",
              "[--button-bg:rgb(255,255,255)] dark:[--button-bg:rgb(0,0,0)]"
            )}
            onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onFlashcardOpen();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Generate Flashcards"
          >
            <motion.div variants={flashcardIconAnimation} className="flex items-center justify-center w-6 h-6 bg-pink-600 rounded-md">
              <FlipHorizontal className="h-3.5 w-3.5 text-white" />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                {isGeneratingFlashcards ? "Generating..." : flashcards ? "Generated" : "Generate Flashcards"}
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                {flashcards ? `${flashcards.flashcards.length} cards` : "Create study cards"}
              </span>
            </div>
            <div className={cn(
              "flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-medium transition-all duration-300",
              isGeneratingFlashcards ? "bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-400" : 
              flashcards ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400" : 
              "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            )}>
              {isGeneratingFlashcards ? (
                <div className="h-2.5 w-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : flashcards ? (
                <CheckCircle2 className="h-2.5 w-2.5" />
              ) : (
                <span>+</span>
              )}
            </div>
          </ShimmerButton>
        </motion.div>

        <motion.div whileHover="hover" whileTap="tap" variants={buttonAnimation}>
          <ShimmerButton
            onClick={onMindMapOpen}
            background="var(--button-bg)"
            className={cn(
              "group relative flex items-center gap-2 px-4 py-2.5",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800",
              "border border-gray-200 dark:border-gray-800",
              "hover:bg-gray-50 dark:hover:bg-gray-900",
              "transition-colors duration-200",
              "[--button-bg:rgb(255,255,255)] dark:[--button-bg:rgb(0,0,0)]"
            )}
            onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onMindMapOpen();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Open Mind Map"
          >
            <motion.div variants={mindmapIconAnimation} className="flex items-center justify-center w-6 h-6 bg-violet-600 rounded-md">
              <Network className="h-3.5 w-3.5 text-white" />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-gray-900 dark:text-gray-100">Mind Map</span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">Visualize connections</span>
            </div>
            <div className="flex items-center justify-center h-5 w-5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] font-medium">
              <span>+</span>
            </div>
          </ShimmerButton>
        </motion.div>

        <motion.div whileHover="hover" whileTap="tap" variants={buttonAnimation}>
          <ShimmerButton
            onClick={isRecording ? stopRecording : startRecording}
            background="var(--button-bg)"
            className={cn(
              "group relative flex items-center gap-2 px-4 py-2.5",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800",
              "border border-gray-200 dark:border-gray-800",
              "hover:bg-gray-50 dark:hover:bg-gray-900",
              "transition-colors duration-200",
              "[--button-bg:rgb(255,255,255)] dark:[--button-bg:rgb(0,0,0)]"
            )}
            onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (isRecording) {
                  stopRecording();
                } else {
                  startRecording();
                }
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={isRecording ? "Stop Recording" : "Start Voice Recording"}
          >
            <motion.div variants={recordIconAnimation} className="flex items-center justify-center w-6 h-6 bg-red-600 rounded-md">
              {isRecording ? (
                <div className="h-3.5 w-3.5 rounded-full bg-white animate-pulse" />
              ) : (
                <div className="h-3.5 w-3.5 rounded-full border-2 border-white" />
              )}
            </motion.div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                {isRecording ? "Recording..." : "Voice Chat"}
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                {isRecording ? "Click to stop" : "Click to start"}
              </span>
            </div>
            <div className={cn(
              "flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-medium transition-all duration-300",
              isRecording ? "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400" : 
              "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            )}>
              {isRecording ? (
                <div className="h-2.5 w-2.5 rounded-full bg-current animate-pulse" />
              ) : (
                <span>+</span>
              )}
            </div>
          </ShimmerButton>
        </motion.div>

        <Modal 
          isOpen={isMCQOpen} 
          onClose={onMCQClose}
          size="2xl"
          backdrop="blur"
        >
          <ModalContent>
            {(onClose: () => void) => (
              <>
                <ModalHeader className={`flex flex-col gap-1 ${GeistSans.className}`}>
                  Multiple Choice Questions
                </ModalHeader>
                <ModalBody className={GeistSans.className}>
                  {isGeneratingMCQs ? (
                    <div className="flex flex-col items-center gap-4 p-8">
                      <Loader className="h-8 w-8 animate-spin" />
                      <p>Generating MCQs...</p>
                      <Progress value={progress} className="w-full" />
                    </div>
                  ) : mcqs ? (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-medium">
                          {Object.keys(selectedAnswers).length > 0 && (
                            <span>
                              Score: {getScore()}/{mcqs.questions.length}
                            </span>
                          )}
                        </div>
                        <Button
                          onClick={() => setShowSaveDialog(true)}
                          color="success"
                          variant="bordered"
                          className="flex items-center gap-2"
                        >
                          <PenLine className="h-4 w-4" />
                          Save as Note
                        </Button>
                      </div>

                      <motion.div
                        key={`question-${currentCardIndex}`}
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
                      >
                        <div className="flex flex-col h-full">
                          <div className="mb-6">
                            <h3 className="text-xl font-semibold">
                              Question {currentCardIndex + 1} of {mcqs.questions.length}
                            </h3>
                            <p className="text-lg mt-4">
                              {mcqs.questions[currentCardIndex].question}
                            </p>
                          </div>

                          <div className="flex-grow space-y-3">
                            {mcqs.questions[currentCardIndex].options.map((option, j) => (
                              <button
                                key={j}
                                onClick={() => handleAnswerSelect(currentCardIndex, option)}
                                disabled={selectedAnswers[currentCardIndex] !== undefined}
                                className={`w-full text-left p-4 rounded-lg transition-all ${
                                  selectedAnswers[currentCardIndex] === option
                                    ? option === mcqs.questions[currentCardIndex].correctAnswer
                                      ? "bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-900"
                                      : "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-900"
                                    : "bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span>{option}</span>
                                  {selectedAnswers[currentCardIndex] === option && (
                                    option === mcqs.questions[currentCardIndex].correctAnswer ? (
                                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    ) : (
                                      <XCircle className="h-5 w-5 text-red-500" />
                                    )
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>

                          {selectedAnswers[currentCardIndex] && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                            >
                              <p className="text-sm">
                                {mcqs.questions[currentCardIndex].explanation}
                              </p>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>

                      <div className="flex justify-between mt-6">
                        <Button
                          onClick={() => setCurrentCardIndex(prev => Math.max(0, prev - 1))}
                          isDisabled={currentCardIndex === 0}
                          variant="bordered"
                        >
                          ← Previous
                        </Button>
                        <Button
                          onClick={() => setCurrentCardIndex(prev => Math.min(mcqs.questions.length - 1, prev + 1))}
                          isDisabled={currentCardIndex === mcqs.questions.length - 1}
                          variant="bordered"
                        >
                          Next →
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-8">
                      <p>No MCQs generated yet. Click generate to start.</p>
                    </div>
                  )}
                </ModalBody>
                <ModalFooter>
                  <Button onClick={onClose} variant="bordered" color="danger">
                    Close
                  </Button>
                  <Button
                    onClick={generateMCQs}
                    isDisabled={isGeneratingMCQs}
                    isLoading={isGeneratingMCQs}
                    color="primary"
                    className="gap-2"
                    spinner={
                      <Spinner
                        size="sm"
                        color="white"
                      />
                    }
                  >
                    {isGeneratingMCQs ? "Generating..." : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate MCQs
                      </>
                    )}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        <Modal 
          isOpen={isFlashcardOpen} 
          onClose={onFlashcardClose}
          size="2xl"
          backdrop="blur"
        >
          <ModalContent>
            {(onClose: () => void) => (
              <>
                <ModalHeader className={`flex flex-col gap-1 ${GeistSans.className}`}>
                  Flashcards
                </ModalHeader>
                <ModalBody className={GeistSans.className}>
                  {isGeneratingFlashcards ? (
                    <div className="flex flex-col items-center gap-4 p-8">
                      <Loader className="h-8 w-8 animate-spin" />
                      <p>Generating Flashcards...</p>
                    </div>
                  ) : flashcards ? (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className="text-sm font-medium">
                            Card {currentCardIndex + 1} of {flashcards.flashcards.length}
                          </div>
                          <div className="flex gap-2 text-sm">
                            <span className="text-green-500">✓ {studyStats.correct}</span>
                            <span className="text-red-500">✗ {studyStats.incorrect}</span>
                            <span className="text-gray-500">↷ {studyStats.skipped}</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => setShowFlashcardSaveDialog(true)}
                          color="success"
                          variant="bordered"
                          className="flex items-center gap-2"
                        >
                          <PenLine className="h-4 w-4" />
                          Save as Note
                        </Button>
                      </div>

                      <div className="text-xs text-gray-500 flex gap-4 justify-center">
                        <span>Space: Flip card</span>
                        <span>←→: Navigate cards</span>
                      </div>

                      <motion.div
                        className="w-full max-w-2xl aspect-[3/2] relative cursor-pointer perspective-1000"
                        onClick={() => setIsFlipped(!isFlipped)}
                        animate={{ rotateY: isFlipped ? 180 : 0 }}
                        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
                      >
                        <div
                          className={`absolute w-full h-full backface-hidden ${
                            isFlipped ? "hidden" : "block"
                          } bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-lg p-8 flex flex-col items-center justify-center text-center`}
                        >
                          <div className="absolute top-4 left-4 text-xs text-gray-400">Front</div>
                          <p className="text-2xl font-medium leading-relaxed">
                            {flashcards.flashcards[currentCardIndex].front}
                          </p>
                          <div className="absolute bottom-4 text-sm text-gray-400">
                            Click to flip or press Space
                          </div>
                        </div>
                        <div
                          className={`absolute w-full h-full backface-hidden ${
                            isFlipped ? "block" : "hidden"
                          } bg-gradient-to-br from-purple-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-xl shadow-lg p-8 flex flex-col items-center justify-center text-center`}
                          style={{ transform: "rotateY(180deg)" }}
                        >
                          <div className="absolute top-4 left-4 text-xs text-gray-400">Back</div>
                          <p className="text-2xl font-medium leading-relaxed">
                            {flashcards.flashcards[currentCardIndex].back}
                          </p>
                        </div>
                      </motion.div>

                      <div className="flex gap-4 mt-8 justify-center">
                        <Button
                          onClick={previousCard}
                          isDisabled={currentCardIndex === 0}
                          variant="bordered"
                          className="flex items-center gap-2"
                        >
                          ← Previous
                        </Button>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleCardAction('correct')}
                            color="success"
                            variant="bordered"
                          >
                            Know it ✓
                          </Button>
                          <Button
                            onClick={() => handleCardAction('incorrect')}
                            color="danger"
                            variant="bordered"
                          >
                            Review ✗
                          </Button>
                          <Button
                            onClick={() => handleCardAction('skipped')}
                            color="default"
                            variant="bordered"
                          >
                            Skip →
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-8">
                      <p>No flashcards generated yet. Click generate to start.</p>
                    </div>
                  )}
                </ModalBody>
                <ModalFooter>
                  <Button onClick={onClose} variant="bordered" color="danger">
                    Close
                  </Button>
                  <Button
                    onClick={generateFlashcards}
                    isDisabled={isGeneratingFlashcards}
                    isLoading={isGeneratingFlashcards}
                    color="primary"
                    className="gap-2"
                    spinner={
                      <Spinner
                        size="sm"
                        color="white"
                      />
                    }
                  >
                    {isGeneratingFlashcards ? "Generating..." : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate Flashcards
                      </>
                    )}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        <Modal 
          isOpen={showSaveDialog} 
          onClose={() => setShowSaveDialog(false)}
          size="sm"
          backdrop="blur"
        >
          <ModalContent>
            {() => (
              <>
                <ModalHeader className={`flex flex-col gap-1 ${GeistSans.className}`}>
                  Save MCQs as Note
                </ModalHeader>
                <ModalBody className={GeistSans.className}>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Choose how you want to save your MCQs
                  </p>
                  <div className="flex flex-col gap-3 mt-4">
                    <Button
                      onClick={() => saveAsNote('interactive')}
                      color="primary"
                      className="w-full"
                    >
                      Save as Interactive MCQs
                    </Button>
                    <Button
                      onClick={() => saveAsNote('plain')}
                      variant="bordered"
                      className="w-full"
                    >
                      Save as Plain Text
                    </Button>
                  </div>
                </ModalBody>
              </>
            )}
          </ModalContent>
        </Modal>

        <Modal 
          isOpen={showFlashcardSaveDialog} 
          onClose={() => setShowFlashcardSaveDialog(false)}
          size="sm"
          backdrop="blur"
        >
          <ModalContent>
            {() => (
              <>
                <ModalHeader className={`flex flex-col gap-1 ${GeistSans.className}`}>
                  Save Flashcards as Note
                </ModalHeader>
                <ModalBody className={GeistSans.className}>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Choose how you want to save your flashcards
                  </p>
                  <div className="flex flex-col gap-3 mt-4">
                    <Button
                      onClick={() => saveFlashcardsAsNote('interactive')}
                      color="primary"
                      className="w-full flex items-center gap-2"
                    >
                      <FlipHorizontal className="h-4 w-4" />
                      Save as Interactive Flashcards
                      <span className="text-xs opacity-75">(Can study again later)</span>
                    </Button>
                    <Button
                      onClick={() => saveFlashcardsAsNote('plain')}
                      variant="bordered"
                      className="w-full flex items-center gap-2"
                    >
                      <PenLine className="h-4 w-4" />
                      Save as Plain Text
                      <span className="text-xs opacity-75">(Static content only)</span>
                    </Button>
                  </div>
                </ModalBody>
              </>
            )}
          </ModalContent>
        </Modal>

        <Modal 
          isOpen={isMindMapOpen} 
          onClose={onMindMapClose}
          size="full"
          backdrop="blur"
        >
          <ModalContent>
            {(onClose: () => void) => (
              <>
                <ModalHeader className={`flex flex-col gap-1 ${GeistSans.className}`}>
                  Mind Map
                </ModalHeader>
                <ModalBody className={GeistSans.className}>
                  <div className="h-[70vh]">
                    <MindMap
                      fileKey={sourceFile?.key || ''}
                      onSave={(mindMap) => {
                        const mindMapText = `# ${mindMap.title}\n\n` +
                          `## Central Concept\n${mindMap.rootNode.text}\n\n` +
                          mindMap.rootNode.children?.map(node => {
                            const subNodes = node.children?.map(child => 
                              `### ${child.text}\n${child.note || ''}\n`
                            ).join('\n') || '';
                            
                            return `## ${node.text}\n${node.note || ''}\n\n${subNodes}`;
                          }).join('\n\n') || '';
                        
                        onAddNote(mindMapText);
                        showSuccessToast('Mind map saved as note!', <Network />);
                        onClose();
                      }}
                    />
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button onClick={onClose} variant="bordered" color="danger">
                    Close
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        <Modal 
          isOpen={isExamCreatorOpen} 
          onClose={onExamCreatorClose}
          size="4xl"
          backdrop="blur"
        >
          <ModalContent>
            {() => (
              <>
                <ModalHeader className={`flex flex-col gap-1 ${GeistSans.className}`}>
                  Create & Take AI-Powered Exam
                </ModalHeader>
                <ModalBody className={GeistSans.className}>
                  
                </ModalBody>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Example of conditional rendering based on subscription */}
        {canAccessPremium() && (
          <Button onClick={handleAIAssist}>
            AI Assist
          </Button>
        )}
        
        {canAccessPlus() && (
          <Button onClick={handleAdvancedAI}>
            Advanced AI
          </Button>
        )}
        
        {!canAccessPremium() && (
          <Button onClick={() => router.push('/pricing')}>
            Upgrade for AI Features
          </Button>
        )}

        <style jsx global>{`
          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
          .animate-shimmer {
            animation: shimmer 2s infinite;
          }
          
          @keyframes slide-in-right {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }

          @keyframes slide-out-right {
            from {
              transform: translateX(0);
              opacity: 1;
            }
            to {
              transform: translateX(100%);
              opacity: 0;
            }
          }

          @keyframes bounce {
            0%, 100% {
              transform: translateX(0);
            }
            50% {
              transform: translateX(-4px);
            }
          }
        `}</style>
      </div>
    </div>
  );
}