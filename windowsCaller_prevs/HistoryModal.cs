using System;
using System.Drawing;
using System.Windows.Forms;
using System.Collections.Generic;

namespace CallerApp
{
    public class HistoryModal : Form
    {
        private FlowLayoutPanel pnlList;
        private Label lblTitle;
        private Action<string> onCall;
        private Action<string> onForward;
        private ToolTip historyToolTip;
        
        public HistoryModal(object[] historyTickets, Action<string> callCallback, Action<string> forwardCallback)
        {
            this.onCall = callCallback;
            this.onForward = forwardCallback;
            this.historyToolTip = new ToolTip();
            InitializeComponent();
            UpdateHeaderTitle();
            PopulateHistory(historyTickets);
        }

        public static Dictionary<string, string> GetHistoryQueryParams()
        {
            var histParams = new Dictionary<string, string>();
            string scope = string.IsNullOrEmpty(AppSettings.HistoryScope) ? "self" : AppSettings.HistoryScope;
            histParams["scope"] = scope;
            histParams["limit"] = "100";

            if (ApiClient.CurrentTeller != null)
            {
                if (scope == "self")
                {
                    if (ApiClient.CurrentTeller.ContainsKey("counter_number") && ApiClient.CurrentTeller["counter_number"] != null)
                    {
                        histParams["counterNumber"] = ApiClient.CurrentTeller["counter_number"].ToString();
                    }
                    if (ApiClient.CurrentTeller.ContainsKey("username") && ApiClient.CurrentTeller["username"] != null)
                    {
                        histParams["cname"] = ApiClient.CurrentTeller["username"].ToString();
                    }
                }
                else if (scope == "group")
                {
                    if (ApiClient.CurrentTeller.ContainsKey("counter_number") && ApiClient.CurrentTeller["counter_number"] != null)
                    {
                        histParams["counterNumber"] = ApiClient.CurrentTeller["counter_number"].ToString();
                    }
                    if (ApiClient.CurrentTeller.ContainsKey("username") && ApiClient.CurrentTeller["username"] != null)
                    {
                        histParams["cname"] = ApiClient.CurrentTeller["username"].ToString();
                    }
                    if (ApiClient.CurrentTeller.ContainsKey("group_name") && ApiClient.CurrentTeller["group_name"] != null)
                    {
                        histParams["group_name"] = ApiClient.CurrentTeller["group_name"].ToString();
                    }
                    if (ApiClient.CurrentTeller.ContainsKey("group_id") && ApiClient.CurrentTeller["group_id"] != null)
                    {
                        histParams["group_id"] = ApiClient.CurrentTeller["group_id"].ToString();
                    }
                }
                // When scope == "all", do NOT attach counterNumber or cname.
                // This ensures all tellers' history is returned across both active and restarted backends!
            }
            return histParams;
        }

        public static object[] FetchHistoryTickets()
        {
            return ApiClient.GetArray("/api/tickets/history", GetHistoryQueryParams());
        }

        private void UpdateHeaderTitle()
        {
            string scopeText = "Self";
            if (AppSettings.HistoryScope == "group") scopeText = "Group";
            else if (AppSettings.HistoryScope == "all") scopeText = "All";

            this.Text = string.Format("Ticket History ({0})", scopeText);
            if (lblTitle != null)
            {
                lblTitle.Text = string.Format("📜 History ({0})", scopeText);
            }
        }

