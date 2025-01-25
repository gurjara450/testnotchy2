import { Music, ListTodo, Brain, BookMarked, Calendar, BarChart,  Book, Lightbulb, Globe, Sigma, FileText } from "lucide-react";
import { Widget } from "./types";
import { MusicPlayer } from "@/components/notebook/music-player";
import { TodoWidget } from "@/components/widgets/todo-widget";
import { TimerWidget } from "@/components/widgets/timer-widget";
import { NotesWidget } from "@/components/widgets/notes-widget";
import { DatesWidget } from "@/components/widgets/dates-widget";
import { StatsWidget } from "@/components/widgets/stats-widget";

import { DictionaryWidget } from "@/components/widgets/dictionary-widget";
import { FlashcardsWidget } from "@/components/widgets/flashcards-widget";
import { TranslatorWidget } from "@/components/widgets/translator-widget";
import { FormulaWidget } from "@/components/widgets/formula-widget";
import { SummaryWidget } from "@/components/widgets/summary-widget";

export const widgetRegistry: Widget[] = [
  {
    id: "music",
    type: "music",
    title: "Study Music",
    description: "Play focus-enhancing study music",
    icon: Music,
    color: "indigo",
    component: MusicPlayer
  },
  {
    id: "todo",
    type: "todo",
    title: "To-Do List",
    description: "Keep track of your tasks",
    icon: ListTodo,
    color: "blue",
    component: TodoWidget
  },
  {
    id: "timer",
    type: "timer",
    title: "Focus Timer",
    description: "Pomodoro timer for focused study sessions",
    icon: Brain,
    color: "orange",
    component: TimerWidget
  },
  {
    id: "notes",
    type: "notes",
    title: "Quick Notes",
    description: "Jot down important notes",
    icon: BookMarked,
    color: "violet",
    component: NotesWidget
  },
  {
    id: "dates",
    type: "dates",
    title: "Important Dates",
    description: "Track important deadlines and events",
    icon: Calendar,
    color: "pink",
    component: DatesWidget
  },
  {
    id: "stats",
    type: "stats",
    title: "Study Stats",
    description: "View your study statistics",
    icon: BarChart,
    color: "green",
    component: StatsWidget
  },
  
  {
    id: "dictionary",
    type: "dictionary",
    title: "Dictionary",
    description: "Look up word definitions and synonyms",
    icon: Book,
    color: "amber",
    component: DictionaryWidget
  },
  {
    id: "flashcards",
    type: "flashcards",
    title: "Flashcards",
    description: "Create and study with flashcards",
    icon: Lightbulb,
    color: "yellow",
    component: FlashcardsWidget
  },
  {
    id: "translator",
    type: "translator",
    title: "Translator",
    description: "Translate text between languages",
    icon: Globe,
    color: "purple",
    component: TranslatorWidget
  },
  {
    id: "formula",
    type: "formula",
    title: "Formula Sheet",
    description: "Quick access to common formulas",
    icon: Sigma,
    color: "red",
    component: FormulaWidget
  },
  {
    id: "summary",
    type: "summary",
    title: "AI Summary",
    description: "Generate quick summaries of text",
    icon: FileText,
    color: "teal",
    component: SummaryWidget
  }
]; 