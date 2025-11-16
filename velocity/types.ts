export enum MessageAuthor {
  USER = 'user',
  MODEL = 'model',
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface ChatMessage {
  id: string;
  author: MessageAuthor;
  content: string;
  imageUrls?: string[];
  videoUrl?: string;
  videoState?: 'generating' | 'ready' | 'error';
  groundingChunks?: GroundingChunk[];
  isError?: boolean;
  isSystemQuery?: boolean;
}
