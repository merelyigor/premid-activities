# PreMiD Activity для AniTube та UAKino

Автор: **Merelyigor**

## Мова

[English](README.md) | **Українська**

Це репозиторій з локальними [PreMiD](https://premid.app/) Activity для українських відеосайтів:

- **AniTube** (`anitube.in.ua`)
- **UAKino** (`uakino.best`)

Activity показують у Discord Rich Presence, що саме ви дивитесь: назву, постер, стан відтворення, play/pause і прогрес перегляду, якщо PreMiD може прочитати плеєр.

## Можливості

### AniTube

- показує назву аніме;
- показує серію або кількість серій, якщо активну серію ще не видно на сторінці;
- бере постер зі сторінки AniTube;
- показує play/pause;
- показує прогрес перегляду, якщо доступний `<video>` або iframe-плеєр.

### UAKino

- показує назву фільму;
- показує рік, якість і жанри;
- бере постер зі сторінки UAKino;
- показує play/pause;
- показує прогрес перегляду;
- має fallback-статус для головної, категорій, фільтрів, серіалів, мультфільмів та інших сторінок.

Для UAKino картинки беруться з сайту, але передаються в Discord через DuckDuckGo image proxy. Це потрібно тому, що Discord не завжди може напряму завантажити зображення з `uakino.best`.

## Структура репозиторію

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

## Швидке встановлення

1. Встановіть **Discord Desktop**.
2. Встановіть **PreMiD desktop app**.
3. Встановіть **PreMiD browser extension** для Chrome або Chromium-браузера.
4. У Discord відкрийте:

```text
User Settings -> Activity Privacy
```

5. Увімкніть:

```text
Share your detected activities with others
```

6. У PreMiD extension увімкніть:

```text
Settings -> Developer -> Activity Developer Mode
```

7. Натисніть:

```text
Load built Activity
```

8. Виберіть потрібний ZIP:

```text
dist/AniTube.zip
dist/UAKino.zip
```

## Як зібрати ZIP-и самостійно

Потрібно мати встановлені:

- Git
- Node.js
- npm
- PowerShell

Клонуйте репозиторій:

```powershell
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

Запустіть збірку:

```powershell
.\scripts\build.ps1
```

Скрипт зробить таке:

- склонує офіційний репозиторій `PreMiD/Activities` у службову папку `PreMiD-Activities`;
- встановить залежності;
- збере CLI PreMiD;
- скопіює activity у правильні папки;
- збере built ZIP-и;
- покладе результат у `dist/`.

Зібрати тільки один activity:

```powershell
.\scripts\build.ps1 -Activities AniTube
.\scripts\build.ps1 -Activities UAKino
```

## Discord Application ID

PreMiD Activity потребує `clientId` Discord Application.

У цьому репозиторії `clientId` уже прописані в `presence.ts`, бо без них built activity не працюватиме. `clientId` і `publicKey` не є приватними токенами. Їх можна бачити на клієнті, і вони часто присутні в open-source PreMiD Activity.

Не публікуйте:

- bot token;
- OAuth client secret;
- приватні ключі;
- будь-які токени доступу.

Для локального обліку ID є приклад:

```text
premid-apps.example.json
```

Скопіюйте його:

```powershell
Copy-Item premid-apps.example.json premid-apps.local.json
```

І заповніть свої значення. Файл `premid-apps.local.json` ігнорується Git.

## Як створити власну Discord Application

1. Відкрийте [Discord Developer Portal](https://discord.com/developers/applications).
2. Натисніть **New Application**.
3. Назвіть application, наприклад:

```text
AniTube Activity
UAKino Activity
```

4. Скопіюйте **Application ID**.
5. Вставте його в `presence.ts`:

```ts
const presence = new Presence({
  clientId: 'YOUR_APPLICATION_ID',
});
```

6. Перезберіть activity:

```powershell
.\scripts\build.ps1
```

## Примітки щодо картинок

AniTube зазвичай віддає постери напряму у форматі JPEG, тому Discord показує їх без додаткових обхідних шляхів.

UAKino часто віддає постери як WebP або блокує пряме завантаження для Discord. Тому activity:

- бере постер зі сторінки;
- для mini poster міняє `.webp` на `.jpg`, якщо така версія існує;
- передає URL через DuckDuckGo image proxy.

Це не локальна картинка і не Discord asset. Джерело все одно сторінка UAKino.

## Відомі обмеження

- Прогрес перегляду залежить від того, чи PreMiD бачить `<video>` у сторінці або iframe.
- Якщо сайт змінить HTML-структуру, селектори в `presence.ts` може знадобитися оновити.
- PreMiD Developer Mode може вимагати саме built ZIP, а не сирі `metadata.json` і `presence.ts`.

## Ліцензія

MIT License. Дивіться [LICENSE](LICENSE).


