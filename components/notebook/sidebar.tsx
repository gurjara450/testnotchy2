'use client';

import * as React from 'react'
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  X, 
  FileText, 
  PlusCircle, 
  Trash2, 
  Settings2, 
  LogOut, 
  UserCircle2, 
  PenLine,
  CheckCircle2, AlertCircle, Upload, FolderUp
} from 'lucide-react'
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { motion, AnimatePresence } from 'framer-motion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useUser, useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useOutsideClick } from "@/hooks/use-outside-click"
import { uploadToS3 } from "@/lib/s3"
import { Dropzone } from '@/components/dropezone'
import { toast } from 'react-hot-toast'
import Image from 'next/image'

const Home13Icon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={32} height={32} color={"#000000"} fill={"none"} {...props}>
    <path d="M3.16405 11.3497L4 11.5587L4.45686 16.1005C4.715 18.6668 4.84407 19.9499 5.701 20.7249C6.55793 21.5 7.84753 21.5 10.4267 21.5H13.5733C16.1525 21.5 17.4421 21.5 18.299 20.7249C19.1559 19.9499 19.285 18.6668 19.5431 16.1005L20 11.5587L20.836 11.3497C21.5201 11.1787 22 10.564 22 9.85882C22 9.35735 21.7553 8.88742 21.3445 8.59985L13.1469 2.86154C12.4583 2.37949 11.5417 2.37949 10.8531 2.86154L2.65549 8.59985C2.24467 8.88742 2 9.35735 2 9.85882C2 10.564 2.47993 11.1787 3.16405 11.3497Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="14.5" r="2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AiChat02Icon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={32} height={32} color={"#000000"} fill={"none"} {...props}>
    <path d="M14.1706 20.8905C18.3536 20.6125 21.6856 17.2332 21.9598 12.9909C22.0134 12.1607 22.0134 11.3009 21.9598 10.4707C21.6856 6.22838 18.3536 2.84913 14.1706 2.57107C12.7435 2.47621 11.2536 2.47641 9.8294 2.57107C5.64639 2.84913 2.31441 6.22838 2.04024 10.4707C1.98659 11.3009 1.98659 12.1607 2.04024 12.9909C2.1401 14.536 2.82343 15.9666 3.62791 17.1746C4.09501 18.0203 3.78674 19.0758 3.30021 19.9978C2.94941 20.6626 2.77401 20.995 2.91484 21.2351C3.05568 21.4752 3.37026 21.4829 3.99943 21.4982C5.24367 21.5285 6.08268 21.1757 6.74868 20.6846C7.1264 20.4061 7.31527 20.2668 7.44544 20.2508C7.5756 20.2348 7.83177 20.3403 8.34401 20.5513C8.8044 20.7409 9.33896 20.8579 9.8294 20.8905C11.2536 20.9852 12.7435 20.9854 14.1706 20.8905Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M7.5 15L9.34189 9.47434C9.43631 9.19107 9.7014 9 10 9C10.2986 9 10.5637 9.19107 10.6581 9.47434L12.5 15M15.5 9V15M8.5 13H11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const FileExportIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={32} height={32} color={"#000000"} fill={"none"} {...props}>
    <path d="M20 14V10.6569C20 9.83935 20 9.4306 19.8478 9.06306C19.6955 8.69552 19.4065 8.40649 18.8284 7.82843L14.0919 3.09188C13.593 2.593 13.3436 2.34355 13.0345 2.19575C12.9702 2.165 12.9044 2.13772 12.8372 2.11401C12.5141 2 12.1614 2 11.4558 2C8.21082 2 6.58831 2 5.48933 2.88607C5.26731 3.06508 5.06508 3.26731 4.88607 3.48933C4 4.58831 4 6.21082 4 9.45584V14C4 17.7712 4 19.6569 5.17157 20.8284C6.34315 22 8.22876 22 12 22M13 2.5V3C13 5.82843 13 7.24264 13.8787 8.12132C14.7574 9 16.1716 9 19 9H19.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 22C17.6068 21.4102 20 19.8403 20 19C20 18.1597 17.6068 16.5898 17 16M19 19H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface CardContent {
  (): React.ReactNode;
}

