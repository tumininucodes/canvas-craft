import { writable, get } from 'svelte/store';
import type { CanvasItem, CanvasConfig, CanvasState, TemplateItem } from '../types';

const DEFAULT_CONFIG: CanvasConfig = {
  width: 600,
  height: 600,
  backgroundColor: '#ffffff',
  zoom: 0.9,
  panX: 0,
  panY: 0
};

const INITIAL_STATE: CanvasState = {
  items: [],
  selectedItemId: null,
  config: DEFAULT_CONFIG
};

function createCanvasStore() {
  const { subscribe, set, update } = writable<CanvasState>(INITIAL_STATE);

  // History stacks
  let undoStack: { items: CanvasItem[]; config: Omit<CanvasConfig, 'zoom' | 'panX' | 'panY'> }[] = [];
  let redoStack: { items: CanvasItem[]; config: Omit<CanvasConfig, 'zoom' | 'panX' | 'panY'> }[] = [];

  const clone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

  const generateId = (): string => {
    try {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        const uuid = crypto.randomUUID();
        if (uuid) return uuid;
      }
    } catch (e) {
      console.warn("crypto.randomUUID failed, falling back to math random:", e);
    }
    return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  };

  // Capture history snapshot before changes
  function recordState() {
    const currentState = get(store);
    undoStack = [
      ...undoStack,
      {
        items: clone(currentState.items),
        config: {
          width: currentState.config.width,
          height: currentState.config.height,
          backgroundColor: currentState.config.backgroundColor
        }
      }
    ];
    if (undoStack.length > 50) {
      undoStack.shift();
    }
    redoStack = []; // Clear redo stack on new interaction
  }

  const store = {
    subscribe,
    
    // History Actions
    undo: () => {
      if (undoStack.length === 0) return;
      
      const currentState = get(store);
      const previousState = undoStack.pop()!;
      
      // Save current state to redo
      redoStack = [
        ...redoStack,
        {
          items: clone(currentState.items),
          config: {
            width: currentState.config.width,
            height: currentState.config.height,
            backgroundColor: currentState.config.backgroundColor
          }
        }
      ];

      update((state) => ({
        ...state,
        items: previousState.items,
        selectedItemId: null, // Reset selection during history travel
        config: {
          ...state.config,
          width: previousState.config.width,
          height: previousState.config.height,
          backgroundColor: previousState.config.backgroundColor
        }
      }));
    },

    redo: () => {
      if (redoStack.length === 0) return;

      const currentState = get(store);
      const nextState = redoStack.pop()!;

      // Push current to undo
      undoStack = [
        ...undoStack,
        {
          items: clone(currentState.items),
          config: {
            width: currentState.config.width,
            height: currentState.config.height,
            backgroundColor: currentState.config.backgroundColor
          }
        }
      ];

      update((state) => ({
        ...state,
        items: nextState.items,
        selectedItemId: null,
        config: {
          ...state.config,
          width: nextState.config.width,
          height: nextState.config.height,
          backgroundColor: nextState.config.backgroundColor
        }
      }));
    },

    // Canvas Items Management
    addItem: (item: TemplateItem) => {
      recordState();
      const id = generateId();
      const newItem = { ...item, id } as CanvasItem;

      update((state) => ({
        ...state,
        items: [...state.items, newItem],
        selectedItemId: id
      }));
      return id;
    },

    updateItem: (id: string, updates: Partial<CanvasItem>) => {
      // For performance reasons, we don't want to record state on every micro-pixel drag.
      // We'll record state on drag/resize START (managed in UI code), but in case we want a quick update:
      update((state) => {
        const updatedItems = state.items.map((item) => {
          if (item.id === id) {
            // Merge item properties, cast appropriately
            return { ...item, ...updates } as CanvasItem;
          }
          return item;
        });
        return {
          ...state,
          items: updatedItems
        };
      });
    },

    // UI triggers this when dragging/resizing finishes to commit to history
    commitHistory: () => {
      recordState();
    },

    deleteItem: (id: string) => {
      recordState();
      update((state) => ({
        ...state,
        items: state.items.filter((item) => item.id !== id),
        selectedItemId: state.selectedItemId === id ? null : state.selectedItemId
      }));
    },

    duplicateItem: (id: string) => {
      const currentState = get(store);
      const itemToDuplicate = currentState.items.find((item) => item.id === id);
      if (!itemToDuplicate) return;

      recordState();
      const newId = generateId();
      const newItem = {
        ...clone(itemToDuplicate),
        id: newId,
        x: itemToDuplicate.x + 20, // Offset a bit so they can see the duplicate
        y: itemToDuplicate.y + 20,
        name: `${itemToDuplicate.name} (Copy)`
      } as CanvasItem;

      update((state) => ({
        ...state,
        items: [...state.items, newItem],
        selectedItemId: newId
      }));
    },

    // Selection
    setSelectedItemId: (id: string | null) => {
      update((state) => ({
        ...state,
        selectedItemId: id
      }));
    },

    // Layering Actions
    bringToFront: (id: string) => {
      recordState();
      update((state) => {
        const item = state.items.find((i) => i.id === id);
        if (!item) return state;
        const filtered = state.items.filter((i) => i.id !== id);
        return {
          ...state,
          items: [...filtered, item]
        };
      });
    },

    sendToBack: (id: string) => {
      recordState();
      update((state) => {
        const item = state.items.find((i) => i.id === id);
        if (!item) return state;
        const filtered = state.items.filter((i) => i.id !== id);
        return {
          ...state,
          items: [item, ...filtered]
        };
      });
    },

    bringForward: (id: string) => {
      recordState();
      update((state) => {
        const idx = state.items.findIndex((i) => i.id === id);
        if (idx === -1 || idx === state.items.length - 1) return state;
        const newItems = [...state.items];
        const temp = newItems[idx];
        newItems[idx] = newItems[idx + 1];
        newItems[idx + 1] = temp;
        return {
          ...state,
          items: newItems
        };
      });
    },

    sendBackward: (id: string) => {
      recordState();
      update((state) => {
        const idx = state.items.findIndex((i) => i.id === id);
        if (idx === -1 || idx === 0) return state;
        const newItems = [...state.items];
        const temp = newItems[idx];
        newItems[idx] = newItems[idx - 1];
        newItems[idx - 1] = temp;
        return {
          ...state,
          items: newItems
        };
      });
    },

    reorderItems: (orderedIds: string[]) => {
      recordState();
      update((state) => {
        const itemMap = new Map(state.items.map(item => [item.id, item]));
        const reordered = orderedIds
          .map(id => itemMap.get(id))
          .filter((item): item is CanvasItem => !!item);
        
        // Add any items that weren't in orderedIds (just in case)
        const missing = state.items.filter(item => !orderedIds.includes(item.id));
        
        return {
          ...state,
          items: [...reordered, ...missing]
        };
      });
    },

    // Config Actions (Zoom, Pan, Size, Background)
    updateConfig: (updates: Partial<CanvasConfig>) => {
      // If updating size or background color, record history first
      const hasSizeOrBgChange = 'width' in updates || 'height' in updates || 'backgroundColor' in updates;
      if (hasSizeOrBgChange) {
        recordState();
      }

      update((state) => ({
        ...state,
        config: {
          ...state.config,
          ...updates
        }
      }));
    },

    resetConfig: () => {
      update((state) => ({
        ...state,
        config: {
          ...state.config,
          width: DEFAULT_CONFIG.width,
          height: DEFAULT_CONFIG.height,
          backgroundColor: DEFAULT_CONFIG.backgroundColor
        }
      }));
    },

    clearCanvas: () => {
      recordState();
      update((state) => ({
        ...state,
        items: [],
        selectedItemId: null
      }));
    },

    loadProject: (items: (CanvasItem | TemplateItem)[], config: Omit<CanvasConfig, 'zoom' | 'panX' | 'panY'>) => {
      recordState();
      console.log('loadProject called with items:', items);
      const loadedItems = items.map((item) => {
        const cloned = clone(item) as any;
        const finalId = cloned.id || generateId();
        return {
          ...cloned,
          id: finalId
        };
      }) as CanvasItem[];
      console.log('loadProject generated items:', loadedItems);

      update((state) => ({
        ...state,
        items: loadedItems,
        selectedItemId: null,
        config: {
          ...state.config,
          ...config
        }
      }));
    },

    getHistoryStatus: () => {
      return {
        canUndo: undoStack.length > 0,
        canRedo: redoStack.length > 0
      };
    }
  };

  return store;
}

export const canvasStore = createCanvasStore();
