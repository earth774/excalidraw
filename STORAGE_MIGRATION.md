# Storage Migration: localStorage to IndexedDB

## Overview

This project has been migrated from using `localStorage` to `IndexedDB` for better handling of large data. The migration uses the `idb` library for a more robust and efficient storage solution.

## Changes Made

### 1. New IndexedDB Storage System

- **File**: `src/utils/indexedDBStorage.ts`
- **Features**:
  - Uses IndexedDB for persistent storage
  - Supports larger data sizes (no 5-10MB limit like localStorage)
  - Better performance for large datasets
  - Automatic migration from localStorage
  - Error handling and data validation

### 2. Updated Storage Manager

- **File**: `src/utils/storage.ts`
- **Changes**:
  - All methods are now async
  - Maintains the same API for backward compatibility
  - Delegates to IndexedDB storage
  - Added initialization method

### 3. Updated Hooks

- **File**: `src/hooks/useRooms.ts`
- **Changes**:
  - Added loading state
  - All operations are now async
  - Better error handling

- **File**: `src/hooks/useDrawingData.ts`
- **Changes**:
  - All storage operations are now async
  - Improved error handling
  - Better data validation

### 4. Updated Components

- **File**: `src/components/HomePage.tsx`
- **Changes**:
  - Added loading states
  - Async room operations
  - Better error handling

- **File**: `src/components/RoomPage.tsx`
- **Changes**:
  - Async data loading
  - Better error handling

### 5. App Initialization

- **File**: `src/components/App.tsx`
- **Changes**:
  - Added storage initialization on app start
  - Automatic migration from localStorage

## Benefits

1. **Larger Storage Capacity**: IndexedDB can handle much larger datasets than localStorage
2. **Better Performance**: More efficient for large data operations
3. **Automatic Migration**: Existing localStorage data is automatically migrated
4. **Error Handling**: Robust error handling and data validation
5. **Future-Proof**: Better foundation for future enhancements

## Technical Details

### Database Structure

The IndexedDB database (`excalidraw-db`) contains three object stores:

1. **rooms**: Stores room information
   - Key: room ID
   - Value: RoomData object with id, name, and createdAt

2. **room-data**: Stores drawing data
   - Key: room ID
   - Value: RoomDrawingData object with roomId, data, and timestamp

3. **room-last-saved**: Stores last saved timestamps
   - Key: room ID
   - Value: RoomLastSaved object with roomId and timestamp

### Migration Process

1. On app initialization, the system checks if IndexedDB has data
2. If IndexedDB is empty, it attempts to migrate data from localStorage
3. After successful migration, localStorage data is cleared
4. All future operations use IndexedDB

### Error Handling

- Graceful fallbacks for storage errors
- Data validation before saving
- Automatic cleanup of corrupted data
- Console logging for debugging

## Usage

The API remains the same, but all storage operations are now async:

```typescript
// Before (localStorage)
const rooms = StorageManager.getRooms();
StorageManager.saveRooms(rooms);

// After (IndexedDB)
const rooms = await StorageManager.getRooms();
await StorageManager.saveRooms(rooms);
```

## Dependencies

- `idb`: IndexedDB wrapper library for better developer experience
- Added to package.json: `"idb": "^8.0.0"`

## Browser Support

IndexedDB is supported in all modern browsers:
- Chrome 23+
- Firefox 16+
- Safari 10+
- Edge 12+

## Testing

A test file is included (`src/utils/storageTest.ts`) to verify IndexedDB functionality. You can run it in the browser console:

```typescript
import { testIndexedDBStorage } from './utils/storageTest';
await testIndexedDBStorage();
``` 