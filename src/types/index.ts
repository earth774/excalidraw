// Define types for drawing data
export interface StoredFileMeta {
  id: string;
  mimeType: string;
  name: string;
  size: number;
  dataURL?: string;
  r2Url?: string;
}

export interface DrawingData {
  elements: unknown[];
  appState: Record<string, unknown>;
  files?: Record<string, StoredFileMeta>;
  timestamp: number;
}

// Extend Window interface to include ExcalidrawLib
declare global {
  interface Window {
    ExcalidrawLib: {
      Excalidraw: React.ComponentType<Record<string, unknown>>;
    };
  }
}

export interface FileData {
  id?: string;
  dataURL: string;
  mimeType?: string;
  name?: string;
  size?: number;
}

export interface OptimizedFileData {
  id: string;
  dataURL: string;
  mimeType: string;
  name: string;
  size: number;
} 