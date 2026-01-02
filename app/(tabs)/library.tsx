import { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { Paths, Directory, File } from "expo-file-system";
import { Audio } from "expo-av";
import { PersistentMiniPlayer } from "@/components/music-player";
import { useFocusEffect } from '@react-navigation/native';

export default function LibraryScreen() {
    const [files, setFiles] = useState<File[]>([]);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [playingFile, setPlayingFile] = useState<string | null>(null);

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
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [sound]);

    async function handlePlay(file: File) {
        try {
            if (sound) {
                await sound.stopAsync();
                await sound.unloadAsync();
                setSound(null);
            }
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: file.uri },
                { shouldPlay: true }
            );
            setSound(newSound);
            setPlayingFile(file.uri);
        } catch (err) {
            console.error("Error playing audio:", err);
        }
    }

    async function handleDelete(file: File) {
        try {
            if (sound && playingFile === file.uri) {
                await sound.stopAsync();
                await sound.unloadAsync();
                setSound(null);
                setPlayingFile(null);
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
            <View className="px-4">
                <Text className="text-foreground">Downloaded Files</Text>
                {files.length === 0 && <Text className="text-muted">No downloads yet</Text>}
            </View>
                <FlatList
                className="flex-1 p-4"
                    data={files}
                    keyExtractor={(item) => item.uri}
                    renderItem={({ item }) => (
                        <View className="flex-row items-center justify-between mb-4 bg-muted-foreground/10 p-2 rounded">
                            <Pressable
                                className={`flex-1 ${playingFile === item.uri ? 'bg-green-600 p-2 rounded' : ''}`}
                                onPress={() => handlePlay(item)}
                            >
                                <Text className="text-foreground">{item.name}</Text>
                            </Pressable>
                            <Pressable
                                className="ml-2 p-2 bg-red-600 rounded"
                                onPress={() => handleDelete(item)}
                            >
                                <Text className="text-white">Delete</Text>
                            </Pressable>
                        </View>
                    )}
                />

                <PersistentMiniPlayer />
            
        </View>
    );
}
