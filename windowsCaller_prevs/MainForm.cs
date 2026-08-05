    using System;
using System.Drawing;
using System.Windows.Forms;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading;

namespace CallerApp
{
    public partial class MainForm : Form
    {
        private DateTime? currentTicketStartTime = null;
        private Dictionary<string, object> currentTicket = null;
        private object[] catalogServicesList = null;

        private System.Windows.Forms.Timer fallbackTimer;
        private System.Web.Script.Serialization.JavaScriptSerializer jsSerializer = new System.Web.Script.Serialization.JavaScriptSerializer();
        private string lastWaitingJson = "";
        private string lastHeldJson = "";
        private string lastForwardedJson = "";

        public ToolTip appToolTip = new ToolTip();

        public MainForm()
        {
            InitializeComponent();
        }

        private void BtnRecall_Click(object sender, EventArgs e) { RecallTicket(); }
        private void BtnHold_Click(object sender, EventArgs e) { HoldTicket(); }
        private void BtnForward_Click(object sender, EventArgs e) { OpenForwardModal(); }
        private void BtnVoid_Click(object sender, EventArgs e) { OpenVoidModal(); }
        private void BtnComplete_Click(object sender, EventArgs e) { CompleteTicket(); }
        private void BtnAutoCall_Click(object sender, EventArgs e)
        {
            CallNext("auto");
        }  private Button CreateModernButton(string text, int x, int y, int w, int h, Color bg, Color fg)
        {
            Button b = new Button();
            b.Text = text;
            b.Location = new Point(x, y);
            b.Size = new Size(w, h);
            b.BackColor = bg;
            b.ForeColor = fg;
            b.Font = new Font("Segoe UI", 9, FontStyle.Bold);
            b.FlatStyle = FlatStyle.Flat;
            b.FlatAppearance.BorderSize = 0;
            b.Cursor = Cursors.Hand;
            return b;
        }

        private void MainForm_Load(object sender, EventArgs e)
        {
            if (ApiClient.CurrentTeller != null)
            {
                this.Text = string.Format("{0} - Counter {1}", ApiClient.CurrentTeller["username"], ApiClient.CurrentTeller["counter_number"]);
            }

            appToolTip.Active = AppSettings.ShowTooltips;
            appToolTip.SetToolTip(btnRecall, "Recall Ticket");
            appToolTip.SetToolTip(btnHold, "Hold Ticket");
            appToolTip.SetToolTip(btnForward, "Forward Ticket");
            appToolTip.SetToolTip(btnVoid, "Void Ticket");
            appToolTip.SetToolTip(btnComplete, "Complete Ticket");
            if (btnAutoCall != null) appToolTip.SetToolTip(btnAutoCall, "Auto Call Next");

            ApplyTabSettings();
            LoadCatalogServices();

            // Force initial load immediately on the UI thread
            this.BeginInvoke(new Action(() => {
                ThreadPool.QueueUserWorkItem(state => {
                    FetchQueues();
                });
            }));
            
            CheckCurrentTicket();

            // Setup a 5-second fallback polling timer
            fallbackTimer = new System.Windows.Forms.Timer();
            fallbackTimer.Interval = 3000;
            fallbackTimer.Tick += (s, ev) => {
                ThreadPool.QueueUserWorkItem(state => { FetchQueues(); });
                CheckCurrentTicket();
            };
            fallbackTimer.Start();
        }

        private void MainForm_FormClosing(object sender, FormClosingEventArgs e)
        {
            if (fallbackTimer != null)
            {
                fallbackTimer.Stop();
                fallbackTimer.Dispose();
            }

            durationTimer.Stop();
        }

        private void BtnLogout_Click(object sender, EventArgs e)
        {
            if (MessageBox.Show("Logout?", "Confirm", MessageBoxButtons.YesNo, MessageBoxIcon.Question) == DialogResult.Yes)
            {
                ApiClient.Post("/api/logout", new { });
                Application.Restart();
            }
        }

