"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface WordDefinition {
  word: string;
  phonetic?: string;
  meanings: {
    partOfSpeech: string;
    definitions: {
      definition: string;
      example?: string;
      synonyms?: string[];
    }[];
  }[];
}

export function DictionaryWidget() {
  const [word, setWord] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [definition, setDefinition] = React.useState<WordDefinition | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const lookupWord = async () => {
    if (!word.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.trim())}`
      );
      
      if (!response.ok) {
        throw new Error("Word not found");
      }
      
      const data = await response.json();
      setDefinition(data[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to look up word");
      setDefinition(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={word}
          onChange={(e) => setWord(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              lookupWord();
            }
          }}
          placeholder="Enter a word..."
          className="h-8 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-white/20 dark:border-gray-800/20 focus:border-amber-500/50 focus:ring-amber-500/50 hover:border-amber-500/30 dark:hover:border-amber-500/30 rounded-xl text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={lookupWord}
          disabled={loading}
          className="bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm border-white/20 dark:border-gray-800/20 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-500/30 dark:hover:border-amber-500/30 disabled:hover:bg-transparent disabled:hover:text-gray-400 dark:disabled:hover:text-gray-600 rounded-xl text-gray-700 dark:text-gray-200"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {loading && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 animate-pulse">
          Looking up...
        </div>
      )}

      {error && (
        <div className="text-center text-sm text-red-500 dark:text-red-400">
          {error}
        </div>
      )}

      {definition && (
        <div className="space-y-2 text-sm">
          <div className="flex items-baseline gap-2">
            <h3 className="font-medium text-base text-gray-900 dark:text-gray-100">{definition.word}</h3>
            {definition.phonetic && (
              <span className="text-gray-500 dark:text-gray-400">{definition.phonetic}</span>
            )}
          </div>

          <div className="space-y-3">
            {definition.meanings.map((meaning, i) => (
              <div key={i} className="space-y-1">
                <div className="text-amber-600 dark:text-amber-300 font-medium">
                  {meaning.partOfSpeech}
                </div>
                {meaning.definitions.slice(0, 2).map((def, j) => (
                  <div key={j} className="pl-3 space-y-1">
                    <div className="text-gray-900 dark:text-gray-100">{def.definition}</div>
                    {def.example && (
                      <div className="text-gray-500 dark:text-gray-400 italic">
                        &ldquo;{def.example}&rdquo;
                      </div>
                    )}
                    {def.synonyms && def.synonyms.length > 0 && (
                      <div className="text-gray-500 dark:text-gray-400">
                        Synonyms: {def.synonyms.slice(0, 3).join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 