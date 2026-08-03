using System;
using System.Drawing;
using System.Windows.Forms;
using System.Collections.Generic;
using System.Threading;

namespace CallerApp
{
    public class MainForm : Form
    {
        private System.Windows.Forms.Timer pollingTimer;
        private System.Windows.Forms.Timer durationTimer;
        private DateTime? currentTicketStartTime = null;

        private Dictionary<string, object> currentTicket = null;
        private object[] catalogServicesList = null;

        // UI Elements
        private Button btnSettings;
        private LinkLabel lnkLogout;
        private TabControl tabs;
        
        // Tab Pages
        private TabPage tabHome;
        private TabPage tabWait;
        private TabPage tabHeld;
        private TabPage tabRecv;

        // Home Tab
        private Label lblCurrentTicket;
        private Label lblDuration;
        private Button btnRecall;
        private Button btnHold;
        private Button btnForward;
        private Button btnVoid;
        private Button btnComplete;
        
        private ComboBox cmbServices;
        private Button btnCallReg;
        private Button btnCallPri;
        private Button btnAutoCall;

        // Queue Lists
        private FlowLayoutPanel pnlWaitingList;
        private FlowLayoutPanel pnlHeldList;
        private FlowLayoutPanel pnlForwardedList;
        
        public MainForm()
        {
            InitializeComponent();
            this.Load += MainForm_Load;
            this.FormClosing += MainForm_FormClosing;
        }

        private void InitializeComponent()
        {
            this.Size = new Size(300, 325);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedSingle;
            this.MaximizeBox = false;
            this.BackColor = Color.White;

            // Top Bar
            btnSettings = new Button() { Text = "⚙ Settings", Location = new Point(5, 5), Size = new Size(80, 20), BackColor = Color.WhiteSmoke, ForeColor = Color.DimGray, Font = new Font("Segoe UI", 8, FontStyle.Bold), FlatStyle = FlatStyle.Flat, Cursor = Cursors.Hand };
            btnSettings.FlatAppearance.BorderSize = 0;
            btnSettings.Click += BtnSettings_Click;

            lnkLogout = new LinkLabel() { Text = "Logout", Location = new Point(230, 5), Size = new Size(50, 20), Font = new Font("Segoe UI", 9), LinkColor = Color.Crimson };
            lnkLogout.LinkClicked += BtnLogout_Click;
            
            // Tabs
            tabs = new TabControl() { Location = new Point(5, 25), Size = new Size(275, 250), Font = new Font("Segoe UI", 8) };
            
            tabHome = new TabPage("🏠 Home") { BackColor = Color.White };
            tabWait = new TabPage("🕒 Wait") { BackColor = Color.White };
            tabHeld = new TabPage("⏸ Held") { BackColor = Color.White };
            tabRecv = new TabPage("📩 Recv") { BackColor = Color.White };

            tabs.TabPages.Add(tabHome);
            tabs.TabPages.Add(tabWait);
            tabs.TabPages.Add(tabHeld);
            tabs.TabPages.Add(tabRecv);

            // --- HOME TAB ---
            lblCurrentTicket = new Label() { Text = "Ready", Location = new Point(10, 10), Size = new Size(245, 35), Font = new Font("Segoe UI", 20, FontStyle.Bold), TextAlign = ContentAlignment.MiddleCenter, ForeColor = Color.FromArgb(41, 128, 185) };
            lblDuration = new Label() { Text = "00:00", Location = new Point(10, 45), Size = new Size(245, 20), TextAlign = ContentAlignment.MiddleCenter, ForeColor = Color.DimGray, Font = new Font("Segoe UI", 10, FontStyle.Bold) };
            
            btnComplete = CreateModernButton("✅ Done", 10, 70, 60, 30, Color.FromArgb(46, 204, 113), Color.White);
            btnHold = CreateModernButton("⏸ Hold", 72, 70, 55, 30, Color.FromArgb(241, 196, 15), Color.White);
            btnRecall = CreateModernButton("🔄", 129, 70, 35, 30, Color.FromArgb(52, 152, 219), Color.White);
            btnForward = CreateModernButton("➡️", 166, 70, 35, 30, Color.FromArgb(149, 165, 166), Color.White);
            btnVoid = CreateModernButton("❌", 203, 70, 35, 30, Color.FromArgb(231, 76, 60), Color.White);

            btnRecall.Click += (s, e) => RecallTicket();
            btnHold.Click += (s, e) => HoldTicket();
            btnForward.Click += (s, e) => OpenForwardModal();
            btnVoid.Click += (s, e) => OpenVoidModal();
            btnComplete.Click += (s, e) => CompleteTicket();

            Label lblCall = new Label() { Text = "Call Next:", Location = new Point(10, 115), Size = new Size(80, 20), Font = new Font("Segoe UI", 9, FontStyle.Bold), ForeColor = Color.Gray };
            cmbServices = new ComboBox() { Location = new Point(10, 135), Size = new Size(245, 20), DropDownStyle = ComboBoxStyle.DropDownList, Font = new Font("Segoe UI", 9) };
            
            btnCallReg = CreateModernButton("👤 Reg", 10, 165, 75, 35, Color.FromArgb(52, 152, 219), Color.White);
            btnCallPri = CreateModernButton("⭐ Pri", 90, 165, 75, 35, Color.FromArgb(155, 89, 182), Color.White);
            btnAutoCall = CreateModernButton("⚡ Auto", 170, 165, 85, 35, Color.FromArgb(52, 73, 94), Color.White);

            btnCallReg.Click += (s, e) => CallNext("regular");
            btnCallPri.Click += (s, e) => CallNext("priority");
            btnAutoCall.Click += (s, e) => CallNext("auto");

            tabHome.Controls.AddRange(new Control[] { lblCurrentTicket, lblDuration, btnComplete, btnHold, btnRecall, btnForward, btnVoid, lblCall, cmbServices, btnCallReg, btnCallPri, btnAutoCall });

            // --- QUEUE TABS ---
            pnlWaitingList = new FlowLayoutPanel() { Dock = DockStyle.Fill, AutoScroll = true, WrapContents = false, FlowDirection = FlowDirection.TopDown };
            tabWait.Controls.Add(pnlWaitingList);

            pnlHeldList = new FlowLayoutPanel() { Dock = DockStyle.Fill, AutoScroll = true, WrapContents = false, FlowDirection = FlowDirection.TopDown };
            tabHeld.Controls.Add(pnlHeldList);

            pnlForwardedList = new FlowLayoutPanel() { Dock = DockStyle.Fill, AutoScroll = true, WrapContents = false, FlowDirection = FlowDirection.TopDown };
            tabRecv.Controls.Add(pnlForwardedList);

            this.Controls.Add(btnSettings);
            this.Controls.Add(lnkLogout);
            this.Controls.Add(tabs);

            // Timers
            pollingTimer = new System.Windows.Forms.Timer() { Interval = 3000 };
            pollingTimer.Tick += PollingTimer_Tick;

            durationTimer = new System.Windows.Forms.Timer() { Interval = 1000 };
            durationTimer.Tick += DurationTimer_Tick;
        }