        private void BtnSettings_Click(object sender, EventArgs e)
        {
            using (SettingsModal sm = new SettingsModal())
            {
                if (sm.ShowDialog() == DialogResult.OK)
                {
                    ApplyTabSettings();
                    appToolTip.Active = AppSettings.ShowTooltips;
                    FetchQueues();
                    
                    if (sm.ShowHistoryClicked)
                    {
                        var histParams = new Dictionary<string, string> { { "counterNumber", ApiClient.CurrentTeller["counter_number"].ToString() }, { "cname", ApiClient.CurrentTeller["username"].ToString() } };
                        object[] historyTickets = ApiClient.GetArray("/api/tickets/history", histParams);
                        
                        HistoryModal hm = new HistoryModal(historyTickets, CallSpecificTicket, OpenForwardModal);
                        hm.Show();
                    }
                }
            }
        }

        private void ApplyTabSettings()
        {
            // The user requested to ALWAYS display the Recv tab, regardless of settings.
            if (!tabs.TabPages.Contains(tabRecv)) 
            {
                tabs.TabPages.Add(tabRecv);
            }
        }

        // --- DATA LOADING ---

        private void LoadCatalogServices()
        {
            ThreadPool.QueueUserWorkItem(delegate(object state)
            {
                var response = ApiClient.Get<Dictionary<string, object>>("/api/services");
                if (response != null && response.ContainsKey("data") && response["data"] is System.Collections.ArrayList)
                {
                    catalogServicesList = ((System.Collections.ArrayList)response["data"]).ToArray();
                }
                this.BeginInvoke(new Action(() => CreateServiceBoxes()));
            });
        }

        private Dictionary<string, Button[]> serviceButtons = new Dictionary<string, Button[]>();

        private void CreateServiceBoxes()
        {
            if (ApiClient.CurrentTeller == null || !ApiClient.CurrentTeller.ContainsKey("services")) return;
            string[] services = ApiClient.CurrentTeller["services"].ToString().Split(',');

            pnlServicesList.Controls.Clear();
            serviceButtons.Clear();

            foreach (string rawSrv in services)
            {
                string srv = rawSrv.Trim();
                if (string.IsNullOrEmpty(srv)) continue;

                string displaySrv = srv;
                if (catalogServicesList != null)
                {
                    foreach (Dictionary<string, object> cat in catalogServicesList)
                    {
                        if (cat.ContainsKey("sname") && cat["sname"].ToString().Equals(srv, StringComparison.InvariantCultureIgnoreCase))
                        {
                            if (cat.ContainsKey("shortSname") && cat["shortSname"] != null && !string.IsNullOrEmpty(cat["shortSname"].ToString()))
                            {
                                displaySrv = cat["shortSname"].ToString();
                            }
                            break;
                        }
                    }
                }
                displaySrv = displaySrv.Replace("_", " ");

                Panel pRow = new Panel() { Width = 215, Height = 34, Margin = new Padding(2) };
                
                Label lblName = new Label() { 
                    Text = displaySrv, 
                    Font = new Font("Segoe UI", 7.5f, FontStyle.Bold), 
                    Location = new Point(2, 2), 
                    Size = new Size(126, 30),
                    AutoSize = false,
                    TextAlign = ContentAlignment.MiddleLeft,
                    ForeColor = Color.DimGray 
                };
                
                Button btnReg = CreateModernButton("0", 130, 4, 35, 26, Color.FromArgb(52, 152, 219), Color.White);
                btnReg.Font = new Font("Segoe UI", 8, FontStyle.Bold);
                btnReg.Click += (s, e) => CallNext("regular", srv);

                Button btnPri = CreateModernButton("0", 170, 4, 35, 26, Color.FromArgb(155, 89, 182), Color.White);
                btnPri.Font = new Font("Segoe UI", 8, FontStyle.Bold);
                btnPri.Click += (s, e) => CallNext("priority", srv);
                
                appToolTip.SetToolTip(btnReg, "Regular");
                appToolTip.SetToolTip(btnPri, "Priority");

                pRow.Controls.Add(lblName);
                pRow.Controls.Add(btnReg);
                pRow.Controls.Add(btnPri);

                pnlServicesList.Controls.Add(pRow);
                
                serviceButtons[srv] = new Button[] { btnReg, btnPri };
            }
        }