        private void InitializeComponent()
        {
            this.Text = "Ticket History";
            this.TopMost = AppSettings.AlwaysOnTop;
            this.Size = new Size(360, 450); // Default, updated in PopulateHistory
            this.StartPosition = FormStartPosition.CenterParent;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.BackColor = Color.White;

            lblTitle = new Label() { Text = "📜 Ticket History", Font = new Font("Segoe UI", 13, FontStyle.Bold), Location = new Point(10, 10), Size = new Size(230, 30), ForeColor = Color.FromArgb(40, 40, 40) };
            
            Button btnRefresh = new Button() { 
                Text = "🔄 Refresh", 
                Location = new Point(255, 12), 
                Size = new Size(75, 25), 
                BackColor = Color.WhiteSmoke, 
                ForeColor = Color.DimGray,
                Font = new Font("Segoe UI", 8, FontStyle.Bold),
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            btnRefresh.FlatAppearance.BorderSize = 0;
            btnRefresh.Click += (s, e) => {
                object[] newTickets = FetchHistoryTickets();
                UpdateHeaderTitle();
                PopulateHistory(newTickets);
            };

            pnlList = new FlowLayoutPanel() { Location = new Point(10, 50), Size = new Size(324, 350), AutoScroll = true, WrapContents = false, FlowDirection = FlowDirection.TopDown, BorderStyle = BorderStyle.FixedSingle };

            this.Controls.Add(lblTitle);
            this.Controls.Add(btnRefresh);
            this.Controls.Add(pnlList);
        }

        private void PopulateHistory(object[] tickets)
        {
            pnlList.Controls.Clear();

            List<Dictionary<string, object>> validTickets = new List<Dictionary<string, object>>();
            if (tickets != null)
            {
                foreach (object item in tickets)
                {
                    if (item is Dictionary<string, object> t)
                    {
                        string status = t.ContainsKey("status") && t["status"] != null ? t["status"].ToString() : "";
                        // Strictly exclude pending tickets from history
                        if (string.Equals(status, "pending", StringComparison.OrdinalIgnoreCase))
                        {
                            continue;
                        }
                        validTickets.Add(t);
                    }
                }
            }

            if (validTickets.Count == 0)
            {
                pnlList.Controls.Add(new Label() { Text = "No history available.", AutoSize = true, Font = new Font("Segoe UI", 10), ForeColor = Color.Gray, Margin = new Padding(10) });
                this.Size = new Size(360, 150);
                pnlList.Size = new Size(324, 50);
                return;
            }

            foreach (Dictionary<string, object> t in validTickets)
            {
                Panel pItem = CreateQueueItem(t);
                pnlList.Controls.Add(pItem);
            }
            
            int displayCount = Math.Min(validTickets.Count, 5);
            int listHeight = displayCount * 85 + 5;
            pnlList.Size = new Size(324, listHeight);
            this.Size = new Size(360, listHeight + 100);
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

        private static string GetCounterInfo(Dictionary<string, object> t, string status)
        {
            string counterNum = "";
            string counterGroup = "";
            string counterUser = "";

            if (t.ContainsKey("counter_num") && t["counter_num"] != null && !string.IsNullOrEmpty(t["counter_num"].ToString()))
            {
                counterNum = t["counter_num"].ToString().Trim();
            }

            if (t.ContainsKey("counter_group") && t["counter_group"] != null && !string.IsNullOrEmpty(t["counter_group"].ToString()))
            {
                counterGroup = t["counter_group"].ToString().Trim();
            }

            if (t.ContainsKey("counter_user") && t["counter_user"] != null && !string.IsNullOrEmpty(t["counter_user"].ToString()))
            {
                counterUser = t["counter_user"].ToString().Trim();
            }

            // Fallback: parse last teller event from history if counterNum is empty
            if (string.IsNullOrEmpty(counterNum) && t.ContainsKey("history") && t["history"] != null)
            {
                string hist = t["history"].ToString();
                string[] entries = hist.Split(new char[] { ';' }, StringSplitOptions.RemoveEmptyEntries);
                for (int i = entries.Length - 1; i >= 0; i--)
                {
                    string entry = entries[i].Replace("[", "").Replace("]", "").Trim();
                    string[] parts = entry.Split('-');
                    if (parts.Length >= 4)
                    {
                        string actor = parts[1].Trim();
                        string cNum = parts[2].Trim();
                        if (!string.IsNullOrEmpty(actor) && !actor.Equals("Kiosk", StringComparison.OrdinalIgnoreCase))
                        {
                            counterNum = cNum;
                            if (string.IsNullOrEmpty(counterUser)) counterUser = actor;
                            break;
                        }
                    }
                }
            }

            // Forwarded / Received
            if (status == "RECEIVED")
            {
                string fromCNum = t.ContainsKey("from_counter_num") && t["from_counter_num"] != null ? t["from_counter_num"].ToString().Trim() : "";
                string toCNum = t.ContainsKey("to_counter_num") && t["to_counter_num"] != null ? t["to_counter_num"].ToString().Trim() : "";
                string toGroup = t.ContainsKey("to_group_name") && t["to_group_name"] != null ? t["to_group_name"].ToString().Trim() : "";

                string lastServed = !string.IsNullOrEmpty(fromCNum) ? ("C" + fromCNum) : (!string.IsNullOrEmpty(counterNum) ? ("C" + counterNum) : "");
                string dest = !string.IsNullOrEmpty(toGroup) ? ("Grp: " + toGroup) : (!string.IsNullOrEmpty(toCNum) ? ("C" + toCNum) : "");

                if (!string.IsNullOrEmpty(lastServed) && !string.IsNullOrEmpty(dest))
                {
                    return string.Format("Last: {0} ➜ {1}", lastServed, dest);
                }
                else if (!string.IsNullOrEmpty(lastServed))
                {
                    return "Last: " + lastServed;
                }
                else if (!string.IsNullOrEmpty(dest))
                {
                    return "➜ " + dest;
                }
            }

            // Calling / Called / Serving
            if (status == "CALLING" || status == "CALLED" || status == "SERVING")
            {
                if (!string.IsNullOrEmpty(counterNum) && !string.IsNullOrEmpty(counterGroup))
                {
                    return string.Format("Being Served: C{0} • {1}", counterNum, counterGroup);
                }
                else if (!string.IsNullOrEmpty(counterNum))
                {
                    return string.Format("Being Served: C{0}", counterNum);
                }
                else if (!string.IsNullOrEmpty(counterGroup))
                {
                    return string.Format("Being Served: {0}", counterGroup);
                }
                else if (!string.IsNullOrEmpty(counterUser))
                {
                    return string.Format("Being Served: {0}", counterUser);
                }
            }
            else
            {
                // Last served (Finished, Held, Voided, etc.)
                if (!string.IsNullOrEmpty(counterNum) && !string.IsNullOrEmpty(counterGroup))
                {
                    return string.Format("Last: C{0} • {1}", counterNum, counterGroup);
                }
                else if (!string.IsNullOrEmpty(counterNum))
                {
                    return string.Format("Last: C{0}", counterNum);
                }
                else if (!string.IsNullOrEmpty(counterGroup))
                {
                    return string.Format("Last: {0}", counterGroup);
                }
                else if (!string.IsNullOrEmpty(counterUser))
                {
                    return string.Format("Last: {0}", counterUser);
                }
            }

            return "";
        }

        private Panel CreateQueueItem(Dictionary<string, object> t)
        {
            string tNum = t.ContainsKey("ticketservice") ? string.Format("{0}{1}", t["ticketservice"], t["ticketnum"]) : t["ticketnum"].ToString();
            string sName = t.ContainsKey("sname") ? t["sname"].ToString().Replace("_", " ") : "";
            string tStatus = t.ContainsKey("status") ? t["status"].ToString().ToUpper() : "";

            string counterInfo = GetCounterInfo(t, tStatus);

            string tTime = "";
            if (t.ContainsKey("end_time") && t["end_time"] != null && t["end_time"].ToString().Length > 0 &&
                (tStatus == "FINISHED" || tStatus == "COMPLETED" || tStatus == "VOIDED" || tStatus == "RECEIVED"))
            {
                tTime = t["end_time"].ToString();
            }
            else if (t.ContainsKey("start_time") && t["start_time"] != null && t["start_time"].ToString().Length > 0)
            {
                tTime = t["start_time"].ToString();
            }
            else if (t.ContainsKey("time") && t["time"] != null && t["time"].ToString().Length > 0)
            {
                tTime = t["time"].ToString();
            }
            else if (t.ContainsKey("created_at") && t["created_at"] != null && t["created_at"].ToString().Length > 0)
            {
                DateTime dt;
                if (DateTime.TryParse(t["created_at"].ToString(), out dt)) tTime = dt.ToString("HH:mm:ss");
                else tTime = t["created_at"].ToString();
            }

            string subService = t.ContainsKey("sub_services") && t["sub_services"] != null 
                                ? t["sub_services"].ToString().Trim() 
                                : "";

            int panelH = !string.IsNullOrEmpty(subService) ? 82 : 72;
            Panel p = new Panel() { Width = 300, Height = panelH, BorderStyle = BorderStyle.FixedSingle, Margin = new Padding(2), BackColor = Color.WhiteSmoke };

            Label lblNum = new Label() { Text = tNum, Font = new Font("Segoe UI", 10, FontStyle.Bold), Location = new Point(5, 3), AutoSize = true, ForeColor = Color.FromArgb(40, 40, 40) };

            bool isBeingServed = (tStatus == "CALLING" || tStatus == "CALLED" || tStatus == "SERVING");
            Color counterColor = isBeingServed ? Color.FromArgb(39, 174, 96) : Color.FromArgb(80, 80, 80);

            Label lblCounter = new Label() {
                Text = counterInfo,
                Location = new Point(lblNum.PreferredWidth + 10, 5),
                AutoSize = true,
                MaximumSize = new Size(115, 0),
                Font = new Font("Segoe UI", 7.5f, FontStyle.Bold),
                ForeColor = counterColor
            };
            if (!string.IsNullOrEmpty(counterInfo))
            {
                historyToolTip.SetToolTip(lblCounter, counterInfo);
            }

            string details = sName;
            if (!string.IsNullOrEmpty(tStatus)) details += " | " + tStatus;
            if (!string.IsNullOrEmpty(tTime)) details += " ⌚ " + tTime;
            if (!string.IsNullOrEmpty(subService)) details += "\n" + subService;

            Label lblSvc = new Label() { Text = details, Location = new Point(5, 23), AutoSize = true, MaximumSize = new Size(170, 0), Font = new Font("Segoe UI", 7.5f), ForeColor = Color.DimGray };
            historyToolTip.SetToolTip(lblSvc, details);

            string tId = t["id"].ToString();

            int btnY = !string.IsNullOrEmpty(subService) ? 26 : 21;
            Button btnCall = CreateModernButton("📢 Call", 180, btnY, 52, 28, Color.FromArgb(52, 152, 219), Color.White);
            btnCall.Font = new Font("Segoe UI", 7, FontStyle.Bold);
            btnCall.Click += (s, e) => {
                onCall(tId);
                this.DialogResult = DialogResult.OK;
                this.Close();
            };
            
            Button btnFwd = CreateModernButton("➡️ Fwd", 238, btnY, 52, 28, Color.FromArgb(149, 165, 166), Color.White);
            btnFwd.Font = new Font("Segoe UI", 7, FontStyle.Bold);
            btnFwd.Click += (s, e) => {
                onForward(tId);
                this.DialogResult = DialogResult.OK;
                this.Close();
            };

            p.Controls.Add(lblNum);
            p.Controls.Add(lblCounter);
            p.Controls.Add(btnCall);
            p.Controls.Add(btnFwd);
            p.Controls.Add(lblSvc);
            return p;
        }
    }
}
