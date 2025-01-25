// components/NoteCard.tsx

'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pin, Trash2, PenTool, Maximize2, ExternalLink, BookOpen, FlipHorizontal, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Note } from '@/lib/types';
import { cn } from '@/lib/utils';
import { MCQNoteCard } from './mcq-note-card';
import { FlashcardNoteCard } from './flashcard-note-card';

type NoteCardProps = {
  note: Note & { displayId?: number };
  onDelete: (id: number) => void;
  onPin: (id: number) => void;
  onPreview: (note: Note) => void;
  onUpdateStyle?: (id: number, updates: Partial<Note>) => void;
};

const backgroundStyles = {
  plain: 'relative bg-white dark:bg-black',
  ruled: 'bg-[linear-gradient(transparent_1.5rem,#e5e7eb_1.5rem)] bg-[size:100%_1.6rem] [background-position:0_1.3rem]',
  dotted: 'bg-[radial-gradient(circle,#e5e7eb_1px,transparent_1px)] bg-[size:20px_20px]',
  grid: 'bg-[linear-gradient(#e5e7eb_1px,transparent_1px),linear-gradient(90deg,#e5e7eb_1px,transparent_1px)] bg-[size:20px_20px]',
};

const fontStyles = {
  default: 'font-sans',
  handwritten1: 'font-caveat',
  handwritten2: 'font-kalam',
  casual: 'font-architects-daughter',
  indie: 'font-indie-flower',
  shadows: 'font-shadows-into-light',
  apple: 'font-homemade-apple',
  patrick: 'font-patrick-hand',
};

