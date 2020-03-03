export type LyricsState 
  = "LOADING" 
  | "FOUND_LYRICS"
  | "FOUND_NONE"
  | "FAILED";

export type Song = {
  title: string;
  lyricsState: LyricsState;
  instrumental?: boolean;
  lyricHash?: number;
  wordCount?: Map<string, number>;
  sentiment?: number;
};

export type LyricData = {
  songs: Map<string, Song>;
  titlesByLyricHashes: Map<number, string>;
  aggregateWordCount: Map<string, number>;
  common: [string, number][];
  unique: [string, number][];
  positive?: Song;
  negative?: Song;
};

export type SongUpdates 
  = { type: "LOADING";      payload: string[] }
  | { type: "FOUND_LYRICS"; payload: {title: string; lyrics: string} }
  | { type: "FOUND_NONE";   payload: {title: string} }
  | { type: "FAILED";       payload: {title: string} };

