import MusicPopover from '@/components/music-popover';
import { useMusic } from '@/context/MusicContext';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect } from "react";
import { FlatList, Keyboard, Pressable, Text, View } from "react-native";

export default function LibraryScreen() {
    
    const {
        playing, 
        setOpenPopoverId, 
        openPopoverId,
        loadFiles,
        files,
        handleDelete,
        handlePlay,
        setPlayingFile,
        playingFile,
    } = useMusic();

    



    useEffect(() => {
        return () => {
            if (playing) {
                playing.unloadAsync();
            }
        };
    }, [playing]);

    

    

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