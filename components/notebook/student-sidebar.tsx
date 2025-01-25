"use client"

import * as React from "react"
import { PanelRightOpen, Plus, GraduationCap, Pin, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Tooltip } from "@nextui-org/react"
import { Widget, WidgetInstance } from "@/lib/widgets/types"
import { widgetRegistry } from "@/lib/widgets/registry"
import { WidgetPicker } from "./widget-picker"
import { GeistSans } from 'geist/font/sans'

interface StudentSidebarProps {
  className?: string
  isFixed?: boolean
  onToggleFixed?: () => void
}

export function StudentSidebar({ className, isFixed, onToggleFixed }: StudentSidebarProps) {
  const getDefaultWidgets = () => {
    return widgetRegistry.slice(0, 4).map((widget, index) => ({
      id: `${widget.type}-${index}`,
      widgetType: widget.type,
      position: index
    }))
  }

  const [mounted, setMounted] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(isFixed || false)
  const [showWidgetPicker, setShowWidgetPicker] = React.useState(false)
  const [activeWidgets, setActiveWidgets] = React.useState<WidgetInstance[]>(getDefaultWidgets())

  // Handle hydration and localStorage after mount
  React.useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem("active-widgets")
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          setActiveWidgets(parsed)
        }
      }
    } catch (error) {
      console.error("Error loading widgets:", error)
    }
  }, [])

  // Save active widgets to localStorage
  React.useEffect(() => {
    if (!mounted) return
    
    try {
      localStorage.setItem("active-widgets", JSON.stringify(activeWidgets))
    } catch (error) {
      console.error("Error saving widgets:", error)
    }
  }, [activeWidgets, mounted])

  const resetToDefaultWidgets = () => {
    setActiveWidgets(getDefaultWidgets())
    setShowWidgetPicker(false)
  }

  const handleAddWidget = (widget: Widget) => {
    setActiveWidgets(prev => [
      ...prev,
      {
        id: `${widget.type}-${Date.now()}`,
        widgetType: widget.type,
        position: prev.length
      }
    ])
  }

  const handleRemoveWidget = React.useCallback((widgetId: string) => {
    setActiveWidgets(prev => {
      const updatedWidgets = prev.filter(w => w.id !== widgetId);
      return updatedWidgets.map((widget, index) => ({
        ...widget,
        position: index
      }));
    });
  }, []);

  // Update isOpen when isFixed changes
  React.useEffect(() => {
    if (isFixed) {
      setIsOpen(true)
    }
  }, [isFixed])

  // Only render client-side content after hydration
  if (!mounted) {
    return (
      <div className={cn(
        "absolute right-0 h-full w-80",
        "flex flex-col overflow-hidden",
        "bg-gradient-to-b from-white/80 to-white/60 dark:from-gray-950/80 dark:to-gray-950/60",
        "text-gray-900 dark:text-gray-100",
        "backdrop-blur-xl",
        !isFixed && [
          "border-l border-white/20 dark:border-gray-800/20",
          "shadow-[0_0_15px_rgba(0,0,0,0.1)] dark:shadow-[0_0_15px_rgba(0,0,0,0.3)]",
          "rounded-l-3xl"
        ],
        isFixed && "h-screen",
        className,
        GeistSans.className
      )} />
    )
  }

  return (
    <AnimatePresence mode="sync">
      {(!isOpen && !isFixed) ? (
        <motion.div
          key="toggle-button"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed right-8 top-1/2 -translate-y-1/2 z-[60]"
        >
          <Tooltip
            content="Open Student Tools"
            placement="left"
            showArrow
            className="text-sm"
          >
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "rounded-full shadow-md backdrop-blur-md bg-white/50 dark:bg-gray-950/50 hover:bg-white/80 dark:hover:bg-gray-950/80 border-none",
                "hover:scale-110 transition-transform duration-200"
              )}
              onClick={() => setIsOpen(true)}
            >
              <PanelRightOpen className="h-4 w-4 text-gray-600 dark:text-gray-200" />
            </Button>
          </Tooltip>
        </motion.div>
      ) : (
        <motion.div 
          key="sidebar-content" 
          className={cn(
            "fixed inset-y-0 right-0 z-[60]",
            "w-full sm:w-80",
            !isFixed && "pointer-events-none"
          )}
          initial={false}
        >
          {!isFixed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm pointer-events-auto"
              onClick={() => setIsOpen(false)}
            />
          )}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
            className={cn(
              "absolute right-0 h-full w-full sm:w-80",
              "flex flex-col",
              "bg-gradient-to-b from-white/80 to-white/60 dark:from-gray-950/80 dark:to-gray-950/60",
              "backdrop-blur-xl pointer-events-auto",
              !isFixed && [
                "border-l border-white/20 dark:border-gray-800/20",
                "shadow-[0_0_15px_rgba(0,0,0,0.1)] dark:shadow-[0_0_15px_rgba(0,0,0,0.3)]",
                "rounded-l-3xl"
              ],
              isFixed && "h-screen",
              className,
              GeistSans.className
            )}
          >
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.2 }}
              className="relative flex items-center justify-between p-4 border-b border-white/10 dark:border-gray-800/10"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-pink-500/40 to-purple-500/40 dark:from-pink-400/30 dark:to-purple-400/30 blur-sm"
                  />
                  <GraduationCap className="relative h-6 w-6 text-purple-600 dark:text-purple-300" />
                </div>
                <motion.h2 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.2 }}
                  className="font-semibold bg-gradient-to-r from-pink-500 to-purple-500 dark:from-pink-300 dark:to-purple-300 bg-clip-text text-transparent"
                >
                  Student Tools
                </motion.h2>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowWidgetPicker(true)}
                  className="hover:bg-white/10 dark:hover:bg-gray-800/20 hover:scale-110 transition-transform duration-200 rounded-full"
                >
                  <Plus className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                </Button>
                <Tooltip
                  content={isFixed ? "Make Floating" : "Fix in Place"}
                  placement="left"
                  showArrow
                  className="text-sm"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleFixed}
                    className="hover:bg-white/10 dark:hover:bg-gray-800/20 hover:scale-110 transition-transform duration-200 rounded-full"
                  >
                    {isFixed ? (
                      <PanelRightOpen className="h-4 w-4 rotate-0 text-gray-700 dark:text-gray-300" />
                    ) : (
                      <Pin className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                    )}
                  </Button>
                </Tooltip>
              </div>
            </motion.div>

            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto px-4 pt-2 pb-6">
                <motion.div 
                  className="space-y-6"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <AnimatePresence mode="popLayout">
                    {activeWidgets.map((widgetInstance) => {
                      const widgetDef = widgetRegistry.find(w => w.type === widgetInstance.widgetType)
                      if (!widgetDef) return null

                      const WidgetComponent = widgetDef.component
                      return (
                        <motion.div
                          key={widgetInstance.id}
                          layout
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ 
                            duration: 0.2,
                            layout: { duration: 0.2 }
                          }}
                          className="group"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3 font-medium">
                              <div className="relative transition-all duration-300 group-hover:scale-110">
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className={cn(
                                    "absolute -inset-1 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity",
                                    `bg-gradient-to-r from-${widgetDef.color}-500/40 to-${widgetDef.color}-400/40`
                                  )}
                                />
                                <widgetDef.icon className={cn(
                                  "relative h-4 w-4",
                                  `text-${widgetDef.color}-500 dark:text-${widgetDef.color}-400`
                                )} />
                              </div>
                              <span className={cn(
                                `text-${widgetDef.color}-600 dark:text-${widgetDef.color}-300`,
                                "font-medium"
                              )}>{widgetDef.title}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-red-500/10 dark:hover:bg-red-500/20 hover:scale-110 transition-all duration-200 rounded-full opacity-0 group-hover:opacity-100"
                              onClick={() => handleRemoveWidget(widgetInstance.id)}
                            >
                              <span className="sr-only">Remove widget</span>
                              <X className="h-4 w-4 text-red-500 dark:text-red-400" />
                            </Button>
                          </div>
                          <div className="relative">
                            <WidgetComponent {...widgetInstance.props} />
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </motion.div>
              </div>
            </div>

            <style jsx global>{`
              :root {
                --removed-body-scroll-bar-size: 0px;
              }
              
              .custom-scrollbar {
                scrollbar-width: thin;
                scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
                -webkit-overflow-scrolling: touch;
              }
              .custom-scrollbar::-webkit-scrollbar {
                width: 3px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: transparent;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: rgba(0, 0, 0, 0.2);
                border-radius: 10px;
              }
              .dark .custom-scrollbar {
                scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
              }
              .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.2);
              }
              
              @media (hover: hover) {
                .custom-scrollbar::-webkit-scrollbar {
                  width: 3px;
                }
                .custom-scrollbar:hover::-webkit-scrollbar {
                  width: 3px;
                }
              }
            `}</style>
          </motion.div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {showWidgetPicker && (
          <WidgetPicker
            activeWidgets={activeWidgets}
            onAddWidget={handleAddWidget}
            onClose={() => setShowWidgetPicker(false)}
            onReset={resetToDefaultWidgets}
          />
        )}
      </AnimatePresence>
    </AnimatePresence>
  )
}