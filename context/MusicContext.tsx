import { createContext, useContext, useState } from "react";
import { Audio } from "expo-av";

type MusicContextType = {
    playing: Audio.Sound | null;
    isPlaying: boolean;
    currProcess: string | null;
    setPlaying: (sound: Audio.Sound | null) => void;
    setIsPlaying: (isPlaying: boolean) => void;
    setCurrProcess: (msg: string | null) => void;
    togglePlay: () => Promise<void>;
    durationMillis: number | null;    
    positionMillis: number | null;     
    setDurationMillis: (dur: number | null) => void;
    setPositionMillis: (pos: number | null) => void;
};

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: React.ReactNode }) {
    const [playing, setPlaying] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(true);
    const [currProcess, setCurrProcess] = useState<string | null>(null);
    const [durationMillis, setDurationMillis] = useState<number | null>(null);
    const [positionMillis, setPositionMillis] = useState<number | null>(null);

    async function togglePlay() {
        if (!playing) {
            return;
        }

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
                setPlaying,
                setIsPlaying,
                setCurrProcess,
                togglePlay,
                durationMillis,
                positionMillis,
                setDurationMillis,
                setPositionMillis
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