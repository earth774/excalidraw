import './App.css'
import "@excalidraw/excalidraw/index.css";
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, Link } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';

// Extend Window interface to include ExcalidrawLib
declare global {
  interface Window {
    ExcalidrawLib: {
      Excalidraw: React.ComponentType<Record<string, unknown>>;
    };
  }
}

// Define types for drawing data
interface DrawingData {
  elements: unknown[];
  appState: Record<string, unknown>;
  timestamp: number;
}

const { Excalidraw } = window.ExcalidrawLib;

// Component for the home page with room selection
function HomePage() {
  const [roomId, setRoomId] = useState('');
  const [rooms, setRooms] = useState<string[]>([]);

  // Load existing rooms from localStorage
  useEffect(() => {
    const savedRooms = localStorage.getItem('excalidraw-rooms');
    if (savedRooms) {
      setRooms(JSON.parse(savedRooms));
    }
  }, []);

  const createRoom = useCallback(() => {
    if (roomId.trim()) {
      const newRooms = [...rooms, roomId.trim()];
      setRooms(newRooms);
      localStorage.setItem('excalidraw-rooms', JSON.stringify(newRooms));
      setRoomId('');
    }
  }, [roomId, rooms]);

  const deleteRoom = useCallback((roomToDelete: string) => {
    const newRooms = rooms.filter(room => room !== roomToDelete);
    setRooms(newRooms);
    localStorage.setItem('excalidraw-rooms', JSON.stringify(newRooms));
    // Also delete room data from localStorage
    localStorage.removeItem(`excalidraw-room-${roomToDelete}`);
    localStorage.removeItem(`excalidraw-room-${roomToDelete}-last-saved`);
  }, [rooms]);

  return (
    <div className="container" style={{ 
      padding: '2rem', 
      maxWidth: '800px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '2rem' }}>
        🎨 Excalidraw Local Room
      </h1>
      
      <div style={{ 
        background: '#f5f5f5', 
        padding: '1.5rem', 
        borderRadius: '8px',
        marginBottom: '2rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3>สร้างห้องใหม่</h3>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="ชื่อห้อง (เช่น: meeting-room-1)"
            style={{
              flex: 1,
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
            onKeyPress={(e) => e.key === 'Enter' && createRoom()}
          />
          <button
            onClick={createRoom}
            disabled={!roomId.trim()}
            style={{
              padding: '0.5rem 1rem',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            สร้างห้อง
          </button>
        </div>
      </div>

      <div>
        <h3>ห้องที่มีอยู่</h3>
        {rooms.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>
            ยังไม่มีห้องใดๆ ให้สร้างห้องใหม่เพื่อเริ่มต้น
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {rooms.map((room) => {
              // Check if room has saved data
              const hasData = localStorage.getItem(`excalidraw-room-${room}`);
              const lastSaved = localStorage.getItem(`excalidraw-room-${room}-last-saved`);
              
              return (
                <div
                  key={room}
                  className="room-card"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                      {room}
                    </span>
                    {hasData && (
                      <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                        💾 มีข้อมูลบันทึกไว้
                        {lastSaved && (
                          <span> (อัปเดตล่าสุด: {new Date(parseInt(lastSaved)).toLocaleString('th-TH')})</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="room-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link
                      to={`/room/${room}`}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#28a745',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '4px',
                        fontSize: '0.9rem'
                      }}
                    >
                      เข้าห้อง
                    </Link>
                    <button
                      onClick={() => deleteRoom(room)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Component for individual rooms
function RoomPage({ roomId }: { roomId: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const excalidrawRef = useRef<React.ComponentType<Record<string, unknown>> | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedDataRef = useRef<string>('');

  useEffect(() => {
    // Check if there's saved data for this room
    const savedTimestamp = localStorage.getItem(`excalidraw-room-${roomId}-last-saved`);
    console.log(lastSaved,isSaving,hasUnsavedChanges);
    
    if (savedTimestamp) {
      setLastSaved(savedTimestamp);
    }

    // Simulate loading time for Excalidraw
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [roomId]);

  // Function to save drawing data with debouncing
  const saveDrawingData = useCallback((data: DrawingData) => {
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
        timestamp: Date.now()
      };

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
          localStorage.setItem(`excalidraw-room-${roomId}`, dataString);
          const timestamp = Date.now().toString();
          localStorage.setItem(`excalidraw-room-${roomId}-last-saved`, timestamp);
          setLastSaved(timestamp);
          setHasUnsavedChanges(false);
          setIsSaving(false);
          lastSavedDataRef.current = dataString;
        } catch (storageError) {
          console.error('Error saving to localStorage:', storageError);
          setIsSaving(false);
          setHasUnsavedChanges(false);
        }
      }, 300); // 300ms debounce
    } catch (error) {
      console.error('Error saving drawing data:', error);
      setIsSaving(false);
      setHasUnsavedChanges(false);
    }
  }, [roomId]);

  // Function to load drawing data
  const loadDrawingData = useCallback((): DrawingData | null => {
    try {
      const savedData = localStorage.getItem(`excalidraw-room-${roomId}`);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        
        // Validate the parsed data structure
        if (parsedData && typeof parsedData === 'object') {
          // Ensure elements is an array
          if (!Array.isArray(parsedData.elements)) {
            parsedData.elements = [];
          }
          
          // Ensure appState is an object
          if (!parsedData.appState || typeof parsedData.appState !== 'object') {
            parsedData.appState = {};
          }
          
          // Clean up appState to remove problematic properties
          const cleanAppState = { ...parsedData.appState };
          const problematicKeys = ['collaborators', 'cursorButton', 'scrollToCenter'];
          problematicKeys.forEach(key => {
            if (cleanAppState[key] && typeof cleanAppState[key] === 'object') {
              delete cleanAppState[key];
            }
          });
          
          parsedData.appState = cleanAppState;
          lastSavedDataRef.current = JSON.stringify(parsedData);
          return parsedData;
        }
      }
    } catch (error) {
      console.error('Error loading drawing data:', error);
      // Clear corrupted data
      localStorage.removeItem(`excalidraw-room-${roomId}`);
      localStorage.removeItem(`excalidraw-room-${roomId}-last-saved`);
    }
    return null;
  }, [roomId]);

  // Manual save function
  // const handleManualSave = useCallback(() => {
  //   // This would need to be implemented with Excalidraw's API
  //   // For now, we'll just show a message
  //   alert('ฟีเจอร์การบันทึกด้วยตนเองจะพร้อมใช้งานในเวอร์ชันถัดไป');
  // }, []);

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
      {/* <div style={{
        position: 'absolute',
        top: '20px',
        left: '10px',
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '0.75rem 1rem',
        borderRadius: '4px',
        border: '1px solid #ddd',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        minWidth: '200px'
      }}>
        <Link
          to="/"
          style={{
            color: '#007bff',
            textDecoration: 'none',
            fontSize: '0.9rem',
            fontWeight: '500'
          }}
        >
          ← กลับไปหน้าหลัก
        </Link>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          fontSize: '0.8rem'
        }}>
          {isSaving ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#007bff' }}>
              <div style={{
                width: '12px',
                height: '12px',
                border: '2px solid #f3f3f3',
                borderTop: '2px solid #007bff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              กำลังบันทึก...
            </div>
          ) : hasUnsavedChanges ? (
            <div style={{ color: '#ffc107' }}>
              ⚠️ มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก
            </div>
          ) : (
            <div style={{ color: '#28a745' }}>
              ✅ บันทึกแล้ว
            </div>
          )}
        </div>

        {lastSaved && (
          <div style={{ fontSize: '0.8rem', color: '#666' }}>
            💾 บันทึกล่าสุด: {new Date(parseInt(lastSaved)).toLocaleString('th-TH')}
          </div>
        )}

        <button
          onClick={handleManualSave}
          style={{
            padding: '0.25rem 0.5rem',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            marginTop: '0.25rem'
          }}
        >
          💾 บันทึกด้วยตนเอง
        </button>
      </div> */}

<div
        style={{
          position: 'absolute',
          top: '15px',
          left: '60px', // ปรับให้วางต่อจาก hamburger menu (สมมติ hamburger อยู่ซ้ายสุด)
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '0.5rem 1rem',
          borderRadius: '4px',
          border: '1px solid #ddd',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          minWidth: 'unset',
          height: '40px'
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
      <Excalidraw 
        ref={excalidrawRef}
        roomId={roomId}
        initialData={loadDrawingData()}
        onChange={(elements: unknown[], appState: Record<string, unknown>) => {
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
            if (cleanAppState.collaborators && !Array.isArray(cleanAppState.collaborators)) {
              delete cleanAppState.collaborators;
            }
            
            // Remove other potentially problematic properties
            const problematicKeys = ['collaborators', 'cursorButton', 'scrollToCenter'];
            problematicKeys.forEach(key => {
              if (cleanAppState[key] && typeof cleanAppState[key] === 'object') {
                delete cleanAppState[key];
              }
            });

            const dataToSave: DrawingData = {
              elements,
              appState: cleanAppState,
              timestamp: Date.now()
            };

            // Create a string representation for comparison
            const dataString = JSON.stringify(dataToSave);
            
            // Only save if data has actually changed
            if (dataString !== lastSavedDataRef.current) {
              saveDrawingData(dataToSave);
            } else {
              console.log('No changes detected, skipping save');
            }
          } catch (error) {
            console.error('Error in onChange handler:', error);
          }
        }}
        // Add any additional Excalidraw props here
      />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/room/:roomId" element={<RoomWrapper />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

// Wrapper component to extract roomId from URL params
function RoomWrapper() {
  const { roomId } = useParams<{ roomId: string }>();
  
  if (!roomId) {
    return <Navigate to="/" replace />;
  }

  return <RoomPage roomId={roomId} />;
}

export default App;
