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

    if (!results.contents || results.contents.length === 0) {
      console.warn('No results found for:', query);
      return null;
    }

    console.log(`Search completed in ${Date.now() - startTime}ms`);

    const firstResult = results.contents[0];
    const resultType = firstResult.type;

    console.log('First result type:', resultType, '|', firstResult.title);

    switch (resultType) {
      case 'MusicResponsiveListItem':
        const itemType = firstResult.item_type;

        switch (itemType) {
          case 'song':
          case 'video':
            return {
              videoId: firstResult.id,
              title: firstResult.title || 'Unknown Title',
              artist: firstResult.artists?.[0]?.name || firstResult.author?.name || artist || null,
              source: itemType,
            };

          case 'album':
            try {
              const albumInfo = await yt.music.getAlbum(firstResult.id);
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
                albumTitle: firstResult.title,
              };
            } catch (err) {
              console.error('Failed to fetch album tracks:', err);
              return null;
            }

          default:
            console.warn('Unsupported item_type:', itemType);
            return null;
        }

      case 'MusicCardShelf':
        // MusicCardShelf uses on_tap
        const videoIdFromTap = firstResult.on_tap?.payload?.videoId;

        console.log('MusicCardShelf debug:', {
          hasOnTap: !!firstResult.on_tap,
          hasPayload: !!firstResult.on_tap?.payload,
          videoId: videoIdFromTap,
          hasContents: !!firstResult.contents,
          contentsLength: firstResult.contents?.length,
          title: firstResult.title?.text || firstResult.title
        });

        if (videoIdFromTap) {
          const titleText = firstResult.title?.text || firstResult.title || 'Unknown Title';
          console.log('Extracted from on_tap:', { videoId: videoIdFromTap, title: titleText });
          return {
            videoId: videoIdFromTap,
            title: titleText,
            artist: artist || null,
            source: 'card' as const,
          };
        }

        // Fallback check if container
        if (firstResult.contents && firstResult.contents.length > 0) {
          const contentItem = firstResult.contents.first();

          if (contentItem.type === 'MusicResponsiveListItem') {
            const videoId = contentItem.id;
            if (!videoId) {
              console.warn('MusicResponsiveListItem has no videoId');
              return null;
            }

            return {
              videoId,
              title: contentItem.title || firstResult.title?.text || 'Unknown Title',
              artist: contentItem.artists?.[0]?.name || artist || null,
              source: 'card' as const,
            };
          }
        }

        console.warn('MusicCardShelf: no videoId in on_tap and no contents');
        return null;

      case 'Song':
        return {
          videoId: firstResult.id,
          title: firstResult.title,
          artist: firstResult.artists?.[0]?.name || null,
          source: 'song' as const,
        };

      case 'Video':
        return {
          videoId: firstResult.id,
          title: firstResult.title,
          artist: firstResult.author?.name || null,
          source: 'video' as const,
        };

      case 'Album':
      case 'EP':
        // Fetch the album to get tracks inside
        try {
          const albumInfo = await yt.music.getAlbum(firstResult.id);
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
            artist: matchingTrack.artists?.[0]?.name || artist || firstResult.artist?.name || null,
            source: 'album' as const,
            albumTitle: firstResult.title,
          };
        } catch (err) {
          console.error('Failed to fetch album tracks:', err);
          return null;
        }

      case 'Playlist':
        // Could handle playlists similarly to albums if needed
        console.warn('First result is a playlist, skipping');
        return null;

      default:
        console.warn('Unknown result type:', resultType);
        return null;
    }
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