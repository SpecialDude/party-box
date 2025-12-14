import { ref, set, update, onValue, get, child } from "firebase/database";
import { db } from "../firebaseConfig";
import { CharadesGameState } from "../types";

export const syncService = {
  
  // Host creates a room with a 4-letter code
  createRoom: async (roomId: string, initialState: CharadesGameState) => {
    try {
      const roomRef = ref(db, `rooms/${roomId}`);
      await set(roomRef, initialState);
      return true;
    } catch (error) {
      console.error("Error creating room:", error);
      return false;
    }
  },

  // Check if a room exists before joining
  checkRoomExists: async (roomId: string): Promise<boolean> => {
    try {
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `rooms/${roomId}`));
      return snapshot.exists();
    } catch (error) {
      console.error("Error checking room:", error);
      return false;
    }
  },

  // Update specific parts of the state (low latency)
  updateState: (roomId: string, newState: Partial<CharadesGameState>) => {
    const roomRef = ref(db, `rooms/${roomId}`);
    update(roomRef, newState).catch(err => console.error("Update failed", err));
  },

  // Real-time subscription
  subscribe: (roomId: string, callback: (state: CharadesGameState) => void) => {
    const roomRef = ref(db, `rooms/${roomId}`);
    
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        callback(data as CharadesGameState);
      }
    });

    return unsubscribe; // Return cleanup function
  }
};
