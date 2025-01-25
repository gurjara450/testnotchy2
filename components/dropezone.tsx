'use client';

import { useCallback, useState } from 'react';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { useDropzone, FileRejection } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, X, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropzoneProps {
  onDrop: (files: File[]) => void;
  loading: boolean;
  maxSize?: number;
  accept?: Record<string, string[]>;
}

export const Dropzone: React.FC<DropzoneProps> = ({ 
  onDrop, 
  loading, 
  maxSize = 10 * 1024 * 1024,
  accept = { 'application/pdf': ['.pdf'] }
}) => {
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const onDropFiles = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    setError(null);
    setUploadSuccess(false);

    if (rejectedFiles.length > 0) {
      const error = rejectedFiles[0].errors[0];
      if (error.code === 'file-too-large') {
        setError(`File is too large. Max size is ${maxSize / (1024 * 1024)}MB`);
      } else if (error.code === 'file-invalid-type') {
        setError('Invalid file type. Please upload a PDF file');
      } else {
        setError('Error uploading file. Please try again.');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      setUploadSuccess(true);
      onDrop(acceptedFiles);
    }
  }, [onDrop, maxSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropFiles,
    accept,
    maxSize,
    maxFiles: 1,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  });

  return (
    <div className={cn("w-full perspective-1000", GeistSans.className)}>
      <div {...getRootProps()}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={cn(
            'relative overflow-hidden rounded-[24px] transition-all duration-300',
            'backdrop-blur-sm bg-gradient-to-b from-white/40 to-white/30 dark:from-gray-900/40 dark:to-gray-900/30 border border-gray-200/20 dark:border-gray-700/20',
            'group cursor-pointer',
            {
              'ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-900': dragActive || isDragActive,
              'ring-2 ring-red-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-900': error,
              'ring-2 ring-green-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-900': uploadSuccess && !loading,
              'hover:ring-2 hover:ring-blue-400 hover:ring-offset-2 hover:ring-offset-white dark:hover:ring-offset-gray-900': !dragActive && !isDragActive && !error && !uploadSuccess,
              'opacity-50 cursor-not-allowed': loading,
            }
          )}
        >
          <input {...getInputProps()} />
          
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />
          <div className={cn(
            'absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent',
            'translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000',
            'pointer-events-none'
          )} />
          
          <div className="relative p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={loading ? 'loading' : error ? 'error' : uploadSuccess ? 'success' : dragActive ? 'drag' : 'idle'}
                className="relative z-10 flex flex-col items-center justify-center gap-4 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                {loading ? (
                  <>
                    <div className="relative">
                      {/* Outer glow */}
                      <div className="absolute inset-[-8px] bg-blue-500/10 rounded-full blur-xl animate-pulse" />
                      
                      {/* Spinning circles */}
                      <div className="relative w-16 h-16">
                        <motion.div
                          className="absolute inset-0 rounded-full border-4 border-blue-500/30"
                          animate={{
                            rotate: 360,
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear"
                          }}
                        />
                        <motion.div
                          className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500"
                          animate={{
                            rotate: 360,
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "linear"
                          }}
                        />
                        <motion.div
                          className="absolute inset-2 rounded-full border-4 border-blue-500/20"
                          animate={{
                            rotate: -360,
                          }}
                          transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: "linear"
                          }}
                        />
                        <motion.div
                          className="absolute inset-2 rounded-full border-4 border-transparent border-t-blue-500"
                          animate={{
                            rotate: -360,
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear"
                          }}
                        />
                        
                        {/* Center dot with glow */}
                        <motion.div 
                          className="absolute inset-[22px] bg-blue-500 rounded-full shadow-lg"
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 1, 0.5],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          <div className="absolute inset-0 bg-blue-400 rounded-full blur-sm" />
                        </motion.div>
                      </div>

                      {/* Orbiting dots */}
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute left-1/2 top-1/2 h-2 w-2"
                          animate={{
                            rotate: 360,
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear",
                            delay: i * 0.3,
                          }}
                          style={{
                            transformOrigin: `0 ${40}px`,
                          }}
                        >
                          <motion.div
                            className="h-2 w-2 bg-blue-500 rounded-full"
                            animate={{
                              scale: [1, 1.5, 1],
                              opacity: [0.8, 1, 0.8],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut",
                              delay: i * 0.3,
                            }}
                          >
                            <div className="absolute inset-0 bg-blue-400 rounded-full blur-sm" />
                          </motion.div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="space-y-2 mt-4">
                      <motion.p
                        className="text-base font-medium bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        Processing your file...
                      </motion.p>
                      <motion.div 
                        className="h-1 w-32 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <motion.div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                          animate={{
                            x: ["-100%", "100%"],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        />
                      </motion.div>
                    </div>
                  </>
                ) : error ? (
                  <>
                    <motion.div
                      initial={{ scale: 0.5, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", duration: 0.5 }}
                      className="relative"
                    >
                      <div className="absolute inset-0 bg-red-100 dark:bg-red-900/30 rounded-full blur-xl" />
                      <X className="relative h-14 w-14 text-red-500" />
                    </motion.div>
                    <motion.p
                      className="text-base font-medium text-red-500"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {error}
                    </motion.p>
                  </>
                ) : uploadSuccess && !loading ? (
                  <>
                    <motion.div
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", duration: 0.5 }}
                      className="relative"
                    >
                      <div className="absolute inset-0 bg-green-100 dark:bg-green-900/30 rounded-full blur-xl" />
                      <CheckCircle2 className="relative h-14 w-14 text-green-500" />
                    </motion.div>
                    <motion.p
                      className="text-base font-medium text-green-500"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      File uploaded successfully!
                    </motion.p>
                  </>
                ) : dragActive || isDragActive ? (
                  <>
                    <motion.div
                      animate={{
                        y: [0, -10, 0],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="relative"
                    >
                      <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 rounded-full blur-xl" />
                      <File className="relative h-14 w-14 text-blue-500" />
                    </motion.div>
                    <p className="text-base font-medium text-blue-500">Release to drop your file</p>
                  </>
                ) : (
                  <>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      className="relative"
                    >
                      <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800/50 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <Upload className="relative h-14 w-14 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 transition-colors duration-300" />
                    </motion.div>
                    <div className="space-y-2">
                      <p className="text-base text-gray-600 dark:text-gray-300">
                        <motion.span
                          className="inline-block"
                          whileHover={{ scale: 1.02 }}
                        >
                          Drag & drop your file here, or{' '}
                          <span className="text-blue-500 hover:text-blue-600 cursor-pointer font-medium transition-colors">
                            browse
                          </span>
                        </motion.span>
                      </p>
                      <div className="flex items-center justify-center gap-3">
                        {Object.values(accept).flat().map((ext) => (
                          <span 
                            key={ext}
                            className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-md"
                          >
                            {ext}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-gray-400 dark:text-gray-500">
                        Maximum file size:{' '}
                        <span className={cn(GeistMono.className, "text-gray-600 dark:text-gray-300")}>
                          {maxSize / (1024 * 1024)}MB
                        </span>
                      </p>
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};