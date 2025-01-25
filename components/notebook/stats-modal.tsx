"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from '@iconify/react';
import { cn } from "@/lib/utils";
import Marquee from "@/components/ui/marquee";
import AnimatedCircularProgressBar from "@/components/ui/animated-circular-progress-bar";

// Define NotebookType here instead of importing
type NotebookType = "blank" | "math" | "history" | "science" | "language";

interface UserStats {
  totalNotebooks: number;
  totalNotes: number;
  activeStreak: number;
  lastActive: string;
  notebooksByType: Record<NotebookType, number>;
  activityByDay: Record<string, number>;
}

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: UserStats;
}

const StatCard = ({ 
  icon, 
  title, 
  value, 
  subtitle, 
  progress, 
  color, 
  primaryColor, 
  secondaryColor 
}: { 
  icon: string;
  title: string;
  value: string | number;
  subtitle: string;
  progress: number;
  color: string;
  primaryColor: string;
  secondaryColor: string;
}) => (
  <Card className={cn("border-none", color)}>
    <CardContent className="p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between mb-4"
      >
        <Icon icon={icon} className={cn("h-6 w-6", primaryColor)} />
        <motion.span 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className={cn("text-xs", secondaryColor)}
        >
          {title}
        </motion.span>
      </motion.div>
      <div className="flex items-center justify-between">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-1"
        >
          <h3 className={cn("text-2xl font-bold", primaryColor)}>
            {value}
          </h3>
          <p className={cn("text-sm", secondaryColor)}>
            {subtitle}
          </p>
        </motion.div>
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <AnimatedCircularProgressBar
            max={100}
            min={0}
            value={progress}
            gaugePrimaryColor={primaryColor.includes('blue') ? "rgb(37 99 235)" : 
                             primaryColor.includes('purple') ? "rgb(147 51 234)" : 
                             "rgb(22 163 74)"}
            gaugeSecondaryColor={secondaryColor.includes('blue') ? "rgba(37, 99, 235, 0.1)" :
                               secondaryColor.includes('purple') ? "rgba(147, 51, 234, 0.1)" :
                               "rgba(22, 163, 74, 0.1)"}
            className="scale-75"
          />
        </motion.div>
      </div>
    </CardContent>
  </Card>
);

const AchievementCard = ({
  icon,
  title,
  description,
  color,
  isNew = false
}: {
  icon: string;
  title: string;
  description: string;
  color: string;
  isNew?: boolean;
}) => {
  return (
    <motion.figure
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative w-72 cursor-pointer overflow-hidden rounded-xl border p-4 mx-3",
        "border-gray-950/[.1] bg-white/50 hover:bg-white/80",
        "dark:border-gray-50/[.1] dark:bg-gray-800/50 dark:hover:bg-gray-800/80",
        "transition-all duration-300",
        "backdrop-blur-sm shadow-sm hover:shadow-md"
      )}
    >
      {isNew && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-2 py-1 rounded-bl-lg rounded-tr-lg font-medium"
        >
          NEW!
        </motion.div>
      )}
      <div className="flex flex-row items-center gap-3">
        <motion.div 
          whileHover={{ rotate: 15 }}
          className={cn("p-2.5 rounded-lg", color)}
        >
          <Icon icon={icon} className="h-5 w-5" />
        </motion.div>
        <div className="flex flex-col">
          <figcaption className="text-sm font-semibold text-gray-900 dark:text-white">
            {title}
          </figcaption>
        </div>
      </div>
      <blockquote className="mt-3 text-sm text-gray-600 dark:text-gray-300">{description}</blockquote>
    </motion.figure>
  );
};

const TypeCard = ({ type, count, icon, color }: { 
  type: string; 
  count: number; 
  icon: string;
  color: string;
}) => (
  <motion.div 
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className={cn(
      "flex flex-col items-center p-4 rounded-xl",
      "transition-all duration-300",
      color
    )}
  >
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200 }}
      className="mb-2"
    >
      <Icon icon={icon} className="h-6 w-6" />
    </motion.div>
    <motion.span 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-2xl font-bold mb-1"
    >
      {count}
    </motion.span>
    <motion.span 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="text-sm text-gray-500 capitalize"
    >
      {type}
    </motion.span>
  </motion.div>
);

