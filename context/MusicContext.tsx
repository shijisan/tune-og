import { MusicSearchResult } from "@/app/(tabs)";
import { getDownload, getStreamingUrl, searchYouTubeMusic } from "@/lib/youtube";
import { Audio } from "expo-av";
import { Directory, File, Paths } from "expo-file-system";
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
  handlePlay: (file: File) => Promise<void>;
  handleDelete: (file: File) => Promise<void>;
  loadFiles: () => void;
  files: File[];
  playingFile: string | null;
  handleTrackStream: (title: string, artist: string) => Promise<void>;
  handleDownloadTrack: (title: string, artist: string) => Promise<void>;


  results: MusicSearchResult[];
  isFocused: boolean;
  openPopoverId: string | number | null;
  mounted: boolean;

  setPlaying: (sound: Audio.Sound | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrProcess: (msg: string | null) => void;
  setDurationMillis: (dur: number | null) => void;
  setPositionMillis: (pos: number | null) => void;
  setPlayingFile?: (file: string | null) => void;


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
  const [openPopoverId, setOpenPopoverId] = useState<string | number | null>(null);
  const [mounted, setMounted] = useState<boolean>(false);

  const [files, setFiles] = useState<File[]>([]);
  const [playingFile, setPlayingFile] = useState<string | null>(null);

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });
  }, []);


  async function loadFiles() {
    try {
      const downloadsDir = new Directory(Paths.document.uri + "downloads/");
      const entries = await downloadsDir.list();
      const onlyFiles = entries.filter((e) => e instanceof File) as File[];
      setFiles(onlyFiles);
    } catch (err) {
      console.error("Error reading library:", err);
      setFiles([]);
    }
  }

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

  async function handlePlay(file: File) {
    setOpenPopoverId("");
    try {
      if (playing) {
        await playing.stopAsync();
        await playing.unloadAsync();
        setPlaying(null);
      }

      resetProgress();

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: file.uri },
        { shouldPlay: true }
      );

      const status = await newSound.getStatusAsync();
      if (status.isLoaded) {
        setDurationMillis(status.durationMillis ?? null);
      }

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setPositionMillis(status.positionMillis ?? null);
          if (status.durationMillis && durationMillis !== status.durationMillis) {
            setDurationMillis(status.durationMillis);
          }
          if (status.didJustFinish && !status.isLooping) {
            setIsPlaying(false);
            setPlaying(null);
            resetProgress();
          }
        }
      });

      setPlaying(newSound);
      setIsPlaying(true);
      if (setPlayingFile) setPlayingFile(file.uri);
    } catch (err) {
      console.error("Error playing audio:", err);
      resetProgress();
    }
  }

  async function handleDelete(file: File) {
    try {
      if (playing && playingFile === file.uri) {
        await playing.stopAsync();
        await playing.unloadAsync();
        setPlaying(null);
        setPlayingFile(null);
        resetProgress();
      }
      await file.delete();
      setFiles((prev) => prev.filter(f => f.uri !== file.uri));
    } catch (err) {
      console.error("Failed to delete file:", err);
    }
  }

      async function handleSoundInstance(audioUrl: string) {
          if (playing) {
              await playing.unloadAsync();
          }
  
          setCurrProcess("Starting playback…");
  
          const { sound } = await Audio.Sound.createAsync(
              { uri: audioUrl },
              { shouldPlay: true }
          );
  
          const status = await sound.getStatusAsync();
          if (status.isLoaded) {
              setDurationMillis(status.durationMillis ?? null);
          }
  
          sound.setOnPlaybackStatusUpdate((status) => {
              if (status.isLoaded) {
                  setPositionMillis(status.positionMillis ?? null);
                  if (status.durationMillis && durationMillis !== status.durationMillis) {
                      setDurationMillis(status.durationMillis);
                  }
                  if (status.didJustFinish && !status.isLooping) {
                      setIsPlaying(false);
                      setPlaying(null);
                      resetProgress();
                      setCurrProcess("Playback finished");
                      setTimeout(() => setCurrProcess(null), 1500);
                  }
              }
          });
  
          setPlaying(sound);
          setIsPlaying(true);
      }

      async function playSelected(videoId: string) {
        try {
            if (playing) {
                await playing.unloadAsync();
            }

            setCurrProcess("Fetching audio stream…");
            resetProgress();

            const streamData = await getStreamingUrl(videoId);

            if (!streamData?.url) {
                throw new Error('No audio URL found');
            }

            setCurrProcess("Loading audio…");
            await handleSoundInstance(streamData.url);

            setCurrProcess(null);
        } catch (err: any) {
            console.error('Playback error:', err.message);
            setCurrProcess(`Error: ${err.message}`);
            setTimeout(() => setCurrProcess(null), 3000);
        }
    }

        async function getTrackId(title: string, artist: string): Promise<string | null> {
            try {
                setCurrProcess("Searching music…");
                resetProgress();
    
                const result = await searchYouTubeMusic(title, artist);
    
                if (!result?.videoId) {
                    setCurrProcess("Song not found");
                    setTimeout(() => setCurrProcess(null), 2000);
                    return null;
                }
    
                return result.videoId;
            } catch (err: any) {
                console.error('Search error:', err.message);
                setCurrProcess("Search failed");
                setTimeout(() => setCurrProcess(null), 2000);
                return null;
            }
        }
    
    
        async function handleTrackStream(title: string, artist: string) {
            setOpenPopoverId(null);
    
            const trackId = await getTrackId(title, artist);
            if (!trackId) return;
    
            await playSelected(trackId);
        }

        async function handleDownloadTrack(title: string, artist: string) {
        setOpenPopoverId(null);

        const trackId = await getTrackId(title, artist);
        if (!trackId) return;

        try {
            setProgress(0, 100);

            const downloadPath = await getDownload(trackId, (progress) => {
                const { totalBytesWritten, totalBytesExpectedToWrite } = progress;
                
                if (totalBytesExpectedToWrite) {
                    setProgress(totalBytesWritten, totalBytesExpectedToWrite);
                    
                    const pct = Math.floor((totalBytesWritten / totalBytesExpectedToWrite) * 100);
                    setCurrProcess(`Downloading… ${pct}%`);
                }
            });

            resetProgress();
            setCurrProcess(`Audio downloaded at ${downloadPath}`);
            setTimeout(() => setCurrProcess(null), 5000);
        } catch (err: any) {
            console.error("Download error:", err);
            resetProgress();
            setCurrProcess(`Download failed: ${err.message}`);
            setTimeout(() => setCurrProcess(null), 5000);
        }
    }

        function resetProgress() {
            setPositionMillis(null);
            setDurationMillis(null);
        }
    
        function setProgress(position: number, duration: number) {
            setPositionMillis(position);
            setDurationMillis(duration);
        }


  return (
    <MusicContext.Provider
      value={{
        playing,
        isPlaying,
        currProcess,
        playingFile,
        handleTrackStream,
        handleDownloadTrack,

        results,
        isFocused,
        openPopoverId,
        mounted,

        setPlaying,
        setIsPlaying,
        setCurrProcess,
        setDurationMillis,
        setPositionMillis,
        setPlayingFile,

        setResults,
        setIsFocused,
        setOpenPopoverId,
        setMounted,

        togglePlay,
        handlePlay,
        handleDelete,
        loadFiles,
        files

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
