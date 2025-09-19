import type { DrawingData } from '../types';
import { IndexedDBStorage } from './indexedDBStorage';

export class StorageManager {
  // Initialize IndexedDB and migrate data if needed
  static async initialize(): Promise<void> {
    try {
      await IndexedDBStorage.migrateFromLocalStorage();
    } catch (error) {
      console.error('Error initializing storage:', error);
    }
  }

  // Room management
  static async getRooms(): Promise<string[]> {
    try {
      return await IndexedDBStorage.getRooms();
    } catch (error) {
      console.error('Error loading rooms:', error);
      return [];
    }
  }

  static async saveRooms(rooms: string[]): Promise<void> {
    try {
      await IndexedDBStorage.saveRooms(rooms);
    } catch (error) {
      console.error('Error saving rooms:', error);
    }
  }

  static async addRoom(roomId: string): Promise<void> {
    try {
      await IndexedDBStorage.addRoom(roomId);
    } catch (error) {
      console.error('Error adding room:', error);
    }
  }

  static async deleteRoom(roomId: string): Promise<void> {
    try {
      await IndexedDBStorage.deleteRoom(roomId);
    } catch (error) {
      console.error('Error deleting room:', error);
    }
  }

  static async renameRoom(oldRoomId: string, newRoomId: string): Promise<void> {
    try {
      await IndexedDBStorage.renameRoom(oldRoomId, newRoomId);
    } catch (error) {
      console.error('Error renaming room:', error);
      throw error;
    }
  }

  // Drawing data management
  static async saveDrawingData(roomId: string, data: DrawingData): Promise<void> {
    try {
      await IndexedDBStorage.saveDrawingData(roomId, data);
    } catch (error) {
      console.error('Error saving drawing data:', error);
    }
  }

  static async loadDrawingData(roomId: string): Promise<DrawingData | null> {
    try {
      return await IndexedDBStorage.loadDrawingData(roomId);
    } catch (error) {
      console.error('Error loading drawing data:', error);
      return null;
    }
  }

  static async getLastSavedTimestamp(roomId: string): Promise<string | null> {
    try {
      return await IndexedDBStorage.getLastSavedTimestamp(roomId);
    } catch (error) {
      console.error('Error getting last saved timestamp:', error);
      return null;
    }
  }

  static async hasRoomData(roomId: string): Promise<boolean> {
    try {
      return await IndexedDBStorage.hasRoomData(roomId);
    } catch (error) {
      console.error('Error checking room data:', error);
      return false;
    }
  }
} 