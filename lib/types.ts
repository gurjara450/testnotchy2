export interface RealtimeEvent {
    type: string;
    response?: {
      instructions?: string;
      modalities?: string[];
      audio?: {
        data: string; // base64 encoded audio chunk
      };
    };
  }
  
  export interface ClientToServerMessage {
    action: 'start' | 'stop' | 'audio_chunk';
    instructions?: string;
    audioData?: string; // base64 audio data
  }
  
  export interface Note {
    id: number;
    content: string;
    pinned: boolean;
    background?: 'plain' | 'ruled' | 'dotted' | 'grid';
    font?: 'default' | 'handwritten1' | 'handwritten2' | 'casual' | 'indie' | 'shadows' | 'apple' | 'patrick';
    lineHeight?: number;
    letterSpacing?: number;
    displayId?: number; // Optional display ID for showing position within notebook
  }