interface Card {
  description: string;
  title: string;
  src: string;
  ctaText: string;
  ctaLink: string;
  content: CardContent | React.ReactNode;
}

interface SidebarProps {
  onAIDrawerOpen: () => void;
  sources?: string[];
  onSourceSelect?: (sourceName: string) => void;
  onSourceDelete?: (sourceName: string) => void;
  selectedSources?: string[];
  selectedFile?: File | null;
  setSelectedFile?: (file: File | null) => void;
  uploadSource?: (fileName: string, fileContent: string) => void;
  onSourceFileChange?: (file: { name: string, key: string } | undefined) => void;
  cards?: Card[];
}

interface SourceFile {
  name: string;
  key: string;
}

const showSuccessToast = (message: string, icon = <CheckCircle2 />) => {
  toast.custom((t) => (
    <div
      className={cn(
        "fixed top-4 right-4 flex items-center gap-4 px-6 py-4 max-w-md",
        "rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)]",
        "bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl",
        "border border-emerald-100/20 dark:border-emerald-900/20",
        "transform transition-all duration-300",
        "animate-[slide-in-right_0.4s_ease-out]",
        t.visible 
          ? "opacity-100 translate-x-0" 
          : "opacity-0 translate-x-full"
      )}
      style={{
        animation: t.visible 
          ? 'slide-in-right 0.4s ease-out, bounce 0.5s ease-out 0.4s' 
          : 'slide-out-right 0.3s ease-in'
      }}
    >
      <div className="relative group">
        <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-emerald-500/30 via-green-500/30 to-teal-500/30 blur-md opacity-75 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10 border border-emerald-200/20 dark:border-emerald-800/20">
          {React.cloneElement(icon as React.ReactElement, {
            className: "w-5 h-5 text-emerald-600 dark:text-emerald-400"
          })}
        </div>
      </div>
      <div className="flex flex-col gap-0.5">
        <h3 className="font-semibold bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 bg-clip-text text-transparent">
          Success
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {message}
        </p>
      </div>
      <button 
        onClick={() => toast.dismiss(t.id)}
        className="ml-auto p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
      >
        <X className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:scale-110 transition-transform duration-200" />
      </button>
    </div>
  ), {
    duration: 4000,
    position: 'top-right',
  });
};

const showErrorToast = (title: string, message: string, icon = <AlertCircle />) => {
  toast.custom((t) => (
    <div
      className={cn(
        "fixed top-4 right-4 flex items-center gap-4 px-6 py-4 max-w-md",
        "rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)]",
        "bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl",
        "border border-purple-100/20 dark:border-purple-900/20",
        "transform transition-all duration-300",
        "animate-[slide-in-right_0.4s_ease-out]",
        t.visible 
          ? "opacity-100 translate-x-0" 
          : "opacity-0 translate-x-full"
      )}
      style={{
        animation: t.visible 
          ? 'slide-in-right 0.4s ease-out, bounce 0.5s ease-out 0.4s' 
          : 'slide-out-right 0.3s ease-in'
      }}
    >
      <div className="relative group">
        <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-violet-500/30 via-purple-500/30 to-indigo-500/30 blur-md opacity-75 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-indigo-500/10 border border-purple-200/20 dark:border-purple-800/20">
          {React.cloneElement(icon as React.ReactElement, {
            className: "w-5 h-5 text-purple-600 dark:text-purple-400"
          })}
        </div>
      </div>
      <div className="flex flex-col gap-0.5">
        <h3 className="font-semibold bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {message}
        </p>
      </div>
      <button 
        onClick={() => toast.dismiss(t.id)}
        className="ml-auto p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
      >
        <X className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:scale-110 transition-transform duration-200" />
      </button>
    </div>
  ), {
    duration: 4000,
    position: 'top-right',
  });
};

