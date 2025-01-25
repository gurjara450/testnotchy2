import { Button } from "@/components/ui/button";
import { GeistSans } from 'geist/font/sans';
import { Maximize2, Minimize2, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { Modak } from 'next/font/google';
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import Image from "next/image";

const modak = Modak({
  weight: '400',
  subsets: ['latin'],
});

interface HeaderProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  notebookName: string;
  onNameChange?: (newName: string) => void;
}

export function Header({ isDarkMode, toggleDarkMode, notebookName, onNameChange }: HeaderProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(notebookName);

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  useEffect(() => {
    setEditedName(notebookName);
  }, [notebookName]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleNameSubmit = () => {
    if (editedName.trim() && onNameChange && editedName.trim() !== notebookName) {
      onNameChange(editedName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditedName(notebookName);
    }
  };

  const handleNameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const renderNameInput = () => (
    <Input
      value={editedName}
      onChange={(e) => setEditedName(e.target.value)}
      onBlur={handleNameSubmit}
      onKeyDown={handleKeyDown}
      className={cn(
        "h-8 min-w-[200px] max-w-[300px] bg-transparent text-2xl text-center",
        "border border-black/20 dark:border-white/20",
        "focus:border-black/40 dark:focus:border-white/40 rounded-full",
        "focus:outline-none focus:ring-0 focus:ring-offset-0",
        "text-black dark:text-white",
        modak.className
      )}
      autoFocus
      onClick={(e) => e.stopPropagation()}
    />
  );

  const renderNameText = () => (
    <motion.h1 
      className={cn(
        "text-2xl text-center leading-none tracking-wide",
        "cursor-pointer hover:opacity-80 transition-opacity",
        "text-black dark:text-white",
        modak.className
      )}
      onClick={handleNameClick}
    >
      {notebookName}
    </motion.h1>
  );

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("bg-transparent py-2 px-4", GeistSans.className)}
    >
      <div className="flex justify-center items-center">
        <motion.div 
          className={cn(
            "backdrop-blur-sm rounded-full transition-all duration-500 flex items-center",
            isHovered 
              ? "px-10 py-3 min-w-[300px]" 
              : "px-4 py-2 min-w-[200px]"
          )}
          style={{
            transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false);
            if (!isEditing) {
              setEditedName(notebookName);
            }
          }}
          whileHover={{ 
            scale: 1.05,
            boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)"
          }}
          layout
        >
          <div className="mr-3">
            <Image
              src="/images/swan-logo.png"
              alt="Swan Logo"
              width={24}
              height={24}
              className="dark:invert"
            />
          </div>
          {isHovered ? (
            <motion.div 
              className="flex items-center justify-between gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDarkMode();
                }}
                className="text-black/90 dark:text-white/90 hover:text-black dark:hover:text-white"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isDarkMode ? 'sun' : 'moon'}
                    initial={{ opacity: 0, rotate: -180 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 180 }}
                    transition={{ duration: 0.3 }}
                  >
                    {isDarkMode ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
                  </motion.div>
                </AnimatePresence>
              </motion.button>
              {isEditing ? renderNameInput() : renderNameText()}
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-black/90 dark:text-white/90 hover:text-black dark:hover:text-white p-0 h-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFullScreen();
                  }}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={isFullScreen ? 'minimize' : 'maximize'}
                      initial={{ opacity: 0, rotate: -180, scale: 0.5 }}
                      animate={{ opacity: 1, rotate: 0, scale: 1 }}
                      exit={{ opacity: 0, rotate: 180, scale: 0.5 }}
                      transition={{ duration: 0.3 }}
                    >
                      {isFullScreen ? <Minimize2 className="h-[18px] w-[18px]" /> : <Maximize2 className="h-[18px] w-[18px]" />}
                    </motion.div>
                  </AnimatePresence>
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            isEditing ? renderNameInput() : renderNameText()
          )}
        </motion.div>
      </div>
    </motion.header>
  );
}