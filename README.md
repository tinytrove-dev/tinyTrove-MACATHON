MACATHON-2026

MAC Hackathon - Macathon 2026

🧸 TinyTrove

TinyTrove is a community-driven app where users can discover and share their favourite collectibles.

Join niche communities based on your interests!! Whether it’s Minecraft, Pokemon, Sanrio or Chiikawa >.< and see where others have found or bought their treasures. Members can post their finds, helping others track down items that a Google search can't simply find. All the tiny locations, drops, stores... all the treasure troves.. here in one app!

The app also includes a map + store feature, not for shopping, but for discovering real-world locations where collectibles have been spotted. It’s designed to support small, passionate communities and make finding rare or new drops easier.

---

## Table of Contents

- [Getting Started](#getting-started)
  - [Expo React Native App](#expo-react-native-app)
  - [Docker Compose](#docker-compose)


---

## Getting Started

### Expo React Native App

A minimal React + Expo Go app is included in this repository.

Run the app (Frontend)

1.	Navigate to the frontend folder:

```sh
cd frontEnd
```

2.	Install dependencies:

```sh
npm install
```

3.	Start Expo:

```sh
npm run start
```


4.	Open in Expo Go on your device or emulator.

---

Backend

1.	Navigate to the backend folder:

```sh
cd backend
```

2.	Install dependencies:

```sh
npm install
```

3.	Run the development server:

```sh
npm run dev
```

---

Database Setup (Supabase)

1.	Install Supabase:

```sh
npm install @supabase/supabase-js
```

2.	Install required Expo dependencies:

```sh
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage expo-secure-store expo-splash-screen
```

3.	If an error occurs, try:

```sh
npm install expo
```

Then run the install command again.

---

## Docker Compose

1. Copy `.env.example` to `.env` and provide the secrets.
2. Build and start the web app and API:

```sh
docker compose up --build
```

3. Open the web app at <http://localhost:8080>. The backend is available at <http://localhost:3000>.

Supabase is hosted separately; the Compose stack does not start a local database. Set valid Supabase credentials in `.env` for the backend. The Docker-built frontend uses its in-code defaults and does not receive `.env` values.

---
