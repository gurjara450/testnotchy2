'use client'

import * as React from 'react'
import { Button } from "@/components/ui/button"
import { MessageSquare } from 'lucide-react'
import { SlidingDrawer } from '@/components/notebook/sliding-drawer'

interface FooterWithSourceDialogProps {
  selectedFile: File | null;
  currentFileKey?: string;
  addNote: (noteContent: string) => void;
}

export default function FooterWithSourceDialog({
  selectedFile,
  currentFileKey,
  addNote,
}: FooterWithSourceDialogProps) {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)

  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4 footer-component">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <Button
          variant="ghost"
          className="text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={() => setIsDrawerOpen(true)}
        >
          <MessageSquare className="h-5 w-5 mr-2" />
          View Chat
        </Button>

        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {selectedFile ? selectedFile.name : 'No file selected'}
          </span>
        </div>

        <SlidingDrawer 
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          addNote={addNote}
          fileKey={currentFileKey}
        />
      </div>
    </footer>
  );
}