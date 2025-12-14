export enum GameScreen {
  HOME = 'HOME',
  PASS_THE_HAT = 'PASS_THE_HAT',
  CHARADES = 'CHARADES', // Placeholder for future
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