import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Shuffle } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface Flashcard {
  front: string;
  back: string;
}

interface FlashcardData {
  type: string;
  flashcards: Flashcard[];
  stats: {
    correct: number;
    incorrect: number;
    skipped: number;
  };
}

interface FlashcardNoteCardProps {
  content: string;
}

export function FlashcardNoteCard({ content }: FlashcardNoteCardProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyStats, setStudyStats] = useState({
    correct: 0,
    incorrect: 0,
    skipped: 0,
  });

  // Parse flashcard data from the note content
  const flashcardMatch = content.match(/---FLASHCARD_NOTE_START---\n([\s\S]*?)\n---FLASHCARD_NOTE_END---/);
  if (!flashcardMatch) return null;

  try {
    const flashcardData: FlashcardData = JSON.parse(flashcardMatch[1]);
    if (flashcardData.type !== "FLASHCARD_NOTE") return null;

    const nextCard = () => {
      if (currentCardIndex < flashcardData.flashcards.length - 1) {
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

    const shuffleCards = () => {
      const randomIndex = Math.floor(Math.random() * flashcardData.flashcards.length);
      setCurrentCardIndex(randomIndex);
      setIsFlipped(false);
    };

    const handleResult = (result: 'correct' | 'incorrect' | 'skipped') => {
      setStudyStats(prev => ({
        ...prev,
        [result]: prev[result] + 1
      }));
      nextCard();
    };

    return (
      <div className="bg-white dark:bg-black rounded-xl shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="space-y-4">
            {/* Stats Display */}
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium">
                Card {currentCardIndex + 1} of {flashcardData.flashcards.length}
              </div>
              <div className="flex gap-4 text-sm">
                <span className="text-green-500">✓ {studyStats.correct}</span>
                <span className="text-red-500">✗ {studyStats.incorrect}</span>
                <span className="text-gray-500">↷ {studyStats.skipped}</span>
              </div>
            </div>

            {/* Previous Stats */}
            <div className="text-sm text-gray-500 text-right">
              Previous Session: ✓{flashcardData.stats.correct} ✗{flashcardData.stats.incorrect} ↷{flashcardData.stats.skipped}
            </div>

            {/* Flashcard */}
            <div className="relative w-full min-h-[400px] perspective-1000">
              <motion.div
                className={`relative w-full h-full transition-all duration-500 transform-style-3d cursor-pointer ${
                  isFlipped ? 'rotate-y-180' : ''
                }`}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                {/* Front */}
                <div
                  className={`absolute w-full h-full backface-hidden bg-white dark:bg-black rounded-xl p-8 flex flex-col ${
                    isFlipped ? 'hidden' : ''
                  }`}
                >
                  <div className="flex-grow flex items-center justify-center text-lg">
                    {flashcardData.flashcards[currentCardIndex].front}
                  </div>
                  <div className="text-center text-sm text-gray-500">
                    Click to flip
                  </div>
                </div>

                {/* Back */}
                <div
                  className={`absolute w-full h-full backface-hidden bg-white dark:bg-black rounded-xl p-8 flex flex-col rotate-y-180 ${
                    !isFlipped ? 'hidden' : ''
                  }`}
                >
                  <div className="flex-grow flex items-center justify-center text-lg">
                    {flashcardData.flashcards[currentCardIndex].back}
                  </div>
                  <div className="flex justify-center gap-2 mt-4">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResult('correct');
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      Correct
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResult('incorrect');
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      Incorrect
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResult('skipped');
                      }}
                      className="bg-gray-500 hover:bg-gray-600 text-white"
                    >
                      Skip
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Navigation Controls */}
            <div className="flex justify-between items-center mt-6">
              <Button
                onClick={previousCard}
                disabled={currentCardIndex === 0}
                className={`flex items-center gap-2 ${
                  currentCardIndex === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                onClick={shuffleCards}
                className="bg-purple-500 hover:bg-purple-600 text-white"
              >
                <Shuffle className="h-4 w-4" />
              </Button>
              <Button
                onClick={nextCard}
                disabled={currentCardIndex === flashcardData.flashcards.length - 1}
                className={`flex items-center gap-2 ${
                  currentCardIndex === flashcardData.flashcards.length - 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error parsing flashcard data:', error);
    return null;
  }
} 