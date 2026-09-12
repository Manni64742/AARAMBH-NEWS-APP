# Aarambh News — Mobile App (Android + iOS)

Expo (React Native + TypeScript) app for the Aarambh News hyperlocal newsroom, connected to the real Node.js backend at `../Aarambh-News-Backend`.

## Quick Start

```bash
npm install
npx expo start
# then press `a` for Android emulator, scan QR with Expo Go for device
```

### Point the app at your backend

Edit `src/config.ts`:

```ts
export const API_URL = 'http://<YOUR-LAN-IP>:5000/api/v1'
export const API_BASE = 'http://<YOUR-LAN-IP>:5000'
```

- Android emulator: `http://10.0.2.2:5000/api/v1`
- Physical device (Expo Go): use your computer's LAN IP (same Wi-Fi)
- Production: put your deployed backend URL here

Backend must be running:

```bash
cd ../Aarambh-News-Backend
npm run dev
```

## Features

**User**
- Login / Register (email or phone + password)
- Home: personalized + hyperlocal feed (locality → city → district → state → national), breaking strip, trending, "Near You", dynamic category chips
- Feed (category + location filters), News detail (views, like, favorite, bookmark, share, comments, related news)
- Categories, Videos (2-col grid), Shorts (swipe-up reels), Audio player (play/pause/seek)
- Search (news/videos/reporters/locations/categories), Bookmarks, Favorites, Notifications, Reading history
- Profile: name, photo, email/phone, location, language, interests, notification preferences, change password

**Reporter (extra tab when role = REPORTER)**
- Dashboard (submitted/pending/approved/published/rejected, total views)
- Submit news (Article, Short News, Video, Short Video, Audio) with image/video/audio upload, GPS-suggested location (editable), category, tags, language — Save Draft / Submit for Review
- My Submissions with status filters
- Reporter profile + application flow, eKYC, Press Card

## Architecture notes

- `src/config.ts` — API base URL (single source of truth)
- `src/api/client.ts` — axios instance, JWT token in AsyncStorage, error helper
- `src/api/endpoints.ts` — typed API functions (auth, content, categories, locations, search, media, interactions, follows, notifications, comments, reporter)
- `src/context/` — Auth, Location (GPS + manual), Toast
- `src/navigation/RootNavigator.tsx` — role-based navigation
- `src/hooks/usePagedFeed.ts` — pagination / pull-to-refresh / skeletons helper
- Images: `expo-image` (cached). Video: `expo-video`. Audio: `expo-audio`.

## Backend endpoints added for the app

See `Aarambh-News-Backend`:

- `POST /auth/register`, `POST /auth/login`
- `GET /news/feed` (personalized ranking), `POST /news/:id/view`
- `POST /interactions/:contentId/:type` (LIKE/FAVORITE/BOOKMARK), `GET /interactions/list`
- `POST /follows/:targetType/:targetId`, `GET /follows/names`
- `GET /notifications`, `POST /notifications/:id/read`, `GET|PUT /notifications/preferences`
- `GET|PUT /users/profile`, `PUT /users/password`, `PUT /users/preferences`, `GET|DELETE /users/history`
- `GET /reporters/stats`, `PUT /reporters/profile`, `POST /reporters/ekyc`, `GET /reporters/card`

WhatsApp notifications (reporter registration/approval/publish) are wired via `src/services/whatsapp.service.ts` — set `WHATSAPP_PROVIDER=twilio` + Twilio credentials in the backend `.env` to enable.

## Production build

```bash
npx expo prebuild
# or EAS: eas build --platform android --profile production
```
