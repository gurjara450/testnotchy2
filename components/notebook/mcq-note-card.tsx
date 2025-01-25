import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, ArrowLeft, ArrowRight, RotateCcw, Trophy } from 'lucide-react';
import useSound from 'use-sound';

interface MCQQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  userAnswer: string | null;
}

interface MCQData {
  type: string;
  questions: MCQQuestion[];
  score: {
    total: number;
    correct: number;
  };
}

interface MCQNoteCardProps {
  content: string;
}

export function MCQNoteCard({ content }: MCQNoteCardProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});
  const [showConfetti, setShowConfetti] = useState(false);
  const lastSoundTime = useRef<number>(0);

  // Sound effects with error handling
  const [playCorrect] = useSound('/sounds/correct.mp3', { 
    volume: 0.35,
    interrupt: true,
    soundEnabled: true
  });
  const [playIncorrect] = useSound('/sounds/incorrect.mp3', { 
    volume: 0.25,
    interrupt: true,
    soundEnabled: true
  });
  const [playClick] = useSound('/sounds/click.mp3', { 
    volume: 0.2,
    interrupt: true,
    soundEnabled: true
  });
  const [playSuccess] = useSound('/sounds/success.mp3', { 
    volume: 0.4,
    interrupt: true,
    soundEnabled: true
  });

  // Memoized sound handlers with debounce to prevent sound spam
  const handleCorrectSound = useCallback(() => {
    const now = Date.now();
    if (now - lastSoundTime.current < 200) return; // Debounce 200ms
    lastSoundTime.current = now;
    
    try {
      playCorrect();
    } catch (error) {
      console.error('Error playing correct sound:', error);
    }
  }, [playCorrect]);

  const handleIncorrectSound = useCallback(() => {
    try {
      playIncorrect();
    } catch (error) {
      console.error('Error playing incorrect sound:', error);
    }
  }, [playIncorrect]);

  const handleClickSound = useCallback(() => {
    try {
      playClick();
    } catch (error) {
      console.error('Error playing click sound:', error);
    }
  }, [playClick]);

  const handleSuccessSound = useCallback(() => {
    try {
      playSuccess();
    } catch (error) {
      console.error('Error playing success sound:', error);
    }
  }, [playSuccess]);

  // Parse MCQ data from the note content
  const mcqMatch = content.match(/---MCQ_NOTE_START---\n([\s\S]*?)\n---MCQ_NOTE_END---/);
  if (!mcqMatch) return null;

  try {
    const mcqData: MCQData = JSON.parse(mcqMatch[1]);
    if (mcqData.type !== "MCQ_NOTE") return null;

    const handleAnswerSelect = (questionIndex: number, answer: string) => {
      const isCorrect = answer === mcqData.questions[questionIndex].correctAnswer;
      
      if (isCorrect) {
        handleCorrectSound();
        // Check if this was the last question and all answers are correct
        const isLastQuestion = questionIndex === mcqData.questions.length - 1;
        const allCorrect = Object.entries(selectedAnswers).every(([idx, ans]) => 
          ans === mcqData.questions[parseInt(idx)].correctAnswer
        );
        
        if (isLastQuestion && allCorrect) {
          handleSuccessSound();
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }
      } else {
        handleIncorrectSound();
      }

      setSelectedAnswers(prev => ({
        ...prev,
        [questionIndex]: answer
      }));
    };

    const handleNavigation = (direction: 'prev' | 'next') => {
      handleClickSound();
      setCurrentCardIndex(prev => 
        direction === 'prev' 
          ? Math.max(0, prev - 1)
          : Math.min(mcqData.questions.length - 1, prev + 1)
      );
    };

    const handleReset = () => {
      handleClickSound();
      setSelectedAnswers({});
      setCurrentCardIndex(0);
    };

    const getScore = () => {
      return Object.entries(selectedAnswers).reduce((score, [index, answer]) => {
        const question = mcqData.questions[parseInt(index)];
        return score + (answer === question.correctAnswer ? 1 : 0);
      }, 0);
    };

    // Add a progress bar
    const progress = ((currentCardIndex + 1) / mcqData.questions.length) * 100;

    return (
      <div className="relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none z-50">
            {/* Add confetti animation here */}
            <div className="absolute inset-0 animate-confetti" />
          </div>
        )}
        
        {/* Progress Bar - Moved to top */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-100 dark:bg-gray-700">
          <motion.div 
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="p-8">
          <div className="space-y-6">
            {/* Score Display */}
            <div className="flex justify-between items-center">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center space-x-4"
              >
                {Object.keys(selectedAnswers).length > 0 && (
                  <motion.div 
                    className="flex items-center"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <div className="flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full px-4 py-2">
                      <Trophy className="h-5 w-5 text-white mr-2" />
                      <div className="text-2xl font-bold text-white">
                        {getScore()}/{mcqData.questions.length}
                      </div>
                    </div>
                    <div className="ml-3 text-sm text-gray-500 dark:text-gray-400">Current Score</div>
                  </motion.div>
                )}
              </motion.div>
              <div className="text-sm bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2">
                Previous Best: {mcqData.score.correct}/{mcqData.score.total}
              </div>
            </div>

            {/* Question Card */}
            <div className="relative w-full min-h-[500px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`question-${currentCardIndex}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-6 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex flex-col h-full space-y-6">
                    {/* Question */}
                    <div>
                      <motion.h3 
                        className="text-sm font-medium text-gray-500 dark:text-gray-400"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        Question {currentCardIndex + 1} of {mcqData.questions.length}
                      </motion.h3>
                      <motion.p 
                        className="text-xl font-semibold mt-3 text-gray-900 dark:text-white"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        {mcqData.questions[currentCardIndex].question}
                      </motion.p>
                    </div>

                    {/* Options */}
                    <div className="flex-grow space-y-3">
                      {mcqData.questions[currentCardIndex].options.map((option, j) => (
                        <motion.button
                          key={`option-${j}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: j * 0.1 }}
                          onClick={() => handleAnswerSelect(currentCardIndex, option)}
                          disabled={selectedAnswers[currentCardIndex] !== undefined}
                          className={`w-full text-left p-5 rounded-xl transition-all transform hover:scale-[1.02] ${
                            selectedAnswers[currentCardIndex] === option
                              ? option === mcqData.questions[currentCardIndex].correctAnswer
                                ? "bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-800 shadow-lg shadow-green-500/20"
                                : "bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-red-200 dark:border-red-800 shadow-lg shadow-red-500/20"
                              : "hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:shadow-blue-500/10"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-lg">{option}</span>
                            {selectedAnswers[currentCardIndex] === option && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200 }}
                              >
                                {option === mcqData.questions[currentCardIndex].correctAnswer ? (
                                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                                ) : (
                                  <XCircle className="h-6 w-6 text-red-500" />
                                )}
                              </motion.div>
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </div>

                    {/* Explanation */}
                    <AnimatePresence>
                      {selectedAnswers[currentCardIndex] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-800 shadow-lg shadow-blue-500/10"
                        >
                          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                            {mcqData.questions[currentCardIndex].explanation}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between pt-4">
              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleNavigation('prev')}
                  disabled={currentCardIndex === 0}
                  className={`p-3 rounded-xl transition-all flex items-center space-x-2 ${
                    currentCardIndex === 0
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800"
                      : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg shadow-blue-500/30"
                  }`}
                >
                  <ArrowLeft className="h-5 w-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleNavigation('next')}
                  disabled={currentCardIndex === mcqData.questions.length - 1}
                  className={`p-3 rounded-xl transition-all flex items-center space-x-2 ${
                    currentCardIndex === mcqData.questions.length - 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800"
                      : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg shadow-blue-500/30"
                  }`}
                >
                  <ArrowRight className="h-5 w-5" />
                </motion.button>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReset}
                className="p-3 rounded-xl transition-all bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 dark:from-gray-800 dark:to-gray-700 dark:hover:from-gray-700 dark:hover:to-gray-600 dark:text-gray-300 flex items-center space-x-2 shadow-lg shadow-gray-500/20"
              >
                <RotateCcw className="h-5 w-5" />
              </motion.button>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes confetti {
            0% { transform: translateY(0) rotate(0deg); }
            100% { transform: translateY(100vh) rotate(360deg); }
          }
          .animate-confetti {
            animation: confetti 1s ease-out forwards;
          }
        `}</style>
      </div>
    );
  } catch (error) {
    console.error('Error parsing MCQ data:', error);
    return null;
  }
} 