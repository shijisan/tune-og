import { MusicSearchResult } from '@/app/(tabs)';
import { useMusic } from '@/context/MusicContext';
import { getDownload, getStreamingUrl, searchYouTubeMusic } from '@/lib/youtube';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Audio } from 'expo-av';
import { File } from 'expo-file-system';
import { Pressable, Text, View } from 'react-native';
import Popover from 'react-native-popover-view';

interface MusicPopoverProps {
    openPopoverId: string | number | null;
    item: MusicSearchResult | File;
    setOpenPopoverId: (id: string | number | null) => void;
    setPlayingFile?: (file: string | null) => void;
    playingFile?: string | null;
    handlePlay?: (file: File) => Promise<void>;
    handleDelete?: (file: File) => Promise<void>;
}

export default function MusicPopover({ openPopoverId, item, setOpenPopoverId, handlePlay, handleDelete }: MusicPopoverProps) {
    const {
        playing,
        setCurrProcess,
        setPlaying,
        setIsPlaying,
        durationMillis,
        setDurationMillis,
        setPositionMillis
    } = useMusic();

    const popoverId = "trackId" in item ? item.trackId : item.uri;

    function resetProgress() {
        setPositionMillis(null);
        setDurationMillis(null);
    }

    function setProgress(position: number, duration: number) {
        setPositionMillis(position);
        setDurationMillis(duration);
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

    async function handleTrackStream(title: string, artist: string) {
        setOpenPopoverId(null);

        const trackId = await getTrackId(title, artist);
        if (!trackId) return;

        await playSelected(trackId);
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

    return (
        <Popover
            popoverStyle={{
                backgroundColor: "rgb(18,18,18)",
            }}
            isVisible={openPopoverId === popoverId}
            onRequestClose={() => setOpenPopoverId(null)}
            from={
                <Pressable className='p-2' onPress={() => setOpenPopoverId(popoverId)}>
                    <Ionicons name='ellipsis-horizontal' size={16} color="rgb(160,160,166)" />
                </Pressable>
            }
        >
            <View className="p-2 w-fit">
                {"trackId" in item ? (
                    <>
                        <Pressable className="py-1 px-4" onPress={() => handleTrackStream(item.trackName, item.artistName)}>
                            <Text className='text-foreground w-full'>Stream</Text>
                        </Pressable>
                        <Pressable className="py-1 px-4" onPress={() => handleDownloadTrack(item.trackName, item.artistName)}>
                            <Text className='text-foreground w-full'>Download</Text>
                        </Pressable>
                    </>
                ) :
                    (
                        <>
                            <Pressable className="py-1 px-4" onPress={() => handlePlay?.(item)}>
                                <Text className='text-foreground w-full'>Play</Text>
                            </Pressable>

                            <Pressable className="py-1 px-4" onPress={() => handleDelete?.(item)}>
                                <Text className='text-foreground w-full'>Delete Locally</Text>
                            </Pressable>
                        </>
                    )}
                <Pressable className="py-1 px-4" onPress={() => console.log('Add to Playlist')}>
                    <Text className='text-foreground w-full'>Add to Playlist</Text>
                </Pressable>
                <Pressable className="py-1 px-4" onPress={() => console.log('Share')}>
                    <Text className='text-foreground w-full'>Share</Text>
                </Pressable>
                <Pressable className="py-1 px-4" onPress={() => console.log('Favorite')}>
                    <Text className='text-foreground w-full'>Favorite</Text>
                </Pressable>
            </View>
        </Popover>
    );
}