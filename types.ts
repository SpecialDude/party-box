
export enum GameScreen {
  HOME = 'HOME',
  PASS_THE_HAT = 'PASS_THE_HAT',
  CHARADES = 'CHARADES',
  SCAVENGER = 'SCAVENGER',
  TRIVIA = 'TRIVIA',
  SPECTATOR = 'SPECTATOR',
}

export interface GameConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  screen: GameScreen;
}

export interface ChallengeResponse {
  challenge: string;
  category: string;
}

export interface PassTheHatSettings {
  minDuration: number; // Seconds
  maxDuration: number; // Seconds
  theme: string;
  useAI: boolean;
  musicUrl: string; // URL for the audio track
}

export interface ScavengerItem {
  id: string;
  description: string;
  emoji: string;
  points: number;
  found: boolean;
}

export interface TriviaQuestion {
  question: string;
  answer: string;
  category: string;
}

// --- Charades Specific Types ---

export interface CharadesCard {
  id: string;
  word: string;
  status: 'hidden' | 'active' | 'guessed' | 'skipped';
}

export interface CharadesTeam {
  id: string;
  name: string;
  score: number;
  color: string;
}

export type GamePhase = 'setup' | 'board' | 'acting' | 'waiting_for_host' | 'result' | 'summary';

export interface CharadesGameState {
  roomId: string;
  phase: GamePhase;
  teams: CharadesTeam[];
  currentTeamIndex: number;
  cards: CharadesCard[];
  
  // Round State
  activeCardId: string | null;
  actorId?: string; // ID of the player currently acting
  timeLeft: number;
  lastResult: 'guessed' | 'skipped' | null;
  
  // Settings
  category: string;
  roundDuration: number;
}

export interface GameNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
}
