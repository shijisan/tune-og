import MusicPopover from '@/components/music-popover';
import { useMusic } from '@/context/MusicContext';
import { useFocusEffect } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { Directory, File, Paths } from "expo-file-system";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Keyboard, Pressable, Text, View } from "react-native";

export default function LibraryScreen() {
    const [files, setFiles] = useState<File[]>([]);
    const [playingFile, setPlayingFile] = useState<string | null>(null);
    const {
        playing, 
        setPlaying, 
        setOpenPopoverId, 
        openPopoverId,
        setIsPlaying,
        setDurationMillis,
        setPositionMillis,
        durationMillis
    } = useMusic();

    function resetProgress() {
        setPositionMillis(null);
        setDurationMillis(null);
    }

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

    useEffect(() => {
        return () => {
            if (playing) {
                playing.unloadAsync();
            }
        };
    }, [playing]);

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

    useFocusEffect(
        useCallback(() => {
            loadFiles();
        }, [])
    );

    return (
        <View className="flex-1 bg-background mt-16">
            <View className="gap-6 p-4">
                <Text className="text-foreground">Downloaded Files</Text>
                <View className='px-4'>
                    {files.length === 0 && <Text className="text-muted">No downloads yet</Text>}
                    <FlatList
                        className='gap-3'
                        onTouchMove={Keyboard.dismiss}
                        data={files}
                        keyExtractor={item => item.uri}
                        renderItem={({ item }) => (
                        <Pressable 
                            className="flex-row items-center justify-between p-2" 
                            onPress={() => handlePlay(item)}
                        >
                            <View className="flex-1">
                            <Text className='text-foreground text-base' numberOfLines={1}>{item.name}</Text>
                            </View>
                            <MusicPopover item={item} openPopoverId={openPopoverId} setOpenPopoverId={setOpenPopoverId} setPlayingFile={setPlayingFile} playingFile={playingFile} handlePlay={handlePlay} handleDelete={handleDelete} />
                        </Pressable>
                        )}
                        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                    />
                </View>
            </View>
                
            
        </View>
    );
}