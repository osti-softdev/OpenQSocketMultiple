## Copilot / AI agent instructions — OpenQSocketMultiple

Purpose: give an AI coding agent the minimal, concrete knowledge it needs to be productive in this repository.

- Entry point: `index.js` (root). Start the app with `npm install` then `npm start` (package.json -> "start": "node index.js").
- High-level architecture:
  - Frontend static assets: `reso/html/`, `reso/js/`, `reso/css/` and `reso/libs/`. Files are served by Express (see static mounts in `index.js`).
  - Backend / runtime modules: `reso/node/` contains server-side modules (watchers, admin, teller, kiosk, express APIs). Many modules export `setup*` functions that accept a Socket.IO `socket` or `io` (e.g. `setupAds(socket, io)`).
  - Auxiliary scripts: `node/` holds helper tools and fallback implementations.
  - Runtime outputs & config: `reso/outfolder/` and `outfolder/` hold runtime artifacts (images, audio, logs, config) and `app.pid`.

- Key patterns & conventions (do not change without cause):
  - Register socket handlers from `index.js` inside `io.on('connection', ...)`. Add new features by adding `setup*` functions under `reso/node` and calling them in the connection handler.
  - System type branching is via `reso/node/envconfig` and `outfolder/config` (values: `ARDUINO_UNO`, `ARDUINO_WIFI`, `WINDOWED_APPLICATIONS`).
  - Serial port logic lives in `reso/node/serialport` and must consider Windows vs Linux behaviors.
  - Several fallback files (e.g. `insertviaapi-fallback-*.js`) are preserved alternatives — do not delete without confirmation.

### Repository scanning & in-session memory (required for productive edits)

Agents MUST build a short in-memory index at session start and update it after edits. This index is the single source of truth for deciding which files to change when the user asks.

Minimal scan recipe (run once per session):
  1. List files with aglob: include `index.js`, `package.json`, `README.md`, `reso/**`, `node/**`, `outfolder/config/**`. Exclude `**/vendor/**`, `**/node_modules/**`, and other large vendor trees.
  2. Read these files fully: `package.json`, `index.js`, `README.md`, `reso/node/envconfig.js`, `reso/node/db.js`, `reso/node/logger.js`.
  3. Read entry files under `reso/node/*` and record exported functions (look for `module.exports` / `exports.`) and common events (Socket.IO events).
  4. Produce a one-line responsibility map per file. Example: `reso/node/getads.js -> serves ads and emits 'ads:refresh'`.
  5. Keep the map in memory and update it after any file modifications you make in the session.

Practical rules and limits:
  - Skip very large files (>1MB) unless the user requests them explicitly. Prompt the user before reading giant vendor directories.
  - Prefer targeted reads: when a user's request mentions a feature, consult the index and only read the candidate files you need to confirm details.

How to behave when asked to make a change:
  - Consult the in-memory index and list candidate files you will edit (1–3 files max), each with a one-line reason.
  - If multiple plausible files exist, ask one concise clarifying question before editing.
  - Apply the minimal focused edit to accomplish the request, run the relevant quick checks (start server or linter), and report back exact files changed and the verification result.

Example agent workflow (user asks "Change X"):
  - Step 1: consult index -> produce candidates and proposed edit plan.
  - Step 2: ask a single clarifying question if needed.
  - Step 3: apply patch(es) with small atomic commits, run smoke-start or tests, and show results + files changed.

Developer workflows & quick commands (project-specific):
  - Install & start: `npm install` then `npm start` (runs `node index.js`).
  - Dev (debug): `npm run dev` (starts Node with --inspect).
  - Stop helper: `npm run stop` (runs `tools/stop.js`, which kills PID in `reso/outfolder/app.pid`).
  - Logs: `reso/outfolder/logs/logs.log` (server writes structured logs). `reso/outfolder/app.pid` contains the running PID.

Files to inspect first when troubleshooting:
  - `index.js` — entrypoint, static mounts, socket orchestration, PID handling, graceful shutdown.
  - `reso/node/*` — domain modules: admin/, teller/, kiosk/, expressAPI/, serialport.js, logger.js, db.js, envconfig.js.

