<!-- converted from OpenQ_Teller_Window_User_Manual_v2.docx -->



# Document Information
| Item | Details |
| --- | --- |
| Company | Open'Space Technologies Inc. |
| Document Title | OpenQ Teller Window – User Manual |
| Application | OpenQ Caller App (CallerApp.exe) |
| Platform | Windows XP / 7 / 8 / 10 / 11 (.NET Framework 4.0) |
| Intended Audience | Tellers / Counter Staff |
| Version | 1.0 |
| Date | October 2026 |

# Table of Contents
Right-click here and choose “Update Field” to build the Table of Contents.

# 1. Introduction
The OpenQ Teller Window is a compact desktop application that allows tellers (counter staff) to call, serve, hold, forward, and void queue tickets directly from their workstation. It connects to the central OpenQ server and stays on screen as a small widget so it never gets in the way of your other work.
## 1.1 Key Features
- Call tickets by service (Regular or Priority), from the waiting list, or automatically with Auto Call.
- Real-time queues – Waiting, Held, and Received lists refresh automatically every 3 seconds.
- Ticket actions – Recall, Hold, Resume, Forward, Void, and Complete.
- Forwarding to a specific teller or to a whole teller group, with an optional note.
- Ticket history – review and re-call tickets you have already served.
- Sound alerts for held, received, voided, and successfully forwarded tickets.
- Always-on-top compact window (300 × 325 pixels).
## 1.2 System Requirements
| Requirement | Specification |
| --- | --- |
| Operating System | Windows XP SP3, Windows 7 or later |
| Framework | Microsoft .NET Framework 4.0 or later |
| Network | Connection to the OpenQ server (e.g. http://192.168.1.200:12341) |
| Account | A teller username and password created by the OpenQ administrator |
| Audio (optional) | Speakers or headset for sound alerts |

# 2. Getting Started
## 2.1 Launching the Application
Double-click the OpenQ Caller (CallerApp.exe) shortcut on your desktop or Start menu. The Teller Login window appears.
## 2.2 Configuring the Server Connection (First-Time Setup)
Before logging in for the first time, make sure the application points to the correct OpenQ server.
- On the Login window, click the ⚙ Settings button at the top.
- In the Connection URL field, enter the server address provided by your administrator (for example, http://192.168.1.200:12341).
- Optionally set your display preferences (tooltips, always on top, sound alerts).
- Click Save Changes.

Figure 1 – Settings window before login
| Note: Only the Connection URL, Show Button ToolTips, App Always on Top and Enable Sound Alerts options are available before login. The remaining options appear after you log in. |
| --- |

## 2.3 Logging In
- Enter your Username.
- Enter your Password.
- Tick Remember credentials if you want the application to fill in your details next time.
- Click 🔒 Login. The button shows “Logging in…” while the server is contacted.

Figure 2 – Teller Login window
On success, the main Teller Window opens. The title bar shows your teller name and counter number, e.g. “TELLER 1 – Counter 1”. If login fails, an error message is displayed in red below the Login button – check your credentials and connection URL.
| Security: Do not tick “Remember credentials” on shared computers. |
| --- |


# 3. The Main Teller Window
The main window is divided into four areas. The callouts in the figure below point to each control.

Figure 3 – Main Teller Window (Home tab) – controls labelled
| Area | Description |
| --- | --- |
| Title Bar | Shows the logged-in teller and counter number. |
| Top Toolbar | ⚙ Settings, 📜 History and ⚡ Auto (Auto Call Next) buttons. |
| Queue Tabs | Home, Wait, Held and Recv tabs showing your services and ticket queues. |
| Now Serving Panel | Service name, serving timer, current ticket number (or “Ready”) and the five action buttons. |

## 3.1 Top Toolbar
| Button | Function |
| --- | --- |
| ⚙ Settings | Opens the Settings window (preferences and Logout). |
| 📜 History | Opens the Ticket History window listing tickets served at your counter. |
| ⚡ Auto | Automatically calls the next ticket in line across all of your assigned services. |

## 3.2 Queue Tabs
Each tab shows a live count in brackets and changes colour when it contains tickets, so you can see at a glance where attention is needed.
| Tab | Highlight Colour | Contents |
| --- | --- | --- |
| Home | White | Your assigned services with Regular and Priority call buttons. |
| 🕒 Wait (n) | Light Red / Coral | Tickets waiting to be served for your services. |
| ⏸ Held (n) | Yellow | Tickets you placed on hold. |
| 📩 Recv (n) | Light Blue | Tickets forwarded to you or to your group by another teller. |

## 3.3 Now Serving Panel
The lower part of the window shows the ticket you are currently serving:
- Service – the service name of the current ticket (e.g. EDUCATION).
- Timer – an elapsed-time counter (⏳ mm:ss) showing how long you have been serving the customer.
- Ticket Number – the current ticket number in green (e.g. PE1). When no ticket is active it shows “Ready” in blue.

Figure 4 – Serving ticket PE1 – timer running
## 3.4 Action Buttons
Five colour-coded buttons at the bottom act on the ticket currently being served. Hover over a button to see its tooltip (if tooltips are enabled).
| Position | Button | Action | Description |
| --- | --- | --- | --- |
| 1 | Blue 🔄 | Recall | Calls the current ticket again on the display/announcement system. |
| 2 | Red ⏱✖ | Void | Cancels the current ticket with a reason (e.g. No Show). |
| 3 | Gray ⏩ | Forward | Transfers the current ticket to another teller or group. |
| 4 | Yellow ⏸ | Hold | Parks the current ticket in the Held tab to resume later. |
| 5 | Green ✔ | Complete | Marks the current ticket as finished and clears the panel. |

| Note: Action buttons only work while a ticket is being served. If the panel shows “Ready”, clicking them has no effect. |
| --- |


# 4. Serving Customers
## 4.1 Calling a Ticket from the Home Tab
The Home tab lists every service assigned to your counter. Each row contains:
| Column | Meaning |
| --- | --- |
| Service name | Short name of the service (e.g. EDUCATION). |
| Last called (green) | The last ticket number called for that service. Shows “---” if none yet. |
| Blue button | Number of Regular tickets waiting. Click to call the next Regular ticket. |
| Purple button | Number of Priority tickets waiting (seniors, PWD, pregnant, etc.). Click to call the next Priority ticket. |

- Open the Home tab.
- Find the service row you want to serve.
- Click the blue button (Regular) or purple button (Priority).
- The called ticket appears in the Now Serving panel and the timer starts.
If there are no tickets of the selected type, a message such as “No priority tickets for EDUCATION” is displayed.
## 4.2 Calling a Specific Ticket from the Wait Tab
The Wait tab shows each waiting ticket with its number, service, and time issued. Tickets are ordered with received tickets first, then priority tickets, then by arrival order.

Figure 5 – Wait tab – list of waiting tickets
- Open the 🕒 Wait tab.
- Locate the ticket you want to serve (scroll if necessary).
- Click 📢 Call on that ticket.
| Card Colour | Meaning |
| --- | --- |
| Light red | Priority ticket |
| Light blue | Ticket received/forwarded from another teller (shown when “Mix Received Tickets” is on) |
| Light gray | Regular ticket |

## 4.3 Auto Call Next
Click ⚡ Auto on the top toolbar to let the system pick the next ticket for you based on queue order across all of your services. If “Mix Received Tickets into Waiting List” is enabled in Settings, forwarded tickets are included in the auto selection.
## 4.4 Recalling a Ticket
If the customer did not respond, click the blue 🔄 Recall button to announce the current ticket again.
## 4.5 Completing a Ticket
When you finish serving the customer, click the green ✔ Complete button. The panel returns to “Ready” and the timer resets to 00:00.
| Important: You must complete, hold, forward, or void the current ticket before calling another one. Otherwise the message “Please complete or hold current ticket first.” appears – unless “Auto-Complete Ticket on Call Next” is enabled in Settings. |
| --- |

# 5. Holding and Resuming Tickets
Use Hold when a customer needs to step away briefly (e.g. to complete a form or get a document).
## 5.1 Placing a Ticket on Hold
- While serving the ticket, click the yellow ⏸ Hold button.
- A sound alert plays (if enabled), the panel returns to “Ready”, and the ticket moves to the Held tab.
## 5.2 Resuming a Held Ticket

Figure 6 – Held tab – ticket PE2 on hold
- Open the ⏸ Held tab (highlighted yellow when it contains tickets).
- Click ▶ Res (Resume) on the ticket.
- The ticket returns to the Now Serving panel.
You can also click the gray ➡ Fwd button on a held ticket to forward it without resuming it first.

# 6. Forwarding Tickets
Forward a ticket when the customer needs to be served by another teller or department.
## 6.1 How to Forward
You can open the Forward Ticket window from:
- the gray ⏩ Forward action button (forwards the current ticket);
- the ➡ Fwd button on a ticket in the Held or Recv tab;
- the ➡ Fwd button in the Ticket History window.
- Open the Forward Ticket window.
- In Forward To, choose Specific Teller or Teller Group.
- Select the teller (shown as “Name (Counter n)” – only tellers active today are listed) or the group.
- Optionally type a Note for the receiving teller.
- Click ➡ Forward.

Figure 7 – Forward Ticket – choosing the target type

Figure 8 – Forward Ticket – selecting a Teller Group
A green “Ticket forwarded successfully” message appears for 3 seconds. If you forwarded the ticket you were serving, the panel returns to “Ready”.
| Note: If you click Forward without choosing a teller or group, the warning “Please select a teller or group.” is shown. |
| --- |

## 6.2 Receiving Forwarded Tickets
Tickets forwarded to you, or to your group, appear in the 📩 Recv tab, which turns light blue. A “received” sound alert plays when a new ticket arrives.

Figure 9 – Recv tab – ticket forwarded from another teller
- Open the 📩 Recv tab.
- Click the purple 📢 Call button to serve the ticket, or ➡ Fwd to pass it on to someone else.
# 7. Voiding Tickets
Void a ticket when it cannot be served – for example, the customer did not show up.
- While the ticket is in the Now Serving panel, click the red Void button.
- Select a Reason from the list.
- Optionally add Notes.
- Click ❌ Void Ticket to confirm, or Cancel to go back.

Figure 10 – Void Ticket – selecting a reason
| Reason | When to Use |
| --- | --- |
| No Show | Customer did not respond after being called/recalled. |
| Incomplete | Customer lacks the required documents or requirements. |
| Customer Cancelled | Customer decided not to proceed with the transaction. |
| Wrong Service | Customer took a ticket for the wrong service. |
| Other | Any other reason – please explain in the Notes field. |

| Caution: Voiding cannot be undone from the Teller Window. |
| --- |

# 8. Ticket History
Click 📜 History on the top toolbar to view tickets handled at your counter. Each entry shows the ticket number, service, status (e.g. FINISHED, VOIDED, HELD) and time.
- 📢 Call – Re-calls the ticket to your counter (e.g. a customer returns with missing documents).
- ➡ Fwd – Opens the Forward Ticket window for that ticket.
- 🔄 Refresh – Reloads the history list.

# 9. Settings
Click ⚙ Settings on the top toolbar to open the Settings window.

Figure 11 – Settings window (logged in)
| Option | Description | Default |
| --- | --- | --- |
| Connection URL | Address of the OpenQ server. Cannot be empty. | Set by admin |
| Auto-Complete Ticket on Call Next | When calling a new ticket while one is active, the current ticket is automatically completed first. | Off |
| Mix Received Tickets into Waiting List | Forwarded tickets also appear in the Wait tab (highlighted light blue, listed first) and are included in Auto Call. | Off |
| Show Button ToolTips on Hover | Shows a short label when you hover over a button. | On |
| App Always on Top | Keeps the Teller Window above all other windows. | Off |
| Enable Sound Alerts | Plays sounds for hold, received, void, and forward events. | On |

Click ✅ Save Changes to apply, or Cancel to discard changes.
## 9.1 Sound Alerts
| Event | Sound |
| --- | --- |
| Ticket placed on hold | Hold chime |
| New ticket received in Recv tab | Received alert |
| Ticket voided | Void tone |
| Ticket forwarded successfully | Success chime |

# 10. Logging Out
- Click ⚙ Settings.
- Click the red 🚪 Logout button.
- Click Yes to confirm. The application restarts and returns to the Login window.
| Note: Always log out at the end of your shift or when leaving the counter so tickets are not routed to you. |
| --- |

# 11. Typical Daily Workflow
- Launch the application and log in.
- Call a ticket (Home tab, Wait tab, or ⚡ Auto).
- Serve the customer. Use 🔄 Recall if the customer does not respond.
- Finish with one of: ✔ Complete, ⏸ Hold, ⏩ Forward, or Void.
- Periodically check the Held (yellow) and Recv (light blue) tabs.
- Repeat until the end of your shift, then log out.
# 12. Troubleshooting
| Problem | Possible Cause / Solution |
| --- | --- |
| “Login failed” or no response at login | Check your username/password. Verify the Connection URL in Settings and that the PC is connected to the network. |
| Queues are empty or not updating | The server may be unreachable. Check the network cable/Wi-Fi and the Connection URL. Queues refresh every 3 seconds. |
| “Please complete or hold current ticket first.” | A ticket is still active. Complete, hold, forward, or void it first – or enable Auto-Complete in Settings. |
| “No regular/priority tickets for <service>” | There are no tickets of that type waiting for the selected service. |
| “No tickets available” when using Auto | No tickets are waiting for any of your assigned services. |
| Teller not listed in Forward window | Only tellers who are active (logged in) today are listed. Forward to the Teller Group instead. |
| No sound alerts | Make sure Enable Sound Alerts is ticked and the PC volume is not muted. |
| Window hidden behind other programs | Enable App Always on Top in Settings. |

# Appendix A – Quick Reference Card
| To… | Do this |
| --- | --- |
| Call next Regular ticket | Home tab → blue button on the service row |
| Call next Priority ticket | Home tab → purple button on the service row |
| Call a specific ticket | Wait tab → 📢 Call |
| Call automatically | ⚡ Auto |
| Re-announce current ticket | 🔄 Recall (blue) |
| Finish current ticket | ✔ Complete (green) |
| Put ticket on hold | ⏸ Hold (yellow) |
| Resume a held ticket | Held tab → ▶ Res |
| Transfer a ticket | ⏩ Forward (gray) or ➡ Fwd |
| Serve a forwarded ticket | Recv tab → 📢 Call |
| Cancel a ticket | Void (red) → choose reason → ❌ Void Ticket |
| View served tickets | 📜 History |
| Log out | ⚙ Settings → 🚪 Logout → Yes |
