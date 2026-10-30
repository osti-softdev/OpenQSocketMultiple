using System;
using System.Drawing;
using System.Windows.Forms;

namespace CallerApp
{
    public class SettingsModal : Form
    {
        private TextBox txtBaseUrl;
        private CheckBox chkAutoFinish;
        private CheckBox chkShowReceived;
        private CheckBox chkShowTooltips;
        private CheckBox chkAlwaysOnTop;
        private CheckBox chkSoundAlerts;
        
        private GroupBox grpHistory;
        private RadioButton rbHistorySelf;
        private RadioButton rbHistoryGroup;
        private RadioButton rbHistoryAll;

        private Button btnLogout;
        private Button btnSave;
        private Button btnCancel;
        public SettingsModal()
        {
            InitializeComponent();
        }

        private void InitializeComponent()
        {
            this.Text = "Settings";
            this.TopMost = AppSettings.AlwaysOnTop;
            this.StartPosition = FormStartPosition.CenterParent;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.BackColor = Color.White;

            bool isLoggedIn = ApiClient.CurrentTeller != null;

            Label lblTitle = new Label() { Text = "⚙ Settings", Font = new Font("Segoe UI", 14, FontStyle.Bold), Location = new Point(20, 15), Size = new Size(200, 30), ForeColor = Color.FromArgb(40, 40, 40) };

            Label lblUrl = new Label() { Text = "Connection URL:", Location = new Point(20, 52), Size = new Size(200, 18), Font = new Font("Segoe UI", 9, FontStyle.Bold), ForeColor = Color.Gray };
            txtBaseUrl = new TextBox() { Location = new Point(20, 72), Size = new Size(260, 25), Font = new Font("Segoe UI", 10), BorderStyle = BorderStyle.FixedSingle };
            txtBaseUrl.Text = ApiClient.BaseUrl;

            chkAutoFinish = new CheckBox() { Text = "Auto-Complete Ticket on Call Next", Location = new Point(20, 105), Size = new Size(260, 22), Font = new Font("Segoe UI", 9) };
            chkAutoFinish.Checked = AppSettings.AutoFinishEnabled;

            chkShowReceived = new CheckBox() { Text = "Mix Received Tickets into Waiting List", Location = new Point(20, 130), Size = new Size(260, 22), Font = new Font("Segoe UI", 9) };
            chkShowReceived.Checked = AppSettings.ShowReceivedInWaiting;

            chkShowTooltips = new CheckBox() { Text = "Show Button ToolTips on Hover", Location = new Point(20, 155), Size = new Size(260, 22), Font = new Font("Segoe UI", 9) };
            chkShowTooltips.Checked = AppSettings.ShowTooltips;

            chkAlwaysOnTop = new CheckBox() { Text = "App Always on Top", Location = new Point(20, 180), Size = new Size(260, 22), Font = new Font("Segoe UI", 9) };
            chkAlwaysOnTop.Checked = AppSettings.AlwaysOnTop;

            chkSoundAlerts = new CheckBox() { Text = "Enable Sound Alerts", Location = new Point(20, 205), Size = new Size(260, 22), Font = new Font("Segoe UI", 9) };
            chkSoundAlerts.Checked = AppSettings.EnableSoundAlerts;

            // Only show auto-finish/received/history if user is logged in
            chkAutoFinish.Visible = isLoggedIn;
            chkShowReceived.Visible = isLoggedIn;

            // History scope options
            grpHistory = new GroupBox()
            {
                Text = "Ticket History Scope",
                Location = new Point(20, 235),
                Size = new Size(260, 100),
                Font = new Font("Segoe UI", 9, FontStyle.Bold),
                ForeColor = Color.FromArgb(50, 50, 50),
                Visible = isLoggedIn
            };

            rbHistorySelf = new RadioButton()
            {
                Text = "Self only history",
                Location = new Point(15, 20),
                Size = new Size(230, 22),
                Font = new Font("Segoe UI", 9, FontStyle.Regular),
                ForeColor = Color.FromArgb(40, 40, 40),
                Cursor = Cursors.Hand
            };

            rbHistoryGroup = new RadioButton()
            {
                Text = "History as Group",
                Location = new Point(15, 45),
                Size = new Size(230, 22),
                Font = new Font("Segoe UI", 9, FontStyle.Regular),
                ForeColor = Color.FromArgb(40, 40, 40),
                Cursor = Cursors.Hand
            };

            rbHistoryAll = new RadioButton()
            {
                Text = "History of all",
                Location = new Point(15, 70),
                Size = new Size(230, 22),
                Font = new Font("Segoe UI", 9, FontStyle.Regular),
                ForeColor = Color.FromArgb(40, 40, 40),
                Cursor = Cursors.Hand
            };

            grpHistory.Controls.Add(rbHistorySelf);
            grpHistory.Controls.Add(rbHistoryGroup);
            grpHistory.Controls.Add(rbHistoryAll);

            string currentScope = AppSettings.HistoryScope;
            if (currentScope == "group") rbHistoryGroup.Checked = true;
            else if (currentScope == "all") rbHistoryAll.Checked = true;
            else rbHistorySelf.Checked = true;

            int actionY;
            if (isLoggedIn)
            {
                btnLogout = new Button() { 
                    Text = "🚪 Logout", 
                    Location = new Point(20, 345), 
                    Size = new Size(260, 35), 
                    BackColor = Color.Crimson, 
                    ForeColor = Color.White,
                    Font = new Font("Segoe UI", 9, FontStyle.Bold),
                    FlatStyle = FlatStyle.Flat,
                    Cursor = Cursors.Hand,
                    Visible = true
                };
                btnLogout.FlatAppearance.BorderSize = 0;
                btnLogout.Click += (s, e) => {
                    if (MessageBox.Show("Logout?", "Confirm", MessageBoxButtons.YesNo, MessageBoxIcon.Question) == DialogResult.Yes)
                    {
                        ApiClient.Post("/api/logout", new { });
                        Application.Restart();
                    }
                };
                this.Controls.Add(btnLogout);
                actionY = 390;
                this.ClientSize = new Size(300, 440);
            }
            else
            {
                // When not logged in, shift tooltips/alwaysOnTop/soundAlerts up
                chkShowTooltips.Location = new Point(20, 105);
                chkAlwaysOnTop.Location = new Point(20, 130);
                chkSoundAlerts.Location = new Point(20, 155);
                actionY = 195;
                this.ClientSize = new Size(300, 245);
            }

            btnSave = new Button() { 
                Text = "✅ Save Changes", 
                Location = new Point(20, actionY), 
                Size = new Size(125, 35), 
                BackColor = Color.FromArgb(46, 204, 113), 
                ForeColor = Color.White,
                Font = new Font("Segoe UI", 9, FontStyle.Bold),
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            btnSave.FlatAppearance.BorderSize = 0;
            btnSave.Click += BtnSave_Click;
            
            btnCancel = new Button() { 
                Text = "Cancel", 
                Location = new Point(155, actionY), 
                Size = new Size(125, 35), 
                BackColor = Color.WhiteSmoke, 
                ForeColor = Color.DimGray,
                Font = new Font("Segoe UI", 9, FontStyle.Bold),
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            btnCancel.FlatAppearance.BorderSize = 0;
            btnCancel.Click += (s, e) => { this.DialogResult = DialogResult.Cancel; this.Close(); };

            this.Controls.Add(lblTitle);
            this.Controls.Add(lblUrl);
            this.Controls.Add(txtBaseUrl);
            this.Controls.Add(chkAutoFinish);
            this.Controls.Add(chkShowReceived);
            this.Controls.Add(chkShowTooltips);
            this.Controls.Add(chkAlwaysOnTop);
            this.Controls.Add(chkSoundAlerts);
            this.Controls.Add(grpHistory);
            this.Controls.Add(btnSave);
            this.Controls.Add(btnCancel);
        }

        private void BtnSave_Click(object sender, EventArgs e)
        {
            if (string.IsNullOrEmpty(txtBaseUrl.Text))
            {
                MessageBox.Show("Connection URL cannot be empty.", "Warning", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }
            
            // Save Settings
            ApiClient.BaseUrl = txtBaseUrl.Text.Trim();
            AppSettings.AutoFinishEnabled = chkAutoFinish.Checked;
            AppSettings.ShowReceivedInWaiting = chkShowReceived.Checked;
            AppSettings.ShowTooltips = chkShowTooltips.Checked;
            AppSettings.AlwaysOnTop = chkAlwaysOnTop.Checked;
            AppSettings.EnableSoundAlerts = chkSoundAlerts.Checked;

            if (rbHistoryGroup.Checked) AppSettings.HistoryScope = "group";
            else if (rbHistoryAll.Checked) AppSettings.HistoryScope = "all";
            else AppSettings.HistoryScope = "self";

            AppSettings.Save();

            this.DialogResult = DialogResult.OK;
            this.Close();
        }
    }
}
