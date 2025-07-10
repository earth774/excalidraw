# Code Refactoring Guide

This document explains the refactored structure of the Excalidraw Local Room application.

## 📁 New File Structure

```
src/
├── components/          # React components
│   ├── App.tsx         # Main app component with routing
│   ├── HomePage.tsx    # Home page with room management
│   ├── RoomPage.tsx    # Individual room drawing page
│   └── index.ts        # Component exports
├── hooks/              # Custom React hooks
│   ├── useRooms.ts     # Room management hook
│   ├── useDrawingData.ts # Drawing data management hook
│   └── index.ts        # Hook exports
├── utils/              # Utility functions
│   ├── storage.ts      # LocalStorage management
│   ├── imageOptimization.ts # Image optimization utilities
│   └── index.ts        # Utility exports
├── types/              # TypeScript type definitions
│   └── index.ts        # All type definitions
├── constants/          # Application constants
│   └── index.ts        # All constants
└── App.tsx            # Main entry point (simplified)
```

## 🔧 Key Improvements

### 1. **Separation of Concerns**
- **Components**: Each component has a single responsibility
- **Hooks**: Business logic extracted into reusable hooks
- **Utils**: Pure functions for data manipulation
- **Types**: Centralized type definitions

### 2. **Better Maintainability**
- Smaller, focused files (easier to understand and modify)
- Clear separation between UI and business logic
- Reusable utilities and hooks

### 3. **Type Safety**
- Centralized type definitions
- Proper TypeScript usage throughout
- Better error handling

### 4. **Performance Optimizations**
- Debounced saving with proper cleanup
- Image optimization utilities
- Efficient localStorage operations

## 🚀 How to Use

### Components
```typescript
import { HomePage, RoomPage } from './components';
```

### Hooks
```typescript
import { useRooms, useDrawingData } from './hooks';
```

### Utilities
```typescript
import { StorageManager, ImageOptimizer } from './utils';
```

### Types
```typescript
import type { DrawingData, FileData } from './types';
```

### Constants
```typescript
import { STORAGE_KEYS, UI_CONSTANTS } from './constants';
```

## 📋 Key Features

### Storage Management (`StorageManager`)
- Room CRUD operations
- Drawing data persistence
- Automatic data cleaning and validation

### Image Optimization (`ImageOptimizer`)
- Automatic image compression
- Format-specific optimization
- Canvas-based resizing

### Custom Hooks
- `useRooms`: Manages room state and operations
- `useDrawingData`: Handles drawing data with debouncing

### Constants
- Centralized configuration
- Magic string elimination
- Easy configuration changes

## 🔄 Migration Benefits

1. **Easier Testing**: Each module can be tested independently
2. **Better Code Reuse**: Utilities and hooks can be reused
3. **Improved Debugging**: Smaller files make issues easier to locate
4. **Enhanced Collaboration**: Clear file structure for team development
5. **Future-Proof**: Easy to extend and modify

## 🛠 Development Workflow

1. **Adding New Features**: Create new components in `components/`
2. **Business Logic**: Extract to hooks in `hooks/`
3. **Utilities**: Add to `utils/` for reusable functions
4. **Types**: Define in `types/` for type safety
5. **Constants**: Add to `constants/` for configuration

This refactored structure makes the codebase more maintainable, testable, and scalable while preserving all existing functionality. 