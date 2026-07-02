# PreMiD Activities for AniTube and UAKino

Author: **Merelyigor**

## Language

**English** | [Українська](README.uk.md)

This repository contains local [PreMiD](https://premid.app/) activities for Ukrainian video websites:

- **AniTube** (`anitube.in.ua`)
- **UAKino** (`uakino.best`)

The activities show Discord Rich Presence data for what you are watching: title, poster, playback state, play/pause, and watch progress when PreMiD can read the player.

## Features

### AniTube

- shows the anime title;
- shows the active episode or episode count when the active episode is not visible yet;
- uses the poster from the AniTube page;
- shows play/pause;
- shows watch progress when a `<video>` element or iframe player is available.

### UAKino

- shows the movie title;
- shows year, quality, and genres;
- uses the poster from the UAKino page;
- shows play/pause;
- shows watch progress;
- has a fallback status for the home page, categories, filters, series, cartoons, and other browsing pages.

For UAKino, images are still taken from the website, but they are passed to Discord through DuckDuckGo image proxy. This is needed because Discord cannot always load images directly from `uakino.best`.

## Repository Structure

```text
.
├── activities/
│   ├── anitube-premid/
│   │   ├── metadata.json
│   │   ├── presence.ts
│   │   └── iframe.ts
│   └── uakino-premid/
│       ├── metadata.json
│       ├── presence.ts
│       └── iframe.ts
├── dist/
│   ├── AniTube.zip
│   └── UAKino.zip
├── scripts/
│   └── build.ps1
├── premid-apps.example.json
├── .gitignore
├── LICENSE
└── README.md
```

## Quick Install

1. Install **Discord Desktop**.
2. Install the **PreMiD desktop app**.
3. Install the **PreMiD browser extension** for Chrome or another Chromium browser.
4. In Discord, open:

```text
User Settings -> Activity Privacy
```

5. Enable:

```text
Share your detected activities with others
```

6. In the PreMiD extension, enable:

```text
Settings -> Developer -> Activity Developer Mode
```

7. Click:

```text
Load built Activity
```

8. Select the ZIP you need:

```text
dist/AniTube.zip
dist/UAKino.zip
```

## Build ZIPs Yourself

You need:

- Git
- Node.js
- npm
- PowerShell

Clone the repository:

```powershell
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

Run the build script:

```powershell
.\scripts\build.ps1
```

The script will:

- clone the official `PreMiD/Activities` repository into the local helper folder `PreMiD-Activities`;
- install dependencies;
- build the PreMiD CLI;
- copy the activities into the correct folders;
- build the ZIP files;
- place the result in `dist/`.

Build only one activity:

```powershell
.\scripts\build.ps1 -Activities AniTube
.\scripts\build.ps1 -Activities UAKino
```

## Discord Application ID

A PreMiD Activity needs a Discord Application `clientId`.

This repository already has `clientId` values in `presence.ts`, because built activities will not work without them. `clientId` and `publicKey` are not private tokens. They can be visible to clients and are often present in open-source PreMiD activities.

Do not publish:

- bot tokens;
- OAuth client secrets;
- private keys;
- any access tokens.

For local ID tracking, use the example file:

```text
premid-apps.example.json
```

Copy it locally:

```powershell
Copy-Item premid-apps.example.json premid-apps.local.json
```

Then fill in your values. `premid-apps.local.json` is ignored by Git.

## Create Your Own Discord Application

1. Open [Discord Developer Portal](https://discord.com/developers/applications).
2. Click **New Application**.
3. Name it, for example:

```text
AniTube Activity
UAKino Activity
```

4. Copy the **Application ID**.
5. Paste it into `presence.ts`:

```ts
const presence = new Presence({
  clientId: 'YOUR_APPLICATION_ID',
});
```

6. Rebuild the activity:

```powershell
.\scripts\build.ps1
```

## Image Notes

AniTube usually serves posters directly as JPEG, so Discord can display them without extra handling.

UAKino often serves posters as WebP or blocks direct image loading for Discord. Therefore the activity:

- reads the poster from the page;
- converts mini poster `.webp` URLs to `.jpg` when that version exists;
- passes the URL through DuckDuckGo image proxy.

This is not a local image and not a Discord asset. The source is still the UAKino page.

## Known Limitations

- Watch progress depends on whether PreMiD can see a `<video>` element on the page or inside an iframe.
- If a website changes its HTML structure, selectors in `presence.ts` may need updates.
- PreMiD Developer Mode may require a built ZIP instead of raw `metadata.json` and `presence.ts` files.

## License

MIT License. See [LICENSE](LICENSE).


