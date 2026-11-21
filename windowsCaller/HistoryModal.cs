using System;
using System.Drawing;
using System.Windows.Forms;
using System.Collections.Generic;
using System.Reflection;
using System.Threading;

namespace CallerApp
{
    public class HistoryModal : Form
    {
        private FlowLayoutPanel pnlList;
        private Action<string> onCall;
        private Action<string> onForward;
        
        public HistoryModal(object[] historyTickets, Action<string> callCallback, Action<string> forwardCallback)
        {
            this.onCall = callCallback;
            this.onForward = forwardCallback;
            InitializeComponent();
            PopulateHistory(historyTickets);
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

        public static Dictionary<string, string> BuildHistoryQueryParams()
        {
            var histParams = new Dictionary<string, string>();
            string scope = AppSettings.HistoryScope;
            string mode = scope.ToLower();

            if (ApiClient.CurrentTeller != null)
            {
                bool hasCname = ApiClient.CurrentTeller.ContainsKey("username") && ApiClient.CurrentTeller["username"] != null && !string.IsNullOrEmpty(ApiClient.CurrentTeller["username"].ToString());
                if (hasCname)
                {
                    histParams.Add("cname", ApiClient.CurrentTeller["username"].ToString());
                }
                else
                {
                    if (ApiClient.CurrentTeller.ContainsKey("id") && ApiClient.CurrentTeller["id"] != null)
                        histParams.Add("teller_id", ApiClient.CurrentTeller["id"].ToString());
                    if (mode == "self" && ApiClient.CurrentTeller.ContainsKey("counter_number") && ApiClient.CurrentTeller["counter_number"] != null)
                        histParams.Add("counterNumber", ApiClient.CurrentTeller["counter_number"].ToString());
                }

                if (ApiClient.CurrentTeller.ContainsKey("group_id") && ApiClient.CurrentTeller["group_id"] != null)
                    histParams.Add("group_id", ApiClient.CurrentTeller["group_id"].ToString());
                if (ApiClient.CurrentTeller.ContainsKey("group_name") && ApiClient.CurrentTeller["group_name"] != null)
                    histParams.Add("group_name", ApiClient.CurrentTeller["group_name"].ToString());
                if (ApiClient.CurrentTeller.ContainsKey("services") && ApiClient.CurrentTeller["services"] != null)
                    histParams.Add("services", ApiClient.CurrentTeller["services"].ToString());
            }

            histParams.Add("mode", mode);
            histParams.Add("limit", "100");
            return histParams;
        }

        private static object[] FilterTicketsByScope(object[] tickets)
        {
            if (tickets == null || tickets.Length == 0) return new object[0];
            if (ApiClient.CurrentTeller == null) return tickets;

            string scope = AppSettings.HistoryScope;
            string myId = ApiClient.CurrentTeller.ContainsKey("id") && ApiClient.CurrentTeller["id"] != null ? ApiClient.CurrentTeller["id"].ToString().Trim() : "";
            string myCname = ApiClient.CurrentTeller.ContainsKey("username") && ApiClient.CurrentTeller["username"] != null ? ApiClient.CurrentTeller["username"].ToString().Trim() : "";
            string myCnum = ApiClient.CurrentTeller.ContainsKey("counter_number") && ApiClient.CurrentTeller["counter_number"] != null ? ApiClient.CurrentTeller["counter_number"].ToString().Trim() : "";
            string myGroupId = ApiClient.CurrentTeller.ContainsKey("group_id") && ApiClient.CurrentTeller["group_id"] != null ? ApiClient.CurrentTeller["group_id"].ToString().Trim() : "";
            string myGroupName = ApiClient.CurrentTeller.ContainsKey("group_name") && ApiClient.CurrentTeller["group_name"] != null ? ApiClient.CurrentTeller["group_name"].ToString().Trim() : "";
            string rawServices = ApiClient.CurrentTeller.ContainsKey("services") && ApiClient.CurrentTeller["services"] != null ? ApiClient.CurrentTeller["services"].ToString() : "";

            List<string> myServices = new List<string>();
            foreach (string s in rawServices.Split(','))
            {
                string trimmed = s.Trim();
                if (!string.IsNullOrEmpty(trimmed)) myServices.Add(trimmed);
            }

            string selfHistoryTag = (!string.IsNullOrEmpty(myCname) && !string.IsNullOrEmpty(myCnum))
                ? string.Format("-{0}-{1}-", myCname, myCnum)
                : "";

            List<object> filtered = new List<object>();
            foreach (object obj in tickets)
            {
                Dictionary<string, object> t = obj as Dictionary<string, object>;
                if (t == null) continue;

                string status = t.ContainsKey("status") && t["status"] != null ? t["status"].ToString().Trim().ToLower() : "";
                if (status == "pending" || string.IsNullOrEmpty(status)) continue;

                if (scope == "All")
                {
                    filtered.Add(t);
                    continue;
                }

                string tTellerId = t.ContainsKey("teller_id") && t["teller_id"] != null ? t["teller_id"].ToString().Trim() : "";
                string tGroup = t.ContainsKey("counter_group") && t["counter_group"] != null ? t["counter_group"].ToString().Trim() : "";
                string tSname = t.ContainsKey("sname") && t["sname"] != null ? t["sname"].ToString().Trim() : "";
                string tHistory = t.ContainsKey("history") && t["history"] != null ? t["history"].ToString() : "";

                bool serviceMatches = false;
                foreach (string srv in myServices)
                {
                    if (srv.Equals(tSname, StringComparison.InvariantCultureIgnoreCase) ||
                        srv.Replace("_", " ").Equals(tSname.Replace("_", " "), StringComparison.InvariantCultureIgnoreCase))
                    {
                        serviceMatches = true;
                        break;
                    }
                }

                if (scope == "Group")
                {
                    bool groupMatches = false;
                    if (!string.IsNullOrEmpty(myGroupName) && !string.IsNullOrEmpty(tGroup) &&
                        (myGroupName.Equals(tGroup, StringComparison.InvariantCultureIgnoreCase) ||
                         myGroupName.Replace("_", " ").Equals(tGroup.Replace("_", " "), StringComparison.InvariantCultureIgnoreCase)))
                    {
                        groupMatches = true;
                    }
                    else if (!string.IsNullOrEmpty(myGroupId) && !string.IsNullOrEmpty(tGroup) && myGroupId == tGroup)
                    {
                        groupMatches = true;
                    }
                    else if (serviceMatches)
                    {
                        groupMatches = true;
                    }

                    if (groupMatches) filtered.Add(t);
                }
                else
                {
                    // Self: all tickets served today by this teller person (cname) across all of their accounts, or matching teller_id
                    string tUser = t.ContainsKey("counter_user") && t["counter_user"] != null ? t["counter_user"].ToString().Trim() : "";
                    string cnameTag = !string.IsNullOrEmpty(myCname) ? string.Format("-{0}-", myCname) : "";
                    bool selfMatches = false;
                    if (!string.IsNullOrEmpty(myId) && tTellerId == myId)
                    {
                        selfMatches = true;
                    }
                    else if (!string.IsNullOrEmpty(myCname) && tUser.Equals(myCname, StringComparison.InvariantCultureIgnoreCase))
                    {
                        selfMatches = true;
                    }
                    else if (!string.IsNullOrEmpty(cnameTag) && tHistory.IndexOf(cnameTag, StringComparison.InvariantCultureIgnoreCase) >= 0)
                    {
                        selfMatches = true;
                    }

                    if (selfMatches) filtered.Add(t);
                }
            }

            return filtered.ToArray();
        }

        private void InitializeComponent()
        {
            string scopeText = AppSettings.HistoryScope;
            this.Text = "Ticket History (" + scopeText + ")";
            this.TopMost = AppSettings.AlwaysOnTop;
            this.DoubleBuffered = true;
            this.Size = new Size(320, 450);
            this.StartPosition = FormStartPosition.CenterParent;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.BackColor = Color.White;

            Label lblTitle = new Label() { Text = "📜 History (" + scopeText + ")", Font = new Font("Segoe UI", 12, FontStyle.Bold), Location = new Point(10, 10), Size = new Size(205, 30), ForeColor = Color.FromArgb(40, 40, 40) };
            
            Button btnRefresh = new Button() { 
                Text = "🔄 Refresh", 
                Location = new Point(220, 12), 
                Size = new Size(75, 25), 
                BackColor = Color.WhiteSmoke, 
                ForeColor = Color.DimGray,
                Font = new Font("Segoe UI", 8, FontStyle.Bold),
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            btnRefresh.FlatAppearance.BorderSize = 0;
            btnRefresh.Click += (s, e) => {
                btnRefresh.Enabled = false;
                ThreadPool.QueueUserWorkItem(delegate {
                    var histParams = BuildHistoryQueryParams();
                    object[] newTickets = ApiClient.GetArray("/api/tickets/history", histParams);
                    if (!this.IsDisposed && this.IsHandleCreated)
                    {
                        this.BeginInvoke(new Action(delegate {
                            PopulateHistory(newTickets);
                            btnRefresh.Enabled = true;
                        }));
                    }
                });
            };

            pnlList = new FlowLayoutPanel() { Location = new Point(10, 50), Size = new Size(285, 350), AutoScroll = true, WrapContents = false, FlowDirection = FlowDirection.TopDown, BorderStyle = BorderStyle.FixedSingle };
            EnableDoubleBuffering(pnlList);

            this.Controls.Add(lblTitle);
            this.Controls.Add(btnRefresh);
            this.Controls.Add(pnlList);
        }

        private void PopulateHistory(object[] rawTickets)
        {
            object[] tickets = FilterTicketsByScope(rawTickets);
            ClearPanelSafely(pnlList);
            pnlList.SuspendLayout();
            try
            {
                if (tickets == null || tickets.Length == 0)
                {
                    pnlList.Controls.Add(new Label() { Text = "No history available.", AutoSize = true, Font = new Font("Segoe UI", 10), ForeColor = Color.Gray, Margin = new Padding(10) });
                    this.Size = new Size(320, 150);
                    pnlList.Size = new Size(285, 50);
                    return;
                }

                foreach (Dictionary<string, object> t in tickets)
                {
                    Panel pItem = CreateQueueItem(t);
                    pnlList.Controls.Add(pItem);
                }
                
                int displayCount = Math.Min(tickets.Length, 5);
                int listHeight = displayCount * 80 + 5;
                pnlList.Size = new Size(285, listHeight);
                this.Size = new Size(320, listHeight + 100);
            }
            finally
            {
                pnlList.ResumeLayout();
            }
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

        private Panel CreateQueueItem(Dictionary<string, object> t)
        {
            Panel p = new Panel() { Width = 260, Height = 75, BorderStyle = BorderStyle.FixedSingle, Margin = new Padding(2), BackColor = Color.WhiteSmoke };
            
            string tNum = t.ContainsKey("ticketservice") ? string.Format("{0}{1}", t["ticketservice"], t["ticketnum"]) : t["ticketnum"].ToString();
            string sName = t.ContainsKey("shortSname") && t["shortSname"] != null && t["shortSname"].ToString().Length > 0 
                ? t["shortSname"].ToString() 
                : (t.ContainsKey("sname") ? t["sname"].ToString().Replace("_", " ") : "");
            string tStatus = t.ContainsKey("status") ? t["status"].ToString().ToUpper() : "";

            string counterInfo = "";
            if (t.ContainsKey("counter_num") && t["counter_num"] != null && t["counter_num"].ToString().Length > 0)
            {
                counterInfo = "C#" + t["counter_num"].ToString();
            }
            if (t.ContainsKey("counter_user") && t["counter_user"] != null && t["counter_user"].ToString().Length > 0)
            {
                string cUser = t["counter_user"].ToString();
                counterInfo = string.IsNullOrEmpty(counterInfo) ? cUser : (counterInfo + " " + cUser);
            }

            string tTime = "";
            if (t.ContainsKey("end_time") && t["end_time"] != null && t["end_time"].ToString().Length > 0) tTime = t["end_time"].ToString();
            else if (t.ContainsKey("start_time") && t["start_time"] != null && t["start_time"].ToString().Length > 0) tTime = t["start_time"].ToString();
            else if (t.ContainsKey("time") && t["time"] != null && t["time"].ToString().Length > 0) tTime = t["time"].ToString();

            string details = sName;
            if (!string.IsNullOrEmpty(counterInfo)) details += " (" + counterInfo + ")";
            if (!string.IsNullOrEmpty(tStatus)) details += string.IsNullOrEmpty(details) ? tStatus : (" | " + tStatus);
            if (!string.IsNullOrEmpty(tTime)) details += " ⌚ " + tTime;

            Label lblNum = new Label() { Text = tNum, Font = new Font("Segoe UI", 10, FontStyle.Bold), Location = new Point(5, 3), AutoSize = true, ForeColor = Color.FromArgb(40,40,40) };
            Label lblSvc = new Label() { Text = details, Location = new Point(5, 22), AutoSize = true, MaximumSize = new Size(135, 0), Font = new Font("Segoe UI", 8), ForeColor = Color.DimGray };

            string tId = t["id"].ToString();

            Button btnCall = CreateModernButton("📢 Call", 145, 23, 52, 28, Color.FromArgb(52, 152, 219), Color.White);
            btnCall.Font = new Font("Segoe UI", 7, FontStyle.Bold);
            btnCall.Click += (s, e) => {
                onCall(tId);
                this.DialogResult = DialogResult.OK;
                this.Close();
            };
            
            Button btnFwd = CreateModernButton("➡️ Fwd", 200, 23, 52, 28, Color.FromArgb(149, 165, 166), Color.White);
            btnFwd.Font = new Font("Segoe UI", 7, FontStyle.Bold);
            btnFwd.Click += (s, e) => {
                onForward(tId);
                this.DialogResult = DialogResult.OK;
                this.Close();
            };

            p.Controls.Add(btnCall);
            p.Controls.Add(btnFwd);
            p.Controls.Add(lblNum);
            p.Controls.Add(lblSvc);
            return p;
        }
    }
}