        private void UpdateServiceCounts(object[] tickets)
        {
            Dictionary<string, int> regCounts = new Dictionary<string, int>();
            Dictionary<string, int> priCounts = new Dictionary<string, int>();

            if (tickets != null)
            {
                foreach (Dictionary<string, object> t in tickets)
                {
                    string sname = t.ContainsKey("sname") ? t["sname"].ToString().Replace("_", " ") : "";
                    if (string.IsNullOrEmpty(sname) && t.ContainsKey("ticketservice")) 
                        sname = t["ticketservice"].ToString();
                    
                    int priority = 0;
                    if (t.ContainsKey("priority"))
                        priority = Convert.ToInt32(t["priority"]);

                    if (priority == 1)
                    {
                        if (!priCounts.ContainsKey(sname)) priCounts[sname] = 0;
                        priCounts[sname]++;
                    }
                    else
                    {
                        if (!regCounts.ContainsKey(sname)) regCounts[sname] = 0;
                        regCounts[sname]++;
                    }
                }
            }

            foreach (var kvp in serviceButtons)
            {
                string srv = kvp.Key;
                int rCount = 0;
                int pCount = 0;
                
                // Try matching exact or prefix (since sometimes service strings differ)
                foreach(var rK in regCounts.Keys) {
                    if (rK.Equals(srv, StringComparison.InvariantCultureIgnoreCase) || srv.Equals(rK, StringComparison.InvariantCultureIgnoreCase) || rK.StartsWith(srv)) {
                        rCount += regCounts[rK];
                    }
                }
                foreach(var pK in priCounts.Keys) {
                    if (pK.Equals(srv, StringComparison.InvariantCultureIgnoreCase) || srv.Equals(pK, StringComparison.InvariantCultureIgnoreCase) || pK.StartsWith(srv)) {
                        pCount += priCounts[pK];
                    }
                }

                kvp.Value[0].Text = rCount.ToString();
                kvp.Value[1].Text = pCount.ToString();
            }
        }

        private void FetchQueues()
        {
            if (ApiClient.CurrentTeller == null) return;

            string services = ApiClient.CurrentTeller["services"].ToString();
            string tellerId = ApiClient.CurrentTeller["id"].ToString();
            string groupId = ApiClient.CurrentTeller.ContainsKey("group_id") ? ApiClient.CurrentTeller["group_id"].ToString() : "";

            var waitingParams = new Dictionary<string, string> { { "services", services }, { "tellerId", tellerId }, { "groupId", groupId } };
            object[] waitingTickets = ApiClient.GetArray("/api/tickets/waiting", waitingParams);

            var heldParams = new Dictionary<string, string> { { "tellerId", ApiClient.CurrentTeller["counter_number"].ToString() } };
            object[] heldTickets = ApiClient.GetArray("/api/tickets/held", heldParams);

            var forwardParams = new Dictionary<string, string> { { "tellerId", tellerId }, { "groupId", groupId } };
            object[] forwardedTickets = ApiClient.GetArray("/api/tickets/forwarded", forwardParams);

            if (this.IsHandleCreated && !this.IsDisposed)
            {
                this.BeginInvoke(new Action(() =>
                {
                    try
                    {
                        if (AppSettings.ShowReceivedInWaiting)
                        {
                            var merged = new List<object>();
                            if (forwardedTickets != null) merged.AddRange(forwardedTickets);
                            if (waitingTickets != null) merged.AddRange(waitingTickets);
                            
                            var uniqueMerged = merged
                                .Select(t => (Dictionary<string, object>)t)
                                .GroupBy(t => t.ContainsKey("id") ? t["id"].ToString() : Guid.NewGuid().ToString())
                                .Select(g => g.First())
                                .Cast<object>()
                                .ToArray();

                            UpdateWaitingQueue(uniqueMerged);
                        }
                        else
                        {
                            var pureWaiting = waitingTickets != null ? waitingTickets.Where(t => {
                                var dict = (Dictionary<string, object>)t;
                                string stat = dict.ContainsKey("status") ? dict["status"].ToString() : "";
                                return stat != "received" && stat != "forwarded";
                            }).ToArray() : null;
                            UpdateWaitingQueue(pureWaiting);
                        }
                        
                        // Always update the Forwarded (Recv) queue so the tab is populated
                        UpdateForwardedQueue(forwardedTickets);

                        UpdateHeldQueue(heldTickets);
                        UpdateServiceCounts(waitingTickets);
                    }
                    catch (Exception ex)
                    {
                        MessageBox.Show("Error in FetchQueues UI update:\n" + ex.ToString());
                    }
                }));
            }
        }

