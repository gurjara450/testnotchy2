"use client"

import React, {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  TextareaHTMLAttributes,
} from "react"
import { ArrowLeftIcon } from "lucide-react"
import { AnimatePresence, MotionConfig, Variants, motion } from "framer-motion"

import { cn } from "@/lib/utils"

const TRANSITION = {
  type: "spring",
  bounce: 0.1,
  duration: 0.4,
}

interface FloatingPanelContextType {
  isOpen: boolean
  openFloatingPanel: () => void
  closeFloatingPanel: () => void
  uniqueId: string
  note: string
  setNote: (note: string) => void
  title: string
  setTitle: (title: string) => void
}

const FloatingPanelContext = createContext<FloatingPanelContextType | undefined>(
  undefined
)

export const useFloatingPanel = () => {
  const context = useContext(FloatingPanelContext)
  if (!context) {
    throw new Error("useFloatingPanel must be used within FloatingPanelProvider")
  }
  return context
}

function useFloatingPanelLogic() {
  const uniqueId = useId()
  const [isOpen, setIsOpen] = useState(false)
  const [note, setNote] = useState("")
  const [title, setTitle] = useState("")

  const openFloatingPanel = () => {
    setIsOpen(true)
  }
  const closeFloatingPanel = () => {
    setIsOpen(false)
    setNote("")
  }

  return {
    isOpen,
    openFloatingPanel,
    closeFloatingPanel,
    uniqueId,
    note,
    setNote,
    title,
    setTitle,
  }
}

interface FloatingPanelRootProps {
  children: React.ReactNode
  className?: string
}

export function FloatingPanelRoot({
  children,
  className,
}: FloatingPanelRootProps) {
  const floatingPanelLogic = useFloatingPanelLogic()

  return (
    <FloatingPanelContext.Provider value={floatingPanelLogic}>
      <MotionConfig transition={TRANSITION}>
        <div className={cn("relative", className)}>{children}</div>
      </MotionConfig>
    </FloatingPanelContext.Provider>
  )
}

interface FloatingPanelTriggerProps {
  children: React.ReactNode
  className?: string
  title: string
}

