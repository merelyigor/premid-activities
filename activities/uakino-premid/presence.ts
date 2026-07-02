import { ActivityType, Assets, getTimestamps } from 'premid';

const presence = new Presence({
  clientId: '1522200845792444566',
});

enum ActivityAssets {
  Logo = 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fuakino.best%2Ftemplates%2Fuakino%2Fimages%2Flogo.png',
}

interface VideoData {
  currentTime: number;
  duration: number;
  paused: boolean;
  timestamp: number;
}

let iframeVideo: VideoData | null = null;

const browsingTimestamp = Math.floor(Date.now() / 1000);

presence.on('iFrameData', (data: { currentTime?: number; currTime?: number; duration: number; paused: boolean }) => {
  const currentTime = data.currentTime ?? data.currTime ?? 0;

  if (Number.isFinite(currentTime) && Number.isFinite(data.duration) && data.duration > 0) {
    iframeVideo = {
      currentTime,
      duration: data.duration,
      paused: data.paused,
      timestamp: Date.now(),
    };
  }
});

presence.on('UpdateData', async () => {
  const presenceData = isMoviePage()
    ? getMoviePresenceData()
    : getBrowsingPresenceData();

  presence.setActivity(presenceData);
});

function getMoviePresenceData(): PresenceData {
  const title = getMovieTitle();
  const originalTitle = getOriginalTitle();
  const poster = getPosterImage();
  const quality = getInfoValue('Якість');
  const year = getInfoValue('Рік виходу');
  const duration = getInfoValue('Тривалість');
  const genres = getInfoValue('Жанр');
  const episode = getEpisodeTitle();
  const video = getMainPageVideoData() ?? getFreshIframeVideo();
  const metaState = [
    year,
    quality,
    getShortGenres(genres),
  ].filter(Boolean).join(' • ') || originalTitle || 'Дивиться фільм';

  const presenceData: PresenceData = {
    type: ActivityType.Watching,
    details: title,
    state: episode ?? metaState,
    largeImageKey: poster ?? ActivityAssets.Logo,
    largeImageText: originalTitle ? `${originalTitle}${duration ? ` • ${duration}` : ''}` : 'UAKino',
    smallImageKey: video?.paused ? Assets.Pause : Assets.Play,
    smallImageText: video ? (video.paused ? 'На паузі' : 'Відтворюється') : 'UAKino',
    startTimestamp: browsingTimestamp,
    buttons: [
      {
        label: 'Відкрити UAKino',
        url: location.href,
      },
    ],
  };

  if (video && !video.paused) {
    const [startTimestamp, endTimestamp] = getTimestamps(video.currentTime, video.duration);

    presenceData.startTimestamp = startTimestamp;
    presenceData.endTimestamp = endTimestamp;
  }

  return presenceData;
}

function getBrowsingPresenceData(): PresenceData {
  return {
    type: ActivityType.Watching,
    details: 'UAKino',
    state: getBrowsingState(),
    largeImageKey: ActivityAssets.Logo,
    largeImageText: 'uakino.best',
    smallImageKey: Assets.Search,
    smallImageText: 'Переглядає сайт',
    startTimestamp: browsingTimestamp,
    buttons: [
      {
        label: 'Відкрити UAKino',
        url: location.href,
      },
    ],
  };
}

function isMoviePage(): boolean {
  return Boolean(
    document.querySelector('.film-poster img[itemprop="image"], .solototle[itemprop="name"], link[itemprop="video"]'),
  );
}

function getBrowsingState(): string {
  const path = location.pathname;

  if (path === '/' || path === '') {
    return 'На головній';
  }

  if (path.includes('/filmy/')) {
    return 'Переглядає фільми';
  }

  if (path.includes('/seriesss/')) {
    return 'Переглядає серіали';
  }

  if (path.includes('/cartoon/')) {
    return 'Переглядає мультфільми';
  }

  if (path.includes('/animeukr/')) {
    return 'Переглядає аніме';
  }

  if (path.includes('/find/')) {
    return 'Користується фільтрами';
  }

  return cleanTitle(document.title) ?? 'Переглядає сайт';
}

function getMovieTitle(): string {
  return getCleanSelectorText([
    '.solototle[itemprop="name"]',
    '[itemprop="name"].solototle',
    'h1 [itemprop="name"]',
    'h1',
    'meta[property="og:title"]',
  ]) ?? cleanTitle(document.title) ?? 'UAKino';
}

