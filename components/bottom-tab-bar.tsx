import { useMusic } from '@/context/MusicContext';
import { BottomTabBar, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import { PersistentMiniPlayer } from './music-player';
import Searchbar from './searchbar';

export function CustomTabBar(props: BottomTabBarProps) {

    const { mounted, setResults, setIsFocused, isFocused } = useMusic();


    return (
        <View className={isFocused ? "absolute bottom-[35%] w-full" : ""}>
            <Searchbar customPath='https://itunes.apple.com/search' method='GET' setResults={setResults} setIsFocused={setIsFocused} isFocused={isFocused} mounted={mounted} />

            <PersistentMiniPlayer />

            <BottomTabBar {...props} />
        </View>
    );
}
