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
        
        private Button btnHistory;
        private Button btnSave;
        private Button btnCancel;

        public bool ShowHistoryClicked { get; private set; }

        public SettingsModal()
        {
            InitializeComponent();
        }

        private void InitializeComponent()
        {
            this.Text = "Settings";
            this.Size = new Size(320, 385);
            this.StartPosition = FormStartPosition.CenterParent;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.BackColor = Color.White;

            Label lblTitle = new Label() { Text = "⚙ Settings", Font = new Font("Segoe UI", 14, FontStyle.Bold), Location = new Point(20, 15), Size = new Size(200, 30), ForeColor = Color.FromArgb(40, 40, 40) };

            Label lblUrl = new Label() { Text = "Connection URL:", Location = new Point(20, 55), Size = new Size(200, 20), Font = new Font("Segoe UI", 9, FontStyle.Bold), ForeColor = Color.Gray };
            txtBaseUrl = new TextBox() { Location = new Point(20, 75), Size = new Size(260, 25), Font = new Font("Segoe UI", 10), BorderStyle = BorderStyle.FixedSingle };
            txtBaseUrl.Text = ApiClient.BaseUrl;

            chkAutoFinish = new CheckBox() { Text = "Auto-Complete Ticket on Call Next", Location = new Point(20, 115), Size = new Size(260, 25), Font = new Font("Segoe UI", 9) };
            chkAutoFinish.Checked = AppSettings.AutoFinishEnabled;

            chkShowReceived = new CheckBox() { Text = "Mix Received Tickets into Waiting List", Location = new Point(20, 145), Size = new Size(260, 25), Font = new Font("Segoe UI", 9) };
            chkShowReceived.Checked = AppSettings.ShowReceivedInWaiting;

            chkShowTooltips = new CheckBox() { Text = "Show Button ToolTips on Hover", Location = new Point(20, 175), Size = new Size(260, 25), Font = new Font("Segoe UI", 9) };
            chkShowTooltips.Checked = AppSettings.ShowTooltips;

            // Only show auto-finish/received/history if user is logged in
            bool isLoggedIn = ApiClient.CurrentTeller != null;
            chkAutoFinish.Visible = isLoggedIn;
            chkShowReceived.Visible = isLoggedIn;

            btnHistory = new Button() { 
                Text = "📜 View Ticket History", 
                Location = new Point(20, 215), 
                Size = new Size(260, 35), 
                BackColor = Color.FromArgb(52, 152, 219), 
                ForeColor = Color.White,
                Font = new Font("Segoe UI", 9, FontStyle.Bold),
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand,
                Visible = isLoggedIn
            };
            btnHistory.FlatAppearance.BorderSize = 0;
            btnHistory.Click += (s, e) => {
                ShowHistoryClicked = true;
                this.DialogResult = DialogResult.OK;
                this.Close();
            };

            btnSave = new Button() { 
                Text = "✅ Save Changes", 
                Location = new Point(20, 280), 
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
                Location = new Point(155, 280), 
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
            this.Controls.Add(btnHistory);
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
            AppSettings.Save();

            ShowHistoryClicked = false;
            this.DialogResult = DialogResult.OK;
            this.Close();
        }
    }
}
