
import { CharadesGameState } from "../types";

// NOTE: In a real production app, this would use Firebase Realtime Database or Firestore.
// For this demo, we use localStorage + 'storage' event listener to simulate synchronization
// between tabs/windows on the same device.

const STORAGE_PREFIX = "partybox_room_";

export const syncService = {
  
  // Host creates a room
  createRoom: (roomId: string, initialState: CharadesGameState) => {
    localStorage.setItem(STORAGE_PREFIX + roomId, JSON.stringify(initialState));
    // Also set as current active game for this client
    localStorage.setItem("partybox_current_game_id", roomId);
  },

  // Update state (Broadcast)
  updateState: (roomId: string, newState: Partial<CharadesGameState>) => {
    const key = STORAGE_PREFIX + roomId;
    const currentStr = localStorage.getItem(key);
    if (!currentStr) return;

    const current = JSON.parse(currentStr) as CharadesGameState;
    const updated = { ...current, ...newState };
    
    localStorage.setItem(key, JSON.stringify(updated));
  },

  // Subscribe to changes (React Effect Hook Helper)
  subscribe: (roomId: string, callback: (state: CharadesGameState) => void) => {
    // Initial read
    const current = localStorage.getItem(STORAGE_PREFIX + roomId);
    if (current) callback(JSON.parse(current));

    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_PREFIX + roomId && e.newValue) {
        callback(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  },

  // For "poll" based fallback if storage events are flaky in some browsers
  getSnapshot: (roomId: string): CharadesGameState | null => {
    const data = localStorage.getItem(STORAGE_PREFIX + roomId);
    return data ? JSON.parse(data) : null;
  }
};
