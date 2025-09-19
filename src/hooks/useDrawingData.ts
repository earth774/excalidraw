import { useState, useRef, useCallback, useEffect } from 'react';
import type { DrawingData, StoredFileMeta } from '../types';
import { StorageManager, ImageOptimizer, IndexedDBStorage, FileCache } from '../utils';
import { UI_CONSTANTS } from '../constants';

export function useDrawingData(roomId: string) {
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedDataRef = useRef<string>('');

  // Initialize lastSaved state on mount
  useEffect(() => {
    const loadLastSaved = async () => {
      try {
        const timestamp = await StorageManager.getLastSavedTimestamp(roomId);
        if (timestamp) {
          setLastSaved(timestamp);
        }
      } catch (error) {
        console.error('Error loading last saved timestamp:', error);
      }
    };

    loadLastSaved();
  }, [roomId]);

  // Load initial data
  const loadDrawingData = useCallback(async (): Promise<DrawingData | null> => {
    try {
      const data = await StorageManager.loadDrawingData(roomId);
      if (data) {
        // Rehydrate dataURLs for rendering from local blobs or r2Url
        if (data.files && typeof data.files === 'object') {
          for (const [fid, f] of Object.entries(data.files as Record<string, StoredFileMeta>)) {
            if (f && typeof f === 'object') {
              if (!f.dataURL) {
                // try local blob
                const blob = await IndexedDBStorage.getFileBlob(fid);
                if (blob) {
                  f.dataURL = FileCache.put(fid, blob);
                } else if (f.r2Url) {
                  f.dataURL = f.r2Url;
                  FileCache.setObjectUrl(fid, f.r2Url);
                }
              }
            }
          }
        }
        lastSavedDataRef.current = JSON.stringify(data);
      }
      return data;
    } catch (error) {
      console.error('Error loading drawing data:', error);
      return null;
    }
  }, [roomId]);

  // Save drawing data with debouncing
  const saveDrawingData = useCallback(async (data: DrawingData) => {
    try {
      // Validate data structure before saving
      if (!data || typeof data !== 'object') {
        console.warn('Invalid data structure, skipping save');
        return;
      }

      // Ensure elements is an array
      if (!Array.isArray(data.elements)) {
        data.elements = [];
      }

      // Ensure appState is an object
      if (!data.appState || typeof data.appState !== 'object') {
        data.appState = {};
      }

      // Clean up appState to remove problematic properties
      const cleanAppState = { ...data.appState };
      const problematicKeys = ['collaborators', 'cursorButton', 'scrollToCenter'];
      problematicKeys.forEach(key => {
        if (cleanAppState[key] && typeof cleanAppState[key] === 'object') {
          delete cleanAppState[key];
        }
      });

      const cleanData: DrawingData = {
        elements: data.elements,
        appState: cleanAppState,
        files: data.files,
        timestamp: Date.now()
      };

      // Transform files: only process new dataURL blobs; reuse cache
      if (data.files && Object.keys(data.files).length > 0) {
        const transformed: Record<string, StoredFileMeta> = {};
        const existing = await IndexedDBStorage.getRoomFileIds(roomId);
        const roomFileIds: string[] = [...existing];
        for (const [fid, f] of Object.entries(data.files as Record<string, StoredFileMeta>)) {
          if (f && typeof f === 'object' && 'dataURL' in f && typeof f.dataURL === 'string') {
            const fileData = f;
            try {
              if (!FileCache.has(fid)) {
                if (!fileData.dataURL) { continue; }
                const response = await fetch(fileData.dataURL);
                const srcBlob = await response.blob();
                const optimizedBlob = srcBlob.type.startsWith('image/') ? await ImageOptimizer.fileToWebPBlob(new File([srcBlob], fileData.name || `${fid}.webp`, { type: srcBlob.type })) : srcBlob;
                await IndexedDBStorage.putFileBlob(fid, optimizedBlob);
                FileCache.put(fid, optimizedBlob);
                if (!roomFileIds.includes(fid)) roomFileIds.push(fid);
              }
              transformed[fid] = {
                id: fid,
                mimeType: fileData.mimeType || 'application/octet-stream',
                name: fileData.name || `file-${fid}`,
                size: fileData.size,
                dataURL: undefined,
                r2Url: fileData.r2Url,
              };
            } catch {
              transformed[fid] = f;
            }
          } else {
            transformed[fid] = f as StoredFileMeta;
          }
        }
        await IndexedDBStorage.mapRoomFiles(roomId, roomFileIds);
        cleanData.files = transformed;
      }

      // Create a string representation of the data for comparison
      const dataString = JSON.stringify(cleanData);
      
      // Only save if data has actually changed
      if (dataString === lastSavedDataRef.current) {
        return;
      }

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set saving state
      setIsSaving(true);
      setHasUnsavedChanges(true);

      // Debounce the actual save operation
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await StorageManager.saveDrawingData(roomId, cleanData);
          const timestamp = Date.now().toString();
          setLastSaved(timestamp);
          setHasUnsavedChanges(false);
          setIsSaving(false);
          lastSavedDataRef.current = dataString;
        } catch (storageError) {
          console.error('Error saving to IndexedDB:', storageError);
          setIsSaving(false);
          setHasUnsavedChanges(false);
        }
      }, UI_CONSTANTS.DEBOUNCE_DELAY);
    } catch (error) {
      console.error('Error saving drawing data:', error);
      setIsSaving(false);
      setHasUnsavedChanges(false);
    }
  }, [roomId]);

  return {
    lastSaved,
    isSaving,
    hasUnsavedChanges,
    loadDrawingData,
    saveDrawingData,
  };
} 