"use client";

import * as React from "react";

export function NotesWidget() {
  const [notes, setNotes] = React.useState<string>(() => {
    const saved = localStorage.getItem("student-notes");
    return saved || "";
  });

  React.useEffect(() => {
    localStorage.setItem("student-notes", notes);
  }, [notes]);

  return (
    <textarea 
      value={notes}
      onChange={(e) => setNotes(e.target.value)}
      className="w-full h-24 p-2 text-sm rounded-xl bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm border-white/20 dark:border-gray-800/20 resize-none focus:border-violet-500/50 focus:ring-violet-500/50 hover:border-violet-500/30 dark:hover:border-violet-500/30 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 transition-colors"
      placeholder="Type quick notes here..."
    />
  );
} 