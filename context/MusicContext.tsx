import { MusicSearchResult } from "@/app/(tabs)";
import { Audio } from "expo-av";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";


type MusicContextType = {
  playing: Audio.Sound | null;
  isPlaying: boolean;
  currProcess: string | null;

  durationMillis: number | null;
  positionMillis: number | null;

  results: MusicSearchResult[];
  isFocused: boolean;
  openPopoverId: string | number | null;
  mounted: boolean;

  setPlaying: (sound: Audio.Sound | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrProcess: (msg: string | null) => void;
  setDurationMillis: (dur: number | null) => void;
  setPositionMillis: (pos: number | null) => void;

  setResults: React.Dispatch<React.SetStateAction<MusicSearchResult[]>>;
  setIsFocused: React.Dispatch<React.SetStateAction<boolean>>;
  setOpenPopoverId: React.Dispatch<React.SetStateAction<string | number | null>>;
  setMounted: React.Dispatch<React.SetStateAction<boolean>>;

  togglePlay: () => Promise<void>;
};


const MusicContext = createContext<MusicContextType | undefined>(undefined);


export function MusicProvider({ children }: { children: ReactNode }) {
  const [playing, setPlaying] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currProcess, setCurrProcess] = useState<string | null>(null);

  const [durationMillis, setDurationMillis] = useState<number | null>(null);
  const [positionMillis, setPositionMillis] = useState<number | null>(null);

  const [results, setResults] = useState<MusicSearchResult[]>([]);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [openPopoverId, setOpenPopoverId] = useState<string |number | null>(null);
  const [mounted, setMounted] = useState<boolean>(false);


  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });
  }, []);


  async function togglePlay() {
    if (!playing) return;

    if (isPlaying) {
      await playing.pauseAsync();
      setIsPlaying(false);
    } else {
      await playing.playAsync();
      setIsPlaying(true);
    }
  }


  return (
    <MusicContext.Provider
      value={{
        playing,
        isPlaying,
        currProcess,

        durationMillis,
        positionMillis,

        results,
        isFocused,
        openPopoverId,
        mounted,

        setPlaying,
        setIsPlaying,
        setCurrProcess,
        setDurationMillis,
        setPositionMillis,

        setResults,
        setIsFocused,
        setOpenPopoverId,
        setMounted,

        togglePlay,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error("useMusic must be used within a MusicProvider");
  }
  return context;
}
