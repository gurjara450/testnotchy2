// Define NetworkInformation interface
interface NetworkInformation {
  saveData: boolean;
  effectiveType: string;
  downlink: number;
  rtt: number;
}

// Track upload state
const activeUploads = new Map<string, { 
  controller: AbortController, 
  retry: () => Promise<{ file_key: string; file_name: string; }> 
}>();

// Check if we have a stable connection
async function checkConnection(): Promise<boolean> {
  try {
    // First try our health endpoint
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch('/api/health', {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      if (response.ok) {
        return true;
      }
    } catch {
      // Fall through to navigator checks if health endpoint fails
    }

    // Use navigator.connection if available
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    if (connection) {
      // Return false if we're on a slow connection
      if (
        connection.saveData || // Data saver is on
        connection.effectiveType === 'slow-2g' ||
        connection.effectiveType === '2g' ||
        (connection.downlink && connection.downlink < 0.5) // Less than 0.5 Mbps
      ) {
        return false;
      }
    }

    // As a last resort, try a quick image load test
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => resolve(false), 3000);
      const img = new Image();
      
      img.onload = () => {
        clearTimeout(timeoutId);
        resolve(true);
      };
      
      img.onerror = () => {
        clearTimeout(timeoutId);
        resolve(false);
      };

      // Use a tiny image from our own domain to avoid CORS
      img.src = '/favicon.ico?' + Date.now();
    });
  } catch {
    return false;
  }
}

export async function uploadToS3(file: File, maxRetries = 3, retryDelay = 1000) {
  const uploadId = `${file.name}-${Date.now()}`;
  let attempt = 0;
  let lastError: Error | null = null;
  let currentController: AbortController | null = null;

  // Calculate timeout based on file size and connection speed
  const getTimeout = () => {
    const baseTimeout = 30000; // 30 seconds base
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    if (connection && connection.downlink) {
      // Estimate upload time based on file size and connection speed
      const estimatedSeconds = (file.size / (connection.downlink * 125000)) * 1.5; // 1.5x safety factor
      return Math.min(Math.max(baseTimeout, estimatedSeconds * 1000), 300000); // Between 30s and 5min
    }
    return Math.min(Math.max(baseTimeout, file.size / 1024), 300000);
  };

  // Setup network change listeners for this upload
  const handleNetworkChange = async () => {
    if (!navigator.onLine) {
      // Abort current request when we go offline
      if (currentController) {
        currentController.abort(new Error('Network disconnected'));
      }
    } else {
      console.log('Network reconnected, checking connection stability...');
      // Wait for connection to stabilize and check if it's reliable
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Try multiple times to verify stable connection
      let isStable = false;
      for (let i = 0; i < 2; i++) {
        if (await checkConnection()) {
          isStable = true;
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (isStable && lastError) {
        console.log('Connection stable, retrying upload...');
        // Reset attempt counter on network reconnection
        attempt = 0;
        const upload = activeUploads.get(uploadId);
        if (upload) {
          try {
            await upload.retry();
          } catch (error) {
            console.error('Retry after network change failed:', error);
          }
        }
      }
    }
  };

  window.addEventListener('online', handleNetworkChange);
  window.addEventListener('offline', handleNetworkChange);
  
  try {
    while (attempt < maxRetries) {
      try {
        // Check if we're online and have a stable connection
        if (!navigator.onLine) {
          lastError = new Error('No internet connection');
          throw lastError;
        }

        // Check connection stability before attempting upload
        // Try multiple times to verify stable connection
        let isStable = false;
        for (let i = 0; i < 2; i++) {
          if (await checkConnection()) {
            isStable = true;
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        if (!isStable) {
          lastError = new Error('Unstable network connection');
          throw lastError;
        }

        const formData = new FormData();
        formData.append('file', file);

        currentController = new AbortController();
        const timeoutId = setTimeout(() => {
          if (currentController && !currentController.signal.aborted) {
            currentController.abort(new Error('Upload timeout - Please check your network connection'));
          }
        }, getTimeout());

        // Store the upload state
        const retryFn = () => uploadToS3(file, maxRetries - attempt, retryDelay);
        activeUploads.set(uploadId, { controller: currentController, retry: retryFn });

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          signal: currentController.signal,
          // Add headers to prevent caching
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const data = await response.json();
        console.log('Successfully uploaded to S3:', data.file_key);

        return {
          file_key: data.file_key,
          file_name: data.file_name,
        };
      } catch (error: unknown) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Don't increment attempt counter for network-related errors when offline
        if (navigator.onLine) {
          attempt++;
        }
        
        // If it's the last attempt and we're online, throw the error
        if (attempt === maxRetries && navigator.onLine) {
          console.error('Error uploading to S3 after', maxRetries, 'attempts:', error);
          throw error;
        }

        // If we're offline or it's a network error, wait and retry
        if (
          !navigator.onLine ||
          (error instanceof TypeError) || // Network error
          (error instanceof Error && error.name === 'AbortError') || // Timeout
          (error instanceof Error && error.message.includes('network')) || // Network-related error
          (error instanceof Error && error.message === 'No internet connection') ||
          (error instanceof Error && error.message === 'Unstable network connection')
        ) {
          console.log(`Retrying upload (attempt ${attempt + 1}/${maxRetries})...`);
          // Wait longer if we're offline or have unstable connection
          const waitTime = !navigator.onLine ? 5000 : retryDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        // For other errors, throw immediately
        throw error;
      }
    }

    throw new Error('Upload failed after max retries');
  } finally {
    // Clean up
    window.removeEventListener('online', handleNetworkChange);
    window.removeEventListener('offline', handleNetworkChange);
    activeUploads.delete(uploadId);
    if (currentController) {
      currentController.abort();
    }
  }
}

// Helper function to generate S3 URL
export function getS3Url(file_key: string): string {
  return `https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.eu-north-1.amazonaws.com/${file_key}`;
}