"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function SummaryWidget() {
  const [text, setText] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const generateSummary = async () => {
    if (!text.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: text.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate summary");
      }

      const data = await response.json();
      setSummary(data.summary);
    } catch (error) {
      console.error("Summary generation error:", error);
      setSummary("Failed to generate summary. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Textarea
        placeholder="Enter text to summarize..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="h-24 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-white/20 dark:border-gray-800/20 focus:border-teal-500/50 focus:ring-teal-500/50 hover:border-teal-500/30 dark:hover:border-teal-500/30 rounded-xl resize-none text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
      />
      
      <Button
        variant="outline"
        className={cn(
          "w-full bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm border-white/20 dark:border-gray-800/20",
          "hover:bg-teal-500/10 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-500/30 dark:hover:border-teal-500/30 rounded-xl",
          "text-gray-700 dark:text-gray-200",
          loading && "opacity-50 cursor-not-allowed"
        )}
        onClick={generateSummary}
        disabled={loading || !text.trim()}
      >
        {loading ? (
          <>
            <Sparkles className="h-4 w-4 mr-2 animate-spin text-teal-500 dark:text-teal-400" />
            Summarizing...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2 text-teal-500 dark:text-teal-400" />
            Generate Summary
          </>
        )}
      </Button>

      {summary && (
        <div className="p-3 rounded-xl bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm border border-white/20 dark:border-gray-800/20">
          <div className="text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Summary</div>
          <div className="text-sm text-gray-700 dark:text-gray-200">
            {summary}
          </div>
        </div>
      )}
    </div>
  );
} 