import { useState, useEffect, Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { useDrawingData } from '../hooks';
import { UI_CONSTANTS } from '../constants';
import type { DrawingData, StoredFileMeta } from '../types';
// Use generic types to avoid complex Excalidraw type imports
type ExcalidrawElement = unknown;
type BinaryFiles = Record<string, unknown>;

// Lazy load Excalidraw to reduce initial bundle size
const Excalidraw = lazy(() => 
  import('@excalidraw/excalidraw').then(module => ({ 
    default: module.Excalidraw 
  }))
);

interface RoomPageProps {
  roomId: string;
}

export function RoomPage({ roomId }: RoomPageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [initialData, setInitialData] = useState<DrawingData | null>(null);
  // const excalidrawRef = useRef<React.ComponentType<Record<string, unknown>> | null>(null);
  
  const {
    loadDrawingData,
    saveDrawingData,
  } = useDrawingData(roomId);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await loadDrawingData();
        setInitialData(data);
      } catch (error) {
        console.error('Error loading initial data:', error);
        setInitialData(null);
      }
    };

    loadData();
  }, [loadDrawingData]);

  useEffect(() => {
    // Simulate loading time for Excalidraw
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, UI_CONSTANTS.LOADING_DELAY);

    return () => {
      clearTimeout(timer);
    };
  }, [roomId]);

  if (isLoading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f8f9fa'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #007bff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ marginTop: '1rem', color: '#666' }}>
          กำลังโหลดห้อง: {roomId}
        </p>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      <div
        style={{
          position: 'absolute',
          top: '15px',
          left: '60px',
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '0.5rem 1rem',
          borderRadius: '4px',
          border: '1px solid #ddd',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          minWidth: 'unset',
          height: '40px',
          // Hide on mobile (max-width: 600px)
          // This is a quick inline style approach; for production, use a CSS class and media query.
          ...(window.innerWidth <= 600 ? { display: 'none' } : {})
        }}
      >
        <Link
          to="/"
          style={{
            color: '#007bff',
            textDecoration: 'none',
            fontSize: '0.95rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          ← กลับไปหน้าหลัก
        </Link>
      </div>
      
      <Suspense fallback={
        <div style={{
          height: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#f8f9fa'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
      }>
        <Excalidraw 
          initialData={initialData as unknown as Record<string, unknown>}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onChange={(elements: readonly ExcalidrawElement[], appState: any, files: BinaryFiles) => {
          try {
            // Validate input data
            if (!Array.isArray(elements)) {
              console.warn('Invalid elements data, skipping save');
              return;
            }

            if (!appState || typeof appState !== 'object') {
              console.warn('Invalid appState data, skipping save');
              return;
            }

            // Check if there are meaningful changes
            const hasElements = elements.length > 0;
            const hasAppStateChanges = Object.keys(appState).length > 0;
            
            // Only proceed if there are actual changes
            if (!hasElements && !hasAppStateChanges) {
              return;
            }

            // Clean up appState to remove problematic properties
            const cleanAppState = { ...appState };
            
            // Remove collaborators if it's not an array
            if ('collaborators' in cleanAppState && cleanAppState.collaborators && !Array.isArray(cleanAppState.collaborators)) {
              delete cleanAppState.collaborators;
            }
            
            // Remove other potentially problematic properties
            const problematicKeys = ['collaborators', 'cursorButton', 'scrollToCenter'];
            problematicKeys.forEach(key => {
              if (key in cleanAppState && cleanAppState[key] && typeof cleanAppState[key] === 'object') {
                delete cleanAppState[key];
              }
            });

            // Clean files data to prevent atob errors
            let cleanFiles: Record<string, StoredFileMeta> | undefined;
            if (files && Object.keys(files).length > 0) {
              cleanFiles = {};
              for (const [fid, file] of Object.entries(files as Record<string, StoredFileMeta>)) {
                if (file && typeof file === 'object' && file.dataURL) {
                  // Validate dataURL before saving
                  try {
                    if (file.dataURL.startsWith('data:')) {
                      const base64Part = file.dataURL.split(',')[1];
                      if (base64Part) {
                        atob(base64Part); // Test if valid base64
                      }
                    }
                    cleanFiles[fid] = file;
                  } catch {
                    console.warn(`Invalid base64 data in file ${fid}, skipping`);
                    // Create a clean file entry without dataURL
                    cleanFiles[fid] = {
                      id: file.id || fid,
                      mimeType: file.mimeType || 'application/octet-stream',
                      name: file.name || `file-${fid}`,
                      size: file.size || 0,
                      r2Url: file.r2Url
                    };
                  }
                } else {
                  cleanFiles[fid] = file;
                }
              }
            }

            const dataToSaveWithFiles: DrawingData = {
              elements,
              appState: cleanAppState,
              timestamp: Date.now(),
              files: cleanFiles
            };

            // Save the data
            saveDrawingData(dataToSaveWithFiles);
          } catch (error) {
            console.error('Error in onChange handler:', error);
          }
        }}
        />
      </Suspense>
    </div>
  );
} 