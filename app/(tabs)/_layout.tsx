import { CustomTabBar } from '@/components/bottom-tab-bar';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useMusic } from '@/context/MusicContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { preInitializeYouTubeClients } from '@/lib/youtube';
import { Tabs } from 'expo-router';
import { useEffect } from 'react';

export default function TabLayout() {
  const colorScheme = useColorScheme();
    const { mounted, setMounted } = useMusic();

  
    useEffect(() => {
      if (mounted) return;
  
      const init = async () => {
        await new Promise(requestAnimationFrame);
        setTimeout(() => {
          preInitializeYouTubeClients();
          setMounted(true);
        }, 0);
      };
  
      init();
    }, []);

  return (
    <>

      <Tabs
        screenOptions={{
          headerShown: false,
        }}
        tabBar={(props) => <CustomTabBar {...props} />}
        >

        <Tabs.Screen
          name="index"
          options={{
            title: 'Discover',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="magnifyingglass" color={color} />,
          }}
        />

        <Tabs.Screen
          name="library"
          options={{
            title: "Library",
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="music.pages.fill" color={color} />,
          }}
        />

        <Tabs.Screen
          name="account"
          options={{
            title: "Account",
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="person" color={color} />,
          }}
        />
      </Tabs>
      
    </>
  );
}
