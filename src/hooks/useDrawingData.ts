import { useState, useRef, useCallback, useEffect } from 'react';
import type { DrawingData } from '../types';
import { StorageManager, ImageOptimizer } from '../utils';
import { UI_CONSTANTS } from '../constants';

export function useDrawingData(roomId: string) {
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedDataRef = useRef<string>('');

  // Initialize lastSaved state on mount
  useEffect(() => {
    const timestamp = StorageManager.getLastSavedTimestamp(roomId);
    if (timestamp) {
      setLastSaved(timestamp);
    }
  }, [roomId]);

  // Load initial data
  const loadDrawingData = useCallback((): DrawingData | null => {
    const data = StorageManager.loadDrawingData(roomId);
    if (data) {
      lastSavedDataRef.current = JSON.stringify(data);
    }
    return data;
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

      // Optimize files if present
      if (data.files && Object.keys(data.files).length > 0) {
        cleanData.files = await ImageOptimizer.optimizeFiles(data.files);
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
      saveTimeoutRef.current = setTimeout(() => {
        try {
          StorageManager.saveDrawingData(roomId, cleanData);
          const timestamp = Date.now().toString();
          setLastSaved(timestamp);
          setHasUnsavedChanges(false);
          setIsSaving(false);
          lastSavedDataRef.current = dataString;
        } catch (storageError) {
          console.error('Error saving to localStorage:', storageError);
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