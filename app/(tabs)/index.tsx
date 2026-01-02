import Searchbar from '@/components/searchbar';
import { useEffect, useState } from 'react';
import { FlatList, Keyboard, Pressable, Text, View } from 'react-native';
import { Image } from 'react-native';
import MusicPopover from '@/components/music-popover';
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import { TextEncoder, TextDecoder } from 'text-encoding';
import { Buffer } from 'buffer';
import { PersistentMiniPlayer } from '@/components/music-player';
import { preInitializeYouTubeClients } from '@/lib/youtube';

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}
if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}
if (typeof global.process === 'undefined') {
  global.process = require('process');
}

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

    useEffect(() => {
    preInitializeYouTubeClients();
  }, []);

  return (
    <View className="flex-1 w-full mt-16">
      <Pressable
        onPress={Keyboard.dismiss}
        disabled={results !== null}
        className="flex-1 w-full"
      >
        <View onTouchMove={Keyboard.dismiss} className={`flex-1 px-4 w-full gap-4 ${isFocused ? "flex-col-reverse" : "flex-col"}`} >
          {results.length > 0 ? (
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
                  <MusicPopover item={item} openPopoverId={openPopoverId} setOpenPopoverId={setOpenPopoverId} />
                </View>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />
          ): (
            <View className='flex-1 justify-center items-center w-full'>
              {!isFocused && (
                <View className='w-80'>
                <Text className='text-2xl text-foreground font-bold text-center'>Tune-OG</Text>
                <Text className='text-muted-foreground text-center mt-4'>(TYOO-nog) FOSS Music Streaming & Downloader.</Text>
                </View>
              )}
            </View>
          )}
          <Searchbar customPath='https://itunes.apple.com/search?term=${encodeURIComponent(keyword)}' method='GET' setResults={setResults} setIsFocused={setIsFocused} isFocused={isFocused} />
          
        </View>          
        <PersistentMiniPlayer />
      </Pressable>
    </View>
  );
}