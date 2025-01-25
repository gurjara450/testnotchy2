"use client";

import React from "react";
import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface ImportantDate {
  id: string;
  title: string;
  date: Date;
}

export function DatesWidget() {
  const [importantDates, setImportantDates] = React.useState<ImportantDate[]>(() => {
    const saved = localStorage.getItem("student-dates");
    return saved ? JSON.parse(saved, (key, value) => {
      if (key === 'date') return new Date(value);
      return value;
    }) : [];
  });
  const [newDateTitle, setNewDateTitle] = React.useState("");
  const [selectedDate, setSelectedDate] = React.useState<Date>();

  React.useEffect(() => {
    localStorage.setItem("student-dates", JSON.stringify(importantDates));
  }, [importantDates]);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Event title..."
          value={newDateTitle}
          onChange={(e) => setNewDateTitle(e.target.value)}
          className="h-8 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-white/20 dark:border-gray-800/20 focus:border-pink-500/50 focus:ring-pink-500/50 rounded-xl"
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[120px] justify-start text-left font-normal bg-white/50 dark:bg-gray-900/50",
                !selectedDate && "text-muted-foreground"
              )}
            >
              {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      <Button 
        variant="outline" 
        className="w-full bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm border-white/20 dark:border-gray-800/20 hover:bg-pink-500/10 hover:text-pink-600 dark:hover:text-pink-400 rounded-xl"
        onClick={() => {
          if (newDateTitle && selectedDate) {
            setImportantDates(prev => [...prev, {
              id: `date-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title: newDateTitle,
              date: selectedDate
            }]);
            setNewDateTitle("");
            setSelectedDate(undefined);
          }
        }}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Important Date
      </Button>
      <div className="space-y-2 mt-4">
        {importantDates.map(date => (
          <motion.div
            key={date.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center justify-between p-2 rounded-xl bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm group/date"
          >
            <div>
              <div className="font-medium">{date.title}</div>
              <div className="text-sm text-gray-500">{format(date.date, "PPP")}</div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover/date:opacity-100 transition-opacity h-8 w-8 hover:bg-red-500/10 rounded-xl"
              onClick={() => setImportantDates(prev => prev.filter(d => d.id !== date.id))}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
} 