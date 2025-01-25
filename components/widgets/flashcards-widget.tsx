"use client";

import * as React from "react";
import { Plus, X, RotateCw, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export function FlashcardsWidget() {
  const [cards, setCards] = React.useState<Flashcard[]>(() => {
    const saved = localStorage.getItem("study-flashcards");
    return saved ? JSON.parse(saved) : [];
  });
  
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isFlipped, setIsFlipped] = React.useState(false);
  const [showAddCard, setShowAddCard] = React.useState(false);
  const [newFront, setNewFront] = React.useState("");
  const [newBack, setNewBack] = React.useState("");

  React.useEffect(() => {
    localStorage.setItem("study-flashcards", JSON.stringify(cards));
  }, [cards]);

  const addCard = () => {
    if (newFront.trim() && newBack.trim()) {
      setCards([
        ...cards,
        {
          id: `card-${Date.now()}`,
          front: newFront.trim(),
          back: newBack.trim(),
        },
      ]);
      setNewFront("");
      setNewBack("");
      setShowAddCard(false);
    }
  };

  const nextCard = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  return (
    <div className="space-y-3">
      {!showAddCard ? (
        <Button
          variant="outline"
          className="w-full bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm border-white/20 dark:border-gray-800/20 hover:bg-yellow-500/10 hover:text-yellow-600 dark:hover:text-yellow-400 hover:border-yellow-500/30 dark:hover:border-yellow-500/30 rounded-xl text-gray-700 dark:text-gray-200"
          onClick={() => setShowAddCard(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Flashcard
        </Button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="space-y-2"
        >
          <div className="flex justify-between items-center">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">New Flashcard</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddCard(false)}
              className="hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 rounded-xl text-red-500 dark:text-red-400"
            >
              <X className="h-4 w-4 text-red-500 dark:text-red-400" />
            </Button>
          </div>
          <Input
            placeholder="Front side..."
            value={newFront}
            onChange={(e) => setNewFront(e.target.value)}
            className="h-8 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-white/20 dark:border-gray-800/20 focus:border-yellow-500/50 focus:ring-yellow-500/50 hover:border-yellow-500/30 dark:hover:border-yellow-500/30 rounded-xl text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
          />
          <Input
            placeholder="Back side..."
            value={newBack}
            onChange={(e) => setNewBack(e.target.value)}
            className="h-8 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-white/20 dark:border-gray-800/20 focus:border-yellow-500/50 focus:ring-yellow-500/50 hover:border-yellow-500/30 dark:hover:border-yellow-500/30 rounded-xl text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
          />
          <Button
            variant="outline"
            className="w-full bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm border-white/20 dark:border-gray-800/20 hover:bg-yellow-500/10 hover:text-yellow-600 dark:hover:text-yellow-400 hover:border-yellow-500/30 dark:hover:border-yellow-500/30 rounded-xl text-gray-700 dark:text-gray-200"
            onClick={addCard}
          >
            Save Card
          </Button>
        </motion.div>
      )}

      {cards.length > 0 && (
        <div className="relative min-h-[120px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex + (isFlipped ? "-flipped" : "")}
              initial={{ rotateY: isFlipped ? -180 : 0, opacity: 0 }}
              animate={{ rotateY: isFlipped ? -180 : 0, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div
                className="absolute inset-0 p-4 rounded-xl bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm border border-white/20 dark:border-gray-800/20 cursor-pointer hover:bg-white/40 dark:hover:bg-gray-900/40 hover:border-yellow-500/30 dark:hover:border-yellow-500/30 transition-colors"
                style={{
                  backfaceVisibility: "hidden",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div className="text-center text-gray-900 dark:text-gray-100">
                  {isFlipped ? cards[currentIndex].back : cards[currentIndex].front}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="absolute -bottom-10 left-0 right-0 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevCard}
              disabled={currentIndex === 0}
              className="hover:bg-yellow-500/10 hover:text-yellow-600 dark:hover:text-yellow-400 rounded-xl text-gray-700 dark:text-gray-200 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {currentIndex + 1} / {cards.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFlipped(!isFlipped)}
                className="hover:bg-yellow-500/10 hover:text-yellow-600 dark:hover:text-yellow-400 rounded-xl text-gray-700 dark:text-gray-200"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={nextCard}
              disabled={currentIndex === cards.length - 1}
              className="hover:bg-yellow-500/10 hover:text-yellow-600 dark:hover:text-yellow-400 rounded-xl text-gray-700 dark:text-gray-200 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:hover:bg-transparent"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}