        private void UpdateWaitingQueue(object[] tickets)
        {
            string newJson = tickets != null ? jsSerializer.Serialize(tickets) : "";
            if (newJson == lastWaitingJson) return;
            lastWaitingJson = newJson;

            pnlWaitingList.Controls.Clear();
            int count = 0;
            if (tickets != null)
            {
                var sortedTickets = tickets
                    .Select(t => (Dictionary<string, object>)t)
                    .OrderByDescending(t => t.ContainsKey("status") && t["status"].ToString() == "received" ? 1 : 0)
                    .ThenByDescending(t => t.ContainsKey("priority") && Convert.ToInt32(t["priority"]) == 1 ? 1 : 0)
                    .ThenByDescending(t => t.ContainsKey("id") ? Convert.ToInt64(t["id"]) : 0)
                    .ToList();

                foreach (var t in sortedTickets)
                {
                    count++;
                    Panel pItem = CreateQueueItem(t, "📢 Call", Color.FromArgb(52, 152, 219), (s, e) => CallSpecificTicket(t["id"].ToString()));
                    pnlWaitingList.Controls.Add(pItem);
                }
            }
            tabWait.Text = string.Format("🕒 Wait ({0})", count);
        }

        private void UpdateHeldQueue(object[] tickets)
        {
            string newJson = tickets != null ? jsSerializer.Serialize(tickets) : "";
            if (newJson == lastHeldJson) return;
            lastHeldJson = newJson;

            pnlHeldList.Controls.Clear();
            int count = 0;
            if (tickets != null)
            {
                var sortedTickets = tickets.Select(t => (Dictionary<string, object>)t).OrderByDescending(t => t.ContainsKey("id") ? Convert.ToInt64(t["id"]) : 0).ToList();
                foreach (var t in sortedTickets)
                {
                    count++;
                    Panel pItem = CreateQueueItem(t, 
                        "▶ Res", Color.FromArgb(46, 204, 113), (s, e) => ResumeHeldTicket(t["id"].ToString()),
                        "➡️ Fwd", Color.FromArgb(149, 165, 166), (s, e) => OpenForwardModal(t["id"].ToString()));
                    pnlHeldList.Controls.Add(pItem);
                }
            }
            tabHeld.Text = string.Format("⏸ Held ({0})", count);
        }

        private void UpdateForwardedQueue(object[] tickets)
        {
            string newJson = tickets != null ? jsSerializer.Serialize(tickets) : "";
            if (newJson == lastForwardedJson) return;
            lastForwardedJson = newJson;

            pnlForwardedList.Controls.Clear();
            int count = 0;
            if (tickets != null)
            {
                var sortedTickets = tickets.Select(t => (Dictionary<string, object>)t).OrderByDescending(t => t.ContainsKey("id") ? Convert.ToInt64(t["id"]) : 0).ToList();
                foreach (var t in sortedTickets)
                {
                    count++;
                    Panel pItem = CreateQueueItem(t, 
                        "📢 Call", Color.FromArgb(155, 89, 182), (s, e) => CallSpecificTicket(t["id"].ToString()),
                        "➡️ Fwd", Color.FromArgb(149, 165, 166), (s, e) => OpenForwardModal(t["id"].ToString()));
                    pnlForwardedList.Controls.Add(pItem);
                }
            }
            tabRecv.Text = string.Format("📩 Recv ({0})", count);
        }