If anything here is unclear or you want a different scanning strategy (more aggressive or more conservative), say which and the agent will adapt the scan rules.

## Copilot / AI agent instructions — OpenQSocketMultiple

Purpose: give an AI coding agent the minimal, concrete knowledge it needs to be productive in this repository.

- Entry point: `index.js` (root). Start the app with `npm install` then `npm start` (package.json -> "start": "node index.js").
- High-level architecture:
  - Frontend static assets: `reso/html/`, `reso/js/`, `reso/css/` and `reso/libs/`. Files are served by Express (see static mounts in `index.js`).
  - Backend / runtime modules: `reso/node/` contains the app's server-side modules (watchers, admin, teller, kiosk, express APIs). Many modules export setup functions that accept Socket.IO `socket` or `io` (e.g. `setupAds(socket, io)`, `setupFooterWatcher(socket, io)`).
  - Auxiliary Node scripts: `node/` contains additional server-side utilities and fallbacks used in some deployments.
  - Runtime output and local config: `reso/outfolder/` and `outfolder/` (created at startup) hold runtime artifacts (images, audio, logs, config) and `app.pid`.

- Key patterns and conventions (do not change without cause):
  - Modules under `reso/node/*` typically export `initialize`, `setupX`, or similar functions and are invoked from `index.js` — modify callers there when behavior changes.
  - System types are configured via `outfolder/config` and read through `reso/node/envconfig` — supported values: `ARDUINO_UNO`, `ARDUINO_WIFI`, `WINDOWED_APPLICATIONS`. Code frequently branches on these types.
  - Socket-oriented APIs: socket handlers are registered inside `io.on('connection', ...)` in `index.js`. Prefer adding features by adding new `setup*` functions under `reso/node` and calling them from the connection handler.
  - Serial port code lives under `reso/node/serialport` and is conditional on system type. Changes must consider Windows vs Linux behavior (index.js already includes Windows PID detection logic).
  - There are multiple "fallback" JS files in `node/` (e.g. `insertviaapi-fallback-*.js`, `serialport-fallback-*.js`) — these appear to be preserved or alternative implementations. Preserve naming and do not delete without confirming intent.

- Developer workflows and commands (repo-specific):
  - Install & run: `npm install` then `npm start` (runs `node index.js`).
  - Debugging (Windows PowerShell): set env vars with `$env:NAME = 'value'`; run with Node inspector: `node --inspect index.js` or `node --inspect-brk index.js`.
  - Logs and runtime files: `outfolder/logs/`, `outfolder/images/`, `outfolder/audio/`, `outfolder/config/`. The server writes `outfolder/app.pid` on start — tests that touch startup should account for that.
  - No automatic SCSS/CSS build is defined in package.json. SCSS files exist under `reso/css/*.scss` — maintainers likely build them externally; do not assume an internal build pipeline unless you add one and update docs.

- Integration points & external deps to be aware of:
  - Serial ports (package: `serialport`) and `@ffmpeg/*` libs are present in dependencies.
  - Socket.io is the main real-time layer (`socket.io` dependency). Many internal watchers push updates via Socket.IO.
  - Some printer-related PHP code and libraries are present under `reso/outfolder/printer` and `outfolder/printer` — the node app may call `executephp` (see `reso/node/printer`). Treat PHP printer integrations as external pieces.

- When editing or adding code:
  - Keep the server `index.js` connection pattern intact: register new socket behavior via `setup*` modules and call them inside the `io.on('connection', ...)` block.
  - If you change config keys or structure, update `reso/node/envconfig` and any file consumers (search for `loadConfig(io)` usage).
  - Avoid removing fallback files; treat them as archived alternatives unless a maintainer confirms deletion.

Example references to inspect while coding:
- `index.js` — app entry, static mounts, socket connection orchestration, PID handling.
- `reso/node/` — per-domain modules (admin/, teller/, kiosk/, expressAPI/, serialport.js, logger.js, db.js, envconfig.js).
- `outfolder/` and `reso/outfolder/` — runtime data and vendor PHP libs.

If anything in this file seems incomplete, tell me which area you want expanded (start commands, environment, or module examples) and I will iterate.
