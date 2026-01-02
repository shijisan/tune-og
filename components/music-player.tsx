import { useMusic } from "@/context/MusicContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";

export function PersistentMiniPlayer() {
  const { isPlaying, togglePlay, currProcess, durationMillis, positionMillis } = useMusic();

  const progress = durationMillis && durationMillis > 0 && positionMillis !== null
    ? (positionMillis / durationMillis) * 100
    : 0;

  return (
    <View className="w-full bg-muted border-b border-b-muted-foreground/20">
      <View className="w-full justify-center items-center p-4 flex-row gap-4">
        <Pressable onPress={togglePlay} className="bg-background p-2 rounded-full border-muted-foreground/30 border size-fit">
            <Ionicons name="play-skip-back" size={16} color="white" />
        </Pressable>
        <Pressable onPress={togglePlay} className="bg-muted-foreground/15 p-3 rounded-full border-muted-foreground/30 border size-fit">
          {isPlaying ? (
            <Ionicons name="pause" size={24} color="white" />
          ) : (
            <Ionicons name="play" size={24} color="rgb(160,160,160)" />
          )}
        </Pressable>
        <Pressable onPress={togglePlay} className="bg-background p-2 rounded-full border-muted-foreground/30 border size-fit">
            <Ionicons name="play-skip-forward" size={16} color="white" />
        </Pressable>
      </View>
      <View className="flex-row items-center gap-4 px-4 py-2 w-full">
        <Text className="text-muted-foreground text-sm">
          {positionMillis !== null
            ? new Date(positionMillis).toISOString().slice(14, 19)
            : '0:00'}
        </Text>
        <View className="flex-1 h-1.5 bg-muted-foreground rounded-full overflow-hidden">
          <View
            className="h-full bg-white rounded-full"
            style={{ width: `${progress}%` }}
          />
        </View>
        <Text className="text-muted-foreground text-sm">
          {durationMillis
            ? new Date(durationMillis).toISOString().slice(14, 19)
            : '0:00'}
        </Text>
      </View>
      {currProcess && (
        <View className='w-full p-3'>
          <Text numberOfLines={1} ellipsizeMode="tail" className="text-white text-sm text-center w-full">{currProcess}</Text>
        </View>
      )}
    </View>
  );
}