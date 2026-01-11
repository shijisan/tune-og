import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from "react";
import { Pressable, TextInput, View } from "react-native";

interface SearchbarProps {
  customPath?: string;
  path?: string;
  buildUrl?: (keyword: string) => string;
  method?: "GET" | "POST";
  setResults: (results: any[]) => void;
  isFocused: boolean;
  setIsFocused: React.Dispatch<React.SetStateAction<boolean>>;
  mounted: boolean;
}

export default function Searchbar({ path, customPath, buildUrl, method = "POST", setResults, isFocused, setIsFocused, mounted }: SearchbarProps) {
  const [query, setQuery] = useState<string>("");
  const inputRef = useRef<TextInput>(null);
  const inputTextRef = useRef("");
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  function getFinalUrl(keyword: string) {
    return customPath ? `${customPath}?${new URLSearchParams({
      term: keyword.trim(),
      limit: "20",
      media: "music"
    }).toString()}` :
      "this is the alt ver"
  }

  async function fetchResults(keyword: string) {
    if (!keyword.trim()) return;
    const finalUrl = getFinalUrl(keyword);
    const isExternal = !!customPath || !!buildUrl;

    const options: RequestInit = {
      method: isExternal ? "GET" : method,
      headers: isExternal ? {} : { "Content-Type": "application/json" },
    };

    if (!isExternal && method === "POST") {
      options.body = JSON.stringify({ keyword: keyword.trim() });
    }

    try {
      const res = await fetch(finalUrl, options);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResults(data.results);
    } catch (err) {
      console.error("Search failed:", err);
    }
  }

  function scheduleFetch(text: string) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      if (text.length > 0) fetchResults(text);
    });
  }

  function handleChange(text: string) {
    inputTextRef.current = text;
    setQuery(text);
    scheduleFetch(text);
  }

  useEffect(() => {
    if (!mounted) return;
    const text = inputTextRef.current;
    if (text.length > 0) handleChange(text);
  }, [mounted]);

  return (
    <View className="z-10 py-2">
      <View className='flex-row gap-2 w-full'>
        <View className='relative flex-1 justify-center'>
          <TextInput
            ref={inputRef}
            placeholder="Find a song..."
            placeholderTextColor="rgb(160,160,166)"
            className={`py-2 px-8 rounded-full bg-muted text-foreground w-full border ${isFocused ? "border-foreground" : "border-transparent"}`}
            onChangeText={handleChange}
            value={query}
            onFocus={(e) => { e.stopPropagation(); setIsFocused(true) }}
            onBlur={() => setIsFocused(false)}
            editable={mounted}
          />

          {!isFocused && query === "" && (
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
