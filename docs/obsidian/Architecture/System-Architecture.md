---
title: OpenQ Full-Stack System Architecture
date: 2026-11-05
tags:
  - openq
  - architecture
  - backend
  - frontend
  - sqlite
aliases:
  - System Architecture
  - Backend Architecture
status: active
---

# OpenQ Full-Stack System Architecture

Back to [[00-Index|OpenQ Knowledge Vault Index]] · Related: [[Windows-Caller-Desktop]] · [[Systematic-Bug-Audit]]

> [!abstract] Architectural Overview
> OpenQ is a hybrid Electron + Node.js/Express 5 + Socket.IO + SQLite3 (WAL mode) queue management platform with multi-display support, thermal PHP receipt printing, GSM SMS notifications, QR online check-in, web portals, and native C# WinForms teller widgets.

## 1. Core Entry Points

- **`index.js` (Electron Wrapper):**
  - Initializes `global.ROOT_PATH` and `global.BACKEND_PATH`.
  - Boots `server.js` in-process and launches two fullscreen `BrowserWindow` instances:
    1. Primary Display → `/kiosk`
    2. Secondary Extended Display (if detected) → `/display`
- **`server.js` (Express & Socket.IO Host):**
  - Configures rate limiting (`backend/utilities/rateLimiter.js`), security headers (`backend/utilities/security.js`), cookie/session middleware, static asset serving (`public/`), and mounts route modules.

## 2. Database Layer (`backend/utilities/db.js`)

- **Engine:** SQLite3 at `backend/config/db.db` with `PRAGMA journal_mode = WAL`, `synchronous = NORMAL`, `busy_timeout = 15000`, and `foreign_keys = ON`.
- **Core Tables:**
  - `accounts`: Admin/Monitor console users (`user`, `admin`, `superadmin`) with `bcrypt` password hashes.
  - `counters`: Teller counter definitions, assigned `services` CSV, `group_id`, `group_name`, and `cpass` credentials.
  - `counter_groups`: Routing groups synchronized with services via `backend/utilities/serviceGroups.js`.
  - `services`: Queue service definitions (`sname`, `shortSname`, `regular` prefix, `priority` prefix, `sub_services`, `status`).
  - `transactions`: Daily queue tickets (`pending`, `online_reserved`, `calling`, `called`, `held`, `received`, `finished`, `voided`).
  - `forwarded_tickets`: Tracks ticket forwarding metadata (`from_teller_id`, `to_teller_id`, `to_group_id`, `note`, `forwarded_at`).
  - `settings`: Key-value store for marquee announcements, colors, speed, privacy policy, and voice format.

## 3. Real-Time Socket.IO Event Contract

| Event Name | Emitted By | Consumed By | Purpose |
| :--- | :--- | :--- | :--- |
| `new-ticket` | `AkioskApi.js`, `AonlineKioskApi.js` | Web Caller, [[Windows-Caller-Desktop]], Admin | Notifies tellers immediately when a ticket is created or checked in |
| `calledticketsArrived` | `AtellerApi.js` | Display TV (`indexSocket.js`), Callers | Triggers voice announcement & popup on TV display |
| `ticket_called` | `AtellerApi.js` | Callers, Admin | Refreshes active and waiting queues |
| `ticket_completed` | `AtellerApi.js` | Callers, Admin, Display | Updates served counts and clears completed tickets |
| `ticket_held` | `AtellerApi.js` | Callers, Admin | Moves ticket to Held tab |
| `ticket_forwarded` | `AtellerApi.js` | Callers, Admin | Moves ticket to Recv (Forwarded) tab & plays alert |
| `ticket_voided` | `AtellerApi.js` | Callers, Admin | Updates voided status |
| `service_update` | `AadminApi.js` | Kiosk, Callers, Display | Reloads service catalog and counter assignments |

## 4. Typography & UI System (`public/css/`)

- **Font Families (100% Offline Local Assets in `public/libs/fonts/`):**
  - `Gotham`: Mapped across weights `400` (`GothamBook.ttf`), `500` (`GothamMedium.ttf`), `700` (`GothamBold.ttf`), and `900` (`Gotham-Black.otf`).
  - `calibri`: Mapped to `CalibriRegular.ttf` (`400`), `Calibri Bold.TTF` (`700`), and `Calibri Light.ttf` (`300`).
  - `digital`: Mapped to `digital-7 (mono).ttf` and `digital-mono_italic.ttf` for LED clock/counter readouts.

