"use client";

import * as React from "react";
import { format } from "date-fns";
import { useState } from "react";

interface StudyStats {
  totalFocusTime: number;
  completedTasks: number;
  streakDays: number;
  lastStudyDate: Date | null;
}

export function StatsWidget() {
  const [studyStats] = useState({
    totalTime: 0,
    sessionsCompleted: 0,
    averageSessionLength: 0,
    longestStreak: 0,
    currentStreak: 0,
  });

  React.useEffect(() => {
    localStorage.setItem("study-stats", JSON.stringify(studyStats));
  }, [studyStats]);

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="p-3 rounded-xl bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm">
        <div className="text-sm text-gray-500 dark:text-gray-400">Focus Time</div>
        <div className="text-lg font-medium text-gray-900 dark:text-gray-100">{Math.round(studyStats.totalFocusTime / 60)}m</div>
      </div>
      <div className="p-3 rounded-xl bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm">
        <div className="text-sm text-gray-500 dark:text-gray-400">Tasks Done</div>
        <div className="text-lg font-medium text-gray-900 dark:text-gray-100">{studyStats.completedTasks}</div>
      </div>
      <div className="p-3 rounded-xl bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm">
        <div className="text-sm text-gray-500 dark:text-gray-400">Streak</div>
        <div className="text-lg font-medium text-gray-900 dark:text-gray-100">{studyStats.streakDays} days</div>
      </div>
      <div className="p-3 rounded-xl bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm">
        <div className="text-sm text-gray-500 dark:text-gray-400">Last Study</div>
        <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
          {studyStats.lastStudyDate ? format(studyStats.lastStudyDate, "MMM d") : "Never"}
        </div>
      </div>
    </div>
  );
}