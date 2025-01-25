"use client";

import * as React from "react";
import { Trash2, CheckCircle2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export function TodoWidget() {
  const [todos, setTodos] = React.useState<TodoItem[]>(() => {
    const saved = localStorage.getItem("student-todos");
    return saved ? JSON.parse(saved) : [];
  });
  const [newTodo, setNewTodo] = React.useState("");

  React.useEffect(() => {
    localStorage.setItem("student-todos", JSON.stringify(todos));
  }, [todos]);

  const addTodo = (text: string) => {
    if (text.trim()) {
      setTodos([...todos, { id: Date.now().toString(), text, completed: false }]);
      setNewTodo("");
    }
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Add new task..."
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              addTodo(newTodo);
            }
          }}
          className="h-8 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-white/20 dark:border-gray-800/20 focus:border-blue-500/50 focus:ring-blue-500/50 hover:border-blue-500/30 dark:hover:border-blue-500/30 rounded-xl text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
        />
        <Button 
          size="sm"
          variant="outline"
          onClick={() => addTodo(newTodo)}
          className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-white/20 dark:border-gray-800/20 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500/30 dark:hover:border-blue-500/30 rounded-xl text-gray-700 dark:text-gray-200"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <AnimatePresence mode="popLayout">
        {todos.map((todo) => (
          <motion.div
            layout
            key={todo.id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 group/item"
          >
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "flex-1 justify-start gap-2 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-gray-900/50 rounded-xl text-gray-900 dark:text-gray-100",
                todo.completed && "line-through opacity-50"
              )}
              onClick={() => toggleTodo(todo.id)}
            >
              <CheckCircle2 
                className={cn(
                  "h-4 w-4 transition-colors duration-300",
                  todo.completed ? "text-green-500 dark:text-green-400" : "text-gray-400 dark:text-gray-500"
                )}
              />
              <span>{todo.text}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover/item:opacity-100 transition-opacity h-8 w-8 hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 rounded-xl text-gray-400 dark:text-gray-500"
              onClick={() => deleteTodo(todo.id)}
            >
              <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
} 