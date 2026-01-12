import { MusicSearchResult } from '@/app/(tabs)';
import { useMusic } from '@/context/MusicContext';
import Ionicons from '@expo/vector-icons/Ionicons';
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
        handleTrackStream,
        handleDownloadTrack
    } = useMusic();

    const popoverId = "trackId" in item ? item.trackId : item.uri;




    

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