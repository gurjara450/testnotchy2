'use client'

import React, { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, FileWarning, Maximize2 } from "lucide-react"

type Props = { 
  pdfUrl: string
  height?: string
}

export default function PDFViewer({ pdfUrl, height = "600px" }: Props) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fullscreen, setFullscreen] = useState(false)

  const handleLoad = () => {
    setLoading(false)
  }

  const handleError = () => {
    setLoading(false)
    setError("Failed to load PDF. Please try again.")
  }

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen)
  }

  return (
    <Card className={`w-full overflow-hidden ${fullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <CardContent className="p-0 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
            <FileWarning className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-semibold text-destructive">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => setLoading(true)}>
              Retry
            </Button>
          </div>
        )}
        <div className="relative" style={{ height: fullscreen ? '100vh' : height }}>
          <iframe
            src={`https://docs.google.com/gview?url=${encodeURIComponent(pdfUrl)}&embedded=true`}
            className="w-full h-full border-none"
            onLoad={handleLoad}
            onError={handleError}
            title="PDF Viewer"
          />
          <Button
            variant="outline"
            size="icon"
            className="absolute top-2 right-2 z-10"
            onClick={toggleFullscreen}
          >
            <Maximize2 className="h-4 w-4" />
            <span className="sr-only">Toggle fullscreen</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}