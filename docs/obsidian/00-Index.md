---
title: OpenQ Knowledge Vault & Persistent Memory Index
date: 2026-11-05
tags:
  - openq
  - index
  - moc
  - graphify
  - architecture
aliases:
  - Home
  - OpenQ Index
  - Vault Root
status: active
---

# OpenQ Knowledge Vault & Memory Cortex

> [!info] Graphify + Obsidian Integration
> This vault serves as the persistent architectural memory, debugging ledger, and operational note-taking hub for the **OpenQ Queue Management System**. It is indexed by **Graphify** (`graphify-out/GRAPH_REPORT.md` & `graphify-out/graph.html`) and connected to the Admin Console's **Notes & Memory** workspace.

## Core Navigation (Map of Content)

- **Architecture & Modules**
  - [[System-Architecture|OpenQ Full-Stack System Architecture]]
  - [[Windows-Caller-Desktop|Windows Caller Desktop Apps (v4.8 & v4.7.2)]]
- **Debugging & Security Audits**
  - [[Systematic-Bug-Audit|Systematic Debugging & API Security Ledger]]
- **Operational Memory & Admin Notes**
  - [[Welcome-Memory|Operational Memory & Branch Notes]]

## High-Level Architecture Diagram

```mermaid
flowchart TD
    Electron["Electron Shell (index.js)"] --> Server["Express 5 + Socket.IO (server.js)"]
    Server --> DB[("SQLite3 WAL (backend/config/db.db)")]
    Server --> ObsidianVault[("Obsidian Vault (docs/obsidian/)")]
    
    subgraph Routes["Backend API Routes"]
        KioskAPI["AkioskApi.js"]
        OnlineAPI["AonlineKioskApi.js"]
        DisplayAPI["AdisplayApi.js"]
        TellerAPI["AtellerApi.js"]
        AdminAPI["AadminApi.js"]
    end
    
    Server --> Routes
    
    subgraph Clients["Connected Clients"]
        KioskUI["On-Prem Kiosk (/kiosk)"]
        OnlineUI["Online QR Kiosk (/onlinekiosk)"]
        DisplayUI["TV Display (/display)"]
        WebTeller["Web Caller (/caller)"]
        WinCaller48["Windows Caller .NET 4.8 (windowsCaller)"]
        WinCaller472["Windows Caller .NET 4.7.2 (windowsCaller_prevs)"]
        AdminUI["Admin Console 2.0 (/admin/dashboard)"]
    end
    
    KioskUI --> KioskAPI
    OnlineUI --> OnlineAPI
    DisplayUI --> DisplayAPI
    WebTeller --> TellerAPI
    WinCaller48 --> TellerAPI
    WinCaller472 --> TellerAPI
    AdminUI --> AdminAPI
    AdminAPI --> ObsidianVault
```

## Graphify Knowledge Map Outputs

- **Audit Report:** `graphify-out/GRAPH_REPORT.md`
- **Interactive Visualization:** `graphify-out/graph.html`
- **Graph Data:** `graphify-out/graph.json`
- **Generated Node Vault:** `graphify-out/obsidian/`

