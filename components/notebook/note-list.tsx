import * as React from 'react'
import { Button } from "@/components/ui/button"
import { 
  Search, X, Download, Edit2,
  Star, Hash, Grid, Square, Circle, Type, Settings, RefreshCw, FileText
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import NoteCard from './NoteCard'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { Slider } from "@/components/ui/slider"
import { Select, SelectItem } from "@nextui-org/react"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useOutsideClick } from "@/hooks/use-outside-click"
import { MCQNoteCard } from './mcq-note-card'
import { FlashcardNoteCard } from './flashcard-note-card'
import { Note } from '@/lib/types'
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu"
import debounce from 'lodash/debounce'
import { useTheme } from "next-themes"
import { MagicCard } from "@/components/ui/magic-card"

interface NoteListProps {
  notes: Note[]
  onDelete: (id: number) => void
  onPin: (id: number) => void
  onUpdateStyle?: (id: number, updates: Partial<Note>) => void
}

interface FilterState {
  search: string
  backgrounds: Set<string>
  fonts: Set<string>
  pinned: 'all' | 'pinned' | 'unpinned'
}

export function NoteList({ notes, onDelete, onPin, onUpdateStyle }: NoteListProps) {
  const [previewNote, setPreviewNote] = React.useState<(Note & { displayId?: number }) | null>(null)
  const [isEditing, setIsEditing] = React.useState(false)
  const [editedContent, setEditedContent] = React.useState("")
  const [lineHeight, setLineHeight] = React.useState(1.5)
  const [letterSpacing, setLetterSpacing] = React.useState(0)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const previewRef = React.useRef<HTMLDivElement>(null)
  const id = React.useId()
  const { theme } = useTheme()

  const debouncedStyleUpdate = React.useCallback(
    debounce((updates: Partial<Note>) => {
      if (previewNote && onUpdateStyle) {
        onUpdateStyle(previewNote.id, updates);
      }
    }, 500),
    [previewNote, onUpdateStyle]
  );

  const handleStyleChange = React.useCallback((updates: Partial<Note>) => {
    if (previewNote) {
      setPreviewNote(prev => prev ? { ...prev, ...updates } : null);
      debouncedStyleUpdate(updates);
    }
  }, [previewNote, debouncedStyleUpdate]);

  const handleEditClick = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  }, []);

  const handleCancelEdit = React.useCallback(() => {
    setIsEditing(false);
    setEditedContent(previewNote?.content || "");
  }, [previewNote]);

  const handleSaveEdit = React.useCallback(() => {
    if (previewNote && onUpdateStyle) {
      onUpdateStyle(previewNote.id, { content: editedContent });
      setPreviewNote(prev => prev ? { ...prev, content: editedContent } : null);
      setIsEditing(false);
    }
  }, [previewNote, editedContent, onUpdateStyle]);

  const closePreview = React.useCallback(() => {
    if (!isEditing) {
      setPreviewNote(null);
      setIsEditing(false);
      setEditedContent("");
    }
  }, [isEditing]);

  useOutsideClick(previewRef, () => {
    if (previewNote && !isEditing) {
      setPreviewNote(null)
    }
  })

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isEditing) {
        setPreviewNote(null)
      }
    }

    if (previewNote) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [previewNote, isEditing])

  const [filters, setFilters] = React.useState<FilterState>({
    search: '',
    backgrounds: new Set(),
    fonts: new Set(),
    pinned: 'all'
  })
  const [isSearchExpanded, setIsSearchExpanded] = React.useState(false);
  const searchRef = React.useRef<HTMLDivElement>(null);

  // Close search on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleBackground = (background: string) => {
    setFilters(prev => {
      const newBackgrounds = new Set(prev.backgrounds);
      if (newBackgrounds.has(background)) {
        newBackgrounds.delete(background);
      } else {
        newBackgrounds.add(background);
      }
      return { ...prev, backgrounds: newBackgrounds };
    });
  };

  const toggleFont = (font: string) => {
    setFilters(prev => {
      const newFonts = new Set(prev.fonts);
      if (newFonts.has(font)) {
        newFonts.delete(font);
      } else {
        newFonts.add(font);
      }
      return { ...prev, fonts: newFonts };
    });
  };

  if (!notes) {
    return null;
  }

  const filteredNotes = notes.filter(note => {
    // Search filter
    if (filters.search && !note.content.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }

    // Pinned status filter
    if (filters.pinned === 'pinned' && !note.pinned) {
      return false;
    }
    if (filters.pinned === 'unpinned' && note.pinned) {
      return false;
    }

    return true;
  });

  const pinnedNotes = filteredNotes.filter(note => note.pinned)
  const unpinnedNotes = filteredNotes.filter(note => !note.pinned)

  const openNotePreview = (note: Note) => {
    setPreviewNote(note)
    setEditedContent(note.content)
    setLineHeight(note.lineHeight || 1.5)
    setLetterSpacing(note.letterSpacing || 0)
    setIsEditing(false)
  }

  const backgroundStyles = {
    plain: 'bg-white dark:bg-black',
    ruled: `bg-white dark:bg-black [background-image:linear-gradient(transparent_calc(1.5rem_-_1px),#94a3b8_calc(1.5rem_-_1px),#94a3b8_1.5rem,transparent_1.5rem),linear-gradient(#e2e8f0_1px,transparent_1px)] [background-size:100%_1.5rem,100%_0.375rem] [background-attachment:local] [background-position:0_1.5rem]`,
    dotted: `bg-white dark:bg-black [background-image:radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px] [background-attachment:local] [background-position:0_0]`,
    grid: `bg-white dark:bg-black [background-image:linear-gradient(#94a3b8_1px,transparent_1px),linear-gradient(to_right,#94a3b8_1px,transparent_1px)] [background-size:20px_20px] [background-attachment:local] [background-position:0_0]`,
  };

  const fontStyles = {
    default: 'font-sans',
    handwritten1: 'font-caveat',
    handwritten2: 'font-kalam',
    casual: 'font-architects-daughter',
    indie: 'font-indie-flower',
    shadows: 'font-shadows-into-light',
    apple: 'font-homemade-apple',
    patrick: 'font-patrick-hand',
  };

  // Add SVG background patterns
  const getSVGBackground = (type: string) => {
    switch (type) {
      case 'ruled':
        return `data:image/svg+xml,${encodeURIComponent(`
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="ruled" width="100%" height="24" patternUnits="userSpaceOnUse">
                <line x1="0" y1="23" x2="100%" y2="23" stroke="#94a3b8" stroke-width="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="white"/>
            <rect width="100%" height="100%" fill="url(#ruled)"/>
          </svg>
        `)}`;
      case 'dotted':
        return `data:image/svg+xml,${encodeURIComponent(`
          <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
            <circle cx="8" cy="8" r="1" fill="#94a3b8"/>
          </svg>
        `)}`;
      case 'grid':
        return `data:image/svg+xml,${encodeURIComponent(`
          <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#94a3b8" stroke-width="1"/>
              </pattern>
            </defs>
            <rect width="20" height="20" fill="white"/>
            <rect width="20" height="20" fill="url(#grid)"/>
          </svg>
        `)}`;
      default:
        return '';
    }
  };

  const downloadAsImage = async () => {
    if (!contentRef.current || !previewNote) {
      console.error('Download failed: contentRef or previewNote is null');
      return;
    }

    try {
      // Create a temporary container
      const container = document.createElement('div');
      container.style.width = '800px';
      container.style.backgroundColor = 'white';
      container.style.padding = '40px';
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      container.style.overflow = 'hidden';
      
      // Create the content wrapper with background
      const wrapper = document.createElement('div');
      wrapper.style.backgroundColor = 'white';
      wrapper.style.padding = '40px';
      wrapper.style.minHeight = '100%';
      wrapper.style.position = 'relative';
      
      // Apply SVG background
      if (previewNote.background && previewNote.background !== 'plain') {
        const svgBackground = getSVGBackground(previewNote.background);
        wrapper.style.backgroundImage = `url("${svgBackground}")`;
        wrapper.style.backgroundRepeat = 'repeat';
        wrapper.style.backgroundSize = previewNote.background === 'ruled' ? '100% 24px' : 'auto';
      }
      
      // Create the content div with font styles
      const content = document.createElement('div');
      content.className = previewNote.font ? fontStyles[previewNote.font as keyof typeof fontStyles] : 'font-sans';
      content.style.color = 'black';
      content.style.lineHeight = `${previewNote.lineHeight || lineHeight}em`;
      content.style.letterSpacing = `${previewNote.letterSpacing || letterSpacing}px`;
      content.style.whiteSpace = 'pre-wrap';
      content.style.wordBreak = 'break-word';
      content.style.fontSize = '16px';
      content.style.position = 'relative';
      content.style.zIndex = '1';
      content.innerHTML = previewNote.content;
      
      wrapper.appendChild(content);
      container.appendChild(wrapper);
      document.body.appendChild(container);

      // Wait for fonts and images to load
      await Promise.all([
        document.fonts.ready,
        new Promise(resolve => setTimeout(resolve, 500)) // Give time for SVG to render
      ]);
      
      const canvas = await html2canvas(wrapper, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: 'white',
        logging: true,
        width: wrapper.offsetWidth,
        height: wrapper.offsetHeight,
        onclone: (clonedDoc) => {
          const clonedWrapper = clonedDoc.querySelector('div');
          if (clonedWrapper && previewNote.background && previewNote.background !== 'plain') {
            const svgBackground = getSVGBackground(previewNote.background);
            clonedWrapper.style.backgroundImage = `url("${svgBackground}")`;
            clonedWrapper.style.backgroundRepeat = 'repeat';
            clonedWrapper.style.backgroundSize = previewNote.background === 'ruled' ? '100% 24px' : 'auto';
          }
        }
      });
      
      document.body.removeChild(container);
      
      const link = document.createElement('a');
      link.download = `note-${previewNote.id}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };

  const downloadAsPDF = async () => {
    if (!contentRef.current || !previewNote) {
      console.error('Download failed: contentRef or previewNote is null');
      return;
    }

    try {
      // Create a temporary container
      const container = document.createElement('div');
      container.style.width = '800px';
      container.style.backgroundColor = 'white';
      container.style.padding = '40px';
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      container.style.overflow = 'hidden';
      
      // Create the content wrapper with background
      const wrapper = document.createElement('div');
      wrapper.style.backgroundColor = 'white';
      wrapper.style.padding = '40px';
      wrapper.style.minHeight = '100%';
      wrapper.style.position = 'relative';
      
      // Apply SVG background
      if (previewNote.background && previewNote.background !== 'plain') {
        const svgBackground = getSVGBackground(previewNote.background);
        wrapper.style.backgroundImage = `url("${svgBackground}")`;
        wrapper.style.backgroundRepeat = 'repeat';
        wrapper.style.backgroundSize = previewNote.background === 'ruled' ? '100% 24px' : 'auto';
      }
      
      // Create the content div with font styles
      const content = document.createElement('div');
      content.className = previewNote.font ? fontStyles[previewNote.font as keyof typeof fontStyles] : 'font-sans';
      content.style.color = 'black';
      content.style.lineHeight = `${previewNote.lineHeight || lineHeight}em`;
      content.style.letterSpacing = `${previewNote.letterSpacing || letterSpacing}px`;
      content.style.whiteSpace = 'pre-wrap';
      content.style.wordBreak = 'break-word';
      content.style.fontSize = '16px';
      content.style.position = 'relative';
      content.style.zIndex = '1';
      content.innerHTML = previewNote.content;
      
      wrapper.appendChild(content);
      container.appendChild(wrapper);
      document.body.appendChild(container);

      // Wait for fonts and images to load
      await Promise.all([
        document.fonts.ready,
        new Promise(resolve => setTimeout(resolve, 500)) // Give time for SVG to render
      ]);
      
      // Calculate dimensions
      const contentHeight = wrapper.scrollHeight;
      const pageHeight = 1123; // A4 height in pixels at 96 DPI
      const numPages = Math.ceil(contentHeight / pageHeight);
      
      // Create PDF with better quality settings
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4',
        compress: true,
        hotfixes: ['px_scaling']
      });
      
      // Generate each page
      for (let page = 0; page < numPages; page++) {
        if (page > 0) {
          pdf.addPage();
        }
        
        const canvas = await html2canvas(wrapper, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: 'white',
          logging: true,
          width: wrapper.offsetWidth,
          height: Math.min(pageHeight, contentHeight - (page * pageHeight)),
          windowHeight: contentHeight,
          y: page * pageHeight,
          onclone: (clonedDoc) => {
            const clonedWrapper = clonedDoc.querySelector('div');
            if (clonedWrapper && previewNote.background && previewNote.background !== 'plain') {
              const svgBackground = getSVGBackground(previewNote.background);
              clonedWrapper.style.backgroundImage = `url("${svgBackground}")`;
              clonedWrapper.style.backgroundRepeat = 'repeat';
              clonedWrapper.style.backgroundSize = previewNote.background === 'ruled' ? '100% 24px' : 'auto';
            }
          }
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        pdf.addImage(imgData, 'JPEG', 0, 0, pdf.internal.pageSize.getWidth(), 0, '', 'FAST');
      }
      
      document.body.removeChild(container);
      pdf.save(`note-${previewNote.id}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="mb-8 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Enhanced Search Bar */}
          <div ref={searchRef} className="relative">
            <motion.div 
              initial={false}
              className="relative flex items-center rounded-2xl backdrop-blur-lg border border-gray-200/10 dark:border-gray-700/10 shadow-lg shadow-black/5"
              animate={{ 
                width: isSearchExpanded ? "16rem" : "2.5rem",
                backgroundColor: isSearchExpanded ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.02)",
              }}
              transition={{ 
                duration: 0.3, 
                ease: [0.23, 1, 0.32, 1],
                backgroundColor: { duration: 0.2 }
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-blue-500/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5 rounded-2xl transition-all duration-300" />
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-20">
                <motion.button
                  onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                  className="flex items-center justify-center w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200"
                  whileHover={{ scale: 1.1, rotate: 15 }}
                  whileTap={{ scale: 0.9 }}
                  animate={{ 
                    rotate: isSearchExpanded ? 0 : 360,
                    color: isSearchExpanded ? "rgb(59, 130, 246)" : "currentColor" 
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <Search className="h-4 w-4" />
                </motion.button>
              </div>
              <motion.div
                initial={false}
                animate={{
                  width: isSearchExpanded ? "100%" : "0%",
                  opacity: isSearchExpanded ? 1 : 0
                }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="relative z-10 overflow-hidden"
              >
                <Input
                  placeholder="Search notes..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className={cn(
                    "pl-8 h-8 bg-transparent border-none shadow-none focus:ring-0",
                    "text-gray-700 dark:text-gray-300",
                    "placeholder-gray-400/70 dark:placeholder-gray-500/70",
                    !isSearchExpanded && "pointer-events-none"
                  )}
                  disabled={!isSearchExpanded}
                />
              </motion.div>
            </motion.div>
          </div>

          {/* Filter Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="gap-2 bg-white/5 dark:bg-gray-800/5 border-gray-200/20 dark:border-gray-700/20 rounded-xl hover:bg-gray-100/10 dark:hover:bg-gray-700/10 backdrop-blur-md"
              >
                <motion.div
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.3 }}
                >
                  <Settings className="h-4 w-4" />
                </motion.div>
                <span>Filters</span>
                {(filters.backgrounds.size > 0 || filters.fonts.size > 0 || filters.pinned !== 'all') && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500/20 text-blue-600 text-xs font-medium">
                    {filters.backgrounds.size + filters.fonts.size + (filters.pinned !== 'all' ? 1 : 0)}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-72 p-4 bg-white/95 dark:bg-gray-800/95 rounded-2xl backdrop-blur-xl border border-gray-100 dark:border-gray-700 z-[110]"
              sideOffset={8}
            >
              <div className="space-y-4">
                {/* Pin Status Section */}
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Pin Status
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'all', label: 'All' },
                      { value: 'pinned', label: 'Pinned' },
                      { value: 'unpinned', label: 'Unpinned' }
                    ].map(({ value, label }) => (
                      <Button
                        key={value}
                        variant={filters.pinned === value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilters(prev => ({ ...prev, pinned: value as 'all' | 'pinned' | 'unpinned' }))}
                        className={`w-full rounded-xl ${
                          filters.pinned === value 
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' 
                            : 'hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />

                {/* Background Style Section */}
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    <Grid className="h-4 w-4 text-blue-500" />
                    Background Style
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'plain', label: 'Plain', icon: Square },
                      { value: 'ruled', label: 'Ruled', icon: FileText },
                      { value: 'dotted', label: 'Dotted', icon: Circle },
                      { value: 'grid', label: 'Grid', icon: Grid }
                    ].map(({ value, label, icon: Icon }) => (
                      <Button
                        key={value}
                        variant={filters.backgrounds.has(value) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleBackground(value)}
                        className={`w-full flex items-center gap-2 rounded-xl ${
                          filters.backgrounds.has(value)
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
                            : 'hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />

                {/* Font Style Section */}
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    <Type className="h-4 w-4 text-purple-500" />
                    Font Style
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'default', label: 'Default' },
                      { value: 'handwritten1', label: 'Script 1' },
                      { value: 'handwritten2', label: 'Script 2' },
                      { value: 'casual', label: 'Casual' }
                    ].map(({ value, label }) => (
                      <Button
                        key={value}
                        variant={filters.fonts.has(value) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleFont(value)}
                        className={`w-full rounded-xl ${
                          filters.fonts.has(value)
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                            : 'hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Active Filters */}
        <AnimatePresence>
          {(filters.search || filters.backgrounds.size > 0 || filters.fonts.size > 0 || filters.pinned !== 'all') && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-wrap items-center gap-2"
            >
              {filters.search && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="group"
                >
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm">
                    <Search className="h-3 w-3" />
                    <span className="max-w-[150px] truncate">{filters.search}</span>
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                      className="ml-1 p-1 rounded-md hover:bg-blue-500/20 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </motion.div>
              )}

              {filters.pinned !== 'all' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="group"
                >
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-sm">
                    <Star className="h-3 w-3" />
                    <span>{filters.pinned === 'pinned' ? 'Pinned' : 'Unpinned'}</span>
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, pinned: 'all' }))}
                      className="ml-1 p-1 rounded-md hover:bg-yellow-500/20 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </motion.div>
              )}

              {Array.from(filters.backgrounds).map(bg => (
                <motion.div
                  key={bg}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="group"
                >
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 text-sm">
                    <Grid className="h-3 w-3" />
                    <span>{bg.charAt(0).toUpperCase() + bg.slice(1)}</span>
                    <button
                      onClick={() => toggleBackground(bg)}
                      className="ml-1 p-1 rounded-md hover:bg-green-500/20 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </motion.div>
              ))}

              {Array.from(filters.fonts).map(font => (
                <motion.div
                  key={font}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="group"
                >
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 text-sm">
                    <Type className="h-3 w-3" />
                    <span>
                      {font === 'default' ? 'Default' :
                       font === 'handwritten1' ? 'Script 1' :
                       font === 'handwritten2' ? 'Script 2' :
                       'Casual'}
                    </span>
                    <button
                      onClick={() => toggleFont(font)}
                      className="ml-1 p-1 rounded-md hover:bg-purple-500/20 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </motion.div>
              ))}

              {/* Clear All Button */}
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setFilters({
                  search: '',
                  backgrounds: new Set(),
                  fonts: new Set(),
                  pinned: 'all'
                })}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-500/10 text-gray-600 dark:text-gray-400 text-sm hover:bg-gray-500/20 transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Clear All</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Notes Grid with Animation */}
      <AnimatePresence mode="wait">
        {filteredNotes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <MagicCard
              className="flex h-64 items-center justify-center"
              gradientColor={theme === "dark" ? "#262626" : "#D9D9D955"}
            >
              <p className="text-xl text-gray-400 dark:text-gray-500">
                {notes.length === 0 ? "Your saved notes will appear here" : "No notes match your filters"}
              </p>
            </MagicCard>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {pinnedNotes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="flex items-center gap-2 text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Pinned Notes
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pinnedNotes.map((note, index) => (
                    <motion.div
                      key={note.id}
                      layoutId={`card-${note.id}-${id}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="cursor-pointer"
                    >
                      <NoteCard
                        note={{
                          ...note,
                          displayId: index + 1
                        }}
                        onDelete={onDelete}
                        onPin={onPin}
                        onPreview={openNotePreview}
                        onUpdateStyle={onUpdateStyle}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {unpinnedNotes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="flex items-center gap-2 text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
                  <Hash className="h-5 w-5 text-gray-400" />
                  Other Notes
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {unpinnedNotes.map((note, index) => (
                    <motion.div
                      key={note.id}
                      layoutId={`card-${note.id}-${id}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="cursor-pointer"
                    >
                      <NoteCard
                        note={{
                          ...note,
                          displayId: pinnedNotes.length + index + 1
                        }}
                        onDelete={onDelete}
                        onPin={onPin}
                        onPreview={openNotePreview}
                        onUpdateStyle={onUpdateStyle}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewNote && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm h-full w-full z-[99]"
              onClick={closePreview}
            />
            <div className="fixed inset-0 grid place-items-center z-[100] p-4 pointer-events-none">
              <motion.div
                layoutId={`card-${previewNote.id}-${id}`}
                ref={previewRef}
                className="w-full max-w-4xl h-[90vh] flex flex-col backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl border border-white/20 dark:border-gray-800/20 pointer-events-auto"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/10 dark:border-gray-800/10 bg-white/95 dark:bg-black/95">
                  <div className="flex items-center gap-4">
                    <motion.h2 className="text-2xl font-medium text-gray-800 dark:text-gray-200">
                      Note {previewNote.displayId || previewNote.id}
                    </motion.h2>
                    {!isEditing && !previewNote.content.includes('---MCQ_NOTE_START---') && !previewNote.content.includes('---FLASHCARD_NOTE_START---') ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleEditClick}
                          className="flex items-center gap-2 hover:bg-blue-500/10 text-blue-500"
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit
                        </Button>
                        <div className="flex items-center gap-2">
                          <Select
                            label="Background"
                            placeholder="Select background"
                            className="w-32"
                            selectedKeys={previewNote.background ? [previewNote.background] : []}
                            onSelectionChange={(keys) => {
                              const selected = Array.from(keys)[0] as string;
                              if (selected) {
                                const newBackground = selected as 'plain' | 'ruled' | 'dotted' | 'grid';
                                handleStyleChange({ background: newBackground });
                              }
                            }}
                          >
                            {[
                              { key: "plain", label: "Plain" },
                              { key: "ruled", label: "Ruled" },
                              { key: "dotted", label: "Dotted" },
                              { key: "grid", label: "Grid" }
                            ].map((option) => (
                              <SelectItem key={option.key} value={option.key}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </Select>
                          <Select
                            label="Font Style"
                            placeholder="Select font"
                            className="w-32"
                            selectedKeys={previewNote.font ? [previewNote.font] : []}
                            onSelectionChange={(keys) => {
                              const selected = Array.from(keys)[0] as string;
                              if (selected) {
                                const newFont = selected as Note['font'];
                                handleStyleChange({ font: newFont });
                              }
                            }}
                          >
                            {[
                              { key: "default", label: "Default Font" },
                              { key: "handwritten1", label: "Caveat" },
                              { key: "handwritten2", label: "Kalam" },
                              { key: "casual", label: "Architects Daughter" },
                              { key: "indie", label: "Indie Flower" },
                              { key: "shadows", label: "Shadows Into Light" },
                              { key: "apple", label: "Homemade Apple" },
                              { key: "patrick", label: "Patrick Hand" }
                            ].map((option) => (
                              <SelectItem 
                                key={option.key} 
                                value={option.key}
                                className={fontStyles[option.key as keyof typeof fontStyles]}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </Select>
                          <div className="flex flex-col gap-1 w-32">
                            <span className="text-xs text-gray-500">Line Height</span>
                            <Slider
                              value={[previewNote.lineHeight || lineHeight]}
                              onValueChange={(value) => {
                                const newLineHeight = value[0];
                                setLineHeight(newLineHeight);
                                setPreviewNote(prev => prev ? { ...prev, lineHeight: newLineHeight } : null);
                              }}
                              onValueCommit={(value) => {
                                const newLineHeight = value[0];
                                debouncedStyleUpdate({ lineHeight: newLineHeight });
                              }}
                              min={1}
                              max={3}
                              step={0.1}
                              className="w-full"
                            />
                            <span className="text-xs font-medium text-right">{(previewNote.lineHeight || lineHeight).toFixed(1)}</span>
                          </div>
                          <div className="flex flex-col gap-1 w-32">
                            <span className="text-xs text-gray-500">Letter Spacing</span>
                            <Slider
                              value={[previewNote.letterSpacing || letterSpacing]}
                              onValueChange={(value) => {
                                const newLetterSpacing = value[0];
                                setLetterSpacing(newLetterSpacing);
                                setPreviewNote(prev => prev ? { ...prev, letterSpacing: newLetterSpacing } : null);
                              }}
                              onValueCommit={(value) => {
                                const newLetterSpacing = value[0];
                                debouncedStyleUpdate({ letterSpacing: newLetterSpacing });
                              }}
                              min={-2}
                              max={10}
                              step={0.5}
                              className="w-full"
                            />
                            <span className="text-xs font-medium text-right">{(previewNote.letterSpacing || letterSpacing).toFixed(1)}px</span>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="outline"
                              className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 border-blue-200 dark:border-blue-800"
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 p-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                            <button
                              onClick={downloadAsImage}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                            >
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Save as Image
                            </button>
                            <button
                              onClick={downloadAsPDF}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                            >
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Save as PDF
                            </button>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    ) : isEditing ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelEdit}
                          className="hover:bg-gray-500/10"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleSaveEdit}
                          className="hover:bg-blue-500/10 text-blue-500"
                        >
                          Save Changes
                        </Button>
                      </div>
                    ) : null}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={closePreview}
                    disabled={isEditing}
                    className={cn(
                      "rounded-full hover:bg-gray-500/10",
                      isEditing && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className={cn(
                  "flex-1 overflow-y-auto",
                  !previewNote.content.includes('---MCQ_NOTE_START---') && !previewNote.content.includes('---FLASHCARD_NOTE_START---')
                    ? (previewNote.background ? backgroundStyles[previewNote.background as keyof typeof backgroundStyles] : 'bg-white dark:bg-black')
                    : 'bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black'
                )}>
                  <div 
                    ref={contentRef}
                    className={cn(
                      "h-full w-full",
                      previewNote.content.includes('---MCQ_NOTE_START---') || previewNote.content.includes('---FLASHCARD_NOTE_START---')
                        ? 'max-w-4xl mx-auto py-8'
                        : ''
                    )}
                  >
                    <div 
                      className={cn(
                        "w-full h-full",
                        !previewNote.content.includes('---MCQ_NOTE_START---') && !previewNote.content.includes('---FLASHCARD_NOTE_START---')
                          ? 'px-8 py-6'
                          : '',
                        previewNote.font ? fontStyles[previewNote.font as keyof typeof fontStyles] : 'font-sans'
                      )}
                      style={{ 
                        lineHeight: `${previewNote.lineHeight || lineHeight}em`,
                        letterSpacing: `${previewNote.letterSpacing || letterSpacing}px`
                      }}
                    >
                      {isEditing ? (
                        <Textarea
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          className={cn(
                            "w-full h-full min-h-[calc(100vh-15rem)] bg-transparent border-none focus:ring-0 resize-none text-gray-800 dark:text-gray-200",
                            previewNote.font ? fontStyles[previewNote.font as keyof typeof fontStyles] : 'font-sans'
                          )}
                          placeholder="Enter your note content..."
                          autoFocus
                          style={{ 
                            lineHeight: `${previewNote.lineHeight || lineHeight}em`,
                            letterSpacing: `${previewNote.letterSpacing || letterSpacing}px`
                          }}
                        />
                      ) : previewNote.content.includes('---MCQ_NOTE_START---') ? (
                        <div className="relative">
                          <div className="absolute inset-0 pointer-events-none">
                            <div className="w-full h-full bg-gradient-to-tr from-blue-500/5 via-purple-500/5 to-pink-500/5" />
                          </div>
                          <MCQNoteCard content={previewNote.content} />
                        </div>
                      ) : previewNote.content.includes('---FLASHCARD_NOTE_START---') ? (
                        <div className="relative">
                          <div className="absolute inset-0 pointer-events-none">
                            <div className="w-full h-full bg-gradient-to-tr from-emerald-500/5 via-teal-500/5 to-cyan-500/5" />
                          </div>
                          <FlashcardNoteCard content={previewNote.content} />
                        </div>
                      ) : (
                        <div 
                          className={cn(
                            "prose dark:prose-invert max-w-none whitespace-pre-wrap break-words",
                            previewNote.font ? fontStyles[previewNote.font as keyof typeof fontStyles] : 'font-sans'
                          )}
                          style={{ 
                            lineHeight: `${previewNote.lineHeight || lineHeight}em`,
                            letterSpacing: `${previewNote.letterSpacing || letterSpacing}px`,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word'
                          }}
                        >
                          {previewNote.content}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}