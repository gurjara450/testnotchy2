import React from "react";
import { cn } from "@/lib/utils";
import Image from 'next/image';
import { motion, HTMLMotionProps } from "framer-motion";
import { 
  RiBookLine, 
  RiFunctionLine,
  RiTimeLine, 
  RiFlaskLine, 
  RiTranslate2,
  RiCodeLine,
  RiCalendarLine,
  RiFileListLine
} from 'react-icons/ri';
import { GeistMono } from 'geist/font/mono';

interface CaseStudyCardProps extends HTMLMotionProps<"div"> {
  title?: string;
  category?: string;
  image?: string;
  logo?: string;
  link?: string;
  type?: "content" | "simple-image";
  stats?: {
    notes: number;
    lastEdited: string;
  };
}

// Icon mapping based on notebook type
const getIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case "math":
      return <RiFunctionLine className="h-5 w-5" />;
    case "history":
      return <RiTimeLine className="h-5 w-5" />;
    case "science":
      return <RiFlaskLine className="h-5 w-5" />;
    case "language":
      return <RiTranslate2 className="h-5 w-5" />;
    case "development":
      return <RiCodeLine className="h-5 w-5" />;
    default:
      return <RiBookLine className="h-5 w-5" />;
  }
};

// Get gradient based on notebook type
const getGradient = (type: string) => {
  switch (type?.toLowerCase()) {
    case "math":
      return "from-blue-500/10 via-blue-500/5 to-purple-500/10 dark:from-blue-400/20 dark:via-blue-500/10 dark:to-purple-400/20";
    case "history":
      return "from-amber-500/10 via-amber-500/5 to-red-500/10 dark:from-amber-400/20 dark:via-amber-500/10 dark:to-red-400/20";
    case "science":
      return "from-green-500/10 via-green-500/5 to-teal-500/10 dark:from-green-400/20 dark:via-green-500/10 dark:to-teal-400/20";
    case "language":
      return "from-pink-500/10 via-pink-500/5 to-rose-500/10 dark:from-pink-400/20 dark:via-pink-500/10 dark:to-rose-400/20";
    default:
      return "from-gray-500/10 via-gray-500/5 to-slate-500/10 dark:from-gray-400/20 dark:via-gray-500/10 dark:to-slate-400/20";
  }
};

// Get accent color based on notebook type
const getAccentColor = (type: string) => {
  switch (type?.toLowerCase()) {
    case "math":
      return "bg-blue-500/10 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300";
    case "history":
      return "bg-amber-500/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300";
    case "science":
      return "bg-green-500/10 text-green-700 dark:bg-green-400/10 dark:text-green-300";
    case "language":
      return "bg-pink-500/10 text-pink-700 dark:bg-pink-400/10 dark:text-pink-300";
    default:
      return "bg-gray-500/10 text-gray-700 dark:bg-gray-400/10 dark:text-gray-300";
  }
};

// ContentCard Component for rendering text + image
const ContentCard: React.FC<CaseStudyCardProps> = ({ 
  title, 
  category, 
  image, 
  logo, 
  stats 
}) => {
  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl bg-white/50 dark:bg-black backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/20 p-6 transition-all duration-300 group">
      {/* Background gradient */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-50 transition-opacity duration-300 group-hover:opacity-70",
        getGradient(category || "")
      )} />

      {/* Content */}
      <div className="relative z-10 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            {category && (
              <div className={cn(
                "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium backdrop-blur-md transition-colors duration-300",
                getAccentColor(category),
                GeistMono.className
              )}>
                {getIcon(category)}
                <span>{category.charAt(0).toUpperCase() + category.slice(1)}</span>
              </div>
            )}
            {title && (
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50 transition-colors duration-300">
                {title}
              </h3>
            )}
          </div>
          {logo && (
            <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-gray-200/50 dark:border-gray-800/20 transition-colors duration-300">
              <Image
                src={logo}
                alt={title || "Logo"}
                fill
                className="object-cover"
              />
            </div>
          )}
        </div>

        {/* Stats Section */}
        {stats && (
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
            <div className="flex items-center gap-1">
              <RiFileListLine className="h-4 w-4" />
              <span>{stats.notes} notes</span>
            </div>
            <div className="flex items-center gap-1">
              <RiCalendarLine className="h-4 w-4" />
              <span>Edited {stats.lastEdited}</span>
            </div>
          </div>
        )}
      </div>

      {/* Preview Image */}
      {image && (
        <div className="relative mt-6 aspect-[4/3] w-full overflow-hidden rounded-xl border border-gray-200/50 dark:border-gray-800/20 transition-colors duration-300">
          <Image
            src={image}
            alt={title || "Preview"}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100 blur-xl -z-10" />
    </div>
  );
};

// SimpleImageCard component for rendering only image
const SimpleImageCard: React.FC<CaseStudyCardProps> = ({ image, title }) => {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-gray-200/50 dark:border-gray-800/20 transition-colors duration-300">
      {image ? (
        <Image
          src={image}
          alt={title || "Preview"}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="h-full w-full bg-gray-100 dark:bg-gray-800" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/40 to-transparent dark:from-black via-black/40 dark:to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </div>
  );
};

// Main CaseStudyCard Component
export default function CaseStudyCard({
  title,
  category,
  link,
  image,
  logo,
  type = "content",
  stats,
  className,
  ...props
}: CaseStudyCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn("group relative h-full", className)}
      {...props}
    >
      <a href={link} className="block h-full">
        {type === "content" ? (
          <ContentCard
            title={title}
            category={category}
            image={image}
            logo={logo}
            stats={stats}
          />
        ) : (
          <SimpleImageCard
            image={image}
            title={title}
          />
        )}
      </a>
    </motion.div>
  );
}
