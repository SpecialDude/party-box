import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Configuration provided by user
const firebaseConfig = {
  apiKey: "AIzaSyC0L0xd-dKv5SfNDKhMEkFanWJStjtUE1o",
  authDomain: "love-notes-ai.firebaseapp.com",
  databaseURL: "https://love-notes-ai-default-rtdb.firebaseio.com",
  projectId: "love-notes-ai",
  storageBucket: "love-notes-ai.firebasestorage.app",
  messagingSenderId: "456958845214",
  appId: "1:456958845214:web:b05a347cc199cb7d80e90f"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);