import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import { HomePage } from './HomePage';
import { RoomPage } from './RoomPage';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';
import { StorageManager } from '../utils';
import { useAuth } from '../context/AuthContext';

// Wrapper component to extract roomId from URL params
function RoomWrapper() {
  const { roomId } = useParams<{ roomId: string }>();
  
  if (!roomId) {
    return <Navigate to="/" replace />;
  }

  return <RoomPage roomId={roomId} />;
}

// RequireAuth: Protect routes that need authentication
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="container">
        <div className="loading-message">
          กำลังโหลดข้อมูล...
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login, preserving the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

// PublicOnlyRoute: Redirect authenticated users away from login/register pages
function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="container">
        <div className="loading-message">
          กำลังโหลดข้อมูล...
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
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
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/"
          element={
            <RequireAuth>
              <HomePage />
            </RequireAuth>
          }
        />
        <Route
          path="/room/:roomId"
          element={
            <RequireAuth>
              <RoomWrapper />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
} 