"use client";

import * as React from "react";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

interface Formula {
  id: string;
  name: string;
  category: string;
  latex: string;
  description: string;
}

export function FormulaWidget() {
  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [formulas, setFormulas] = React.useState<Formula[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  const fetchFormulas = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append("category", selectedCategory);
      if (search) params.append("query", search);
      
      const response = await fetch(`/api/formulas?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch formulas");
      
      const data = await response.json();
      setFormulas(data.formulas);
    } catch (err) {
      console.error("Error fetching formulas:", err);
      setError("Failed to load formulas. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory]);

  // Fetch formulas on mount and when search/category changes
  React.useEffect(() => {
    const debounceTimeout = setTimeout(fetchFormulas, 300);
    return () => clearTimeout(debounceTimeout);
  }, [fetchFormulas]);

  // Get unique categories from formulas
  const categories = React.useMemo(() => 
    Array.from(new Set(formulas.map(f => f.category))).sort(),
    [formulas]
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Search formulas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-white/20 dark:border-gray-800/20 focus:border-red-500/50 focus:ring-red-500/50 hover:border-red-500/30 dark:hover:border-red-500/30 rounded-xl text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedCategory(null)}
          className={cn(
            "hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 rounded-xl text-gray-700 dark:text-gray-200",
            !selectedCategory && "text-red-500 dark:text-red-400"
          )}
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {categories.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {categories.map(category => (
            <Button
              key={category}
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
              className={cn(
                "bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm border-white/20 dark:border-gray-800/20 text-xs hover:border-red-500/30 dark:hover:border-red-500/30 text-gray-700 dark:text-gray-200",
                category === selectedCategory
                  ? "text-red-500 dark:text-red-400 bg-red-500/10"
                  : "hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400"
              )}
            >
              {category}
            </Button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-red-500 dark:text-red-400" />
        </div>
      ) : error ? (
        <div className="text-center text-sm text-red-500 dark:text-red-400 py-4">
          {error}
        </div>
      ) : formulas.length === 0 ? (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
          No formulas found. Try a different search.
        </div>
      ) : (
        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
          {formulas.map(formula => (
            <div
              key={formula.id}
              className="p-3 rounded-xl bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm border border-white/20 dark:border-gray-800/20 hover:bg-white/40 dark:hover:bg-gray-900/40 hover:border-red-500/30 dark:hover:border-red-500/30 transition-colors group"
            >
              <div className="flex justify-between items-start mb-1">
                <div>
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors">{formula.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{formula.description}</div>
                </div>
                <div className="text-xs text-red-500 dark:text-red-400">{formula.category}</div>
              </div>
              <div className="mt-2 flex justify-center bg-white/50 dark:bg-gray-900/50 rounded-lg p-2 group-hover:bg-white/60 dark:group-hover:bg-gray-900/60 transition-colors">
                <div className="text-gray-900 dark:text-gray-100">
                  <InlineMath math={formula.latex} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 