function getOriginalTitle(): string | null {
  return getCleanSelectorText([
    '.origintitle',
    '[itemprop="alternateName"]',
  ]);
}

function getEpisodeTitle(): string | null {
  const activeEpisode = getCleanSelectorText([
    '.playlists-videos .playlists-items .active',
    '.playlists-items .active',
    '.playlists-series .active',
    '[class*="episode"] .active',
    '[class*="seria"] .active',
    '[class*="season"] .active',
  ]);

  if (activeEpisode) {
    return activeEpisode;
  }

  const video = getMainPageVideoData() ?? getFreshIframeVideo();

  if (video) {
    return video.paused ? 'На паузі' : 'Дивиться фільм';
  }

  return null;
}

function getInfoValue(label: string): string | null {
  const items = [...document.querySelectorAll('.fi-item')];

  for (const item of items) {
    const itemLabel = item.querySelector('.fi-label')?.textContent?.replace(/\s+/g, ' ').trim();

    if (!itemLabel?.toLowerCase().includes(label.toLowerCase())) {
      continue;
    }

    const value = item.querySelector('.fi-desc')?.textContent?.replace(/\s+/g, ' ').trim();

    return value || null;
  }

  return null;
}

function getShortGenres(value: string | null): string | null {
  if (!value) {
    return null;
  }

  return value
    .split(',')
    .map(genre => genre.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(', ');
}

function getPosterImage(): string | null {
  const poster = document.querySelector<HTMLImageElement>('.film-poster img[itemprop="image"], img[itemprop="image"]');

  if (poster?.getAttribute('src')) {
    return normalizeUakinoImageUrl(new URL(poster.getAttribute('src')!, location.origin));
  }

  return getMetaImage();
}

function normalizeUakinoImageUrl(url: URL): string {
  if (
    url.hostname === 'uakino.best'
    && url.pathname.startsWith('/uploads/mini/poster/')
    && url.pathname.endsWith('.webp')
  ) {
    url.pathname = url.pathname.replace(/[.]webp$/i, '.jpg');
  }

  return proxyUakinoImageUrl(url.href);
}

function proxyUakinoImageUrl(url: string): string {
  return `https://external-content.duckduckgo.com/iu/?u=${encodeURIComponent(url)}`;
}

function getMetaImage(): string | null {
  const meta = document.querySelector<HTMLMetaElement>('meta[property="og:image"], meta[property="twitter:image"]');

  if (!meta?.content) {
    return null;
  }

  return proxyUakinoImageUrl(new URL(meta.content, location.origin).href);
}

function getMainPageVideoData(): VideoData | null {
  const video = [...document.querySelectorAll('video')]
    .find(video => Number.isFinite(video.duration) && video.duration > 0);

  if (!video) {
    return null;
  }

  return {
    currentTime: video.currentTime,
    duration: video.duration,
    paused: video.paused,
    timestamp: Date.now(),
  };
}

function getFreshIframeVideo(): VideoData | null {
  if (!iframeVideo || Date.now() - iframeVideo.timestamp > 10000) {
    return null;
  }

  return iframeVideo;
}

function getCleanSelectorText(selectors: string[]): string | null {
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    const value = element instanceof HTMLMetaElement
      ? element.content
      : element?.textContent;
    const text = cleanTitle(value ?? '');

    if (text && !isBadTitle(text)) {
      return text;
    }
  }

  return null;
}

function cleanTitle(value: string): string | null {
  const cleaned = value
    .replace(/\s+/g, ' ')
    .replace(/^Фільм\s+/i, '')
    .replace(/\s+онлайн українською мовою.*$/i, '')
    .replace(/\s+дивитися онлайн.*$/i, '')
    .replace(/\s+в HD.*$/i, '')
    .replace(/\s*[-|–—]\s*UAKino.*$/i, '')
    .replace(/🎬|💙|💛/g, '')
    .trim();

  return cleaned.length > 0 && !isBadTitle(cleaned) ? cleaned : null;
}

function isBadTitle(value: string): boolean {
  const text = value.toLowerCase();

  return [
    'скачати',
    'торент',
    'коментар',
    'трейлер',
    'саундтреки',
    'увійти',
    'реєстрація',
  ].some(blockedText => text.includes(blockedText));
}