        private Button CreateModernButton(string text, int x, int y, int w, int h, Color bg, Color fg)
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

            ApplyTabSettings();
            LoadCatalogServices();
            CreateServiceBoxes();
            CheckCurrentTicket();
            pollingTimer.Start();
        }

        private void MainForm_FormClosing(object sender, FormClosingEventArgs e)
        {
            pollingTimer.Stop();
            durationTimer.Stop();
        }

        private void BtnLogout_Click(object sender, EventArgs e)
        {
            if (MessageBox.Show("Logout?", "Confirm", MessageBoxButtons.YesNo, MessageBoxIcon.Question) == DialogResult.Yes)
            {
                ApiClient.Post("/api/logout", new { });
                this.Close(); // Return to Program.cs logic which ends
            }
        }

        private void BtnSettings_Click(object sender, EventArgs e)
        {
            using (SettingsModal sm = new SettingsModal())
            {
                if (sm.ShowDialog() == DialogResult.OK)
                {
                    ApplyTabSettings();
                    FetchQueues();
                    
                    if (sm.ShowHistoryClicked)
                    {
                        var histParams = new Dictionary<string, string> { { "counterNumber", ApiClient.CurrentTeller["counter_number"].ToString() }, { "cname", ApiClient.CurrentTeller["username"].ToString() } };
                        object[] historyTickets = ApiClient.GetArray("/api/tickets/history", histParams);
                        
                        using (HistoryModal hm = new HistoryModal(historyTickets, CallSpecificTicket, OpenForwardModal))
                        {
                            hm.ShowDialog();
                        }
                    }
                }
            }
        }

