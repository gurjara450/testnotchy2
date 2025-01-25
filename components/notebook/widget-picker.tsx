"use client";

import * as React from "react";
import { Plus, X, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { widgetRegistry } from "@/lib/widgets/registry";
import { Widget, WidgetInstance } from "@/lib/widgets/types";
import { cn } from "@/lib/utils";

interface WidgetPickerProps {
  activeWidgets: WidgetInstance[];
  onAddWidget: (widget: Widget) => void;
  onClose: () => void;
  onReset: () => void;
}

export function WidgetPicker({ activeWidgets, onAddWidget, onClose, onReset }: WidgetPickerProps) {
  const handleWidgetClick = React.useCallback((widget: Widget) => {
    const isActive = activeWidgets.some(w => w.widgetType === widget.type);
    if (!isActive) {
      onAddWidget(widget);
    }
  }, [activeWidgets, onAddWidget]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add Widgets</h2>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onReset}
              className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Default
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto max-h-[60vh]">
          {widgetRegistry.map((widget) => {
            const isActive = activeWidgets.some(w => w.widgetType === widget.type);
            
            return (
              <motion.div
                key={widget.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "relative group rounded-xl p-4 border-2 cursor-pointer transition-colors",
                  isActive 
                    ? "border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800/50"
                    : "border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  handleWidgetClick(widget);
                }}
              >
                <div className={cn(
                  "absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity",
                  isActive && "opacity-100"
                )}>
                  {isActive ? (
                    <span className="text-sm text-gray-500 dark:text-gray-300">Added</span>
                  ) : (
                    <Plus className="h-4 w-4 text-gray-500 dark:text-gray-300" />
                  )}
                </div>
                
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center mb-3",
                  `bg-${widget.color}-100 dark:bg-${widget.color}-900/30`
                )}>
                  <widget.icon className={cn(
                    "h-5 w-5",
                    `text-${widget.color}-600 dark:text-${widget.color}-300`
                  )} />
                </div>
                
                <h3 className="font-medium mb-1 text-gray-900 dark:text-gray-100">{widget.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {widget.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
} 