        private Panel CreateQueueItem(Dictionary<string, object> t, 
            string btn1Text, Color btn1Color, EventHandler onBtn1Click,
            string btn2Text = null, Color? btn2Color = null, EventHandler onBtn2Click = null)
        {
            Color bgColor = Color.WhiteSmoke;
            if (t.ContainsKey("status") && t["status"].ToString() == "received")
            {
                bgColor = Color.FromArgb(214, 234, 248); // Light Blue
            }
            else if (t.ContainsKey("priority") && Convert.ToInt32(t["priority"]) == 1)
            {
                bgColor = Color.FromArgb(250, 219, 216); // Light Red
            }

            Panel p = new Panel() { Width = 215, Height = 38, BorderStyle = BorderStyle.FixedSingle, Margin = new Padding(2), BackColor = bgColor };
            
            string tNum = t.ContainsKey("ticketservice") ? string.Format("{0}{1}", t["ticketservice"], t["ticketnum"]) : t["ticketnum"].ToString();
            string sName = t.ContainsKey("sname") ? t["sname"].ToString().Replace("_", " ") : "";
            if (string.IsNullOrEmpty(sName) && t.ContainsKey("status")) sName = t["status"].ToString();
            
            Label lblNum = new Label() { Text = tNum, Font = new Font("Segoe UI", 9, FontStyle.Bold), Location = new Point(2, 3), AutoSize = true, ForeColor = Color.FromArgb(40,40,40) };
            Label lblSvc = new Label() { Text = sName, Location = new Point(2, 19), AutoSize = true, Font = new Font("Segoe UI", 7), ForeColor = Color.DimGray };

            if (!string.IsNullOrEmpty(btn2Text) && btn2Color.HasValue)
            {
                Button btn1 = CreateModernButton(btn1Text, 110, 5, 45, 26, btn1Color, Color.White);
                btn1.Font = new Font("Segoe UI", 6.5f, FontStyle.Bold);
                btn1.Click += onBtn1Click;
                
                Button btn2 = CreateModernButton(btn2Text, 160, 5, 45, 26, btn2Color.Value, Color.White);
                btn2.Font = new Font("Segoe UI", 6.5f, FontStyle.Bold);
                btn2.Click += onBtn2Click;
                
                appToolTip.SetToolTip(btn1, btn1Text.Replace("📢 ", "").Replace("▶ ", "").Replace("➡️ ", ""));
                appToolTip.SetToolTip(btn2, btn2Text.Replace("📢 ", "").Replace("▶ ", "").Replace("➡️ ", ""));

                p.Controls.Add(btn1);
                p.Controls.Add(btn2);
            }
            else
            {
                Button btn1 = CreateModernButton(btn1Text, 135, 5, 70, 26, btn1Color, Color.White);
                btn1.Font = new Font("Segoe UI", 7, FontStyle.Bold);
                btn1.Click += onBtn1Click;
                appToolTip.SetToolTip(btn1, btn1Text.Replace("📢 ", "").Replace("▶ ", "").Replace("➡️ ", ""));
                p.Controls.Add(btn1);
            }

            p.Controls.Add(lblNum);
            p.Controls.Add(lblSvc);
            return p;
        }

        // --- ACTIONS ---

        private void CheckCurrentTicket()
        {
            ThreadPool.QueueUserWorkItem(delegate(object state)
            {
                object[] tickets = ApiClient.GetArray("/api/tickets/called");
                if (tickets != null)
                {
                    string myCounter = ApiClient.CurrentTeller["counter_number"].ToString();
                    foreach (Dictionary<string, object> t in tickets)
                    {
                        if (t.ContainsKey("counter_num") && t["counter_num"].ToString() == myCounter)
                        {
                            string status = t["status"].ToString();
                            if (status != "held" && status != "received" && status != "voided" && status != "finished")
                            {
                                if (this.IsHandleCreated && !this.IsDisposed)
                                {
                                    this.BeginInvoke(new Action(() => {
                                        try { DisplayCurrentTicket(t); } 
                                        catch (Exception ex) { MessageBox.Show("Error in CheckCurrentTicket UI update:\n" + ex.ToString()); }
                                    }));
                                }
                                return;
                            }
                        }
                    }
                }
            });
        }