export function Sidebar({ 
  onAIDrawerOpen, 
  sources = [], 
  onSourceSelect,
  onSourceDelete,
  selectedSources = [],
  selectedFile,
  setSelectedFile,
  uploadSource,
  onSourceFileChange,
  cards = []
}: SidebarProps) {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [isAddSourceOpen, setIsAddSourceOpen] = React.useState(false);
  const [typedText, setTypedText] = React.useState('');
  const [uploading, setUploading] = React.useState(false);
  const [isSourceDialogOpen, setIsSourceDialogOpen] = React.useState(false);
  const [deletingSourceId, setDeletingSourceId] = React.useState<string | null>(null);
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const cardDialogRef = React.useRef<HTMLDivElement>(null);
  const id = React.useId();
  const [isMinimized, ] = React.useState(false);
  const [activeCard, setActiveCard] = React.useState<Card | null>(null);
  const [uploadedFileInfo, setUploadedFileInfo] = React.useState<SourceFile | null>(null);

  useOutsideClick(dialogRef, () => setIsSourceDialogOpen(false));
  useOutsideClick(cardDialogRef, () => setActiveCard(null));

  // Toggle minimize state
 

  const renderCardContent = (content: Card['content']) => {
    if (typeof content === 'function') {
      return (content as CardContent)();
    }
    return content;
  };

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsSourceDialogOpen(false);
        setActiveCard(null);
      }
    }

    if (isSourceDialogOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", onKeyDown);
    } else if (activeCard && typeof activeCard === "object") {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", onKeyDown);
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "auto";
    }
  }, [isSourceDialogOpen, activeCard]);

  const handleFileUpload = async (files: File[]) => {
    const file = files[0];
    if (!file || typeof file.text !== 'function') return;

    try {
      setUploading(true);
      setSelectedFile?.(file);
      
      // Upload to S3 first
      const uploadResponse = await uploadToS3(file);
      if (!uploadResponse?.file_key || !uploadResponse.file_name) {
        throw new Error("Upload failed");
      }
      
      // Store the file info
      const fileInfo = {
        name: uploadResponse.file_name,
        key: uploadResponse.file_key
      };
      setUploadedFileInfo(fileInfo);
      onSourceFileChange?.(fileInfo);

      showSuccessToast("File uploaded successfully!", <Upload />);
    } catch (error) {
      console.error("Upload error:", error);
      setSelectedFile?.(null);
      setUploadedFileInfo(null);
      showErrorToast(
        "Upload Failed",
        "Error uploading file. Please try again.",
        <FolderUp />
      );
    } finally {
      setUploading(false);
    }
  };

  const handleAddSource = () => {
    if (selectedFile && uploadedFileInfo) {
      // For file source
      uploadSource?.(uploadedFileInfo.name, uploadedFileInfo.key);
      setSelectedFile?.(null);
      setUploadedFileInfo(null);
    } else if (typedText.trim()) {
      // For text source
      const fileName = `Text Source ${new Date().toLocaleString()}`;
      uploadSource?.(fileName, typedText);
      setTypedText('');
    }
    
    setIsSourceDialogOpen(false);
    setIsAddSourceOpen(false);
    showSuccessToast("Source added successfully!", <FileText />);
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-[4.5rem] flex flex-col items-center py-4 z-40">
      <div
        className={cn(
          "fixed left-4 top-1/2 -translate-y-1/2 z-[60]",
          "rounded-[20px]",
          "bg-white/25 dark:bg-gray-900/25",
          "shadow-lg shadow-black/5 dark:shadow-black/10",
          "border border-white/30 dark:border-white/10",
          "backdrop-blur-[12px] backdrop-saturate-[1.8]",
          "ring-1 ring-white/50 dark:ring-white/10",
          isMinimized ? "w-[4rem]" : "w-[4rem] sm:w-[4rem]",
          GeistSans.className
        )}
        
      >
        <motion.div
          className={cn(
            "flex flex-col items-center text-gray-900 dark:text-gray-100",
            "p-2 gap-2",
            "rounded-[18px]",
            !isMinimized
              ? "bg-gradient-to-b from-white/20 via-white/15 to-white/10 dark:from-gray-900/20 dark:via-gray-900/15 dark:to-black/10"
              : ""
          )}
          layoutRoot
          layout
          initial={{ borderRadius: 18, width: "4rem", height: "4rem" }}
          animate={
            isMinimized
              ? {
                  borderRadius: 18,
                  width: "4rem",
                  height: "4rem",
                }
              : {
                  borderRadius: 18,
                  width: "4rem",
                  height: "auto",
                  transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                    mass: 1,
                  },
                }
          }
        >
          <div className="flex items-center justify-center w-full">
            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-xl w-10 h-10 p-0",
                  "hover:scale-105 active:scale-95",
                  "bg-white/80 dark:bg-gray-900/80",
                  "border border-gray-200/20 dark:border-gray-800/20",
                  "shadow-sm hover:shadow-md dark:shadow-none",
                  "transition-all duration-200 ease-spring",
                  "group relative overflow-hidden"
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-300" />
                <div className="relative w-full h-full flex items-center justify-center">
                  <Home13Icon className="w-7 h-7 text-gray-600 dark:text-gray-300 transition-all duration-200 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:scale-110 group-active:scale-95" />
                </div>
              </Button>
            </Link>
          </div>

          {!isMinimized && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: {
                  delay: 0.1,
                  duration: 0.2,
                  ease: "easeOut"
                }
              }}
              className="flex flex-col items-center gap-2 w-full mt-2"
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={onAIDrawerOpen}
                className={cn(
                  "rounded-xl w-10 h-10 p-0",
                  "hover:scale-105 active:scale-95",
                  "bg-white/80 dark:bg-gray-900/80",
                  "border border-gray-200/20 dark:border-gray-800/20",
                  "shadow-sm hover:shadow-md dark:shadow-none",
                  "transition-all duration-200 ease-spring",
                  "group relative overflow-hidden"
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/10 group-hover:to-purple-500/10 transition-all duration-300" />
                <div className="relative w-full h-full flex items-center justify-center">
                  <AiChat02Icon className="w-7 h-7 text-gray-600 dark:text-gray-300 transition-all duration-200 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 group-hover:scale-110 group-active:scale-95" />
                </div>
              </Button>

              <motion.div
                layoutId={`source-trigger-${id}`}
                className="relative group"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSourceDialogOpen(true)}
                  className={cn(
                    "rounded-xl w-10 h-10 p-0",
                    "hover:scale-105 active:scale-95",
                    "bg-white/80 dark:bg-gray-900/80",
                    "border border-gray-200/20 dark:border-gray-800/20",
                    "shadow-sm hover:shadow-md dark:shadow-none",
                    "transition-all duration-200 ease-spring",
                    "group relative overflow-hidden",
                    (sources && sources.length > 0) && "after:absolute after:top-1 after:right-1 after:w-2 after:h-2 after:bg-blue-500 after:rounded-full"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-emerald-500/0 group-hover:from-green-500/10 group-hover:to-emerald-500/10 transition-all duration-300" />
                  <div className="relative w-full h-full flex items-center justify-center">
                    <FileExportIcon className="w-7 h-7 text-gray-600 dark:text-gray-300 transition-all duration-200 group-hover:text-green-500 dark:group-hover:text-green-400 group-hover:scale-110 group-active:scale-95" />
                  </div>
                </Button>
              </motion.div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "rounded-xl w-10 h-10 p-0",
                      "hover:scale-105 active:scale-95",
                      "bg-white/80 dark:bg-gray-900/80",
                      "border border-gray-200/20 dark:border-gray-800/20",
                      "shadow-sm hover:shadow-md dark:shadow-none",
                      "transition-all duration-200 ease-spring",
                      "group relative overflow-hidden"
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 to-indigo-500/0 group-hover:from-violet-500/10 group-hover:to-indigo-500/10 transition-all duration-300" />
                    <div className="relative w-full h-full flex items-center justify-center">
                      {!isUserLoaded ? (
                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
                      ) : user?.imageUrl ? (
                        <Image 
                          src={user.imageUrl} 
                          alt={user.fullName || "Profile"} 
                          width={24}
                          height={24}
                          className="rounded-full object-cover transition-transform group-hover:scale-110"
                          priority={true}
                          loading="eager"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center transition-transform group-hover:scale-110">
                          <UserCircle2 className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="w-64 p-2 animate-in slide-in-from-left-5 bg-white/95 dark:bg-black border border-gray-200/20 dark:border-gray-800/20 rounded-2xl backdrop-blur-xl shadow-xl" 
                  align="center" 
                  side="right"
                  sideOffset={20}
                >
                  {isUserLoaded && user ? (
                    <>
                      <DropdownMenuLabel className="flex items-center gap-4 p-4 mb-1">
                        {user.imageUrl ? (
                          <Image 
                            src={user.imageUrl} 
                            alt={user.fullName || "Profile"} 
                            width={48}
                            height={48}
                            className="rounded-xl object-cover border-2 border-white/20 dark:border-gray-800/20 shadow-sm"
                            priority={true}
                            loading="eager"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center border-2 border-white/20">
                            <UserCircle2 className="h-7 w-7 text-white" />
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="font-semibold text-base text-gray-900 dark:text-gray-50">{user.fullName || user.username}</span>
                          <span className={`text-xs text-gray-500 dark:text-gray-400 ${GeistMono.className}`}>{user.primaryEmailAddress?.emailAddress}</span>
                        </div>
                      </DropdownMenuLabel>
                      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent my-1" />
                      <DropdownMenuItem 
                        onClick={() => router.push("/user-profile")}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group"
                      >
                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-900 group-hover:bg-white dark:group-hover:bg-gray-800 transition-colors">
                          <UserCircle2 className="h-4 w-4 text-gray-600 dark:text-gray-400 group-hover:text-blue-500" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300">Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => router.push("/settings")}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group"
                      >
                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-900 group-hover:bg-white dark:group-hover:bg-gray-800 transition-colors">
                          <Settings2 className="h-4 w-4 text-gray-600 dark:text-gray-400 group-hover:text-pink-500" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300">Settings</span>
                      </DropdownMenuItem>
                      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent my-1" />
                      <DropdownMenuItem 
                        onClick={() => signOut?.(() => router.push("/"))}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-500 transition-colors group"
                      >
                        <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/50 group-hover:bg-red-100 dark:group-hover:bg-red-950/70 transition-colors">
                          <LogOut className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                        <span>Sign out</span>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem 
                      onClick={() => router?.push("/sign-in")}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group"
                    >
                      <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-900 group-hover:bg-white dark:group-hover:bg-gray-800 transition-colors">
                        <LogOut className="h-4 w-4 rotate-180 text-gray-600 dark:text-gray-400 group-hover:text-blue-500" />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">Sign in</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          )}
        </motion.div>
      </div>

      <Dialog open={isAddSourceOpen} onOpenChange={setIsAddSourceOpen}>
        <DialogContent className="sm:max-w-[500px] bg-gradient-to-b from-white/95 via-white/90 to-white/95 dark:from-gray-900/95 dark:via-gray-900/90 dark:to-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-800/20 rounded-[32px] shadow-2xl p-0 overflow-hidden">
          <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
          <div className="relative">
            <DialogHeader className="space-y-4 p-8">
              <div className="space-y-2">
                <DialogTitle className="text-3xl font-bold text-gray-900 dark:text-white">
                  Add Source
                </DialogTitle>
                <DialogDescription className="text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                  Upload a file or paste text to create a new source for your notes.
                </DialogDescription>
              </div>
            </DialogHeader>
            <Tabs defaultValue="file" className="w-full">
              <TabsList className="w-full flex gap-2 px-8 mb-6">
                <TabsTrigger 
                  value="file" 
                  className={cn(
                    "flex-1 rounded-2xl border border-transparent data-[state=active]:border-gray-200/50 dark:data-[state=active]:border-gray-800/50",
                    "data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900",
                    "data-[state=active]:shadow-lg dark:data-[state=active]:shadow-black/20",
                    "transition-all duration-200",
                    "text-gray-700 dark:text-gray-300"
                  )}
                >
                  <div className="flex items-center gap-2.5 py-3">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50">
                      <FileText className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">File Upload</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">PDF, TXT, DOC</span>
                    </div>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="text" 
                  className={cn(
                    "flex-1 rounded-2xl border border-transparent data-[state=active]:border-gray-200/50 dark:data-[state=active]:border-gray-800/50",
                    "data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900",
                    "data-[state=active]:shadow-lg dark:data-[state=active]:shadow-black/20",
                    "transition-all duration-200",
                    "text-gray-700 dark:text-gray-300"
                  )}
                >
                  <div className="flex items-center gap-2.5 py-3">
                    <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/50">
                      <PenLine className="h-4 w-4 text-purple-500" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">Text Input</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Type or paste</span>
                    </div>
                  </div>
                </TabsTrigger>
              </TabsList>
              <div className="px-8 pb-8">
                <TabsContent value="file" className="focus-visible:outline-none focus-visible:ring-0 mt-0">
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 rounded-[24px] transition-all duration-500 group-hover:from-blue-500/10 group-hover:to-purple-500/10" />
                    <div className="relative border-2 border-dashed border-gray-200/50 dark:border-gray-800/50 rounded-[24px] transition-all duration-300">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] to-purple-500/[0.02] dark:from-blue-500/[0.05] dark:to-purple-500/[0.05] rounded-[22px]" />
                      <div className="relative p-8 text-center text-gray-700 dark:text-gray-300">
                        <Dropzone
                          onDrop={handleFileUpload}
                          loading={uploading}
                          maxSize={10 * 1024 * 1024}
                          accept={{
                            'application/pdf': ['.pdf'],
                            'text/plain': ['.txt'],
                            'application/msword': ['.doc'],
                            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {['.pdf', '.txt', '.doc', '.docx'].map((ext) => (
                      <div 
                        key={ext}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-black rounded-lg border border-gray-200/50 dark:border-gray-800/50 shadow-sm"
                      >
                        {ext}
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="text" className="focus-visible:outline-none focus-visible:ring-0 mt-0">
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 rounded-[24px] transition-all duration-500 group-hover:from-purple-500/10 group-hover:to-pink-500/10" />
                    <div className="relative">
                      <Textarea
                        placeholder="Enter or paste your text here..."
                        value={typedText}
                        onChange={(e) => setTypedText(e.target.value)}
                        className={cn(
                          "min-h-[240px] bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100",
                          "rounded-[24px] resize-none p-6",
                          "border-2 border-gray-200/50 dark:border-gray-800/50",
                          "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                          "focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/20",
                          "transition-all duration-200"
                        )}
                      />
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-right text-gray-400">
                    {typedText.length} characters
                  </div>
                </TabsContent>
                <div className="relative mt-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-md opacity-30 transition-opacity duration-500 hover:opacity-40" />
                  <Button 
                    onClick={handleAddSource}
                    disabled={!selectedFile && !typedText.trim()}
                    className={cn(
                      "relative w-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900",
                      "dark:from-gray-100 dark:via-gray-200 dark:to-gray-100",
                      "text-white dark:text-gray-900 rounded-2xl px-6 py-6 h-auto",
                      "font-semibold text-sm shadow-xl shadow-black/5",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "transition-all duration-200 group hover:scale-[1.02]",
                      "border border-gray-800/5 dark:border-white/5"
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative flex items-center justify-center gap-2">
                      <span>Save as Source</span>
                      <PlusCircle className="h-4 w-4 transition-transform group-hover:rotate-90 group-hover:scale-110" />
                    </div>
                  </Button>
                </div>
              </div>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {isSourceDialogOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm h-full w-full z-[80]"
              onClick={() => setIsSourceDialogOpen(false)}
            />
            <motion.div 
              className="fixed inset-0 grid place-items-center z-[85]"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <motion.button
                key={`close-button-${id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-6 right-6 flex items-center justify-center bg-white/95 dark:bg-black/95 rounded-xl h-10 w-10 hover:bg-gray-100/95 dark:hover:bg-gray-900/95 transition-all duration-200 border border-gray-200/20 dark:border-gray-800/20 shadow-sm hover:scale-105 active:scale-95"
                onClick={() => setIsSourceDialogOpen(false)}
              >
                <X className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </motion.button>
              <motion.div
                layoutId={`source-trigger-${id}`}
                ref={dialogRef}
                className="w-full max-w-[525px] h-fit max-h-[90vh] flex flex-col bg-gradient-to-b from-white/95 via-white/90 to-white/95 dark:from-black/95 dark:via-black/90 dark:to-black/95 backdrop-blur-xl rounded-[32px] overflow-hidden shadow-2xl mx-4 border border-white/20 dark:border-gray-800/20"
              >
                <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
                <div className="relative">
                  <div className="p-8 border-b border-gray-200/20 dark:border-gray-800/20">
                    <motion.h2 className="text-3xl font-bold bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
                      Sources
                    </motion.h2>
                    <motion.p className="text-base text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                      Manage your sources and add new ones.
                    </motion.p>
                  </div>

                  <div className="flex-1 overflow-auto p-8">
                    {sources.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-gray-100 via-gray-50 to-white dark:from-gray-800 dark:via-gray-900 dark:to-black flex items-center justify-center shadow-xl shadow-black/5">
                          <FileText className="h-10 w-10 text-gray-400" />
                        </div>
                        <p className="text-base text-gray-500 dark:text-gray-400 mb-6">No sources added yet</p>
                        <Button
                          variant="outline"
                          onClick={() => setIsAddSourceOpen(true)}
                          className={cn(
                            "inline-flex items-center gap-2.5 rounded-2xl px-8 h-12",
                            "bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-black",
                            "hover:bg-gray-100/50 dark:hover:bg-gray-900/50",
                            "border border-gray-200/50 dark:border-gray-800/50",
                            "transition-all duration-200 group hover:scale-105",
                            "shadow-lg shadow-black/5"
                          )}
                        >
                          <PlusCircle className="h-4 w-4 transition-transform group-hover:rotate-90 group-hover:scale-110" />
                          <span className="font-medium">Add Your First Source</span>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {sources.map((source, index) => (
                          <div
                            key={index}
                            className={cn(
                              "group flex items-center gap-4 p-4 rounded-2xl",
                              "bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-black",
                              "hover:bg-gray-100/50 dark:hover:bg-gray-800/50",
                              "border border-gray-200/50 dark:border-gray-800/50",
                              "transition-all duration-200 hover:scale-[1.02]",
                              "shadow-lg shadow-black/5",
                              selectedSources.includes(source) && "bg-gradient-to-r from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20 border-orange-200/20 dark:border-orange-800/20"
                            )}
                            onClick={() => onSourceSelect?.(source)}
                          >
                            <div className={cn(
                              "p-3 rounded-xl",
                              selectedSources.includes(source)
                                ? "bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/20 dark:to-orange-950/10"
                                : "bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900",
                              "transition-colors duration-200"
                            )}>
                              <FileText className={cn(
                                "h-5 w-5",
                                selectedSources.includes(source)
                                  ? "text-orange-500"
                                  : "text-gray-400 group-hover:text-gray-500"
                              )} />
                            </div>
                            <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                              {source}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={async (e) => {
                                e.stopPropagation();
                                setDeletingSourceId(source);
                                try {
                                  await onSourceDelete?.(source);
                                } finally {
                                  setDeletingSourceId(null);
                                }
                              }}
                              disabled={deletingSourceId === source}
                              className={cn(
                                "h-10 w-10",
                                "hover:bg-red-100/50 dark:hover:bg-red-900/30",
                                "text-gray-400 dark:text-gray-500",
                                "hover:text-red-600 dark:hover:text-red-400",
                                "rounded-xl transition-all duration-200",
                                "opacity-0 group-hover:opacity-100 dark:opacity-100",
                                deletingSourceId === source && "opacity-100"
                              )}
                            >
                              {deletingSourceId === source ? (
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                              ) : (
                                <Trash2 className="h-5 w-5" />
                              )}
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          onClick={() => setIsAddSourceOpen(true)}
                          className={cn(
                            "w-full gap-2.5 rounded-2xl h-12 mt-6",
                            "bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-black",
                            "hover:bg-gray-100/50 dark:hover:bg-gray-900/50",
                            "border border-gray-200/50 dark:border-gray-800/50",
                            "transition-all duration-200 group hover:scale-[1.02]",
                            "shadow-lg shadow-black/5",
                            "text-gray-700 dark:text-gray-200"
                          )}
                        >
                          <PlusCircle className="h-4 w-4 transition-transform group-hover:rotate-90 group-hover:scale-110 text-gray-600 dark:text-gray-300" />
                          <span className="font-medium">Add Source</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeCard && typeof activeCard === "object" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm h-full w-full z-[80]"
            onClick={() => setActiveCard(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeCard && typeof activeCard === "object" ? (
          <div className="fixed inset-0 grid place-items-center z-[85]">
            <motion.button
              key={`close-button-${id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-4 right-4 flex items-center justify-center bg-white dark:bg-gray-800 rounded-full h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => setActiveCard(null)}
            >
              <X className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            </motion.button>
            <motion.div
              layoutId={`card-${activeCard.title}-${id}`}
              ref={cardDialogRef}
              className="w-full max-w-[500px] h-full md:h-fit md:max-h-[90vh] flex flex-col bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl mx-4"
            >
              <motion.div layoutId={`image-${activeCard.title}-${id}`}>
                <Image
                  priority
                  width={200}
                  height={200}
                  src={activeCard.src}
                  alt={activeCard.title}
                  className="w-full h-80 lg:h-80 sm:rounded-tr-lg sm:rounded-tl-lg object-cover object-top"
                />
              </motion.div>

              <div>
                <div className="flex justify-between items-start p-4">
                  <div className="">
                    <motion.h3
                      layoutId={`title-${activeCard.title}-${id}`}
                      className="font-bold text-gray-900 dark:text-gray-100"
                    >
                      {activeCard.title}
                    </motion.h3>
                    <motion.p
                      layoutId={`description-${activeCard.description}-${id}`}
                      className="text-gray-500 dark:text-gray-400"
                    >
                      {activeCard.description}
                    </motion.p>
                  </div>

                  <motion.a
                    layoutId={`button-${activeCard.title}-${id}`}
                    href={activeCard.ctaLink}
                    target="_blank"
                    className="px-4 py-3 text-sm rounded-full font-bold bg-blue-500 text-white"
                  >
                    {activeCard.ctaText}
                  </motion.a>
                </div>
                <div className="pt-4 relative px-4">
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-gray-600 dark:text-gray-400 text-xs md:text-sm lg:text-base h-40 md:h-fit pb-10 flex flex-col items-start gap-4 overflow-auto [mask:linear-gradient(to_bottom,white,white,transparent)] [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch]"
                  >
                    {activeCard && typeof activeCard !== 'boolean' && renderCardContent(activeCard.content)}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      {cards.length > 0 && !isMinimized && (
        <ul className="fixed left-24 top-1/2 -translate-y-1/2 max-w-[300px] w-full gap-4 z-50">
          {cards.map((card) => (
            <motion.div
              layoutId={`card-${card.title}-${id}`}
              key={`card-${card.title}-${id}`}
              onClick={() => setActiveCard(card)}
              className="p-4 flex flex-col md:flex-row justify-between items-center hover:bg-white/80 dark:hover:bg-gray-800/80 backdrop-blur-sm rounded-xl cursor-pointer border border-gray-200/50 dark:border-gray-800/50 shadow-sm mb-4"
            >
              <div className="flex gap-4 flex-col md:flex-row">
                <motion.div layoutId={`image-${card.title}-${id}`}>
                  <Image
                    width={100}
                    height={100}
                    src={card.src}
                    alt={card.title}
                    className="h-40 w-40 md:h-14 md:w-14 rounded-lg object-cover object-top"
                  />
                </motion.div>
                <div className="">
                  <motion.h3
                    layoutId={`title-${card.title}-${id}`}
                    className="font-medium text-gray-900 dark:text-gray-100 text-center md:text-left"
                  >
                    {card.title}
                  </motion.h3>
                  <motion.p
                    layoutId={`description-${card.description}-${id}`}
                    className="text-gray-500 dark:text-gray-400 text-center md:text-left"
                  >
                    {card.description}
                  </motion.p>
                </div>
              </div>
              <motion.button
                layoutId={`button-${card.title}-${id}`}
                className="px-4 py-2 text-sm rounded-full font-bold bg-gray-100 hover:bg-blue-500 hover:text-white text-gray-900 mt-4 md:mt-0"
              >
                {card.ctaText}
              </motion.button>
            </motion.div>
          ))}
        </ul>
      )}
    </aside>
  )
}

<style jsx global>{`
  @keyframes slide-in-right {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slide-out-right {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }

  @keyframes bounce {
    0%, 100% {
      transform: translateX(0);
    }
    50% {
      transform: translateX(-4px);
    }
  }
`}</style>


//@sidebar.tsx @dropezone.tsx when i open my app in first time file not uploading after i refresh then it work 