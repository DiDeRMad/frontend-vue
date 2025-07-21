# Super Online Game – MVP

This is a minimal multiplayer prototype (client + server) to kick-start the development of a bigger online game.  
Run multiple browser tabs (or different machines) to see the players synchronised in real time.

## Prerequisites
* Node.js ≥ 18
* npm

## Setup & start (development)

```bash
cd server
npm install
npm run dev
```

Open `http://localhost:3000` in several tabs and use the arrow keys to move your circle around.  
The state is broadcast to every connected client.

## Production build

```bash
cd server
npm run build        # compile TypeScript
npm run start        # run compiled JS from dist/
```

---

From here you can:

* Extend the `Game` class with health, score, projectiles, etc.
* Replace the simple canvas render with a proper engine like Phaser or PixiJS.
* Move the client into a separate build step (e.g. Vite + TypeScript/React).
* Persist game state in a database for long-living worlds.