        private void DisplayCurrentTicket(Dictionary<string, object> ticket)
        {
            currentTicket = ticket;
            string tNum = ticket.ContainsKey("ticketservice") ? string.Format("{0}{1}", ticket["ticketservice"], ticket["ticketnum"]) : ticket["ticketnum"].ToString();
            lblCurrentTicket.Text = tNum;
            lblCurrentTicket.ForeColor = Color.FromArgb(39, 174, 96); // Green when active

            string sname = ticket.ContainsKey("shortSname") && ticket["shortSname"] != null && !string.IsNullOrEmpty(ticket["shortSname"].ToString())
                           ? ticket["shortSname"].ToString().Replace("_", " ") 
                           : (ticket.ContainsKey("sname") ? ticket["sname"].ToString().Replace("_", " ") : "");
            lblShortSname.Text = sname;

            if (ticket.ContainsKey("start_time") && ticket["start_time"] != null && ticket.ContainsKey("date") && ticket["date"] != null)
            {
                DateTime dt;
                if (DateTime.TryParse(string.Format("{0} {1}", ticket["date"], ticket["start_time"]), out dt))
                {
                    currentTicketStartTime = dt;
                    durationTimer.Start();
                }
            }
        }

        private void ClearCurrentTicket()
        {
            currentTicket = null;
            lblCurrentTicket.Text = "Ready";
            lblCurrentTicket.ForeColor = Color.FromArgb(41, 128, 185);
            lblShortSname.Text = "";
            durationTimer.Stop();
            lblDuration.Text = "00:00";
            currentTicketStartTime = null;
        }

        private void DurationTimer_Tick(object sender, EventArgs e)
        {
            if (currentTicketStartTime.HasValue)
            {
                TimeSpan diff = DateTime.Now - currentTicketStartTime.Value;
                if (diff.TotalSeconds < 0) diff = TimeSpan.Zero;
                lblDuration.Text = string.Format("⏳ {0:D2}:{1:D2}", (int)Math.Floor(diff.TotalMinutes), diff.Seconds);
            }
        }

        private void AutoCompleteActiveTicketSynchronous()
        {
            if (currentTicket == null) return;
            var reqData = new { ticketId = currentTicket["id"], cname = ApiClient.CurrentTeller["username"], cnum = ApiClient.CurrentTeller["counter_number"] };
            ApiClient.Post("/api/tickets/complete", reqData);
        }

