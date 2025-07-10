import type { DrawingData } from '../types';
import { STORAGE_KEYS, PROBLEMATIC_APP_STATE_KEYS } from '../constants';

export class StorageManager {
  // Room management
  static getRooms(): string[] {
    try {
      const savedRooms = localStorage.getItem(STORAGE_KEYS.ROOMS);
      return savedRooms ? JSON.parse(savedRooms) : [];
    } catch (error) {
      console.error('Error loading rooms:', error);
      return [];
    }
  }

  static saveRooms(rooms: string[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
    } catch (error) {
      console.error('Error saving rooms:', error);
    }
  }

  static addRoom(roomId: string): void {
    const rooms = this.getRooms();
    if (!rooms.includes(roomId)) {
      const newRooms = [...rooms, roomId];
      this.saveRooms(newRooms);
    }
  }

  static deleteRoom(roomId: string): void {
    const rooms = this.getRooms();
    const newRooms = rooms.filter(room => room !== roomId);
    this.saveRooms(newRooms);
    
    // Also delete room data
    localStorage.removeItem(STORAGE_KEYS.ROOM_DATA(roomId));
    localStorage.removeItem(STORAGE_KEYS.ROOM_LAST_SAVED(roomId));
  }

  // Drawing data management
  static saveDrawingData(roomId: string, data: DrawingData): void {
    try {
      const cleanData = this.cleanDrawingData(data);
      const dataString = JSON.stringify(cleanData);
      localStorage.setItem(STORAGE_KEYS.ROOM_DATA(roomId), dataString);
      
      const timestamp = Date.now().toString();
      localStorage.setItem(STORAGE_KEYS.ROOM_LAST_SAVED(roomId), timestamp);
    } catch (error) {
      console.error('Error saving drawing data:', error);
    }
  }

  static loadDrawingData(roomId: string): DrawingData | null {
    try {
      const savedData = localStorage.getItem(STORAGE_KEYS.ROOM_DATA(roomId));
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        return this.cleanDrawingData(parsedData);
      }
    } catch (error) {
      console.error('Error loading drawing data:', error);
      // Clear corrupted data
      this.deleteRoom(roomId);
    }
    return null;
  }

  static getLastSavedTimestamp(roomId: string): string | null {
    return localStorage.getItem(STORAGE_KEYS.ROOM_LAST_SAVED(roomId));
  }

  static hasRoomData(roomId: string): boolean {
    return localStorage.getItem(STORAGE_KEYS.ROOM_DATA(roomId)) !== null;
  }

  // Helper methods
  private static cleanDrawingData(data: DrawingData): DrawingData {
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
} 