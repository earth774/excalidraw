import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useRooms } from '../hooks';
import { StorageManager } from '../utils';

export function HomePage() {
  const [roomId, setRoomId] = useState('');
  const { rooms, createRoom, deleteRoom } = useRooms();

  const handleCreateRoom = useCallback(() => {
    if (roomId.trim()) {
      createRoom(roomId.trim());
      setRoomId('');
    }
  }, [roomId, createRoom]);

  const handleDeleteRoom = useCallback((roomToDelete: string) => {
    deleteRoom(roomToDelete);
  }, [deleteRoom]);

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
            onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
          />
          <button
            onClick={handleCreateRoom}
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
              const hasData = StorageManager.hasRoomData(room);
              const lastSaved = StorageManager.getLastSavedTimestamp(room);
              
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
                      onClick={() => handleDeleteRoom(room)}
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