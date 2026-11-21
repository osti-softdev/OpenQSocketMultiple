using System;
using System.Drawing;
using System.Windows.Forms;
using Microsoft.Win32;

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
        private RadioButton rdoHistorySelf;
        private RadioButton rdoHistoryGroup;
        private RadioButton rdoHistoryAll;

        private GroupBox grpServiceMode;
        private RadioButton rdoServiceSingle;
        private RadioButton rdoServiceMultiple;

        private GroupBox grpLayoutStyle;
        private RadioButton rdoLayoutDefault;
        private RadioButton rdoLayoutGrid;
        private RadioButton rdoLayoutCollapsible;
        private RadioButton rdoLayoutDynamic;

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
            this.Size = new Size(320, 480);
            this.StartPosition = FormStartPosition.CenterParent;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.BackColor = Color.White;

            Label lblTitle = new Label() { Text = "⚙ Settings", Font = new Font("Segoe UI", 14, FontStyle.Bold), Location = new Point(20, 12), Size = new Size(115, 28), ForeColor = Color.FromArgb(40, 40, 40) };

            Label lblPcNet = new Label()
            {
                Text = string.Format("PC .NET: v{0}", GetInstalledDotNetVersion()),
                Font = new Font("Segoe UI", 7.5f, FontStyle.Bold),
                Location = new Point(135, 11),
                Size = new Size(145, 14),
                TextAlign = ContentAlignment.MiddleRight,
                ForeColor = Color.FromArgb(41, 128, 185)
            };

            Label lblReqNet = new Label()
            {
                Text = "Req: .NET 4.8 or higher",
                Font = new Font("Segoe UI", 7.25f, FontStyle.Regular),
                Location = new Point(135, 25),
                Size = new Size(145, 14),
                TextAlign = ContentAlignment.MiddleRight,
                ForeColor = Color.DimGray
            };

            Label lblUrl = new Label() { Text = "Connection URL:", Location = new Point(20, 48), Size = new Size(200, 18), Font = new Font("Segoe UI", 8.5f, FontStyle.Bold), ForeColor = Color.Gray };
            txtBaseUrl = new TextBox() { Location = new Point(20, 68), Size = new Size(260, 24), Font = new Font("Segoe UI", 9.5f), BorderStyle = BorderStyle.FixedSingle };
            txtBaseUrl.Text = ApiClient.BaseUrl;

            chkAutoFinish = new CheckBox() { Text = "Auto-Complete Ticket on Call Next", Location = new Point(20, 100), Size = new Size(260, 22), Font = new Font("Segoe UI", 8.5f) };
            chkAutoFinish.Checked = AppSettings.AutoFinishEnabled;

            chkShowReceived = new CheckBox() { Text = "Mix Received Tickets into Waiting List", Location = new Point(20, 124), Size = new Size(260, 22), Font = new Font("Segoe UI", 8.5f) };
            chkShowReceived.Checked = AppSettings.ShowReceivedInWaiting;

            chkShowTooltips = new CheckBox() { Text = "Show Button ToolTips on Hover", Location = new Point(20, 148), Size = new Size(260, 22), Font = new Font("Segoe UI", 8.5f) };
            chkShowTooltips.Checked = AppSettings.ShowTooltips;

            chkAlwaysOnTop = new CheckBox() { Text = "App Always on Top", Location = new Point(20, 172), Size = new Size(260, 22), Font = new Font("Segoe UI", 8.5f) };
            chkAlwaysOnTop.Checked = AppSettings.AlwaysOnTop;

            chkSoundAlerts = new CheckBox() { Text = "Enable Sound Alerts", Location = new Point(20, 196), Size = new Size(260, 22), Font = new Font("Segoe UI", 8.5f) };
            chkSoundAlerts.Checked = AppSettings.EnableSoundAlerts;

            // History scope group box
            grpHistory = new GroupBox()
            {
                Text = "Ticket History Scope",
                Location = new Point(20, 224),
                Size = new Size(260, 95),
                Font = new Font("Segoe UI", 8.5f, FontStyle.Bold),
                ForeColor = Color.FromArgb(60, 60, 60)
            };

            rdoHistorySelf = new RadioButton()
            {
                Text = "History Self (My Counter Only)",
                Location = new Point(12, 18),
                Size = new Size(240, 20),
                Font = new Font("Segoe UI", 8.5f, FontStyle.Regular),
                Cursor = Cursors.Hand
            };
            rdoHistoryGroup = new RadioButton()
            {
                Text = "History Group (Same Group Counters)",
                Location = new Point(12, 42),
                Size = new Size(240, 20),
                Font = new Font("Segoe UI", 8.5f, FontStyle.Regular),
                Cursor = Cursors.Hand
            };
            rdoHistoryAll = new RadioButton()
            {
                Text = "History All (All Tellers Today)",
                Location = new Point(12, 66),
                Size = new Size(240, 20),
                Font = new Font("Segoe UI", 8.5f, FontStyle.Regular),
                Cursor = Cursors.Hand
            };

            string scope = AppSettings.HistoryScope;
            if (scope == "All") rdoHistoryAll.Checked = true;
            else if (scope == "Group") rdoHistoryGroup.Checked = true;
            else rdoHistorySelf.Checked = true;

            grpHistory.Controls.Add(rdoHistorySelf);
            grpHistory.Controls.Add(rdoHistoryGroup);
            grpHistory.Controls.Add(rdoHistoryAll);

            // Only show auto-finish/received/history if user is logged in
            bool isLoggedIn = ApiClient.CurrentTeller != null;
            chkAutoFinish.Visible = isLoggedIn;
            chkShowReceived.Visible = isLoggedIn;
            grpHistory.Visible = isLoggedIn;

            int nextY = isLoggedIn ? 326 : 224;

            // Service Mode group box
            grpServiceMode = new GroupBox()
            {
                Text = "Service Mode",
                Location = new Point(20, nextY),
                Size = new Size(260, 68),
                Font = new Font("Segoe UI", 8.5f, FontStyle.Bold),
                ForeColor = Color.FromArgb(60, 60, 60)
            };

            rdoServiceSingle = new RadioButton()
            {
                Text = "Single Service (Compact 1-Row Height)",
                Location = new Point(12, 18),
                Size = new Size(240, 20),
                Font = new Font("Segoe UI", 8.5f, FontStyle.Regular),
                Cursor = Cursors.Hand
            };
            rdoServiceMultiple = new RadioButton()
            {
                Text = "Multiple Service (Standard Height)",
                Location = new Point(12, 42),
                Size = new Size(240, 20),
                Font = new Font("Segoe UI", 8.5f, FontStyle.Regular),
                Cursor = Cursors.Hand
            };

            if (AppSettings.ServiceMode == "Single") rdoServiceSingle.Checked = true;
            else rdoServiceMultiple.Checked = true;

            grpServiceMode.Controls.Add(rdoServiceSingle);
            grpServiceMode.Controls.Add(rdoServiceMultiple);
            nextY += 74;

            // Layout Style group box
            grpLayoutStyle = new GroupBox()
            {
                Text = "Window Layout Style",
                Location = new Point(20, nextY),
                Size = new Size(260, 116),
                Font = new Font("Segoe UI", 8.5f, FontStyle.Bold),
                ForeColor = Color.FromArgb(60, 60, 60)
            };

            rdoLayoutDefault = new RadioButton()
            {
                Text = "Default (Standard Row Layout)",
                Location = new Point(12, 18),
                Size = new Size(240, 20),
                Font = new Font("Segoe UI", 8.5f, FontStyle.Regular),
                Cursor = Cursors.Hand
            };
            rdoLayoutGrid = new RadioButton()
            {
                Text = "Compact Grid (2x2 Tabs & 3x2 Buttons)",
                Location = new Point(12, 42),
                Size = new Size(240, 20),
                Font = new Font("Segoe UI", 8.5f, FontStyle.Regular),
                Cursor = Cursors.Hand
            };
            rdoLayoutCollapsible = new RadioButton()
            {
                Text = "Collapsible (Grid + Show/Hide Queue)",
                Location = new Point(12, 66),
                Size = new Size(240, 20),
                Font = new Font("Segoe UI", 8.5f, FontStyle.Regular),
                Cursor = Cursors.Hand
            };
            rdoLayoutDynamic = new RadioButton()
            {
                Text = "Dynamic (Resizable & Auto-Arrange)",
                Location = new Point(12, 90),
                Size = new Size(240, 20),
                Font = new Font("Segoe UI", 8.5f, FontStyle.Regular),
                Cursor = Cursors.Hand
            };

            string layoutStyle = AppSettings.LayoutStyle;
            if (layoutStyle == "Grid") rdoLayoutGrid.Checked = true;
            else if (layoutStyle == "Collapsible") rdoLayoutCollapsible.Checked = true;
            else if (layoutStyle == "Dynamic") rdoLayoutDynamic.Checked = true;
            else rdoLayoutDefault.Checked = true;

            grpLayoutStyle.Controls.Add(rdoLayoutDefault);
            grpLayoutStyle.Controls.Add(rdoLayoutGrid);
            grpLayoutStyle.Controls.Add(rdoLayoutCollapsible);
            grpLayoutStyle.Controls.Add(rdoLayoutDynamic);
            nextY += 124;

            btnLogout = new Button() { 
                Text = "🚪 Logout", 
                Location = new Point(20, nextY), 
                Size = new Size(260, 32), 
                BackColor = Color.Crimson, 
                ForeColor = Color.White,
                Font = new Font("Segoe UI", 9, FontStyle.Bold),
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand,
                Visible = isLoggedIn
            };
            btnLogout.FlatAppearance.BorderSize = 0;
            btnLogout.Click += (s, e) => {
                if (MessageBox.Show("Logout?", "Confirm", MessageBoxButtons.YesNo, MessageBoxIcon.Question) == DialogResult.Yes)
                {
                    ApiClient.Post("/api/logout", new { });
                    Application.Restart();
                }
            };
            if (isLoggedIn) nextY += 40;

            btnSave = new Button() { 
                Text = "✅ Save Changes", 
                Location = new Point(20, nextY), 
                Size = new Size(125, 34), 
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
                Location = new Point(155, nextY), 
                Size = new Size(125, 34), 
                BackColor = Color.WhiteSmoke, 
                ForeColor = Color.DimGray,
                Font = new Font("Segoe UI", 9, FontStyle.Bold),
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            btnCancel.FlatAppearance.BorderSize = 0;
            btnCancel.Click += (s, e) => { this.DialogResult = DialogResult.Cancel; this.Close(); };

            this.ClientSize = new Size(300, nextY + 46);

            this.Controls.Add(lblTitle);
            this.Controls.Add(lblPcNet);
            this.Controls.Add(lblReqNet);
            this.Controls.Add(lblUrl);
            this.Controls.Add(txtBaseUrl);
            this.Controls.Add(chkAutoFinish);
            this.Controls.Add(chkShowReceived);
            this.Controls.Add(chkShowTooltips);
            this.Controls.Add(chkAlwaysOnTop);
            this.Controls.Add(chkSoundAlerts);
            this.Controls.Add(grpHistory);
            this.Controls.Add(grpServiceMode);
            this.Controls.Add(grpLayoutStyle);
            this.Controls.Add(btnLogout);
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

            if (rdoHistoryAll.Checked) AppSettings.HistoryScope = "All";
            else if (rdoHistoryGroup.Checked) AppSettings.HistoryScope = "Group";
            else AppSettings.HistoryScope = "Self";

            AppSettings.ServiceMode = rdoServiceSingle.Checked ? "Single" : "Multiple";

            if (rdoLayoutGrid.Checked) AppSettings.LayoutStyle = "Grid";
            else if (rdoLayoutCollapsible.Checked) AppSettings.LayoutStyle = "Collapsible";
            else if (rdoLayoutDynamic.Checked) AppSettings.LayoutStyle = "Dynamic";
            else AppSettings.LayoutStyle = "Default";

            // Reset cached dynamic dimensions so switching service/layout modes snaps to the new mode's preset size
            AppSettings.DynamicWidth = 0;
            AppSettings.DynamicHeight = 0;

            AppSettings.Save();

            this.DialogResult = DialogResult.OK;
            this.Close();
        }

        private static string GetInstalledDotNetVersion()
        {
            try
            {
                using (RegistryKey ndpKey = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\NET Framework Setup\NDP\v4\Full"))
                {
                    if (ndpKey != null)
                    {
                        object releaseObj = ndpKey.GetValue("Release");
                        if (releaseObj != null)
                        {
                            int release = Convert.ToInt32(releaseObj);
                            if (release >= 533320) return "4.8.1";
                            if (release >= 528040) return "4.8";
                            if (release >= 461808) return "4.7.2";
                            if (release >= 461308) return "4.7.1";
                            if (release >= 460798) return "4.7";
                            if (release >= 394802) return "4.6.2";
                            if (release >= 394254) return "4.6.1";
                            if (release >= 393295) return "4.6";
                            if (release >= 379893) return "4.5.2";
                            if (release >= 378675) return "4.5.1";
                            if (release >= 378389) return "4.5";
                        }
                        object verObj = ndpKey.GetValue("Version");
                        if (verObj != null && verObj.ToString().StartsWith("4.0")) return "4.0";
                    }
                }
            }
            catch { }
            return string.Format("{0}.{1}", Environment.Version.Major, Environment.Version.Minor);
        }
    }
}
