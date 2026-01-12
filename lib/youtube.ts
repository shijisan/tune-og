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
  await new Promise(resolve => setTimeout(resolve, 500));
  try {
    await getClient();
  } catch {}
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
    const query = `${title}${artist ? ` ${artist}` : ''}`;
    const yt = await getClient();

    console.log('Searching YouTube Music for:', query);
    const startTime = Date.now();

    const results = await yt.music.search(query, { limit: 5 });

    console.log(results);

    if (!results.contents || results.contents.length === 0) {
      console.warn('No results found for:', query);
      return null;
    }

    console.log(`Search completed in ${Date.now() - startTime}ms`);

    // Try each result until we find a valid one
    for (let resultIndex = 0; resultIndex < results.contents.length; resultIndex++) {
      const selectedResult = results.contents[resultIndex];
      
      console.log(`Trying result ${resultIndex + 1}:`, selectedResult.type, '|', selectedResult.title);

      let selectedResultTitle = '';
      if (selectedResult.title) {
        if (typeof selectedResult.title === 'string') {
          selectedResultTitle = selectedResult.title.toLowerCase();
        } else if (selectedResult.title.text) {
          selectedResultTitle = selectedResult.title.text.toLowerCase();
        }
      }

      const baseBlacklist = ["official music video", "music video", "mv", "lyric"];
      const variantBlacklist = ["remix", "single version", "cover", "live", "tour"];

      const normalizeQuery = query.toLowerCase();
      const normalizeSelectedResultTitle = selectedResultTitle
        .toLowerCase()
        .replace(/[()\-]/g, " ");

      const blacklist = [...baseBlacklist];

      if (!variantBlacklist.some(v => normalizeQuery.includes(v))) {
        blacklist.push(...variantBlacklist);
      }

      if (blacklist.some(v => normalizeSelectedResultTitle.includes(v))) {
        console.log("Skipping blacklisted result:", normalizeSelectedResultTitle);
        continue;
      }

      const result = await processResult(selectedResult, title, artist, yt);
      
      if (result) {
        return result;
      }
      
      console.log(`Result ${resultIndex + 1} didn't yield a valid track, trying next...`);
    }

    console.warn('No valid results found after checking all items');
    return null;

  } catch (err: any) {
    console.error('Search error:', err.message);
    return null;
  }
}

async function processResult(selectedResult: any, title: string, artist: string, yt: any) {
  switch (selectedResult.type) {
    case 'MusicResponsiveListItem':
      const itemType = selectedResult.item_type;

      switch (itemType) {
        case 'song':
        case 'video':
          return {
            videoId: selectedResult.id,
            title: selectedResult.title || 'Unknown Title',
            artist: selectedResult.artists?.[0]?.name || selectedResult.author?.name || artist || null,
            source: itemType,
          };

        case 'album':
          try {
            const albumInfo = await yt.music.getAlbum(selectedResult.id);
            const tracks = albumInfo.contents || [];

            if (tracks.length === 0) {
              console.warn('Album has no tracks');
              return null;
            }

            const normalizedTitle = normalize(title);
            const matchingTrack = tracks.find((track: any) => {
              const trackTitle = normalize(track.title || '');
              return trackTitle.includes(normalizedTitle) || normalizedTitle.includes(trackTitle);
            }) || tracks[0];

            return {
              videoId: matchingTrack.id,
              title: matchingTrack.title,
              artist: matchingTrack.artists?.[0]?.name || artist || null,
              source: 'album' as const,
              albumTitle: selectedResult.title,
            };
          } catch (err) {
            console.error('Failed to fetch album tracks:', err);
            return null;
          }

        default:
          console.warn('Unsupported item_type:', itemType);
          return null;
      }

    case 'MusicShelf':
      // MusicShelf is a container with items in its contents
      // Try to find a valid song or video in the shelf
      if (selectedResult.contents && selectedResult.contents.length > 0) {
        for (const shelfItem of selectedResult.contents) {
          console.log('MusicShelf item:', shelfItem.type, shelfItem.item_type);
          
          if (shelfItem.type === 'MusicResponsiveListItem') {
            const itemType = shelfItem.item_type;
            
            if (itemType === 'song' || itemType === 'video') {
              return {
                videoId: shelfItem.id,
                title: shelfItem.title || 'Unknown Title',
                artist: shelfItem.artists?.[0]?.name || shelfItem.author?.name || artist || null,
                source: itemType,
              };
            }
            
            console.log('Skipping MusicShelf item with type:', itemType);
          }
        }
      }
      
      console.warn('MusicShelf has no valid song/video items');
      return null;

    case 'MusicCardShelf':
      // MusicCardShelf uses on_tap
      const videoIdFromTap = selectedResult.on_tap?.payload?.videoId;

      console.log('MusicCardShelf debug:', {
        hasOnTap: !!selectedResult.on_tap,
        hasPayload: !!selectedResult.on_tap?.payload,
        videoId: videoIdFromTap,
        hasContents: !!selectedResult.contents,
        contentsLength: selectedResult.contents?.length,
        title: selectedResult.title?.text || selectedResult.title
      });

      if (videoIdFromTap) {
        const titleText = selectedResult.title?.text || selectedResult.title || 'Unknown Title';
        console.log('Extracted from on_tap:', { videoId: videoIdFromTap, title: titleText });
        return {
          videoId: videoIdFromTap,
          title: titleText,
          artist: artist || null,
          source: 'card' as const,
        };
      }

      // Fallback check if container
      if (selectedResult.contents && selectedResult.contents.length > 0) {
        const contentItem = selectedResult.contents.first();

        if (contentItem.type === 'MusicResponsiveListItem') {
          const videoId = contentItem.id;
          if (!videoId) {
            console.warn('MusicResponsiveListItem has no videoId');
            return null;
          }

          return {
            videoId,
            title: contentItem.title || selectedResult.title?.text || 'Unknown Title',
            artist: contentItem.artists?.[0]?.name || artist || null,
            source: 'card' as const,
          };
        }
      }

      console.warn('MusicCardShelf: no videoId in on_tap and no contents');
      return null;

    case 'Song':
      return {
        videoId: selectedResult.id,
        title: selectedResult.title,
        artist: selectedResult.artists?.[0]?.name || null,
        source: 'song' as const,
      };

    case 'Video':
      return {
        videoId: selectedResult.id,
        title: selectedResult.title,
        artist: selectedResult.author?.name || null,
        source: 'video' as const,
      };

    case 'Album':
    case 'EP':
      // Fetch the album to get tracks inside
      try {
        const albumInfo = await yt.music.getAlbum(selectedResult.id);
        const tracks = albumInfo.contents || [];

        if (tracks.length === 0) {
          console.warn('Album/EP has no tracks');
          return null;
        }

        // Find track matching the title/first track
        const normalizedTitle = normalize(title);
        const matchingTrack = tracks.find((track: any) => {
          const trackTitle = normalize(track.title || '');
          return trackTitle.includes(normalizedTitle) || normalizedTitle.includes(trackTitle);
        }) || tracks[0];

        return {
          videoId: matchingTrack.id,
          title: matchingTrack.title,
          artist: matchingTrack.artists?.[0]?.name || artist || selectedResult.artist?.name || null,
          source: 'album' as const,
          albumTitle: selectedResult.title,
        };
      } catch (err) {
        console.error('Failed to fetch album tracks:', err);
        return null;
      }

    case 'Playlist':
      console.warn('Result is a playlist, skipping');
      return null;

    default:
      console.warn('Unknown result type:', selectedResult.type);
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