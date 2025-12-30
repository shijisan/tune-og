import Searchbar from '@/components/searchbar';
import { useState } from 'react';
import { FlatList, Keyboard, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Popover from 'react-native-popover-view';

export interface MusicSearchResult {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100?: string;
  artworkUrl60?: string;
  kind: string;
  primaryGenreName?: string;
  releaseDate?: string;
}

export default function Discover() {

  const [results, setResults] = useState<MusicSearchResult[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [openPopoverId, setOpenPopoverId] = useState<number | null>(null);

  return (
    <SafeAreaView className="flex-1 w-full">
      <Pressable
        onPress={Keyboard.dismiss}
        disabled={results !== null}
        className="flex-1 w-full"
      >
        <View className={`flex-1 px-4 w-full gap-4 ${isFocused ? "flex-col-reverse" : "flex-col"}`} >
          {results && (
            <FlatList
            onTouchMove={Keyboard.dismiss}
              data={results}
              keyExtractor={item => item.trackId.toString()}
              renderItem={({ item }) => (
                <View className="flex-row items-center gap-3">
                  <Image
                    source={{ uri: item.artworkUrl60 || item.artworkUrl100 }}
                    style={{ width: 50, height: 50 }}
                  />
                  <View className="flex-1">
                    <Text className='text-foreground text-base' numberOfLines={1}>{item.trackName}</Text>
                    <Text className='text-foreground text-xs' numberOfLines={1}>{item.artistName}</Text>
                  </View>
                  <Popover
                    popoverStyle={{
                      backgroundColor: "rgb(18,18,18)",
                    }}
                    isVisible={openPopoverId === item.trackId}
                    onRequestClose={() => setOpenPopoverId(null)}
                    from={
                      <Pressable className='p-2' onPress={() => setOpenPopoverId(item.trackId)}>
                        <Ionicons name='ellipsis-horizontal' size={16} color="rgb(160,160,166)" />
                      </Pressable>
                    }
                  >
                    <View className="p-2 w-fit">
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
                </View>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />
          )}
          <Searchbar customPath='https://itunes.apple.com/search?term=${encodeURIComponent(keyword)}' method='GET' setResults={setResults} setIsFocused={setIsFocused} isFocused={isFocused} />
        </View>
      </Pressable>
    </SafeAreaView>
  );
}