const NoteCard: React.FC<NoteCardProps> = ({ note, onDelete, onPin, onPreview, onUpdateStyle }) => {
  const id = React.useId();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPinning, setIsPinning] = useState(false);

  // Improved detection logic for MCQ and Flashcard notes
  const isMCQNote = (() => {
    try {
      const mcqMatch = note.content.match(/---MCQ_NOTE_START---\n([\s\S]*?)\n---MCQ_NOTE_END---/);
      if (!mcqMatch) return false;
      const mcqData = JSON.parse(mcqMatch[1]);
      return mcqData.type === "MCQ_NOTE";
    } catch {
      return false;
    }
  })();

  const isFlashcardNote = (() => {
    try {
      const flashcardMatch = note.content.match(/---FLASHCARD_NOTE_START---\n([\s\S]*?)\n---FLASHCARD_NOTE_END---/);
      if (!flashcardMatch) return false;
      const flashcardData = JSON.parse(flashcardMatch[1]);
      return flashcardData.type === "FLASHCARD_NOTE";
    } catch {
      return false;
    }
  })();

  const handleCardClick = () => {
    onPreview(note);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      await onDelete(note.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPinning(true);
    try {
      await onPin(note.id);
    } finally {
      setIsPinning(false);
    }
  };

  const toggleFullScreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFullScreen(!isFullScreen);
  };

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPreview(note);
  };

  const renderActionButtons = () => (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePin}
        disabled={isPinning}
        className={cn(
          "relative text-gray-500 hover:text-yellow-500 dark:text-gray-400 dark:hover:text-yellow-400 transition-all duration-200",
          note.pinned && "text-yellow-500 dark:text-yellow-400",
          "hover:scale-110 active:scale-95",
          isPinning && "opacity-70 cursor-not-allowed"
        )}
      >
        <AnimatePresence mode="wait">
          {isPinning ? (
            <motion.div
              key="pinning"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
            </motion.div>
          ) : (
            <motion.div
              key="pin"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Pin className="h-4 w-4" />
            </motion.div>
          )}
        </AnimatePresence>
        <span className="sr-only">{note.pinned ? 'Unpin note' : 'Pin note'}</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        disabled={isDeleting}
        className={cn(
          "relative text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-all duration-200",
          "hover:scale-110 active:scale-95",
          isDeleting && "opacity-70 cursor-not-allowed"
        )}
      >
        <AnimatePresence mode="wait">
          {isDeleting ? (
            <motion.div
              key="deleting"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
            </motion.div>
          ) : (
            <motion.div
              key="delete"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Trash2 className="h-4 w-4" />
            </motion.div>
          )}
        </AnimatePresence>
        <span className="sr-only">Delete note</span>
      </Button>
    </>
  );

  // If this is an MCQ note or flashcard note
  if (isMCQNote || isFlashcardNote) {
    return (
      <motion.div layoutId={`card-${note.id}-${id}`} className="h-full">
        <Card 
          className={`group bg-white dark:bg-black border ${isMCQNote ? 'border-blue-200 dark:border-blue-400/30' : 'border-purple-200 dark:border-purple-400/30'} overflow-hidden rounded-[2rem] shadow-md transition-all duration-300 hover:shadow-lg h-[250px] cursor-pointer relative`}
        >
          <CardContent className="p-4 flex flex-col h-full">
            <motion.div layoutId={`header-${note.id}-${id}`} className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                {isMCQNote ? (
                  <BookOpen className="h-4 w-4 text-blue-500" />
                ) : (
                  <FlipHorizontal className="h-4 w-4 text-purple-500" />
                )}
                <motion.span layoutId={`title-${note.id}-${id}`} className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  {isMCQNote ? `MCQ Practice ${note.id}` : `Flashcards ${note.id}`}
                </motion.span>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePreview}
                  className={`text-gray-500 hover:${isMCQNote ? 'text-blue-500' : 'text-purple-500'} dark:text-gray-400 dark:hover:${isMCQNote ? 'text-blue-400' : 'text-purple-400'} transition-all duration-200 hover:scale-110 active:scale-95`}
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="sr-only">Open in preview</span>
                </Button>
                {renderActionButtons()}
              </div>
            </motion.div>
            <motion.div layoutId={`content-${note.id}-${id}`} className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
              {isMCQNote ? (
                <MCQNoteCard content={note.content} />
              ) : (
                <FlashcardNoteCard content={note.content} />
              )}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Regular note card rendering with full-screen support
  return (
    <AnimatePresence>
      <motion.div layoutId={`card-${note.id}-${id}`} className={`${isFullScreen ? 'fixed inset-0 z-50' : 'h-full'}`}>
        {isFullScreen && (
          <div className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm" onClick={toggleFullScreen} />
        )}
        <Card 
          onClick={isFullScreen ? undefined : handleCardClick}
          className={`group bg-white dark:bg-black border border-gray-200 dark:border-gray-500/30 overflow-hidden rounded-[2rem] shadow-md transition-all duration-300 hover:shadow-lg ${isFullScreen ? 'h-full fixed inset-4 z-50' : 'h-[250px]'} cursor-pointer relative`}
        >
          <CardContent className={`p-4 flex flex-col h-full ${note.background ? backgroundStyles[note.background] : 'bg-white dark:bg-black'} ${isFullScreen ? 'max-w-4xl mx-auto' : ''}`}>
            <motion.div layoutId={`header-${note.id}-${id}`} className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <PenTool className="h-4 w-4 text-gray-500" />
                <motion.span layoutId={`title-${note.id}-${id}`} className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Note {note.displayId || note.id}
                </motion.span>
              </div>
              <div className="flex space-x-2">
                {isFullScreen ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFullScreen}
                    className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-all duration-200 hover:scale-110 active:scale-95"
                  >
                    <X className="h-5 w-5" />
                    <span className="sr-only">Close full view</span>
                  </Button>
                ) : (
                  renderActionButtons()
                )}
              </div>
            </motion.div>
            <motion.div layoutId={`content-${note.id}-${id}`} className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
              <div className={cn(
                'prose dark:prose-invert max-w-none',
                isFullScreen ? 'text-lg' : '',
                note.font ? fontStyles[note.font] : '',
              )}
              style={{ letterSpacing: note.letterSpacing ? `${note.letterSpacing}px` : undefined }}>
                {note.content}
              </div>
            </motion.div>
          </CardContent>

          {/* View mode buttons in bottom-right corner */}
          {!isFullScreen && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePreview}
                className="bg-white/80 dark:bg-black/80 backdrop-blur-sm hover:bg-white dark:hover:bg-black hover:scale-105 active:scale-95 transition-all duration-200"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                Preview
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={toggleFullScreen}
                className="bg-white/80 dark:bg-black/80 backdrop-blur-sm hover:bg-white dark:hover:bg-black hover:scale-105 active:scale-95 transition-all duration-200"
              >
                <Maximize2 className="h-3.5 w-3.5 mr-1" />
                Full View
              </Button>
            </div>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default NoteCard;