import { create } from 'zustand';
import { User } from '@/types/user';

interface UndoOperation {
  id: string;
  users: User[];
  expiresAt: number;
  timeoutId: NodeJS.Timeout;
  callback: () => void;
}

interface UndoState {
  operations: Map<string, UndoOperation>;
  
  addOperation: (operation: Omit<UndoOperation, 'timeoutId'>) => void;
  removeOperation: (id: string) => void;
  clear: () => void;
}

// Use in-memory store (no persistence to avoid stale data issues)
export const useUndoStore = create<UndoState>((set, get) => ({
  operations: new Map(),
  
  addOperation: (operation) => {
    const { operations } = get();
    
    // Clear existing timeout for this operation if it exists
    const existing = operations.get(operation.id);
    if (existing) {
      clearTimeout(existing.timeoutId);
    }
    
    // Create new timeout
    const timeoutId = setTimeout(() => {
      operation.callback();
      get().removeOperation(operation.id);
    }, 5000);
    
    const newOperation: UndoOperation = {
      ...operation,
      timeoutId,
    };
    
    const newOperations = new Map(operations);
    newOperations.set(operation.id, newOperation);
    
    set({ operations: newOperations });
  },
  
  removeOperation: (id) => {
    const { operations } = get();
    const operation = operations.get(id);
    
    if (operation) {
      clearTimeout(operation.timeoutId);
      const newOperations = new Map(operations);
      newOperations.delete(id);
      set({ operations: newOperations });
    }
  },
  
  clear: () => {
    const { operations } = get();
    operations.forEach(op => clearTimeout(op.timeoutId));
    set({ operations: new Map() });
  },
}));

// Hook for undo functionality
export function useUndo() {
  const { operations, addOperation, removeOperation, clear } = useUndoStore();

  return {
    // Get deleted users from the most recent operation
    deletedUsers: Array.from(operations.values())[0]?.users || [],
    hasUndo: operations.size > 0,
    
    // Start undo timer with unique operation ID
    startUndo: (operationId: string, users: User[], callback: () => void) => {
      const expirationTime = Date.now() + 5000; // 5 seconds
      
      addOperation({
        id: operationId,
        users,
        expiresAt: expirationTime,
        callback,
      });
    },
    
    // Cancel specific undo operation
    cancelUndo: (operationId: string) => {
      removeOperation(operationId);
    },
    
    // Clear all pending operations
    clearAll: clear,
  };
}

// Cleanup on navigation - call this in a useEffect with router events
export function useUndoCleanup() {
  const { clearAll } = useUndoStore();
  
  return {
    cleanup: clearAll,
  };
}

