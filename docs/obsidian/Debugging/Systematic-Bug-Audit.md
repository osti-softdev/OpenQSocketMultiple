---
title: Systematic Debugging & API Security Ledger
date: 2026-11-05
tags:
  - openq
  - debugging
  - security
  - audit
aliases:
  - Bug Audit
  - Security Audit
status: active
---

# Systematic Debugging & API Security Ledger

Back to [[00-Index|OpenQ Knowledge Vault Index]] · Related: [[System-Architecture]] · [[Windows-Caller-Desktop]]

> [!success] Skills Applied
> Audited and resolved using `/systematic-debugging` (Root Cause → Pattern → Hypothesis → Implementation) and `/api-security-best-practices` (Authentication, Input Validation, Rate Limiting, Safe Error Handling).

## 1. Backend Root-Cause Fixes

| ID | Component | Root Cause | Resolution |
| :- | :--- | :--- | :--- |
| **BUG-01** | `backend/routes/AdisplayApi.js` | `catch (error)` referenced undeclared `err.message` in `/getCallingTickets`, causing an uncaught `ReferenceError` on DB errors. | Standardized `catch (err)` and structured error logging. |
| **BUG-02** | `backend/routes/pages.js` | `requireAuth` called `jwt.verify(token, JWT_SECRET)` where `JWT_SECRET` was undefined. | Loaded `JWT_SECRET` from `backend/utilities/security.js` / environment config. |
| **BUG-03** | `backend/routes/AkioskApi.js` & `AonlineKioskApi.js` | `/newServiceTicket` emitted `ticket_voided` instead of `new-ticket` and lacked transaction isolation around `MAX(ticketnum) + 1`. `/check_ticket_in` did not emit `new-ticket`. | Wrapped ticket numbering in atomic `db.transaction` and emitted both `new-ticket` and legacy refresh events. |
| **BUG-04** | `backend/routes/AtellerApi.js` | `/tickets/forwarded` generated invalid SQL `WHERE t.status = 'received' AND ()` when both `tellerId` and `groupId` were empty. | Added guard returning `[]` immediately when neither filter is present. |
| **SEC-01** | `AtellerApi.js`, `AadminApi.js`, `security.js` | Plaintext password comparison (`password === teller.cpass` / `admin.password`) despite `bcrypt` being installed. | Implemented `verifyAndUpgradePassword` in `security.js` supporting `bcrypt` hashes and auto-upgrading legacy plaintext passwords on login. |
| **SEC-02** | `server.js` & `security.js` | Hardcoded session secret and missing HTTP security headers. | Added configurable session secret + `securityHeaders` middleware (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`). |

## 2. Windows Caller (`windowsCaller` & `windowsCaller_prevs`) Fixes

| ID | Component | Root Cause | Resolution |
| :- | :--- | :--- | :--- |
| **WC-01** | `MainForm.cs` (`windowsCaller`) | Registered both named `Socket.On(...)` handlers and `Socket.OnAny(...)`, firing `triggerUpdate()` twice per event. | Removed duplicate double-firing and added `Interlocked` concurrency guards + debounce. |
| **WC-02** | `MainForm.cs` (Both) | `CheckCurrentTicket()` did not call `ClearCurrentTicket()` when no active ticket matched `myCounter`. | Added explicit `foundActive` tracking; clears UI when no active ticket is serving at `myCounter`. |
| **WC-03** | `ForwardModal.cs` (Both) | `CmbTargetType_SelectedIndexChanged` hid/showed ComboBoxes but left `lblTeller` ("Select Teller:") visible when "Teller Group" was chosen. | Stored `lblTeller` and `lblGroup` fields and toggled their `.Visible` properties in sync. |
| **WC-04** | `LoginForm.cs` & `.Designer.cs` (Both) | `lblError` was 300px wide at `X=20` inside a 220px form (clipping text off-screen), synchronous `/api/login` froze UI, and `windowsCaller` lacked Remember-Me wiring. | Fixed `lblError` bounds, added async login on background thread, and wired Remember-Me in `windowsCaller`. |
| **WC-05** | `MainForm.cs` (`windowsCaller`) | `OpenForwardModal` used blocking `toast.ShowDialog()` and showed green success text even on failure. | Replaced with non-blocking `ShowToastPopup(msg, isSuccess)` with accurate status color & message. |
| **WC-06** | `MainForm.cs` & `HistoryModal.cs` (Both) | `FlowLayoutPanel.Controls.Clear()` caused heavy GDI+ flicker and leaked undisposed child controls. | Enabled `DoubleBuffered` via reflection and added `ClearPanelSafely(panel)` with `SuspendLayout`/`ResumeLayout` and control disposal. |

