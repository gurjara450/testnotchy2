'use client';

import * as React from 'react';
import { Sidebar } from "@/components/notebook/sidebar";
import { Header } from "@/components/notebook/header";
import { NoteList } from "@/components/notebook/note-list";
import { NoteInput } from "@/components/notebook/note-input";
import { SlidingDrawer } from "@/components/notebook/sliding-drawer";
import { useToast } from "@/components/ui/use-toast";
import { StudentSidebar } from "@/components/notebook/student-sidebar";
import { cn } from "@/lib/utils";
import { useParams } from 'next/navigation';
import { Note } from "@/lib/types";
import { AnimatePresence, motion } from 'framer-motion';

interface Source {
  id: number;
  name: string;
  key: string;
  type: string;
  notebookId: number;
}

interface SourceSelection {
  name: string;
  key: string;
}

export default function ModulePage() {
  const notebookId = useParams().id as string;
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [sources, setSources] = React.useState<Source[]>([]);
  const [selectedSources, setSelectedSources] = React.useState<SourceSelection[]>([]);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [sourceFile, setSourceFile] = React.useState<SourceSelection | undefined>();
  const [isStudentSidebarFixed, setIsStudentSidebarFixed] = React.useState(false);
  const [notebookName, setNotebookName] = React.useState<string>("");
  const [isAIDrawerOpen, setIsAIDrawerOpen] = React.useState(false);
  const [tempSourceFile, setTempSourceFile] = React.useState<SourceSelection | null>(null);
  const { toast } = useToast();

  // Fetch notebook data when component mounts
  React.useEffect(() => {
    const fetchNotebookData = async () => {
      try {
        const response = await fetch(`/api/notebooks?id=${notebookId}`);
        if (!response.ok) throw new Error("Failed to fetch notebook");

        const data = await response.json();
        if (data.notebook) {
          setNotebookName(data.notebook.name);
        }
      } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "Failed to fetch notebook data." });
      }
    };

    if (notebookId) {
      fetchNotebookData();
    }
  }, [notebookId, toast]);

  // Load notes when the notebook is opened
  React.useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await fetch(`/api/notes?notebookId=${notebookId}`);
        if (!response.ok) throw new Error("Failed to fetch notes");

        const data = await response.json();
        if (data.notes) {
          setNotes(data.notes);
        }
      } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "Failed to fetch notes." });
      }
    };

    if (notebookId) {
      fetchNotes();
    }
  }, [notebookId, toast]);

  // Load sources when the notebook is opened
  React.useEffect(() => {
    const fetchSources = async () => {
      try {
        const response = await fetch(`/api/sources?notebookId=${notebookId}`);
        if (!response.ok) throw new Error("Failed to fetch sources");

        const data = await response.json();
        if (data.sources) {
          setSources(data.sources);
          // If there was a previously selected source, restore it
          const lastSource = data.sources[0] as Source;
          if (lastSource) {
            setSourceFile({
              name: lastSource.name,
              key: lastSource.key
            });
          }
        }
      } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "Failed to fetch sources." });
      }
    };

    if (notebookId) {
      fetchSources();
    }
  }, [notebookId, toast]);

  const addNote = React.useCallback(async (noteContent: string) => {
    if (noteContent.trim()) {
      try {
        const response = await fetch('/api/notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            notebookId: parseInt(notebookId, 10),
            content: noteContent,
            pinned: false,
            background: 'plain',
            font: 'default'
          }),
        });

        if (!response.ok) throw new Error("Failed to save note");

        const data = await response.json();
        setNotes(prevNotes => [data.note, ...prevNotes]);
        toast({ title: "Note Added", description: "Your note has been added." });
      } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "Failed to save note." });
      }
    }
  }, [notebookId, toast]);

  const deleteNote = async (id: number) => {
    try {
      const response = await fetch(`/api/notes?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error("Failed to delete note");

      setNotes(notes.filter((note) => note.id !== id));
      toast({ title: "Note Deleted", description: "Your note has been deleted." });
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to delete note." });
    }
  };

  const togglePinNote = async (id: number) => {
    try {
      const note = notes.find(n => n.id === id);
      if (!note) return;

      const response = await fetch('/api/notes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          content: note.content,
          pinned: !note.pinned,
          background: note.background,
          font: note.font
        }),
      });

      if (!response.ok) throw new Error("Failed to update note");

      setNotes(notes.map((note) => (note.id === id ? { ...note, pinned: !note.pinned } : note)));
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to update note." });
    }
  };

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const updateNoteStyle = async (id: number, updates: Partial<Note>) => {
    try {
      const note = notes.find(n => n.id === id);
      if (!note) return;

      const response = await fetch('/api/notes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          content: note.content,
          pinned: note.pinned,
          background: updates.background || note.background,
          font: updates.font || note.font
        }),
      });

      if (!response.ok) throw new Error("Failed to update note style");

      setNotes(notes.map((note) => 
        note.id === id ? { ...note, ...updates } : note
      ));
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to update note style." });
    }
  };

  const uploadSource = async (fileName: string, fileKey: string) => {
    try {
      const response = await fetch('/api/sources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notebookId: parseInt(notebookId, 10),
          name: fileName,
          key: fileKey,
          type: 'file'
        }),
      });

      if (!response.ok) throw new Error("Failed to save source");
      
      const data = await response.json();
      setSources(prev => [...prev, data.source]);
      if (tempSourceFile?.key === fileKey) {
        setSourceFile(tempSourceFile);
        setTempSourceFile(null);
      }
      toast({ title: "Source Uploaded", description: `${fileName} has been added.` });
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to save source." });
    }
  };

  const handleSourceSelect = (source: SourceSelection) => {
    setSelectedSources(prev => {
      const isSelected = prev.some(s => s.key === source.key);
      if (isSelected) {
        return prev.filter(s => s.key !== source.key);
      } else {
        return [...prev, source];
      }
    });
  };

  // Add handleNameChange function
  const handleNameChange = async (newName: string) => {
    try {
      const response = await fetch(`/api/notebooks`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: parseInt(notebookId, 10),
          name: newName
        }),
      });

      if (!response.ok) throw new Error("Failed to update notebook name");

      setNotebookName(newName);
      toast({ title: "Success", description: "Notebook name updated successfully." });
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to update notebook name." });
    }
  };

  return (
    <div className={`min-h-screen font-sans ${isDarkMode ? 'dark' : ''}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key="notebook-page"
          initial={{ 
            opacity: 0,
            y: "100%"
          }}
          animate={{ 
            opacity: 1,
            y: "0%",
            transition: {
              duration: 0.5,
              type: "spring",
              damping: 20,
              stiffness: 100
            }
          }}
          exit={{ opacity: 0, y: "100%" }}
          className="flex h-screen dark:bg-black"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 1,
              transition: { delay: 0.2, duration: 0.3 }
            }}
          >
            <Sidebar
              onAIDrawerOpen={() => setIsAIDrawerOpen(true)}
              sources={sources.map(s => s.name)}
              onSourceSelect={(sourceName: string) => {
                const source = sources.find(s => s.name === sourceName);
                if (source) {
                  handleSourceSelect({ name: source.name, key: source.key });
                }
              }}
              selectedSources={selectedSources.map(s => s.name)}
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              uploadSource={uploadSource}
              onSourceFileChange={(file) => setSourceFile(file)}
              onSourceDelete={async (sourceName) => {
                const source = sources.find(s => s.name === sourceName);
                if (!source) return;

                try {
                  const response = await fetch(`/api/sources?id=${source.id}`, {
                    method: 'DELETE',
                  });

                  if (!response.ok) throw new Error("Failed to delete source");

                  setSources(sources.filter(s => s.id !== source.id));
                  setSelectedSources(prev => prev.filter(s => s.key !== source.key));
                  toast({ title: "Source Deleted", description: "Source has been removed." });
                } catch (error) {
                  console.error(error);
                  toast({ title: "Error", description: "Failed to delete source." });
                }
              }}
            />
          </motion.div>

          <motion.div 
            className={cn(
              "flex-1 flex flex-col min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-50",
              isStudentSidebarFixed && "mr-80 rounded-r-[2rem] overflow-hidden"
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: 1,
              y: 0,
              transition: {
                duration: 0.4,
                delay: 0.3,
                ease: [0.22, 1, 0.36, 1]
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1,
                y: 0,
                transition: {
                  duration: 0.3,
                  delay: 0.5
                }
              }}
            >
              <Header 
                isDarkMode={isDarkMode} 
                toggleDarkMode={toggleDarkMode} 
                notebookName={notebookName} 
                onNameChange={handleNameChange}
              />
            </motion.div>
            
            <motion.main 
              className="flex-1 overflow-auto px-6 py-4 bg-gray-50/50 dark:bg-black"
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1,
                y: 0,
                transition: {
                  duration: 0.3,
                  delay: 0.6
                }
              }}
            >
              <div className="max-w-4xl mx-auto space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1,
                    y: 0,
                    transition: {
                      duration: 0.3,
                      delay: 0.7
                    }
                  }}
                >
                  <NoteInput 
                    onAddNote={addNote} 
                    userId="default-user"
                    sourceFile={sourceFile}
                    selectedSources={selectedSources}
                  />
                </motion.div>
                
                <motion.div 
                  id="notes" 
                  className="space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1,
                    y: 0,
                    transition: {
                      duration: 0.3,
                      delay: 0.8
                    }
                  }}
                >
                  <NoteList notes={notes} onDelete={deleteNote} onPin={togglePinNote} onUpdateStyle={updateNoteStyle} />
                </motion.div>
                
                <div className="mt-8">
                  <SlidingDrawer 
                    isOpen={isAIDrawerOpen}
                    onClose={() => setIsAIDrawerOpen(false)}
                    addNote={addNote}
                    fileKeys={selectedSources.map(s => s.key)}
                    sources={sources.map(s => ({ name: s.name, key: s.key }))}
                    selectedSources={selectedSources}
                    onSourceSelect={handleSourceSelect}
                  />
                </div>
              </div>
            </motion.main>
          </motion.div>
          
          {/* Student Sidebar with animation */}
          <AnimatePresence>
            {isStudentSidebarFixed ? (
              <motion.div 
                className="fixed right-0 top-0 bottom-0 w-80"
                initial={{ opacity: 0, x: "100%" }}
                animate={{ 
                  opacity: 1,
                  x: "0%",
                  transition: {
                    duration: 0.5,
                    type: "spring",
                    damping: 20,
                    stiffness: 100,
                    delay: 0.4
                  }
                }}
                exit={{ opacity: 0, x: "100%" }}
              >
                <StudentSidebar 
                  isFixed={isStudentSidebarFixed}
                  onToggleFixed={() => setIsStudentSidebarFixed(!isStudentSidebarFixed)}
                />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ 
                  opacity: 1,
                  x: 0,
                  transition: {
                    duration: 0.3,
                    delay: 0.4
                  }
                }}
              >
                <StudentSidebar 
                  className="rounded-l-[2rem]"
                  isFixed={isStudentSidebarFixed}
                  onToggleFixed={() => setIsStudentSidebarFixed(!isStudentSidebarFixed)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}