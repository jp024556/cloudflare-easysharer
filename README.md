# Cloudflare EasySharer 🚀

[![Pages](https://img.shields.io/badge/Frontend-Cloudflare%20Pages-blue)](https://easysharer.pages.dev/)  
[![Worker](https://img.shields.io/badge/Backend-Cloudflare%20Workers-orange)](https://github.com/jp024556/cloudflare-easysharer/tree/main/worker)

**EasySharer** is a lightweight, fast, and privacy‑friendly file‑sharing web app running entirely on Cloudflare’s edge — frontend on **Cloudflare Pages**, backend on **Cloudflare Workers**.

> Live: https://easysharer.pages.dev/

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Clone](#clone)
  - [Frontend (web)](#frontend-web)
  - [Backend (worker)](#backend-worker)
- [Deployment](#deployment)
- [Roadmap / Ideas](#roadmap--ideas)
- [Contributing](#contributing)
- [License](#license)

## Overview

EasySharer lets you quickly share files through a clean, minimal interface. You upload a file, get a link, and share it — all backed by Cloudflare’s global edge network for low‑latency access from anywhere.

The goal is to keep things:

- **Simple** – minimal UI, no accounts required
- **Fast** – served from Cloudflare’s edge
- **Serverless** – no servers or containers to manage

## Features

- 📁 Upload files from the browser
- 🔗 Get a shareable link for each upload
- ⚡ Edge‑hosted frontend (Cloudflare Pages)
- 🌍 Global, low‑latency API powered by Cloudflare Workers
- 🧩 Monorepo layout for frontend + backend

> Note: Storage, limits, and retention policies are controlled by your Cloudflare configuration (KV, R2, or other backing services).

## Tech Stack

- **Frontend:** Cloudflare Pages (static web app, bundled JS)
- **Backend:** Cloudflare Workers
- **Platform:** Cloudflare edge network
- **Language:** TypeScript / JavaScript

## Repository Structure

```text
cloudflare-easysharer/
├─ web/          # Frontend (Cloudflare Pages project)
├─ worker/       # Backend API (Cloudflare Worker project)
├─ LICENSE
└─ README.md
```

- `web/` contains the UI that is deployed to `easysharer.pages.dev`.
- `worker/` contains the Worker that exposes the file‑sharing API.

## Getting Started

### Prerequisites

- Node.js + npm (or pnpm/yarn)
- A Cloudflare account
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) CLI installed globally

### Clone

```bash
git clone https://github.com/jp024556/cloudflare-easysharer.git
cd cloudflare-easysharer
```

### Frontend (web)

From the `web` folder:

```bash
cd web
npm install           # or pnpm install / yarn
npm run dev           # start local dev server
# npm run build       # create production build
```

Point your browser to the printed dev URL to work on the UI.

### Backend (worker)

From the `worker` folder:

```bash
cd worker
npm install              # or pnpm/yarn
npx wrangler dev         # or wrangler dev if installed globally
```

This runs the Worker locally using Wrangler. Check `wrangler.toml` in the `worker` directory for bindings, routes, and environment configuration.

## Deployment

### Deploy Frontend (Cloudflare Pages)

1. Create a new **Pages** project in the Cloudflare dashboard.
2. Connect it to this GitHub repository.
3. Set the project root to `web/` and configure the correct build command and output directory (for example, `npm run build` and `dist/` depending on your setup).
4. Deploy from the `main` branch (or whichever branch you prefer).

### Deploy Backend (Cloudflare Workers)

From the `worker` directory:

```bash
cd worker
npm run build        # if you have a build step
wrangler deploy
```

Make sure the Worker route matches the URLs the frontend expects (for example, `/api/*`). Configure this in `wrangler.toml` and/or via the Cloudflare dashboard.

## Roadmap / Ideas

Some possible next steps for EasySharer:

- ⏱️ Expiry times for shared links
- 🔒 Optional password‑protected shares
- 📊 Basic usage stats (views/downloads)
- 🧹 Auto‑cleanup of old files based on TTL
- 🌙 Dark mode toggle in the UI

## Contributing

Suggestions, bug reports, and pull requests are welcome!

1. Fork the repo
2. Create a feature branch
3. Commit your changes with clear messages
4. Open a pull request

If you’re proposing a larger change, consider opening an issue first to discuss it.

## License

This project is licensed under the **MIT License** — see [`LICENSE`](./LICENSE) for details.

---

Made with ❤️ by **Jay Prakash**
