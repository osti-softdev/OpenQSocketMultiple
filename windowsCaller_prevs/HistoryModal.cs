using System;
using System.Drawing;
using System.Windows.Forms;
using System.Collections.Generic;

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

        private void InitializeComponent()
        {
            this.Text = "Ticket History";
            this.Size = new Size(320, 450);
            this.StartPosition = FormStartPosition.CenterParent;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.BackColor = Color.White;

            Label lblTitle = new Label() { Text = "📜 Ticket History", Font = new Font("Segoe UI", 14, FontStyle.Bold), Location = new Point(10, 10), Size = new Size(200, 30), ForeColor = Color.FromArgb(40, 40, 40) };
            
            pnlList = new FlowLayoutPanel() { Location = new Point(10, 50), Size = new Size(285, 350), AutoScroll = true, WrapContents = false, FlowDirection = FlowDirection.TopDown, BorderStyle = BorderStyle.FixedSingle };

            this.Controls.Add(lblTitle);
            this.Controls.Add(pnlList);
        }

        private void PopulateHistory(object[] tickets)
        {
            pnlList.Controls.Clear();
            if (tickets == null || tickets.Length == 0)
            {
                pnlList.Controls.Add(new Label() { Text = "No history available.", AutoSize = true, Font = new Font("Segoe UI", 10), ForeColor = Color.Gray, Margin = new Padding(10) });
                return;
            }

            foreach (Dictionary<string, object> t in tickets)
            {
                Panel pItem = CreateQueueItem(t);
                pnlList.Controls.Add(pItem);
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
            Panel p = new Panel() { Width = 260, Height = 45, BorderStyle = BorderStyle.FixedSingle, Margin = new Padding(2), BackColor = Color.WhiteSmoke };
            
            string tNum = t.ContainsKey("ticketservice") ? string.Format("{0}{1}", t["ticketservice"], t["ticketnum"]) : t["ticketnum"].ToString();
            string sName = t.ContainsKey("sname") ? t["sname"].ToString().Replace("_", " ") : "";
            if (string.IsNullOrEmpty(sName) && t.ContainsKey("status")) sName = t["status"].ToString();
            
            Label lblNum = new Label() { Text = tNum, Font = new Font("Segoe UI", 10, FontStyle.Bold), Location = new Point(5, 5), AutoSize = true, ForeColor = Color.FromArgb(40,40,40) };
            Label lblSvc = new Label() { Text = sName, Location = new Point(5, 23), AutoSize = true, Font = new Font("Segoe UI", 8), ForeColor = Color.DimGray };

            string tId = t["id"].ToString();

            Button btnCall = CreateModernButton("📢 Call", 145, 8, 52, 28, Color.FromArgb(52, 152, 219), Color.White);
            btnCall.Font = new Font("Segoe UI", 7, FontStyle.Bold);
            btnCall.Click += (s, e) => {
                onCall(tId);
                this.DialogResult = DialogResult.OK;
                this.Close();
            };
            
            Button btnFwd = CreateModernButton("➡️ Fwd", 200, 8, 52, 28, Color.FromArgb(149, 165, 166), Color.White);
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
