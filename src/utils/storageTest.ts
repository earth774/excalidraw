import { IndexedDBStorage } from './indexedDBStorage';

// Simple test function to verify IndexedDB storage
export async function testIndexedDBStorage() {
  console.log('Testing IndexedDB storage...');
  
  try {
    // Test room operations
    await IndexedDBStorage.addRoom('test-room-1');
    await IndexedDBStorage.addRoom('test-room-2');
    
    const rooms = await IndexedDBStorage.getRooms();
    console.log('Rooms:', rooms);
    
    // Test drawing data operations
    const testData = {
      elements: [{ id: 'test-element', type: 'rectangle' }],
      appState: { viewBackgroundColor: '#ffffff' },
      files: {},
      timestamp: Date.now()
    };
    
    await IndexedDBStorage.saveDrawingData('test-room-1', testData);
    
    const loadedData = await IndexedDBStorage.loadDrawingData('test-room-1');
    console.log('Loaded data:', loadedData);
    
    const hasData = await IndexedDBStorage.hasRoomData('test-room-1');
    console.log('Has data:', hasData);
    
    const lastSaved = await IndexedDBStorage.getLastSavedTimestamp('test-room-1');
    console.log('Last saved:', lastSaved);
    
    // Clean up test data
    await IndexedDBStorage.deleteRoom('test-room-1');
    await IndexedDBStorage.deleteRoom('test-room-2');
    
    console.log('IndexedDB storage test completed successfully!');
  } catch (error) {
    console.error('IndexedDB storage test failed:', error);
  }
} 