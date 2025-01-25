"use client";

import * as React from "react";
import { Timer, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { GeistMono } from 'geist/font/mono';

export function TimerWidget() {
  const [timeRemaining, setTimeRemaining] = React.useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = React.useState(false);
  const [timerType, setTimerType] = React.useState<"focus" | "break">("focus");

  React.useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (isTimerRunning && timeRemaining !== null && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 0) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timeRemaining === 0) {
      handleTimerComplete();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timeRemaining]);

  const handleTimerComplete = () => {
    setIsTimerRunning(false);
    const message = timerType === "focus" 
      ? "Focus session completed! Take a break." 
      : "Break time is over! Ready to focus again?";
    
    // Show notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(message);
    } else {
      toast.success(message);
    }
  };

  const startTimer = (type: "focus" | "break") => {
    setTimerType(type);
    setTimeRemaining(type === "focus" ? 25 * 60 : 5 * 60);
    setIsTimerRunning(true);
    
    // Request notification permission if not granted
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimeRemaining(timerType === "focus" ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-2">
      <div className="text-center text-2xl font-mono font-bold text-orange-500 dark:text-orange-400">
        <span className={GeistMono.className}>{formatTime(timeRemaining)}</span>
      </div>
      <div className="flex gap-2">
        {!isTimerRunning ? (
          <Button 
            variant="outline" 
            className="flex-1 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm border-white/20 dark:border-gray-800/20 hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 group/button rounded-xl text-gray-700 dark:text-gray-200"
            onClick={() => startTimer("focus")}
          >
            <Timer className="h-4 w-4 mr-2 text-orange-500 dark:text-orange-400 group-hover/button:animate-spin" />
            Start Focus
          </Button>
        ) : (
          <Button 
            variant="outline" 
            className="flex-1 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm border-white/20 dark:border-gray-800/20 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 group/button rounded-xl text-gray-700 dark:text-gray-200"
            onClick={pauseTimer}
          >
            <Timer className="h-4 w-4 mr-2 text-red-500 dark:text-red-400" />
            Pause
          </Button>
        )}
        <Button 
          variant="outline" 
          className="bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm border-white/20 dark:border-gray-800/20 hover:bg-gray-500/10 hover:text-gray-600 dark:hover:text-gray-400 rounded-xl text-gray-700 dark:text-gray-200"
          onClick={resetTimer}
        >
          <RotateCcw className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </Button>
      </div>
      <Button 
        variant="outline" 
        className="w-full bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm border-white/20 dark:border-gray-800/20 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl text-gray-700 dark:text-gray-200"
        onClick={() => startTimer("break")}
      >
        <Sparkles className="h-4 w-4 mr-2 text-emerald-500 dark:text-emerald-400" />
        Start Break
      </Button>
    </div>
  );
} 