"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, LayoutGroup } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectItem } from "@nextui-org/react";
import {
  Folder,
  MoreHorizontal,
  Trash,
  Search,
  Settings,
  X,
  RefreshCw,
  Plus,
  Clock,
  BookOpen,
  Hash,
  LogOut,
  UserCircle2,
  BarChart2,
  Sun,
  Moon,
} from "lucide-react";
import RetroGrid from "@/components/magicui/retro-grid";
import CaseStudyCard from "@/components/notebook/case-study-card";
import { GeistSans, GeistMono } from 'geist/font';
import { Icon as IconifyIcon } from '@iconify/react';
import { cn } from "@/lib/utils";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { useUser, useClerk } from "@clerk/nextjs";
import { MultiStepLoader as Loader } from "@/components/ui/multi-step-loader";
import { IconSquareRoundedX } from "@tabler/icons-react";
import StatsModal from "@/components/notebook/stats-modal";
import Image from "next/image";
import { HoverBorderGradient } from "../../components/ui/hover-border-gradient";

// Notebook types available
type NotebookType = "blank" | "math" | "history" | "science" | "language";

// Structure of a notebook object
interface Notebook {
  id: string;
  name: string;
  type: NotebookType;
  date: string;
  sources: number;
  userId: string;
}

// Add sorting type
type SortType = 'name' | 'date' | 'type';

// Add filter state interface
interface FilterState {
  search: string;
  types: Set<NotebookType>;
  sort: SortType;
}

// Add new interface for user stats
interface UserStats {
  totalNotebooks: number;
  totalNotes: number;
  activeStreak: number;
  lastActive: string;
  notebooksByType: Record<NotebookType, number>;
  activityByDay: Record<string, number>;
}

// Selector icon component
const SelectorIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    aria-hidden="true"
    fill="none"
    focusable="false"
    height="1em"
    role="presentation"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
    width="1em"
    {...props}
  >
    <path d="M0 0h24v24H0z" fill="none" stroke="none" />
    <path d="M8 9l4 -4l4 4" />
    <path d="M16 15l-4 4l-4 -4" />
  </svg>
);

// Add loading states for notebook creation
const notebookCreationStates = [
  { text: "Initializing your notebook" },
  { text: "Setting up your workspace" },
  { text: "Preparing your canvas" },
  { text: "Creating your first page" },
  { text: "Adding finishing touches" },
  { text: "Almost there..." },
  { text: "Welcome to your new notebook!" }
];

