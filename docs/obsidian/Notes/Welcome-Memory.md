---
title: Operational Memory & Branch Notes
date: 2026-11-05
tags:
  - openq
  - memory
  - notes
  - operations
aliases:
  - Operational Memory
  - Admin Notes
status: active
---

# Operational Memory & Branch Notes

Back to [[00-Index|OpenQ Knowledge Vault Index]] · Related: [[System-Architecture]] · [[Systematic-Bug-Audit]]

> [!tip] Synced with OpenQ Admin Console
> Notes created or updated in the **OpenQ Admin Console → Notes & Memory** tab are stored as Obsidian Flavored Markdown files in `docs/obsidian/Notes/` with YAML frontmatter and `[[Wikilinks]]`.

## Active System Memory

- **Queue Reset & Archival:** Transactions older than 365 days are automatically archived to CSV in `backend/backups/` on server startup (`backend/utilities/db.js`).
- **Teller Counter Sync:** Counter groups and services are synchronized automatically at startup via `backend/utilities/serviceGroups.js`.
- **Desktop Caller Builds:**
  - Modern Windows 10/11 Counters: `windowsCaller\bin\Debug\CallerApp.exe` (`.NET 4.8`)
  - Legacy Windows 7 Counters: `windowsCaller_prevs\bin\Debug\CallerApp_win7.exe` (`.NET 4.7.2`)

