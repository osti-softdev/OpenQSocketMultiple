using System;
using System.Drawing;
using System.Windows.Forms;
using System.Collections.Generic;

namespace CallerApp
{
    public class LoginForm : Form
    {
        private TextBox txtUsername;
        private TextBox txtPassword;
        private Button btnLogin;
        private Label lblError;
        private Label lblTitle;
        private Label lblStatus;
        private Button btnSettings;

        public LoginForm()
        {
            InitializeComponent();
        }

        private void InitializeComponent()
        {
            this.Text = "Teller Login";
            this.Size = new Size(350, 260);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedSingle;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.BackColor = Color.White;

            Label lblTitle = new Label() { 
                Text = "🔑 OpenQ Teller Login", 
                Font = new Font("Segoe UI", 16, FontStyle.Bold), 
                Location = new Point(20, 20), 
                Size = new Size(300, 35), 
                TextAlign = ContentAlignment.MiddleCenter,
                ForeColor = Color.FromArgb(40, 40, 40)
            };
            
            Label lblUser = new Label() { Text = "Username", Location = new Point(50, 70), Size = new Size(80, 20), Font = new Font("Segoe UI", 9, FontStyle.Bold), ForeColor = Color.Gray };
            txtUsername = new TextBox() { Location = new Point(50, 90), Size = new Size(240, 25), Font = new Font("Segoe UI", 11), BorderStyle = BorderStyle.FixedSingle };

            Label lblPass = new Label() { Text = "Password", Location = new Point(50, 125), Size = new Size(80, 20), Font = new Font("Segoe UI", 9, FontStyle.Bold), ForeColor = Color.Gray };
            txtPassword = new TextBox() { Location = new Point(50, 145), Size = new Size(240, 25), Font = new Font("Segoe UI", 11), PasswordChar = '•', BorderStyle = BorderStyle.FixedSingle };

            btnLogin = new Button() { 
                Text = "🔒 Login", 
                Location = new Point(50, 185), 
                Size = new Size(240, 35), 
                BackColor = Color.FromArgb(0, 122, 204),
                ForeColor = Color.White,
                Font = new Font("Segoe UI", 11, FontStyle.Bold),
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            btnLogin.FlatAppearance.BorderSize = 0;
            btnLogin.Click += BtnLogin_Click;

            btnSettings = new Button();
            btnSettings.Text = "⚙ Settings";
            btnSettings.Location = new Point(180, 5);
            btnSettings.Size = new Size(100, 25);
            btnSettings.BackColor = Color.WhiteSmoke;
            btnSettings.ForeColor = Color.DimGray;
            btnSettings.Font = new Font("Segoe UI", 8, FontStyle.Bold);
            btnSettings.FlatStyle = FlatStyle.Flat;
            btnSettings.FlatAppearance.BorderSize = 0;
            btnSettings.Cursor = Cursors.Hand;
            btnSettings.Click += (s, e) => {
                using (SettingsModal sm = new SettingsModal()) {
                    sm.ShowDialog();
                }
            };

            lblError = new Label() { ForeColor = Color.Crimson, Location = new Point(20, 225), Size = new Size(300, 20), TextAlign = ContentAlignment.MiddleCenter, Font = new Font("Segoe UI", 9) };

            this.Controls.Add(lblTitle);
            this.Controls.Add(lblUser);
            this.Controls.Add(txtUsername);
            this.Controls.Add(lblPass);
            this.Controls.Add(txtPassword);
            this.Controls.Add(btnLogin);
            this.Controls.Add(btnSettings);
            this.Controls.Add(lblError);

            this.AcceptButton = btnLogin;
        }

        private void BtnLogin_Click(object sender, EventArgs e)
        {
            lblError.Text = "";
            btnLogin.Enabled = false;
            btnLogin.Text = "⏳ Logging in...";

            var data = new { username = txtUsername.Text, password = txtPassword.Text };
            var response = ApiClient.Post("/api/login", data);

            if (response.ContainsKey("success") && (bool)response["success"])
            {
                ApiClient.CurrentTeller = response["teller"] as Dictionary<string, object>;
                this.DialogResult = DialogResult.OK;
                this.Close();
            }
            else
            {
                lblError.Text = response.ContainsKey("message") ? response["message"].ToString() : "Login failed.";
                btnLogin.Enabled = true;
                btnLogin.Text = "🔒 Login";
            }
        }
    }
}
