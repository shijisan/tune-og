import * as FileSystem from 'expo-file-system/legacy';

export interface DownloadResult {
  uri: string;
  progress?: number;
}

interface MusicSearchResult {
  id: string;
  title: string;
  views?: string;
  artists?: Array<{ name?: string }>;
  author?: { name?: string };
}

let cachedClient: any = null;
let initPromise: Promise<any> | null = null;

async function waitForPolyfills() {
  return new Promise(resolve => {
    if (typeof EventTarget !== 'undefined') {
      resolve(true);
    } else {
      setTimeout(() => resolve(true), 100);
    }
  });
}

export async function preInitializeYouTubeClients() {
  console.log('Pre-initializing YouTube client (single Android instance)...');
  const start = Date.now();
  try {
    await getClient();
    const duration = Date.now() - start;
    console.log(`YouTube client ready in ${duration}ms`);
  } catch (err) {
    const duration = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`YouTube client init failed after ${duration}ms:`, message);
  }
}

export async function getClient() {
  if (cachedClient) return cachedClient;
  if (initPromise) return await initPromise;

  initPromise = (async () => {
    await waitForPolyfills();
    const YT = await import('youtubei.js');
    
    const { ClientType } = YT;
    
    const client = await YT.Innertube.create({
      client_type: ClientType.ANDROID, 
      generate_session_locally: true
    });
    
    cachedClient = client;
    return client;
  })();

  return await initPromise;
}


function normalize(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '');
}

export async function searchYouTubeMusic(title: string, artist: string) {
  try {
    const query = `${title}${artist ? ` by ${artist}` : ''}`;
    const yt = await getClient(); 
    const normalizedQuery = normalize(query);

    console.log('Starting parallel search...');
    const startTime = Date.now();

    const [songSearch, videoSearch] = await Promise.all([
      yt.music.search(query, { type: 'song', limit: 5 }),
      yt.music.search(query, { type: 'video', limit: 5 })
    ]);

    console.log(`Search completed in ${Date.now() - startTime}ms`);

    const songResults = (songSearch.songs?.contents || []) as MusicSearchResult[];
    const videoResults = (videoSearch.videos?.contents || []) as MusicSearchResult[];

    const parseViews = (viewText: string | undefined): number => {
      if (!viewText) return 0;
      const match = viewText.match(/([\d,.]+)\s*([KMBkmb]?)/i);
      if (!match) return 0;
      let num = parseFloat(match[1].replace(/,/g, ''));
      switch (match[2]?.toUpperCase()) {
        case 'K': num *= 1_000; break;
        case 'M': num *= 1_000_000; break;
        case 'B': num *= 1_000_000_000; break;
        default: break;
      }
      return Math.floor(num);
    };

    const candidates = [
      ...songResults.map(song => ({
        videoId: song.id,
        title: song.title,
        artist: song.artists?.[0]?.name || null,
        views: parseViews(song.views),
        type: 'song' as const,
        normalizedTitle: normalize(song.title),
      })),
      ...videoResults.map(video => ({
        videoId: video.id,
        title: video.title,
        artist: video.author?.name || null,
        views: parseViews(video.views),
        type: 'video' as const,
        normalizedTitle: normalize(video.title),
      })),
    ];

    if (candidates.length === 0) {
      console.warn('No results found for:', query);
      return null;
    }

    const relevantCandidates = candidates.filter(cand =>
      cand.normalizedTitle.includes(normalizedQuery) ||
      normalizedQuery.includes(cand.normalizedTitle) ||
      (cand.title.toLowerCase().includes(title.toLowerCase()) &&
        (!artist || cand.artist?.toLowerCase().includes(artist.toLowerCase())))
    );

    const finalCandidates = relevantCandidates.length > 0 ? relevantCandidates : candidates;
    finalCandidates.sort((a, b) => b.views - a.views);

    const best = finalCandidates[0];
    const result = {
      videoId: best.videoId,
      title: best.title,
      artist: best.artist,
      source: best.type,
      views: best.views,
    };

    console.log('Top result by views:', result);
    return result;
  } catch (err: any) {
    console.error('Search error:', err.message);
    return null;
  }
}

export async function getStreamingUrl(videoId: string) {
  try {
    const yt = await getClient(); 
    const info = await yt.getBasicInfo(videoId);

    const formats = [
      ...(info.streaming_data?.formats || []),
      ...(info.streaming_data?.adaptive_formats || []),
    ];

    const audioFormats = formats
      .filter((f: any) => f.mime_type?.includes('audio') && f.url)
      .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));

    if (audioFormats.length === 0) {
      throw new Error('No audio URLs available');
    }

    const bestAudio = audioFormats[0];

    return {
      url: bestAudio.url,
      title: info.basic_info?.title,
      author: info.basic_info?.author,
      thumbnail: info.basic_info?.thumbnail?.[0]?.url,
      duration: info.basic_info?.duration,
    };
  } catch (err: any) {
    console.error('Stream URL error:', err.message);
    throw err;
  }
}

export async function getDownload(
  videoId: string,
  onProgress?: (progress: { totalBytesWritten: number; totalBytesExpectedToWrite: number }) => void
): Promise<string> {
  const streamData = await getStreamingUrl(videoId);
  if (!streamData?.url) throw new Error("No audio stream found");

  const safe = (s: string) => s.replace(/[\\/:*?"<>|]/g, "");
  const fileName = safe(`${streamData.title} - ${streamData.author}.m4a`);

  const downloadsUri = FileSystem.documentDirectory + "downloads/";
  await FileSystem.makeDirectoryAsync(downloadsUri, { intermediates: true });

  const fileUri = downloadsUri + fileName;

  const downloadResumable = FileSystem.createDownloadResumable(
    streamData.url,
    fileUri,
    {},
    (prog) => {
      if (onProgress) onProgress(prog);
    }
  );

  const result = await downloadResumable.downloadAsync();
  if (!result?.uri) throw new Error("Download failed");

  return result.uri;
}