using System;
using System.Drawing;
using System.Windows.Forms;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using SocketIOClient;

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
        private int lastForwardedCount = 0;
        private int isFetchingQueues = 0;
        private int isCheckingTicket = 0;

        public ToolTip appToolTip = new ToolTip();

        public MainForm()
        {
            InitializeComponent();
            this.DoubleBuffered = true;
            EnableDoubleBuffering(pnlServicesList);
            EnableDoubleBuffering(pnlWaitingList);
            EnableDoubleBuffering(pnlHeldList);
            EnableDoubleBuffering(pnlForwardedList);
            EnableDoubleBuffering(tabs);
        }

        private static void EnableDoubleBuffering(Control ctrl)
        {
            if (ctrl == null) return;
            try
            {
                PropertyInfo prop = typeof(Control).GetProperty("DoubleBuffered", BindingFlags.Instance | BindingFlags.NonPublic);
                if (prop != null) prop.SetValue(ctrl, true, null);
            }
            catch { }
        }

        private static void ClearPanelSafely(Panel pnl)
        {
            if (pnl == null) return;
            pnl.SuspendLayout();
            try
            {
                while (pnl.Controls.Count > 0)
                {
                    Control c = pnl.Controls[0];
                    pnl.Controls.RemoveAt(0);
                    c.Dispose();
                }
            }
            finally
            {
                pnl.ResumeLayout();
            }
        }

        private void BtnRecall_Click(object sender, EventArgs e) { RecallTicket(); }
        private void BtnHold_Click(object sender, EventArgs e) { HoldTicket(); }
        private void BtnForward_Click(object sender, EventArgs e) { OpenForwardModal(); }
        private void BtnVoid_Click(object sender, EventArgs e) { OpenVoidModal(); }
        private void BtnComplete_Click(object sender, EventArgs e) { CompleteTicket(); }
        private void BtnAutoCall_Click(object sender, EventArgs e)
        {
            CallNext("auto");
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

            appToolTip.Active = AppSettings.ShowTooltips;
            appToolTip.SetToolTip(btnRecall, "Recall Ticket");
            appToolTip.SetToolTip(btnHold, "Hold Ticket");
            appToolTip.SetToolTip(btnForward, "Forward Ticket");
            appToolTip.SetToolTip(btnVoid, "Void Ticket");
            appToolTip.SetToolTip(btnComplete, "Complete Ticket");
            if (btnAutoCall != null) appToolTip.SetToolTip(btnAutoCall, "Auto Call Next");

            ApplyTabSettings();
            LoadCatalogServices();

            // Force initial load immediately on the background thread
            this.BeginInvoke(new Action(delegate {
                ThreadPool.QueueUserWorkItem(delegate {
                    FetchQueues();
                });
            }));
            
            CheckCurrentTicket();

            // Setup a 4-second fallback polling timer
            fallbackTimer = new System.Windows.Forms.Timer();
            fallbackTimer.Interval = 4000;
            fallbackTimer.Tick += delegate {
                ThreadPool.QueueUserWorkItem(delegate { FetchQueues(); });
                CheckCurrentTicket();
            };
            fallbackTimer.Start();
            
            try
            {
                if (ApiClient.Socket == null)
                {
                    ApiClient.Socket = new SocketIO(new Uri(ApiClient.BaseUrl));
                    
                    ApiClient.Socket.OnConnected += delegate {
                        if (this.IsHandleCreated && !this.IsDisposed)
                        {
                            this.BeginInvoke(new Action(delegate {
                                ThreadPool.QueueUserWorkItem(delegate { FetchQueues(); });
                                CheckCurrentTicket();
                            }));
                        }
                    };
                    
                    Action triggerUpdate = delegate {
                        ThreadPool.QueueUserWorkItem(delegate {
                            FetchQueues();
                        });
                        CheckCurrentTicket();
                    };

                    ApiClient.Socket.On("ticket_completed", response => { triggerUpdate(); return Task.CompletedTask; });
                    ApiClient.Socket.On("calledticketsArrived", response => { triggerUpdate(); return Task.CompletedTask; });
                    ApiClient.Socket.On("ticket_called", response => { triggerUpdate(); return Task.CompletedTask; });
                    ApiClient.Socket.On("ticket-called", response => { triggerUpdate(); return Task.CompletedTask; });
                    ApiClient.Socket.On("ticket_held", response => { triggerUpdate(); return Task.CompletedTask; });
                    ApiClient.Socket.On("ticket_voided", response => { triggerUpdate(); return Task.CompletedTask; });
                    ApiClient.Socket.On("ticket_forwarded", response => { triggerUpdate(); return Task.CompletedTask; });
                    ApiClient.Socket.On("new-ticket", response => { triggerUpdate(); return Task.CompletedTask; });
                    ApiClient.Socket.On("new_ticket", response => { triggerUpdate(); return Task.CompletedTask; });
                    ApiClient.Socket.On("service_update", response => { triggerUpdate(); return Task.CompletedTask; });
                    ApiClient.Socket.On("teller_assignment_updated", response => { triggerUpdate(); return Task.CompletedTask; });

                    ApiClient.Socket.ConnectAsync();
                }
            }
            catch { }
        }

        private void MainForm_FormClosing(object sender, FormClosingEventArgs e)
        {
            if (fallbackTimer != null)
            {
                fallbackTimer.Stop();
                fallbackTimer.Dispose();
            }
            if (ApiClient.Socket != null)
            {
                try
                {
                    ApiClient.Socket.DisconnectAsync();
                    ApiClient.Socket.Dispose();
                }
                catch { }
                ApiClient.Socket = null;
            }
            durationTimer.Stop();
        }

        private void BtnSettings_Click(object sender, EventArgs e)
        {
            using (SettingsModal sm = new SettingsModal())
            {
                DialogResult dr = sm.ShowDialog();
                if (dr == DialogResult.OK)
                {
                    ApplyTabSettings();
                    appToolTip.Active = AppSettings.ShowTooltips;
                    this.TopMost = AppSettings.AlwaysOnTop;
                    lastWaitingJson = "";
                    lastHeldJson = "";
                    lastForwardedJson = "";
                    ThreadPool.QueueUserWorkItem(delegate { FetchQueues(); });
                }
                else if (dr == DialogResult.Abort)
                {
                    Application.Restart();
                }
            }
        }

        private void BtnHistory_Click(object sender, EventArgs e)
        {
            ThreadPool.QueueUserWorkItem(delegate
            {
                var histParams = HistoryModal.BuildHistoryQueryParams();
                object[] historyTickets = ApiClient.GetArray("/api/tickets/history", histParams);
                if (this.IsHandleCreated && !this.IsDisposed)
                {
                    this.BeginInvoke(new Action(delegate
                    {
                        HistoryModal hm = new HistoryModal(historyTickets, CallSpecificTicket, OpenForwardModal);
                        hm.Show();
                    }));
                }
            });
        }

        private void ApplyTabSettings()
        {
            this.TopMost = AppSettings.AlwaysOnTop;
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
                if (this.IsHandleCreated && !this.IsDisposed)
                {
                    this.BeginInvoke(new Action(delegate { CreateServiceBoxes(); }));
                }
            });
        }

        private Dictionary<string, Button[]> serviceButtons = new Dictionary<string, Button[]>();

        private void CreateServiceBoxes()
        {
            if (ApiClient.CurrentTeller == null || !ApiClient.CurrentTeller.ContainsKey("services")) return;
            string[] services = ApiClient.CurrentTeller["services"].ToString().Split(',');

            ClearPanelSafely(pnlServicesList);
            serviceButtons.Clear();

            pnlServicesList.SuspendLayout();
            try
            {
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
                    
                    string capturedSrv = srv;
                    Button btnReg = CreateModernButton("0", 130, 4, 35, 26, Color.FromArgb(52, 152, 219), Color.White);
                    btnReg.Font = new Font("Segoe UI", 8, FontStyle.Bold);
                    btnReg.Click += delegate { CallNext("regular", capturedSrv); };

                    Button btnPri = CreateModernButton("0", 170, 4, 35, 26, Color.FromArgb(155, 89, 182), Color.White);
                    btnPri.Font = new Font("Segoe UI", 8, FontStyle.Bold);
                    btnPri.Click += delegate { CallNext("priority", capturedSrv); };
                    
                    appToolTip.SetToolTip(btnReg, "Regular");
                    appToolTip.SetToolTip(btnPri, "Priority");

                    pRow.Controls.Add(lblName);
                    pRow.Controls.Add(btnReg);
                    pRow.Controls.Add(btnPri);

                    pnlServicesList.Controls.Add(pRow);
                    
                    serviceButtons[srv] = new Button[] { btnReg, btnPri };
                }
            }
            finally
            {
                pnlServicesList.ResumeLayout();
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
                string srv = kvp.Key.Trim();
                string srvSpace = srv.Replace("_", " ");
                int rCount = 0;
                int pCount = 0;
                
                foreach (var rK in regCounts.Keys)
                {
                    string rKSpace = rK.Trim().Replace("_", " ");
                    if (rKSpace.Equals(srvSpace, StringComparison.InvariantCultureIgnoreCase) || rKSpace.StartsWith(srvSpace, StringComparison.InvariantCultureIgnoreCase))
                    {
                        rCount += regCounts[rK];
                    }
                }
                foreach (var pK in priCounts.Keys)
                {
                    string pKSpace = pK.Trim().Replace("_", " ");
                    if (pKSpace.Equals(srvSpace, StringComparison.InvariantCultureIgnoreCase) || pKSpace.StartsWith(srvSpace, StringComparison.InvariantCultureIgnoreCase))
                    {
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
            if (Interlocked.CompareExchange(ref isFetchingQueues, 1, 0) != 0) return;

            try
            {
                string services = ApiClient.CurrentTeller["services"].ToString();
                string tellerId = ApiClient.CurrentTeller["id"].ToString();
                string groupId = (ApiClient.CurrentTeller.ContainsKey("group_id") && ApiClient.CurrentTeller["group_id"] != null)
                    ? ApiClient.CurrentTeller["group_id"].ToString()
                    : "";

                var waitingParams = new Dictionary<string, string> { { "services", services }, { "tellerId", tellerId }, { "groupId", groupId } };
                object[] waitingTickets = ApiClient.GetArray("/api/tickets/waiting", waitingParams);

                var heldParams = new Dictionary<string, string> { { "tellerId", ApiClient.CurrentTeller["counter_number"].ToString() } };
                object[] heldTickets = ApiClient.GetArray("/api/tickets/held", heldParams);

                var forwardParams = new Dictionary<string, string> { { "tellerId", tellerId }, { "groupId", groupId } };
                object[] forwardedTickets = ApiClient.GetArray("/api/tickets/forwarded", forwardParams);

                if (this.IsHandleCreated && !this.IsDisposed)
                {
                    this.BeginInvoke(new Action(delegate
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
                            
                            UpdateForwardedQueue(forwardedTickets);
                            UpdateHeldQueue(heldTickets);
                            UpdateServiceCounts(waitingTickets);
                        }
                        catch { }
                    }));
                }
            }
            finally
            {
                Interlocked.Exchange(ref isFetchingQueues, 0);
            }
        }

        private void UpdateWaitingQueue(object[] tickets)
        {
            string newJson = tickets != null ? jsSerializer.Serialize(tickets) : "";
            if (newJson == lastWaitingJson) return;
            lastWaitingJson = newJson;

            ClearPanelSafely(pnlWaitingList);
            pnlWaitingList.SuspendLayout();
            int count = 0;
            try
            {
                if (tickets != null)
                {
                    var sortedTickets = tickets
                        .Select(t => (Dictionary<string, object>)t)
                        .OrderByDescending(t => t.ContainsKey("status") && t["status"].ToString() == "received" ? 1 : 0)
                        .ThenByDescending(t => t.ContainsKey("priority") && Convert.ToInt32(t["priority"]) == 1 ? 1 : 0)
                        .ThenBy(t => t.ContainsKey("id") ? Convert.ToInt64(t["id"]) : 0)
                        .ToList();

                    foreach (var t in sortedTickets)
                    {
                        count++;
                        string tId = t["id"].ToString();
                        Panel pItem = CreateQueueItem(t, "📢 Call", Color.FromArgb(52, 152, 219), delegate { CallSpecificTicket(tId); });
                        pnlWaitingList.Controls.Add(pItem);
                    }
                }
            }
            finally
            {
                pnlWaitingList.ResumeLayout();
            }
            tabWait.Text = string.Format("🕒 Wait ({0})", count);
        }

        private void UpdateHeldQueue(object[] tickets)
        {
            string newJson = tickets != null ? jsSerializer.Serialize(tickets) : "";
            if (newJson == lastHeldJson) return;
            lastHeldJson = newJson;

            ClearPanelSafely(pnlHeldList);
            pnlHeldList.SuspendLayout();
            int count = 0;
            try
            {
                if (tickets != null)
                {
                    var sortedTickets = tickets
                        .Select(t => (Dictionary<string, object>)t)
                        .OrderByDescending(t => t.ContainsKey("priority") && Convert.ToInt32(t["priority"]) == 1 ? 1 : 0)
                        .ThenBy(t => t.ContainsKey("id") ? Convert.ToInt64(t["id"]) : 0)
                        .ToList();
                    foreach (var t in sortedTickets)
                    {
                        count++;
                        string tId = t["id"].ToString();
                        Panel pItem = CreateQueueItem(t, 
                            "▶ Res", Color.FromArgb(46, 204, 113), delegate { ResumeHeldTicket(tId); },
                            "➡️ Fwd", Color.FromArgb(149, 165, 166), delegate { OpenForwardModal(tId); });
                        pnlHeldList.Controls.Add(pItem);
                    }
                }
            }
            finally
            {
                pnlHeldList.ResumeLayout();
            }
            tabHeld.Text = string.Format("⏸ Held ({0})", count);
        }

        private void UpdateForwardedQueue(object[] tickets)
        {
            string newJson = tickets != null ? jsSerializer.Serialize(tickets) : "";
            if (newJson == lastForwardedJson) return;
            int currentLength = tickets != null ? tickets.Length : 0;
            if (lastForwardedJson != "" && currentLength > lastForwardedCount)
            {
                PlayCustomSound("received");
            }
            lastForwardedCount = currentLength;
            lastForwardedJson = newJson;

            ClearPanelSafely(pnlForwardedList);
            pnlForwardedList.SuspendLayout();
            int count = 0;
            try
            {
                if (tickets != null)
                {
                    var sortedTickets = tickets
                        .Select(t => (Dictionary<string, object>)t)
                        .OrderByDescending(t => t.ContainsKey("priority") && Convert.ToInt32(t["priority"]) == 1 ? 1 : 0)
                        .ThenBy(t => t.ContainsKey("id") ? Convert.ToInt64(t["id"]) : 0)
                        .ToList();
                    foreach (var t in sortedTickets)
                    {
                        count++;
                        string tId = t["id"].ToString();
                        Panel pItem = CreateQueueItem(t, 
                            "📢 Call", Color.FromArgb(155, 89, 182), delegate { CallSpecificTicket(tId); },
                            "➡️ Fwd", Color.FromArgb(149, 165, 166), delegate { OpenForwardModal(tId); });
                        pnlForwardedList.Controls.Add(pItem);
                    }
                }
            }
            finally
            {
                pnlForwardedList.ResumeLayout();
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
                bgColor = Color.FromArgb(214, 234, 248);
            }
            else if (t.ContainsKey("priority") && Convert.ToInt32(t["priority"]) == 1)
            {
                bgColor = Color.FromArgb(250, 219, 216);
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
            if (ApiClient.CurrentTeller == null) return;
            if (Interlocked.CompareExchange(ref isCheckingTicket, 1, 0) != 0) return;

            ThreadPool.QueueUserWorkItem(delegate(object state)
            {
                try
                {
                    object[] tickets = ApiClient.GetArray("/api/tickets/called");
                    Dictionary<string, object> activeTicket = null;

                    if (tickets != null && ApiClient.CurrentTeller != null)
                    {
                        string myCounter = ApiClient.CurrentTeller["counter_number"].ToString();
                        foreach (Dictionary<string, object> t in tickets)
                        {
                            if (t.ContainsKey("counter_num") && t["counter_num"] != null && t["counter_num"].ToString() == myCounter)
                            {
                                string status = t.ContainsKey("status") && t["status"] != null ? t["status"].ToString() : "";
                                if (status != "held" && status != "received" && status != "voided" && status != "finished")
                                {
                                    activeTicket = t;
                                    break;
                                }
                            }
                        }
                    }

                    if (this.IsHandleCreated && !this.IsDisposed)
                    {
                        this.BeginInvoke(new Action(delegate
                        {
                            try
                            {
                                if (activeTicket != null)
                                {
                                    DisplayCurrentTicket(activeTicket);
                                }
                                else if (currentTicket != null)
                                {
                                    ClearCurrentTicket();
                                }
                            }
                            catch { }
                        }));
                    }
                }
                finally
                {
                    Interlocked.Exchange(ref isCheckingTicket, 0);
                }
            });
        }

        private void DisplayCurrentTicket(Dictionary<string, object> ticket)
        {
            currentTicket = ticket;
            string tNum = ticket.ContainsKey("ticketservice") ? string.Format("{0}{1}", ticket["ticketservice"], ticket["ticketnum"]) : ticket["ticketnum"].ToString();
            lblCurrentTicket.Text = tNum;
            lblCurrentTicket.ForeColor = Color.FromArgb(39, 174, 96);

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
            if (currentTicket != null && !AppSettings.AutoFinishEnabled)
            {
                MessageBox.Show("Please complete or hold current ticket first.", "Info", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
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
                reqData.Add("mix_received", AppSettings.ShowReceivedInWaiting);
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
                            this.BeginInvoke(new Action(delegate { CallSpecificTicket(targetId); }));
                        }
                        else
                        {
                            this.BeginInvoke(new Action(delegate { MessageBox.Show(string.Format("No {0} tickets for {1}", type, service), "Info", MessageBoxButtons.OK, MessageBoxIcon.Information); }));
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
                if (AppSettings.AutoFinishEnabled && currentTicket != null)
                {
                    AutoCompleteActiveTicketSynchronous();
                    this.BeginInvoke(new Action(delegate { ClearCurrentTicket(); }));
                }

                var response = ApiClient.Post("/api/tickets/call", reqData);
                this.BeginInvoke(new Action(delegate
                {
                    if (response != null && response.ContainsKey("success") && (bool)response["success"])
                    {
                        DisplayCurrentTicket((Dictionary<string, object>)response["ticket"]);
                        ThreadPool.QueueUserWorkItem(delegate { FetchQueues(); });
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
            PlayCustomSound("ring");
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
                this.BeginInvoke(new Action(delegate
                {
                    ClearCurrentTicket();
                    ThreadPool.QueueUserWorkItem(delegate { FetchQueues(); });
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
                this.BeginInvoke(new Action(delegate
                {
                    PlayCustomSound("held");
                    ClearCurrentTicket();
                    ThreadPool.QueueUserWorkItem(delegate { FetchQueues(); });
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
                    this.BeginInvoke(new Action(delegate { ClearCurrentTicket(); }));
                }

                var response = ApiClient.Post("/api/tickets/resume", reqData);
                this.BeginInvoke(new Action(delegate
                {
                    if (response != null && response.ContainsKey("success") && (bool)response["success"])
                    {
                        DisplayCurrentTicket((Dictionary<string, object>)response["ticket"]);
                        ThreadPool.QueueUserWorkItem(delegate { FetchQueues(); });
                    }
                }));
            });
        }

        private void OpenForwardModal(string specificTicketId = null)
        {
            string targetTicketId = specificTicketId != null ? specificTicketId : (currentTicket != null ? currentTicket["id"].ToString() : null);
            if (targetTicketId == null) return;
            
            object[] tellers = ApiClient.GetArray("/api/tellers/list", new Dictionary<string, string> { { "id", ApiClient.CurrentTeller["id"].ToString() }, { "activeToday", "true" } });
            object[] groups = ApiClient.GetArray("/api/groups/list");

            if (groups == null || groups.Length == 0)
            {
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
                groups = new List<Dictionary<string, object>>(uniqueGroups.Values).ToArray();
            }

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
                        var response = ApiClient.Post("/api/tickets/forward", reqData);
                        this.BeginInvoke(new Action(delegate
                        {
                            bool isSuccess = response != null && response.ContainsKey("success") && (bool)response["success"];
                            if (isSuccess && currentTicket != null && currentTicket["id"].ToString() == targetTicketId)
                            {
                                ClearCurrentTicket();
                            }
                            ThreadPool.QueueUserWorkItem(delegate { FetchQueues(); });
                            ShowToastPopup(isSuccess ? "Ticket forwarded successfully." : "Failed to forward ticket.", isSuccess);
                        }));
                    });
                }
            }
        }

        private void ShowToastPopup(string message, bool isSuccess)
        {
            Form toast = new Form();
            toast.FormBorderStyle = FormBorderStyle.None;
            toast.StartPosition = FormStartPosition.CenterScreen;
            toast.Size = new Size(260, 56);
            toast.BackColor = isSuccess ? Color.FromArgb(46, 204, 113) : Color.FromArgb(231, 76, 60);
            toast.TopMost = true;
            toast.ShowInTaskbar = false;

            Label lbl = new Label();
            lbl.Text = message;
            lbl.Font = new Font("Segoe UI", 10, FontStyle.Bold);
            lbl.ForeColor = Color.White;
            lbl.AutoSize = false;
            lbl.Dock = DockStyle.Fill;
            lbl.TextAlign = ContentAlignment.MiddleCenter;
            toast.Controls.Add(lbl);

            PlayCustomSound(isSuccess ? "success" : "alarm");

            System.Windows.Forms.Timer t = new System.Windows.Forms.Timer();
            t.Interval = 2500;
            t.Tick += delegate { t.Stop(); t.Dispose(); toast.Close(); toast.Dispose(); };
            toast.Load += delegate { t.Start(); };
            toast.Show();
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
                        this.BeginInvoke(new Action(delegate
                        {
                            PlayCustomSound("void");
                            ClearCurrentTicket();
                            ThreadPool.QueueUserWorkItem(delegate { FetchQueues(); });
                        }));
                    });
                }
            }
        }

        private void PlayCustomSound(string soundType)
        {
            if (!AppSettings.EnableSoundAlerts) return;

            ThreadPool.QueueUserWorkItem(delegate (object state)
            {
                try
                {
                    if (soundType == "alarm" || soundType == "ring")
                    {
                        string windir = Environment.GetEnvironmentVariable("WINDIR") ?? @"C:\Windows";
                        string wavPath = soundType == "alarm"
                            ? System.IO.Path.Combine(windir, "Media", "Alarm01.wav")
                            : System.IO.Path.Combine(windir, "Media", "Ring01.wav");
                        if (System.IO.File.Exists(wavPath))
                        {
                            using (var player = new System.Media.SoundPlayer(wavPath))
                            {
                                player.PlaySync();
                            }
                        }
                        else
                        {
                            System.Media.SystemSounds.Beep.Play();
                        }
                    }
                    else
                    {
                        System.IO.Stream audioStream = null;
                        if (soundType == "success") audioStream = Properties.Resources._success;
                        else if (soundType == "held") audioStream = Properties.Resources._held;
                        else if (soundType == "received") audioStream = Properties.Resources._received;
                        else if (soundType == "void") audioStream = Properties.Resources._void;

                        if (audioStream != null)
                        {
                            using (var player = new System.Media.SoundPlayer(audioStream))
                            {
                                player.PlaySync();
                            }
                        }
                    }
                }
                catch { }
            });
        }
    }
}
