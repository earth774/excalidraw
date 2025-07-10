import { useState, useEffect, useCallback } from 'react';
import { StorageManager } from '../utils';

export function useRooms() {
  const [rooms, setRooms] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing rooms from IndexedDB
  useEffect(() => {
    const loadRooms = async () => {
      try {
        setIsLoading(true);
        await StorageManager.initialize();
        const savedRooms = await StorageManager.getRooms();
        setRooms(savedRooms);
      } catch (error) {
        console.error('Error loading rooms:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRooms();
  }, []);

  const createRoom = useCallback(async (roomId: string) => {
    if (roomId.trim()) {
      try {
        await StorageManager.addRoom(roomId.trim());
        const updatedRooms = await StorageManager.getRooms();
        setRooms(updatedRooms);
      } catch (error) {
        console.error('Error creating room:', error);
      }
    }
  }, []);

  const deleteRoom = useCallback(async (roomToDelete: string) => {
    try {
      await StorageManager.deleteRoom(roomToDelete);
      const updatedRooms = await StorageManager.getRooms();
      setRooms(updatedRooms);
    } catch (error) {
      console.error('Error deleting room:', error);
    }
  }, []);

  return {
    rooms,
    isLoading,
    createRoom,
    deleteRoom,
  };
} 