        private void CallNext(string type, string service = null)
        {
            if (currentTicket != null)
            {
                if (AppSettings.AutoFinishEnabled)
                {
                    // Will auto complete when executed
                }
                else
                {
                    MessageBox.Show("Please complete or hold current ticket first.", "Info", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    return;
                }
            }

            var reqData = new Dictionary<string, object>
            {
                { "tellerId", ApiClient.CurrentTeller["id"] },
                { "counterNumber", ApiClient.CurrentTeller["counter_number"] },
                { "counter_group", ApiClient.CurrentTeller.ContainsKey("group_name") ? ApiClient.CurrentTeller["group_name"] : "" },
                { "counter_user", ApiClient.CurrentTeller["username"] }
            };

            if (type == "auto")
            {
                reqData.Add("mode", "auto");
                ExecuteCall(reqData);
            }
            else
            {
                if (string.IsNullOrEmpty(service))
                {
                    MessageBox.Show("Please select a service first.", "Info", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    return;
                }

                ThreadPool.QueueUserWorkItem(delegate(object state)
                {
                    var p = new Dictionary<string, string> { { "services", service } };
                    object[] wTickets = ApiClient.GetArray("/api/tickets/waiting", p);
                    if (wTickets != null)
                    {
                        int priorityTarget = type == "priority" ? 1 : 0;
                        string targetId = null;
                        foreach (Dictionary<string, object> t in wTickets)
                        {
                            if (t.ContainsKey("priority") && Convert.ToInt32(t["priority"]) == priorityTarget)
                            {
                                targetId = t["id"].ToString();
                                break;
                            }
                        }

                        if (targetId != null)
                        {
                            this.BeginInvoke(new Action(() => CallSpecificTicket(targetId)));
                        }
                        else
                        {
                            this.BeginInvoke(new Action(() => MessageBox.Show(string.Format("No {0} tickets for {1}", type, service), "Info", MessageBoxButtons.OK, MessageBoxIcon.Information)));
                        }
                    }
                });
            }
        }

        private void CallSpecificTicket(string ticketId)
        {
            if (currentTicket != null && currentTicket["id"].ToString() == ticketId) return;

            if (currentTicket != null && !AppSettings.AutoFinishEnabled)
            {
                MessageBox.Show("Please complete or hold current ticket first.", "Info", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }

            var reqData = new Dictionary<string, object>
            {
                { "ticketId", ticketId },
                { "tellerId", ApiClient.CurrentTeller["id"] },
                { "counterNumber", ApiClient.CurrentTeller["counter_number"] },
                { "counter_group", ApiClient.CurrentTeller.ContainsKey("group_name") ? ApiClient.CurrentTeller["group_name"] : "" },
                { "counter_user", ApiClient.CurrentTeller["username"] }
            };
            ExecuteCall(reqData);
        }

        private void ExecuteCall(object reqData)
        {
            ThreadPool.QueueUserWorkItem(delegate(object state)
            {
                // Auto finish sync if enabled
                if (AppSettings.AutoFinishEnabled && currentTicket != null)
                {
                    AutoCompleteActiveTicketSynchronous();
                    this.BeginInvoke(new Action(() => { ClearCurrentTicket(); }));
                }

                var response = ApiClient.Post("/api/tickets/call", reqData);
                this.BeginInvoke(new Action(() =>
                {
                    if (response != null && response.ContainsKey("success") && (bool)response["success"])
                    {
                        DisplayCurrentTicket((Dictionary<string, object>)response["ticket"]);
                        FetchQueues();
                    }
                    else
                    {
                        string msg = response != null && response.ContainsKey("message") ? response["message"].ToString() : "No tickets available";
                        MessageBox.Show(msg, "Info", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    }
                }));
            });
        }

        private void RecallTicket()
        {
            if (currentTicket == null) return;
            var reqData = new { ticketId = currentTicket["id"], cname = ApiClient.CurrentTeller["username"], cnum = ApiClient.CurrentTeller["counter_number"] };
            ThreadPool.QueueUserWorkItem(delegate(object state) { ApiClient.Post("/api/tickets/recall", reqData); });
        }

        private void CompleteTicket()
        {
            if (currentTicket == null) return;
            var reqData = new { ticketId = currentTicket["id"], cname = ApiClient.CurrentTeller["username"], cnum = ApiClient.CurrentTeller["counter_number"] };
            ThreadPool.QueueUserWorkItem(delegate(object state)
            {
                ApiClient.Post("/api/tickets/complete", reqData);
                this.BeginInvoke(new Action(() =>
                {
                    ClearCurrentTicket();
                    FetchQueues();
                }));
            });
        }

        private void HoldTicket()
        {
            if (currentTicket == null) return;
            var reqData = new { ticketId = currentTicket["id"], cname = ApiClient.CurrentTeller["username"], cnum = ApiClient.CurrentTeller["counter_number"] };
            ThreadPool.QueueUserWorkItem(delegate(object state)
            {
                ApiClient.Post("/api/tickets/hold", reqData);
                this.BeginInvoke(new Action(() =>
                {
                    ClearCurrentTicket();
                    FetchQueues();
                }));
            });
        }

        private void ResumeHeldTicket(string ticketId)
        {
            if (currentTicket != null && !AppSettings.AutoFinishEnabled)
            {
                MessageBox.Show("Please complete or hold current ticket first.", "Info", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }

            var reqData = new Dictionary<string, object>
            {
                { "ticketId", ticketId },
                { "tellerId", ApiClient.CurrentTeller["id"] },
                { "counterNumber", ApiClient.CurrentTeller["counter_number"] },
                { "counter_group", ApiClient.CurrentTeller.ContainsKey("group_name") ? ApiClient.CurrentTeller["group_name"] : "" },
                { "counter_user", ApiClient.CurrentTeller["username"] }
            };

            ThreadPool.QueueUserWorkItem(delegate(object state)
            {
                if (AppSettings.AutoFinishEnabled && currentTicket != null)
                {
                    AutoCompleteActiveTicketSynchronous();
                    this.BeginInvoke(new Action(() => { ClearCurrentTicket(); }));
                }

                var response = ApiClient.Post("/api/tickets/resume", reqData);
                this.BeginInvoke(new Action(() =>
                {
                    if (response != null && response.ContainsKey("success") && (bool)response["success"])
                    {
                        DisplayCurrentTicket((Dictionary<string, object>)response["ticket"]);
                        FetchQueues();
                    }
                }));
            });
        }

        private void OpenForwardModal(string specificTicketId = null)
        {
            string targetTicketId = specificTicketId != null ? specificTicketId : (currentTicket != null ? currentTicket["id"].ToString() : null);
            if (targetTicketId == null) return;
            
            object[] tellers = ApiClient.GetArray("/api/tellers/list", new Dictionary<string, string> { { "id", ApiClient.CurrentTeller["id"].ToString() } });
            
            // Extract unique groups from the tellers list since /api/admin/groups is restricted
            var uniqueGroups = new Dictionary<string, Dictionary<string, object>>();
            if (tellers != null)
            {
                foreach (Dictionary<string, object> t in tellers)
                {
                    if (t.ContainsKey("group_id") && t["group_id"] != null && !string.IsNullOrEmpty(t["group_id"].ToString()) &&
                        t.ContainsKey("group_name") && t["group_name"] != null && !string.IsNullOrEmpty(t["group_name"].ToString()))
                    {
                        string gId = t["group_id"].ToString();
                        if (!uniqueGroups.ContainsKey(gId))
                        {
                            var g = new Dictionary<string, object>();
                            g["id"] = gId;
                            g["group_name"] = t["group_name"];
                            uniqueGroups[gId] = g;
                        }
                    }
                }
            }
            object[] groups = new List<Dictionary<string, object>>(uniqueGroups.Values).ToArray();

            using (ForwardModal fm = new ForwardModal(tellers, groups))
            {
                if (fm.ShowDialog() == DialogResult.OK)
                {
                    var reqData = new Dictionary<string, object>
                    {
                        { "ticketId", targetTicketId },
                        { "fromTellerId", ApiClient.CurrentTeller["id"] },
                        { "toTellerId", fm.SelectedTargetType == "teller" ? fm.SelectedTellerId : null },
                        { "toGroupId", fm.SelectedTargetType == "group" ? fm.SelectedGroupId : null },
                        { "note", fm.Note },
                        { "cname", ApiClient.CurrentTeller["username"] },
                        { "cnum", ApiClient.CurrentTeller["counter_number"] }
                    };

                    ThreadPool.QueueUserWorkItem(delegate(object state)
                    {
                        ApiClient.Post("/api/tickets/forward", reqData);
                        this.BeginInvoke(new Action(() =>
                        {
                            if (currentTicket != null && currentTicket["id"].ToString() == targetTicketId)
                            {
                                ClearCurrentTicket();
                            }
                            FetchQueues();
                            MessageBox.Show("Ticket forwarded successfully.", "Success", MessageBoxButtons.OK, MessageBoxIcon.Information);
                        }));
                    });
                }
            }
        }

        private void OpenVoidModal()
        {
            if (currentTicket == null) return;
            
            using (VoidModal vm = new VoidModal())
            {
                if (vm.ShowDialog() == DialogResult.OK)
                {
                    var reqData = new Dictionary<string, object>
                    {
                        { "ticketId", currentTicket["id"] },
                        { "reason", vm.Reason },
                        { "notes", vm.Notes },
                        { "cname", ApiClient.CurrentTeller["username"] },
                        { "cnum", ApiClient.CurrentTeller["counter_number"] }
                    };

                    ThreadPool.QueueUserWorkItem(delegate(object state)
                    {
                        ApiClient.Post("/api/tickets/void", reqData);
                        this.BeginInvoke(new Action(() =>
                        {
                            ClearCurrentTicket();
                            FetchQueues();
                        }));
                    });
                }
            }
        }
    }
}
