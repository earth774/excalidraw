import { openDB } from 'idb';
import type { IDBPDatabase } from 'idb';
import type { DrawingData } from '../types';
import { PROBLEMATIC_APP_STATE_KEYS } from '../constants';

const DB_NAME = 'excalidraw-db';
const DB_VERSION = 1;

// Store names
const STORES = {
  ROOMS: 'rooms',
  ROOM_DATA: 'room-data',
  ROOM_LAST_SAVED: 'room-last-saved',
} as const;

interface RoomData {
  id: string;
  name: string;
  createdAt: number;
}

interface RoomDrawingData {
  roomId: string;
  data: DrawingData;
  timestamp: number;
}

interface RoomLastSaved {
  roomId: string;
  timestamp: number;
}

class IndexedDBStorageManager {
  private db: IDBPDatabase | null = null;

  private async getDB(): Promise<IDBPDatabase> {
    if (this.db) {
      return this.db;
    }

    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create stores
        if (!db.objectStoreNames.contains(STORES.ROOMS)) {
          const roomsStore = db.createObjectStore(STORES.ROOMS, { keyPath: 'id' });
          roomsStore.createIndex('createdAt', 'createdAt');
        }

        if (!db.objectStoreNames.contains(STORES.ROOM_DATA)) {
          db.createObjectStore(STORES.ROOM_DATA, { keyPath: 'roomId' });
        }

        if (!db.objectStoreNames.contains(STORES.ROOM_LAST_SAVED)) {
          db.createObjectStore(STORES.ROOM_LAST_SAVED, { keyPath: 'roomId' });
        }
      },
    });

    return this.db;
  }

  // Room management
  async getRooms(): Promise<string[]> {
    try {
      const db = await this.getDB();
      const rooms = await db.getAll(STORES.ROOMS);
      return rooms.map(room => room.id);
    } catch (error) {
      console.error('Error loading rooms:', error);
      return [];
    }
  }

  async saveRooms(rooms: string[]): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORES.ROOMS, 'readwrite');
      const store = tx.objectStore(STORES.ROOMS);

      // Clear existing rooms
      await store.clear();

      // Add new rooms
      const roomData: RoomData[] = rooms.map(roomId => ({
        id: roomId,
        name: roomId,
        createdAt: Date.now(),
      }));

      for (const room of roomData) {
        await store.add(room);
      }

      await tx.done;
    } catch (error) {
      console.error('Error saving rooms:', error);
    }
  }

  async addRoom(roomId: string): Promise<void> {
    try {
      const rooms = await this.getRooms();
      if (!rooms.includes(roomId)) {
        const db = await this.getDB();
        const roomData: RoomData = {
          id: roomId,
          name: roomId,
          createdAt: Date.now(),
        };
        await db.add(STORES.ROOMS, roomData);
      }
    } catch (error) {
      console.error('Error adding room:', error);
    }
  }

  async deleteRoom(roomId: string): Promise<void> {
    try {
      const db = await this.getDB();
      
      // Delete room from rooms store
      await db.delete(STORES.ROOMS, roomId);
      
      // Delete room data
      await db.delete(STORES.ROOM_DATA, roomId);
      
      // Delete last saved timestamp
      await db.delete(STORES.ROOM_LAST_SAVED, roomId);
    } catch (error) {
      console.error('Error deleting room:', error);
    }
  }

  // Drawing data management
  async saveDrawingData(roomId: string, data: DrawingData): Promise<void> {
    try {
      const cleanData = this.cleanDrawingData(data);
      const db = await this.getDB();

      // Deep clone cleanData to avoid non-cloneable values (functions, etc.)
      // Use JSON serialization to ensure only serializable data is stored
      const serializableData = JSON.parse(JSON.stringify(cleanData));

      const roomData: RoomDrawingData = {
        roomId,
        data: serializableData,
        timestamp: Date.now(),
      };

      await db.put(STORES.ROOM_DATA, roomData);

      // Update last saved timestamp
      const lastSaved: RoomLastSaved = {
        roomId,
        timestamp: Date.now(),
      };
      await db.put(STORES.ROOM_LAST_SAVED, lastSaved);
    } catch (error) {
      console.error('Error saving drawing data:', error);
    }
  }

  async loadDrawingData(roomId: string): Promise<DrawingData | null> {
    try {
      const db = await this.getDB();
      const roomData = await db.get(STORES.ROOM_DATA, roomId);
      
      if (roomData) {
        return this.cleanDrawingData(roomData.data);
      }
    } catch (error) {
      console.error('Error loading drawing data:', error);
      // Clear corrupted data
      await this.deleteRoom(roomId);
    }
    return null;
  }

  async getLastSavedTimestamp(roomId: string): Promise<string | null> {
    try {
      const db = await this.getDB();
      const lastSaved = await db.get(STORES.ROOM_LAST_SAVED, roomId);
      return lastSaved ? lastSaved.timestamp.toString() : null;
    } catch (error) {
      console.error('Error getting last saved timestamp:', error);
      return null;
    }
  }

  async hasRoomData(roomId: string): Promise<boolean> {
    try {
      const db = await this.getDB();
      const roomData = await db.get(STORES.ROOM_DATA, roomId);
      return roomData !== undefined;
    } catch (error) {
      console.error('Error checking room data:', error);
      return false;
    }
  }

  // Helper methods
  private cleanDrawingData(data: DrawingData): DrawingData {
    // Ensure elements is an array
    if (!Array.isArray(data.elements)) {
      data.elements = [];
    }

    // Ensure appState is an object and clean it
    if (!data.appState || typeof data.appState !== 'object') {
      data.appState = {};
    }

    const cleanAppState = { ...data.appState };
    
    // Remove problematic properties
    PROBLEMATIC_APP_STATE_KEYS.forEach(key => {
      if (cleanAppState[key] && typeof cleanAppState[key] === 'object') {
        delete cleanAppState[key];
      }
    });

    return {
      elements: data.elements,
      appState: cleanAppState,
      files: data.files,
      timestamp: Date.now()
    };
  }

  // Migration helper from localStorage
  async migrateFromLocalStorage(): Promise<void> {
    try {
      // Check if migration is needed
      const db = await this.getDB();
      const rooms = await db.getAll(STORES.ROOMS);
      
      if (rooms.length === 0) {
        // No data in IndexedDB, try to migrate from localStorage
        const savedRooms = localStorage.getItem('excalidraw-rooms');
        if (savedRooms) {
          const roomIds = JSON.parse(savedRooms);
          
          for (const roomId of roomIds) {
            const roomData = localStorage.getItem(`excalidraw-room-${roomId}`);
            const lastSaved = localStorage.getItem(`excalidraw-room-${roomId}-last-saved`);
            
            if (roomData) {
              const parsedData = JSON.parse(roomData);
              await this.saveDrawingData(roomId, parsedData);
            }
            
            if (lastSaved) {
              const db = await this.getDB();
              const lastSavedData: RoomLastSaved = {
                roomId,
                timestamp: parseInt(lastSaved),
              };
              await db.put(STORES.ROOM_LAST_SAVED, lastSavedData);
            }
          }
          
          await this.saveRooms(roomIds);
          
          // Clear localStorage after successful migration
          localStorage.removeItem('excalidraw-rooms');
          for (const roomId of roomIds) {
            localStorage.removeItem(`excalidraw-room-${roomId}`);
            localStorage.removeItem(`excalidraw-room-${roomId}-last-saved`);
          }
        }
      }
    } catch (error) {
      console.error('Error during migration:', error);
    }
  }
}

// Create singleton instance
export const IndexedDBStorage = new IndexedDBStorageManager(); 