export default function StatsModal({ isOpen, onClose, stats }: StatsModalProps) {
  const [notebookProgress, setNotebookProgress] = useState(0);
  const [notesProgress, setNotesProgress] = useState(0);
  const [streakProgress, setStreakProgress] = useState(0);

  // Calculate progress values when stats change
  useEffect(() => {
    // Notebook progress (assuming 20 notebooks is 100%)
    const maxNotebooks = 20;
    setNotebookProgress(Math.min((stats.totalNotebooks / maxNotebooks) * 100, 100));

    // Notes progress (assuming 100 notes is 100%)
    const maxNotes = 100;
    setNotesProgress(Math.min((stats.totalNotes / maxNotes) * 100, 100));

    // Streak progress (assuming 30 days is 100%)
    const maxStreak = 30;
    setStreakProgress(Math.min((stats.activeStreak / maxStreak) * 100, 100));
  }, [stats]);

  // Generate achievements based on stats
  const generateAchievements = () => {
    const achievements = [
      {
        icon: 'solar:cup-star-bold-duotone',
        title: "Notebook Master",
        description: `Created ${stats.totalNotebooks} notebooks and counting!`,
        color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
      },
      {
        icon: 'solar:stars-bold-duotone',
        title: "Note Taking Pro",
        description: `Wrote ${stats.totalNotes} insightful notes`,
        color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      },
      {
        icon: 'solar:bolt-bold-duotone',
        title: "Active Learner",
        description: `${stats.activeStreak} day streak - Keep it up!`,
        color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      },
      {
        icon: 'solar:discovery-bold-duotone',
        title: "Subject Explorer",
        description: `Explored ${Object.values(stats.notebooksByType).filter(v => v > 0).length} different subjects`,
        color: "bg-green-500/10 text-green-600 dark:text-green-400",
      },
    ];

    // Add more conditional achievements
    if (stats.totalNotebooks >= 10) {
      achievements.push({
        icon: 'solar:medal-ribbons-star-bold-duotone',
        title: "Notebook Collector",
        description: "Created 10+ notebooks - Amazing collection!",
        color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      });
    }

    if (stats.activeStreak >= 7) {
      achievements.push({
        icon: 'solar:fire-bold-duotone',
        title: "Weekly Warrior",
        description: "Maintained a 7+ day streak!",
        color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
      });
    }

    return achievements;
  };

  const achievements = generateAchievements();
  const firstRow = achievements.slice(0, Math.ceil(achievements.length / 2));
  const secondRow = achievements.slice(Math.ceil(achievements.length / 2));

  // Get notebook type icon
  const getNotebookTypeIcon = (type: string): string => {
    switch (type) {
      case 'math': return 'solar:calculator-bold-duotone';
      case 'history': return 'solar:book-bookmark-bold-duotone';
      case 'science': return 'solar:atom-bold-duotone';
      case 'language': return 'solar:notebook-bold-duotone';
      default: return 'solar:notebook-minimalistic-bold-duotone';
    }
  };

  // Get notebook type color
  const getNotebookTypeColor = (type: string): string => {
    switch (type) {
      case 'math': return "bg-blue-50 dark:bg-blue-900/20";
      case 'history': return "bg-amber-50 dark:bg-amber-900/20";
      case 'science': return "bg-green-50 dark:bg-green-900/20";
      case 'language': return "bg-purple-50 dark:bg-purple-900/20";
      default: return "bg-gray-50 dark:bg-gray-800";
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="fixed inset-0 z-[70] overflow-y-auto"
      >
        <div className="min-h-screen px-4 text-center">
          <div className="inline-block w-full max-w-4xl my-8 text-left align-middle transition-all transform">
            <Card className="relative overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[32px]">
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={onClose}
              >
                <Icon icon="solar:close-circle-bold-duotone" className="h-5 w-5" />
              </motion.button>
              
              <CardContent className="p-8">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between gap-3 mb-8"
                >
                  <div className="flex items-center gap-3">
                    <Icon icon="solar:chart-2-bold-duotone" className="h-8 w-8 text-blue-500" />
                    <h2 className="text-3xl font-bold">Your Activity Dashboard</h2>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.open('/charity-impact', '_blank')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-400 to-red-500 text-white shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 transition-all duration-300"
                  >
                    <Icon icon="solar:heart-bold-duotone" className="h-5 w-5 animate-pulse" />
                    <span className="font-medium">Our Charity Impact</span>
                  </motion.button>
                </motion.div>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <StatCard
                    icon="solar:notebook-bookmark-bold-duotone"
                    title="Total"
                    value={stats.totalNotebooks}
                    subtitle="Notebooks"
                    progress={notebookProgress}
                    color="bg-blue-50 dark:bg-blue-900/20"
                    primaryColor="text-blue-600 dark:text-blue-400"
                    secondaryColor="text-blue-600/70 dark:text-blue-400/70"
                  />
                  <StatCard
                    icon="solar:documents-bold-duotone"
                    title="Total"
                    value={stats.totalNotes}
                    subtitle="Notes"
                    progress={notesProgress}
                    color="bg-purple-50 dark:bg-purple-900/20"
                    primaryColor="text-purple-600 dark:text-purple-400"
                    secondaryColor="text-purple-600/70 dark:text-purple-400/70"
                  />
                  <StatCard
                    icon="solar:graph-up-bold-duotone"
                    title="Current"
                    value={`${stats.activeStreak} days`}
                    subtitle="Active Streak"
                    progress={streakProgress}
                    color="bg-green-50 dark:bg-green-900/20"
                    primaryColor="text-green-600 dark:text-green-400"
                    secondaryColor="text-green-600/70 dark:text-green-400/70"
                  />
                </div>

                {/* Last Active Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="bg-orange-50 dark:bg-orange-900/20 border-none mb-8">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Icon icon="solar:calendar-bold-duotone" className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            <span className="text-sm font-medium text-orange-600/70 dark:text-orange-400/70">
                              Last Active Session
                            </span>
                          </div>
                          <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                            {new Date(stats.lastActive).toLocaleDateString(undefined, { 
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                          className="text-orange-500/20 dark:text-orange-400/20"
                        >
                          <Icon icon="solar:clock-circle-bold-duotone" className="h-16 w-16" />
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Notebooks by Type */}
                <div className="mb-8">
                  <motion.h3 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xl font-semibold mb-4 flex items-center gap-2"
                  >
                    <Icon icon="solar:chart-up-bold-duotone" className="h-5 w-5" />
                    Notebooks by Type
                  </motion.h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(stats.notebooksByType).map(([type, count]) => (
                      <TypeCard
                        key={type}
                        type={type}
                        count={count}
                        icon={getNotebookTypeIcon(type)}
                        color={getNotebookTypeColor(type)}
                      />
                    ))}
                  </div>
                </div>

                {/* Activity Chart */}
                <div className="mb-8">
                  <motion.h3 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xl font-semibold mb-4 flex items-center gap-2"
                  >
                    <Icon icon="solar:graph-new-bold-duotone" className="h-5 w-5" />
                    Weekly Activity
                  </motion.h3>
                  <div className="h-48 flex items-end justify-between gap-2">
                    <AnimatePresence>
                      {Object.entries(stats.activityByDay).map(([date, count], index) => (
                        <motion.div
                          key={date}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ 
                            opacity: 1, 
                            height: `${(count / Math.max(...Object.values(stats.activityByDay))) * 100}%` 
                          }}
                          transition={{ delay: index * 0.1 }}
                          className="flex flex-col items-center flex-1"
                        >
                          <div 
                            className="w-full bg-blue-500/20 rounded-t-lg transition-all duration-500 hover:bg-blue-500/30"
                            style={{ 
                              height: "100%",
                              opacity: index === Object.entries(stats.activityByDay).length - 1 ? 1 : 0.7
                            }}
                          />
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 + index * 0.1 }}
                            className="mt-2 text-xs text-gray-500"
                          >
                            {new Date(date).toLocaleDateString(undefined, { weekday: 'short' })}
                          </motion.div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Achievements Marquee */}
                <div className="relative mb-8 py-4">
                  <motion.h3 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xl font-semibold mb-6 flex items-center gap-2"
                  >
                    <Icon icon="solar:cup-first-bold-duotone" className="h-5 w-5" />
                    Your Achievements
                  </motion.h3>
                  <div className="relative flex h-[240px] w-full flex-col items-center justify-center overflow-hidden rounded-lg border bg-background/50 backdrop-blur-sm">
                    <div className="flex-1 w-full overflow-hidden">
                      <Marquee pauseOnHover className="[--duration:40s] py-4">
                        {firstRow.map((achievement, i) => (
                          <AchievementCard 
                            key={`first-${i}`} 
                            {...achievement} 
                            isNew={i === firstRow.length - 1}
                          />
                        ))}
                      </Marquee>
                    </div>
                    <div className="flex-1 w-full overflow-hidden">
                      <Marquee reverse pauseOnHover className="[--duration:40s] py-4">
                        {secondRow.map((achievement, i) => (
                          <AchievementCard key={`second-${i}`} {...achievement} />
                        ))}
                      </Marquee>
                    </div>
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-white dark:from-gray-900"></div>
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-white dark:from-gray-900"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </>
  );
} 