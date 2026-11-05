---
title: Windows Caller Desktop Apps (v4.8 & v4.7.2)
date: 2026-11-05
tags:
  - openq
  - windowscaller
  - csharp
  - winforms
aliases:
  - Windows Caller
  - CallerApp
  - windowsCaller_prevs
status: active
---

# Windows Caller Desktop Apps (`windowsCaller` & `windowsCaller_prevs`)

Back to [[00-Index|OpenQ Knowledge Vault Index]] · Related: [[System-Architecture]] · [[Systematic-Bug-Audit]]

> [!important] Dual-Build Architecture
> OpenQ maintains two distinct C# WinForms compact desktop caller widgets so tellers on both modern Windows 10/11 PCs and legacy Windows 7 machines have a fast, always-on-top widget without needing a full browser window.

## 1. Comparison of `windowsCaller` vs `windowsCaller_prevs`

| Feature / Property | `windowsCaller` | `windowsCaller_prevs` |
| :--- | :--- | :--- |
| **Target Framework** | `.NET Framework v4.8` (`CallerApp.exe`) | `.NET Framework v4.7.2` (`CallerApp_win7.exe`) |
| **Client Window Size** | `268 × 237` (Ultra-compact widget) | `290 × 237` (Includes "Last Called" service column) |
| **Tab Styling** | Standard / OwnerDraw colored status badges | `TabDrawMode.OwnerDrawFixed` with dynamic alert colors (`LightCoral`, `Yellow`, `LightBlue`) |
| **Home Service Row** | Service Name + Reg Count + Pri Count | Service Name + Last Called Ticket (`lblLast`) + Reg Count + Pri Count |
| **Audio Alerts** | System Media `.wav` (`Alarm01.wav`, `Ring01.wav`, `tada.wav`) + fallback | Embedded `.resx` audio streams (`_success`, `_held`, `_received`, `_void`) + System Media |
| **Real-Time Updates** | `SocketIOClient` + Fallback Timer | `SocketIOClient` + 3s Fallback Timer |

## 2. Smoothness & Reliability Engineering

1. **Flicker-Free Queue Rendering:**
   - All `FlowLayoutPanel` containers (`pnlServicesList`, `pnlWaitingList`, `pnlHeldList`, `pnlForwardedList`) have `DoubleBuffered = true` enabled via reflection and wrap control updates inside `SuspendLayout()` / `ResumeLayout(true)` while properly disposing removed child controls to prevent GDI+ handle exhaustion.
2. **Non-Overlapping Poll & Socket Synchronization:**
   - Uses `Interlocked.CompareExchange` guards (`isFetchingQueues`, `isCheckingTicket`) so rapid Socket.IO bursts and timer ticks never stack concurrent HTTP requests or cause UI thread race conditions.
3. **Accurate Active Ticket Sync (`CheckCurrentTicket`):**
   - Automatically clears the displayed ticket (`ClearCurrentTicket()`) if the counter's active ticket was completed, held, forwarded, or voided from another session or auto-finished.
4. **Session Resilience (`ApiClient.cs`):**
   - Configured with 8-second HTTP timeouts (`Timeout` & `ReadWriteTimeout`) and automatic transparent re-login if the server session expires while the app remains open.

