import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useRef, useState } from "react";
import { Pressable, TextInput, View } from "react-native";

interface SearchbarProps {
  apiPath: string;
}

export default function Searchbar({ apiPath }: SearchbarProps) {
  const [query, setQuery] = useState<string>("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const router = useRouter();

  async function fetchResults(searchTerm: string) {
    if (searchTerm.trim() === "") return;
    try {
      const res = await fetch(`/${apiPath}?keyword=${encodeURIComponent(searchTerm)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: searchTerm }),
      });
      const data = await res.json();
      console.log(data);
    } catch (err) {
      console.log(err);
    }
  }

  function handleChange(text: string) {
    setQuery(text);
    if (text.length > 0) fetchResults(text);
  }

  return (
    <View
      className={`h-full py-6 ${!isFocused ? "flex-col-reverse" : ""}`}
    >
        <View className='flex-row gap-2 w-full'>
            <View className='relative flex-1 justify-center'>
                <TextInput
                    ref={inputRef}
                    placeholder="Find a song..."
                    placeholderTextColor="rgb(160,160,166)"
                    className={`py-2 px-8 rounded-full bg-muted text-foreground w-full border ${
                    isFocused ? "border-foreground" : "border-transparent"
                    }`}
                    onChangeText={handleChange}
                    value={query}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                />

                {(!isFocused && query === "") && (
                    <Ionicons
                    name="search"
                    size={16}
                    color="rgb(160,160,166)"
                    style={{ position: 'absolute', right: 16 }}
                    />
                )}
            </View>
            <Pressable
            className="px-3 aspect-square rounded-full bg-muted flex-row items-center justify-center"
            onPress={() => router.push("/settings")}
            >
            <Ionicons name="settings" size={16} color="rgb(160,160,166)" />
            </Pressable>

        </View>
        

    </View>
  );
}
