// LocalStorage keys
export const STORAGE_KEYS = {
  ROOMS: 'excalidraw-rooms',
  ROOM_DATA: (roomId: string) => `excalidraw-room-${roomId}`,
  ROOM_LAST_SAVED: (roomId: string) => `excalidraw-room-${roomId}-last-saved`,
} as const;

// UI Constants
export const UI_CONSTANTS = {
  DEBOUNCE_DELAY: 300,
  LOADING_DELAY: 1000,
  IMAGE_OPTIMIZATION: {
    MAX_WIDTH: 800,
    MAX_HEIGHT: 800,
    QUALITY: 0.7,
  },
} as const;

// Problematic keys to remove from appState
export const PROBLEMATIC_APP_STATE_KEYS = [
  'collaborators',
  'cursorButton',
  'scrollToCenter',
] as const;

// Image MIME types for optimization
export const OPTIMIZABLE_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const; 