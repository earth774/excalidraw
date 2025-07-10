import { useState, useEffect, useCallback } from 'react';
import { StorageManager } from '../utils';

export function useRooms() {
  const [rooms, setRooms] = useState<string[]>([]);

  // Load existing rooms from localStorage
  useEffect(() => {
    const savedRooms = StorageManager.getRooms();
    setRooms(savedRooms);
  }, []);

  const createRoom = useCallback((roomId: string) => {
    if (roomId.trim()) {
      const newRooms = [...rooms, roomId.trim()];
      setRooms(newRooms);
      StorageManager.saveRooms(newRooms);
    }
  }, [rooms]);

  const deleteRoom = useCallback((roomToDelete: string) => {
    const newRooms = rooms.filter(room => room !== roomToDelete);
    setRooms(newRooms);
    StorageManager.saveRooms(newRooms);
    StorageManager.deleteRoom(roomToDelete);
  }, [rooms]);

  return {
    rooms,
    createRoom,
    deleteRoom,
  };
} 