// Add this new component before the SwissMinimalDashboard component
const PageTransition = ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ 
            opacity: 0,
            scale: 0.95,
            y: -20,
            transition: {
              duration: 0.2,
              ease: [0.32, 0, 0.67, 0]
            }
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function SwissMinimalDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const calculateModalPosition = (rect: DOMRect) => {
    const padding = 20;
    const modalWidth = 400;
    const modalHeight = 300;
    
    let x = rect.right + padding;
    let y = rect.top;
    
    // Check right boundary
    if (x + modalWidth > window.innerWidth) {
      x = rect.left - modalWidth - padding;
    }
    
    // Check vertical position
    if (y + modalHeight > window.innerHeight) {
      y = window.innerHeight - modalHeight - padding;
    }
    if (y < padding) {
      y = padding;
    }
    
    return { x, y };
  };

  const [notebooks, setNotebooks] = React.useState<Notebook[]>([]);
  const [newNotebookName, setNewNotebookName] = React.useState("");
  const [newNotebookType, setNewNotebookType] = React.useState<NotebookType>("blank");
  const [isSearchExpanded, setIsSearchExpanded] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const searchRef = React.useRef<HTMLDivElement>(null);
  
  // Add filter state
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [filters, setFilters] = React.useState<FilterState>({
    search: '',
    types: new Set(),
    sort: 'date'
  });

  // Add new state for delete confirmation
  const [notebookToDelete, setNotebookToDelete] = React.useState<Notebook | null>(null);

  // Add position state near other state declarations
  const [deleteModalPosition, setDeleteModalPosition] = React.useState({ x: 0, y: 0 });

  // Add loading state for delete action
  const [isDeletingNotebook, setIsDeletingNotebook] = React.useState(false);

  const notebookTypeOptions = [
    { key: "blank", label: "Blank" },
    { key: "math", label: "Math" },
    { key: "history", label: "History" },
    { key: "science", label: "Science" },
    { key: "language", label: "Language" },
  ] as const;

  const createModalRef = React.useRef<HTMLDivElement>(null);
  const createModalId = React.useId();

  const [showStatsModal, setShowStatsModal] = React.useState(false);
  const [userStats, setUserStats] = React.useState<UserStats>({
    totalNotebooks: 0,
    totalNotes: 0,
    activeStreak: 0,
    lastActive: new Date().toISOString(),
    notebooksByType: {
      blank: 0,
      math: 0,
      history: 0,
      science: 0,
      language: 0,
    },
    activityByDay: {},
  });

  // Add dark mode state
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  // Add effect to initialize dark mode from system preference
  React.useEffect(() => {
    // Add transition class to handle smooth dark mode changes
    document.documentElement.classList.add('color-theme-in-transition');
    
    // Check if user has a saved preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      // Check system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(systemPrefersDark);
      document.documentElement.classList.toggle('dark', systemPrefersDark);
    }

    // Remove transition class to prevent initial animation
    setTimeout(() => {
      document.documentElement.classList.remove('color-theme-in-transition');
    }, 0);
  }, []);

  // Add function to toggle dark mode
  const toggleDarkMode = () => {
    // Add transition class before changing theme
    document.documentElement.classList.add('color-theme-in-transition');
    
    setIsDarkMode(prev => {
      const newValue = !prev;
      document.documentElement.classList.toggle('dark', newValue);
      localStorage.setItem('theme', newValue ? 'dark' : 'light');
      return newValue;
    });

    // Remove transition class after animation completes
    setTimeout(() => {
      document.documentElement.classList.remove('color-theme-in-transition');
    }, 1000);
  };

  useOutsideClick(createModalRef, () => setShowCreateModal(false));

  React.useEffect(() => {
    const fetchNotebooks = async () => {
      try {
        const response = await fetch(`/api/notebooks?userId=${user?.id}`);
        if (!response.ok) throw new Error("Failed to fetch notebooks");

        const data = await response.json();
        setNotebooks(data.notebooks || []);
      } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "Failed to fetch notebooks." });
      }
    };

    if (user?.id) {
      fetchNotebooks();
    }
  }, [user?.id, toast]);

  // Update user stats when notebooks change
  React.useEffect(() => {
    const stats: UserStats = {
      totalNotebooks: notebooks.length,
      totalNotes: notebooks.reduce((acc, nb) => acc + (nb.sources || 0), 0),
      activeStreak: 7, // This would normally be calculated from actual user activity
      lastActive: new Date().toISOString(),
      notebooksByType: {
        blank: 0,
        math: 0,
        history: 0,
        science: 0,
        language: 0,
      },
      activityByDay: {
        // Mock data for activity chart
        [new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0]]: 3,
        [new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0]]: 5,
        [new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0]]: 2,
        [new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0]]: 7,
        [new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0]]: 4,
        [new Date(Date.now() - 86400000).toISOString().split('T')[0]]: 6,
        [new Date().toISOString().split('T')[0]]: 3,
      },
    };

    // Count notebooks by type
    notebooks.forEach(notebook => {
      stats.notebooksByType[notebook.type]++;
    });

    setUserStats(stats);
  }, [notebooks]);

  const createNewNotebook = async () => {
    if (!newNotebookName.trim()) {
      toast({ title: "Error", description: "Notebook name cannot be empty." });
      return;
    }

    if (!user?.id) {
      toast({ title: "Error", description: "Please sign in to create a notebook." });
      return;
    }

    setIsCreating(true);
    setShowCreateModal(false);

    try {
      const response = await fetch("/api/notebooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          name: newNotebookName,
          type: newNotebookType,
        }),
      });

      if (!response.ok) throw new Error("Failed to create notebook");

      const data = await response.json();
      if (!data.success || !data.notebook || !data.notebook.id) {
        throw new Error("Invalid response from server");
      }

      setNotebooks((prev) => [...prev, data.notebook]);
      setNewNotebookName("");
      setNewNotebookType("blank");
      toast({ title: "Success", description: `${newNotebookName} created successfully.` });
      
      // Wait a moment before redirecting to ensure state is updated
      setTimeout(() => {
        setIsCreating(false);
        router.push(`/notebooks/${data.notebook.id}`);
      }, 2000);
    } catch (error) {
      console.error(error);
      setIsCreating(false);
      toast({ title: "Error", description: "Failed to create notebook." });
    }
  };

  const deleteNotebook = async (notebookId: string) => {
    setIsDeletingNotebook(true);
    
    try {
      // First try to delete all associated sources
      const deleteSourcesResponse = await fetch(`/api/sources?notebookId=${notebookId}`, {
        method: "DELETE",
      });

      if (!deleteSourcesResponse.ok) {
        throw new Error("Failed to delete associated sources");
      }

      // Then delete all associated notes
      const deleteNotesResponse = await fetch(`/api/notes?notebookId=${notebookId}`, {
        method: "DELETE",
      });

      if (!deleteNotesResponse.ok) {
        throw new Error("Failed to delete associated notes");
      }

      // Finally delete the notebook
      const response = await fetch(`/api/notebooks?id=${notebookId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete notebook");

      // Add a small delay for the animation to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      setNotebooks((prev) => prev.filter((notebook) => notebook.id !== notebookId));
      toast({ title: "Success", description: "Notebook and all its contents were deleted successfully" });
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to delete notebook. Please try again." });
    } finally {
      setIsDeletingNotebook(false);
      setNotebookToDelete(null);
    }
  };

  // Add filter functions
  const toggleType = (type: NotebookType) => {
    setFilters(prev => {
      const newTypes = new Set(prev.types);
      if (newTypes.has(type)) {
        newTypes.delete(type);
      } else {
        newTypes.add(type);
      }
      return { ...prev, types: newTypes };
    });
  };

  // Add sorting function
  const sortNotebooks = (notebooks: Notebook[]) => {
    return [...notebooks].sort((a, b) => {
      switch (filters.sort) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'date':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });
  };

  // Modify filtered notebooks to include sorting
  const filteredNotebooks = sortNotebooks(
    notebooks.filter(notebook => {
      if (filters.search && !notebook.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.types.size > 0 && !filters.types.has(notebook.type)) {
        return false;
      }
      return true;
    })
  );

  // Simplified to just show first 20 notebooks
  const notebooksPerPage = 20;
  const currentNotebooks = filteredNotebooks.slice(0, notebooksPerPage);

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

  // Helper function to capitalize first letter
  const capitalizeFirstLetter = (str: string | null | undefined) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/'); // Redirect to home page after sign out
    } catch (error) {
      console.error('Error signing out:', error);
      toast({ 
        title: "Error", 
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSignIn = () => {
    router.push('/sign-in'); // Redirect to the sign-in page
  };

  const [selectedNotebook, setSelectedNotebook] = React.useState<string | null>(null);
  
  // Add this function before the return statement
  const handleNotebookClick = async (notebookId: string) => {
    setSelectedNotebook(notebookId);
    
    // Add a small delay for the animation
    await new Promise(resolve => setTimeout(resolve, 200));
    
    router.push(`/notebooks/${notebookId}`);
  };

  return (
    <div className={cn(
      "relative min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100",
      "transition-all duration-1000",
      GeistSans.className
    )}>
      <style jsx global>{`
        .color-theme-in-transition,
        .color-theme-in-transition *,
        .color-theme-in-transition *:before,
        .color-theme-in-transition *:after {
          transition: all 1000ms ease-in-out !important;
          transition-delay: 0 !important;
        }
      `}</style>

      {/* Add the loader */}
      <Loader loadingStates={notebookCreationStates} loading={isCreating} duration={2000} />
      
      {isCreating && (
        <button
          className="fixed top-4 right-4 text-black dark:text-white z-[120]"
          onClick={() => setIsCreating(false)}
        >
          <IconSquareRoundedX className="h-10 w-10" />
        </button>
      )}

      <RetroGrid className="!opacity-30 dark:!opacity-20" />
      
      <header className="sticky top-0 z-50 flex items-center justify-between p-6 bg-white/70 dark:bg-black/70 border-b border-gray-200/50 dark:border-gray-800/30 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-white/50 dark:supports-[backdrop-filter]:bg-black/50">
        <div className="flex items-center gap-3">
          <Image
            src="/images/swan-logo.png"
            alt="Swan Logo"
            width={28}
            height={28}
            className="dark:invert"
          />
          <h1 className="text-2xl font-bold">
            Welcome {isLoaded ? (user?.firstName ? capitalizeFirstLetter(user.firstName) : 'Guest') : '...'}, let&apos;s start
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Dark Mode Toggle Button */}
          <motion.button
            onClick={toggleDarkMode}
            className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Toggle dark mode"
          >
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={false}
              animate={{
                rotate: isDarkMode ? 360 : 0,
                scale: isDarkMode ? 0 : 1,
                opacity: isDarkMode ? 0 : 1
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <Sun className="h-5 w-5 text-amber-500" />
            </motion.div>
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={false}
              animate={{
                rotate: isDarkMode ? 0 : -360,
                scale: isDarkMode ? 1 : 0,
                opacity: isDarkMode ? 1 : 0
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <Moon className="h-5 w-5 text-blue-400" />
            </motion.div>
            <motion.div
              className="absolute inset-0 rounded-full"
              initial={false}
              animate={{
                borderColor: isDarkMode ? "rgba(59, 130, 246, 0.5)" : "rgba(245, 158, 11, 0.5)",
                borderWidth: "2px",
                scale: 0.9
              }}
              transition={{ duration: 0.3 }}
            />
          </motion.button>

          {/* Stats Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowStatsModal(true)}
            className="relative w-10 h-10 p-0 rounded-full overflow-hidden hover:bg-gray-100 dark:hover:bg-gray-900/50"
          >
            <BarChart2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </Button>

          {/* Charity Impact Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.open('/charity-impact', '_blank')}
            className="relative w-10 h-10 p-0 rounded-full overflow-hidden hover:bg-rose-100 dark:hover:bg-rose-900/20 group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/0 to-red-500/0 group-hover:from-rose-500/10 group-hover:to-red-500/10 transition-all duration-300" />
            <IconifyIcon icon="solar:heart-bold-duotone" className="h-5 w-5 text-rose-500 dark:text-rose-400 animate-pulse" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="relative w-10 h-10 p-0 rounded-full overflow-hidden border-0 hover:bg-transparent"
              >
                <div className="absolute inset-0 rounded-full ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ring-transparent hover:ring-blue-500/50 transition-all duration-200">
                  {user?.imageUrl ? (
                    <img 
                      src={user.imageUrl} 
                      alt={user.fullName || "Profile"} 
                      className="w-full h-full object-cover rounded-full"
                      style={{ imageRendering: 'crisp-edges' }}
                    />
                  ) : (
                    <div className="w-full h-full bg-blue-500/10 flex items-center justify-center">
                      <UserCircle2 className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    </div>
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-[280px] p-2 mt-2 bg-white/95 dark:bg-black/95 backdrop-blur-xl border border-gray-200 dark:border-gray-800/50 rounded-2xl shadow-xl"
            >
              {user ? (
                <>
                  {/* User Profile Section */}
                  <div className="px-2 py-3 mb-2">
                    <div className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        {user.imageUrl ? (
                          <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 ring-blue-500/20">
                            <img 
                              src={user.imageUrl} 
                              alt={user.fullName || "Profile"} 
                              className="w-full h-full object-cover"
                              style={{ imageRendering: 'crisp-edges' }}
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 ring-blue-500/20">
                            <UserCircle2 className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {user.fullName || 'Guest User'}
                        </p>
                        <p className={cn("text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5", GeistMono.className)}>
                          {user.primaryEmailAddress?.emailAddress || 'No email'}
                        </p>
                        {user.username && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            @{user.username}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-gray-200 dark:bg-gray-700 mx-1 my-1" />

                  {/* Account Settings */}
                  <DropdownMenuItem className="flex items-center gap-2 px-2 py-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50">
                    <Settings className="h-4 w-4" />
                    Account Settings
                  </DropdownMenuItem>

                  {/* Activity Stats */}
                  <DropdownMenuItem 
                    className="flex items-center gap-2 px-2 py-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50"
                    onClick={() => setShowStatsModal(true)}
                  >
                    <BarChart2 className="h-4 w-4" />
                    Activity Stats
                  </DropdownMenuItem>

                  {/* Preferences */}
                  <DropdownMenuItem className="flex items-center gap-2 px-2 py-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50">
                    <Settings className="h-4 w-4" />
                    Preferences
                  </DropdownMenuItem>

                  <div className="h-px bg-gray-200 dark:bg-gray-700 mx-1 my-1" />

                  {/* Help & Support */}
                  <DropdownMenuItem className="flex items-center gap-2 px-2 py-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      height="24"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      width="24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                      <path d="M12 17h.01" />
                    </svg>
                    Help & Support
                  </DropdownMenuItem>

                  {/* Sign Out */}
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-2 py-2 mt-1 text-sm text-red-600 dark:text-red-400 cursor-pointer rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem 
                  onClick={handleSignIn}
                  className="flex items-center gap-2 px-2 py-2 text-sm text-blue-600 dark:text-blue-400 cursor-pointer rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <LogOut className="h-4 w-4 rotate-180" />
                  Sign in
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="relative z-10 p-6">
        <section className="mb-12">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold">My Notebooks</h2>
            
            <div className="flex items-center gap-4">
              {/* Search Bar */}
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
                      placeholder="Search notebooks..."
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

              {/* Sort Button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="gap-2 bg-white/5 dark:bg-gray-800/5 border-gray-200/20 dark:border-gray-700/20 rounded-xl hover:bg-gray-100/10 dark:hover:bg-gray-700/10 backdrop-blur-md"
                  >
                    <Clock className="h-4 w-4" />
                    <span>Sort</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => setFilters(prev => ({ ...prev, sort: 'date' }))}
                    className={cn(filters.sort === 'date' && "bg-blue-50 dark:bg-blue-900/20")}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Date Created
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setFilters(prev => ({ ...prev, sort: 'name' }))}
                    className={cn(filters.sort === 'name' && "bg-blue-50 dark:bg-blue-900/20")}
                  >
                    <Hash className="mr-2 h-4 w-4" />
                    Name
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setFilters(prev => ({ ...prev, sort: 'type' }))}
                    className={cn(filters.sort === 'type' && "bg-blue-50 dark:bg-blue-900/20")}
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Type
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

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
                    {filters.types.size > 0 && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500/20 text-blue-600 text-xs font-medium">
                        {filters.types.size}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-72 p-4 bg-white/95 dark:bg-gray-800/95 rounded-2xl backdrop-blur-xl border border-gray-100 dark:border-gray-700"
                >
                  <div className="space-y-4">
                    {/* Notebook Type Section */}
                    <div>
                      <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        <Folder className="h-4 w-4 text-blue-500" />
                        Notebook Type
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {notebookTypeOptions.map(({ key, label }) => (
                          <Button
                            key={key}
                            variant={filters.types.has(key as NotebookType) ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleType(key as NotebookType)}
                            className={`w-full rounded-xl ${
                              filters.types.has(key as NotebookType)
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
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
          </div>

          {/* Active Filters */}
          <AnimatePresence>
            {(filters.search || filters.types.size > 0) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-wrap items-center gap-2 mb-6"
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

                {Array.from(filters.types).map(type => (
                  <motion.div
                    key={type}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="group"
                  >
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm">
                      <Folder className="h-3 w-3" />
                      <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                      <button
                        onClick={() => toggleType(type)}
                        className="ml-1 p-1 rounded-md hover:bg-blue-500/20 transition-colors"
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
                    types: new Set(),
                    sort: 'date'
                  })}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-500/10 text-gray-600 dark:text-gray-400 text-sm hover:bg-gray-500/20 transition-colors"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Clear All</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {filteredNotebooks.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                <Folder className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No notebooks found
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {notebooks.length === 0 
                  ? "Get started by creating your first notebook"
                  : "Try adjusting your filters to find what you're looking for"}
              </p>
              {notebooks.length === 0 && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Notebook
                </Button>
              )}
            </div>
          )}

          {/* Notebooks Grid Layout */}
          {filteredNotebooks.length > 0 && (
            <LayoutGroup>
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 max-w-[2400px] mx-auto"
                layout
              >
                {currentNotebooks.map((notebook: Notebook) => (
                  <motion.div
                    key={notebook.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    layout="position"
                    className="relative group transition-all duration-300"
                  >
                    <PageTransition isOpen={selectedNotebook !== notebook.id}>
                      <motion.div
                        layout="position"
                        className="h-full cursor-pointer relative"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleNotebookClick(notebook.id)}
                      >
                        <div className="absolute top-2 right-2 z-20 transition-all duration-200 opacity-0 group-hover:opacity-100">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                className="h-8 w-8 p-0 bg-white/90 hover:bg-white dark:bg-black/90 dark:hover:bg-black backdrop-blur-sm"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent 
                              align="end" 
                              className="min-w-[180px] p-1.5 bg-white/95 dark:bg-black/95 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <DropdownMenuItem 
                                className="group flex items-center gap-2.5 px-3 py-2.5 text-sm cursor-pointer rounded-lg focus:bg-red-50 dark:focus:bg-red-950/50 hover:bg-red-50 dark:hover:bg-red-950/50 focus:text-red-600 dark:focus:text-red-400 hover:text-red-600 dark:hover:text-red-400 outline-none transition-all duration-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                  const position = calculateModalPosition(rect);
                                  setDeleteModalPosition(position);
                                  setNotebookToDelete(notebook);
                                }}
                              >
                                <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-red-50 dark:bg-red-950/50 group-hover:bg-red-100 dark:group-hover:bg-red-900/50 transition-colors duration-200">
                                  <Trash className="h-4 w-4 text-red-500 dark:text-red-400" />
                                </div>
                                <span className="font-medium">Delete Notebook</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <CaseStudyCard
                          title={notebook.name}
                          category={notebook.type}
                          image="/path-to-image.jpg"
                          logo="/path-to-logo.png"
                          link={`/notebooks/${notebook.id}`}
                          type="content"
                          stats={{
                            notes: notebook.sources,
                            lastEdited: new Date(notebook.date).toLocaleDateString()
                          }}
                        />
                      </motion.div>
                    </PageTransition>
                  </motion.div>
                ))}
              </motion.div>
            </LayoutGroup>
          )}

          {/* Create Notebook Button and Modal */}
          <AnimatePresence>
            {showCreateModal && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/20 backdrop-blur-sm h-full w-full z-[60]"
                />
                <div className="fixed inset-0 flex items-center justify-center z-[70] p-4">
                  <motion.div
                    ref={createModalRef}
                    layoutId={`create-notebook-${createModalId}`}
                    className="w-full max-w-[480px] bg-white dark:bg-black rounded-[32px] overflow-hidden shadow-xl relative"
                  >
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute top-6 right-6 flex items-center justify-center rounded-full h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => setShowCreateModal(false)}
                    >
                      <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </motion.button>

                    <div className="px-8 pt-8 pb-6">
                      <motion.h2 className="text-[28px] font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
                        Create New Notebook
                      </motion.h2>
                      <motion.p className="text-base text-gray-500 dark:text-gray-400 mt-1">
                        Create a new notebook to organize your notes.
                      </motion.p>
                    </div>

                    <div className="px-8 pb-6 space-y-5">
                      <div className="space-y-2.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Notebook Name
                        </label>
                        <Input
                          value={newNotebookName}
                          onChange={(e) => setNewNotebookName(e.target.value)}
                          placeholder="Enter notebook name"
                          className={cn(
                            "h-12 px-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
                            "focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                            "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                            GeistMono.className
                          )}
                        />
                      </div>

                      <div className="space-y-2.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Notebook Type
                        </label>
                        <Select
                          variant="bordered"
                          radius="lg"
                          size="lg"
                          placeholder="Select notebook type"
                          selectedKeys={[newNotebookType]}
                          onChange={(e) => setNewNotebookType(e.target.value as NotebookType)}
                          selectorIcon={<SelectorIcon />}
                          classNames={{
                            base: "max-w-full",
                            trigger: "h-12 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 data-[hover=true]:bg-gray-100 dark:data-[hover=true]:bg-gray-700",
                            value: "text-base",
                            listbox: "text-base",
                            popoverContent: "border-gray-200 dark:border-gray-700"
                          }}
                        >
                          {notebookTypeOptions.map((type) => (
                            <SelectItem key={type.key} value={type.key}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </Select>
                      </div>
                    </div>

                    <div className="px-8 pb-8">
                      <Button 
                        onClick={() => {
                          createNewNotebook();
                          setShowCreateModal(false);
                        }}
                        className="w-full h-12 text-base font-medium bg-black hover:bg-blue-600 text-white rounded-2xl"
                      >
                        Create Notebook
                      </Button>
                    </div>
                  </motion.div>
                </div>
              </>
            )}
          </AnimatePresence>

          {/* Create Notebook Trigger Button */}
          <AnimatePresence>
            {!showCreateModal && (
              <motion.div
                layoutId={`create-notebook-${createModalId}`}
                className="fixed bottom-6 right-6 z-50"
              >
                <HoverBorderGradient
                  containerClassName="rounded-full"
                  as="button"
                  className="h-12 flex items-center gap-2 bg-black dark:bg-black text-white px-5 font-medium text-base"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus className="h-5 w-5" />
                  <span>New Notebook</span>
                </HoverBorderGradient>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Add Delete Confirmation Modal */}
          <AnimatePresence>
            {notebookToDelete && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
                  onClick={() => !isDeletingNotebook && setNotebookToDelete(null)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                  className="fixed z-50 w-full max-w-[400px]"
                  style={{ 
                    left: `${deleteModalPosition.x}px`,
                    top: `${deleteModalPosition.y}px`,
                    transform: 'translate(0, 0)'
                  }}
                >
                  <Card className="relative overflow-hidden border-none bg-white/95 dark:bg-black/95 backdrop-blur-xl shadow-2xl dark:shadow-2xl/20 rounded-3xl">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center p-4">
                        <div className="mb-6">
                          <div className="relative">
                            {isDeletingNotebook ? (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center justify-center w-16 h-16"
                              >
                                <motion.div
                                  className="absolute w-16 h-16 border-4 border-red-500/20 dark:border-red-400/20 rounded-full"
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                />
                                <motion.div
                                  className="absolute w-16 h-16 border-4 border-transparent border-t-red-500 dark:border-t-red-400 rounded-full"
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                />
                                <motion.div
                                  initial={{ scale: 1 }}
                                  animate={{ scale: 0.8 }}
                                  transition={{ duration: 1, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                                >
                                  <Trash className="h-8 w-8 text-red-500 dark:text-red-400" />
                                </motion.div>
                              </motion.div>
                            ) : (
                              <>
                                <div className="absolute inset-0 rounded-full bg-red-100 dark:bg-red-950/50 animate-ping" />
                                <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/50">
                                  <Trash className="h-8 w-8 text-red-500 dark:text-red-400" />
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          {isDeletingNotebook ? "Deleting..." : `Delete "${notebookToDelete.name}"?`}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
                          {isDeletingNotebook ? (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.3 }}
                            >
                              Please wait while we safely remove your notebook and its contents...
                            </motion.span>
                          ) : (
                            <>
                              This will permanently delete this notebook and all its associated notes. 
                              <span className="block mt-1 font-medium text-red-600 dark:text-red-400">
                                This action cannot be undone.
                              </span>
                            </>
                          )}
                        </p>
                        
                        <div className="flex items-center gap-3 w-full max-w-xs">
                          <Button
                            variant="outline"
                            onClick={() => setNotebookToDelete(null)}
                            disabled={isDeletingNotebook}
                            className={cn(
                              "flex-1 h-11 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-800",
                              isDeletingNotebook && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => deleteNotebook(notebookToDelete.id)}
                            disabled={isDeletingNotebook}
                            className={cn(
                              "flex-1 h-11 bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 dark:shadow-red-500/10",
                              isDeletingNotebook && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            {isDeletingNotebook ? (
                              <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                              >
                                Deleting...
                              </motion.span>
                            ) : (
                              "Delete"
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Add Stats Modal */}
          <AnimatePresence>
            {showStatsModal && (
              <StatsModal
                isOpen={showStatsModal}
                onClose={() => setShowStatsModal(false)}
                stats={userStats}
              />
            )}
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
} 