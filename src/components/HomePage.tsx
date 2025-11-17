import { useState, useCallback, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRooms } from '../hooks';
import { StorageManager } from '../utils';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';

const ROOMS_PER_PAGE = 10;

export function HomePage() {
  const [roomId, setRoomId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<string>('');
  const [roomToEdit, setRoomToEdit] = useState<string>('');
  const [newRoomName, setNewRoomName] = useState<string>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [roomData, setRoomData] = useState<Record<string, { hasData: boolean; lastSaved: string | null }>>({});
  const { rooms, isLoading, createRoom, deleteRoom, renameRoom } = useRooms();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Load room data for display
  useEffect(() => {
    const loadRoomData = async () => {
      const newRoomData: Record<string, { hasData: boolean; lastSaved: string | null }> = {};
      
      for (const room of rooms) {
        try {
          const hasData = await StorageManager.hasRoomData(room);
          const lastSaved = await StorageManager.getLastSavedTimestamp(room);
          newRoomData[room] = { hasData, lastSaved };
        } catch (error) {
          console.error(`Error loading data for room ${room}:`, error);
          newRoomData[room] = { hasData: false, lastSaved: null };
        }
      }
      
      setRoomData(newRoomData);
    };

    if (!isLoading) {
      loadRoomData();
    }
  }, [rooms, isLoading]);

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

  const handleCreateRoom = useCallback(async () => {
    if (roomId.trim()) {
      await createRoom(roomId.trim());
      setRoomId('');
      setShowModal(false);
    }
  }, [roomId, createRoom]);

  const handleDeleteRoom = useCallback((roomToDelete: string) => {
    setRoomToDelete(roomToDelete);
    setShowDeleteModal(true);
  }, []);

  const confirmDeleteRoom = useCallback(async () => {
    if (roomToDelete) {
      await deleteRoom(roomToDelete);
      setShowDeleteModal(false);
      setRoomToDelete('');
    }
  }, [roomToDelete, deleteRoom]);

  const cancelDeleteRoom = useCallback(() => {
    setShowDeleteModal(false);
    setRoomToDelete('');
  }, []);

  const handleEditRoom = useCallback((roomToEdit: string) => {
    setRoomToEdit(roomToEdit);
    setNewRoomName(roomToEdit);
    setShowEditModal(true);
  }, []);

  const handleRenameRoom = useCallback(async () => {
    if (newRoomName.trim() && newRoomName.trim() !== roomToEdit) {
      try {
        await renameRoom(roomToEdit, newRoomName.trim());
        setShowEditModal(false);
        setRoomToEdit('');
        setNewRoomName('');
      } catch (error) {
        console.error('Error renaming room:', error);
        // You could add a toast notification here
      }
    }
  }, [newRoomName, roomToEdit, renameRoom]);

  const cancelEditRoom = useCallback(() => {
    setShowEditModal(false);
    setRoomToEdit('');
    setNewRoomName('');
  }, []);

  // Reset page if search changes
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="container">
        <div className="loading-message">
          กำลังโหลดข้อมูล...
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* User Header */}
      <div className="user-header">
        <div className="user-info">
          <span className="user-email">{user?.email}</span>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          ออกจากระบบ
        </button>
      </div>
      {/* Header and Create Room Button */}
      <div className="header-section">
        <h1 className="header-title">
          <span className="header-emoji">🎨</span>
          <span className="header-text">Excalidraw Local Room</span>
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

      {/* Modal for delete confirmation */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">ยืนยันการลบ</h2>
            <p className="modal-message">
              คุณต้องการลบห้อง "{roomToDelete}" ใช่หรือไม่?
              <br />
              <strong>การดำเนินการนี้ไม่สามารถย้อนกลับได้</strong>
            </p>
            <div className="modal-buttons">
              <button
                onClick={cancelDeleteRoom}
                className="modal-btn"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmDeleteRoom}
                className="modal-btn modal-btn-danger"
              >
                ลบห้อง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for editing room */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">แก้ไขชื่อห้อง</h2>
            <input
              type="text"
              value={newRoomName}
              onChange={e => setNewRoomName(e.target.value)}
              placeholder="ชื่อห้องใหม่"
              className="modal-input"
              onKeyDown={e => e.key === 'Enter' && handleRenameRoom()}
              autoFocus
            />
            <div className="modal-buttons">
              <button
                onClick={cancelEditRoom}
                className="modal-btn"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleRenameRoom}
                disabled={!newRoomName.trim() || newRoomName.trim() === roomToEdit}
                className="modal-btn modal-btn-primary"
              >
                บันทึก
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
            const roomInfo = roomData[room];
            return (
              <div
                key={room}
                className="room-card"
              >
                <div className="room-info">
                  <span className="room-name">🎨 {room}</span>
                  {roomInfo?.hasData && (
                    <div className="room-meta">
                      💾 มีข้อมูลบันทึกไว้
                      {roomInfo.lastSaved && (
                        <span> (อัปเดตล่าสุด: {new Date(parseInt(roomInfo.lastSaved)).toLocaleString('th-TH')})</span>
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
                    onClick={() => handleEditRoom(room)}
                    className="room-btn room-btn-secondary"
                  >
                    แก้ไข
                  </button>
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