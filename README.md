# Dino vs Kettle

Dino vs Kettle is a browser-based Three.js multiplayer game where players join rooms or tournaments, throw color-coded kettles at roaming dinosaurs, upgrade their power and movement, and compete for high scores.

## Requirements

- Node.js 20 LTS or newer
- npm
- A modern web browser

## Install and run

```bash
npm install
```

Start the multiplayer server and development server in separate terminals:

```bash
npm run server
npm run dev
```

Open the URL shown by Vite, usually `http://localhost:5173/`.

On Windows, you can use `run.bat`. On macOS and Linux, make `run.sh` executable and run it:

```bash
chmod +x run.sh
./run.sh
```

## Multiplayer on a local network

The host computer must run both services. Other players on the same network can open:

```text
http://HOST_IP:5173/
```

The host firewall may need to allow ports `5173` and `8081`.

## Build

```bash
npm run build
```

## License

The project is available for download under the terms in [LICENSE](LICENSE). In short, personal and non-commercial use is permitted with attribution; commercial use, public redistribution, and distributed adaptations require written permission from programmingrobot.

See [CREDITS.md](CREDITS.md) for asset information.