export function FloatingPanelTrigger({
  children,
  className,
  title,
}: FloatingPanelTriggerProps) {
  const { openFloatingPanel, uniqueId, setTitle, isOpen } = useFloatingPanel()
  const triggerRef = useRef<HTMLButtonElement>(null)

  const handleClick = () => {
    openFloatingPanel()
    setTitle(title)
  }

  return (
    <motion.button
      ref={triggerRef}
      layoutId={`floating-panel-trigger-${uniqueId}`}
      className={cn(
        "flex h-9 items-center border border-zinc-950/10 bg-white px-3 text-zinc-950 dark:border-zinc-50/10 dark:bg-zinc-700 dark:text-zinc-50",
        className
      )}
      style={{ borderRadius: 8 }}
      onClick={handleClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
    >
      <motion.div
        layoutId={`floating-panel-label-container-${uniqueId}`}
        className="flex items-center"
      >
        <motion.span
          layoutId={`floating-panel-label-${uniqueId}`}
          className="text-sm font-semibold"
        >
          {children}
        </motion.span>
      </motion.div>
    </motion.button>
  )
}

interface FloatingPanelContentProps {
  children: React.ReactNode
  className?: string
  isResizable?: boolean
  defaultSize?: { width: number; height: number }
}

export function FloatingPanelContent({
  children,
  className,
  isResizable = false,
  defaultSize,
}: FloatingPanelContentProps) {
  const { isOpen, closeFloatingPanel, uniqueId, title } = useFloatingPanel()
  const contentRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef({ x: 0, y: 0, panelX: 0, panelY: 0 })
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 })
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [size, setSize] = useState(defaultSize || { width: 800, height: 600 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)

  // Set initial position
  useEffect(() => {
    if (isOpen && contentRef.current) {
      const panel = contentRef.current
      const panelWidth = isResizable ? size.width : panel.offsetWidth
      const panelHeight = isResizable ? size.height : panel.offsetHeight
      
      const newX = (window.innerWidth - panelWidth) / 2
      const newY = window.innerHeight * 0.1
      
      setPosition({
        x: Math.max(20, Math.min(newX, window.innerWidth - panelWidth - 20)),
        y: Math.max(20, Math.min(newY, window.innerHeight - panelHeight - 20))
      })
    }
  }, [isOpen, size.width, size.height, isResizable])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (contentRef.current) {
        const panel = contentRef.current
        const panelWidth = isResizable ? size.width : panel.offsetWidth
        const panelHeight = isResizable ? size.height : panel.offsetHeight
        
        setPosition(prev => ({
          x: Math.min(Math.max(prev.x, 20), window.innerWidth - panelWidth - 20),
          y: Math.min(Math.max(prev.y, 20), window.innerHeight - panelHeight - 20)
        }))

        // Adjust size if it exceeds window bounds
        if (isResizable) {
          setSize(prev => ({
            width: Math.min(prev.width, window.innerWidth - position.x - 40),
            height: Math.min(prev.height, window.innerHeight - position.y - 40)
          }))
        }
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isResizable, size.width, size.height, position.x, position.y])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && 
          !contentRef.current.contains(event.target as Node) && 
          !isDragging) {
        closeFloatingPanel()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [closeFloatingPanel, isDragging])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeFloatingPanel()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [closeFloatingPanel])

  // Custom drag handlers
  const handleDragStart = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (!contentRef.current) return
    
    setIsDragging(true)
    dragStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      panelX: position.x,
      panelY: position.y
    }

    const handleDrag = (e: MouseEvent) => {
      if (!contentRef.current) return

      const deltaX = e.clientX - dragStartRef.current.x
      const deltaY = e.clientY - dragStartRef.current.y
      const panel = contentRef.current

      const newX = dragStartRef.current.panelX + deltaX
      const newY = dragStartRef.current.panelY + deltaY

      const maxX = window.innerWidth - panel.offsetWidth - 20
      const maxY = window.innerHeight - panel.offsetHeight - 20

      requestAnimationFrame(() => {
        setPosition({
          x: Math.min(Math.max(newX, 20), maxX),
          y: Math.min(Math.max(newY, 20), maxY)
        })
      })
    }

    const handleDragEnd = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleDrag)
      document.removeEventListener('mouseup', handleDragEnd)
      document.body.style.cursor = ''
    }

    document.addEventListener('mousemove', handleDrag)
    document.addEventListener('mouseup', handleDragEnd)
    document.body.style.cursor = 'grabbing'
  }

  // Custom resize handlers
  const handleResizeStart = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (!contentRef.current) return
    
    setIsResizing(true)
    resizeStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      width: size.width,
      height: size.height
    }

    const handleResize = (e: MouseEvent) => {
      e.preventDefault()
      if (!contentRef.current) return

      const deltaX = e.clientX - resizeStartRef.current.x
      const deltaY = e.clientY - resizeStartRef.current.y

      requestAnimationFrame(() => {
        const newWidth = Math.max(400, Math.min(
          resizeStartRef.current.width + deltaX,
          window.innerWidth - position.x - 40
        ))
        const newHeight = Math.max(300, Math.min(
          resizeStartRef.current.height + deltaY,
          window.innerHeight - position.y - 40
        ))

        setSize({ width: newWidth, height: newHeight })
      })
    }

    const handleResizeEnd = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleResize)
      document.removeEventListener('mouseup', handleResizeEnd)
      document.body.style.cursor = ''
    }

    document.addEventListener('mousemove', handleResize)
    document.addEventListener('mouseup', handleResizeEnd)
    document.body.style.cursor = 'nwse-resize'
  }

  const variants: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: -20 },
    visible: { opacity: 1, scale: 1, y: 0 }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
          />
          <div
            style={{
              position: 'fixed',
              zIndex: 50,
              left: 0,
              top: 0,
              transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
              transition: (isDragging || isResizing) ? 'none' : 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              willChange: 'transform'
            }}
          >
            <motion.div
              ref={contentRef}
              layoutId={`floating-panel-${uniqueId}`}
              className={cn(
                "overflow-hidden border border-zinc-200/50 bg-white/95 shadow-lg outline-none backdrop-blur-sm dark:border-zinc-700/50 dark:bg-zinc-800/95",
                className
              )}
              style={{
                borderRadius: 16,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                width: isResizable ? `${size.width}px` : 'fit-content',
                height: isResizable ? `${size.height}px` : 'fit-content',
                cursor: isDragging ? 'grabbing' : 'grab',
                touchAction: 'none',
                userSelect: 'none'
              }}
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={variants}
            >
              <div 
                className="bg-gradient-to-b from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-800 border-b border-zinc-200 dark:border-zinc-700 select-none"
                onMouseDown={handleDragStart}
              >
                <FloatingPanelTitle>{title}</FloatingPanelTitle>
              </div>
              <div style={{ height: isResizable ? 'calc(100% - 40px)' : 'auto', overflow: 'auto' }}>
                {children}
              </div>
              {isResizable && (
                <div
                  className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  style={{
                    borderTop: '2px solid rgba(0,0,0,0.1)',
                    borderLeft: '2px solid rgba(0,0,0,0.1)',
                    borderTopLeftRadius: 4
                  }}
                  onMouseDown={handleResizeStart}
                />
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

interface FloatingPanelTitleProps {
  children: React.ReactNode
}

function FloatingPanelTitle({ children }: FloatingPanelTitleProps) {
  const { uniqueId } = useFloatingPanel()

  return (
    <motion.div
      layoutId={`floating-panel-label-container-${uniqueId}`}
      className="px-4 py-2 bg-white dark:bg-zinc-800"
    >
      <motion.div
        layoutId={`floating-panel-label-${uniqueId}`}
        className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
        id={`floating-panel-title-${uniqueId}`}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

interface FloatingPanelFormProps {
  children: React.ReactNode
  onSubmit?: (note: string) => void
  className?: string
}

export function FloatingPanelForm({
  children,
  onSubmit,
  className,
}: FloatingPanelFormProps) {
  const { note, closeFloatingPanel } = useFloatingPanel()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSubmit && note) {
      onSubmit(note)
      closeFloatingPanel()
    }
  }

  return (
    <form
      className={cn("flex h-full flex-col", className)}
      onSubmit={handleSubmit}
    >
      {children}
    </form>
  )
}

interface FloatingPanelLabelProps {
  children: React.ReactNode
  htmlFor: string
  className?: string
}

export function FloatingPanelLabel({
  children,
  htmlFor,
  className,
}: FloatingPanelLabelProps) {
  const { note } = useFloatingPanel()

  return (
    <motion.label
      htmlFor={htmlFor}
      style={{ opacity: note ? 0 : 1 }}
      className={cn(
        "block mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100",
        className
      )}
    >
      {children}
    </motion.label>
  )
}

interface FloatingPanelTextareaProps {
  className?: string
  id?: string
}

export function FloatingPanelTextarea({
  className,
  id,
}: FloatingPanelTextareaProps) {
  const { note, setNote } = useFloatingPanel();

  return (
    <textarea
      id={id}
      value={note}
      onChange={(e) => setNote(e.target.value)}
      className={cn(
        "w-full h-full resize-none bg-transparent text-sm outline-none placeholder:text-zinc-500 dark:placeholder:text-zinc-400",
        className
      )}
      placeholder="Write your note here..."
    />
  );
}

interface FloatingPanelHeaderProps {
  children: React.ReactNode
  className?: string
}

export function FloatingPanelHeader({
  children,
  className,
}: FloatingPanelHeaderProps) {
  return (
    <motion.div
      className={cn(
        "px-4 py-2 font-semibold text-zinc-900 dark:text-zinc-100",
        className
      )}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      {children}
    </motion.div>
  )
}

interface FloatingPanelBodyProps {
  children: React.ReactNode
  className?: string
}

export function FloatingPanelBody({
  children,
  className,
}: FloatingPanelBodyProps) {
  return (
    <motion.div
      className={cn("p-4", className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      {children}
    </motion.div>
  )
}

interface FloatingPanelFooterProps {
  children: React.ReactNode
  className?: string
}

export function FloatingPanelFooter({
  children,
  className,
}: FloatingPanelFooterProps) {
  return (
    <motion.div
      className={cn("flex justify-between px-4 py-3", className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      {children}
    </motion.div>
  )
}

interface FloatingPanelCloseButtonProps {
  className?: string
}

export function FloatingPanelCloseButton({
  className,
}: FloatingPanelCloseButtonProps) {
  const { closeFloatingPanel } = useFloatingPanel()

  return (
    <motion.button
      type="button"
      className={cn("flex items-center", className)}
      onClick={closeFloatingPanel}
      aria-label="Close floating panel"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <ArrowLeftIcon size={16} className="text-zinc-900 dark:text-zinc-100" />
    </motion.button>
  )
}

interface FloatingPanelSubmitButtonProps {
  className?: string
}

export function FloatingPanelSubmitButton({
  className,
}: FloatingPanelSubmitButtonProps) {
  return (
    <motion.button
      className={cn(
        "relative ml-1 flex h-8 shrink-0 scale-100 select-none appearance-none items-center justify-center rounded-lg border border-zinc-950/10 bg-transparent px-2 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 focus-visible:ring-2 active:scale-[0.98] dark:border-zinc-50/10 dark:text-zinc-50 dark:hover:bg-zinc-800",
        className
      )}
      type="submit"
      aria-label="Submit note"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      Submit Note
    </motion.button>
  )
}

interface FloatingPanelButtonProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

export function FloatingPanelButton({
  children,
  onClick,
  className,
}: FloatingPanelButtonProps) {
  return (
    <motion.button
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-4 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700",
        className
      )}
      onClick={onClick}
      whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.05)" }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.button>
  )
}

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>((props, ref) => {
  return (
    <textarea
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = 'FloatingPanel.Textarea';

export const FloatingPanel = {
  Root: FloatingPanelRoot,
  Trigger: FloatingPanelTrigger,
  Content: FloatingPanelContent,
  Form: FloatingPanelForm,
  Label: FloatingPanelLabel,
  Textarea: FloatingPanelTextarea,
  Header: FloatingPanelHeader,
  Body: FloatingPanelBody,
  Footer: FloatingPanelFooter,
  CloseButton: FloatingPanelCloseButton,
  SubmitButton: FloatingPanelSubmitButton,
  Button: FloatingPanelButton,
}
