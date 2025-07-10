import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { HomePage } from './HomePage';
import { RoomPage } from './RoomPage';

// Wrapper component to extract roomId from URL params
function RoomWrapper() {
  const { roomId } = useParams<{ roomId: string }>();
  
  if (!roomId) {
    return <Navigate to="/" replace />;
  }

  return <RoomPage roomId={roomId} />;
}

export function App() {
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