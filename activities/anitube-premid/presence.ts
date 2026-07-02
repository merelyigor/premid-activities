import { ActivityType, Assets, getTimestamps } from 'premid';

const presence = new Presence({
  clientId: '1522187696506802298',
});

enum ActivityAssets {
  Logo = 'https://anitube.in.ua/favicon.ico',
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
  const title = getPageTitle();
  const episode = getEpisodeTitle();
  const poster = getPosterImage();
  const video = getMainPageVideoData() ?? getFreshIframeVideo();

  const presenceData: PresenceData = {
    type: ActivityType.Watching,
    details: title,
    state: episode ?? 'Переглядає аніме',
    largeImageKey: poster ?? ActivityAssets.Logo,
    largeImageText: title,
    smallImageKey: Assets.Reading,
    smallImageText: 'AniTube',
    startTimestamp: browsingTimestamp,
    buttons: [
      {
        label: 'Відкрити AniTube',
        url: location.href,
      },
    ],
  };

  if (video) {
    presenceData.smallImageKey = video.paused ? Assets.Pause : Assets.Play;
    presenceData.smallImageText = video.paused ? 'На паузі' : 'Відтворюється';

    if (!video.paused) {
      const [startTimestamp, endTimestamp] = getTimestamps(video.currentTime, video.duration);

      presenceData.startTimestamp = startTimestamp;
      presenceData.endTimestamp = endTimestamp;
    }
  }

  presence.setActivity(presenceData);
});

function getPageTitle(): string {
  return getCleanSelectorText([
    'article h1',
    '.fullstory h1',
    '.story_c h1',
    '.story h1',
    '.news-title',
    '[itemprop="headline"]',
    '[itemprop="name"]',
    'h1',
  ]) ?? cleanTitle(document.title) ?? 'AniTube';
}

function getEpisodeTitle(): string | null {
  const activeEpisode = getCleanSelectorText([
    '.playlists-videos .playlists-items li.active',
    '.playlists-items li.active',
    '.mylists-tabs li.active',
    '.video-series .active',
    '.series .active',
    '.episodes .active',
    '.serials .active',
    '[class*="episode"] .active',
    '[class*="seria"] .active',
  ]);

  if (activeEpisode) {
    return activeEpisode;
  }

  const episodeCount = document.querySelector('#anime-status')?.getAttribute('data-episode');

  if (episodeCount) {
    return `Серій: ${episodeCount}`;
  }

  return null;
}

function getPosterImage(): string | null {
  const selectors = [
    '.story_post img',
    '.story_c_left img',
    'meta[property="og:image"]',
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    const imageUrl = element instanceof HTMLImageElement
      ? element.src
      : element?.getAttribute('content');

    if (!imageUrl) {
      continue;
    }

    try {
      return new URL(imageUrl, location.origin).href;
    }
    catch {
      continue;
    }
  }

  return null;
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

    if (!element?.textContent) {
      continue;
    }

    const text = cleanTitle(element.textContent);

    if (text && !isBadTitle(text)) {
      return text;
    }
  }

  return null;
}

function cleanTitle(value: string): string | null {
  const cleaned = value
    .replace(/\s+/g, ' ')
    .replace(/^Дивитися\s+/i, '')
    .replace(/\s+аніме українською онлайн.*$/i, '')
    .replace(/\s+дивитися онлайн.*$/i, '')
    .replace(/\s+онлайн.*$/i, '')
    .replace(/\s*[-|–—]\s*AniTube.*$/i, '')
    .replace(/\s*[-|–—]\s*АніТуб.*$/i, '')
    .replace(/AniTube.*$/i, '')
    .replace(/АніТуб.*$/i, '')
    .replace(/[|\-–—]+$/g, '')
    .trim();

  return cleaned.length > 0 && !isBadTitle(cleaned) ? cleaned : null;
}

function isBadTitle(value: string): boolean {
  const text = value.toLowerCase();

  return [
    'завантажити торрент',
    'скачати торрент',
    'download torrent',
    'коментар',
    'увійти',
    'реєстрація',
    'підписатися',
    'попередня серія',
    'наступна серія',
  ].some(blockedText => text.includes(blockedText));
}
