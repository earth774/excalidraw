import { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useRooms } from '../hooks';
import { StorageManager } from '../utils';
import './HomePage.css';

const ROOMS_PER_PAGE = 10;

export function HomePage() {
  const [roomId, setRoomId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { rooms, createRoom, deleteRoom } = useRooms();

  // Filtered and paginated rooms
  const filteredRooms = useMemo(() =>
    rooms.filter((room) => room.toLowerCase().includes(search.toLowerCase())),
    [rooms, search]
  );
  const totalPages = Math.ceil(filteredRooms.length / ROOMS_PER_PAGE) || 1;
  const paginatedRooms = filteredRooms.slice(
    (page - 1) * ROOMS_PER_PAGE,
    page * ROOMS_PER_PAGE
  );

  const handleCreateRoom = useCallback(() => {
    if (roomId.trim()) {
      createRoom(roomId.trim());
      setRoomId('');
      setShowModal(false);
    }
  }, [roomId, createRoom]);

  const handleDeleteRoom = useCallback((roomToDelete: string) => {
    deleteRoom(roomToDelete);
  }, [deleteRoom]);

  // Reset page if search changes
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <div className="container">
      {/* Header and Create Room Button */}
      <div className="header-section">
        <h1 className="header-title">
          <span style={{ marginRight: 8 }}>🎨</span> Excalidraw Local Room
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="create-room-btn"
        >
          + สร้างห้องใหม่
        </button>
      </div>

      {/* Modal for creating room */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">สร้างห้องใหม่</h2>
            <input
              type="text"
              value={roomId}
              onChange={e => setRoomId(e.target.value)}
              placeholder="ชื่อห้อง (เช่น: meeting-room-1)"
              className="modal-input"
              onKeyDown={e => e.key === 'Enter' && handleCreateRoom()}
              autoFocus
            />
            <div className="modal-buttons">
              <button
                onClick={() => setShowModal(false)}
                className="modal-btn"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={!roomId.trim()}
                className="modal-btn modal-btn-primary"
              >
                สร้างห้อง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search and List */}
      <div className="search-section">
        <h3 className="search-title">ห้องที่มีอยู่</h3>
        <input
          type="text"
          value={search}
          onChange={handleSearch}
          placeholder="ค้นหาห้อง..."
          className="search-input"
        />
      </div>
      {filteredRooms.length === 0 ? (
        <p className="empty-message">
          ยังไม่มีห้องใดๆ ให้สร้างห้องใหม่เพื่อเริ่มต้น
        </p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
          {paginatedRooms.map((room) => {
            const hasData = StorageManager.hasRoomData(room);
            const lastSaved = StorageManager.getLastSavedTimestamp(room);
            return (
              <div
                key={room}
                className="room-card"
              >
                <div className="room-info">
                  <span className="room-name">{room}</span>
                  {hasData && (
                    <div className="room-meta">
                      💾 มีข้อมูลบันทึกไว้
                      {lastSaved && (
                        <span> (อัปเดตล่าสุด: {new Date(parseInt(lastSaved)).toLocaleString('th-TH')})</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="room-actions">
                  <Link
                    to={`/room/${room}`}
                    className="room-btn room-btn-primary"
                  >
                    เข้าห้อง
                  </Link>
                  <button
                    onClick={() => handleDeleteRoom(room)}
                    className="room-btn room-btn-danger"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="pagination-btn"
          >
            ก่อนหน้า
          </button>
          <span className="pagination-info">
            หน้า {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            className="pagination-btn"
          >
            ถัดไป
          </button>
        </div>
      )}
    </div>
  );
} 