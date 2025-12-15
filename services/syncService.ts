
import { ref, set, update, onValue, get, child } from "firebase/database";
import { db } from "../firebaseConfig";
import { CharadesGameState, CharadesCard, CharadesTeam } from "../types";

export const syncService = {
  
  // Host creates a room with a 4-letter code
  createRoom: async (roomId: string, initialState: CharadesGameState) => {
    try {
      const roomRef = ref(db, `rooms/${roomId}`);
      // Sanitize undefined values before setting
      const cleanState = JSON.parse(JSON.stringify(initialState));
      await set(roomRef, cleanState);
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
    // Firebase update fails if data contains 'undefined'. 
    // We sanitize the object to remove undefined keys.
    const cleanState = JSON.parse(JSON.stringify(newState));
    const roomRef = ref(db, `rooms/${roomId}`);
    update(roomRef, cleanState).catch(err => console.error("Update failed", err));
  },

  // Real-time subscription with Data Sanitization
  subscribe: (roomId: string, callback: (state: CharadesGameState) => void) => {
    const roomRef = ref(db, `rooms/${roomId}`);
    
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // SANITIZATION: Firebase might return arrays as objects (e.g. {0:.., 1:..})
        // We force them back to arrays to prevent .map() crashes
        const sanitizedState: CharadesGameState = {
            ...data,
            cards: data.cards ? Object.values(data.cards) as CharadesCard[] : [],
            teams: data.teams ? Object.values(data.teams) as CharadesTeam[] : []
        };
        callback(sanitizedState);
      } else {
        // Handle case where data is null (room deleted or empty)
         console.warn("Received null data for room");
      }
    }, (error) => {
        console.error("Firebase Subscribe Error:", error);
    });

    return unsubscribe;
  }
};
