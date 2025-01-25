import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

// Move lofiTracks outside component to persist between renders
const lofiTracks = [
  {
    title: "Lofi Girl",
    url: "https://play.streamafrica.net/lofiradio",
    source: "StreamAfrica"
  },
  {
    title: "Chillhop",
    url: "https://streams.ilovemusic.de/iloveradio17.mp3",
    source: "I Love Music"
  },
  {
    title: "Box Lofi",
    url: "https://boxradio-edge-09.streamafrica.net/lofi",
    source: "Box Radio"
  },
  {
    title: "The Good Life",
    url: "https://stream.zeno.fm/012t4m8vf2zuv",
    source: "Zeno.FM"
  }
];

// Store global state outside component
let globalAudio: HTMLAudioElement | null = null;
let globalIsPlaying = false;
let globalTrackIndex = 0;
let globalIsMuted = false;
let globalVolume = 0.5;

const buttonAnimation = {
  hover: {
    scale: 1.1,
    transition: { type: "spring", stiffness: 400 }
  },
  tap: { scale: 0.95 }
};

export function MusicPlayer() {
  // Initialize state from global values
  const [isPlaying, setIsPlaying] = useState(globalIsPlaying);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(globalTrackIndex);
  const [isMuted, setIsMuted] = useState(globalIsMuted);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize the global audio instance
  useEffect(() => {
    if (!globalAudio) {
      globalAudio = new Audio(lofiTracks[globalTrackIndex].url);
      globalAudio.volume = globalVolume;
      globalAudio.muted = globalIsMuted;
      audioRef.current = globalAudio;
    } else {
      // Sync component state with global state
      audioRef.current = globalAudio;
      setIsPlaying(globalIsPlaying);
      setCurrentTrackIndex(globalTrackIndex);
      setIsMuted(globalIsMuted);
      
      // Resume playback if it was playing
      if (globalIsPlaying) {
        globalAudio.play().catch(handleTrackError);
      }
    }

    return () => {
      // Update global state before unmounting
      globalIsPlaying = isPlaying;
      globalTrackIndex = currentTrackIndex;
      globalIsMuted = isMuted;
      audioRef.current = null;
    };
  }, []);

  // Update audio source when track changes
  useEffect(() => {
    if (globalAudio && globalAudio.src !== lofiTracks[currentTrackIndex].url) {
      globalAudio.src = lofiTracks[currentTrackIndex].url;
      globalTrackIndex = currentTrackIndex;
      if (isPlaying) {
        globalAudio.play().catch(handleTrackError);
      }
    }
  }, [currentTrackIndex, isPlaying]);

  const handleTrackError = () => {
    setError('Unable to play this track. Trying next one...');
    toast.error('Unable to play this track. Trying next one...');
    setIsPlaying(false);
    globalIsPlaying = false;
    setIsLoading(false);
    setTimeout(() => {
      nextTrack();
    }, 1000);
  };

  const togglePlay = async () => {
    if (globalAudio) {
      try {
        setIsLoading(true);
        setError(null);
        
        if (isPlaying) {
          globalAudio.pause();
          setIsPlaying(false);
          globalIsPlaying = false;
        } else {
          const playPromise = globalAudio.play();
          if (playPromise !== undefined) {
            await playPromise;
            setIsPlaying(true);
            globalIsPlaying = true;
          }
        }
      } catch (err) {
        console.error('Error playing audio:', err);
        handleTrackError();
      } finally {
        setIsLoading(false);
      }
    }
  };

  const nextTrack = () => {
    if (globalAudio) {
      globalAudio.pause();
      setIsPlaying(false);
      globalIsPlaying = false;
      const nextIndex = (currentTrackIndex + 1) % lofiTracks.length;
      setCurrentTrackIndex(nextIndex);
      globalTrackIndex = nextIndex;
      setError(null);
      
      // Auto-play next track if it was playing
      if (isPlaying) {
        setTimeout(() => {
          if (globalAudio) {
            globalAudio.play()
              .then(() => {
                setIsPlaying(true);
                globalIsPlaying = true;
              })
              .catch(handleTrackError);
          }
        }, 100);
      }
    }
  };

  const previousTrack = () => {
    if (globalAudio) {
      globalAudio.pause();
      setIsPlaying(false);
      globalIsPlaying = false;
      const prevIndex = (currentTrackIndex - 1 + lofiTracks.length) % lofiTracks.length;
      setCurrentTrackIndex(prevIndex);
      globalTrackIndex = prevIndex;
      setError(null);
      
      // Auto-play previous track if it was playing
      if (isPlaying) {
        setTimeout(() => {
          if (globalAudio) {
            globalAudio.play()
              .then(() => {
                setIsPlaying(true);
                globalIsPlaying = true;
              })
              .catch(handleTrackError);
          }
        }, 100);
      }
    }
  };

  const toggleMute = () => {
    if (globalAudio) {
      const newMutedState = !isMuted;
      globalAudio.muted = newMutedState;
      setIsMuted(newMutedState);
      globalIsMuted = newMutedState;
      toast.success(newMutedState ? 'Audio muted' : 'Audio unmuted');
    }
  };

  // Add event listeners to the global audio instance
  useEffect(() => {
    if (globalAudio) {
      const handleEnded = () => nextTrack();
      const handleError = () => handleTrackError();
      const handlePlaying = () => {
        setIsLoading(false);
        setError(null);
      };

      globalAudio.addEventListener('ended', handleEnded);
      globalAudio.addEventListener('error', handleError);
      globalAudio.addEventListener('playing', handlePlaying);

      return () => {
        globalAudio?.removeEventListener('ended', handleEnded);
        globalAudio?.removeEventListener('error', handleError);
        globalAudio?.removeEventListener('playing', handlePlaying);
      };
    }
  }, []);

  return (
    <div className="w-full bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm rounded-xl p-4 border border-white/20 dark:border-gray-800/20">
      <div className="flex flex-col space-y-3">
        <div className="text-center">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {lofiTracks[currentTrackIndex].title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{lofiTracks[currentTrackIndex].source}</p>
          {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </div>

        <div className="flex items-center justify-center space-x-4">
          <motion.button
            variants={buttonAnimation}
            whileHover="hover"
            whileTap="tap"
            onClick={previousTrack}
            className="p-2 text-gray-600 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            disabled={isLoading}
          >
            <SkipBack size={18} />
          </motion.button>

          <motion.button
            variants={buttonAnimation}
            whileHover="hover"
            whileTap="tap"
            onClick={togglePlay}
            disabled={isLoading}
            className="p-3 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 dark:hover:bg-indigo-500/30 transition-colors relative"
          >
            {isLoading ? (
              <Loader size={20} className="animate-spin text-indigo-600 dark:text-indigo-400" />
            ) : (
              isPlaying ? <Pause size={20} /> : <Play size={20} />
            )}
          </motion.button>

          <motion.button
            variants={buttonAnimation}
            whileHover="hover"
            whileTap="tap"
            onClick={nextTrack}
            className="p-2 text-gray-600 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            disabled={isLoading}
          >
            <SkipForward size={18} />
          </motion.button>

          <motion.button
            variants={buttonAnimation}
            whileHover="hover"
            whileTap="tap"
            onClick={toggleMute}
            className="p-2 text-gray-600 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </motion.button>
        </div>
      </div>
    </div>
  );
} 