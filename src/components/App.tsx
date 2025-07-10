import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { HomePage } from './HomePage';
import { RoomPage } from './RoomPage';
import { StorageManager } from '../utils';

// Wrapper component to extract roomId from URL params
function RoomWrapper() {
  const { roomId } = useParams<{ roomId: string }>();
  
  if (!roomId) {
    return <Navigate to="/" replace />;
  }

  return <RoomPage roomId={roomId} />;
}

export function App() {
  // Initialize storage when app starts
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        await StorageManager.initialize();
        console.log('Storage initialized successfully');
      } catch (error) {
        console.error('Error initializing storage:', error);
      }
    };

    initializeStorage();
  }, []);

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