        private void ApplyTabSettings()
        {
            if (AppSettings.ShowReceivedInWaiting)
            {
                if (tabs.TabPages.Contains(tabRecv)) tabs.TabPages.Remove(tabRecv);
            }
            else
            {
                if (!tabs.TabPages.Contains(tabRecv)) tabs.TabPages.Add(tabRecv);
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
            });
        }

        private void CreateServiceBoxes()
        {
            if (ApiClient.CurrentTeller == null || !ApiClient.CurrentTeller.ContainsKey("services")) return;
            string[] services = ApiClient.CurrentTeller["services"].ToString().Split(',');

            cmbServices.Items.Clear();
            foreach (string rawSrv in services)
            {
                string srv = rawSrv.Trim();
                if (string.IsNullOrEmpty(srv)) continue;
                cmbServices.Items.Add(srv);
            }
            if (cmbServices.Items.Count > 0) cmbServices.SelectedIndex = 0;
        }

        private void PollingTimer_Tick(object sender, EventArgs e)
        {
            ThreadPool.QueueUserWorkItem(delegate(object state)
            {
                FetchQueues();
            });
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

            this.BeginInvoke(new Action(() =>
            {
                if (AppSettings.ShowReceivedInWaiting)
                {
                    // Merge them
                    var merged = new List<object>();
                    if (forwardedTickets != null) merged.AddRange(forwardedTickets);
                    if (waitingTickets != null) merged.AddRange(waitingTickets);
                    UpdateWaitingQueue(merged.ToArray());
                }
                else
                {
                    UpdateWaitingQueue(waitingTickets);
                    UpdateForwardedQueue(forwardedTickets);
                }
                
                UpdateHeldQueue(heldTickets);
            }));
        }

        private void UpdateWaitingQueue(object[] tickets)
        {
            pnlWaitingList.Controls.Clear();
            int count = 0;
            if (tickets != null)
            {
                foreach (Dictionary<string, object> t in tickets)
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
            pnlHeldList.Controls.Clear();
            int count = 0;
            if (tickets != null)
            {
                foreach (Dictionary<string, object> t in tickets)
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
            pnlForwardedList.Controls.Clear();
            int count = 0;
            if (tickets != null)
            {
                foreach (Dictionary<string, object> t in tickets)
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
            Panel p = new Panel() { Width = 240, Height = 45, BorderStyle = BorderStyle.FixedSingle, Margin = new Padding(2), BackColor = Color.WhiteSmoke };
            
            string tNum = t.ContainsKey("ticketservice") ? string.Format("{0}{1}", t["ticketservice"], t["ticketnum"]) : t["ticketnum"].ToString();
            string sName = t.ContainsKey("sname") ? t["sname"].ToString().Replace("_", " ") : "";
            if (string.IsNullOrEmpty(sName) && t.ContainsKey("status")) sName = t["status"].ToString();
            
            Label lblNum = new Label() { Text = tNum, Font = new Font("Segoe UI", 10, FontStyle.Bold), Location = new Point(5, 5), AutoSize = true, ForeColor = Color.FromArgb(40,40,40) };
            Label lblSvc = new Label() { Text = sName, Location = new Point(5, 23), AutoSize = true, Font = new Font("Segoe UI", 8), ForeColor = Color.DimGray };

            if (!string.IsNullOrEmpty(btn2Text) && btn2Color.HasValue)
            {
                Button btn1 = CreateModernButton(btn1Text, 125, 8, 52, 28, btn1Color, Color.White);
                btn1.Font = new Font("Segoe UI", 7, FontStyle.Bold);
                btn1.Click += onBtn1Click;
                
                Button btn2 = CreateModernButton(btn2Text, 180, 8, 52, 28, btn2Color.Value, Color.White);
                btn2.Font = new Font("Segoe UI", 7, FontStyle.Bold);
                btn2.Click += onBtn2Click;

                p.Controls.Add(btn1);
                p.Controls.Add(btn2);
            }
            else
            {
                Button btn1 = CreateModernButton(btn1Text, 155, 8, 80, 28, btn1Color, Color.White);
                btn1.Font = new Font("Segoe UI", 8, FontStyle.Bold);
                btn1.Click += onBtn1Click;
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
                                this.BeginInvoke(new Action(() => DisplayCurrentTicket(t)));
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

        private void CallNext(string type)
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

            string service = cmbServices.SelectedItem != null ? cmbServices.SelectedItem.ToString() : "";

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
