import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useRef, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { API_URL, API_PROTOCOL } from "@env";

interface SearchbarProps {
  customPath?: string;
  path?: string;
  buildUrl?: (keyword: string) => string;
  method?: "GET" | "POST";
  setResults: (results: any[]) => void;
  isFocused: boolean;
  setIsFocused: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Searchbar({ path, customPath, buildUrl, method = "POST", setResults, isFocused, setIsFocused }: SearchbarProps) {
  const [query, setQuery] = useState<string>("");
  const inputRef = useRef<TextInput>(null);
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finalUrl = buildUrl
    ? buildUrl(query.trim())
    : customPath
      ? `${customPath}${customPath.includes('?') ? '&' : '?'}${new URLSearchParams({
        term: query.trim(),
        limit: "20",
        media: "music"
      }).toString()}`
      : `${API_PROTOCOL}://${API_URL}/api/${path}`;

  async function fetchResults(keyword: string) {
    if (!keyword.trim()) return;

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

  function handleChange(text: string) {
    setQuery(text);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      if (text.length > 0) fetchResults(text);
    }, 750);
  }

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
            onFocus={(e) => {e.stopPropagation();setIsFocused(true)}}
            onBlur={() => setIsFocused(false)}
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
