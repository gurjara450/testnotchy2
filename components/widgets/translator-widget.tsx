"use client";

import * as React from "react";
import { Languages, ArrowDownUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
];

export function TranslatorWidget() {
  const [sourceText, setSourceText] = React.useState("");
  const [translatedText, setTranslatedText] = React.useState("");
  const [sourceLang, setSourceLang] = React.useState("en");
  const [targetLang, setTargetLang] = React.useState("es");
  const [loading, setLoading] = React.useState(false);

  const translate = async () => {
    if (!sourceText.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch("https://libretranslate.de/translate", {
        method: "POST",
        body: JSON.stringify({
          q: sourceText,
          source: sourceLang,
          target: targetLang,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Translation failed");

      const data = await response.json();
      setTranslatedText(data.translatedText);
    } catch (error) {
      console.error("Translation error:", error);
      setTranslatedText("Translation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const swapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  React.useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (sourceText) translate();
    }, 1000);

    return () => clearTimeout(debounceTimeout);
  }, [sourceText, sourceLang, targetLang]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Select value={sourceLang} onValueChange={setSourceLang}>
          <SelectTrigger className="h-8 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-white/20 dark:border-gray-800/20 focus:border-purple-500/50 focus:ring-purple-500/50 hover:border-purple-500/30 dark:hover:border-purple-500/30 rounded-xl text-gray-900 dark:text-gray-100">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-900 border-white/20 dark:border-gray-800/20">
            {LANGUAGES.map((lang) => (
              <SelectItem 
                key={lang.code} 
                value={lang.code} 
                className="text-gray-900 dark:text-gray-100 hover:bg-purple-500/10 dark:hover:bg-purple-500/10 focus:bg-purple-500/10 dark:focus:bg-purple-500/10"
              >
                {lang.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="sm"
          onClick={swapLanguages}
          className="hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400 rounded-xl text-gray-700 dark:text-gray-200"
        >
          <ArrowDownUp className="h-4 w-4" />
        </Button>

        <Select value={targetLang} onValueChange={setTargetLang}>
          <SelectTrigger className="h-8 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-white/20 dark:border-gray-800/20 focus:border-purple-500/50 focus:ring-purple-500/50 hover:border-purple-500/30 dark:hover:border-purple-500/30 rounded-xl text-gray-900 dark:text-gray-100">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-900 border-white/20 dark:border-gray-800/20">
            {LANGUAGES.map((lang) => (
              <SelectItem 
                key={lang.code} 
                value={lang.code} 
                className="text-gray-900 dark:text-gray-100 hover:bg-purple-500/10 dark:hover:bg-purple-500/10 focus:bg-purple-500/10 dark:focus:bg-purple-500/10 data-[selected=true]:bg-purple-500/20 dark:data-[selected=true]:bg-purple-500/20"
              >
                {lang.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Textarea
          placeholder="Enter text to translate..."
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          className="h-20 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-white/20 dark:border-gray-800/20 focus:border-purple-500/50 focus:ring-purple-500/50 hover:border-purple-500/30 dark:hover:border-purple-500/30 rounded-xl resize-none text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
        />
        
        <div className="relative">
          <Textarea
            value={translatedText}
            readOnly
            className="h-20 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-white/20 dark:border-gray-800/20 focus:border-purple-500/50 focus:ring-purple-500/50 hover:border-purple-500/30 dark:hover:border-purple-500/30 rounded-xl resize-none text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            placeholder="Translation will appear here..."
          />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-white/5 backdrop-blur-sm rounded-xl">
              <Languages className="h-5 w-5 animate-spin text-purple-500 dark:text-purple-400" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 